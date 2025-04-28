import { useState, useEffect } from "react";
import {
  FiFilter,
  FiSearch,
  FiAlertCircle,
  FiCalendar,
  FiFileText,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiEdit,
  FiX,
  FiTrash2,
  FiDownload,
  FiInfo,
  FiDollarSign,
  FiBook,
  FiUser ,
  FiList,
  FiMenu,
  FiChevronDown,


  FiBriefcase,
  FiCheckCircle,
} from "react-icons/fi";
import Navbar from "../Components/Navbar/Navbar";
import Sidebar from "../Components/Sidebar/Sidebar";
import { API_URL } from "../../config";
import "../common-ui.css";
import "./Demandes.css";
import { useNavigate } from "react-router-dom";

const HistoriqueDemandes = () => {
  const [demandes, setDemandes] = useState([]);
  const [filteredDemandes, setFilteredDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("authToken");

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDemandes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDemandes.length / itemsPerPage);

  useEffect(() => {
    const fetchDemandes = async () => {
      try {
        setLoading(true);
        const types = ["formation", "conge", "document", "pre-avance", "autorisation"];
        let allDemandes = [];

        for (const type of types) {
          const response = await fetch(`${API_URL}/api/demande-${type}/personnel/${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            const typedData = data.map(item => ({
              ...item,
              type: type.charAt(0).toUpperCase() + type.slice(1),
              status: getStatus(item),
              date: item.dateDemande || new Date().toISOString(),
            }));
            allDemandes = [...allDemandes, ...typedData];
          }
        }

        allDemandes.sort((a, b) => new Date(b.date) - new Date(a.date));
        setDemandes(allDemandes);
        setFilteredDemandes(allDemandes);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId && token) {
      fetchDemandes();
    } else {
      setError("Session invalide. Veuillez vous reconnecter.");
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    let filtered = [...demandes];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(demande =>
        (demande.texteDemande && demande.texteDemande.toLowerCase().includes(query)) ||
        (demande.type && demande.type.toLowerCase().includes(query)) ||
        (demande.status && demande.status.toLowerCase().includes(query))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(demande => {
        const status = demande.status.toLowerCase();
        return status.includes(statusFilter.toLowerCase());
      });
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(demande =>
        demande.type.toLowerCase() === typeFilter.toLowerCase()
      );
    }

    setFilteredDemandes(filtered);
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter, demandes]);

  const getStatus = (demande) => {
    if (demande.reponseChef === "O") return "Approuvée";
    if (demande.reponseChef === "N") return "Rejetée";
    if (demande.reponseChef === "I") return "En attente";
    if (demande.statut === "O") return "Approuvée";
    if (demande.statut === "N") return "Rejetée";
    return "En attente";
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("fr-FR");
    } catch {
      return dateString;
    }
  };

  const getStatusClass = (status) => {
    if (status.includes("Approuvée")) return "status-approved";
    if (status.includes("Rejetée")) return "status-rejected";
    return "status-pending";
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "Formation": return <FiBook className="type-icon formation" />;
      case "Conge": return <FiCalendar className="type-icon conge" />;
      case "Document": return <FiFileText className="type-icon document" />;
      case "PreAvance": return <FiDollarSign className="type-icon preavance" />;
      case "Autorisation": return <FiClock className="type-icon autorisation" />;
      default: return <FiFileText className="type-icon" />;
    }
  };

  const handleNavigateToProfile = () => {
    navigate("/Profile");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des demandes en cours...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <FiAlertCircle size={48} className="error-icon" />
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="content-container">
        <Navbar />
        <div className="page-content">
          <div className="page-header">
            <h1>Historique des Demandes</h1>
            <p className="page-subtitle">Consultez l'historique de vos demandes</p>
          </div>

          <div className="profile-tabs">
            
            <button
              className={`tab-button active`}
            >
              <FiList className="tab-icon" />
              Historique des Demandes
            </button>
          </div>

          <div className="demandes-content">
            <div className="filters-container">
              <div className="search-container">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Rechercher une demande..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button className="clear-search" onClick={() => setSearchQuery("")}>
                    <FiX />
                  </button>
                )}
              </div>

              <div className="filter-options">
                <div className="filter-group">
                  <label>Statut</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="Approuvée">Approuvée</option>
                    <option value="Rejetée">Rejetée</option>
                    <option value="En attente">En attente</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="all">Tous les types</option>
                    {[...new Set(demandes.map(d => d.type))].map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="content-card">
              <div className="card-header">
                <h2>Liste des Demandes</h2>
                <span className="card-count">{filteredDemandes.length} demande(s)</span>
              </div>

              <div className="demandes-table-container">
                {currentItems.length > 0 ? (
                  <>
                    <table className="demandes-table">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map((demande, index) => (
                          <tr key={`${demande.type}-${index}`}>
                            <td>
                              <div className="demande-type">
                                {getTypeIcon(demande.type)}
                                {demande.type}
                              </div>
                            </td>
                            <td>{formatDate(demande.date)}</td>
                            <td className="description-cell">
                              {demande.texteDemande || "Aucune description"}
                            </td>
                            <td>
                              <span className={`status-badge ${getStatusClass(demande.status)}`}>
                                {demande.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {totalPages > 1 && (
                      <div className="pagination">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <FiChevronLeft />
                        </button>
                        <span>
                          Page {currentPage} sur {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <FiChevronRight />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-state">
                    <FiFileText size={48} className="empty-icon" />
                    <h3>Aucune demande trouvée</h3>
                    <p>Aucune demande ne correspond à vos critères de recherche.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoriqueDemandes;