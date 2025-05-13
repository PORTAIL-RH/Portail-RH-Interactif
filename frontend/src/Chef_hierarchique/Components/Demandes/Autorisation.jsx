import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { FiSearch, FiFilter, FiCalendar, FiCheck, FiX, FiClock, FiRefreshCw, FiFileText, FiEye, FiDownload } from "react-icons/fi";
import "./Demandes.css";
import DemandeDetailsModal from "./DemandeDetailsModal";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { API_URL } from "../../../config";

const DemandesAutorisation = () => {
  const [demandesData, setDemandesData] = useState(() => {
    try {
      const stored = localStorage.getItem("demandes");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.autorisation?.data && Array.isArray(parsed.autorisation.data)) {
          return {
            autorisation: { 
              data: parsed.autorisation.data || [], 
              total: parsed.autorisation.total || 0, 
              approved: parsed.autorisation.approved || 0, 
              pending: parsed.autorisation.pending || 0 
            },
            timestamp: parsed.timestamp || 0
          };
        }
      }
    } catch (e) {
      console.error("Error parsing demandes from localStorage:", e);
    }
    return {
      autorisation: { data: [], total: 0, approved: 0, pending: 0 },
      timestamp: 0
    };
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
  const [services, setServices] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

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
    if (!currentPoid || currentPoid === 0) return false;
    const userResponse = getCurrentUserResponse(demande);
    return userResponse === "I";
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

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.className = newTheme;
    document.body.className = newTheme;
    localStorage.setItem("theme", newTheme);
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }));
  };

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

      const processedAutorisation = {
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
        autorisation: processedAutorisation,
        timestamp: Date.now()
      };
      
      localStorage.setItem("demandes", JSON.stringify(updatedCache));

      return processedAutorisation;
    } catch (error) {
      console.error("API fetch error:", error);
      throw error;
    }
  }, [getUserInfo]);

  const fetchDemandes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const stored = localStorage.getItem("demandes");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const cacheAge = Date.now() - (parsed.timestamp || 0);
          
          if (cacheAge < 3600000 && parsed.autorisation?.data && Array.isArray(parsed.autorisation.data)) {
            setDemandesData(parsed);
            setDemandes(parsed.autorisation.data);
            setFilteredDemandes(parsed.autorisation.data);
            setLastUpdated(new Date(parsed.timestamp).toLocaleTimeString());
            setDataSource("cache");
            setLoading(false);
            
            fetchFromAPI().catch(e => console.error("Background refresh failed:", e));
            return;
          }
        } catch (e) {
          console.error("Error parsing demandes from localStorage:", e);
        }
      }

      const processedData = await fetchFromAPI();
      setDemandesData(prev => ({
        ...prev,
        autorisation: processedData,
        timestamp: Date.now()
      }));
      setDemandes(processedData.data);
      setFilteredDemandes(processedData.data);
      setDataSource("api");
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Fetch error:", error);
      setError(error.message || "An unknown error occurred");
      
      const stored = localStorage.getItem("demandes");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.autorisation?.data && Array.isArray(parsed.autorisation.data)) {
            setDemandesData(parsed);
            setDemandes(parsed.autorisation.data);
            setFilteredDemandes(parsed.autorisation.data);
            setDataSource("cache-fallback");
          }
        } catch (e) {
          console.error("Error parsing fallback data:", e);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFromAPI]);

  useEffect(() => {
    getUserInfo();
    fetchDemandes();
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
      const userInfo = getUserInfo();
      const demande = demandes.find(d => d.id === currentDemandeId);
      
      if (!userInfo || !demande) {
        throw new Error("User validation information not available");
      }

      const currentPoid = getUserPoidForDemande(demande);
      
      if (!currentPoid || currentPoid === 0) {
        throw new Error("Vous n'êtes pas autorisé à valider cette demande");
      }

      let chefLevel = "";
      switch(currentPoid) {
        case 1: chefLevel = "chef1"; break;
        case 2: chefLevel = "chef2"; break;
        case 3: chefLevel = "chef3"; break;
        default: throw new Error("Invalid user position");
      }

      const url = actionType === "approve" 
        ? `${API_URL}/api/demande-autorisation/valider/${currentDemandeId}?chefId=${userInfo.id}&chefLevel=${chefLevel}`
        : `${API_URL}/api/demande-autorisation/refuser/${currentDemandeId}?chefId=${userInfo.id}&chefLevel=${chefLevel}`;

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

      const result = await response.json();
      
      if (result.status === "error") {
        throw new Error(result.message);
      }

      const updatedData = demandes.map(d => {
        if (d.id === currentDemandeId) {
          const updatedDemande = { 
            ...d, 
            observation: observation 
          };
          
          if (!updatedDemande.reponseChef) {
            updatedDemande.reponseChef = {
              id: `temp-${Date.now()}`,
              demandeId: currentDemandeId,
              responseChef1: "I",
              responseChef2: "I",
              responseChef3: "I",
              dateChef1: "",
              dateChef2: "",
              dateChef3: "",
              observationChef1: "",
              observationChef2: "",
              observationChef3: ""
            };
          }

          if (currentPoid === 1) {
            updatedDemande.reponseChef.responseChef1 = actionType === "approve" ? "O" : "N";
            updatedDemande.reponseChef.dateChef1 = new Date().toISOString();
            updatedDemande.reponseChef.observationChef1 = observation;
          } else if (currentPoid === 2) {
            updatedDemande.reponseChef.responseChef2 = actionType === "approve" ? "O" : "N";
            updatedDemande.reponseChef.dateChef2 = new Date().toISOString();
            updatedDemande.reponseChef.observationChef2 = observation;
          } else if (currentPoid === 3) {
            updatedDemande.reponseChef.responseChef3 = actionType === "approve" ? "O" : "N";
            updatedDemande.reponseChef.dateChef3 = new Date().toISOString();
            updatedDemande.reponseChef.observationChef3 = observation;
          }
          
          return updatedDemande;
        }
        return d;
      });

      const updatedAutorisation = {
        data: updatedData,
        total: updatedData.length,
        approved: updatedData.filter(d => d.reponseChef && 
          (d.reponseChef.responseChef1 === "O" || 
           d.reponseChef.responseChef2 === "O" || 
           d.reponseChef.responseChef3 === "O")).length,
        pending: updatedData.filter(d => !d.reponseChef || 
          (d.reponseChef.responseChef1 === "I" && 
           d.reponseChef.responseChef2 === "I" && 
           d.reponseChef.responseChef3 === "I")).length
      };

      const currentCache = JSON.parse(localStorage.getItem("demandes") || "{}");
      const updatedCache = {
        ...currentCache,
        autorisation: updatedAutorisation,
        timestamp: Date.now()
      };
      
      localStorage.setItem("demandes", JSON.stringify(updatedCache));

      setDemandesData(updatedCache);
      setDemandes(updatedData);
      setFilteredDemandes(updatedData);
      closeActionModal();
      
      // Updated toast messages to show chef level
      const chefPosition = getUserPositionName(currentPoid);
      toast.success(
        actionType === "approve" 
          ? `Demande approuvée (${chefPosition})` 
          : `Demande refusée (${chefPosition})`
      );
      
    } catch (error) {
      toast.error(`Erreur: ${error.message}`);
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
              <button className="refresh-button" onClick={handleRefresh}>
                <FiRefreshCw /> Rafraîchir
              </button>
            </div>
            <p>Gérez les demandes d'autorisation de vos collaborateurs</p>
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
                                }
                              }}
                              disabled={!canValidate}
                              title={!canValidate ? 
                                (userResponse !== "I" ? "Vous avez déjà répondu" : 
                                "Non autorisé") : 
                                "Approuver"}
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
                                }
                              }}
                              disabled={!canValidate}
                              title={!canValidate ? 
                                (userResponse !== "I" ? "Vous avez déjà répondu" : 
                                "Non autorisé") : 
                                "Rejeter"}
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