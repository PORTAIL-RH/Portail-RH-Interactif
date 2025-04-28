
"use client"

import { useState, useEffect } from "react"
import { FiFilter, FiSearch, FiEye, FiX } from "react-icons/fi"
import { FaGraduationCap, FaFileAlt, FaMoneyBillWave, FaShieldAlt, FaCalendarAlt } from "react-icons/fa"
import "./Profile.css"

const Demandes = ({ userId }) => {
  const [demandes, setDemandes] = useState([])
  const [filteredDemandes, setFilteredDemandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState("all")
  const [activeTypeFilter, setActiveTypeFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchUserDemandes(userId)
    }
  }, [userId])

  // Apply filters when they change
  useEffect(() => {
    filterDemandes(activeFilter, activeTypeFilter, searchQuery)
  }, [activeFilter, activeTypeFilter, searchQuery, demandes])

  const fetchUserDemandes = async (userId) => {
    try {
      setLoading(true)

      // Define the API endpoints for different request types
      const endpoints = [
        `/api/demande-autorisation/personnel/${userId}`,
        `/api/demande-conge/personnel/${userId}`,
        `/api/demande-formation/personnel/${userId}`,
        `/api/demande-pre-avance/personnel/${userId}`,
        `/api/demande-document/personnel/${userId}`,
      ]

      // Fetch data from all endpoints
      const responses = await Promise.all(
        endpoints.map((endpoint) =>
          fetch(`http://localhost:8080${endpoint}`)
            .then((response) => {
              if (!response.ok) {
                console.warn(`Failed to fetch from ${endpoint}`)
                return []
              }
              return response.json()
            })
            .catch((error) => {
              console.error(`Error fetching from ${endpoint}:`, error)
              return []
            }),
        ),
      )

      // Process and combine all responses
      const [autorisations, conges, formations, preAvances, documents] = responses

      // Map and normalize the data
      const allDemandes = [
        ...mapDemandes(autorisations, "autorisation"),
        ...mapDemandes(conges, "congé"),
        ...mapDemandes(formations, "formation"),
        ...mapDemandes(preAvances, "pre-avance"),
        ...mapDemandes(documents, "document"),
      ]

      // Sort by date (newest first)
      allDemandes.sort((a, b) => new Date(b.dateObj) - new Date(a.dateObj))

      setDemandes(allDemandes)
      setFilteredDemandes(allDemandes)
    } catch (error) {
      console.error("Error fetching user demandes:", error)
      setError("Erreur lors du chargement des demandes")
    } finally {
      setLoading(false)
    }
  }

  // Helper function to map and normalize demandes data
  const mapDemandes = (data, type) => {
    if (!Array.isArray(data)) return []

    return data.map((item) => {
      // Determine status based on reponseChef
      let status
      if (item.reponseChef === "I") {
        status = "En attente"
      } else if (item.reponseChef === "O") {
        status = "Approuvée"
      } else {
        status = "Rejetée"
      }

      return {
        id: item.id_libre_demande || item.id,
        type: type,
        description: item.texteDemande || "Pas de description",
        status: status,
        date: new Date(item.dateDemande).toLocaleDateString("fr-FR"),
        dateObj: new Date(item.dateDemande),
        details: {
          startDate: item.dateDebut ? new Date(item.dateDebut).toLocaleDateString("fr-FR") : undefined,
          endDate: item.dateFin ? new Date(item.dateFin).toLocaleDateString("fr-FR") : undefined,
          duration: item.nbrJours?.toString(),
          reason: item.texteDemande,
          titre: item.titre,
          typeFormation: item.type,
          theme: item.theme,
          typeDocument: item.typeDocument,
          typePreavance: item.type,
          montant: item.montant?.toString(),
          heureSortie: item.heureSortie,
          heureRetour: item.heureRetour,
        },
        rawData: item, // Keep the original data for reference
      }
    })
  }

  const filterDemandes = (statusFilter, typeFilter, query) => {
    let filtered = [...demandes]

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((demande) => demande.status === statusFilter)
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter((demande) => demande.type === typeFilter)
    }

    // Filter by search query
    if (query) {
      const lowerQuery = query.toLowerCase()
      filtered = filtered.filter(
        (demande) =>
          demande.type.toLowerCase().includes(lowerQuery) ||
          demande.description.toLowerCase().includes(lowerQuery) ||
          demande.id.toString().includes(lowerQuery),
      )
    }

    setFilteredDemandes(filtered)
  }

  const handleStatusFilterChange = (status) => {
    setActiveFilter(status)
  }

  const handleTypeFilterChange = (type) => {
    setActiveTypeFilter(type)
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleViewDetails = (demande) => {
    setSelectedDemande(demande)
    setShowDetailsModal(true)
  }

  const closeDetailsModal = () => {
    setShowDetailsModal(false)
    setSelectedDemande(null)
  }

  const getStatusClass = (status) => {
    switch (status) {
      case "Approuvée":
        return "status-approved"
      case "En attente":
        return "status-pending"
      case "Rejetée":
        return "status-rejected"
      default:
        return ""
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case "formation":
        return <FaGraduationCap className="type-icon formation" />
      case "congé":
        return <FaCalendarAlt className="type-icon conge" />
      case "document":
        return <FaFileAlt className="type-icon document" />
      case "pre-avance":
        return <FaMoneyBillWave className="type-icon avance" />
      case "autorisation":
        return <FaShieldAlt className="type-icon autorisation" />
      default:
        return <FaFileAlt className="type-icon" />
    }
  }

  const renderDetailsContent = () => {
    if (!selectedDemande) return null

    const { type, details } = selectedDemande

    // Common details for all types
    const commonDetails = (
      <>
        <div className="detail-row">
          <span className="detail-label">Statut:</span>
          <span className={`status-badge ${getStatusClass(selectedDemande.status)}`}>{selectedDemande.status}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Date de demande:</span>
          <span className="detail-value">{selectedDemande.date}</span>
        </div>
        {details.reason && (
          <div className="detail-row">
            <span className="detail-label">Motif:</span>
            <span className="detail-value">{details.reason}</span>
          </div>
        )}
      </>
    )

    // Type-specific details
    let typeSpecificDetails
    switch (type) {
      case "congé":
        typeSpecificDetails = (
          <>
            <div className="detail-row">
              <span className="detail-label">Date de début:</span>
              <span className="detail-value">{details.startDate}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date de fin:</span>
              <span className="detail-value">{details.endDate}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Nombre de jours:</span>
              <span className="detail-value">{details.duration}</span>
            </div>
          </>
        )
        break
      case "formation":
        typeSpecificDetails = (
          <>
            <div className="detail-row">
              <span className="detail-label">Titre:</span>
              <span className="detail-value">{details.titre || "Non spécifié"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Type de formation:</span>
              <span className="detail-value">{details.typeFormation || "Non spécifié"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Thème:</span>
              <span className="detail-value">{details.theme || "Non spécifié"}</span>
            </div>
            {details.startDate && (
              <div className="detail-row">
                <span className="detail-label">Date de début:</span>
                <span className="detail-value">{details.startDate}</span>
              </div>
            )}
            {details.endDate && (
              <div className="detail-row">
                <span className="detail-label">Date de fin:</span>
                <span className="detail-value">{details.endDate}</span>
              </div>
            )}
          </>
        )
        break
      case "document":
        typeSpecificDetails = (
          <>
            <div className="detail-row">
              <span className="detail-label">Type de document:</span>
              <span className="detail-value">{details.typeDocument || "Non spécifié"}</span>
            </div>
          </>
        )
        break
      case "pre-avance":
        typeSpecificDetails = (
          <>
            <div className="detail-row">
              <span className="detail-label">Type d'avance:</span>
              <span className="detail-value">{details.typePreavance || "Non spécifié"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Montant:</span>
              <span className="detail-value">{details.montant ? `${details.montant} DH` : "Non spécifié"}</span>
            </div>
          </>
        )
        break
      case "autorisation":
        typeSpecificDetails = (
          <>
            <div className="detail-row">
              <span className="detail-label">Heure de sortie:</span>
              <span className="detail-value">{details.heureSortie || "Non spécifié"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Heure de retour:</span>
              <span className="detail-value">{details.heureRetour || "Non spécifié"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date:</span>
              <span className="detail-value">{details.startDate || "Non spécifié"}</span>
            </div>
          </>
        )
        break
      default:
        typeSpecificDetails = null
    }

    return (
      <div className="details-content">
        <div className="details-header">
          <div className="details-title">
            {getTypeIcon(type)}
            <h3>Demande de {type}</h3>
          </div>
          <span className="details-id">ID: {selectedDemande.id}</span>
        </div>
        <div className="details-body">
          {commonDetails}
          {typeSpecificDetails}
        </div>
      </div>
    )
  }

  return (
    <div className="demandes-content">
      <div className="demandes-card">
        <div className="demandes-header">
          <h2>Historique des Demandes</h2>
          <div className="demandes-actions">
            <div className="search-container">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="search-input"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <button className="filter-button" onClick={() => setShowFilters(!showFilters)}>
              <FiFilter />
              <span>Filtrer</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="filters-container">
            <div className="filter-group">
              <h4>Statut</h4>
              <div className="filter-options">
                <button
                  className={`filter-option ${activeFilter === "all" ? "active" : ""}`}
                  onClick={() => handleStatusFilterChange("all")}
                >
                  Tous
                </button>
                <button
                  className={`filter-option ${activeFilter === "En attente" ? "active" : ""}`}
                  onClick={() => handleStatusFilterChange("En attente")}
                >
                  En attente
                </button>
                <button
                  className={`filter-option ${activeFilter === "Approuvée" ? "active" : ""}`}
                  onClick={() => handleStatusFilterChange("Approuvée")}
                >
                  Approuvée
                </button>
                <button
                  className={`filter-option ${activeFilter === "Rejetée" ? "active" : ""}`}
                  onClick={() => handleStatusFilterChange("Rejetée")}
                >
                  Rejetée
                </button>
              </div>
            </div>

            <div className="filter-group">
              <h4>Type</h4>
              <div className="filter-options">
                <button
                  className={`filter-option ${activeTypeFilter === "all" ? "active" : ""}`}
                  onClick={() => handleTypeFilterChange("all")}
                >
                  Tous
                </button>
                <button
                  className={`filter-option ${activeTypeFilter === "congé" ? "active" : ""}`}
                  onClick={() => handleTypeFilterChange("congé")}
                >
                  Congé
                </button>
                <button
                  className={`filter-option ${activeTypeFilter === "formation" ? "active" : ""}`}
                  onClick={() => handleTypeFilterChange("formation")}
                >
                  Formation
                </button>
                <button
                  className={`filter-option ${activeTypeFilter === "document" ? "active" : ""}`}
                  onClick={() => handleTypeFilterChange("document")}
                >
                  Document
                </button>
                <button
                  className={`filter-option ${activeTypeFilter === "pre-avance" ? "active" : ""}`}
                  onClick={() => handleTypeFilterChange("pre-avance")}
                >
                  Avance
                </button>
                <button
                  className={`filter-option ${activeTypeFilter === "autorisation" ? "active" : ""}`}
                  onClick={() => handleTypeFilterChange("autorisation")}
                >
                  Autorisation
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="demandes-table-container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Chargement des demandes...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p>{error}</p>
              <button className="retry-button" onClick={() => fetchUserDemandes(userId)}>
                Réessayer
              </button>
            </div>
          ) : filteredDemandes.length > 0 ? (
            <table className="demandes-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDemandes.map((demande) => (
                  <tr key={demande.id}>
                    <td>{demande.id}</td>
                    <td>
                      <div className="demande-type">
                        {getTypeIcon(demande.type)}
                        <span>{demande.type}</span>
                      </div>
                    </td>
                    <td className="demande-description">{demande.description}</td>
                    <td>{demande.date}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(demande.status)}`}>{demande.status}</span>
                    </td>
                    <td>
                      <button className="action-button view-button" onClick={() => handleViewDetails(demande)}>
                        <FiEye />
                        <span>Voir</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <FaFileAlt className="empty-icon" />
              <h3>Aucune demande trouvée</h3>
              <p>Aucune demande ne correspond à vos critères de recherche</p>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Détails de la demande</h3>
              <button className="close-button" onClick={closeDetailsModal}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">{renderDetailsContent()}</div>
            <div className="modal-footer">
              <button className="modal-button" onClick={closeDetailsModal}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Demandes

