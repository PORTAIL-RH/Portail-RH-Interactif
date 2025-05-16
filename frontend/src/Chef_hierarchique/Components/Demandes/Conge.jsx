import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { FiSearch, FiFilter, FiCalendar, FiCheck, FiX, FiClock, FiRefreshCw, FiFileText, FiEye, FiDownload } from "react-icons/fi";
import "./Demandes.css";
import DemandeDetailsModal from "./DemandeDetailsModal";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { API_URL } from "../../../config";

const POLLING_INTERVAL = 1 * 60 * 1000; // 5 minutes en millisecondes

const DemandesConge = () => {
  // State initialization
  const [demandesData, setDemandesData] = useState({
    conge: { data: [], total: 0, approved: 0, pending: 0 },
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
  const [usedDaysData, setUsedDaysData] = useState({});
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
      console.error("Erreur de lecture des infos utilisateur:", e);
      return null;
    }
  }, []);

  const getUserPoidForDemande = useCallback((demande) => {
    if (!services || services.length === 0) return 0;
    
    const demandeServiceName = demande.demandeur?.service;
    if (!demandeServiceName) return 0;
    
    const demandeService = services.find(s => 
      s.serviceName.toLowerCase() === demandeServiceName.toLowerCase()
    );
    
    if (!demandeService) {
      console.warn(`Service non trouvé: ${demandeServiceName}`);
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



  const renderUserSpecificStatus = (demande) => {
    const userResponse = getCurrentUserResponse(demande);
    const currentPoid = getUserPoidForDemande(demande);
    
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

  // Data fetching functions
  const fetchUsedDays = useCallback(async (matPersId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${API_URL}/api/demande-conge/days-used/${matPersId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Échec de la récupération des jours utilisés");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erreur de récupération des jours utilisés:", error);
      return null;
    }
  }, []);

  const fetchFromAPI = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      const userInfo = getUserInfo();

      if (!userInfo) {
        throw new Error("Informations utilisateur non trouvées");
      }

      const response = await fetch(
        `${API_URL}/api/demande-conge/collaborateurs-by-service/${userInfo.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Échec de la récupération des demandes");
      }

      const data = await response.json();
      
      if (!data.demandes) {
        throw new Error("Format de réponse invalide: tableau des demandes manquant");
      }

      const demandesFromResponse = (Array.isArray(data.demandes) ? data.demandes : []).map(demande => ({
        ...demande,
        files: demande.files?.map(file => ({
          ...file,
          fileId: file.fileId || file.id
        })) || []
      }));

      const processedConge = {
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

      const currentCache = JSON.parse(localStorage.getItem("demandes") || "{}");
      const updatedCache = {
        ...currentCache,
        conge: processedConge,
        timestamp: Date.now()
      };
      
      localStorage.setItem("demandes", JSON.stringify(updatedCache));

      return processedConge;
    } catch (error) {
      console.error("Erreur de récupération API:", error);
      throw error;
    }
  }, [getUserInfo]);

  const getDemandesFromLocalStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem("demandes");
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      if (parsed.conge?.data && Array.isArray(parsed.conge.data)) {
        return parsed;
      }
      return null;
    } catch (e) {
      console.error("Erreur de parsing des demandes depuis localStorage:", e);
      return null;
    }
  }, []);

const fetchDemandes = useCallback(async (isBackgroundRefresh = false) => {
  if (!isBackgroundRefresh) setLoading(true);
  setError(null);

  try {
    // 1. FIRST check localStorage
    const cachedData = JSON.parse(localStorage.getItem("demandes") || "{}");
    
    // 2. If conge data exists in localStorage
    if (cachedData.conge?.data && Array.isArray(cachedData.conge.data)) {
      // Use cached data immediately
      setDemandesData(cachedData);
      setDemandes(cachedData.conge.data);
      setFilteredDemandes(cachedData.conge.data);
      setLastUpdated(new Date(cachedData.timestamp).toLocaleTimeString());
      setDataSource("cache");

      // 3. ONLY if no conge data in localStorage, fetch from API
      if (!isBackgroundRefresh && cachedData.conge.data.length === 0) {
        try {
          const apiData = await fetchFromAPI();
          
          // Update ONLY conge data while preserving others
          const newData = {
            ...cachedData, // Preserve other demand types
            conge: {
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

    // 4. If NO conge data in localStorage at all, fetch from API
    const apiData = await fetchFromAPI();
    const newData = {
      ...cachedData, // Preserve any existing other demand types
      conge: {
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
      
      // Fallback to cache if available
      const fallback = JSON.parse(localStorage.getItem("demandes") || "{}");
      setDemandesData(fallback);
      setDemandes(fallback.conge?.data || []);
      setFilteredDemandes(fallback.conge?.data || []);
      setDataSource("cache-fallback");
    }
  } finally {
    if (!isBackgroundRefresh) setLoading(false);
  }
}, [fetchFromAPI]);

  // Action handlers with improved toasts
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

    // 3. Check permissions
    const currentPoid = getUserPoidForDemande(currentDemande);
    if (!currentPoid || currentPoid === 0) throw new Error("Action non autorisée");

    // 4. Validate observation for rejections
    if (actionType === "reject" && (!observation || !observation.trim())) {
      throw new Error("Une observation est obligatoire pour le refus");
    }

    // 5. Prepare API request
    const endpoint = actionType === "approve" ? "valider" : "refuser";
    const url = `${API_URL}/api/demande-conge/${endpoint}/${currentDemandeId}?chefId=${userId}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        observation: observation?.trim() || 
          (actionType === "approve" 
            ? `Validation par ${getUserPositionName(currentPoid)}` 
            : "Refus sans motif spécifié")
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    // 6. Update local state
    const updatedDemandes = demandes.map(d => {
      if (d.id !== currentDemandeId) return d;
      
      const updatedResponse = {
        ...d.reponseChef,
        [`responseChef${currentPoid}`]: actionType === "approve" ? "O" : "N",
        [`dateChef${currentPoid}`]: new Date().toISOString(),
        [`observationChef${currentPoid}`]: observation?.trim() || ""
      };

      return {
        ...d,
        reponseChef: updatedResponse
      };
    });

    // 7. Update localStorage while preserving other demand types
    const existingCache = JSON.parse(localStorage.getItem("demandes") || "{}");
    const updatedCache = {
      ...existingCache, // Preserve other demand types
      conge: {
        ...existingCache.conge, // Preserve other conge metadata
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

    // 8. Update state
    setDemandesData(updatedCache);
    setDemandes(updatedDemandes);
    setFilteredDemandes(updatedDemandes);

    // 9. Close modal and show success
    closeActionModal();
    toast.update(toastId, {
      render: `Demande ${actionType === "approve" ? "approuvée" : "rejetée"}`,
      type: "success",
      isLoading: false,
      autoClose: 3000
    });

    // 10. Optional: Trigger background refresh
    setTimeout(() => fetchDemandes(true), 2000);

  } catch (error) {
    console.error("Action failed:", error);
    toast.update(toastId, {
      render: error.message || "Erreur lors du traitement",
      type: "error",
      isLoading: false,
      autoClose: 5000
    });
  }
};

// Modified action button handlers to show appropriate toasts
const handleActionButtonClick = (e, demande, action) => {
  e.stopPropagation();
  const currentPoid = getUserPoidForDemande(demande);
  
  if (!currentPoid || currentPoid === 0) {
    toast.info("Vous n'êtes pas autorisé à valider cette demande", {
      className: 'info-toast',
      position: "top-right",
      autoClose: 5000
    });
    return;
  }

  if (!canValidateDemande(demande)) {
    toast.info("Vous avez déjà répondu à cette demande", {
      className: 'info-toast',
      position: "top-right",
      autoClose: 5000
    });
    return;
  }

  openActionModal(demande.id, action);
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
    if (!fileId) {
      throw new Error("ID de fichier manquant");
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
      console.error("Erreur de récupération du fichier:", error);
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
    // Initial fetch
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

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.className = newTheme;
    document.body.className = newTheme;
    localStorage.setItem("theme", newTheme);
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }));
  };

  // Render
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
              
            </div>
            <p>Gérez les demandes de congé de vos collaborateurs</p>

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
                <p className="stat-value">{demandesData.conge.total}</p>
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
                    <th>Jours utilisés</th>
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
                            <span className="employee-name">
                              {demande.demandeur?.nomComplet || "Inconnu"}
                            </span>
                            {demande.demandeur?.service && (
                              <span className="employee-details">
                                {demande.demandeur?.service}
                              </span>
                            )}
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
                                  <span className="date-label">Fin:</span>
                                  <span className="date-value">
                                    {new Date(demande.dateFin).toLocaleDateString('fr-FR')}
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
        className={`action-button approve ${!canValidateDemande(demande) ? 'disabled' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if (canValidateDemande(demande)) {
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
          !canValidateDemande(demande) 
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
        className={`action-button reject ${!canValidateDemande(demande) ? 'disabled' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if (canValidateDemande(demande)) {
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
          !canValidateDemande(demande) 
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
              onApprove={() => openActionModal(selectedDemande.id, "approve")}
              onReject={() => openActionModal(selectedDemande.id, "reject")}
              isActionable={selectedDemande.reponseChef === "I"}
              usedDaysData={usedDaysData[selectedDemande.matPers?.id] || null}
              theme={theme}
            />
          )}

          <ToastContainer
            position="top-right"
            autoClose={3000}
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

export default DemandesConge;