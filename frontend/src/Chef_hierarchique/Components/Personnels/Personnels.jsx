import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import PersonnelDetailsModal from "./PersonnelsDetailsModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Personnels.css";
import { API_URL } from "../../../config"

const Personnel = () => {
  const [personnelData, setPersonnelData] = useState({
    collaborators: [],
    serviceName: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [matriculeFilter, setMatriculeFilter] = useState("");
  const [theme, setTheme] = useState("light");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dataSource, setDataSource] = useState("");

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
      if (!userData) {
        console.warn("No userId found in localStorage");
        return null;
      }
      
      try {
        const parsed = JSON.parse(userData);
        return parsed?.userId || parsed?.id || userData;
      } catch (e) {
        return userData;
      }
    } catch (e) {
      console.error("Error reading userId:", e);
      return null;
    }
  };

  const userId = getUserId();

  const fetchFromLocalStorage = () => {
    const personnels = localStorage.getItem("personnels");
    if (personnels) {
      console.log("Found personnel data in localStorage");
      const parsedData = JSON.parse(personnels);
      const normalizedData = {
        collaborators: parsedData.collaborators || parsedData || [],
        serviceName: parsedData.serviceName || "Local Storage Data"
      };
      setPersonnelData(normalizedData);
      setDataSource("localStorage");
      setLastUpdated(new Date());
      return true;
    }
    return false;
  };

  const fetchFromAPI = async (isPolling = false) => {
    try {
      console.log(isPolling ? "Polling for personnel data updates..." : "Fetching personnel data from API...");
      const response = await fetch(
       `${API_URL}/api/Personnel/collaborateurs-by-service/${userId}`
      );
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const apiData = await response.json();
      const normalizedData = {
        collaborators: apiData.collaborators || [],
        serviceName: apiData.serviceName || ""
      };

      // For polling updates, merge with existing data rather than replace
      if (isPolling) {
        setPersonnelData(prev => {
          // Create a map of existing collaborators for quick lookup
          const existingMap = new Map(prev.collaborators.map(item => [item.id, item]));
          
          // Merge with new data, preserving existing entries if not in update
          const mergedCollaborators = [
            ...prev.collaborators.filter(item => !normalizedData.collaborators.some(newItem => newItem.id === item.id)),
            ...normalizedData.collaborators
          ];

          return {
            ...prev,
            collaborators: mergedCollaborators,
            serviceName: normalizedData.serviceName || prev.serviceName
          };
        });
      } else {
        // For initial load or manual refresh, replace the data
        setPersonnelData(normalizedData);
      }

      // Always update localStorage with the fresh API data
      localStorage.setItem("personnels", JSON.stringify(normalizedData));
      console.log("Updated personnel data in localStorage");

      setDataSource("API");
      setLastUpdated(new Date());
      return true;
    } catch (error) {
      console.error("API fetch error:", error);
      setError(error.message);
      return false;
    }
  };

  const fetchPersonnel = async (forceRefresh = false, isPolling = false) => {
    let toastId;
    try {
      if (!isPolling) {
        setLoading(true);
        setError(null);
        
        if (!forceRefresh) {
          toastId = toast.info("Loading personnel data...", {
            autoClose: false,
            closeOnClick: false,
          });
        }
      }

      if (!userId) throw new Error("User ID not found");

      // Try localStorage first unless forced refresh or polling
      if (!forceRefresh && !isPolling && fetchFromLocalStorage()) {
        if (toastId) {
          toast.update(toastId, {
            render: "Data loaded from localStorage",
            type: "success",
            autoClose: 3000,
          });
        }
        return;
      }

      // Fall back to API
      if (await fetchFromAPI(isPolling)) {
        if (toastId || (forceRefresh && !isPolling)) {
          const message = forceRefresh ? "Data refreshed from API" : "Data loaded from API";
          toast.success(message, { autoClose: 3000 });
        }
      } else {
        throw new Error("Failed to load data from both localStorage and API");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setError(error.message);
      
      if (toastId) {
        toast.update(toastId, {
          render: `Error: ${error.message}`,
          type: "error",
          autoClose: 5000,
        });
      } else if (!isPolling) {
        toast.error(`Error: ${error.message}`, { autoClose: 5000 });
      }
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  };

  // Initial fetch and setup polling
  useEffect(() => {
    fetchPersonnel();

    const pollingInterval = setInterval(() => {
      fetchPersonnel(true, true); // Force refresh from API with polling flag
    }, 3000); // Poll every 30 seconds

    return () => clearInterval(pollingInterval);
  }, [userId]);

  // Filter personnel
  const filteredCollaborateurs = personnelData.collaborators.filter(
    (person) =>
      (nameFilter === "" ||
        (person.nom && person.nom.toLowerCase().includes(nameFilter.toLowerCase())) ||
        (person.prenom && person.prenom.toLowerCase().includes(nameFilter.toLowerCase()))) &&
      (matriculeFilter === "" ||
        (person.matricule && person.matricule.toLowerCase().includes(matriculeFilter.toLowerCase())))
  );

  const handleNameFilterChange = (e) => setNameFilter(e.target.value);
  const handleMatriculeFilterChange = (e) => setMatriculeFilter(e.target.value);
  const clearFilters = () => {
    setNameFilter("");
    setMatriculeFilter("");
  };
  const handleRowClick = (person) => {
    setSelectedPersonnel(person);
    setIsModalOpen(true);
  };
  const handleRefresh = () => fetchPersonnel(true);

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className="personnel-container">
        <Navbar theme={theme} toggleTheme={toggleTheme}/>
        <ToastContainer position="top-right" />
        <div className="personnel-content">
          <header className="page-header">
            <div className="header-row">
              <h1>Personnel Management</h1>
            </div>

            <small className="data-source-indicator">
              Data loaded from: {dataSource} | 
              Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "Never"}
            </small>
          </header>

          <main className="personnel-main">
            <div className="personnel-card">
              <div className="card-header">
                <div className="header-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <h2>Collaborateurs</h2>
                </div>
              </div>
              
              <div className="filter-section">
                <div className="filter-group">
                  <div className="filter-input-group">
                    <label htmlFor="nameFilter">Name</label>
                    <div className="input-with-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <input
                        id="nameFilter"
                        type="text"
                        placeholder="Filter by name..."
                        value={nameFilter}
                        onChange={handleNameFilterChange}
                      />
                    </div>
                  </div>
                  
                  <div className="filter-input-group">
                    <label htmlFor="matriculeFilter">Matricule</label>
                    <div className="input-with-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      <input
                        id="matriculeFilter"
                        type="text"
                        placeholder="Filter by matricule..."
                        value={matriculeFilter}
                        onChange={handleMatriculeFilterChange}
                      />
                    </div>
                  </div>
                  
                  <button className="clear-filter-button" onClick={clearFilters}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Clear Filters
                  </button>
                </div>
                
                <div className="results-count">
                  {loading ? "Loading..." : `${filteredCollaborateurs.length} collaborateurs found`}
                </div>
              </div>
              
              <div className="card-content">
                {loading ? (
                  <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                  </div>
                ) : filteredCollaborateurs.length > 0 ? (
                  <div className="table-container">
                    <table className="personnel-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Matricule</th>
                          <th>Status</th>
                          <th>Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCollaborateurs.map((person) => (
                          <tr key={person.id} onClick={() => handleRowClick(person)}>
                            <td className="name-cell">
                              {person.nom || "Nom non disponible"}
                              {person.prenom && <span className="prenom">{person.prenom}</span>}
                            </td>
                            <td>{person.email}</td>
                            <td>{person.matricule}</td>
                            <td>
                              <span className={`status-badge ${person.active ? "active" : "inactive"}`}>
                                {person.active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td>{person.role}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="no-data-message">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="empty-icon">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                    <p>
                      {personnelData.collaborators.length === 0
                        ? "No personnel found"
                        : "No matching personnel found"}
                    </p>
                    {(nameFilter || matriculeFilter) && (
                      <button className="clear-filter-button" onClick={clearFilters}>
                        Clear Filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isModalOpen && selectedPersonnel && (
              <PersonnelDetailsModal
                key={selectedPersonnel.id}
                personnel={selectedPersonnel}
                onClose={() => setIsModalOpen(false)}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Personnel;