import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { FiSearch, FiFilter, FiCalendar, FiCheck, FiX, FiClock, FiRefreshCw, FiFileText, FiUpload, FiEye, FiDownload } from "react-icons/fi";
import "./Demandes.css";
import DemandeDetailsModal from "./DemandeDetailsModal";
import { API_URL } from "../../../config";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const DemandesDocument = () => {
  // Load initial data from localStorage with proper structure
  const [demandes, setDemandes] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('demandes');
      return cached ? JSON.parse(cached).document || [] : [];
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
  const [uploadedResponseFiles, setUploadedResponseFiles] = useState({});
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
      const response = await fetch(`${API_URL}/api/demande-document`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(await response.text());
      
      const documentData = await response.json();
      
      // Update both the specific document state and the complete demandes structure
      setDemandes(documentData);
      
      // Update the complete demandes structure in localStorage
      const updatedAllDemandes = {
        ...allDemandes,
        document: documentData
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
        (d.texteDemande?.toLowerCase().includes(query))
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(d => d.reponseRH === selectedStatus);
    }

    if (startDate && endDate) {
      filtered = filtered.filter(d => {
        const demandeDate = new Date(d.dateDemande);
        return demandeDate >= new Date(startDate) && demandeDate <= new Date(endDate);
      });
    }

    setFilteredDemandes(filtered);
  }, [demandes, searchQuery, selectedStatus, startDate, endDate]);

  const handleResponseFileChange = (e, demandeId) => {
    try {
      const file = e.target.files?.[0];
      if (file) {
        setUploadedResponseFiles((prev) => ({ ...prev, [demandeId]: file }));
      }
    } catch (error) {
      console.error("File upload error:", error);
    }
  };

  // Process demande with proper storage updates
  const traiterDemande = async (demandeId, observation = "") => {
    if (!demandeId) {
      toast.error("Invalid request ID");
      return;
    }

    setProcessingId(demandeId);
    const toastId = toast.loading(
      "Processing request...",
      {
        position: "top-center",
        theme: theme
      }
    );

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const responseFile = uploadedResponseFiles[demandeId];
      const formData = new FormData();
      
      if (responseFile) {
        formData.append("file", responseFile);
      }

      // First upload file if it exists
      if (responseFile) {
        const uploadResponse = await fetch(
          `${API_URL}/api/demande-document/${demandeId}/add-response-file`,
          {
            method: "POST",
            body: formData,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || "Failed to upload file");
        }
      }

      // Then mark as processed with observation
      const processResponse = await fetch(
        `${API_URL}/api/demande-document/traiter/${demandeId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ observation }),
        }
      );

      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(errorData.error || "Failed to process request");
      }

      // Update both the specific document state and the complete demandes structure
      const updatedDocument = demandes.map(d => 
        d.id === demandeId ? { ...d, reponseRH: "T" } : d
      );
      setDemandes(updatedDocument);
      
      const updatedAllDemandes = {
        ...allDemandes,
        document: updatedDocument
      };
      setAllDemandes(updatedAllDemandes);
      localStorage.setItem('demandes', JSON.stringify(updatedAllDemandes));

      setUploadedResponseFiles((prev) => {
        const newFiles = { ...prev };
        delete newFiles[demandeId];
        return newFiles;
      });

      toast.update(toastId, {
        render: "Request processed successfully ✅",
        type: "success",
        isLoading: false,
        autoClose: 3000,
        closeButton: true,
      });
    } catch (error) {
      console.error("Processing error:", error);
      toast.update(toastId, {
        render: `Processing failed: ${error.message}`,
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
      toast.error("Invalid request ID");
      return;
    }

    if (!observation || observation.trim() === "") {
      toast.error("Observation is mandatory for rejection");
      return;
    }

    setRejectingId(demandeId);
    const toastId = toast.loading(
      "Rejecting request...",
      {
        position: "top-center",
        theme: theme
      }
    );

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(
        `${API_URL}/api/demande-document/refuser/${demandeId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ observation }),
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Update both the specific document state and the complete demandes structure
      const updatedDocument = demandes.map(d => 
        d.id === demandeId ? { ...d, reponseRH: "N" } : d
      );
      setDemandes(updatedDocument);
      
      const updatedAllDemandes = {
        ...allDemandes,
        document: updatedDocument
      };
      setAllDemandes(updatedAllDemandes);
      localStorage.setItem('demandes', JSON.stringify(updatedAllDemandes));

      toast.update(toastId, {
        render: "Request rejected successfully ✅",
        type: "success",
        isLoading: false,
        autoClose: 3000,
        closeButton: true,
      });
    } catch (error) {
      console.error("Rejection error:", error);
      toast.update(toastId, {
        render: `Rejection failed: ${error.message}`,
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

  const openModal = (demande) => {
    try {
      if (!demande) return;
      setSelectedDemande({
        ...demande,
        filesReponse: (demande.filesReponse || []).filter(f => f !== null && f.filename)
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error opening modal:", error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDemande(null);
  };

  const toggleFilterExpand = () => setIsFilterExpanded(!isFilterExpanded);

  const clearFilters = () => {
    setSelectedStatus("all");
    setStartDate(null);
    setEndDate(null);
    setSearchQuery("");
  };

  const downloadFile = async (filename) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${API_URL}/api/demande-document/download/${filename}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert(`Error downloading file: ${error.message}`);
    }
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
            <h1>Demandes de Documents</h1>
            <p>Gérez les demandes de documents de vos collaborateurs</p>
          </div>

          <div className="filter-tabs-container">
            <div className="filter-tabs">
              {["all", "I", "T", "N"].map((status) => (
                <button
                  key={status}
                  className={`filter-tab ${selectedStatus === status ? "active" : ""}`}
                  onClick={() => setSelectedStatus(status)}
                >
                  {status === "all" ? "Tous" : status === "I" ? "En Attente" : status === "T" ? "Traitées" : "Rejetées"}
                </button>
              ))}
            </div>
            
            <div className="search-filter-container">
              <div className="search-bar">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou contenu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
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

          <div className="results-summary">
            <p>
              <span className="results-count">{filteredDemandes.length}</span> 
              {filteredDemandes.length === 1 ? " demande trouvée" : " demandes trouvées"}
            </p>
          </div>

          {filteredDemandes.length > 0 ? (
            <div className="table-responsive">
              <table className="demandes-table">
                <thead>
                  <tr>
                    <th>Date Demande</th>
                    <th>Employé</th>
                    <th>Texte Demande</th>
                    <th>Statut</th>
                    <th>Document Réponse</th>
                    <th>Actions</th>
                    <th>Voir</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDemandes.map((demande) => (
                    <tr key={demande.id}>
                      <td>
                        <div className="cell-with-icon">
                          <FiCalendar className="cell-icon" />
                          <span>
                            {demande.dateDemande ? new Date(demande.dateDemande).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="employee-info">
                          <span className="employee-name">{demande.matPers?.nom || "Inconnu"}</span>
                          {demande.matPers?.prenom && (
                            <span className="employee-details">{demande.matPers.prenom}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="demande-text">
                          {demande.texteDemande || <span className="no-content">Aucun texte</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${
                          demande.reponseRH === "I" ? "pending" :
                          demande.reponseRH === "T" ? "processed" : "rejected"
                        }`}>
                          <span className="status-icon">
                            {demande.reponseRH === "I" ? <FiClock /> :
                             demande.reponseRH === "T" ? <FiCheck /> : <FiX />}
                          </span>
                          {demande.reponseRH === "I" ? "En Attente" :
                           demande.reponseRH === "T" ? "Traité" : "Rejeté"}
                        </span>
                      </td>
                      <td>
                        {demande.filesReponse && demande.filesReponse.length > 0 ? (
                          <div className="response-files">
                            {demande.filesReponse
                              .filter(file => file !== null && file.filename)
                              .map((file, index) => (
                                <div key={index} className="response-file-item">
                                  <span className="file-link" onClick={() => downloadFile(file.filename)}>
                                    <FiFileText /> {file.filename}
                                  </span>
                                </div>
                              ))}
                          </div>
                        ) : demande.reponseRH === "I" ? (
                          <div className="file-input-container">
                            <label
                              htmlFor={`response-file-upload-${demande.id}`}
                              className="file-upload-label"
                            >
                              <FiUpload /> {uploadedResponseFiles[demande.id] ? "Changer fichier" : "Ajouter fichier (optionnel)"}
                            </label>
                            <input
                              id={`response-file-upload-${demande.id}`}
                              type="file"
                              onChange={(e) => handleResponseFileChange(e, demande.id)}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              style={{ display: "none" }}
                            />
                            {uploadedResponseFiles[demande.id] && (
                              <span className="file-name">{uploadedResponseFiles[demande.id].name}</span>
                            )}
                          </div>
                        ) : (
                          <span className="no-file">Aucun document</span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className={`action-button process ${demande.reponseRH !== "I" ? "disabled-button" : ""}`}
                            onClick={() => handleProcessWithObservation(demande.id)}
                            disabled={demande.reponseRH !== "I" || processingId === demande.id || rejectingId === demande.id}
                            title={demande.reponseRH !== "I" ? "Action non disponible" : "Traiter cette demande"}
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
                            className={`action-button reject ${demande.reponseRH !== "I" ? "disabled-button" : ""}`}
                            onClick={() => handleRejectWithObservation(demande.id)}
                            disabled={demande.reponseRH !== "I" || rejectingId === demande.id || processingId === demande.id}
                            title={demande.reponseRH !== "I" ? "Action non disponible" : "Rejeter cette demande"}
                          >
                            {rejectingId === demande.id ? (
                              <span className="processing">Rejet en cours...</span>
                            ) : (
                              <>
                                <FiX /> Rejeter
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                      <td>
                        <button
                          className="action-button view"
                          onClick={() => openModal(demande)}
                          title="Voir détails"
                        >
                          <FiEye />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">
                <FiFilter size={48} />
              </div>
              <h3>Aucune demande trouvée</h3>
              <p>Aucune demande ne correspond à vos critères de recherche.</p>
              <button className="clear-filters-button" onClick={clearFilters}>
                Réinitialiser les filtres
              </button>
            </div>
          )}

          {isModalOpen && selectedDemande && (
            <DemandeDetailsModal
              demande={selectedDemande}
              onClose={closeModal}
              onDownload={downloadFile}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DemandesDocument;