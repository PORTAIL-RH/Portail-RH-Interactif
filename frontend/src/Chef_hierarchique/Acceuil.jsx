import React from 'react';
import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "./Components/Sidebar/Sidebar";
import Navbar from "./Components/Navbar/Navbar";
import { FiUsers, FiClock, FiMapPin, FiRefreshCw, FiBell } from "react-icons/fi";
import { FaFemale, FaMale } from "react-icons/fa";
import "./Acceuil.css";

// Error boundary wrapper component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Helper function for safe JSON parsing
const safeParse = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null || stored === 'undefined') return defaultValue;
    const parsed = JSON.parse(stored);
    return parsed !== null ? parsed : defaultValue;
  } catch (e) {
    console.error(`Error parsing ${key} from localStorage:`, e);
    return defaultValue;
  }
};

// Deep comparison function
const deepEqual = (x, y) => {
  if (x === y) return true;
  if (typeof x !== 'object' || x === null || typeof y !== 'object' || y === null) return false;
  
  const keysX = Object.keys(x);
  const keysY = Object.keys(y);
  
  if (keysX.length !== keysY.length) return false;
  
  for (const key of keysX) {
    if (!keysY.includes(key)) return false;
    if (!deepEqual(x[key], y[key])) return false;
  }
  
  return true;
};

// Rate-limited fetch with retry logic
const fetchWithRetry = async (url, options = {}, retries = 3) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, 1000));
    return fetchWithRetry(url, options, retries - 1);
  }
};

const Accueil = () => {
  // User data with safe parsing
  const userId = localStorage.getItem("userId");
  const userData = safeParse("userData", {});
  const userFirstName = userData.prenom || "";
  const userLastName = userData.nom || "";

  // State initialization with proper localStorage handling
  const [serviceInfo, setServiceInfo] = useState(() => 
    safeParse("serviceInfo", {
      name: "",
      activatedCount: 0,
      nonActivatedCount: 0,
      total: 0,
      maleCount: 0,
      femaleCount: 0,
      malePercentage: 0,
      femalePercentage: 0,
    })
  );

  const [personnels, setPersonnels] = useState(() => safeParse("personnels", []));
  const [previousPersonnels, setPreviousPersonnels] = useState([]);

  const [demandes, setDemandes] = useState(() => {
    const defaultDemandes = {
      conge: { data: [], total: 0, approved: 0, pending: 0 },
      formation: { data: [], total: 0, approved: 0, pending: 0 },
      autorisation: { data: [], total: 0, approved: 0, pending: 0 }
    };
    return safeParse("demandes", defaultDemandes);
  });

  const [previousDemandes, setPreviousDemandes] = useState(() => {
    const defaultDemandes = {
      conge: { data: [], total: 0, approved: 0, pending: 0 },
      formation: { data: [], total: 0, approved: 0, pending: 0 },
      autorisation: { data: [], total: 0, approved: 0, pending: 0 }
    };
    return safeParse("demandes", defaultDemandes);
  });

  const [upcomingFormations, setUpcomingFormations] = useState(() => safeParse("upcomingFormations", []));
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => {
    const stored = localStorage.getItem("lastUpdated");
    return stored && stored !== "undefined" ? stored : "";
  });
  const [theme, setTheme] = useState("light");
  const [newUpdates, setNewUpdates] = useState([]);
  const [showUpdatesPanel, setShowUpdatesPanel] = useState(false);

  // Refs for values that shouldn't trigger effects
  const personnelsRef = useRef(personnels);
  const serviceInfoRef = useRef(serviceInfo);
  const demandesRef = useRef(demandes);
  const upcomingFormationsRef = useRef(upcomingFormations);

  // Update refs when state changes
  useEffect(() => {
    personnelsRef.current = personnels;
  }, [personnels]);

  useEffect(() => {
    serviceInfoRef.current = serviceInfo;
  }, [serviceInfo]);

  useEffect(() => {
    demandesRef.current = demandes;
  }, [demandes]);

  useEffect(() => {
    upcomingFormationsRef.current = upcomingFormations;
  }, [upcomingFormations]);

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || 
                     (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(savedTheme);
    document.documentElement.className = savedTheme;
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.className = newTheme;
    localStorage.setItem("theme", newTheme);
  };

  // Safe save to localStorage with timestamp
  const saveToLocalStorage = useCallback((key, data) => {
    try {
      if (data && (key !== "demandes" || 
          (data.conge.data.length > 0 || 
           data.formation.data.length > 0 || 
           data.autorisation.data.length > 0))) {
        localStorage.setItem(key, JSON.stringify(data));
        const now = new Date().toISOString();
        localStorage.setItem("lastUpdated", now);
        setLastUpdated(now);
      }
    } catch (e) {
      console.error("LocalStorage save error:", e);
      if (e.name === 'QuotaExceededError') {
        const criticalData = {
          demandes: safeParse("demandes", null),
          personnels: safeParse("personnels", []),
          serviceInfo: safeParse("serviceInfo", null)
        };
        localStorage.clear();
        Object.entries(criticalData).forEach(([key, value]) => {
          if (value) localStorage.setItem(key, JSON.stringify(value));
        });
      }
    }
  }, []);

  // Process demandes data with validation
  const processDemandes = useCallback((data, type) => {
    try {
      const demandesArray = Array.isArray(data?.demandes) ? data.demandes : 
                          Array.isArray(data) ? data : [];
      
      return {
        data: demandesArray,
        total: demandesArray.length,
        approved: demandesArray.filter(d => d?.reponseChef === "O").length,
        pending: demandesArray.filter(d => d?.reponseChef === "I").length
      };
    } catch (e) {
      console.error("Error processing demandes:", e);
      return {
        data: [],
        total: 0,
        approved: 0,
        pending: 0
      };
    }
  }, []);

  // Detect personnel changes between updates
  const detectPersonnelChanges = useCallback((oldPersonnels, newPersonnels) => {
    const updates = [];

    // Check for new additions
    newPersonnels.forEach(newPerson => {
      const exists = oldPersonnels.some(oldPerson => oldPerson.id === newPerson.id);
      if (!exists) {
        updates.push({
          type: 'new_personnel',
          data: newPerson,
          timestamp: new Date().toISOString(),
          message: `New employee added: ${newPerson.nom} ${newPerson.prenom}`
        });
      }
    });

    // Check for updates (modified fields)
    oldPersonnels.forEach(oldPerson => {
      const newPerson = newPersonnels.find(p => p.id === oldPerson.id);
      if (newPerson && !deepEqual(oldPerson, newPerson)) {
        const changedFields = Object.keys(newPerson).filter(
          key => !deepEqual(oldPerson[key], newPerson[key])
        );
        if (changedFields.length > 0) {
          updates.push({
            type: 'personnel_updated',
            data: newPerson,
            timestamp: new Date().toISOString(),
            message: `Employee updated: ${newPerson.nom} ${newPerson.prenom} (${changedFields.join(', ')})`
          });
        }
      }
    });

    // Check for removals
    oldPersonnels.forEach(oldPerson => {
      const exists = newPersonnels.some(newPerson => newPerson.id === oldPerson.id);
      if (!exists) {
        updates.push({
          type: 'personnel_removed',
          data: oldPerson,
          timestamp: new Date().toISOString(),
          message: `Employee removed: ${oldPerson.nom} ${oldPerson.prenom}`
        });
      }
    });

    return updates;
  }, []);

  // Detect demandes changes between updates
  const detectDemandesChanges = useCallback((oldDemandes, newDemandes) => {
    const updates = [];

    // Helper function to get requester name
    const getRequesterName = (demande) => {
      if (!demande.personnel) return "Unknown";
      return `${demande.personnel.nom} ${demande.personnel.prenom}`;
    };

    // Check each demande type
    Object.keys(newDemandes).forEach(type => {
      const oldData = oldDemandes[type]?.data || [];
      const newData = newDemandes[type]?.data || [];

      // Check for new demandes
      newData.forEach(newDemande => {
        const exists = oldData.some(oldDemande => oldDemande.id === newDemande.id);
        if (!exists) {
          updates.push({
            type: `new_${type}_demande`,
            data: newDemande,
            timestamp: new Date().toISOString(),
            message: `New ${type} request from ${getRequesterName(newDemande)}`
          });
        }
      });

      // Check for status changes
      oldData.forEach(oldDemande => {
        const newDemande = newData.find(d => d.id === oldDemande.id);
        if (newDemande && oldDemande.reponseChef !== newDemande.reponseChef) {
          const statusMap = {
            'O': 'approved',
            'I': 'pending',
            'R': 'rejected'
          };
          updates.push({
            type: `${type}_demande_status_changed`,
            data: newDemande,
            timestamp: new Date().toISOString(),
            message: `${type} request from ${getRequesterName(newDemande)} ${statusMap[newDemande.reponseChef]}`
          });
        }
      });
    });

    return updates;
  }, []);

  // Fetch service data with error handling and change detection
  const fetchServiceData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchWithRetry(
        `http://localhost:8080/api/Personnel/collaborateurs-by-service/${userId}`
      );
      
      const collaborators = Array.isArray(data?.collaborators) ? data.collaborators : [];

      // Only proceed with updates if we got valid data
      if (collaborators.length > 0) {
        // Detect and store changes
        if (previousPersonnels.length > 0) {
          const personnelUpdates = detectPersonnelChanges(previousPersonnels, collaborators);
          if (personnelUpdates.length > 0) {
            setNewUpdates(prev => [...prev.slice(-9), ...personnelUpdates]);
          }
        }

        // Update previous data
        setPreviousPersonnels(collaborators);

        const stats = collaborators.reduce(
          (acc, person) => {
            if (person?.sexe === "male") acc.maleCount++;
            if (person?.sexe === "female") acc.femaleCount++;
            if (person?.active) acc.activatedCount++;
            else acc.nonActivatedCount++;
            return acc;
          },
          { maleCount: 0, femaleCount: 0, activatedCount: 0, nonActivatedCount: 0 }
        );

        const total = data?.numberOfCollaborators || collaborators.length;
        const serviceData = {
          name: data?.serviceName || "Unknown service",
          ...stats,
          total,
          malePercentage: total > 0 ? Math.round((stats.maleCount / total) * 100) : 0,
          femalePercentage: total > 0 ? Math.round((stats.femaleCount / total) * 100) : 0,
        };

        setServiceInfo(serviceData);
        setPersonnels(collaborators);
        saveToLocalStorage("serviceInfo", serviceData);
        saveToLocalStorage("personnels", collaborators);
      }

      return { serviceData: serviceInfoRef.current, collaborators };
    } catch (error) {
      console.error("Service data error:", error);
      return {
        serviceData: serviceInfoRef.current,
        collaborators: personnelsRef.current
      };
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userId, saveToLocalStorage, detectPersonnelChanges]);

  // Fetch all demandes with error handling and change detection
  const fetchAllDemandes = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const endpoints = [
        { key: "conge", path: "demande-conge" },
        { key: "formation", path: "demande-formation" },
        { key: "autorisation", path: "demande-autorisation" }
      ];

      const results = await Promise.all(
        endpoints.map(async ({ key, path }) => {
          try {
            const data = await fetchWithRetry(
              `http://localhost:8080/api/${path}/collaborateurs-by-service/${userId}`
            );
            return { key, data: processDemandes(data, key) };
          } catch (err) {
            console.error(`${key} error:`, err);
            return { key, data: demandesRef.current[key] };
          }
        })
      );

      const newDemandes = results.reduce((acc, { key, data }) => {
        acc[key] = data;
        return acc;
      }, {});

      // Only update if we got valid data (not just falling back to existing)
      const hasNewData = results.some(result => 
        !deepEqual(result.data.data, demandesRef.current[result.key].data)
      );

      if (hasNewData) {
        // Detect and store changes
        if (previousDemandes.conge.data.length > 0 || 
            previousDemandes.formation.data.length > 0 || 
            previousDemandes.autorisation.data.length > 0) {
          const demandeUpdates = detectDemandesChanges(previousDemandes, newDemandes);
          if (demandeUpdates.length > 0) {
            setNewUpdates(prev => [...prev.slice(-9), ...demandeUpdates]);
          }
        }

        setPreviousDemandes(newDemandes);
        setDemandes(newDemandes);
        saveToLocalStorage("demandes", newDemandes);
      }

      return newDemandes;
    } catch (error) {
      console.error("Demandes fetch error:", error);
      return demandesRef.current;
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userId, processDemandes, saveToLocalStorage, detectDemandesChanges]);

  // Fetch upcoming formations with error handling
  const fetchFormations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchWithRetry(
        `http://localhost:8080/api/demande-formation/personnel/${userId}/approved`
      );
      
      const now = new Date();
      const upcoming = (Array.isArray(data) ? data : [])
        .filter(f => f?.dateDebut && new Date(f.dateDebut) >= now)
        .sort((a, b) => new Date(a.dateDebut) - new Date(b.dateDebut))
        .slice(0, 3);
      
      setUpcomingFormations(upcoming);
      saveToLocalStorage("upcomingFormations", upcoming);
      
      return upcoming;

    } catch (error) {
      console.error("Formations error:", error);
      return upcomingFormationsRef.current;
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userId, saveToLocalStorage]);

  // Date formatting with error handling
  const formatDate = useCallback((dateString) => {
    try {
      const options = { weekday: "short", day: "numeric", month: "short", year: "numeric" };
      return new Date(dateString).toLocaleDateString("fr-FR", options);
    } catch {
      return "Invalid date";
    }
  }, []);

  // Manual refresh with error handling
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchServiceData(),
        fetchAllDemandes(),
        fetchFormations()
      ]);
    } catch (e) {
      console.error("Error during refresh:", e);
    } finally {
      setLoading(false);
    }
  }, [fetchServiceData, fetchAllDemandes, fetchFormations]);

  const toggleUpdatesPanel = () => {
    setShowUpdatesPanel(!showUpdatesPanel);
  };

  // Initial data loading
  useEffect(() => {
    // First load from localStorage
    const storedServiceInfo = safeParse("serviceInfo", null);
    const storedPersonnels = safeParse("personnels", []);
    const storedDemandes = safeParse("demandes", {
      conge: { data: [], total: 0, approved: 0, pending: 0 },
      formation: { data: [], total: 0, approved: 0, pending: 0 },
      autorisation: { data: [], total: 0, approved: 0, pending: 0 }
    });
    const storedFormations = safeParse("upcomingFormations", []);

    // Set initial state from localStorage
    if (storedServiceInfo) setServiceInfo(storedServiceInfo);
    if (storedPersonnels) setPersonnels(storedPersonnels);
    if (storedDemandes) setDemandes(storedDemandes);
    if (storedFormations) setUpcomingFormations(storedFormations);

    // Then try to fetch fresh data in background
    const fetchInitialData = async () => {
      await fetchServiceData(true);
      await fetchAllDemandes(true);
      await fetchFormations(true);
    };
    
    fetchInitialData();
  }, [fetchServiceData, fetchAllDemandes, fetchFormations]);

  // Polling effect - fetch data every 10 seconds
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    
    const loadData = async () => {
      if (!isMounted) return;
      
      try {
        console.log("Polling for updates...");
        const [serviceResult, demandesResult, formationsResult] = await Promise.all([
          fetchServiceData(true),
          fetchAllDemandes(true),
          fetchFormations(true)
        ]);
        
        // Only update state if component is still mounted
        if (isMounted) {
          if (serviceResult.collaborators) {
            setPreviousPersonnels(serviceResult.collaborators);
          }
          if (demandesResult) {
            setPreviousDemandes(demandesResult);
          }
        }
      } catch (e) {
        console.error("Error during polling:", e);
      }
    };

    const pollingInterval = setInterval(loadData, 10 * 1000);
    // Initial load
    loadData();
    
    return () => {
      isMounted = false;
      abortController.abort();
      clearInterval(pollingInterval);
    };
  }, []); 

  return (
    <ErrorBoundary>
      <div className={`app-container ${theme}`}>
        <Sidebar theme={theme} />
        <div className="dashboard-container">
          <Navbar userId={userId} theme={theme} toggleTheme={toggleTheme} />
          
          <div className="dashboard-content">
            <div className="dashboard-header">
              <div className="header-top">
                <h1>Dashboard Overview</h1>
                <div className="header-controls">
                  <button 
                    className={`refresh-btn ${loading ? "loading" : ""}`}
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    <FiRefreshCw className={loading ? "spinning" : ""} /> 
                    <span>{loading ? "Loading..." : "Refresh"}</span>
                  </button>
                  <button 
                    className="updates-toggle"
                    onClick={toggleUpdatesPanel}
                    aria-label="Show updates"
                  >
                    <FiBell />
                    {newUpdates.length > 0 && (
                      <span className="update-badge">{newUpdates.length}</span>
                    )}
                  </button>
                </div>
              </div>
              <p className="welcome-message">
                Welcome, <span className="user-name">{userFirstName} {userLastName}</span>. 
                Head of <span className="service-name">{serviceInfo.name}</span> department.
              </p>
              {lastUpdated && (
                <p className="last-updated">
                  <FiClock className="update-icon" /> Last updated: {formatDate(lastUpdated)}
                </p>
              )}
            </div>
          <div className="dashboard-grid">
            {/* Personnel Overview Card */}
            <div className="dashboard-card personnel-overview">
              <div className="card-header">
                <h2>Personnel Overview</h2>
              </div>
              <div className="card-content">
                <div className="stat-cards">
                  <div className="stat-card">
                    <div className="stat-icon total">
                      <FiUsers />
                    </div>
                    <div className="stat-details">
                      <h3>Total</h3>
                      <p className="stat-value">{serviceInfo.total}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gender Distribution Card */}
            <div className="dashboard-card gender-distribution">
              <div className="card-header">
                <h2>Gender Distribution</h2>
              </div>
              <div className="card-content">
                <div className="gender-bars">
                  <div className="gender-bar-container">
                    <div className="gender-label">
                      <FaMale className="male-icon" /> Male
                    </div>
                    <div className="gender-bar-wrapper">
                      <div
                        className="gender-bar male-bar"
                        style={{ width: `${serviceInfo.malePercentage}%` }}
                      ></div>
                      <span className="gender-percentage">
                        {serviceInfo.malePercentage}% ({serviceInfo.maleCount})
                      </span>
                    </div>
                  </div>
                  <div className="gender-bar-container">
                    <div className="gender-label">
                      <FaFemale className="female-icon" /> Female
                    </div>
                    <div className="gender-bar-wrapper">
                      <div
                        className="gender-bar female-bar"
                        style={{ width: `${serviceInfo.femalePercentage}%` }}
                      ></div>
                      <span className="gender-percentage">
                        {serviceInfo.femalePercentage}% ({serviceInfo.femaleCount})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Requests Card */}
            <div className="dashboard-card recent-requests">
              <div className="card-header">
                <h2>Recent Requests</h2>
              </div>
              <div className="card-content">
                <div className="requests-summary">
                  <div className="request-type conge">
                    <div className="request-icon">
                      <FiClock />
                    </div>
                    <h3>Leave</h3>
                    <p className="request-total">{demandes.conge.total}</p>
                    <div className="status-breakdown">
                      <div className="status-item">
                        <span className="status-dot approved"></span>
                        <span className="status-text">
                          {demandes.conge.approved} approved
                        </span>
                      </div>
                      <div className="status-item">
                        <span className="status-dot pending"></span>
                        <span className="status-text">
                          {demandes.conge.pending} pending
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="request-type formation">
                    <div className="request-icon">
                      <FiUsers />
                    </div>
                    <h3>Training</h3>
                    <p className="request-total">{demandes.formation.total}</p>
                    <div className="status-breakdown">
                      <div className="status-item">
                        <span className="status-dot approved"></span>
                        <span className="status-text">
                          {demandes.formation.approved} approved
                        </span>
                      </div>
                      <div className="status-item">
                        <span className="status-dot pending"></span>
                        <span className="status-text">
                          {demandes.formation.pending} pending
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="request-type autorisation">
                    <div className="request-icon">
                      <FiMapPin />
                    </div>
                    <h3>Authorization</h3>
                    <p className="request-total">{demandes.autorisation.total}</p>
                    <div className="status-breakdown">
                      <div className="status-item">
                        <span className="status-dot approved"></span>
                        <span className="status-text">
                          {demandes.autorisation.approved} approved
                        </span>
                      </div>
                      <div className="status-item">
                        <span className="status-dot pending"></span>
                        <span className="status-text">
                          {demandes.autorisation.pending} pending
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Training Card */}
            <div className="dashboard-card upcoming-formations">
              <div className="card-header">
                <h2>Upcoming Training</h2>
              </div>
              <div className="card-content">
                {upcomingFormations.length > 0 ? (
                  <div className="formations-list">
                    {upcomingFormations.map((formation, index) => {
                      const startDate = new Date(formation.dateDebut);
                      const endDate = formation.dateFin ? new Date(formation.dateFin) : null;
                      
                      return (
                        <div key={index} className="formation-event">
                          <div className="calendar-badge">
                            <div className="calendar-month">
                              {startDate.toLocaleString("fr-FR", { month: "short" }).toUpperCase()}
                            </div>
                            <div className="calendar-day">{startDate.getDate()}</div>
                            <div className="calendar-weekday">
                              {startDate.toLocaleString("fr-FR", { weekday: "short" })}
                            </div>
                          </div>
                          <div className="formation-info">
                            <h3 className="formation-title">
                              {formation.theme?.name || formation.titre?.name || "Training"}
                            </h3>
                            <div className="formation-meta">
                              <span className="meta-item">
                                <FiClock /> 
                                {endDate 
                                  ? `${Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))} days`
                                  : "1 day"}
                              </span>
                              {formation.lieu && (
                                <span className="meta-item">
                                  <FiMapPin /> {formation.lieu}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-formations">
                    <FiClock className="no-data-icon" />
                    <p>No upcoming training</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Updates Panel */}
      {showUpdatesPanel && (
          <div className="real-time-updates-panel">
            <div className="panel-header">
              <h3>Recent Updates</h3>
              <button onClick={toggleUpdatesPanel} className="close-panel">
                &times;
              </button>
            </div>
            <div className="updates-feed">
              {newUpdates.length === 0 ? (
                <p className="no-updates">No recent updates</p>
              ) : (
                newUpdates.slice().reverse().map((update, index) => (
                  <div key={index} className="update-item">
                    <div className="update-header">
                      <span className="update-type">{update.type?.replace('_', ' ') || 'update'}</span>
                      <span className="update-time">
                        {new Date(update.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="update-content">
                      {update.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Accueil;