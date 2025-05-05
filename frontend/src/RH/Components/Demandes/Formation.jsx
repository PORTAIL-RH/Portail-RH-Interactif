import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { FiSearch, FiFilter, FiCalendar, FiCheck, FiClock, FiRefreshCw, FiFileText, FiX, FiEye, FiDownload } from "react-icons/fi";
import "./Demandes.css";
import DemandeDetailsModal from "./DemandeDetailsModal";
import { API_URL } from "../../../config";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const DemandesFormation = () => {
  const [demandes, setDemandes] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('demandes');
      return cached ? JSON.parse(cached).formation || [] : [];
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

  const fetchFileBlobUrl = async (fileId) => {
    if (!fileId) throw new Error("File ID is missing");
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`${API_URL}/api/files/download/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(await response.text());
      return await response.blob();
    } catch (error) {
      console.error("Error fetching file:", error);
      throw error;
    }
  };

  const handlePreview = async (fileId, filename) => {
    if (!fileId) return toast.warning("Aucun fichier sélectionné");
    if (previewFileId === fileId) {
      setPreviewFileId(null);
      setPreviewFileUrl(null);
      return;
    }
    try {
      const blob = await fetchFileBlobUrl(fileId);
      const url = URL.createObjectURL(blob);
      setPreviewFileId(fileId);
      setPreviewFileUrl(url);
    } catch (err) {
      toast.error(`Erreur d'aperçu: ${err.message}`);
    }
  };

  const handleDownload = async (fileId, filename = "document_formation.pdf") => {
    if (!fileId) return toast.warning("Aucun fichier sélectionné");
    try {
      const blob = await fetchFileBlobUrl(fileId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      toast.error(`Échec du téléchargement: ${err.message}`);
    }
  };

  const fetchDemandes = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/demande-formation/approved`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(await response.text());
      
      const formationData = await response.json();
      setDemandes(formationData);
      const updatedAllDemandes = {
        ...allDemandes,
        formation: formationData
      };
      setAllDemandes(updatedAllDemandes);
      localStorage.setItem("demandes", JSON.stringify(updatedAllDemandes));
      setError(null);
    } catch (error) {
      setError(error.message);
      console.error("Error fetching demandes:", error);
      if (!localStorage.getItem('demandes')) {
        toast.error("Erreur de chargement des demandes");
      }
    } finally {
      setLoading(false);
    }
  }, [allDemandes]);

  useEffect(() => {
    const cachedDemandes = localStorage.getItem('demandes');
    if (!cachedDemandes) {
      toast.info("Chargement des demandes...", { autoClose: false, toastId: 'demandes-loading' });
    }
    fetchDemandes().then(() => toast.dismiss('demandes-loading'));

    const intervalId = setInterval(fetchDemandes, 10000);
    const eventSource = new EventSource(`${API_URL}/api/sse/updates`);
    eventSource.onmessage = () => fetchDemandes();

    return () => {
      clearInterval(intervalId);
      eventSource.close();
    };
  }, [fetchDemandes]);

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
        selectedStatus === "T" ? d.reponseRH === "T" : d.reponseRH === selectedStatus
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

  const traiterDemande = async (demandeId) => {
    if (!demandeId) return toast.error("ID de demande invalide");
    setProcessingId(demandeId);
    const toastId = toast.loading("Traitement de la demande en cours...", { theme });

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/demande-formation/traiter/${demandeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error(await response.text());

      const updatedFormation = demandes.map(d => 
        d.id_libre_demande === demandeId ? { ...d, reponseRH: "T" } : d
      );
      setDemandes(updatedFormation);
      const updatedAllDemandes = {
        ...allDemandes,
        formation: updatedFormation
      };
      setAllDemandes(updatedAllDemandes);
      localStorage.setItem('demandes', JSON.stringify(updatedAllDemandes));

      toast.update(toastId, {
        render: "Demande traitée avec succès ✅",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error processing demande:", error);
      toast.update(toastId, {
        render: `Échec du traitement: ${error.message}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setProcessingId(null);
    }
  };

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
      <ToastContainer position="top-center" autoClose={5000} theme={theme} />
      <Sidebar theme={theme} />
      <div className="demandes-container">
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <div className="demandes-content">
          <div className="page-header">
            <h1>Demandes de Formation</h1>
            <p>Gérez les demandes de formation de vos collaborateurs</p>
          </div>

          <div className="filter-tabs-container">
            <div className="filter-tabs">
              {["all", "I", "T"].map(status => (
                <button
                  key={status}
                  className={`filter-tab ${selectedStatus === status ? "active" : ""}`}
                  onClick={() => setSelectedStatus(status)}
                >
                  {{ all: "Tous", I: "En Attente", T: "Traitées" }[status]}
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

          <div className="stats-cards">
            {[
              { type: "total", label: "Total", value: demandes.length, icon: <FiFileText /> },
              { type: "pending", label: "En Attente", value: demandes.filter(d => d.reponseRH === "I").length, icon: <FiClock /> },
              { type: "approved", label: "Traitées", value: demandes.filter(d => d.reponseRH === "T").length, icon: <FiCheck /> }
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

          <div className="table-responsive">
            <table className="demandes-table">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Matricule</th>
                  <th>Date Demande</th>
                  <th>Date formation</th>
                  <th>Titre</th>
                  <th>Type</th>
                  <th>Thème</th>
                  <th>Fichiers</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDemandes.length > 0 ? (
                  filteredDemandes.map(demande => (
                    <tr key={demande.id_libre_demande}>
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
                        {demande.dateDebut ? (
                          new Date(demande.dateDebut).toLocaleDateString()
                        ) : "Non spécifiée"}
                      </td>
                      <td>
                        {demande.titre?.titre || "Aucun titre spécifié"}
                      </td>
                      <td>
                        {demande.type?.type || "Aucun type spécifié"}
                      </td>
                      <td>
                        {demande.theme?.theme || "Aucun thème spécifié"}
                      </td>
                      <td className="file-actions">
                        {demande.files?.length > 0 ? (
                          <div className="file-buttons">
                            {demande.files.map((file, index) => (
                              <React.Fragment key={file.id}>
                                <button
                                  className="btn-preview"
                                  onClick={() => handlePreview(file.fileId, file.filename)}
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
                                {index < demande.files.length - 1 && (
                                  <span className="file-separator">|</span>
                                )}
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
                            T: <><FiCheck /> Traité</>
                          }[demande.reponseRH]}
                        </span>
                      </td>
                      <td>
                        {demande.reponseRH === "I" ? (
                          <div className="action-buttons">
                            <button
                              className="btn-approve"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (demande.id_libre_demande) {
                                  traiterDemande(demande.id_libre_demande);
                                } else {
                                  toast.error("ID de demande manquant");
                                }
                              }}
                              disabled={processingId === demande.id_libre_demande}
                            >
                              {processingId === demande.id_libre_demande ? (
                                <span className="processing">Traitement...</span>
                              ) : (
                                <>
                                  <FiCheck /> Traiter
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="no-actions">Traité</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="no-results">
                    <td colSpan="10">
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

          {isModalOpen && selectedDemande && (
            <DemandeDetailsModal
              demande={selectedDemande}
              onClose={() => setIsModalOpen(false)}
              onApprove={() => selectedDemande.id_libre_demande && traiterDemande(selectedDemande.id_libre_demande)}
              isProcessing={processingId === selectedDemande.id_libre_demande}
              onPreviewFile={handlePreview}
              onDownloadFile={handleDownload}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DemandesFormation;