import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { FiSearch, FiFilter, FiCalendar, FiUsers, FiClock, FiCheckCircle, FiXCircle, FiArrowRight, FiRefreshCw } from "react-icons/fi";
import "./Candidatures.css";

const Candidatures = () => {
  const navigate = useNavigate();
  const [candidatures, setCandidatures] = useState([]);
  const [filteredCandidatures, setFilteredCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // Fetch candidatures
  useEffect(() => {
    const fetchCandidatures = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/candidatures");
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des candidatures");
        }
        const data = await response.json();
        setCandidatures(data);
        setFilteredCandidatures(data);
      } catch (error) {
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
  }, [searchQuery, selectedStatus, selectedDepartment, startDate, endDate, candidatures]);

  const applyFilters = () => {
    let filtered = [...candidatures];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (candidature) =>
          candidature.description.toLowerCase().includes(query) ||
          candidature.department.toLowerCase().includes(query) ||
          candidature.location.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter((candidature) => candidature.status === selectedStatus);
    }

    // Filter by department
    if (selectedDepartment !== "all") {
      filtered = filtered.filter((candidature) => candidature.department === selectedDepartment);
    }

    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59); // Include the entire end day

      filtered = filtered.filter((candidature) => {
        const postedDate = new Date(candidature.postedDate);
        return postedDate >= start && postedDate <= end;
      });
    }

    setFilteredCandidatures(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
    setSelectedDepartment("all");
    setStartDate("");
    setEndDate("");
  };

  const toggleFilterExpand = () => {
    setIsFilterExpanded(!isFilterExpanded);
  };

  const handleViewCandidats = (candidatureId) => {
    navigate(`/candidats/${candidatureId}`); // Navigate to the candidats page with candidatureId
  };

  // Get unique departments for filter
  const departments = [...new Set(candidatures.map((c) => c.department))];

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCandidatures.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCandidatures.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="app-container">
        <Sidebar />
        <div className="candidatures-container">
          <Navbar />
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
      <div className="app-container">
        <Sidebar />
        <div className="candidatures-container">
          <Navbar />
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
    <div className="app-container">
      <Sidebar />
      <div className="candidatures-container">
        <Navbar />
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
                className={`filter-tab ${selectedStatus === "active" ? "active" : ""}`}
                onClick={() => setSelectedStatus("active")}
              >
                Actives
              </button>
              <button
                className={`filter-tab ${selectedStatus === "closed" ? "active" : ""}`}
                onClick={() => setSelectedStatus("closed")}
              >
                Clôturées
              </button>
            </div>

            <div className="filter-toggle" onClick={toggleFilterExpand}>
              <FiFilter />
              <span>Filtres</span>
              <span className={`filter-count ${selectedDepartment !== "all" || startDate || endDate ? "active" : ""}`}>
                {(selectedDepartment !== "all" ? 1 : 0) + (startDate && endDate ? 1 : 0)}
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="search-bar-container">
            <div className="search-bar">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Rechercher par titre, département ou lieu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Expandable Filter Panel */}
          <div className={`filter-panel ${isFilterExpanded ? "expanded" : ""}`}>
            <div className="filter-options">
              <div className="filter-group">
                <label>Département</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <option value="all">Tous les départements</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Période de publication</label>
                <div className="date-inputs">
                  <div className="date-input">
                    <FiCalendar className="date-icon" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="Date de début"
                    />
                  </div>
                  <span className="date-separator">à</span>
                  <div className="date-input">
                    <FiCalendar className="date-icon" />
                    <input
                      type="date"
                      value={endDate}
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
              <span className="results-count">{filteredCandidatures.length}</span> offres d'emploi trouvées
            </p>
          </div>

          {/* Candidatures Grid */}
          {filteredCandidatures.length > 0 ? (
            <div className="candidatures-grid">
              {currentItems.map((candidature) => (
                <div key={candidature.id} className="candidature-card">
                  <div className="candidature-header">
                    <span className={`status-badge ${candidature.status === "disponible" ? "status-active" : "status-closed"}`}>
                      {candidature.status === "disponible" ? "disponible" : "Clôturée"}
                    </span>
                    <h3 className="candidature-title">{candidature.description}</h3>
                    <div className="candidature-meta">
                      <span className="department">{candidature.service}</span>
                      <span className="location">{candidature.emplacement}</span>
                    </div>
                  </div>

                  <div className="candidature-body">
                    <p className="candidature-description">{candidature.exigences}</p>

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
                          {candidature.applicantsCount}
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

          {/* Pagination */}
          {filteredCandidatures.length > 0 && (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Candidatures;