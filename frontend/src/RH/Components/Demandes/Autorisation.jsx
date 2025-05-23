import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { FiSearch, FiFilter, FiCalendar, FiCheck, FiClock, FiRefreshCw, FiFileText, FiDownload, FiEye, FiX, FiInfo } from "react-icons/fi";
import "./Demandes.css";
import { API_URL } from "../../../config";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import "./DemandeDetailsModal.css";

const DemandeDetailsModal = ({ 
  demande, 
  onClose, 
  onApprove, 
  isProcessing, 
  onPreviewFile, 
  onDownloadFile,
  theme 
}) => {
  return (
    <div className={`modal-overlay ${theme}`}>
      <div className={`modal-content ${theme}`}>
        <div className="modal-header">
          <h2>Détails de la Demande d'Autorisation</h2>
          <button className="close-button" onClick={onClose}>
            <FiX />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="detail-section">
            <h3>Informations Employé</h3>
            <div className="detail-row">
              <span className="detail-label">Nom:</span>
              <span className="detail-value">{demande.matPers?.nom || "Inconnu"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Prénom:</span>
              <span className="detail-value">{demande.matPers?.prenom || "Inconnu"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Matricule:</span>
              <span className="detail-value">{demande.matPers?.matricule || "N/A"}</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>Détails Autorisation</h3>
            <div className="detail-row">
              <span className="detail-label">Date Demande:</span>
              <span className="detail-value">
                {new Date(demande.dateDemande).toLocaleDateString()}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Période:</span>
              <span className="detail-value">
                {demande.heureSortie}h{demande.minuteSortie?.toString().padStart(2, '0') || '00'} - {demande.heureRetour}h{demande.minuteRetour?.toString().padStart(2, '0') || '00'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Motif:</span>
              <span className="detail-value">{demande.texteDemande || "Aucun motif spécifié"}</span>
            </div>
          </div>

          {demande.files?.length > 0 && (
            <div className="detail-section">
              <h3>Fichiers Joints</h3>
              {demande.files.map((file) => (
                <div key={file.id} className="file-item">
                  <span className="file-name">{file.filename}</span>
                  <div className="file-actions">
                    <button 
                      className="btn-preview" 
                      onClick={() => onPreviewFile(file.fileId)}
                      title="Aperçu"
                    >
                      <FiEye />
                    </button>
                    <button 
                      className="btn-download"
                      onClick={() => onDownloadFile(file.fileId, file.filename)}
                      title="Télécharger"
                    >
                      <FiDownload />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="status-display">
            <span className={`status-badge ${(demande.reponseRH || '').toLowerCase()}`}>
              {{
                I: <><FiClock /> En attente</>,
                T: <><FiCheck /> Traité</>
              }[demande.reponseRH] || 'Inconnu'}
            </span>
          </div>
          
          <div className="action-buttons">
            {demande.reponseRH === "I" && (
              <button
                className={`btn-approve ${isProcessing ? 'processing' : ''}`}
                onClick={onApprove}
                disabled={isProcessing}
              >
                {isProcessing ? 'Traitement en cours...' : <><FiCheck /> Traiter la demande</>}
              </button>
            )}
            <button className="btn-close" onClick={onClose}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DemandesAutorisation = () => {
  // Load initial data from localStorage with proper structure
  const [demandes, setDemandes] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('demandes');
      return cached ? JSON.parse(cached).autorisation || [] : [];
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
  const [previewFileId, setPreviewFileId] = useState(null);
  const [previewFileUrl, setPreviewFileUrl] = useState(null);

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
      const response = await fetch(`${API_URL}/api/demande-autorisation/approved`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(await response.text());
      
      const autorisationData = await response.json();
      
      // Update both the specific autorisation state and the complete demandes structure
      setDemandes(autorisationData);
      
      // Update the complete demandes structure in localStorage
      const updatedAllDemandes = {
        ...allDemandes,
        autorisation: autorisationData
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
  const traiterDemande = async (demandeId) => {
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
      const response = await fetch(`${API_URL}/api/demande-autorisation/traiter/${demandeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const responseClone = response.clone();
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        const textResponse = await responseClone.text();
        if (textResponse.includes("Demande traitée")) {
          responseData = { 
            id: demandeId,
            reponseRH: "T",
            message: textResponse
          };
        } else {
          throw new Error(textResponse);
        }
      }

      // Update both the specific autorisation state and the complete demandes structure
      const updatedAutorisation = demandes.map(d => 
        d.id === demandeId ? { ...d, reponseRH: "T" } : d
      );
      setDemandes(updatedAutorisation);
      
      const updatedAllDemandes = {
        ...allDemandes,
        autorisation: updatedAutorisation
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
            <h1>Demandes d'Autorisation</h1>
            <p>Gérez les demandes d'autorisation de sortie</p>
          </div>

          {/* Filters */}
          <div className="filter-tabs-container">
            <div className="filter-tabs">
              {["all", "I", "T"].map(status => (
                <button
                  key={status}
                  className={`filter-tab ${selectedStatus === status ? "active" : ""}`}
                  onClick={() => setSelectedStatus(status)}
                >
                  {{
                    all: "Tous",
                    I: "En Attente",
                    T: "Traitées"
                  }[status]}
                </button>
              ))}
            </div>
            
            <div className="search-filter-container">
              <div className="search-bar">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Rechercher par nom, matricule ou motif..."
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
                  <th>Date Demande</th>
                  <th>Employé</th>
                  <th>Période</th>
                  <th>Motif</th>
                  <th>Pièces Jointes</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDemandes.length > 0 ? (
                  filteredDemandes.map(demande => (
                    <tr key={demande.id}>
                      <td>
                        {new Date(demande.dateDemande).toLocaleDateString()}
                      </td>
                      <td>
                        <span className="employee-name">
                          {demande.matPers?.nom} {demande.matPers?.prenom}
                        </span>
                        <br />
                        <span className="employee-matricule">
                          {demande.matPers?.matricule || "N/A"}
                        </span>
                      </td>
                      <td>
                        {demande.heureSortie}h{demande.minuteSortie?.toString().padStart(2, '0') || '00'} - {demande.heureRetour}h{demande.minuteRetour?.toString().padStart(2, '0') || '00'}
                      </td>
                      <td className="demande-text">
                        {demande.texteDemande || "Aucun motif spécifié"}
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
                        <span className={`status-badge ${(demande.reponseRH || '').toLowerCase()}`}>
                          {{
                            I: <><FiClock /> En attente</>,
                            T: <><FiCheck /> Traité</>
                          }[demande.reponseRH] || 'Inconnu'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-details"
                            onClick={() => {
                              setSelectedDemande(demande);
                              setIsModalOpen(true);
                            }}
                            title="Voir les détails"
                          >
                            <FiEye />
                          </button>
                          {demande.reponseRH === "I" && (
                            <button
                              className="btn-approve"
                              onClick={(e) => {
                                e.stopPropagation();
                                traiterDemande(demande.id);
                              }}
                              disabled={processingId === demande.id}
                              title="Traiter la demande"
                            >
                              {processingId === demande.id ? (
                                <span className="processing">Traitement...</span>
                              ) : (
                                <FiCheck />
                              )}
                            </button>
                          )}
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
                      link.download = `autorisation_${previewFileId}.pdf`;
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
              onApprove={() => traiterDemande(selectedDemande.id)}
              isProcessing={processingId === selectedDemande.id}
              onPreviewFile={handlePreview}
              onDownloadFile={handleDownload}
              theme={theme}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DemandesAutorisation;