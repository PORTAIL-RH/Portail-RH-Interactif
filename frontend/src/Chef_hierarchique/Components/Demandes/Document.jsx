import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { FiSearch, FiFilter, FiCalendar, FiCheck, FiX, FiClock, FiRefreshCw, FiFileText, FiUpload,FiEye } from "react-icons/fi";
import "./Demandes.css";
import DemandeDetailsModal from "./DemandeDetailsModal";

const DemandesDocument = () => {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [filteredDemandes, setFilteredDemandes] = useState([]);
  const [uploadedResponseFiles, setUploadedResponseFiles] = useState({}); // State to store response files
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Fetch demandes on component mount
  const fetchDemandes = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");

      // Check if demande-document data is cached in localStorage
      const cachedDemandesDocument = localStorage.getItem("demandesDocument");
      if (cachedDemandesDocument) {
        const cachedData = JSON.parse(cachedDemandesDocument);
        setDemandes(cachedData);
        setLoading(false);
        return;
      }

      // Fetch demande-document from the API
      const response = await fetch("http://localhost:8080/api/demande-document", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Document request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // Cache the data in localStorage
      localStorage.setItem("demandesDocument", JSON.stringify(data));

      setDemandes(data);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDemandes();
  }, [fetchDemandes]);
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

  // Handle response file selection for a specific demande
  const handleResponseFileChange = (e, demandeId) => {
    const file = e.target.files[0];
    setUploadedResponseFiles((prevFiles) => ({
      ...prevFiles,
      [demandeId]: file, // Store the response file for the specific demande
    }));
  };

  // Handle approval with response file upload
  const handleConfirmer = async (demandeId) => {
    try {
      const token = localStorage.getItem("authToken");
      const responseFile = uploadedResponseFiles[demandeId];
  
      if (!responseFile) {
        alert("Veuillez téléverser un document réponse avant d'approuver la demande.");
        return;
      }
  
      // Step 1: Upload the file
      const formData = new FormData();
      formData.append("file", responseFile);
  
      console.log("Uploading file:", responseFile.name); // Debug: Log the file being uploaded
  
      const uploadResponse = await fetch("http://localhost:8080/api/upload", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Upload Error Response:", errorText); // Debug: Log the error response
        throw new Error("Erreur lors du téléversement du fichier réponse.");
      }
  
      const uploadResult = await uploadResponse.json();
      console.log("Upload Result:", uploadResult); // Debug: Log the upload result
  
      // Step 2: Create a Fichier_joint object
      const fichierJoint = {
        id: uploadResult.id,
        filename: responseFile.name,
        filePath: uploadResult.filePath,
        fileType: responseFile.type,
      };
  
      // Step 3: Approve the demande and attach the response file
      const endpoint = `http://localhost:8080/api/demande-document/valider/${demandeId}`;
  
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filesReponse: [fichierJoint],
        }),
      });
  
      if (response.ok) {
        alert("Demande confirmée avec succès");
  
        // Update the state without reloading the page
        setDemandes((prevDemandes) =>
          prevDemandes.map((demande) =>
            demande.id === demandeId
              ? {
                  ...demande,
                  reponseChef: "O",
                  filesReponse: [fichierJoint],
                }
              : demande
          )
        );
  
        // Update the cached data in localStorage
        const updatedDemandes = demandes.map((demande) =>
          demande.id === demandeId
            ? {
                ...demande,
                reponseChef: "O",
                filesReponse: [fichierJoint],
              }
            : demande
        );
        localStorage.setItem("demandesDocument", JSON.stringify(updatedDemandes));
      } else {
        const errorText = await response.text();
        alert(`Erreur: ${errorText}`);
      }
    } catch (error) {
      console.error("Error in handleConfirmer:", error);
      alert("Une erreur s'est produite lors de la confirmation de la demande.");
    }
  };
  // Handle rejection without requiring a file
  const handleRefuser = async (demandeId) => {
    try {
      const token = localStorage.getItem("authToken");

      const endpoint = `http://localhost:8080/api/demande-document/refuser/${demandeId}`;

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
            demande.id === demandeId ? { ...demande, reponseChef: "N" } : demande
          )
        );

        // Update the cached data in localStorage
        const updatedDemandes = demandes.map((demande) =>
          demande.id === demandeId ? { ...demande, reponseChef: "N" } : demande
        );
        localStorage.setItem("demandesDocument", JSON.stringify(updatedDemandes));
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
            <h1>Demandes de Documents</h1>
            <p>Gérez les demandes de Documents de vos collaborateurs</p>
          </div>

          {/* Search and Filter Bar */}
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
                    <th>Texte Demande</th>
                    <th>Statut</th>
                    <th>Document Réponse</th>
                    <th>Actions</th>
                    <th>view</th>
                  </tr>
                </thead>
                <tbody>
                {filteredDemandes.map((demande) => (
  <tr key={demande.id || demande.id_libre_demande}>
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
      {/* Upload response document */}
      <div className={`file-input-container ${demande.reponseChef !== "I" ? "disabled-section" : ""}`}>
        <label
          htmlFor={`response-file-upload-${demande.id}`}
          className={`file-upload-label ${demande.reponseChef !== "I" ? "disabled-label" : ""}`}
        >
          <FiUpload /> Choisir un fichier réponse
        </label>
        <input
          id={`response-file-upload-${demande.id}`}
          type="file"
          onChange={(e) => handleResponseFileChange(e, demande.id)}
          accept=".pdf,.doc,.docx"
          style={{ display: "none" }}
          disabled={demande.reponseChef !== "I"} // Disable if status is not "I"
        />
        {uploadedResponseFiles[demande.id] && (
          <span className="file-name">{uploadedResponseFiles[demande.id].name}</span>
        )}
      </div>
    </td>
    <td>
      <div className="action-buttons">
        <button
          className={`action-button approve ${demande.reponseChef !== "I" ? "disabled-button" : ""}`}
          onClick={() => handleConfirmer(demande.id)}
          disabled={demande.reponseChef !== "I" || !uploadedResponseFiles[demande.id]} // Disable if status is not "I" or no response file is uploaded
          title={
            demande.reponseChef !== "I"
              ? "Action non disponible"
              : !uploadedResponseFiles[demande.id]
              ? "Veuillez téléverser un document réponse avant d'approuver"
              : "Approuver cette demande"
          }
        >
          <FiCheck /> Approuver
        </button>
        <button
          className={`action-button reject ${demande.reponseChef !== "I" ? "disabled-button" : ""}`}
          onClick={() => handleRefuser(demande.id)}
          disabled={demande.reponseChef !== "I"} // Disable if status is not "I"
          title={demande.reponseChef !== "I" ? "Action non disponible" : "Rejeter cette demande"}
        >
          <FiX /> Rejeter
        </button>
      </div>
    </td>
    <td>
      {/* Add onClick to the "View" button only */}
      <button
        className="action-button view"
        onClick={() => openModal(demande)} // Open modal only when this button is clicked
        title="Voir les détails"
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
                Effacer les filtres
              </button>
            </div>
          )}
                    {/* Modal for Demande Details */}
                    {isModalOpen  && (
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

export default DemandesDocument;