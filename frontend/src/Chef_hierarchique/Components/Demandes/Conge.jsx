import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { FiSearch, FiFilter, FiCalendar, FiCheck, FiX, FiClock, FiRefreshCw, FiFileText } from "react-icons/fi";
import "./Demandes.css";
import DemandeDetailsModal from "./DemandeDetailsModal";

const DemandesConge = () => {
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

  // Memoize fetchDemandes with useCallback
  const fetchDemandes = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");

      // Check if demande-conge data is cached in localStorage
      const cachedDemandesConge = localStorage.getItem("demandesConge");
      if (cachedDemandesConge) {
        const cachedData = JSON.parse(cachedDemandesConge);
        setDemandes(cachedData);
        setLoading(false);
        return;
      }

      // Fetch demande-conge from the API
      const response = await fetch("http://localhost:8080/api/demande-conge", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Conge request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // Cache the data in localStorage
      localStorage.setItem("demandesConge", JSON.stringify(data));

      setDemandes(data);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  }, []);

  // Fetch demandes on component mount
  useEffect(() => {
    fetchDemandes();
  }, [fetchDemandes]);

  // Filter demandes based on search, status, and date range
  useEffect(() => {
    let filtered = demandes;

    // Filter by search query (search in name and texteDemande)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (demande) =>
          (demande.matPers?.nom && demande.matPers.nom.toLowerCase().includes(query)) ||
          (demande.texteDemande && demande.texteDemande.toLowerCase().includes(query))
      );
    }
    
    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter((demande) => demande.reponseChef === selectedStatus);
    }

    // Filter by date range (using dateDemande)
    if (startDate && endDate) {
      filtered = filtered.filter((demande) => {
        const demandeDate = new Date(demande.dateDemande);
        return demandeDate >= new Date(startDate) && demandeDate <= new Date(endDate);
      });
    }

    setFilteredDemandes(filtered);
  }, [selectedStatus, startDate, endDate, demandes, searchQuery]);

  // Function to handle confirmation (approval) of a demande
  const handleConfirmer = async (demandeId) => {
    try {
      const token = localStorage.getItem("authToken");

      const endpoint = `http://localhost:8080/api/demande-conge/valider/${demandeId}`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert("Demande confirmée avec succès");

        // Update the state without reloading the page
        setDemandes((prevDemandes) =>
          prevDemandes.map((demande) =>
            demande.id === demandeId
              ? { ...demande, reponseChef: "O" } // Update status to "O" (approved)
              : demande
          )
        );

        // Update the cached data in localStorage
        const updatedDemandes = demandes.map((demande) =>
          demande.id === demandeId ? { ...demande, reponseChef: "O" } : demande
        );
        localStorage.setItem("demandesConge", JSON.stringify(updatedDemandes));
      } else {
        const errorText = await response.text();
        alert(`Erreur: ${errorText}`);
      }
    } catch (error) {
      alert("Une erreur s'est produite lors de la confirmation de la demande.");
    }
  };

  // Function to handle rejection of a demande
  const handleRefuser = async (demandeId) => {
    try {
      const token = localStorage.getItem("authToken");

      const endpoint = `http://localhost:8080/api/demande-conge/refuser/${demandeId}`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert("Demande refusée avec succès");

        // Update the state without reloading the page
        setDemandes((prevDemandes) =>
          prevDemandes.map((demande) =>
            demande.id === demandeId
              ? { ...demande, reponseChef: "N" } // Update status to "N" (rejected)
              : demande
          )
        );

        // Update the cached data in localStorage
        const updatedDemandes = demandes.map((demande) =>
          demande.id === demandeId ? { ...demande, reponseChef: "N" } : demande
        );
        localStorage.setItem("demandesConge", JSON.stringify(updatedDemandes));
      } else {
        const errorText = await response.text();
        alert(`Erreur: ${errorText}`);
      }
    } catch (error) {
      alert("Une erreur s'est produite lors du refus de la demande.");
    }
  };

  // Function to open the modal with the selected demande
  const openModal = (demande) => {
    setSelectedDemande(demande);
    setIsModalOpen(true);
  };

  // Function to close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDemande(null);
  };

  // Function to toggle filter panel visibility
  const toggleFilterExpand = () => {
    setIsFilterExpanded((prev) => !prev);
  };

  // Function to clear all filters
  const clearFilters = () => {
    setSelectedStatus("all");
    setStartDate(null);
    setEndDate(null);
    setSearchQuery("");
  };
  useEffect(() => {
    const eventSource = new EventSource("http://localhost:8080/sse/updates");
  
    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data);
      const { type, data } = update;
  
      console.log("Received update:", type, data); // Debugging
  
      // Refresh data based on the update type
      switch (type) {
        case "created":
        case "updated":
        case "deleted":
          fetchDemandes(); // Refresh the demandes list
          break;
        default:
          console.warn("Unknown update type:", type);
      }
    };
  
    eventSource.onerror = (error) => {
      console.error("EventSource failed:", error);
      eventSource.close();
    };
  
    return () => {
      eventSource.close(); // Cleanup on component unmount
    };
  }, [fetchDemandes]);
  if (loading) {
    return (
      <div className="app-container">
        <Sidebar />
        <div className="demandes-container">
          <Navbar />
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
      <div className="app-container">
        <Sidebar />
        <div className="demandes-container">
          <Navbar />
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
    <div className="app-container">
      <Sidebar />
      <div className="demandes-container">
        <Navbar />
        <div className="demandes-content">
          <div className="page-header">
            <h1>Demandes de Conges</h1>
            <p>Gérez les demandes de Conges de vos collaborateurs</p>
          </div>

          {/* Modern Search and Filter Bar */}
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

            {/* Filter Toggle Button */}
            <div className="filter-toggle" onClick={toggleFilterExpand}>
              <FiFilter />
              <span>Filtres</span>
              <span className={`filter-count ${startDate && endDate ? "active" : ""}`}>
                {startDate && endDate ? 1 : 0}
              </span>
            </div>
          </div>

          {/* Search Bar */}
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

          {/* Stats Cards */}
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

          {/* Expandable Filter Panel */}
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

          {/* Results Summary */}
          <div className="results-summary">
            <p>
              <span className="results-count">{filteredDemandes.length}</span> demandes trouvées
            </p>
          </div>

          {/* Demandes Table */}
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
                              e.stopPropagation(); // Prevent row click event
                              handleConfirmer(demande.id);
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
                              e.stopPropagation(); // Prevent row click event
                              handleRefuser(demande.id);
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

          {/* Modal for Demande Details */}
          {isModalOpen && selectedDemande && (
            <DemandeDetailsModal
              demande={selectedDemande}
              onClose={closeModal}
              onApprove={() => handleConfirmer(selectedDemande.id)}
              onReject={() => handleRefuser(selectedDemande.id)}
              isActionable={selectedDemande.reponseChef === "I"}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DemandesConge;