import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  FiFile,
  FiFileText,
  FiDownload,
  FiTrash2,
  FiSearch,
  FiChevronDown,
  FiEye,
  FiCalendar,
  FiFolder,
  FiX,
  FiFilter,
} from "react-icons/fi"
import axios from "axios"
import "../common-ui.css" 
import "./Documents.css"
import Navbar from "../Components/Navbar/Navbar"
import Sidebar from "../Components/Sidebar/Sidebar"
import { saveAs } from "file-saver"

const Documents = () => {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState([])
  const [filteredDocuments, setFilteredDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [documentDetails, setDocumentDetails] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

  const userId = localStorage.getItem("userId")

  const categories = [
    { id: "all", name: "Tous les documents" },
    { id: "administrative", name: "Documents administratifs" },
    { id: "contract", name: "Contrats" },
    { id: "payslip", name: "Fiches de paie" },
    { id: "leave", name: "Congés" },
    { id: "training", name: "Formations" },
    { id: "other", name: "Autres" },
  ]

  useEffect(() => {
    fetchDocuments()
  }, [])

  useEffect(() => {
    filterDocuments()
  }, [documents, searchTerm, selectedCategory])

  const fetchDocuments = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.get(`http://localhost:8080/api/demande-document/personnel/${userId}/files-reponse`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      const formattedDocuments = response.data.map((file, index) => ({
        id: file.id || `file-${index}`,
        name: file.filename || `Document ${index + 1}`,
        category: mapFileTypeToCategory(file.fileType),
        uploadDate: file.uploadDate || new Date().toISOString(),
        type: file.fileType ? file.fileType.split("/").pop() : "pdf",
        uploadedBy: file.uploadedBy || "Chef Hiérarchique ",
        description: file.description || "Document téléchargé",
        status: "approved",
        filePath: file.filePath, // Keep the file path for downloading
      }))

      setDocuments(formattedDocuments)
    } catch (err) {
      setError("Erreur lors du chargement des documents. Veuillez réessayer.")
      console.error("Error fetching documents:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const mapFileTypeToCategory = (fileType) => {
    if (!fileType) return "other"
    if (fileType.includes("pdf")) return "administrative"
    if (fileType.includes("word")) return "contract"
    if (fileType.includes("spreadsheet")) return "payslip"
    return "other"
  }

  const filterDocuments = () => {
    let filtered = [...documents]

    if (selectedCategory !== "all") {
      filtered = filtered.filter((doc) => doc.category === selectedCategory)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (doc) => doc.name.toLowerCase().includes(term) || doc.description.toLowerCase().includes(term),
      )
    }

    setFilteredDocuments(filtered)
  }

  const handleDownload = async (document) => {
    try {
      if (!document?.filePath) {
        throw new Error("No file path available")
      }

      const fileName = document.filePath.split(/[\\/]/).pop()
      const response = await axios.get(
        `http://localhost:8080/api/demande-document/download/${encodeURIComponent(fileName)}`,
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )

      saveAs(response.data, document.name || fileName)
    } catch (err) {
      console.error("Download failed:", err)
      alert(`Download failed: ${err.message}`)
    }
  }

  const handleDelete = async (documentId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
      try {
        await axios.delete(`http://localhost:8080/api/demande-document/files/${documentId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
      } catch (err) {
        console.error("Delete failed:", err)
        alert("Échec de la suppression")
      }
    }
  }

  const handleViewDetails = (document) => {
    setDocumentDetails(document)
    setShowDetailsModal(true)
  }

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString("fr-FR", options)
  }

  const getDocumentIcon = (type) => {
    switch (type) {
      case "pdf":
        return <FiFileText className="document-icon pdf" />
      case "docx":
      case "doc":
        return <FiFileText className="document-icon word" />
      case "xlsx":
      case "xls":
        return <FiFileText className="document-icon excel" />
      case "jpg":
      case "jpeg":
      case "png":
        return <FiFileText className="document-icon image" />
      default:
        return <FiFile className="document-icon" />
    }
  }

  const getCategoryLabel = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId)
    return category ? category.name : "Autre"
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategory("all")
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="content-container">
        <Navbar />
        <div className="page-content">
          <div className="page-header">
            <h1>Mes Documents</h1>
            <p className="page-subtitle">Consultez et gérez vos documents</p>
          </div>

          {/* Standardized Filter Components */}
          <div className="filters-container">
            <div className="search-container">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Rechercher un document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button className="clear-search" onClick={() => setSearchTerm("")}>
                  <FiX />
                </button>
              )}
            </div>

            <button
              className={`filter-toggle ${isFilterExpanded ? "active" : ""}`}
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            >
              <FiFilter />
              <span>Filtres</span>
              <FiChevronDown className={`filter-chevron ${isFilterExpanded ? "active" : ""}`} />
              {selectedCategory !== "all" && <span className="filter-badge"></span>}
            </button>
          </div>

          <div className={`filter-panel ${isFilterExpanded ? "expanded" : ""}`}>
            <div className="filter-options">
              <div className="filter-group">
                <label>Catégorie</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-actions">
              <button className="clear-filters-button" onClick={clearFilters}>
                Effacer les filtres
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Chargement des documents...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <button onClick={fetchDocuments} className="retry-button">
                Réessayer
              </button>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="empty-state">
              <FiFolder className="empty-icon" />
              <h3>Aucun document trouvé</h3>
              <p>
                {searchTerm || selectedCategory !== "all"
                  ? "Aucun document ne correspond à vos critères de recherche."
                  : "Vous n'avez pas encore de documents."}
              </p>
              {(searchTerm || selectedCategory !== "all") && (
                <button className="clear-filters-button" onClick={clearFilters}>
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <div className="documents-grid">
              {filteredDocuments.map((document) => (
                <div key={document.id} className="document-card">
                  <div className="document-card-header">{getDocumentIcon(document.type)}</div>
                  <div className="document-card-body">
                    <h3 className="document-name">{document.name}</h3>
                    <p className="document-category">
                      <FiFolder className="category-icon" />
                      {getCategoryLabel(document.category)}
                    </p>
                    <p className="document-date">
                      <FiCalendar className="date-icon" />
                      {formatDate(document.uploadDate)}
                    </p>
                  </div>
                  <div className="document-card-actions">
                    <button className="action-button view" onClick={() => handleViewDetails(document)}>
                      <FiEye />
                    </button>
                    <button className="action-button download" onClick={() => handleDownload(document)}>
                      <FiDownload />
                    </button>
                    <button className="action-button delete" onClick={() => handleDelete(document.id)}>
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showDetailsModal && documentDetails && (
            <div className="modal-overlay">
              <div className="modal-container details-modal">
                <div className="modal-header">
                  <h2>Détails du document</h2>
                  <button
                    className="close-modal"
                    onClick={() => {
                      setShowDetailsModal(false)
                      setDocumentDetails(null)
                    }}
                  >
                    <FiX />
                  </button>
                </div>
                <div className="modal-body">
                  <div className="document-preview">
                    {getDocumentIcon(documentDetails.type)}
                    <h3>{documentDetails.name}</h3>
                  </div>

                  <div className="document-details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Catégorie</span>
                      <span className="detail-value">{getCategoryLabel(documentDetails.category)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Date d'ajout</span>
                      <span className="detail-value">{formatDate(documentDetails.uploadDate)}</span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Type</span>
                      <span className="detail-value">{documentDetails.type.toUpperCase()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Ajouté par</span>
                      <span className="detail-value">{documentDetails.uploadedBy}</span>
                    </div>
                  </div>

                  <div className="document-description">
                    <h4>Description</h4>
                    <p>{documentDetails.description || "Aucune description disponible."}</p>
                  </div>

                  <div className="modal-actions">
                    <button className="action-button download" onClick={() => handleDownload(documentDetails)}>
                      <FiDownload />
                      <span>Télécharger</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Documents

