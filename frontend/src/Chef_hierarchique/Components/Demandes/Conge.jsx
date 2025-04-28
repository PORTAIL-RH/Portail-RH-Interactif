import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { FiSearch, FiFilter, FiCalendar, FiCheck, FiX, FiClock, FiRefreshCw, FiFileText, FiEye, FiDownload } from "react-icons/fi";
import "./Demandes.css";
import DemandeDetailsModal from "./DemandeDetailsModal";

const DemandesConge = () => {
  // Initialize state with localStorage data if available
  const [demandesData, setDemandesData] = useState(() => {
    try {
      const stored = localStorage.getItem("demandes");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.conge && Array.isArray(parsed.conge.data)) {
          return {
            conge: {
              data: parsed.conge.data || [],
              total: parsed.conge.total || 0,
              pending: parsed.conge.pending || 0,
              approved: parsed.conge.approved || 0
            },
            timestamp: parsed.timestamp || 0
          };
        }
      }
    } catch (e) {
      console.error("Error parsing demandes from localStorage:", e);
    }
    // Default empty state
    return {
      conge: {
        data: [],
        total: 0,
        pending: 0,
        approved: 0
      },
      timestamp: 0
    };
  });

  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [observation, setObservation] = useState("");
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [currentDemandeId, setCurrentDemandeId] = useState(null);
  const [previewFileId, setPreviewFileId] = useState(null);
  const [previewFileUrl, setPreviewFileUrl] = useState(null);
  const [usedDaysData, setUsedDaysData] = useState({});
  const [lastUpdated, setLastUpdated] = useState("");
  const [dataSource, setDataSource] = useState(""); // Track data source

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    applyTheme(savedTheme);

    const handleStorageChange = () => {
      const currentTheme = localStorage.getItem("theme") || "light";
      setTheme(currentTheme);
      applyTheme(currentTheme);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("themeChanged", (e) => {
      setTheme(e.detail || "light");
      applyTheme(e.detail || "light");
    });

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("themeChanged", handleStorageChange);
    };
  }, []);

  const applyTheme = (theme) => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    document.body.className = theme;
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }));
  };

  const getUserId = () => {
    try {
      const userData = localStorage.getItem("userId");
      if (!userData) return null;

      try {
        const parsed = JSON.parse(userData);
        return parsed?.userId || parsed?.id || null;
      } catch {
        return userData;
      }
    } catch (e) {
      console.error("Error reading userId from localStorage:", e);
      return null;
    }
  };

  const userId = getUserId();

  const fetchUsedDays = useCallback(async (matPersId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `http://localhost:8080/api/demande-conge/days-used/${matPersId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch used days data");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching used days:", error);
      return null;
    }
  }, []);

  const fetchFromAPI = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");

      if (!userId) {
        throw new Error("User ID not found in localStorage");
      }

      console.log("Fetching conge demandes from API...");
      const response = await fetch(
        `http://localhost:8080/api/demande-conge/collaborateurs-by-service/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch demandes");
      }

      const data = await response.json();

      if (!data.demandes) {
        throw new Error("Invalid response format: demandes array missing");
      }

      const demandesFromResponse = Array.isArray(data.demandes) ? data.demandes : [];
      
      // Fetch used days for each unique employee
      const uniqueMatPersIds = [...new Set(demandesFromResponse.map(d => d.matPers?.id))].filter(id => id);
      const usedDaysPromises = uniqueMatPersIds.map(id => fetchUsedDays(id));
      const usedDaysResults = await Promise.all(usedDaysPromises);
      
      const usedDaysMap = {};
      usedDaysResults.forEach((result, index) => {
        if (result && result.status === "success") {
          usedDaysMap[uniqueMatPersIds[index]] = result;
        }
      });
      
      setUsedDaysData(usedDaysMap);

      // Process the data for our state structure
      const processedConge = {
        data: demandesFromResponse,
        total: demandesFromResponse.length,
        pending: demandesFromResponse.filter(d => d.reponseChef === "I").length,
        approved: demandesFromResponse.filter(d => d.reponseChef === "O").length
      };

      // Update localStorage cache
      const currentCache = JSON.parse(localStorage.getItem("demandes") || "{}");
      const updatedCache = {
        ...currentCache,
        conge: processedConge,
        timestamp: Date.now()
      };
      
      localStorage.setItem("demandes", JSON.stringify(updatedCache));

      // Update state
      setDemandesData(updatedCache);
      setDemandes(processedConge.data);
      setFilteredDemandes(processedConge.data);
      setDataSource("api");
      
      // Update last updated timestamp
      const now = new Date().toLocaleTimeString();
      setLastUpdated(now);
      
      return true;
    } catch (error) {
      console.error("API fetch error:", error);
      throw error;
    }
  }, [userId, fetchUsedDays]);

  const fetchDemandes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // First try to get from localStorage
      const stored = localStorage.getItem("demandes");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const cacheAge = Date.now() - (parsed.timestamp || 0);
          
          // Use cached data if less than 1 hour old and has valid data
          if (cacheAge < 3600000 && parsed.conge?.data && Array.isArray(parsed.conge.data)) {
            console.log("Using cached conge data");
            setDemandesData(parsed);
            setDemandes(parsed.conge.data);
            setFilteredDemandes(parsed.conge.data);
            setLastUpdated(new Date(parsed.timestamp).toLocaleTimeString());
            setDataSource("cache");
            setLoading(false);
            
            // Fetch fresh data in background but don't wait for it
            fetchFromAPI().catch(e => console.error("Background refresh failed:", e));
            return;
          }
        } catch (e) {
          console.error("Error parsing demandes from localStorage:", e);
        }
      }

      // If no valid cache, fetch from API
      await fetchFromAPI();
    } catch (error) {
      console.error("Fetch error:", error);
      setError(error.message || "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [fetchFromAPI]);

  // Initial fetch
  useEffect(() => {
    fetchDemandes();
  }, [fetchDemandes]);

  useEffect(() => {
    let filtered = demandes;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (demande) =>
          (demande.matPers?.nom && demande.matPers.nom.toLowerCase().includes(query)) ||
          (demande.texteDemande && demande.texteDemande.toLowerCase().includes(query))
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((demande) => demande.reponseChef === selectedStatus);
    }

    if (startDate && endDate) {
      filtered = filtered.filter((demande) => {
        const demandeDate = new Date(demande.dateDemande);
        return demandeDate >= new Date(startDate) && demandeDate <= new Date(endDate);
      });
    }

    setFilteredDemandes(filtered);
  }, [selectedStatus, startDate, endDate, demandes, searchQuery]);

  const openActionModal = (demandeId, type) => {
    setCurrentDemandeId(demandeId);
    setActionType(type);
    setObservation("");
    setShowObservationModal(true);
  };

  const closeActionModal = () => {
    setShowObservationModal(false);
    setObservation("");
    setActionType(null);
    setCurrentDemandeId(null);
  };

  const toggleFilterExpand = () => {
    setIsFilterExpanded((prev) => !prev);
  };
  
  const handleAction = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const url = actionType === "approve" 
        ? `http://localhost:8080/api/demande-conge/valider/${currentDemandeId}`
        : `http://localhost:8080/api/demande-conge/refuser/${currentDemandeId}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          observation: observation
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      // Update the demandes state
      const updatedDemandes = demandes.map(d => 
        d.id === currentDemandeId ? { 
          ...d, 
          reponseChef: actionType === "approve" ? "O" : "N",
          observation: observation 
        } : d
      );

      // Update localStorage cache
      const updatedConge = {
        data: updatedDemandes,
        total: updatedDemandes.length,
        pending: updatedDemandes.filter(d => d.reponseChef === "I").length,
        approved: updatedDemandes.filter(d => d.reponseChef === "O").length
      };

      const currentCache = JSON.parse(localStorage.getItem("demandes") || "{}");
      const updatedCache = {
        ...currentCache,
        conge: updatedConge,
        timestamp: Date.now()
      };
      
      localStorage.setItem("demandes", JSON.stringify(updatedCache));

      setDemandesData(updatedCache);
      setDemandes(updatedDemandes);
      setFilteredDemandes(updatedDemandes);

      // If approved, refresh the used days data for this employee
      if (actionType === "approve") {
        const approvedDemande = demandes.find(d => d.id === currentDemandeId);
        if (approvedDemande?.matPers?.id) {
          const newUsedDaysData = await fetchUsedDays(approvedDemande.matPers.id);
          if (newUsedDaysData) {
            setUsedDaysData(prev => ({
              ...prev,
              [approvedDemande.matPers.id]: newUsedDaysData
            }));
          }
        }
      }

      closeActionModal();
      
    } catch (error) {
      alert(`Erreur: ${error.message}`);
    }
  };

  const openModal = (demande) => {
    setSelectedDemande(demande);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDemande(null);
  };

  const fetchFileBlobUrl = async (fileId) => {
    const token = localStorage.getItem("authToken");
    const response = await fetch(`http://localhost:8080/api/files/download/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Erreur HTTP: " + response.status);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  };

  const handlePreview = async (fileId) => {
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
      alert("Impossible d'afficher la pièce jointe.");
    }
  };

  const handleDownload = async (fileId, filename = "piece_jointe.pdf") => {
    try {
      const url = await fetchFileBlobUrl(fileId);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erreur de téléchargement:", err);
      alert("Échec du téléchargement.");
    }
  };

  const clearFilters = () => {
    setSelectedStatus("all");
    setStartDate(null);
    setEndDate(null);
    setSearchQuery("");
  };

  const handleRefresh = () => {
    fetchDemandes();
  };

  if (loading) {
    return (
      <div className={`app-container ${theme}`}>
        <Sidebar theme={theme} />
        <div className="demandes-container">
          <Navbar theme={theme} toggleTheme={toggleTheme}/>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Chargement des demandes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`app-container ${theme}`}>
        <Sidebar theme={theme} />
        <div className="demandes-container">
          <Navbar theme={theme} toggleTheme={toggleTheme}/>
          <div className="error-container">
            <div className="error-icon">
              <FiX size={48} />
            </div>
            <h2>Erreur lors du chargement des données</h2>
            <p>{error}</p>
            <button className="retry-button" onClick={handleRefresh}>
              <FiRefreshCw /> Réessayer
            </button>
            {dataSource.includes("cache") && (
              <p className="cache-warning">Affichage des données en cache</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className="demandes-container">
        <Navbar theme={theme} toggleTheme={toggleTheme}/>
        <div className="demandes-content">
          <div className="page-header">
            <div className="header-row">
              <h1>Demandes de Congé</h1>
              <button className="refresh-button" onClick={handleRefresh}>
                <FiRefreshCw /> Rafraîchir
              </button>
            </div>
            <p>Gérez les demandes de congé de vos collaborateurs</p>
            <small className="polling-indicator">
              Dernière mise à jour: {lastUpdated || "Jamais"}
              {dataSource && (
                <span className="data-source">
                  {dataSource === "api" ? " (Données live)" : 
                   dataSource === "cache" ? " (Données en cache)" : 
                   " (Données de secours)"}
                </span>
              )}
            </small>
          </div>

          <div className="filter-tabs-container">
            <div className="filter-tabs">
              <button
                className={`filter-tab ${selectedStatus === "all" ? "active" : ""}`}
                onClick={() => setSelectedStatus("all")}
              >
                Tous
              </button>
              <button
                className={`filter-tab ${selectedStatus === "I" ? "active" : ""}`}
                onClick={() => setSelectedStatus("I")}
              >
                En Attente
              </button>
              <button
                className={`filter-tab ${selectedStatus === "O" ? "active" : ""}`}
                onClick={() => setSelectedStatus("O")}
              >
                Approuvées
              </button>
              <button
                className={`filter-tab ${selectedStatus === "N" ? "active" : ""}`}
                onClick={() => setSelectedStatus("N")}
              >
                Refusées
              </button>
            </div>

            <div className="filter-toggle" onClick={toggleFilterExpand}>
              <FiFilter />
              <span>Filtres</span>
              <span className={`filter-count ${startDate && endDate ? "active" : ""}`}>
                {startDate && endDate ? 1 : 0}
              </span>
            </div>
          </div>

          <div className="search-bar-container">
            <div className="search-bar">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Rechercher par nom ou contenu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="stats-cards">
            <div className="stat-card total">
              <div className="stat-content">
                <h3>Total Demandes</h3>
                <p className="stat-value">{demandesData.conge.total}</p>
              </div>
              <div className="stat-icon">
                <FiFileText />
              </div>
            </div>

            <div className="stat-card pending">
              <div className="stat-content">
                <h3>En Attente</h3>
                <p className="stat-value">{demandesData.conge.pending}</p>
              </div>
              <div className="stat-icon">
                <FiClock />
              </div>
            </div>

            <div className="stat-card approved">
              <div className="stat-content">
                <h3>Approuvées</h3>
                <p className="stat-value">{demandesData.conge.approved}</p>
              </div>
              <div className="stat-icon">
                <FiCheck />
              </div>
            </div>
          </div>

          <div className={`filter-panel ${isFilterExpanded ? "expanded" : ""}`}>
            <div className="filter-options">
              <div className="filter-group">
                <label>Période</label>
                <div className="date-inputs">
                  <div className="date-input">
                    <FiCalendar className="date-icon" />
                    <input
                      type="date"
                      value={startDate || ""}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="Date de début"
                    />
                  </div>
                  <span className="date-separator">à</span>
                  <div className="date-input">
                    <FiCalendar className="date-icon" />
                    <input
                      type="date"
                      value={endDate || ""}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="Date de fin"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="filter-actions">
              <button className="clear-filters" onClick={clearFilters}>
                Effacer les filtres
              </button>
            </div>
          </div>

          <div className="results-summary">
            <p>
              <span className="results-count">{filteredDemandes.length}</span> demandes trouvées
            </p>
          </div>

          {filteredDemandes.length > 0 ? (
            <div className="table-container">
              <table className="demandes-table">
                <thead>
                  <tr>
                    <th>Date Demande</th>
                    <th>Nom</th>
                    <th>Période</th>
                    <th>Texte Demande</th>
                    <th>Jours utilisés</th>
                    <th>Fichier</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDemandes.map((demande) => (
                    <tr key={demande.id} onClick={() => openModal(demande)}>
                      <td>
                        <div className="cell-with-icon">
                          <FiCalendar className="cell-icon" />
                          <span>
                            {new Date(demande.dateDemande).toLocaleDateString()}
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
                        <div className="date-range-cell">
                          {demande.dateDebut && demande.dateFin ? (
                            <>
                              <div className="date-item">
                                <span className="date-label">Début:</span>
                                <span className="date-value">{new Date(demande.dateDebut).toLocaleDateString()}</span>
                              </div>
                              <div className="date-item">
                                <span className="date-label">Fin:</span>
                                <span className="date-value">{new Date(demande.dateFin).toLocaleDateString()}</span>
                              </div>
                            </>
                          ) : (
                            <span className="no-date">Non spécifiée</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="demande-text">
                          {demande.texteDemande || <span className="no-content">Aucun texte</span>}
                        </div>
                      </td>
                      <td>
                        <div className="simple-days-cell">
                          {usedDaysData[demande.matPers?.id] ? (
                            <div className="simple-days-content">
                              <div className="simple-days-text">
                                <span className="days-used">{usedDaysData[demande.matPers?.id].totalDaysUsed}</span>
                                <span className="days-separator">/</span>
                                <span className="days-total">{usedDaysData[demande.matPers?.id].maxDaysPerYear}</span>
                              </div>
                              <div className={`simple-days-remaining ${
                                demande.reponseChef === "O" ? "highlight-update" : ""
                              }`}>
                                {usedDaysData[demande.matPers?.id].remainingDays} jours restants
                              </div>
                            </div>
                          ) : (
                            <span className="simple-days-loading">...</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="file-actions-compact">
                          {demande.files && demande.files.length > 0 ? (
                            <>
                              {demande.files.map((file) => (
                                <div key={file.fileId} className="compact-action-buttons">
                                  <button
                                    className="icon-button view"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePreview(file.fileId);
                                    }}
                                    title="Aperçu"
                                  >
                                    <FiEye />
                                  </button>
                                  <button
                                    className="icon-button download"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownload(file.fileId, file.filename);
                                    }}
                                    title="Télécharger"
                                  >
                                    <FiDownload />
                                  </button>
                                </div>
                              ))}
                              
                              {previewFileId && (
                                <div className="preview-modal-overlay" onClick={() => setPreviewFileId(null)}>
                                  <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
                                    <div className="preview-header">
                                      <h4>Aperçu du fichier: {demande.files.find(f => f.fileId === previewFileId)?.filename || 'Document'}</h4>
                                      <div className="preview-actions">
                                        <button 
                                          className="download-in-preview"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownload(previewFileId, demande.files.find(f => f.fileId === previewFileId)?.filename);
                                          }}
                                        >
                                          <FiDownload /> Télécharger
                                        </button>
                                        <button 
                                          className="close-preview" 
                                          onClick={() => setPreviewFileId(null)}
                                        >
                                          <FiX />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="preview-iframe-container">
                                      <iframe
                                        src={previewFileUrl}
                                        title="File Preview"
                                        className="preview-iframe"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="empty-icon">-</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${
                          demande.reponseChef === "I" ? "pending" :
                          demande.reponseChef === "O" ? "approved" :
                          demande.reponseChef === "N" ? "rejected" : "processed"
                        }`}>
                          <span className="status-icon">
                            {demande.reponseChef === "I" ? <FiClock /> :
                             demande.reponseChef === "O" ? <FiCheck /> :
                             demande.reponseChef === "N" ? <FiX /> : <FiCheck />}
                          </span>
                          {demande.reponseChef === "I" ? "En attente" :
                           demande.reponseChef === "O" ? "Approuvé" :
                           demande.reponseChef === "N" ? "Rejeté" : "Traitée"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-button approve"
                            onClick={(e) => {
                              e.stopPropagation();
                              openActionModal(demande.id, "approve");
                            }}
                            disabled={demande.reponseChef !== "I"}
                            title={demande.reponseChef !== "I" ? "Déjà traitée" : "Approuver"}
                          >
                            <FiCheck />
                            <span>Approuver</span>
                          </button>
                          <button
                            className="action-button reject"
                            onClick={(e) => {
                              e.stopPropagation();
                              openActionModal(demande.id, "reject");
                            }}
                            disabled={demande.reponseChef !== "I"}
                            title={demande.reponseChef !== "I" ? "Déjà traitée" : "Rejeter"}
                          >
                            <FiX />
                            <span>Rejeter</span>
                          </button>
                        </div>
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
                Effacer les filtres
              </button>
            </div>
          )}

          {showObservationModal && (
            <div className="modal-overlay">
              <div className={`modal-content ${theme}`}>
                <h2>
                  {actionType === "approve" ? "Approuver la demande" : "Rejeter la demande"}
                </h2>
                <div className="form-group">
                  <label>
                    Observation {actionType === "approve" ? "(facultatif)" : "(obligatoire)"}
                  </label>
                  <textarea
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    placeholder={`Entrez votre observation ${actionType === "approve" ? "(optionnel)" : ""}`}
                    rows={4}
                  />
                </div>
                <div className="modal-actions">
                  <button 
                    className="cancel-button" 
                    onClick={closeActionModal}
                  >
                    Annuler
                  </button>
                  <button
                    className={`confirm-button ${actionType === "approve" ? "approve" : "reject"}`}
                    onClick={handleAction}
                    disabled={actionType === "reject" && !observation.trim()}
                  >
                    {actionType === "approve" ? "Confirmer" : "Rejeter"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {isModalOpen && selectedDemande && (
            <DemandeDetailsModal
              demande={selectedDemande}
              onClose={closeModal}
              onApprove={() => openActionModal(selectedDemande.id, "approve")}
              onReject={() => openActionModal(selectedDemande.id, "reject")}
              isActionable={selectedDemande.reponseChef === "I"}
              usedDaysData={usedDaysData[selectedDemande.matPers?.id] || null}
              theme={theme}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DemandesConge;