import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { FiSearch, FiFilter, FiCalendar, FiCheck, FiClock, FiRefreshCw, FiFileText } from "react-icons/fi";
import "./Demandes.css";
import DemandeDetailsModal from "./DemandeDetailsModal";
import { API_URL } from "../../../config";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const DemandesConge = () => {
  // Load initial data from localStorage with proper structure
  const [demandes, setDemandes] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('demandes');
      return cached ? JSON.parse(cached).conge || [] : [];
    }
    return [];
  });

  const [allDemandes, setAllDemandes] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('demandes');
      return cached ? JSON.parse(cached) : {
        conge: [],
        formation: [],
        document: [],
        preAvance: [],
        autorisation: []
      };
    }
    return {
      conge: [],
      formation: [],
      document: [],
      preAvance: [],
      autorisation: []
    };
  });

  const [loading, setLoading] = useState(false);
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
  const [processingId, setProcessingId] = useState(null);

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.className = savedTheme;
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  // Fetch demandes with proper storage structure
  const fetchDemandes = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/demande-conge/approved`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(await response.text());
      
      const congeData = await response.json();
      
      // Update both the specific conge state and the complete demandes structure
      setDemandes(congeData);
      
      // Update the complete demandes structure in localStorage
      const updatedAllDemandes = {
        ...allDemandes,
        conge: congeData
      };
      setAllDemandes(updatedAllDemandes);
      localStorage.setItem("demandes", JSON.stringify(updatedAllDemandes));
      
      setError(null);
    } catch (error) {
      setError(error.message);
      console.error("Error fetching demandes:", error);
      
      // If we have cached data, don't show error to user
      const cached = localStorage.getItem('demandes');
      if (!cached) {
        toast.error("Erreur de chargement des demandes");
      }
    } finally {
      setLoading(false);
    }
  }, [allDemandes]);

  // Initial data fetch and setup polling
  useEffect(() => {
    // First try to load from localStorage
    const cachedDemandes = localStorage.getItem('demandes');
    if (!cachedDemandes) {
      toast.info("Chargement des demandes...", { autoClose: false, toastId: 'demandes-loading' });
    }
    
    fetchDemandes().then(() => {
      toast.dismiss('demandes-loading');
    });

    // Set up polling every 10 seconds
    const intervalId = setInterval(fetchDemandes, 2000);

    // SSE for real-time updates
    const eventSource = new EventSource(`${API_URL}/api/sse/updates`);
    eventSource.onmessage = () => fetchDemandes();

    return () => {
      clearInterval(intervalId);
      eventSource.close();
    };
  }, [fetchDemandes]);

  // Filter demandes
  useEffect(() => {
    let filtered = demandes;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d => 
        (d.employee?.nom?.toLowerCase().includes(query)) || 
        (d.employee?.prenom?.toLowerCase().includes(query)) ||
        (d.employee?.matricule?.toLowerCase().includes(query)) ||
        (d.texteDemande?.toLowerCase().includes(query))
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(d => 
        selectedStatus === "T" 
          ? d.reponseRH === "T"
          : d.reponseRH === selectedStatus
      );
    }

    if (startDate && endDate) {
      filtered = filtered.filter(d => {
        const demandeDate = new Date(d.dateDemande);
        return demandeDate >= new Date(startDate) && demandeDate <= new Date(endDate);
      });
    }

    setFilteredDemandes(filtered);
  }, [demandes, searchQuery, selectedStatus, startDate, endDate]);

  // Process demande with proper storage updates
  const traiterDemande = async (demandeId) => {
    setProcessingId(demandeId);
    const toastId = toast.loading(
      "Traitement de la demande en cours...",
      {
        position: "top-center",
        theme: theme
      }
    );

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/demande-conge/traiter/${demandeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const responseClone = response.clone();
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        const textResponse = await responseClone.text();
        if (textResponse.includes("Demande traitée")) {
          responseData = { 
            id: demandeId,
            reponseRH: "T",
            message: textResponse
          };
        } else {
          throw new Error(textResponse);
        }
      }

      // Update both the specific conge state and the complete demandes structure
      const updatedConge = demandes.map(d => 
        d.id === demandeId ? { ...d, reponseRH: responseData.reponseRH } : d
      );
      setDemandes(updatedConge);
      
      const updatedAllDemandes = {
        ...allDemandes,
        conge: updatedConge
      };
      setAllDemandes(updatedAllDemandes);
      localStorage.setItem('demandes', JSON.stringify(updatedAllDemandes));

      toast.update(toastId, {
        render: "Demande traitée avec succès ✅",
        type: "success",
        isLoading: false,
        autoClose: 3000,
        closeButton: true,
      });
    } catch (error) {
      console.error("Error processing demande:", error);
      toast.update(toastId, {
        render: `Échec du traitement: ${error.message}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
        closeButton: true,
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Show loading only when we have no cached data and are loading
  const showLoading = loading && demandes.length === 0;

  if (showLoading) {
    return (
      <div className={`app-container ${theme}`}>
        <Sidebar theme={theme} />
        <div className="demandes-container">
          <Navbar theme={theme} toggleTheme={toggleTheme} />
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Chargement des demandes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && demandes.length === 0) {
    return (
      <div className={`app-container ${theme}`}>
        <Sidebar theme={theme} />
        <div className="demandes-container">
          <Navbar theme={theme} toggleTheme={toggleTheme} />
          <div className="error-container">
            <h2>Erreur lors du chargement</h2>
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
      <ToastContainer
        position="top-center"
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
      
      <Sidebar theme={theme} />
      <div className="demandes-container">
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <div className="demandes-content">
          <div className="page-header">
            <h1>Demandes de Congés</h1>
            <p>Gérez les demandes de congés de vos collaborateurs</p>
          </div>

          {/* Filters */}
          <div className="filter-tabs-container">
            <div className="filter-tabs">
              {["all", "I", "T"].map(status => (
                <button
                  key={status}
                  className={`filter-tab ${selectedStatus === status ? "active" : ""}`}
                  onClick={() => setSelectedStatus(status)}
                >
                  {{
                    all: "Tous",
                    I: "En Attente",
                    T: "Traitées"
                  }[status]}
                </button>
              ))}
            </div>
            
            <div className="search-filter-container">
              <div className="search-bar">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Rechercher par nom, matricule ou contenu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <button 
                className="filter-toggle" 
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              >
                <FiFilter />
                <span>Filtres Date</span>
              </button>
            </div>
          </div>

          {isFilterExpanded && (
            <div className="filter-panel expanded">
              <div className="date-range-picker">
                <div className="date-input-group">
                  <label>Du</label>
                  <div className="date-input">
                    <FiCalendar />
                    <input
                      type="date"
                      value={startDate || ""}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="date-input-group">
                  <label>Au</label>
                  <div className="date-input">
                    <FiCalendar />
                    <input
                      type="date"
                      value={endDate || ""}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                    />
                  </div>
                </div>
              </div>
              
              <button 
                className="clear-filters"
                onClick={() => {
                  setStartDate(null);
                  setEndDate(null);
                }}
              >
                Effacer
              </button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="stats-cards">
            {[
              { 
                type: "total", 
                label: "Total", 
                value: demandes.length, 
                icon: <FiFileText /> 
              },
              { 
                type: "pending", 
                label: "En Attente", 
                value: demandes.filter(d => d.reponseRH === "I").length, 
                icon: <FiClock /> 
              },
              { 
                type: "approved", 
                label: "Traitées", 
                value: demandes.filter(d => d.reponseRH === "T").length, 
                icon: <FiCheck /> 
              }
            ].map(card => (
              <div key={card.type} className={`stat-card ${card.type}`}>
                <div className="stat-icon">{card.icon}</div>
                <div className="stat-content">
                  <div className="stat-value">{card.value}</div>
                  <div className="stat-label">{card.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Results count */}
          <div className="results-summary">
            <p>
              <span className="results-count">{filteredDemandes.length}</span> 
              {filteredDemandes.length === 1 ? " demande trouvée" : " demandes trouvées"}
            </p>
          </div>

          {/* Demandes Table */}
          <div className="table-responsive">
            <table className="demandes-table">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Matricule</th>
                  <th>Période</th>
                  <th>nbrJours</th>
                  <th>Temp Depart</th>
                  <th>Temp Retour</th>
                  <th>Texte demande</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDemandes.length > 0 ? (
                  filteredDemandes.map(demande => (
                    <tr key={demande.id}>
                      <td>
                        <div className="employee-info">
                          <span className="employee-name">
                            {demande.employee?.nom || "Inconnu"} {demande.employee?.prenom}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="employee-matricule">
                          {demande.employee?.matricule || "N/A"}
                        </span>
                      </td>
                      <td>
                        <div className="date-range">
                          <div>
                            <FiCalendar className="date-icon" />
                            {new Date(demande.dateDebut).toLocaleDateString()}
                          </div>
                          <div className="date-separator">→</div>
                          <div>
                            <FiCalendar className="date-icon" />
                            {new Date(demande.dateFin).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="employee-matricule">
                          {demande.nbrJours || "N/A"}
                        </span>
                      </td>
                      <td>
                        <span className="employee-matricule">
                          {demande.snjTempDep || "N/A"}
                        </span>
                      </td>
                      <td>
                        <span className="employee-matricule">
                          {demande.snjTempRetour || "N/A"}
                        </span>
                      </td>
                      <td>
                        <span className="employee-matricule">
                          {demande.texteDemande || "N/A"}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${demande.reponseRH.toLowerCase()}`}>
                          {{
                            I: <><FiClock /> En attente</>,
                            T: <><FiCheck /> Traité</>
                          }[demande.reponseRH]}
                        </span>
                      </td>
                      <td>
                        {demande.reponseRH === "I" ? (
                          <div className="action-buttons">
                            <button
                              className="btn-approve"
                              onClick={(e) => {
                                e.stopPropagation();
                                traiterDemande(demande.id);
                              }}
                              disabled={processingId === demande.id}
                            >
                              {processingId === demande.id ? (
                                <span className="processing">Traitement...</span>
                              ) : (
                                <>
                                  <FiCheck /> Traiter
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="no-actions">Aucune action</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="no-results">
                    <td colSpan="9">
                      <div className="no-results-content">
                        <FiFilter size={48} />
                        <h3>Aucune demande trouvée</h3>
                        <p>Aucune demande ne correspond à vos critères de recherche</p>
                        <button 
                          className="btn-clear-filters"
                          onClick={() => {
                            setSelectedStatus("all");
                            setStartDate(null);
                            setEndDate(null);
                            setSearchQuery("");
                          }}
                        >
                          Réinitialiser les filtres
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Demande Details Modal */}
          {isModalOpen && selectedDemande && (
            <DemandeDetailsModal
              demande={selectedDemande}
              onClose={() => setIsModalOpen(false)}
              onApprove={() => traiterDemande(selectedDemande.id)}
              isProcessing={processingId === selectedDemande.id}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DemandesConge;