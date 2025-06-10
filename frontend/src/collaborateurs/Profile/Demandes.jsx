import { useState, useEffect, useCallback } from "react"
import {
  FiSearch,
  FiAlertCircle,
  FiCalendar,
  FiFileText,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiDollarSign,
  FiBook,
  FiX,
  FiEdit,
} from "react-icons/fi"
import Navbar from "../Components/Navbar/Navbar"
import Sidebar from "../Components/Sidebar/Sidebar"
import { API_URL } from "../../config"
import "../common-ui.css"
import "./Demandes.css"
import { useNavigate } from "react-router-dom"
import DemandeModal from "./DemandesModal" // Import the modal component

// Cache for storing API responses
const requestCache = new Map()

const HistoriqueDemandes = () => {
  const [demandes, setDemandes] = useState([])
  const [filteredDemandes, setFilteredDemandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const itemsPerPage = 10
  const navigate = useNavigate()

  const userId = localStorage.getItem("userId")
  const token = localStorage.getItem("authToken")

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredDemandes.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredDemandes.length / itemsPerPage)

  // Memoized function to get status
  const getStatus = useCallback((demande) => {
    if (demande.reponseChef === "O") return "Approuvée"
    if (demande.reponseChef === "N") return "Rejetée"
    if (demande.reponseChef === "I") return "En attente"
    if (demande.statut === "O") return "Approuvée"
    if (demande.statut === "N") return "Rejetée"
    return "En attente"
  }, [])

  // Fetch all demandes in parallel
  const fetchDemandes = useCallback(async () => {
    if (!userId || !token) {
      setError("Session invalide. Veuillez vous reconnecter.")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const types = ["formation", "conge", "document", "pre-avance", "autorisation"]
      const cacheKey = `${userId}-demandes`

      // Check cache first
      if (requestCache.has(cacheKey)) {
        const cachedData = requestCache.get(cacheKey)
        setDemandes(cachedData)
        setFilteredDemandes(cachedData)
        setLoading(false)
        return
      }

      // Fetch all types in parallel
      const requests = types.map((type) =>
        fetch(`${API_URL}/api/demande-${type}/personnel/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((response) => {
          if (!response.ok) throw new Error(`Failed to fetch ${type}`)
          return response.json()
        }),
      )

      const responses = await Promise.allSettled(requests)

      let allDemandes = []
      responses.forEach((response, index) => {
        if (response.status === "fulfilled") {
          const type = types[index]
          const typedData = response.value.map((item) => ({
            ...item,
            type: type.charAt(0).toUpperCase() + type.slice(1),
            status: getStatus(item),
            date: item.dateDemande || new Date().toISOString(),
          }))
          allDemandes = [...allDemandes, ...typedData]
        }
      })

      // Sort by date (newest first)
      allDemandes.sort((a, b) => new Date(b.date) - new Date(a.date))

      // Update state and cache
      setDemandes(allDemandes)
      setFilteredDemandes(allDemandes)
      requestCache.set(cacheKey, allDemandes)
    } catch (err) {
      setError(err.message || "Une erreur est survenue lors du chargement des demandes")
    } finally {
      setLoading(false)
    }
  }, [userId, token, getStatus])

  useEffect(() => {
    fetchDemandes()
  }, [fetchDemandes])

  // Open modal with request details
  const handleViewRequest = (demande) => {
    setSelectedRequest(demande)
    setIsModalOpen(true)
  }

  // Delete a demande
  const handleDeleteRequest = async (id, type) => {
    try {
      const response = await fetch(`${API_URL}/api/demande-${type.toLowerCase()}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Échec de la suppression")
      }

      // Remove from cache and state
      requestCache.delete(`${userId}-demandes`)
      setDemandes((prev) => prev.filter((d) => d.id !== id))
      setFilteredDemandes((prev) => prev.filter((d) => d.id !== id))
      setIsModalOpen(false)

      alert("Demande supprimée avec succès")
    } catch (err) {
      alert(`Erreur lors de la suppression: ${err.message}`)
    }
  }

  // Update a demande
  const handleUpdateRequest = async (payload) => {
    try {
      if (!payload || !payload.id) {
        throw new Error("Données de demande invalides")
      }

      // Extract the necessary data from payload
      const { id, type, ...requestData } = payload

      // Determine the correct API endpoint type
      let apiType = type
      if (!apiType) {
        // Fallback to determine type from the original request
        const originalRequest = demandes.find((d) => d.id === id)
        if (originalRequest) {
          const normalizeType = (requestType) => {
            if (!requestType) return "unknown"
            const normalized = requestType.toLowerCase().replace(/[-\s]/g, "")

            const typeMap = {
              preavance: "pre-avance",
              formation: "formation",
              document: "document",
              autorisation: "autorisation",
              conge: "conge",
            }

            return typeMap[normalized] || requestType.toLowerCase()
          }

          apiType = normalizeType(originalRequest.type)
        }
      }

      console.log(`Updating request: ${apiType}/${id}`, requestData)

      const response = await fetch(`${API_URL}/api/demande-${apiType}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        // Clone the response so we can read it multiple times if needed
        const responseClone = response.clone()
        let errorMessage

        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || `Erreur HTTP ${response.status}`
        } catch (jsonError) {
          // If JSON parsing fails, get the response as text from the clone
          try {
            const errorText = await responseClone.text()
            errorMessage = errorText || `Erreur HTTP ${response.status}`
          } catch (textError) {
            errorMessage = `Erreur HTTP ${response.status}`
          }
        }
        throw new Error(errorMessage)
      }

      // Refresh data
      requestCache.delete(`${userId}-demandes`)
      await fetchDemandes()
      setIsModalOpen(false)

      alert("Demande mise à jour avec succès")
    } catch (err) {
      console.error("Update error:", err)
      alert(`Erreur lors de la mise à jour: ${err.message}`)
    }
  }

  // Optimized filtering
  useEffect(() => {
    let filtered = demandes

    if (searchQuery || statusFilter !== "all" || typeFilter !== "all") {
      const query = searchQuery.toLowerCase()
      filtered = demandes.filter((demande) => {
        // Search filter
        const matchesSearch =
          !searchQuery ||
          (demande.texteDemande && demande.texteDemande.toLowerCase().includes(query)) ||
          (demande.type && demande.type.toLowerCase().includes(query)) ||
          (demande.status && demande.status.toLowerCase().includes(query))

        // Status filter
        const matchesStatus =
          statusFilter === "all" || demande.status.toLowerCase().includes(statusFilter.toLowerCase())

        // Type filter
        const matchesType = typeFilter === "all" || demande.type.toLowerCase() === typeFilter.toLowerCase()

        return matchesSearch && matchesStatus && matchesType
      })
    }

    setFilteredDemandes(filtered)
    setCurrentPage(1)
  }, [searchQuery, statusFilter, typeFilter, demandes])

  // Memoized utility functions
  const formatDate = useCallback((dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("fr-FR")
    } catch {
      return dateString
    }
  }, [])

  const getStatusClass = useCallback((status) => {
    if (status.includes("Approuvée")) return "status-approved"
    if (status.includes("Rejetée")) return "status-rejected"
    return "status-pending"
  }, [])

  const getTypeIcon = useCallback((type) => {
    switch (type) {
      case "Formation":
        return <FiBook className="type-icon formation" />
      case "Conge":
        return <FiCalendar className="type-icon conge" />
      case "Document":
        return <FiFileText className="type-icon document" />
      case "PreAvance":
        return <FiDollarSign className="type-icon preavance" />
      case "Autorisation":
        return <FiClock className="type-icon autorisation" />
      default:
        return <FiFileText className="type-icon" />
    }
  }, [])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des demandes en cours...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <FiAlertCircle size={48} className="error-icon" />
        <p className="error-message">{error}</p>
        <button className="retry-button" onClick={fetchDemandes}>
          Réessayer
        </button>
      </div>
    )
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
                  <button className="clear-search" onClick={() => setSearchQuery("")} aria-label="Clear search">
                    <FiX />
                  </button>
                )}
              </div>

              <div className="filter-options">
                <div className="filter-group">
                  <label htmlFor="status-filter">Statut</label>
                  <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">Tous les statuts</option>
                    <option value="Approuvée">Approuvée</option>
                    <option value="Rejetée">Rejetée</option>
                    <option value="En attente">En attente</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="type-filter">Type</label>
                  <select id="type-filter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="all">Tous les types</option>
                    {[...new Set(demandes.map((d) => d.type))].map((type) => (
                      <option key={type} value={type.toLowerCase()}>
                        {type}
                      </option>
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
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map((demande) => (
                          <tr key={`${demande.type}-${demande.id || demande._id}`}>
                            <td>
                              <div className="demande-type">
                                {getTypeIcon(demande.type)}
                                {demande.type}
                              </div>
                            </td>
                            <td>{formatDate(demande.date)}</td>
                            <td className="description-cell">{demande.texteDemande || "Aucune description"}</td>
                            <td>
                              <span className={`status-badge ${getStatusClass(demande.status)}`}>{demande.status}</span>
                            </td>
                            <td className="actions-cell">
                              <button
                                className="action-button view-button"
                                onClick={() => handleViewRequest(demande)}
                                title="Voir les détails"
                              >
                                <FiEdit />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {totalPages > 1 && (
                      <div className="pagination">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          aria-label="Page précédente"
                        >
                          <FiChevronLeft />
                        </button>
                        <span>
                          Page {currentPage} sur {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          aria-label="Page suivante"
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

      {/* Modal for viewing/editing requests */}
      {isModalOpen && selectedRequest && (
        <DemandeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          request={selectedRequest}
          onSave={handleUpdateRequest}
          onDelete={handleDeleteRequest}
          token={token}
          API_URL={API_URL}
        />
      )}
    </div>
  )
}

export default HistoriqueDemandes
