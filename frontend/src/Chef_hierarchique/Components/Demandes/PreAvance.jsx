import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { FiSearch, FiFilter, FiCalendar, FiCheck, FiX, FiClock, FiRefreshCw, FiFileText } from "react-icons/fi";
import "./Demandes.css";
import DemandeDetailsModal from "./DemandeDetailsModal";
import { API_URL } from "../../../config"

const DemandesPreAvance = () => {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredDemandes, setFilteredDemandes] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const [observation, setObservation] = useState("");
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [currentDemandeId, setCurrentDemandeId] = useState(null);

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

  const fetchDemandes = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");

      localStorage.removeItem("demandesAutorisation");

      if (!userId) {
        throw new Error("User ID not found in localStorage");
      }

      const response = await fetch(
        `${API_URL}/api/demande-pre-avance/collaborateurs-by-service/${userId}`,
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
      
      setDemandes(demandesFromResponse);
      setFilteredDemandes(demandesFromResponse);
      setLoading(false);
    } catch (error) {
      console.error("Fetch error:", error);
      setError(error.message || "An unknown error occurred");
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDemandes();
  }, [fetchDemandes]);

  useEffect(() => {
    const eventSource = new EventSource(`${API_URL}/api/sse/updates`);
  
    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data);
      const { type } = update;
  
      if (type === "created" || type === "updated" || type === "deleted") {
        fetchDemandes();
      }
    };
  
    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      eventSource.close();
    };
  
    return () => {
      eventSource.close();
    };
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

  const handleAction = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const url = actionType === "approve" 
        ? `${API_URL}/api/demande-pre-avance/valider/${currentDemandeId}`
        : `${API_URL}/api/demande-pre-avance/refuser/${currentDemandeId}`;

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

      setDemandes(prev => prev.map(d => 
        d.id === currentDemandeId ? { 
          ...d, 
          reponseChef: actionType === "approve" ? "O" : "N",
          observation: observation 
        } : d
      ));

      closeActionModal();
      
    } catch (error) {
      console.error("Action error:", error);
      alert(`Error: ${error.message}`);
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

  const toggleFilterExpand = () => {
    setIsFilterExpanded((prev) => !prev);
  };

  const clearFilters = () => {
    setSelectedStatus("all");
    setStartDate(null);
    setEndDate(null);
    setSearchQuery("");
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
      <Sidebar theme={theme} />
      <div className="demandes-container">
        <Navbar theme={theme} toggleTheme={toggleTheme}/>
        <div className="demandes-content">
          <div className="page-header">
            <h1>Demandes de Pre-Avance</h1>
            <p>Gérez les demandes de Pre-Avance de vos collaborateurs</p>
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
                <p className="stat-value">{demandes.length}</p>
              </div>
              <div className="stat-icon">
                <FiFileText />
              </div>
            </div>

            <div className="stat-card pending">
              <div className="stat-content">
                <h3>En Attente</h3>
                <p className="stat-value">{demandes.filter((d) => d.reponseChef === "I").length}</p>
              </div>
              <div className="stat-icon">
                <FiClock />
              </div>
            </div>

            <div className="stat-card approved">
              <div className="stat-content">
                <h3>Approuvées</h3>
                <p className="stat-value">{demandes.filter((d) => d.reponseChef === "O").length}</p>
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
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDemandes.map((demande) => (
                    <tr key={demande.id || demande.id_libre_demande} onClick={() => openModal(demande)}>
                      <td>
                        <div className="cell-with-icon">
                          <FiCalendar className="cell-icon" />
                          <span>
                            {demande.dateDemande ? new Date(demande.dateDemande).toLocaleDateString() : "Inconnu"}
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
                          ) : demande.dateDebut ? (
                            <span>{new Date(demande.dateDebut).toLocaleDateString()}</span>
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
                        <span
                          className={`status-badge ${
                            demande.reponseChef === "I"
                              ? "pending"
                              : demande.reponseChef === "O"
                              ? "approved"
                              : demande.reponseChef === "N"
                              ? "rejected"
                              : "processed"
                          }`}
                        >
                          <span className="status-icon">
                            {demande.reponseChef === "I" ? (
                              <FiClock />
                            ) : demande.reponseChef === "O" ? (
                              <FiCheck />
                            ) : demande.reponseChef === "N" ? (
                              <FiX />
                            ) : (
                              <FiCheck />
                            )}
                          </span>
                          {demande.reponseChef === "I"
                            ? "En attente"
                            : demande.reponseChef === "O"
                            ? "Approuvé"
                            : demande.reponseChef === "N"
                            ? "Rejeté"
                            : "Traitée"}
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
                            title={
                              demande.reponseChef !== "I"
                                ? "Cette demande a déjà été traitée"
                                : "Approuver cette demande"
                            }
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
                            title={
                              demande.reponseChef !== "I" ? "Cette demande a déjà été traitée" : "Rejeter cette demande"
                            }
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

          {/* Observation Modal */}
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
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DemandesPreAvance;