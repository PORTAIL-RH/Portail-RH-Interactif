import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { 
  FiSearch, 
  FiFilter, 
  FiCalendar, 
  FiUsers, 
  FiClock, 
  FiXCircle, 
  FiArrowRight, 
  FiRefreshCw 
} from "react-icons/fi";
import "./Candidatures.css";
import { API_URL } from "../../../config";

const Candidatures = () => {
  const navigate = useNavigate();
  const [candidatures, setCandidatures] = useState([]);
  const [filteredCandidatures, setFilteredCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCandidatureName, setSelectedCandidatureName] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [theme, setTheme] = useState("light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail);
    };

    window.addEventListener('sidebarToggled', handleSidebarToggle);
    
    return () => {
      window.removeEventListener('sidebarToggled', handleSidebarToggle);
    };
  }, []);

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (theme) => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    applyTheme(newTheme);
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }));
  };

  // Fetch candidatures with candidate counts
  useEffect(() => {
    const fetchCandidatures = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all job postings
        const response = await fetch(`${API_URL}/api/candidatures`);
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des candidatures");
        }
        const data = await response.json();
        
        // Fetch candidate count for each position in parallel
        const candidaturesWithCounts = await Promise.all(
          data.map(async (candidature) => {
            try {
              const countResponse = await fetch(
                `${API_URL}/api/candidats/${candidature.id}/candidate-count`,
                { credentials: 'include' }
              );
              
              if (!countResponse.ok) {
                console.error(`Failed to fetch count for candidature ${candidature.id}`);
                return { ...candidature, applicantsCount: 0 };
              }
              
              const countData = await countResponse.json();
              return { ...candidature, applicantsCount: countData };
            } catch (error) {
              console.error(`Error fetching count for candidature ${candidature.id}:`, error);
              return { ...candidature, applicantsCount: 0 };
            }
          })
        );
        
        setCandidatures(candidaturesWithCounts);
        setFilteredCandidatures(candidaturesWithCounts);
      } catch (error) {
        console.error("Fetch error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidatures();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedStatus, selectedCandidatureName, startDate, endDate, candidatures]);

  const applyFilters = () => {
    let filtered = [...candidatures];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (candidature) =>
          candidature.description.toLowerCase().includes(query) ||
          candidature.emplacement.toLowerCase().includes(query),
      );
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter((candidature) => candidature.status === selectedStatus);
    }

    // Filter by candidature name (description)
    if (selectedCandidatureName !== "all") {
      filtered = filtered.filter((candidature) => candidature.description === selectedCandidatureName);
    }

    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59); // Include the entire end day

      filtered = filtered.filter((candidature) => {
        const postedDate = new Date(candidature.dateAjoutPostulation);
        return postedDate >= start && postedDate <= end;
      });
    }

    setFilteredCandidatures(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
    setSelectedCandidatureName("all");
    setStartDate("");
    setEndDate("");
  };

  const toggleFilterExpand = () => {
    setIsFilterExpanded(!isFilterExpanded);
  };

  const handleViewCandidats = (candidatureId) => {
    navigate(`/candidats/${candidatureId}`);
  };

  // Get unique candidature names (descriptions) for filter
  const candidatureNames = [...new Set(candidatures.map((c) => c.description))];

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (e) {
      return "N/A";
    }
  };

  const renderRequiredSkills = (skills) => {
    if (!skills || Object.keys(skills).length === 0) {
      return <p className="no-skills">Aucune compétence spécifique requise</p>;
    }

    return Object.entries(skills).map(([skill, percentage]) => (
      <div key={skill} className="required-skill-item">
        <div className="required-skill-info">
          <span className="required-skill-name">{skill}</span>
          <span className="required-skill-percentage">{percentage}%</span>
        </div>
        <div className="required-skill-bar-container">
          <div 
            className="required-skill-bar" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    ));
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCandidatures.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCandidatures.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className={`app-container ${theme}`}>
        <Sidebar theme={theme} />
        <div className={`candidatures-container ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <Navbar theme={theme} toggleTheme={toggleTheme} />
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Chargement des candidatures...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`app-container ${theme}`}>
        <Sidebar theme={theme} />
        <div className={`candidatures-container ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <Navbar theme={theme} toggleTheme={toggleTheme} />
          <div className="error-container">
            <div className="error-icon">
              <FiXCircle size={48} />
            </div>
            <h2>Erreur lors du chargement des données</h2>
            <p>{error}</p>
            <button className="retry-button" onClick={() => window.location.reload()}>
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
      <div className={`candidatures-container ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <div className="candidatures-content">
          <div className="page-header">
            <h1>Offres d'Emploi</h1>
            <p>Gérez et suivez toutes les offres d'emploi publiées</p>
          </div>

          {/* Filter and Search Bar */}
          <div className="filter-tabs-container">
            <div className="filter-tabs">
              <button
                className={`filter-tab ${selectedStatus === "all" ? "active" : ""}`}
                onClick={() => setSelectedStatus("all")}
              >
                Toutes
              </button>
              <button
                className={`filter-tab ${selectedStatus === "disponible" ? "active" : ""}`}
                onClick={() => setSelectedStatus("disponible")}
              >
                Disponibles
              </button>
              <button
                className={`filter-tab ${selectedStatus === "clôturé" ? "active" : ""}`}
                onClick={() => setSelectedStatus("clôturé")}
              >
                Clôturées
              </button>
            </div>

            <div className="filter-toggle" onClick={toggleFilterExpand}>
              <FiFilter />
              <span>Filtres</span>
              <span
                className={`filter-count ${selectedCandidatureName !== "all" || startDate || endDate ? "active" : ""}`}
              >
                {(selectedCandidatureName !== "all" ? 1 : 0) + (startDate && endDate ? 1 : 0)}
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="search-bar-container">
            <div className="search-bar">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Rechercher par titre ou lieu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Expandable Filter Panel */}
          <div className={`filter-panel ${isFilterExpanded ? "expanded" : ""}`}>
            <div className="filter-options">
              <div className="filter-group">
                <label>Nom de la candidature</label>
                <select 
                  value={selectedCandidatureName} 
                  onChange={(e) => setSelectedCandidatureName(e.target.value)}
                >
                  <option value="all">Toutes les candidatures</option>
                  {candidatureNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Date de début</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>Date de fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
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
              <span className="results-count">{filteredCandidatures.length}</span> offres d'emploi trouvées
            </p>
          </div>

          {/* Candidatures Grid */}
          {filteredCandidatures.length > 0 ? (
            <>
              <div className="candidatures-grid">
                {currentItems.map((candidature) => (
                  <div key={candidature.id} className="candidature-card">
                    <div className="candidature-header">
                      <span
                        className={`status-badge ${candidature.status === "disponible" ? "status-active" : "status-closed"}`}
                      >
                        {candidature.status === "disponible" ? "Disponible" : "Clôturée"}
                      </span>
                      <h3 className="candidature-title">{candidature.description}</h3>
                      <div className="candidature-meta">
                        <span className="location">{candidature.emplacement}</span>
                        <span className="experience">{candidature.anneeExperiences} ans d'expérience</span>
                      </div>
                    </div>

                    <div className="candidature-body">
                      <p className="candidature-description">{candidature.exigences}</p>

                      <div className="required-skills-section">
                        <h4>Compétences Requises</h4>
                        {renderRequiredSkills(candidature.skillsWithPercentage)}
                      </div>

                      <div className="candidature-details">
                        <div className="detail-item">
                          <span className="detail-label">Date de publication</span>
                          <span className="detail-value">{formatDate(candidature.dateAjoutPostulation)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Date de clôture</span>
                          <span className="detail-value">{formatDate(candidature.dateFermeturePostulation)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Candidats</span>
                          <span className="detail-value applicants">
                            <FiUsers className="applicants-icon" />
                            {candidature.applicantsCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="candidature-footer">
                      <button 
                        className="view-candidats-button" 
                        onClick={() => handleViewCandidats(candidature.id)}
                      >
                        Voir les candidats
                        <FiArrowRight className="button-icon" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="pagination">
                <button
                  className="pagination-button"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Précédent
                </button>
                <div className="pagination-info">
                  Page {currentPage} sur {totalPages}
                </div>
                <button
                  className="pagination-button"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </button>
              </div>
            </>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">
                <FiClock size={48} />
              </div>
              <h3>Aucune offre d'emploi trouvée</h3>
              <p>Aucune offre d'emploi ne correspond à vos critères de recherche.</p>
              <button className="clear-filters-button" onClick={clearFilters}>
                Effacer les filtres
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Candidatures;