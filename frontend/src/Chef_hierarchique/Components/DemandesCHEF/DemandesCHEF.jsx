import { useState, useEffect } from "react"
import {
  FiSearch,
  FiFilter,
  FiCalendar,
  FiX,
  FiClock,
  FiRefreshCw,
  FiFileText,
  FiDownload,
  FiEye,
  FiUsers,
  FiCheckCircle,
  FiXCircle,
  FiEdit,
  FiTrash2,
} from "react-icons/fi"
import Sidebar from "../Sidebar/Sidebar"
import Navbar from "../Navbar/Navbar"
import "./DemandesCHEF.css"
import { API_URL } from "../../../config"

const DemandesCHEF = () => {
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

  // Selected demande for details view
  const [selectedDemande, setSelectedDemande] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({})

  // File preview states
  const [previewFile, setPreviewFile] = useState({
    url: null,
    type: null,
    loading: false,
    error: null
  })

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  })

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

  const fetchDemandes = async () => {
    setLoading(true)
    setError(null)

    try {
      const userId = localStorage.getItem("userId")
      const authToken = localStorage.getItem("authToken")

      if (!authToken || !userId) {
        throw new Error("Authentification requise")
      }

      const types = ["formation", "conge", "document", "pre-avance", "autorisation"]
      let allDemandes = []
      const errors = []

      for (const type of types) {
        try {
          const response = await fetch(`${API_URL}/api/demande-${type}/personnel/${userId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          })

          if (!response.ok) {
            throw new Error(`Erreur ${response.status} lors de la récupération des demandes de ${type}`)
          }

          const text = await response.text()
          const data = text ? JSON.parse(text) : []

          if (!Array.isArray(data)) {
            throw new Error(`Format de données invalide pour ${type}`)
          }

          const typedData = data.map((item) => ({
            ...item,
            demandeType: type,
          }))

          allDemandes = [...allDemandes, ...typedData]
        } catch (err) {
          console.error(`Erreur lors de la récupération des demandes de ${type}:`, err)
          errors.push(err.message)
        }
      }

      if (errors.length > 0 && allDemandes.length === 0) {
        setError(`Certaines demandes n'ont pas pu être récupérées: ${errors.join(", ")}`)
      } else if (errors.length > 0) {
        console.warn(`Certaines demandes n'ont pas pu être récupérées: ${errors.join(", ")}`)
      }

      // Sort by date descending
      allDemandes.sort((a, b) => new Date(b.dateDemande) - new Date(a.dateDemande))

      // Calculate stats
      const pendingCount = allDemandes.filter((d) => d.reponseChef === "I").length
      const approvedCount = allDemandes.filter((d) => d.reponseChef === "O").length
      const rejectedCount = allDemandes.filter((d) => d.reponseChef === "N").length

      setStats({
        total: allDemandes.length,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      })

      setDemandes(allDemandes)
      setFilteredDemandes(allDemandes)
    } catch (err) {
      setError(err.message || "Une erreur est survenue lors de la récupération des demandes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    applyFilters()
  }, [searchQuery, selectedType, selectedStatus, startDate, endDate, demandes])

  const applyFilters = () => {
    let filtered = [...demandes]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (demande) =>
          (demande.texteDemande && demande.texteDemande.toLowerCase().includes(query)) ||
          (demande.matPers?.nom && demande.matPers.nom.toLowerCase().includes(query)),
      )
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((demande) => demande.demandeType === selectedType)
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((demande) => {
        if (selectedStatus === "pending") return demande.reponseChef === "I"
        if (selectedStatus === "approved") return demande.reponseChef === "O"
        if (selectedStatus === "rejected") return demande.reponseChef === "N"
        return true
      })
    }

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59)

      filtered = filtered.filter((demande) => {
        const demandeDate = new Date(demande.dateDemande)
        return demandeDate >= start && demandeDate <= end
      })
    }

    setFilteredDemandes(filtered)
    setCurrentPage(1)
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
    setPreviewFile({
      url: null,
      type: null,
      loading: false,
      error: null
    })
  }

  const handleDeleteDemande = async () => {
    try {
      const authToken = localStorage.getItem("authToken")
      
      const response = await fetch(`${API_URL}/api/demande-${selectedDemande.demandeType}/${selectedDemande.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de la demande")
      }

      toast.success("Demande supprimée avec succès")
      fetchDemandes()
      setShowDeleteModal(false)
      closeDetailsModal()
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast.error("Erreur lors de la suppression de la demande")
    }
  }

  const handleUpdateDemande = async () => {
    try {
      const authToken = localStorage.getItem("authToken")
      
      const response = await fetch(`${API_URL}/api/demande-${selectedDemande.demandeType}/${selectedDemande.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(editFormData),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la modification de la demande")
      }

      toast.success("Demande modifiée avec succès")
      fetchDemandes()
      setShowEditModal(false)
      closeDetailsModal()
    } catch (error) {
      console.error("Erreur lors de la modification:", error)
      toast.error("Erreur lors de la modification de la demande")
    }
  }

  const handleDownloadAttachment = async (demande, isResponse = false) => {
    try {
      const authToken = localStorage.getItem("authToken")

      const endpoint = isResponse 
        ? `${API_URL}/api/demande-${demande.demandeType}/files-reponse/${demande.id}`
        : `${API_URL}/api/demande-${demande.demandeType}/download/${demande.id}`

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement du fichier")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = isResponse 
        ? `reponse-${demande.id}.pdf` 
        : `piece-jointe-${demande.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error)
      toast.error("Erreur lors du téléchargement du fichier")
    }
  }

  const handlePreviewFile = async (demande, isResponse = false) => {
    try {
      setPreviewFile({
        url: null,
        type: null,
        loading: true,
        error: null
      })

      const authToken = localStorage.getItem("authToken")

      const endpoint = isResponse 
        ? `${API_URL}/api/demande-${demande.demandeType}/files-reponse/${demande.id}`
        : `${API_URL}/api/demande-${demande.demandeType}/download/${demande.id}`

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Erreur lors du chargement du fichier")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const fileType = isResponse 
        ? (demande.fileReponseType || "application/pdf")
        : (demande.pieceJointeType || "application/pdf")

      setPreviewFile({
        url,
        type: fileType,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error("Erreur lors du chargement:", error)
      setPreviewFile({
        url: null,
        type: null,
        loading: false,
        error: error.message
      })
      toast.error("Erreur lors du chargement du fichier")
    }
  }

  const closePreview = () => {
    if (previewFile.url) {
      URL.revokeObjectURL(previewFile.url)
    }
    setPreviewFile({
      url: null,
      type: null,
      loading: false,
      error: null
    })
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
                              <button
                                className="file-action"
                                onClick={() => handlePreviewFile(demande)}
                                title="Voir la pièce jointe"
                              >
                                <FiEye /> PJ
                              </button>
                            )}
                            {hasFileResponse(demande) && (
                              <button
                                className="file-action"
                                onClick={() => handlePreviewFile(demande, true)}
                                title="Voir la réponse"
                              >
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
                                  onClick={() => {
                                    setSelectedDemande(demande)
                                    setEditFormData({
                                      texteDemande: demande.texteDemande,
                                      dateDebut: demande.dateDebut,
                                      dateFin: demande.dateFin,
                                    })
                                    setShowEditModal(true)
                                  }}
                                  title="Modifier"
                                >
                                  <FiEdit />
                                </button>
                                <button
                                  className="action-button delete"
                                  onClick={() => {
                                    setSelectedDemande(demande)
                                    setShowDeleteModal(true)
                                  }}
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

          {/* Details Modal */}
          {showDetailsModal && selectedDemande && (
            <div className="modal-overlay" onClick={closeDetailsModal}>
              <div className="demande-modal" onClick={(e) => e.stopPropagation()}>
                <div
                  className="modal-header"
                  data-status={getStatusInfo(selectedDemande.reponseChef).className.replace("status-", "")}
                >
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
                      <div className="file-actions">
                        <button 
                          className="btn btn-primary"
                          onClick={() => handlePreviewFile(selectedDemande)}
                        >
                          <FiEye /> Prévisualiser
                        </button>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => handleDownloadAttachment(selectedDemande)}
                        >
                          <FiDownload /> Télécharger
                        </button>
                      </div>
                    </div>
                  )}

                  {hasFileResponse(selectedDemande) && (
                    <div className="demande-info-section">
                      <div className="section-header">
                        <FiFileText />
                        <h3>Réponse du Document</h3>
                      </div>
                      <div className="file-actions">
                        <button 
                          className="btn btn-primary"
                          onClick={() => handlePreviewFile(selectedDemande, true)}
                        >
                          <FiEye /> Prévisualiser
                        </button>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => handleDownloadAttachment(selectedDemande, true)}
                        >
                          <FiDownload /> Télécharger
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedDemande.texteReponse && (
                    <div className="demande-info-section">
                      <div className="section-header">
                        <FiFileText />
                        <h3>Réponse</h3>
                      </div>
                      <div className="response-text">{selectedDemande.texteReponse}</div>
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  {selectedDemande.reponseChef === "I" && (
                    <>
                      <button 
                        className="btn btn-warning"
                        onClick={() => {
                          setEditFormData({
                            texteDemande: selectedDemande.texteDemande,
                            dateDebut: selectedDemande.dateDebut,
                            dateFin: selectedDemande.dateFin,
                          })
                          setShowEditModal(true)
                        }}
                      >
                        <FiEdit /> Modifier
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => setShowDeleteModal(true)}
                      >
                        <FiTrash2 /> Supprimer
                      </button>
                    </>
                  )}
                  <button className="btn btn-secondary" onClick={closeDetailsModal}>
                    Fermer
                  </button>
                </div>
              </div>
            </div>
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
                  <button className="btn btn-danger" onClick={handleDeleteDemande}>
                    <FiTrash2 /> Confirmer la suppression
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {showEditModal && (
            <div className="modal-overlay">
              <div className="edit-modal">
                <div className="modal-header">
                  <h2>Modifier la Demande</h2>
                  <button className="close-button" onClick={() => setShowEditModal(false)}>
                    <FiX />
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={editFormData.texteDemande || ""}
                      onChange={(e) => setEditFormData({...editFormData, texteDemande: e.target.value})}
                      rows={4}
                    />
                  </div>
                  {selectedDemande?.dateDebut && (
                    <div className="form-group">
                      <label>Date de Début</label>
                      <input
                        type="date"
                        value={editFormData.dateDebut || ""}
                        onChange={(e) => setEditFormData({...editFormData, dateDebut: e.target.value})}
                      />
                    </div>
                  )}
                  {selectedDemande?.dateFin && (
                    <div className="form-group">
                      <label>Date de Fin</label>
                      <input
                        type="date"
                        value={editFormData.dateFin || ""}
                        onChange={(e) => setEditFormData({...editFormData, dateFin: e.target.value})}
                      />
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                    Annuler
                  </button>
                  <button className="btn btn-primary" onClick={handleUpdateDemande}>
                    <FiEdit /> Enregistrer les modifications
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* File Preview Modal */}
          {previewFile.loading && (
            <div className="modal-overlay">
              <div className="file-preview-modal">
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Chargement du fichier...</p>
                </div>
              </div>
            </div>
          )}

          {previewFile.url && (
            <div className="modal-overlay" onClick={closePreview}>
              <div className="file-preview-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Prévisualisation du fichier</h2>
                  <button className="close-button" onClick={closePreview}>
                    <FiX />
                  </button>
                </div>
                <div className="modal-body">
                  {previewFile.type.includes("pdf") ? (
                    <embed 
                      src={previewFile.url} 
                      type="application/pdf" 
                      width="100%" 
                      height="500px" 
                    />
                  ) : previewFile.type.includes("image") ? (
                    <img 
                      src={previewFile.url} 
                      alt="Preview" 
                      style={{ maxWidth: '100%', maxHeight: '500px' }}
                    />
                  ) : (
                    <div className="unsupported-preview">
                      <FiFileText size={48} />
                      <p>Prévisualisation non disponible pour ce type de fichier</p>
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          const a = document.createElement('a')
                          a.href = previewFile.url
                          a.download = 'document'
                          a.click()
                        }}
                      >
                        <FiDownload /> Télécharger le fichier
                      </button>
                    </div>
                  )}
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