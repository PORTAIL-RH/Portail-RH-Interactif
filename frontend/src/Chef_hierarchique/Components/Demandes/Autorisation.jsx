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

const DemandesAutorisation = () => {
  // State initialization
  const [demandesData, setDemandesData] = useState({
    autorisation: { data: [], total: 0, approved: 0, pending: 0 },
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

  const formatTime = (hours, minutes) => {
    const h = hours?.toString().padStart(2, '0') || '00';
    const m = minutes?.toString().padStart(2, '0') || '00';
    return `${h}:${m}`;
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
        `${API_URL}/api/demande-autorisation/collaborateurs-by-service/${userInfo.id}`,
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
    actionType === "approve" ? "Validation en cours..." : "Refus en cours...",
    { autoClose: false }
  );

  try {
    // 1. Authentication
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("Session expirée - Veuillez vous reconnecter");

    const userId = localStorage.getItem("userId");
    if (!userId) throw new Error("Utilisateur non identifié");

    // 2. Find current demande
    const currentDemande = demandes.find(d => d.id === currentDemandeId);
    if (!currentDemande) throw new Error("Demande introuvable");

    // 3. Check permission level
    const currentPoid = getUserPoidForDemande(currentDemande);
    if (!currentPoid || currentPoid === 0) throw new Error("Action non autorisée");

    // 4. Check appropriate response field
    const chefResponseField = `responseChef${currentPoid}`;
    const currentUserResponse = currentDemande.reponseChef?.[chefResponseField] || "I";

    if (currentUserResponse !== "I") {
      throw new Error(`Vous avez déjà ${currentUserResponse === "O" ? "approuvé" : "refusé"} cette demande`);
    }

    // 5. Observation validation for rejections
    if (actionType === "reject" && (!observation || !observation.trim())) {
      throw new Error("Une observation est obligatoire pour le refus");
    }

    // 6. Prepare request
    const endpoint = actionType === "approve" ? "valider" : "refuser";
    const url = `${API_URL}/api/demande-autorisation/${endpoint}/${currentDemandeId}?chefId=${userId}`;

    const requestBody = {
      observation: observation?.trim() ||
        (actionType === "approve"
          ? `Validation par ${getUserPositionName(currentPoid)}`
          : "Refus sans motif spécifié")
    };

    // 7. API call
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    const responseData = await response.json();

    // 8. Local update preserving all data types
    const now = new Date().toISOString();
    const updatedDemandes = demandes.map(d => {
      if (d.id !== currentDemandeId) return d;

      const updatedResponse = {
        ...d.reponseChef,
        [chefResponseField]: actionType === "approve" ? "O" : "N",
        [`dateChef${currentPoid}`]: now,
        [`observationChef${currentPoid}`]: requestBody.observation
      };

      return {
        ...d,
        reponseChef: updatedResponse,
      };
    });

    // 9. Merge with existing localStorage cache safely, preserving other demand types
    const existingCache = JSON.parse(localStorage.getItem("demandes") || "{}");

    const updatedCache = {
      ...existingCache, // Preserve other demand types (formation, conge, etc.)
      autorisation: {
        ...existingCache.autorisation, // Preserve other autorisation metadata
        data: updatedDemandes,
        total: updatedDemandes.length,
        approved: updatedDemandes.filter(d =>
          d.reponseChef?.responseChef1 === "O" ||
          d.reponseChef?.responseChef2 === "O" ||
          d.reponseChef?.responseChef3 === "O"
        ).length,
        pending: updatedDemandes.filter(d =>
          d.reponseChef?.responseChef1 === "I" &&
          d.reponseChef?.responseChef2 === "I" &&
          d.reponseChef?.responseChef3 === "I"
        ).length
      },
      timestamp: Date.now()
    };

    localStorage.setItem("demandes", JSON.stringify(updatedCache));

    // 10. Update state
    setDemandesData(updatedCache);
    setDemandes(updatedDemandes);
    setFilteredDemandes(updatedDemandes);

    // 11. User feedback
    closeActionModal();
    toast.update(toastId, {
      render: responseData.message || `Demande ${actionType === "approve" ? "approuvée" : "rejetée"}`,
      type: "success",
      isLoading: false,
      autoClose: 3000
    });

    // 12. Delayed refresh
    setTimeout(fetchDemandes, 2000);

  } catch (error) {
    let errorMessage = "Erreur technique";
    try {
      const errorObj = JSON.parse(error.message);
      errorMessage = errorObj.message || error.message;
    } catch (e) {
      errorMessage = error.message;
    }

    toast.update(toastId, {
      render: errorMessage,
      type: "error",
      isLoading: false,
      autoClose: 5000
    });

    if (error.message.includes("Session")) {
      setTimeout(() => window.location.href = "/", 2000);
    }
  }
};

const fetchDemandes = useCallback(async (isBackgroundRefresh = false) => {
  if (!isBackgroundRefresh) setLoading(true);
  setError(null);

  try {
    // Get complete cached data (including other demand types)
    const cachedData = JSON.parse(localStorage.getItem("demandes") || "{}");
    
    const useCached = cachedData.autorisation?.data && Array.isArray(cachedData.autorisation.data);

    if (useCached) {
      setDemandesData(cachedData);
      setDemandes(cachedData.autorisation.data);
      setFilteredDemandes(cachedData.autorisation.data);
      setLastUpdated(new Date(cachedData.timestamp).toLocaleTimeString());
      setDataSource("cache");

      if (!isBackgroundRefresh) {
        fetchFromAPI()
          .then(apiData => {
            // Create new data while preserving other demand types
            const newData = {
              ...cachedData, // Keep existing data (formation, conge, etc.)
              autorisation: apiData, // Update only autorisation data
              timestamp: Date.now()
            };

            if (JSON.stringify(cachedData.autorisation.data) !== JSON.stringify(apiData.data)) {
              localStorage.setItem("demandes", JSON.stringify(newData));
              setDemandesData(newData);
              setDemandes(apiData.data);
              setFilteredDemandes(apiData.data);
              setDataSource("api");
              setLastUpdated(new Date().toLocaleTimeString());
            }
          })
          .catch(e => console.error("Error during API refresh:", e));
      } else {
        // Background refresh - merge carefully without overwriting other types
        const apiData = await fetchFromAPI();

        // Merge existing and new autorisation data
        const mergedDemandes = cachedData.autorisation.data.map(localDemande => {
          const updated = apiData.data.find(d => d.id === localDemande.id);
          return updated ? { ...localDemande, ...updated } : localDemande;
        });

        // Add any new demandes from API
        const newOnes = apiData.data.filter(apiD =>
          !cachedData.autorisation.data.some(localD => localD.id === apiD.id)
        );

        const finalMerged = [...mergedDemandes, ...newOnes];

        // Update only autorisation while preserving other types
        const updatedCache = {
          ...cachedData, // Preserve other demand types
          autorisation: {
            ...cachedData.autorisation, // Preserve other autorisation metadata
            data: finalMerged,
            total: finalMerged.length,
            approved: finalMerged.filter(d =>
              d.reponseChef?.responseChef1 === "O" ||
              d.reponseChef?.responseChef2 === "O" ||
              d.reponseChef?.responseChef3 === "O"
            ).length,
            pending: finalMerged.filter(d =>
              d.reponseChef?.responseChef1 === "I" &&
              d.reponseChef?.responseChef2 === "I" &&
              d.reponseChef?.responseChef3 === "I"
            ).length
          },
          timestamp: Date.now()
        };

        localStorage.setItem("demandes", JSON.stringify(updatedCache));
        setDemandesData(updatedCache);
        setDemandes(finalMerged);
        setFilteredDemandes(finalMerged);
        setDataSource("merged");
        setLastUpdated(new Date().toLocaleTimeString());
      }
      return;
    }

    // No cache case - initialize with only autorisation data
    const processedData = await fetchFromAPI();
    const newData = {
      autorisation: processedData, // Only autorisation data
      timestamp: Date.now()
    };

    localStorage.setItem("demandes", JSON.stringify(newData));
    setDemandesData(newData);
    setDemandes(processedData.data);
    setFilteredDemandes(processedData.data);
    setDataSource("api");
    setLastUpdated(new Date().toLocaleTimeString());

  } catch (error) {
    console.error("Fetch error:", error);
    if (!isBackgroundRefresh) {
      setError(error.message || "Une erreur est survenue");
      const fallback = JSON.parse(localStorage.getItem("demandes") || "{}");
      if (fallback.autorisation?.data) {
        setDemandesData(fallback);
        setDemandes(fallback.autorisation.data);
        setFilteredDemandes(fallback.autorisation.data);
        setDataSource("cache-fallback");
      }
    }
  } finally {
    if (!isBackgroundRefresh) setLoading(false);
  }
}, [fetchFromAPI]);


  
  const openModal = (demande) => {
    setSelectedDemande(demande);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDemande(null);
  };

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
        throw new Error(errorText || `HTTP error: ${response.status}`);
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
      toast.error("Impossible d'afficher la pièce jointe: " + err.message);
    }
  };

  const handleDownload = async (fileId, filename = "piece_jointe.pdf") => {
    if (!fileId) {
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
      toast.update(toastId, {
        render: "Échec du téléchargement: " + err.message,
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    }
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

  const toggleFilterExpand = () => {
    setIsFilterExpanded((prev) => !prev);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.className = newTheme;
    document.body.className = newTheme;
    localStorage.setItem("theme", newTheme);
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }));
  };

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

    // Set up polling
    const pollingInterval = setInterval(() => {
      fetchDemandes(true);
    }, POLLING_INTERVAL);

    // Update next refresh time display
    const updateNextRefreshTime = () => {
      const next = new Date(Date.now() + POLLING_INTERVAL);
      setNextRefresh(next.toLocaleTimeString());
    };

    updateNextRefreshTime();
    const refreshDisplayInterval = setInterval(updateNextRefreshTime, 60000);

    return () => {
      clearInterval(pollingInterval);
      clearInterval(refreshDisplayInterval);
    };
  }, [getUserInfo, fetchDemandes]);

  useEffect(() => {
    let filtered = demandes;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (demande) =>
          (demande.matPers?.nomComplet && demande.matPers.nomComplet.toLowerCase().includes(query)) ||
          (demande.texteDemande && demande.texteDemande.toLowerCase().includes(query))
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
              <h1>Demandes d'Autorisation</h1>

            </div>
            <p>Gérez les demandes d'autorisation de vos collaborateurs</p>
            
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
                <p className="stat-value">{demandesData.autorisation.total}</p>
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
                    <th>Période</th>
                    <th>Texte Demande</th>
                    <th>Fichier</th>
                    <th>Votre Position</th>
                    <th>Votre Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDemandes.map((demande) => {
                    const currentPoid = getUserPoidForDemande(demande);
                    const userResponse = getCurrentUserResponse(demande);
                    const canValidate = canValidateDemande(demande);
                    
                    return (
                      <tr key={demande.id} onClick={() => openModal(demande)}>
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
                            <span className="employee-name">{demande.matPers?.matricule || "Inconnu"}<br/> {demande.matPers?.service || "Inconnu"}</span>
                          </div>
                        </td>
                        <td>
                          <div className="date-range-cell">
                            {demande.dateDebut ? (
                              <>
                                <div className="date-item">
                                  <span className="date-label">Sortie:</span>
                                  <span className="date-value">
                                    {new Date(demande.dateDebut).toLocaleDateString('fr-FR')} à {formatTime(demande.horaireSortie, demande.minuteSortie)}
                                  </span>
                                </div>
                                <div className="date-item">
                                  <span className="date-label">Retour:</span>
                                  <span className="date-value">
                                    {new Date(demande.dateDebut).toLocaleDateString('fr-FR')} à {formatTime(demande.horaireRetour, demande.minuteRetour)}
                                  </span>
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
                            {getUserPositionName(currentPoid)}
                          </span>
                        </td>
                        <td>
                          {renderUserSpecificStatus(demande)}
                        </td>
                        <td>
 <div className="action-buttons">
        <button
          className={`action-button approve ${!canValidate ? 'disabled' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (canValidate) {
              openActionModal(demande.id, "approve");
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
              openActionModal(demande.id, "reject");
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
                        </td>
                      </tr>
                    );
                  })}
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
                    required={actionType === "reject"}
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
              onApprove={() => openActionModal(selectedDemande.id, "approve")}
              onReject={() => openActionModal(selectedDemande.id, "reject")}
              isActionable={canValidateDemande(selectedDemande)}
              theme={theme}
              userPoid={getUserPoidForDemande(selectedDemande)}
            />
          )}

          <ToastContainer
            position="bottom-right"
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
      </div>
    </div>
  );
};

export default DemandesAutorisation;