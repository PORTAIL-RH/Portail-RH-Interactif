import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { FiSearch, FiFilter, FiCalendar, FiCheck, FiX, FiClock, FiRefreshCw, FiFileText, FiEye, FiDownload } from "react-icons/fi";
import "./Demandes.css";
import DemandeDetailsModal from "./DemandeDetailsModal";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { API_URL } from "../../../config";

const POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

const DemandesFormation = () => {
  // State initialization
  const [demandesData, setDemandesData] = useState({
    formation: { data: [], total: 0, approved: 0, pending: 0 },
    timestamp: 0
  });

  const [demandes, setDemandes] = useState([]);
  const [filteredDemandes, setFilteredDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [previewFileId, setPreviewFileId] = useState(null);
  const [previewFileUrl, setPreviewFileUrl] = useState(null);
  const [lastUpdated, setLastUpdated] = useState("");
  const [dataSource, setDataSource] = useState("");
  const [nextRefresh, setNextRefresh] = useState("");
  const [services, setServices] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Helper functions
  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserInfo = useCallback(() => {
    try {
      const userData = localStorage.getItem("userData");
      if (!userData) return null;
      
      const parsed = JSON.parse(userData);
      setCurrentUser(parsed);
      
      const storedServices = localStorage.getItem("services");
      if (storedServices) {
        const servicesData = JSON.parse(storedServices);
        setServices(servicesData);
      }
      
      return parsed;
    } catch (e) {
      console.error("Error reading user info:", e);
      return null;
    }
  }, []);

  const getUserPoidForDemande = useCallback((demande) => {
    if (!services || services.length === 0) return 0;
    
    const demandeServiceName = demande.matPers?.service;
    if (!demandeServiceName) return 0;
    
    const demandeService = services.find(s => 
      s.serviceName.toLowerCase() === demandeServiceName.toLowerCase()
    );
    
    if (!demandeService) {
      console.warn(`Service not found: ${demandeServiceName}`);
      return 0;
    }

    return demandeService.poid || 0;
  }, [services]);

  const getUserPositionName = (poid) => {
    switch(poid) {
      case 1: return "Chef 1";
      case 2: return "Chef 2";
      case 3: return "Chef 3";
      default: return "Non chef";
    }
  };

  const getCurrentUserResponse = (demande) => {
    if (!demande.reponseChef) return "I";
    
    const currentPoid = getUserPoidForDemande(demande);
    switch(currentPoid) {
      case 1: return demande.reponseChef.responseChef1 || "I";
      case 2: return demande.reponseChef.responseChef2 || "I";
      case 3: return demande.reponseChef.responseChef3 || "I";
      default: return "I";
    }
  };

  const canValidateDemande = (demande) => {
    const currentPoid = getUserPoidForDemande(demande);
    
    // If user is not authorized
    if (!currentPoid || currentPoid === 0) return false;

    // If no response object exists, chef can respond
    if (!demande.reponseChef) return true;

    // Check only the field for current chef's poid
    const responseField = `responseChef${currentPoid}`;
    return demande.reponseChef[responseField] === "I";
  };

  const renderUserSpecificStatus = (demande) => {
    const currentPoid = getUserPoidForDemande(demande);
    const userResponse = getCurrentUserResponse(demande);
    
    if (userResponse === "O") {
      return (
        <span className="status-badge approved">
          <FiCheck className="status-icon" />
          Approuvée (Chef {currentPoid})
        </span>
      );
    }
    
    if (userResponse === "N") {
      return (
        <span className="status-badge rejected">
          <FiX className="status-icon" />
          Rejetée (Chef {currentPoid})
        </span>
      );
    }

    return (
      <span className="status-badge pending">
        <FiClock className="status-icon" />
        En attente (Chef {currentPoid})
      </span>
    );
  };

  // Data fetching
  const fetchFromAPI = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      const userInfo = getUserInfo();

      if (!userInfo) {
        throw new Error("User info not found");
      }

      const response = await fetch(
        `${API_URL}/api/demande-formation/collaborateurs-by-service/${userInfo.id}`,
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

      const demandesFromResponse = (Array.isArray(data.demandes) ? data.demandes : []).map(demande => ({
        ...demande,
        files: demande.files?.map(file => ({
          ...file,
          fileId: file.fileId || file.id
        })) || []
      }));

      const processedData = {
        data: demandesFromResponse,
        total: demandesFromResponse.length,
        approved: demandesFromResponse.filter(d => d.reponseChef && 
          (d.reponseChef.responseChef1 === "O" || 
           d.reponseChef.responseChef2 === "O" || 
           d.reponseChef.responseChef3 === "O")).length,
        pending: demandesFromResponse.filter(d => !d.reponseChef || 
          (d.reponseChef.responseChef1 === "I" && 
           d.reponseChef.responseChef2 === "I" && 
           d.reponseChef.responseChef3 === "I")).length
      };

      return processedData;
    } catch (error) {
      console.error("API fetch error:", error);
      throw error;
    }
  }, [getUserInfo]);

const fetchDemandes = useCallback(async (isBackgroundRefresh = false) => {
  if (!isBackgroundRefresh) setLoading(true);
  setError(null);

  try {
    // 1. FIRST check localStorage (strict localStorage-first approach)
    const cachedData = JSON.parse(localStorage.getItem("demandes") || "{}");
    
    // 2. If formation data exists in localStorage
    if (cachedData.formation?.data && Array.isArray(cachedData.formation.data)) {
      // Use cached data immediately
      setDemandesData(cachedData);
      setDemandes(cachedData.formation.data);
      setFilteredDemandes(cachedData.formation.data);
      setLastUpdated(new Date(cachedData.timestamp).toLocaleTimeString());
      setDataSource("cache");

      // 3. ONLY if no data in localStorage, fetch from API
      if (!isBackgroundRefresh && cachedData.formation.data.length === 0) {
        try {
          const apiData = await fetchFromAPI();
          
          // Update ONLY formation data while preserving others
          const newData = {
            ...cachedData, // Preserve other demand types
            formation: {
              data: apiData.data || [],
              total: apiData.data?.length || 0,
              approved: apiData.approved || 0,
              pending: apiData.pending || 0
            },
            timestamp: Date.now()
          };

          localStorage.setItem("demandes", JSON.stringify(newData));
          
          setDemandesData(newData);
          setDemandes(apiData.data || []);
          setFilteredDemandes(apiData.data || []);
          setDataSource("api");
          setLastUpdated(new Date().toLocaleTimeString());
        } catch (apiError) {
          console.error("API fetch failed:", apiError);
          // Continue with empty cached data
        }
      }
      return;
    }

    // 4. If NO formation data in localStorage at all, fetch from API
    const apiData = await fetchFromAPI();
    const newData = {
      ...cachedData, // Preserve any existing other demand types
      formation: {
        data: apiData.data || [],
        total: apiData.data?.length || 0,
        approved: apiData.approved || 0,
        pending: apiData.pending || 0
      },
      timestamp: Date.now()
    };
    
    localStorage.setItem("demandes", JSON.stringify(newData));
    
    setDemandesData(newData);
    setDemandes(apiData.data || []);
    setFilteredDemandes(apiData.data || []);
    setDataSource("api");
    setLastUpdated(new Date().toLocaleTimeString());

  } catch (error) {
    console.error("Fetch error:", error);
    if (!isBackgroundRefresh) {
      setError(error.message || "Erreur de chargement");
      
      // Fallback to empty state if no cache
      const fallback = JSON.parse(localStorage.getItem("demandes") || "{}");
      setDemandesData(fallback);
      setDemandes(fallback.formation?.data || []);
      setFilteredDemandes(fallback.formation?.data || []);
      setDataSource("cache-fallback");
    }
  } finally {
    if (!isBackgroundRefresh) setLoading(false);
  }
}, [fetchFromAPI]);

  // Action handlers
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
  const toastId = toast.loading(
    actionType === "approve" ? "Validation..." : "Refus...",
    { autoClose: false }
  );

  try {
    // 1. Get current demande
    const currentDemande = demandes.find(d => d.id_libre_demande === currentDemandeId);
    if (!currentDemande) throw new Error("Demande introuvable");

    // 2. Check permissions
    const currentPoid = getUserPoidForDemande(currentDemande);
    if (!currentPoid) throw new Error("Non autorisé");

    // 3. Make API call
    const response = await fetch(
      `${API_URL}/api/demande-formation/${
        actionType === "approve" ? "valider" : "refuser"
      }/${currentDemandeId}`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          observation: observation || "Action effectuée"
        })
      }
    );

    if (!response.ok) throw new Error(await response.text());

    // 4. Update LOCAL state only after successful API call
    const updatedDemandes = demandes.map(d => {
      if (d.id_libre_demande !== currentDemandeId) return d;
      
      return {
        ...d,
        reponseChef: {
          ...d.reponseChef,
          [`responseChef${currentPoid}`]: actionType === "approve" ? "O" : "N",
          [`observationChef${currentPoid}`]: observation || ""
        }
      };
    });

    // 5. Update localStorage while preserving other demand types
    const existingData = JSON.parse(localStorage.getItem("demandes") || "{}");
    const updatedData = {
      ...existingData,
      formation: {
        ...existingData.formation,
        data: updatedDemandes,
        // Update counts
        approved: updatedDemandes.filter(d => 
          d.reponseChef?.responseChef1 === "O" ||
          d.reponseChef?.responseChef2 === "O" ||
          d.reponseChef?.responseChef3 === "O"
        ).length,
        pending: updatedDemandes.filter(d => 
          !d.reponseChef || (
            d.reponseChef.responseChef1 === "I" &&
            d.reponseChef.responseChef2 === "I" &&
            d.reponseChef.responseChef3 === "I"
          )
        ).length
      },
      timestamp: Date.now()
    };

    localStorage.setItem("demandes", JSON.stringify(updatedData));

    // 6. Update state
    setDemandesData(updatedData);
    setDemandes(updatedDemandes);
    setFilteredDemandes(updatedDemandes);

    // 7. Close modal
    closeActionModal();
    toast.update(toastId, {
      render: `Demande ${actionType === "approve" ? "approuvée" : "rejetée"}`,
      type: "success",
      autoClose: 3000
    });

  } catch (error) {
    toast.update(toastId, {
      render: error.message || "Erreur",
      type: "error",
      autoClose: 5000
    });
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

  const renderActionButtons = (demande) => {
    const currentPoid = getUserPoidForDemande(demande);
    const canValidate = canValidateDemande(demande);
    
    return (
      <div className="action-buttons">
        <button
          className={`action-button approve ${!canValidate ? 'disabled' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (canValidate) {
              openActionModal(demande.id_libre_demande, "approve");
            } else {
              const response = getCurrentUserResponse(demande);
              toast.info(
                response === "I" 
                  ? "Non autorisé" 
                  : "Vous avez déjà répondu à cette demande",
                { className: 'info-toast' }
              );
            }
          }}
          title={
            !canValidate 
              ? (getCurrentUserResponse(demande) === "I" 
                  ? "Non autorisé" 
                  : "Vous avez déjà répondu")
              : "Approuver"
          }
        >
          <FiCheck />
          <span>Approuver</span>
        </button>
        <button
          className={`action-button reject ${!canValidate ? 'disabled' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (canValidate) {
              openActionModal(demande.id_libre_demande, "reject");
            } else {
              const response = getCurrentUserResponse(demande);
              toast.info(
                response === "I" 
                  ? "Non autorisé" 
                  : "Vous avez déjà répondu à cette demande",
                { className: 'info-toast' }
              );
            }
          }}
          title={
            !canValidate 
              ? (getCurrentUserResponse(demande) === "I" 
                  ? "Non autorisé" 
                  : "Vous avez déjà répondu")
              : "Rejeter"
          }
        >
          <FiX />
          <span>Rejeter</span>
        </button>
      </div>
    );
  };

  // ... (keep all other existing functions like openModal, closeModal, fetchFileBlobUrl, etc.)

  // Effects
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.add(savedTheme);
    document.body.className = savedTheme;

    const handleStorageChange = () => {
      const currentTheme = localStorage.getItem("theme") || "light";
      setTheme(currentTheme);
      document.documentElement.className = currentTheme;
      document.body.className = currentTheme;
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("themeChanged", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("themeChanged", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    getUserInfo();
    fetchDemandes();

    // Set up polling interval (5 minutes)
    const pollingInterval = setInterval(() => {
      fetchDemandes(true);
    }, POLLING_INTERVAL);

    // Update next refresh time display
    const updateNextRefreshTime = () => {
      const next = new Date(Date.now() + POLLING_INTERVAL);
      setNextRefresh(next.toLocaleTimeString());
    };

    // Initial update
    updateNextRefreshTime();

    // Set up interval to update the display
    const refreshDisplayInterval = setInterval(updateNextRefreshTime, 60000);

    // Cleanup function
    return () => {
      clearInterval(pollingInterval);
      clearInterval(refreshDisplayInterval);
    };
  }, [getUserInfo, fetchDemandes]);

  useEffect(() => {
    const eventSource = new EventSource(`${API_URL}/api/sse/updates`);

    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data);
      if (update.type === "created" || update.type === "updated" || update.type === "deleted") {
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
          (demande.matPers?.nomComplet && demande.matPers.nomComplet.toLowerCase().includes(query)) ||
          (demande.texteDemande && demande.texteDemande.toLowerCase().includes(query)) ||
          (demande.titre?.titre && demande.titre.titre.toLowerCase().includes(query)) ||
          (demande.theme?.theme && demande.theme.theme.toLowerCase().includes(query))
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((demande) => {
        const userResponse = getCurrentUserResponse(demande);
        return userResponse === selectedStatus;
      });
    }

    if (startDate && endDate) {
      filtered = filtered.filter((demande) => {
        const demandeDate = new Date(demande.dateDemande);
        return demandeDate >= new Date(startDate) && demandeDate <= new Date(endDate);
      });
    }

    setFilteredDemandes(filtered);
  }, [selectedStatus, startDate, endDate, demandes, searchQuery]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.className = newTheme;
    document.body.className = newTheme;
    localStorage.setItem("theme", newTheme);
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }));
  };

  const toggleFilterExpand = () => {
    setIsFilterExpanded((prev) => !prev);
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSearchQuery("");
    setSelectedStatus("all");
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
              <h1>Demandes de Formation</h1>
              
            </div>
            <p>Gérez les demandes de formation de vos collaborateurs</p>
            
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
                Rejetées
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


          <div className="stats-cards">
            <div className="stat-card total">
              <div className="stat-content">
                <h3>Total Demandes</h3>
                <p className="stat-value">{demandesData.formation.total}</p>
              </div>
              <div className="stat-icon">
                <FiFileText />
              </div>
            </div>

            <div className="stat-card pending">
              <div className="stat-content">
                <h3>En Attente</h3>
                <p className="stat-value">
                  {demandes.filter(d => getCurrentUserResponse(d) === "I").length}
                </p>
              </div>
              <div className="stat-icon">
                <FiClock />
              </div>
            </div>

            <div className="stat-card approved">
              <div className="stat-content">
                <h3>Approuvées</h3>
                <p className="stat-value">
                  {demandes.filter(d => getCurrentUserResponse(d) === "O").length}
                </p>
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
                    <th>Titre Formation</th>
                    <th>Type Formation</th>
                    <th>Thème Formation</th>
                    <th>Période</th>
                    <th>Fichier</th>
                    <th>Votre Position</th>
                    <th>Votre Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDemandes.map((demande) => (
                    <tr key={demande.id_libre_demande} onClick={() => openModal(demande)}>
                      <td>
                        <div className="cell-with-icon">
                          <FiCalendar className="cell-icon" />
                          <span>
                            {formatDateTime(demande.dateDemande)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="employee-info">
                          <span className="employee-name">
                            {demande.matPers?.matricule || "Inconnu"}
                          </span>
                          {demande.matPers?.service && (
                            <span className="employee-details">
                              {demande.matPers?.service}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="demande-title">
                          {demande.titre?.titre || "Sans titre"}
                        </div>
                      </td>
                      <td>
                        <div className="demande-type">
                          {demande.type?.type || "Non spécifié"}
                        </div>
                      </td>
                      <td>
                        <div className="demande-theme">
                          {demande.theme?.theme || "Non spécifié"}
                        </div>
                      </td>
                      <td>
                        <div className="date-range-cell">
                          {demande.dateDebut ? (
                            <>
                              <div className="date-item">
                                <span className="date-label">Début:</span>
                                <span className="date-value">
                                  {new Date(demande.dateDebut).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                              <div className="date-item">
                                <span className="date-label">Durée:</span>
                                <span className="date-value">
                                  {demande.nbrJours} jour{demande.nbrJours > 1 ? 's' : ''}
                                </span>
                              </div>
                            </>
                          ) : (
                            <span className="no-date">Non spécifiée</span>
                          )}
                        </div>
                      </td>
                      <td className="file-actions">
                        {demande.files?.length > 0 ? (
                          <div className="file-buttons">
                            {demande.files.map((file, index) => (
                              <React.Fragment key={file.id}>
                                <button
                                  className="btn-preview"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePreview(file.fileId);
                                  }}
                                  title={`Aperçu: ${file.filename}`}
                                >
                                  <FiEye />
                                </button>
                                <button
                                  className="btn-download"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(file.fileId, file.filename);
                                  }}
                                  title={`Télécharger: ${file.filename}`}
                                >
                                  <FiDownload />
                                </button>
                                {index < demande.files.length - 1 && <span className="file-separator">|</span>}
                              </React.Fragment>
                            ))}
                          </div>
                        ) : (
                          <span>Aucun fichier</span>
                        )}
                      </td>
                      <td>
                        <span className="position-badge">
                          {getUserPositionName(getUserPoidForDemande(demande))}
                        </span>
                      </td>
                      <td>
                        {renderUserSpecificStatus(demande)}
                      </td>
                      <td>
                        {renderActionButtons(demande)}
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
                    placeholder={
                      actionType === "approve" 
                        ? "Entrez votre observation (optionnel)" 
                        : "Entrez la raison du refus (obligatoire)"
                    }
                    rows={4}
                    required={actionType === "reject"}
                  />
                  {actionType === "reject" && !observation.trim() && (
                    <p className="error-message">Une observation est obligatoire pour le refus</p>
                  )}
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
                    }}
                  >
                    <FiX />
                  </button>
                </div>
                <div className="file-preview-container">
                  <iframe 
                    src={previewFileUrl} 
                    title="Aperçu du fichier"
                    className="file-iframe"
                  />
                </div>
                <div className="file-preview-footer">
                  <button 
                    className="btn-download"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = previewFileUrl;
                      link.download = "document.pdf";
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
          onClose={closeModal}
          onApprove={() => openActionModal(selectedDemande.id_libre_demande, "approve")}
          onReject={() => openActionModal(selectedDemande.id_libre_demande, "reject")}
          isActionable={canValidateDemande(selectedDemande)}
          theme={theme}
          userPoid={getUserPoidForDemande(selectedDemande)}
          type="formation" // Add this to distinguish between demande types
        />
      )}
        </div>
      </div>
      <ToastContainer 
        position="top-right"
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
    </div>
  );
};

export default DemandesFormation;