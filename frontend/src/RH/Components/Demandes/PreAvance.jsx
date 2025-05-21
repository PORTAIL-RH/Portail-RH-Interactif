import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { FiSearch,FiDownload , FiFilter, FiCalendar, FiCheck, FiClock, FiRefreshCw, FiFileText, FiEye, FiX } from "react-icons/fi";
import "./Demandes.css";
import DemandeDetailsModal from "./DemandeDetailsModal";
import { API_URL } from "../../../config";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const DemandesPreAvance = () => {
    const [previewFileId, setPreviewFileId] = useState(null);
    const [previewFileUrl, setPreviewFileUrl] = useState(null);
  // Load initial data from localStorage with proper structure
  const [demandes, setDemandes] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('demandes');
      return cached ? JSON.parse(cached).preAvance || [] : [];
    }
    return [];
  });

  const [allDemandes, setAllDemandes] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('demandes');
      return cached ? JSON.parse(cached) : {
        conge: [],
        formation: [],
        document: [],
        preAvance: [],
        autorisation: []
      };
    }
    return {
      conge: [],
      formation: [],
      document: [],
      preAvance: [],
      autorisation: []
    };
  });

  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [filteredDemandes, setFilteredDemandes] = useState([]);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const [processingId, setProcessingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.className = savedTheme;
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  // Fetch demandes with proper storage structure
  const fetchDemandes = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/demande-pre-avance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(await response.text());
      
      const preAvanceData = await response.json();
      
      // Update both the specific preAvance state and the complete demandes structure
      setDemandes(preAvanceData);
      
      // Update the complete demandes structure in localStorage
      const updatedAllDemandes = {
        ...allDemandes,
        preAvance: preAvanceData
      };
      setAllDemandes(updatedAllDemandes);
      localStorage.setItem("demandes", JSON.stringify(updatedAllDemandes));
      
      setError(null);
    } catch (error) {
      setError(error.message);
      console.error("Error fetching demandes:", error);
      
      // If we have cached data, don't show error to user
      const cached = localStorage.getItem('demandes');
      if (!cached) {
        toast.error("Erreur de chargement des demandes");
      }
    } finally {
      setLoading(false);
    }
  }, [allDemandes]);

  // Initial data fetch and setup polling
  useEffect(() => {
    // First try to load from localStorage
    const cachedDemandes = localStorage.getItem('demandes');
    if (!cachedDemandes) {
      toast.info("Chargement des demandes...", { autoClose: false, toastId: 'demandes-loading' });
    }
    
    fetchDemandes().then(() => {
      toast.dismiss('demandes-loading');
    });

    // Set up polling every 10 seconds
    const intervalId = setInterval(fetchDemandes, 10000);

    // SSE for real-time updates
    const eventSource = new EventSource(`${API_URL}/api/sse/updates`);
    eventSource.onmessage = () => fetchDemandes();

    return () => {
      clearInterval(intervalId);
      eventSource.close();
    };
  }, [fetchDemandes]);

  // Filter demandes
  useEffect(() => {
    let filtered = demandes;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d => 
        (d.matPers?.nom?.toLowerCase().includes(query)) || 
        (d.matPers?.prenom?.toLowerCase().includes(query)) ||
        (d.matPers?.matricule?.toLowerCase().includes(query)) ||
        (d.texteDemande?.toLowerCase().includes(query))
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(d => 
        selectedStatus === "T" 
          ? d.reponseRH === "T"
          : selectedStatus === "N"
            ? d.reponseRH === "N"
            : d.reponseRH === selectedStatus
      );
    }

    if (startDate && endDate) {
      filtered = filtered.filter(d => {
        const demandeDate = new Date(d.dateDemande);
        return demandeDate >= new Date(startDate) && demandeDate <= new Date(endDate);
      });
    }

    setFilteredDemandes(filtered);
  }, [demandes, searchQuery, selectedStatus, startDate, endDate]);

    // File handling functions
    const fetchFileBlobUrl = async (fileId) => {
      if (!fileId) {
        throw new Error("File ID is missing");
      }
  
      const token = localStorage.getItem("authToken");
      try {
        const response = await fetch(`${API_URL}/api/files/download/${fileId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Erreur HTTP: ${response.status}`);
        }
        
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      } catch (error) {
        console.error("Error fetching file:", error);
        throw error;
      }
    };
  
    const handlePreview = async (fileId) => {
      if (!fileId) {
        console.error("No file ID provided for preview");
        toast.warning("Aucun fichier sélectionné");
        return;
      }
  
      if (previewFileId === fileId) {
        setPreviewFileId(null);
        setPreviewFileUrl(null);
        return;
      }
      
      try {
        const url = await fetchFileBlobUrl(fileId);
        setPreviewFileId(fileId);
        setPreviewFileUrl(url);
      } catch (err) {
        console.error("Erreur d'aperçu:", err);
        toast.error("Impossible d'afficher la pièce jointe: " + err.message);
      }
    };
  
    const handleDownload = async (fileId, filename = "piece_jointe.pdf") => {
      if (!fileId) {
        console.error("No file ID provided for download");
        toast.warning("Aucun fichier sélectionné");
        return;
      }
  
      const toastId = toast.loading("Préparation du téléchargement...");
      
      try {
        const url = await fetchFileBlobUrl(fileId);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename || "document.pdf";
        document.body.appendChild(link);
        link.click();
        
        toast.update(toastId, {
          render: "Téléchargement en cours...",
          type: "success",
          isLoading: false,
          autoClose: 2000
        });
        
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
      } catch (err) {
        console.error("Erreur de téléchargement:", err);
        toast.update(toastId, {
          render: "Échec du téléchargement: " + err.message,
          type: "error",
          isLoading: false,
          autoClose: 3000
        });
      }
    };

  // Process demande with proper storage updates
  const traiterDemande = async (demandeId, observation = "") => {
    if (!demandeId) {
      toast.error("ID de demande invalide");
      return;
    }

    setProcessingId(demandeId);
    const toastId = toast.loading(
      "Traitement de la demande en cours...",
      {
        position: "top-center",
        theme: theme
      }
    );

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/demande-pre-avance/traiter/${demandeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ observation }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Échec du traitement de la demande");
      }

      // Update both the specific preAvance state and the complete demandes structure
      const updatedPreAvance = demandes.map(d => 
        d.id === demandeId ? { ...d, reponseRH: "T", observation } : d
      );
      setDemandes(updatedPreAvance);
      
      const updatedAllDemandes = {
        ...allDemandes,
        preAvance: updatedPreAvance
      };
      setAllDemandes(updatedAllDemandes);
      localStorage.setItem('demandes', JSON.stringify(updatedAllDemandes));

      toast.update(toastId, {
        render: "Demande traitée avec succès ✅",
        type: "success",
        isLoading: false,
        autoClose: 3000,
        closeButton: true,
      });
    } catch (error) {
      console.error("Error processing demande:", error);
      toast.update(toastId, {
        render: `Échec du traitement: ${error.message}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
        closeButton: true,
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Reject demande with proper storage updates
  const rejeterDemande = async (demandeId, observation) => {
    if (!demandeId) {
      toast.error("ID de demande invalide");
      return;
    }

    if (!observation || observation.trim() === "") {
      toast.error("L'observation est obligatoire pour le rejet");
      return;
    }

    setRejectingId(demandeId);
    const toastId = toast.loading(
      "Rejet de la demande en cours...",
      {
        position: "top-center",
        theme: theme
      }
    );

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/demande-pre-avance/refuser/${demandeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ observation }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Échec du rejet de la demande");
      }

      // Update both the specific preAvance state and the complete demandes structure
      const updatedPreAvance = demandes.map(d => 
        d.id === demandeId ? { ...d, reponseRH: "N", observation } : d
      );
      setDemandes(updatedPreAvance);
      
      const updatedAllDemandes = {
        ...allDemandes,
        preAvance: updatedPreAvance
      };
      setAllDemandes(updatedAllDemandes);
      localStorage.setItem('demandes', JSON.stringify(updatedAllDemandes));

      toast.update(toastId, {
        render: "Demande rejetée avec succès ✅",
        type: "success",
        isLoading: false,
        autoClose: 3000,
        closeButton: true,
      });
    } catch (error) {
      console.error("Error rejecting demande:", error);
      toast.update(toastId, {
        render: `Échec du rejet: ${error.message}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
        closeButton: true,
      });
    } finally {
      setRejectingId(null);
    }
  };

  // Handle processing with observation input
  const handleProcessWithObservation = (demandeId) => {
    toast.info(
      <div>
        <p>Ajouter une observation (facultative)</p>
        <input 
          type="text" 
          id="process-observation"
          placeholder="Observation..."
          style={{ width: '100%', padding: '8px', margin: '8px 0' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', gap: '8px' }}>
          <button 
            onClick={() => {
              toast.dismiss();
            }}
            style={{ 
              padding: '5px 10px', 
              background: '#f44336', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              flex: 1
            }}
          >
            Annuler
          </button>
          <button 
            onClick={() => {
              const observation = document.getElementById('process-observation').value;
              traiterDemande(demandeId, observation);
              toast.dismiss();
            }}
            style={{ 
              padding: '5px 10px', 
              background: '#4CAF50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              flex: 1
            }}
          >
            Confirmer
          </button>
          <button 
            onClick={() => {
              traiterDemande(demandeId);
              toast.dismiss();
            }}
            style={{ 
              padding: '5px 10px', 
              background: '#2196F3', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              flex: 1
            }}
          >
            Sans observation
          </button>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        closeButton: false,
        draggable: false,
        closeOnClick: false,
      }
    );
  };

  // Handle rejection with observation input
  const handleRejectWithObservation = (demandeId) => {
    toast.info(
      <div>
        <p>Raison du rejet (obligatoire)</p>
        <textarea 
          id="reject-observation"
          placeholder="Veuillez saisir la raison du rejet..."
          style={{ width: '100%', padding: '8px', margin: '8px 0', minHeight: '80px' }}
          required
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', gap: '8px' }}>
          <button 
            onClick={() => {
              toast.dismiss();
            }}
            style={{ 
              padding: '5px 10px', 
              background: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              flex: 1
            }}
          >
            Annuler
          </button>
          <button 
            onClick={() => {
              const observation = document.getElementById('reject-observation').value;
              if (!observation || observation.trim() === "") {
                toast.error("Veuillez saisir une raison pour le rejet");
                return;
              }
              rejeterDemande(demandeId, observation);
              toast.dismiss();
            }}
            style={{ 
              padding: '5px 10px', 
              background: '#f44336', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              flex: 2
            }}
          >
            Confirmer le rejet
          </button>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        closeButton: false,
        draggable: false,
        closeOnClick: false,
      }
    );
  };

  // Open modal with demande details
  const openModal = (demande) => {
    setSelectedDemande(demande);
    setIsModalOpen(true);
  };

  // Show loading only when we have no cached data and are loading
  const showLoading = loading && demandes.length === 0;

  if (showLoading) {
    return (
      <div className={`app-container ${theme}`}>
        <Sidebar theme={theme} />
        <div className="demandes-container">
          <Navbar theme={theme} toggleTheme={toggleTheme} />
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Chargement des demandes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && demandes.length === 0) {
    return (
      <div className={`app-container ${theme}`}>
        <Sidebar theme={theme} />
        <div className="demandes-container">
          <Navbar theme={theme} toggleTheme={toggleTheme} />
          <div className="error-container">
            <FiX size={48} />
            <h2>Erreur lors du chargement</h2>
            <p>{error}</p>
            <button className="retry-button" onClick={fetchDemandes}>
              <FiRefreshCw /> Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${theme}`}>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
      />
      
      <Sidebar theme={theme} />
      <div className="demandes-container">
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <div className="demandes-content">
          <div className="page-header">
            <h1>Demandes de Pré-Avance</h1>
            <p>Gérez les demandes de pré-avance de vos collaborateurs</p>
          </div>

          {/* Filters */}
          <div className="filter-tabs-container">
            <div className="filter-tabs">
              {["all", "I", "T", "N"].map(status => (
                <button
                  key={status}
                  className={`filter-tab ${selectedStatus === status ? "active" : ""}`}
                  onClick={() => setSelectedStatus(status)}
                >
                  {{
                    all: "Tous",
                    I: "En Attente",
                    T: "Traitées",
                    N: "Rejetées"
                  }[status]}
                </button>
              ))}
            </div>
            
            <div className="search-filter-container">
             
              
              <button 
                className="filter-toggle" 
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              >
                <FiFilter />
                <span>Filtres Date</span>
              </button>
            </div>
          </div>

          {isFilterExpanded && (
            <div className="filter-panel expanded">
              <div className="date-range-picker">
                <div className="date-input-group">
                  <label>Du</label>
                  <div className="date-input">
                    <FiCalendar />
                    <input
                      type="date"
                      value={startDate || ""}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="date-input-group">
                  <label>Au</label>
                  <div className="date-input">
                    <FiCalendar />
                    <input
                      type="date"
                      value={endDate || ""}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                    />
                  </div>
                </div>
              </div>
              
              <button 
                className="clear-filters"
                onClick={() => {
                  setStartDate(null);
                  setEndDate(null);
                }}
              >
                Effacer
              </button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="stats-cards">
            {[
              { 
                type: "total", 
                label: "Total", 
                value: demandes.length, 
                icon: <FiFileText /> 
              },
              { 
                type: "pending", 
                label: "En Attente", 
                value: demandes.filter(d => d.reponseRH === "I").length, 
                icon: <FiClock /> 
              },
              { 
                type: "approved", 
                label: "Traitées", 
                value: demandes.filter(d => d.reponseRH === "T").length, 
                icon: <FiCheck /> 
              },
              { 
                type: "rejected", 
                label: "Rejetées", 
                value: demandes.filter(d => d.reponseRH === "N").length, 
                icon: <FiX /> 
              }
            ].map(card => (
              <div key={card.type} className={`stat-card ${card.type}`}>
                <div className="stat-icon">{card.icon}</div>
                <div className="stat-content">
                  <div className="stat-value">{card.value}</div>
                  <div className="stat-label">{card.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Results count */}
          <div className="results-summary">
            <p>
              <span className="results-count">{filteredDemandes.length}</span> 
              {filteredDemandes.length === 1 ? " demande trouvée" : " demandes trouvées"}
            </p>
          </div>

          {/* Demandes Table */}
          <div className="table-responsive">
            <table className="demandes-table">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Matricule</th>
                  <th>Date Demande</th>
                  <th>Type</th>
                  <th>Montant</th>
                  <th>Fichiers</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDemandes.length > 0 ? (
                  filteredDemandes.map(demande => (
                    <tr key={demande.id}>
                      <td>
                        <div className="employee-info">
                          <span className="employee-name">
                            {demande.matPers?.nom || "Inconnu"} {demande.matPers?.prenom}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="employee-matricule">
                          {demande.matPers?.matricule || "N/A"}
                        </span>
                      </td>
                      <td>
                        {new Date(demande.dateDemande).toLocaleDateString()}
                      </td>
                      <td>
                        {demande.type || "N/A"}
                      </td>
                      <td>
                        {demande.montant ? `${demande.montant} DT` : "N/A"}
                      </td>
                                            <td className="file-actions">
                        {demande.files?.length > 0 ? (
                          <div className="file-buttons">
                            {demande.files.map((file, index) => (
                              <React.Fragment key={file.id}>
                                <button
                                  className="btn-preview"
                                  onClick={() => handlePreview(file.fileId)}
                                  title={`Aperçu: ${file.filename}`}
                                >
                                  <FiEye />
                                </button>
                                <button
                                  className="btn-download"
                                  onClick={() => handleDownload(file.fileId, file.filename)}
                                  title={`Télécharger: ${file.filename}`}
                                >
                                  <FiDownload />
                                </button>
                                {index < demande.files.length - 1 && <span className="file-separator">|</span>}
                              </React.Fragment>
                            ))}
                          </div>
                        ) : (
                          <span className="file-actions">Aucun fichier</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${demande.reponseRH.toLowerCase()}`}>
                          {{
                            I: <><FiClock /> En attente</>,
                            T: <><FiCheck /> Traité</>,
                            N: <><FiX /> Rejeté</>
                          }[demande.reponseRH]}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {demande.reponseRH === "I" && (
                            <>
                              <button
                                className="btn-approve"
                                onClick={() => handleProcessWithObservation(demande.id)}
                                disabled={processingId === demande.id || rejectingId === demande.id}
                              >
                                {processingId === demande.id ? (
                                  <span className="processing">Traitement...</span>
                                ) : (
                                  <>
                                    <FiCheck /> Traiter
                                  </>
                                )}
                              </button>
                              <button
                                className="action-button reject"
                                onClick={() => handleRejectWithObservation(demande.id)}
                                disabled={rejectingId === demande.id || processingId === demande.id}
                              >
                                {rejectingId === demande.id ? (
                                  <span className="processing">Rejet en cours...</span>
                                ) : (
                                  <>
                                    <FiX /> Rejeter
                                  </>
                                )}
                              </button>
                            </>
                          )}
                          <button
                            className="btn-preview"
                            onClick={() => openModal(demande)}
                          >
                            <FiEye /> 
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="no-results">
                    <td colSpan="7">
                      <div className="no-results-content">
                        <FiFilter size={48} />
                        <h3>Aucune demande trouvée</h3>
                        <p>Aucune demande ne correspond à vos critères de recherche</p>
                        <button 
                          className="btn-clear-filters"
                          onClick={() => {
                            setSelectedStatus("all");
                            setStartDate(null);
                            setEndDate(null);
                            setSearchQuery("");
                          }}
                        >
                          Réinitialiser les filtres
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* File Preview Modal */}
          {previewFileUrl && (
            <div className="file-preview-modal">
              <div className="file-preview-content">
                <div className="file-preview-header">
                  <h3>Aperçu du fichier</h3>
                  <button 
                    className="close-preview"
                    onClick={() => {
                      setPreviewFileId(null);
                      setPreviewFileUrl(null);
                      URL.revokeObjectURL(previewFileUrl);
                    }}
                  >
                    <FiX />
                  </button>
                </div>
                <div className="file-preview-container">
                  <iframe 
                    src={previewFileUrl} 
                    title="File Preview"
                    className="file-iframe"
                  />
                </div>
                <div className="file-preview-footer">
                  <button 
                    className="btn-download"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = previewFileUrl;
                      link.download = `formation_${previewFileId}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <FiDownload /> Télécharger
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Demande Details Modal */}
          {isModalOpen && selectedDemande && (
            <DemandeDetailsModal
              demande={selectedDemande}
              onClose={() => setIsModalOpen(false)}
              onApprove={() => handleProcessWithObservation(selectedDemande.id)}
              onReject={() => handleRejectWithObservation(selectedDemande.id)}
              isProcessing={processingId === selectedDemande.id}
              isRejecting={rejectingId === selectedDemande.id}
              isActionable={selectedDemande.reponseRH === "I"}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DemandesPreAvance;