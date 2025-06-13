
import { useState, useEffect, useCallback, useRef } from "react"
import { FiSearch, FiFilter, FiCalendar, FiX, FiRefreshCw, FiFileText, FiEye, FiEdit, FiTrash2 } from "react-icons/fi"
import Sidebar from "../Sidebar/Sidebar"
import Navbar from "../Navbar/Navbar"
import DemandesModal from "./DemandesModal"
import "./DemandesCHEF.css"
import { API_URL } from "../../../config"

// Constante pour la durée du cache
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes en millisecondes

const DemandesChef = () => {
  const [demandes, setDemandes] = useState([])
  const [filteredDemandes, setFilteredDemandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [theme, setTheme] = useState("light")

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

  // Modal states
  const [selectedDemande, setSelectedDemande] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  })

  // Référence pour le debounce
  const filterTimeoutRef = useRef(null)

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    setTheme(savedTheme)
    applyTheme(savedTheme)

    const handleStorageChange = () => {
      const currentTheme = localStorage.getItem("theme") || "light"
      setTheme(currentTheme)
      applyTheme(currentTheme)
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("themeChanged", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("themeChanged", handleStorageChange)
    }
  }, [])

  const applyTheme = (theme) => {
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(theme)
    document.body.className = theme
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    applyTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }))
  }

  useEffect(() => {
    fetchDemandes()
  }, [])

  // Fonction pour mettre à jour les statistiques
  const updateStats = useCallback((data) => {
    const pendingCount = data.filter((d) => d.reponseChef === "I").length
    const approvedCount = data.filter((d) => d.reponseChef === "O").length
    const rejectedCount = data.filter((d) => d.reponseChef === "N").length

    setStats({
      total: data.length,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
    })
  }, [])

  // Fonction optimisée pour récupérer les demandes
  const fetchDemandes = useCallback(
    async (forceRefresh = false) => {
      setLoading(true)
      setError(null)

      try {
        const userId = localStorage.getItem("userId")
        const authToken = localStorage.getItem("authToken")

        if (!authToken || !userId) {
          throw new Error("Authentification requise")
        }

        // Vérifier le cache si on ne force pas le rafraîchissement
        const cacheKey = `demandes_${userId}`
        const cachedData = localStorage.getItem(cacheKey)

        if (!forceRefresh && cachedData) {
          try {
            const { data, timestamp } = JSON.parse(cachedData)
            // Vérifier si le cache est encore valide (moins de 5 minutes)
            if (Date.now() - timestamp < CACHE_DURATION) {
              console.log("Utilisation des données en cache")
              setDemandes(data)
              setFilteredDemandes(data)
              updateStats(data)
              setLoading(false)
              return
            }
          } catch (e) {
            console.warn("Erreur lors de la lecture du cache:", e)
          }
        }

        // Utiliser Promise.all pour paralléliser les requêtes API
        const types = ["formation", "conge", "document", "pre-avance", "autorisation"]
        const apiPromises = types.map((type) =>
          fetch(`${API_URL}/api/demande-${type}/personnel/${userId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          })
            .then(async (response) => {
              if (!response.ok) {
                const clonedResponse = response.clone()
                let errorMessage

                try {
                  const errorData = await response.json()
                  errorMessage = errorData.message || `Erreur ${response.status}`
                } catch (e) {
                  errorMessage = (await clonedResponse.text()) || `Erreur ${response.status}`
                }

                throw new Error(`Erreur lors de la récupération des demandes de ${type}: ${errorMessage}`)
              }

              const text = await response.text()
              if (!text) return { type, data: [] }

              try {
                const data = JSON.parse(text)
                if (!Array.isArray(data)) {
                  throw new Error(`Format de données invalide pour ${type}`)
                }
                return { type, data }
              } catch (e) {
                console.error(`Erreur de parsing JSON pour ${type}:`, e)
                return { type, data: [], error: e.message }
              }
            })
            .catch((err) => {
              console.error(`Erreur pour ${type}:`, err)
              return { type, data: [], error: err.message }
            }),
        )

        // Attendre que toutes les requêtes soient terminées
        const results = await Promise.all(apiPromises)

        // Traiter les résultats
        let allDemandes = []
        const errors = []

        results.forEach(({ type, data, error }) => {
          if (error) {
            errors.push(`${type}: ${error}`)
          }

          if (data && data.length > 0) {
            const typedData = data.map((item) => ({
              ...item,
              demandeType: type,
              typeDemande: type,
            }))

            allDemandes = [...allDemandes, ...typedData]
          }
        })

        // Afficher les erreurs s'il y en a
        if (errors.length > 0) {
          if (allDemandes.length === 0) {
            setError(`Certaines demandes n'ont pas pu être récupérées: ${errors.join(", ")}`)
          } else {
            console.warn(`Certaines demandes n'ont pas pu être récupérées: ${errors.join(", ")}`)
          }
        }

        // Trier par date (plus récent d'abord)
        allDemandes.sort((a, b) => new Date(b.dateDemande) - new Date(a.dateDemande))

        // Mettre à jour le cache
        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              data: allDemandes,
              timestamp: Date.now(),
            }),
          )
        } catch (e) {
          console.warn("Erreur lors de la mise en cache des données:", e)
        }

        // Mettre à jour l'état
        setDemandes(allDemandes)
        setFilteredDemandes(allDemandes)
        updateStats(allDemandes)
      } catch (err) {
        setError(err.message || "Une erreur est survenue lors de la récupération des demandes")
      } finally {
        setLoading(false)
      }
    },
    [updateStats],
  )

  // Fonction optimisée pour appliquer les filtres
  const applyFilters = useCallback(() => {
    // Utiliser un debounce pour éviter les filtres trop fréquents
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current)
    }

    filterTimeoutRef.current = setTimeout(() => {
      console.log("Applying filters...")

      // Optimisation: ne filtrer que si nécessaire
      if (!searchQuery && selectedType === "all" && selectedStatus === "all" && !startDate && !endDate) {
        setFilteredDemandes(demandes)
        setCurrentPage(1)
        return
      }

      // Utiliser des filtres optimisés
      const filtered = demandes.filter((demande) => {
        // Filtre de recherche
        const matchesSearch =
          !searchQuery ||
          (demande.texteDemande && demande.texteDemande.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (demande.matPers?.nom && demande.matPers.nom.toLowerCase().includes(searchQuery.toLowerCase()))

        // Filtre de type
        const matchesType = selectedType === "all" || demande.demandeType === selectedType

        // Filtre de statut
        let matchesStatus = true
        if (selectedStatus !== "all") {
          if (selectedStatus === "pending") matchesStatus = demande.reponseChef === "I"
          else if (selectedStatus === "approved") matchesStatus = demande.reponseChef === "O"
          else if (selectedStatus === "rejected") matchesStatus = demande.reponseChef === "N"
        }

        // Filtre de date
        let matchesDate = true
        if (startDate && endDate) {
          const start = new Date(startDate)
          const end = new Date(endDate)
          end.setHours(23, 59, 59)

          const demandeDate = new Date(demande.dateDemande)
          matchesDate = demandeDate >= start && demandeDate <= end
        }

        return matchesSearch && matchesType && matchesStatus && matchesDate
      })

      setFilteredDemandes(filtered)
      setCurrentPage(1)
    }, 300) // Délai de 300ms pour le debounce
  }, [demandes, searchQuery, selectedType, selectedStatus, startDate, endDate])

  // Appliquer les filtres quand les dépendances changent
  useEffect(() => {
    applyFilters()

    // Nettoyage du timeout lors du démontage
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current)
      }
    }
  }, [applyFilters])

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

  const handleViewDetails = useCallback((demande) => {
    setSelectedDemande(demande)
    setShowDetailsModal(true)
  }, [])

  const closeDetailsModal = () => {
    setShowDetailsModal(false)
    setSelectedDemande(null)
  }

  const handleDeleteDemande = (demande) => {
    setSelectedDemande(demande)
    setShowDeleteModal(true)
  }

  const confirmDeleteDemande = async () => {
    try {
      const authToken = localStorage.getItem("authToken")

      const response = await fetch(`${API_URL}/api/demande-${selectedDemande.demandeType}/${selectedDemande.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!response.ok) {
        const responseClone = response.clone()
        let errorMessage

        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || `Erreur HTTP ${response.status}`
        } catch (jsonError) {
          try {
            const errorText = await responseClone.text()
            errorMessage = errorText || `Erreur HTTP ${response.status}`
          } catch (textError) {
            errorMessage = `Erreur HTTP ${response.status}`
          }
        }

        throw new Error(errorMessage)
      }

      // Mettre à jour l'état localement sans refaire un appel API complet
      const updatedDemandes = demandes.filter(
        (d) => !(d.id === selectedDemande.id && d.demandeType === selectedDemande.demandeType),
      )
      setDemandes(updatedDemandes)
      setFilteredDemandes((prev) =>
        prev.filter((d) => !(d.id === selectedDemande.id && d.demandeType === selectedDemande.demandeType)),
      )
      updateStats(updatedDemandes)

      // Mettre à jour le cache
      const cacheKey = `demandes_${localStorage.getItem("userId")}`
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: updatedDemandes,
            timestamp: Date.now(),
          }),
        )
      } catch (e) {
        console.warn("Erreur lors de la mise à jour du cache:", e)
      }

      alert("Demande supprimée avec succès")
      setShowDeleteModal(false)
      closeDetailsModal()
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      alert(`Erreur lors de la suppression de la demande: ${error.message}`)
    }
  }

  // Fonction pour mettre à jour une demande après modification
  const handleDemandeUpdated = (updatedDemande) => {
    const updatedDemandes = demandes.map((d) =>
      d.id === updatedDemande.id && d.demandeType === updatedDemande.demandeType ? { ...d, ...updatedDemande } : d,
    )

    setDemandes(updatedDemandes)
    setFilteredDemandes((prev) =>
      prev.map((d) =>
        d.id === updatedDemande.id && d.demandeType === updatedDemande.demandeType ? { ...d, ...updatedDemande } : d,
      ),
    )
    updateStats(updatedDemandes)

    // Mettre à jour le cache
    const cacheKey = `demandes_${localStorage.getItem("userId")}`
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: updatedDemandes,
          timestamp: Date.now(),
        }),
      )
    } catch (e) {
      console.warn("Erreur lors de la mise à jour du cache:", e)
    }
  }

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredDemandes.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredDemandes.length / itemsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

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

  const getTypeText = (type) => {
    switch (type) {
      case "formation":
        return "Formation"
      case "conge":
        return "Congé"
      case "document":
        return "Document"
      case "pre-avance":
        return "Pré-Avance"
      case "autorisation":
        return "Autorisation"
      default:
        return type
    }
  }

  const hasFileResponse = (demande) => {
    return demande.demandeType === "document" && demande.fileReponse
  }

  if (loading) {
    return (
      <div className={`app-container ${theme}`}>
        <Sidebar theme={theme} />
        <div className="demandes-chef-container">
          <Navbar theme={theme} toggleTheme={toggleTheme} />
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
      <div className={`app-container ${theme}`}>
        <Sidebar theme={theme} />
        <div className="demandes-chef-container">
          <Navbar theme={theme} toggleTheme={toggleTheme} />
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
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className="demandes-chef-container">
        <Navbar theme={theme} toggleTheme={toggleTheme} />
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
              <span className={`filter-count ${selectedType !== "all" || startDate || endDate ? "active" : ""}`}>
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
                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                  <option value="all">Tous les types</option>
                  <option value="formation">Formation</option>
                  <option value="conge">Congé</option>
                  <option value="document">Document</option>
                  <option value="pre-avance">Pré-Avance</option>
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
            <button
              className="refresh-button"
              onClick={() => fetchDemandes(true)}
              title="Rafraîchir les données"
              disabled={loading}
            >
              <FiRefreshCw className={loading ? "spinning" : ""} />
            </button>
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
                    <th>Fichiers</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((demande) => {
                    const statusInfo = getStatusInfo(demande.reponseChef)
                    return (
                      <tr key={`${demande.demandeType}-${demande.id}`}>
                        <td>{formatDate(demande.dateDemande)}</td>
                        <td>
                          <span className={`type-badge ${demande.demandeType}`}>
                            {getTypeText(demande.demandeType)}
                          </span>
                        </td>
                        <td>
                          <div className="demande-text">
                            {demande.texteDemande || demande.titre || (
                              <span className="no-content">Aucune description</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${statusInfo.className}`}>{statusInfo.text}</span>
                        </td>
                        <td>
                          <div className="file-actions">
                            {demande.pieceJointe && (
                              <button className="file-action" title="Voir la pièce jointe">
                                <FiEye /> PJ
                              </button>
                            )}
                            {hasFileResponse(demande) && (
                              <button className="file-action" title="Voir la réponse">
                                <FiEye /> Réponse
                              </button>
                            )}
                          </div>
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
                            {demande.reponseChef === "I" && (
                              <>
                                <button
                                  className="action-button edit"
                                  onClick={() => handleViewDetails(demande)}
                                  title="Modifier"
                                >
                                  <FiEdit />
                                </button>
                                <button
                                  className="action-button delete"
                                  onClick={() => handleDeleteDemande(demande)}
                                  title="Supprimer"
                                >
                                  <FiTrash2 />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
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

          {/* Modals */}
          {showDetailsModal && selectedDemande && (
            <DemandesModal
              demande={selectedDemande}
              onClose={closeDetailsModal}
              onDemandeUpdated={handleDemandeUpdated}
              theme={theme}
            />
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="modal-overlay">
              <div className="confirmation-modal">
                <div className="modal-header">
                  <h2>Confirmer la suppression</h2>
                  <button className="close-button" onClick={() => setShowDeleteModal(false)}>
                    <FiX />
                  </button>
                </div>
                <div className="modal-body">
                  <p>Êtes-vous sûr de vouloir supprimer cette demande ? Cette action est irréversible.</p>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                    Annuler
                  </button>
                  <button className="btn btn-danger" onClick={confirmDeleteDemande}>
                    <FiTrash2 /> Confirmer la suppression
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

export default DemandesChef
