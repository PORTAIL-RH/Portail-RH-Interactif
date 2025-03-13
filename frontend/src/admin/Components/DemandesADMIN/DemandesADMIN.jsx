
import { useState, useEffect } from "react"
import { FiSearch, FiFilter, FiCalendar, FiCheck, FiX, FiClock, FiRefreshCw, FiFileText, FiDownload, FiEye } from "react-icons/fi"
import Sidebar from "../Sidebar/Sidebar"
import Navbar from "../Navbar/Navbar"
import "./DemandesADMIN.css"

const DemandesCHEF = () => {
  const [demandes, setDemandes] = useState([])
  const [filteredDemandes, setFilteredDemandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  
  // Selected demande for details view
  const [selectedDemande, setSelectedDemande] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    fetchDemandes()
  }, [])

  const fetchDemandes = async () => {
    setLoading(true);
    setError(null);
  
    try {
      const userId = localStorage.getItem("userId");
      const authToken = localStorage.getItem("authToken");
  
      if (!authToken || !userId) {
        throw new Error("Authentification requise");
      }
  
      const types = ["formation", "conge", "document", "pre-avance", "autorisation"];
      let allDemandes = [];
      let errors = [];
  
      for (const type of types) {
        try {
          const response = await fetch(`http://localhost:8080/api/demande-${type}/personnel/${userId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${authToken}`,
            },
          });
  
          if (!response.ok) {
            throw new Error(`Erreur lors de la récupération des demandes de ${type}`);
          }
  
          const data = await response.json();
          const typedData = data.map((item) => ({
            ...item,
            demandeType: type,
          }));
          allDemandes = [...allDemandes, ...typedData];
        } catch (err) {
          console.error(`Erreur lors de la récupération des demandes de ${type}:`, err);
          errors.push(err.message);
        }
      }
  
      if (errors.length > 0) {
        setError(`Certaines demandes n'ont pas pu être récupérées: ${errors.join(", ")}`);
      }
  
      allDemandes.sort((a, b) => new Date(b.dateDemande) - new Date(a.dateDemande));
      setDemandes(allDemandes);
      setFilteredDemandes(allDemandes);
    } catch (err) {
      setError(err.message || "Une erreur est survenue lors de la récupération des demandes");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    applyFilters()
  }, [searchQuery, selectedType, selectedStatus, startDate, endDate, demandes])

  const applyFilters = () => {
    let filtered = [...demandes]
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(demande => 
        (demande.texteDemande && demande.texteDemande.toLowerCase().includes(query)) ||
        (demande.matPers?.nom && demande.matPers.nom.toLowerCase().includes(query))
      )
    }
    
    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter(demande => demande.demandeType === selectedType)
    }
    
    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(demande => {
        if (selectedStatus === "pending") return demande.reponseChef === "I"
        if (selectedStatus === "approved") return demande.reponseChef === "O"
        if (selectedStatus === "rejected") return demande.reponseChef === "N"
        return true
      })
    }
    
    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59) // Include the entire end day
      
      filtered = filtered.filter(demande => {
        const demandeDate = new Date(demande.dateDemande)
        return demandeDate >= start && demandeDate <= end
      })
    }
    
    setFilteredDemandes(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedType("all")
    setSelectedStatus("all")
    setStartDate("")
    setEndDate("")
  }

  const toggleFilterExpand = () => {
    setIsFilterExpanded(!isFilterExpanded)
  }

  const handleViewDetails = (demande) => {
    setSelectedDemande(demande)
    setShowDetailsModal(true)
  }

  const closeDetailsModal = () => {
    setShowDetailsModal(false)
    setSelectedDemande(null)
  }

  const handleDownloadAttachment = async (demande) => {
    try {
      const authToken = localStorage.getItem("authToken")
      
      if (!authToken) {
        throw new Error("Authentification requise")
      }
      
      const response = await fetch(`http://localhost:8080/api/demande-${demande.demandeType}/download/${demande.id}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      })
      
      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement du fichier")
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `piece-jointe-${demande.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error)
      alert("Erreur lors du téléchargement du fichier")
    }
  }

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredDemandes.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredDemandes.length / itemsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

  // Get status text and class
  const getStatusInfo = (status) => {
    switch (status) {
      case "I":
        return { text: "En attente", className: "status-pending" }
      case "O":
        return { text: "Approuvée", className: "status-approved" }
      case "N":
        return { text: "Rejetée", className: "status-rejected" }
      default:
        return { text: "Inconnue", className: "status-unknown" }
    }
  }

  // Get type text
  const getTypeText = (type) => {
    switch (type) {
      case "formation":
        return "Formation";
      case "conge":
        return "Congé";
      case "document":
        return "Document";
      case "preAvance":
        return "Pré-Avance";
      case "autorisation":
        return "Autorisation";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <Sidebar />
        <div className="demandes-chef-container">
          <Navbar />
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Chargement des demandes...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-container">
        <Sidebar />
        <div className="demandes-chef-container">
          <Navbar />
          <div className="error-container">
            <div className="error-icon">
              <FiX size={48} />
            </div>
            <h2>Erreur lors du chargement des données</h2>
            <p>{error}</p>
            <button className="retry-button" onClick={fetchDemandes}>
              <FiRefreshCw /> Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="demandes-chef-container">
        <Navbar />
        <div className="demandes-chef-content">
          <div className="page-header">
            <h1>Mes Demandes</h1>
            <p>Consultez et gérez toutes vos demandes soumises</p>
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
                className={`filter-tab ${selectedStatus === "pending" ? "active" : ""}`}
                onClick={() => setSelectedStatus("pending")}
              >
                En Attente
              </button>
              <button
                className={`filter-tab ${selectedStatus === "approved" ? "active" : ""}`}
                onClick={() => setSelectedStatus("approved")}
              >
                Approuvées
              </button>
              <button
                className={`filter-tab ${selectedStatus === "rejected" ? "active" : ""}`}
                onClick={() => setSelectedStatus("rejected")}
              >
                Rejetées
              </button>
            </div>

            <div className="filter-toggle" onClick={toggleFilterExpand}>
              <FiFilter />
              <span>Filtres</span>
              <span className={`filter-count ${(selectedType !== "all" || startDate || endDate) ? "active" : ""}`}>
                {(selectedType !== "all" ? 1 : 0) + (startDate && endDate ? 1 : 0)}
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="search-bar-container">
            <div className="search-bar">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Rechercher par contenu ou nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Expandable Filter Panel */}
          <div className={`filter-panel ${isFilterExpanded ? "expanded" : ""}`}>
            <div className="filter-options">
              <div className="filter-group">
                <label>Type de Demande</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="all">Tous les types</option>
                  <option value="formation">Formation</option>
                  <option value="conge">Congé</option>
                  <option value="document">Document</option>
                  <option value="preAvance">Pré-Avance</option>
                  <option value="autorisation">Autorisation</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Période</label>
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
              <span className="results-count">{filteredDemandes.length}</span> demandes trouvées
            </p>
          </div>

          {/* Demandes Table */}
          {filteredDemandes.length > 0 ? (
            <div className="table-container">
              <table className="demandes-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((demande) => (
                    <tr key={`${demande.demandeType}-${demande.id}`}>
                      <td>{formatDate(demande.dateDemande)}</td>
                      <td>
                        <span className={`type-badge ${demande.demandeType}`}>
                          {getTypeText(demande.demandeType)}
                        </span>
                      </td>
                      <td>
                        <div className="demande-text">
                          {demande.texteDemande || demande.titre || <span className="no-content">Aucune description</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`type-badge ${demande.demandeType}`}>
                          {getTypeText(demande.demandeType)}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-button view"
                            onClick={() => handleViewDetails(demande)}
                            title="Voir les détails"
                          >
                            <FiEye />
                          </button>
                          {demande.pieceJointe && (
                            <button
                              className="action-button download"
                              onClick={() => handleDownloadAttachment(demande)}
                              title="Télécharger la pièce jointe"
                            >
                              <FiDownload />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">
                <FiFileText size={48} />
              </div>
              <h3>Aucune demande trouvée</h3>
              <p>Aucune demande ne correspond à vos critères de recherche.</p>
              <button className="clear-filters-button" onClick={clearFilters}>
                Effacer les filtres
              </button>
            </div>
          )}

          {/* Pagination */}
          {filteredDemandes.length > 0 && (
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

          {/* Details Modal */}
          {showDetailsModal && selectedDemande && (
            <div className="modal-overlay" onClick={closeDetailsModal}>
              <div className="demande-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header" data-status={getStatusInfo(selectedDemande.reponseChef).className.replace('status-', '')}>
                  <div className="header-content">
                    <div className="header-text">
                      <h2>Détails de la Demande</h2>
                      <div className="status-text">{getStatusInfo(selectedDemande.reponseChef).text}</div>
                    </div>
                  </div>
                  <button className="close-button" onClick={closeDetailsModal}>
                    <FiX />
                  </button>
                </div>

                <div className="modal-content">
                  <div className="demande-info-section">
                    <div className="section-header">
                      <FiFileText />
                      <h3>Informations Générales</h3>
                    </div>
                    <div className="info-grid">
                      <div className="info-item">
                        <div className="info-label">Type de Demande</div>
                        <div className="info-value">
                          <span className={`type-badge ${selectedDemande.demandeType}`}>
                            {getTypeText(selectedDemande.demandeType)}
                          </span>
                        </div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Date de Soumission</div>
                        <div className="info-value">{formatDate(selectedDemande.dateDemande)}</div>
                      </div>
                      {selectedDemande.dateDebut && (
                        <div className="info-item">
                          <div className="info-label">Date de Début</div>
                          <div className="info-value">{formatDate(selectedDemande.dateDebut)}</div>
                        </div>
                      )}
                      {selectedDemande.dateFin && (
                        <div className="info-item">
                          <div className="info-label">Date de Fin</div>
                          <div className="info-value">{formatDate(selectedDemande.dateFin)}</div>
                        </div>
                      )}
                      {selectedDemande.nbrJours && (
                        <div className="info-item">
                          <div className="info-label">Nombre de Jours</div>
                          <div className="info-value">{selectedDemande.nbrJours}</div>
                        </div>
                      )}
                      {selectedDemande.montant && (
                        <div className="info-item">
                          <div className="info-label">Montant</div>
                          <div className="info-value">{selectedDemande.montant} €</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="demande-info-section">
                    <div className="section-header">
                      <FiFileText />
                      <h3>Description de la Demande</h3>
                    </div>
                    <div className="demande-text-full">
                      {selectedDemande.texteDemande || <span className="no-content">Aucune description fournie</span>}
                    </div>
                  </div>

                  {selectedDemande.pieceJointe && (
                    <div className="demande-info-section">
                      <div className="section-header">
                        <FiFileText />
                        <h3>Pièce Jointe</h3>
                      </div>
                      <button
                        className="download-button"
                        onClick={() => handleDownloadAttachment(selectedDemande)}
                      >
                        <FiDownload />
                        <span>Télécharger la pièce jointe</span>
                      </button>
                    </div>
                  )}

                  {selectedDemande.texteReponse && (
                    <div className="demande-info-section">
                      <div className="section-header">
                        <FiFileText />
                        <h3>Réponse</h3>
                      </div>
                      <div className="response-text">
                        {selectedDemande.texteReponse}
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeDetailsModal}>
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DemandesCHEF
