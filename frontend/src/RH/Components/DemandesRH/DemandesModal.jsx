import { useState, useCallback } from "react"
import {
  FiX,
  FiFileText,
  FiDownload,
  FiEye,
  FiEdit,
  FiTrash2,
  FiUpload,
  FiAlertCircle,
  FiInfo,
  FiDollarSign,
  FiBook,
  FiClock,
} from "react-icons/fi"
import { API_URL } from "../../../config"

const DemandesModal = ({ demande, onClose, onDemandeUpdated, theme }) => {
  // Edit form states
  const [isEditing, setIsEditing] = useState(false)
  const [editedRequest, setEditedRequest] = useState({})
  const [fileUploading, setFileUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [editError, setEditError] = useState(null)
  const [savingChanges, setSavingChanges] = useState(false)

  // Formation data states
  const [titres, setTitres] = useState([])
  const [types, setTypes] = useState([])
  const [themes, setThemes] = useState([])
  const [selectedTitreId, setSelectedTitreId] = useState(null)
  const [selectedTypeId, setSelectedTypeId] = useState(null)
  const [selectedThemeId, setSelectedThemeId] = useState(null)
  const [showTitreSelector, setShowTitreSelector] = useState(false)
  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [showThemeSelector, setShowThemeSelector] = useState(false)

  // Document types
  const [documentTypes] = useState([
    "Attestation de travail",
    "Attestation de salaire",
    "Attestation de congé",
    "Bulletin de paie",
    "Certificat de travail",
    "Autre document",
  ])
  const [showDocumentTypeSelector, setShowDocumentTypeSelector] = useState(false)

  // Pre-avance types
  const [typesAvance] = useState([
    "MEDICAL",
    "SCOLARITE",
    "VOYAGE",
    "INFORMATIQUE",
    "DEMENAGEMENT",
    "MARIAGE",
    "FUNERAILLES",
  ])
  const [showTypeAvanceSelector, setShowTypeAvanceSelector] = useState(false)

  // Periode options for congé
  const [periodeOptions] = useState(["matin", "après-midi"])
  const [showPeriodeDebutSelector, setShowPeriodeDebutSelector] = useState(false)
  const [showPeriodeFinSelector, setShowPeriodeFinSelector] = useState(false)

  // File preview states
  const [previewFile, setPreviewFile] = useState({
    url: null,
    type: null,
    loading: false,
    error: null,
  })

  // Helper functions
  const extractStringValue = (value, possibleKeys = ["titre", "type", "theme", "nom", "name"]) => {
    if (!value) return ""
    if (typeof value === "string") return value
    if (typeof value === "object") {
      for (const key of possibleKeys) {
        if (value[key] && typeof value[key] === "string") {
          return value[key]
        }
      }
      return value.$id || value.id || ""
    }
    return ""
  }

  const extractIdValue = (value) => {
    if (!value) return ""
    if (typeof value === "string") return value
    if (typeof value === "object") {
      return value.id || value.$id || ""
    }
    return ""
  }

  const getFormationTypeDisplay = (request) => {
    if (request.typeDemande === "formation") {
      if (request.theme && request.theme.id && request.titre && request.titre.types) {
        const themeId = request.theme.id
        for (const typeObj of request.titre.types) {
          if (typeObj.themes && Array.isArray(typeObj.themes)) {
            const hasTheme = typeObj.themes.some((theme) => theme.id === themeId)
            if (hasTheme) {
              return typeObj.type
            }
          }
        }
      }
      if (request.titre && request.titre.types && request.titre.types.length === 1) {
        return request.titre.types[0].type
      }
      if (request.titre && request.titre.types && request.titre.types.length > 0) {
        return request.titre.types[0].type
      }
      return "Non spécifié"
    }
    if (request.typeFormation) {
      return extractStringValue(request.typeFormation, ["type", "nom", "name"])
    }
    return "Non spécifié"
  }

  const getFormationTypeId = (request) => {
    if (request.typeDemande === "formation") {
      if (request.theme && request.theme.id && request.titre && request.titre.types) {
        const themeId = request.theme.id
        for (const typeObj of request.titre.types) {
          if (typeObj.themes && Array.isArray(typeObj.themes)) {
            const hasTheme = typeObj.themes.some((theme) => theme.id === themeId)
            if (hasTheme) {
              return typeObj.id
            }
          }
        }
      }
      if (request.titre && request.titre.types && request.titre.types.length > 0) {
        return request.titre.types[0].id
      }
    }
    return null
  }

  // Formation API functions
  const fetchTitres = useCallback(async () => {
    try {
      // Vérifier le cache
      const cachedTitres = localStorage.getItem("titres_cache")
      if (cachedTitres) {
        try {
          const { data, timestamp } = JSON.parse(cachedTitres)
          // Vérifier si le cache est encore valide (moins de 1 heure)
          if (Date.now() - timestamp < 60 * 60 * 1000) {
            console.log("Utilisation des titres en cache")
            setTitres(data)
            return data
          }
        } catch (e) {
          console.warn("Erreur lors de la lecture du cache des titres:", e)
        }
      }

      const authToken = localStorage.getItem("authToken")
      const response = await fetch(`${API_URL}/api/titres/`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      if (response.ok) {
        const data = await response.json()
        const transformedTitres = data.map((titre) => ({ id: titre.id, name: titre.titre }))
        setTitres(transformedTitres)

        // Mettre en cache
        try {
          localStorage.setItem(
            "titres_cache",
            JSON.stringify({
              data: transformedTitres,
              timestamp: Date.now(),
            }),
          )
        } catch (e) {
          console.warn("Erreur lors de la mise en cache des titres:", e)
        }

        return transformedTitres
      }
    } catch (err) {
      console.error("Error fetching titres:", err)
      return []
    }
  }, [])

  const fetchTypesByTitreId = async (titreId) => {
    try {
      const authToken = localStorage.getItem("authToken")
      const response = await fetch(`${API_URL}/api/titres/${titreId}/types`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (response.ok) {
        const data = await response.json()
        const transformedTypes = data
          .filter((type) => type.type !== null)
          .map((type) => ({ id: type.id, name: type.type }))
        setTypes(transformedTypes)

        if (demande?.typeDemande === "formation") {
          const typeId = getFormationTypeId(demande)
          if (typeId) {
            const matchingType = transformedTypes.find((t) => t.id === typeId)
            if (matchingType) {
              setSelectedTypeId(matchingType.id)
              setEditedRequest((prev) => ({
                ...prev,
                typeFormation: matchingType.name,
                typeId: matchingType.id,
              }))
              await fetchThemesByTypeId(titreId, matchingType.id)
            }
          }
        }
      }
    } catch (err) {
      console.error("Error fetching types:", err)
    }
  }

  const fetchThemesByTypeId = async (titreId, typeId) => {
    try {
      const authToken = localStorage.getItem("authToken")
      const response = await fetch(`${API_URL}/api/titres/${titreId}/types/${typeId}/themes`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (response.ok) {
        const data = await response.json()
        const transformedThemes = data
          .filter((theme) => theme.theme !== null)
          .map((theme) => ({ id: theme.id, name: theme.theme }))
        setThemes(transformedThemes)

        if (demande?.theme) {
          const themeValue = extractStringValue(demande.theme, ["theme", "nom"])
          const themeId = extractIdValue(demande.theme)
          const matchingTheme = transformedThemes.find((t) => t.name === themeValue || t.id === themeId)

          if (matchingTheme) {
            setSelectedThemeId(matchingTheme.id)
            setEditedRequest((prev) => ({
              ...prev,
              theme: matchingTheme.name,
              themeId: matchingTheme.id,
            }))
          }
        }
      }
    } catch (err) {
      console.error("Error fetching themes:", err)
    }
  }

  // Selection handlers
  const selectTitre = (id, name) => {
    setSelectedTitreId(id)
    setEditedRequest((prev) => ({ ...prev, titre: name, titreId: id }))
    setShowTitreSelector(false)
    setSelectedTypeId(null)
    setSelectedThemeId(null)
    setEditedRequest((prev) => ({ ...prev, typeFormation: "", typeId: "", theme: "", themeId: "" }))
    setTypes([])
    setThemes([])
    fetchTypesByTitreId(id)
  }

  const selectType = (id, name) => {
    setSelectedTypeId(id)
    setEditedRequest((prev) => ({ ...prev, typeFormation: name, typeId: id }))
    setShowTypeSelector(false)
    setSelectedThemeId(null)
    setEditedRequest((prev) => ({ ...prev, theme: "", themeId: "" }))
    setThemes([])
    if (selectedTitreId) {
      fetchThemesByTypeId(selectedTitreId, id)
    }
  }

  const selectTheme = (id, name) => {
    setSelectedThemeId(id)
    setEditedRequest((prev) => ({ ...prev, theme: name, themeId: id }))
    setShowThemeSelector(false)
  }

  const handleEditDemande = () => {
    if (!demande) return

    // Initialize edit form with current demande data
    const normalizedRequest = { ...demande }

    if (demande.typeDemande === "formation") {
      if (demande.titre) {
        const titreValue = extractStringValue(demande.titre, ["titre", "nom"])
        const titreId = extractIdValue(demande.titre)
        if (titreValue) {
          normalizedRequest.titre = titreValue
          normalizedRequest.titreId = titreId
        }
      }

      const typeValue = getFormationTypeDisplay(demande)
      const typeId = getFormationTypeId(demande)
      if (typeValue && typeValue !== "Non spécifié") {
        normalizedRequest.typeFormation = typeValue
        normalizedRequest.typeId = typeId
      }

      if (demande.theme) {
        const themeValue = extractStringValue(demande.theme, ["theme", "nom"])
        const themeId = extractIdValue(demande.theme)
        if (themeValue) {
          normalizedRequest.theme = themeValue
          normalizedRequest.themeId = themeId
        }
      }

      fetchTitres()
    }

    setEditedRequest(normalizedRequest)
    setIsEditing(true)
    setFormErrors({})
    setEditError(null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setEditedRequest((prev) => ({
      ...prev,
      [name]: value,
      reponseChef: "I",
      reponseRH: "I",
    }))

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleTimeChange = (field, value) => {
    setEditedRequest((prev) => ({
      ...prev,
      [field]: value,
      reponseChef: "I",
      reponseRH: "I",
    }))
  }

  const handleFileUpload = async (e) => {
    const files = e.target.files
    if (!files?.length) return

    setFileUploading(true)
    setUploadError(null)

    try {
      const authToken = localStorage.getItem("authToken")
      const formData = new FormData()
      formData.append("file", files[0])

      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      })

      if (!response.ok) throw new Error("Échec du téléversement")

      const uploadedFile = await response.json()
      setEditedRequest((prev) => ({
        ...prev,
        files: [uploadedFile],
        reponseChef: "I",
        reponseRH: "I",
      }))
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setFileUploading(false)
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!editedRequest.texteDemande && !editedRequest.description) {
      errors.description = "Description requise"
    }

    if (demande.typeDemande === "formation") {
      if (!editedRequest.dateDebut) {
        errors.dateDebut = "Date de début requise"
      }

      const hasOriginalTitre = demande.titre && (extractIdValue(demande.titre) || extractStringValue(demande.titre))
      const hasOriginalType = getFormationTypeId(demande)
      const hasOriginalTheme = demande.theme && (extractIdValue(demande.theme) || extractStringValue(demande.theme))

      if (!selectedTitreId && !hasOriginalTitre) {
        errors.titre = "Titre requis"
      }
      if (!selectedTypeId && !hasOriginalType) {
        errors.typeFormation = "Type de formation requis"
      }
      if (!selectedThemeId && !hasOriginalTheme) {
        errors.theme = "Thème requis"
      }
      if (!editedRequest.nbrJours && !editedRequest.duration) {
        errors.nbrJours = "Nombre de jours requis"
      }
    }

    if (demande.demandeType === "document" && !editedRequest.typeDocument) {
      errors.typeDocument = "Type de document requis"
    }

    if (demande.demandeType === "pre-avance") {
      if (!editedRequest.type && !editedRequest.typePreavance) {
        errors.type = "Type de pré-avance requis"
      }
      if (!editedRequest.montant) {
        errors.montant = "Montant requis"
      }
    }

    if (demande.demandeType === "autorisation") {
      if (!editedRequest.dateDebut) {
        errors.dateDebut = "Date requise"
      }
      if (!editedRequest.horaireSortie || !editedRequest.minuteSortie) {
        errors.heureSortie = "Heure de sortie requise"
      }
      if (!editedRequest.horaireRetour || !editedRequest.minuteRetour) {
        errors.heureRetour = "Heure de retour requise"
      }
    }

    if (demande.demandeType === "conge") {
      if (!editedRequest.dateDebut) {
        errors.dateDebut = "Date de début requise"
      }
      if (!editedRequest.dateFin) {
        errors.dateFin = "Date de fin requise"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const preparePayload = () => {
    try {
      if (!demande?.typeDemande && !demande?.demandeType) {
        throw new Error("Type de demande non défini")
      }

      const apiTypeMap = {
        formation: "formation",
        document: "document",
        "pre-avance": "pre-avance",
        autorisation: "autorisation",
        conge: "conge",
      }

      const requestType = demande.typeDemande || demande.demandeType
      const apiType = apiTypeMap[requestType.toLowerCase()] || requestType.toLowerCase()

      let payload = {
        ...editedRequest,
      }

      switch (requestType.toLowerCase()) {
        case "document":
          payload = {
            typeDocument: editedRequest.typeDocument,
            texteDemande: editedRequest.texteDemande || editedRequest.description,
            files: editedRequest.files?.map((file) => file.id || file),
            matPers: demande.matPers,
            codeSoc: demande.codeSoc,
          }
          break

        case "formation":
          const finalTitreId = selectedTitreId || extractIdValue(demande.titre)
          const finalTypeId = selectedTypeId || getFormationTypeId(demande)
          const finalThemeId = selectedThemeId || extractIdValue(demande.theme)

          payload = {
            dateDebut: editedRequest.dateDebut,
            texteDemande: editedRequest.texteDemande || editedRequest.description,
            nbrJours: editedRequest.nbrJours || editedRequest.duration,
            titre: { id: finalTitreId },
            type: { id: finalTypeId },
            theme: { id: finalThemeId },
            matPers: demande.matPers,
            codeSoc: demande.codeSoc,
            annee_f: new Date().getFullYear().toString(),
          }
          break

        case "pre-avance":
          payload = {
            typePreavance: (editedRequest.type || editedRequest.typePreavance || "MEDICAL").toUpperCase(),
            montant: Number.parseFloat(editedRequest.montant),
            texteDemande: editedRequest.texteDemande || editedRequest.description,
            matPers: {
              id: demande.matPers?.id || demande.matPers?.$id || demande.matPers,
            },
          }
          break

        case "autorisation":
          payload = {
            dateDebut: editedRequest.dateDebut,
            texteDemande: editedRequest.texteDemande || editedRequest.description,
            horaireSortie: editedRequest.horaireSortie,
            minuteSortie: editedRequest.minuteSortie,
            horaireRetour: editedRequest.horaireRetour,
            minuteRetour: editedRequest.minuteRetour,
            matPers: demande.matPers,
            codeSoc: demande.codeSoc,
          }
          break

        case "conge":
          let duration = editedRequest.nbrJours || editedRequest.duration
          if (!duration && editedRequest.dateDebut && editedRequest.dateFin) {
            const startDate = new Date(editedRequest.dateDebut)
            const endDate = new Date(editedRequest.dateFin)
            const diffTime = endDate.getTime() - startDate.getTime()
            duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

            if (editedRequest.periodeDebut === "après-midi" || editedRequest.periodeDebut === "S") {
              duration -= 0.5
            }
            if (editedRequest.periodeFin === "matin" || editedRequest.periodeFin === "M") {
              duration -= 0.5
            }
          }

          payload = {
            dateDebut: editedRequest.dateDebut,
            dateFin: editedRequest.dateFin,
            texteDemande: editedRequest.texteDemande || editedRequest.description,
            nbrJours: Number.parseInt(duration),
            snjTempDep: editedRequest.snjTempDep || (editedRequest.periodeDebut === "matin" ? "M" : "S"),
            snjTempRetour: editedRequest.snjTempRetour || (editedRequest.periodeFin === "matin" ? "M" : "S"),
            matPers: demande.matPers,
            codeSoc: demande.codeSoc,
          }
          break

        default:
          throw new Error(`Type de demande non supporté: ${requestType}`)
      }

      return {
        ...payload,
        type: apiType,
        id: demande.id,
      }
    } catch (err) {
      setEditError(err.message)
      return null
    }
  }

  const handleSaveEdit = async () => {
    if (!validateForm()) return

    const payload = preparePayload()
    if (!payload) return

    try {
      setSavingChanges(true)

      const authToken = localStorage.getItem("authToken")
      const { id, type, ...requestData } = payload

      const response = await fetch(`${API_URL}/api/demande-${type}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestData),
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

      // Récupérer la demande mise à jour depuis la réponse si possible
      let updatedDemande
      try {
        updatedDemande = await response.json()
      } catch (e) {
        // Si on ne peut pas récupérer la demande mise à jour, on utilise les données locales
        updatedDemande = {
          ...demande,
          ...payload,
          reponseChef: "I",
          reponseRH: "I",
        }
      }

      alert("Demande mise à jour avec succès")
      onDemandeUpdated(updatedDemande)
      setIsEditing(false)
      onClose()
    } catch (err) {
      console.error("Update error:", err)
      setEditError(`Erreur lors de la mise à jour: ${err.message}`)
    } finally {
      setSavingChanges(false)
    }
  }

  const handleDownloadAttachment = async (isResponse = false) => {
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
      a.download = isResponse ? `reponse-${demande.id}.pdf` : `piece-jointe-${demande.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error)
      alert("Erreur lors du téléchargement du fichier")
    }
  }

  const handlePreviewFile = async (isResponse = false) => {
    try {
      setPreviewFile({
        url: null,
        type: null,
        loading: true,
        error: null,
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
        ? demande.fileReponseType || "application/pdf"
        : demande.pieceJointeType || "application/pdf"

      setPreviewFile({
        url,
        type: fileType,
        loading: false,
        error: null,
      })
    } catch (error) {
      console.error("Erreur lors du chargement:", error)
      setPreviewFile({
        url: null,
        type: null,
        loading: false,
        error: error.message,
      })
      alert("Erreur lors du chargement du fichier")
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
      error: null,
    })
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatTime = (hours, minutes) => {
    return `${hours?.toString().padStart(2, "0") || "00"}:${minutes?.toString().padStart(2, "0") || "00"}`
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

  const hasFileResponse = () => {
    return demande.demandeType === "document" && demande.fileReponse
  }

  const isPending = demande?.reponseChef === "I"

  return (
    <>
      {/* Main Modal */}
      <div className="modal-overlay" onClick={onClose}>
        <div className="demande-modal" onClick={(e) => e.stopPropagation()}>
          <div
            className="modal-header"
            data-status={getStatusInfo(demande.reponseChef).className.replace("status-", "")}
          >
            <div className="header-content">
              <div className="header-text">
                <h2>{isEditing ? "Modifier la Demande" : "Détails de la Demande"}</h2>
                <div className="status-text">{getStatusInfo(demande.reponseChef).text}</div>
              </div>
            </div>
            <button className="close-button" onClick={onClose}>
              <FiX />
            </button>
          </div>

          {/* Error Display */}
          {editError && (
            <div
              className="error-message"
              style={{ padding: "1rem", backgroundColor: "#fee2e2", color: "#dc2626", margin: "1rem" }}
            >
              <FiAlertCircle /> {editError}
            </div>
          )}

          <div className="modal-content">
            {/* Status Display */}
            <div
              className="status-display"
              style={{
                marginBottom: "1.5rem",
                paddingBottom: "1.5rem",
                borderBottom: "1px solid var(--light-border)",
              }}
            >
              <div className={`status-badge ${getStatusInfo(demande.reponseChef).className}`}>
                {getStatusInfo(demande.reponseChef).text}
              </div>
              {!isPending && (
                <div
                  className="status-warning"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "var(--warning)",
                    fontSize: "0.875rem",
                  }}
                >
                  <FiInfo />
                  <p>Cette demande ne peut plus être modifiée</p>
                </div>
              )}
            </div>

            {isEditing ? (
              /* Edit Form */
              <div className="edit-form">
                <h3>Modification de demande</h3>

                {/* Common Description Field */}
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    name="texteDemande"
                    value={editedRequest.texteDemande || editedRequest.description || ""}
                    onChange={handleChange}
                    disabled={!isPending}
                    placeholder="Décrivez votre demande..."
                    rows={4}
                  />
                  {formErrors.description && (
                    <span className="form-error" style={{ color: "var(--danger)", fontSize: "0.75rem" }}>
                      {formErrors.description}
                    </span>
                  )}
                </div>

                {/* Formation Specific Fields */}
                {demande?.typeDemande === "formation" && (
                  <>
                    <div className="form-group">
                      <label>Date de début *</label>
                      <input
                        type="date"
                        name="dateDebut"
                        value={
                          editedRequest.dateDebut ? new Date(editedRequest.dateDebut).toISOString().split("T")[0] : ""
                        }
                        onChange={handleChange}
                        disabled={!isPending}
                      />
                      {formErrors.dateDebut && (
                        <span className="form-error" style={{ color: "var(--danger)", fontSize: "0.75rem" }}>
                          {formErrors.dateDebut}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Titre *</label>
                      <div className="dropdown-container" style={{ position: "relative" }}>
                        <div
                          className="dropdown-trigger"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0.75rem 1rem",
                            border: "1px solid var(--light-border)",
                            borderRadius: "0.375rem",
                            backgroundColor: "var(--background)",
                            cursor: "pointer",
                          }}
                          onClick={() => setShowTitreSelector(!showTitreSelector)}
                        >
                          <span>{editedRequest.titre || "Sélectionner un titre"}</span>
                          <span>▼</span>
                        </div>
                        {showTitreSelector && (
                          <div
                            className="dropdown-selector"
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              backgroundColor: "white",
                              border: "1px solid var(--border-color)",
                              borderRadius: "0.375rem",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              zIndex: 1000,
                              maxHeight: "200px",
                              overflowY: "auto",
                            }}
                          >
                            {titres.map((item) => (
                              <div
                                key={item.id}
                                className="dropdown-item"
                                style={{
                                  padding: "0.75rem 1rem",
                                  cursor: "pointer",
                                  borderBottom: "1px solid var(--border-color)",
                                }}
                                onClick={() => selectTitre(item.id, item.name)}
                              >
                                {item.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {formErrors.titre && (
                        <span className="form-error" style={{ color: "var(--danger)", fontSize: "0.75rem" }}>
                          {formErrors.titre}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Type de formation *</label>
                      <div className="dropdown-container" style={{ position: "relative" }}>
                        <div
                          className={`dropdown-trigger ${!selectedTitreId ? "disabled" : ""}`}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0.75rem 1rem",
                            border: "1px solid var(--light-border)",
                            borderRadius: "0.375rem",
                            backgroundColor: "var(--background)",
                            cursor: selectedTitreId ? "pointer" : "not-allowed",
                            opacity: !selectedTitreId ? 0.5 : 1,
                          }}
                          onClick={() => selectedTitreId && setShowTypeSelector(!showTypeSelector)}
                        >
                          <span>{editedRequest.typeFormation || "Sélectionner un type"}</span>
                          <span>▼</span>
                        </div>
                        {showTypeSelector && selectedTitreId && (
                          <div
                            className="dropdown-selector"
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              backgroundColor: "white",
                              border: "1px solid var(--border-color)",
                              borderRadius: "0.375rem",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              zIndex: 1000,
                              maxHeight: "200px",
                              overflowY: "auto",
                            }}
                          >
                            {types.map((item) => (
                              <div
                                key={item.id}
                                className="dropdown-item"
                                style={{
                                  padding: "0.75rem 1rem",
                                  cursor: "pointer",
                                  borderBottom: "1px solid var(--border-color)",
                                }}
                                onClick={() => selectType(item.id, item.name)}
                              >
                                {item.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {formErrors.typeFormation && (
                        <span className="form-error" style={{ color: "var(--danger)", fontSize: "0.75rem" }}>
                          {formErrors.typeFormation}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Thème *</label>
                      <div className="dropdown-container" style={{ position: "relative" }}>
                        <div
                          className={`dropdown-trigger ${!selectedTypeId ? "disabled" : ""}`}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0.75rem 1rem",
                            border: "1px solid var(--light-border)",
                            borderRadius: "0.375rem",
                            backgroundColor: "var(--background)",
                            cursor: selectedTypeId ? "pointer" : "not-allowed",
                            opacity: !selectedTypeId ? 0.5 : 1,
                          }}
                          onClick={() => selectedTypeId && setShowThemeSelector(!showThemeSelector)}
                        >
                          <span>{editedRequest.theme || "Sélectionner un thème"}</span>
                          <span>▼</span>
                        </div>
                        {showThemeSelector && selectedTypeId && (
                          <div
                            className="dropdown-selector"
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              backgroundColor: "white",
                              border: "1px solid var(--border-color)",
                              borderRadius: "0.375rem",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              zIndex: 1000,
                              maxHeight: "200px",
                              overflowY: "auto",
                            }}
                          >
                            {themes.map((item) => (
                              <div
                                key={item.id}
                                className="dropdown-item"
                                style={{
                                  padding: "0.75rem 1rem",
                                  cursor: "pointer",
                                  borderBottom: "1px solid var(--border-color)",
                                }}
                                onClick={() => selectTheme(item.id, item.name)}
                              >
                                {item.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {formErrors.theme && (
                        <span className="form-error" style={{ color: "var(--danger)", fontSize: "0.75rem" }}>
                          {formErrors.theme}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Nombre de jours *</label>
                      <input
                        type="number"
                        name="nbrJours"
                        value={editedRequest.nbrJours || editedRequest.duration || ""}
                        onChange={handleChange}
                        disabled={!isPending}
                      />
                      {formErrors.nbrJours && (
                        <span className="form-error" style={{ color: "var(--danger)", fontSize: "0.75rem" }}>
                          {formErrors.nbrJours}
                        </span>
                      )}
                    </div>
                  </>
                )}

                {/* Document Specific Fields */}
                {demande.demandeType === "document" && (
                  <div className="form-group">
                    <label>Type de document *</label>
                    <div className="dropdown-container" style={{ position: "relative" }}>
                      <div
                        className="dropdown-trigger"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "0.75rem 1rem",
                          border: "1px solid var(--light-border)",
                          borderRadius: "0.375rem",
                          backgroundColor: "var(--background)",
                          cursor: "pointer",
                        }}
                        onClick={() => setShowDocumentTypeSelector(!showDocumentTypeSelector)}
                      >
                        <span>{editedRequest.typeDocument || "Sélectionner un type"}</span>
                        <span>▼</span>
                      </div>
                      {showDocumentTypeSelector && (
                        <div
                          className="dropdown-selector"
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            backgroundColor: "white",
                            border: "1px solid var(--border-color)",
                            borderRadius: "0.375rem",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            zIndex: 1000,
                            maxHeight: "200px",
                            overflowY: "auto",
                          }}
                        >
                          {documentTypes.map((type) => (
                            <div
                              key={type}
                              className="dropdown-item"
                              style={{
                                padding: "0.75rem 1rem",
                                cursor: "pointer",
                                borderBottom: "1px solid var(--border-color)",
                              }}
                              onClick={() => {
                                setEditedRequest((prev) => ({ ...prev, typeDocument: type }))
                                setShowDocumentTypeSelector(false)
                              }}
                            >
                              {type}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {formErrors.typeDocument && (
                      <span className="form-error" style={{ color: "var(--danger)", fontSize: "0.75rem" }}>
                        {formErrors.typeDocument}
                      </span>
                    )}
                  </div>
                )}

                {/* PreAvance Specific Fields */}
                {demande.demandeType === "pre-avance" && (
                  <>
                    <div className="form-group">
                      <label>Type de pré-avance *</label>
                      <div className="dropdown-container" style={{ position: "relative" }}>
                        <div
                          className="dropdown-trigger"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0.75rem 1rem",
                            border: "1px solid var(--light-border)",
                            borderRadius: "0.375rem",
                            backgroundColor: "var(--background)",
                            cursor: "pointer",
                          }}
                          onClick={() => setShowTypeAvanceSelector(!showTypeAvanceSelector)}
                        >
                          <span>{editedRequest.type || editedRequest.typePreavance || "Sélectionner un type"}</span>
                          <span>▼</span>
                        </div>
                        {showTypeAvanceSelector && (
                          <div
                            className="dropdown-selector"
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              backgroundColor: "white",
                              border: "1px solid var(--border-color)",
                              borderRadius: "0.375rem",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              zIndex: 1000,
                              maxHeight: "200px",
                              overflowY: "auto",
                            }}
                          >
                            {typesAvance.map((type) => (
                              <div
                                key={type}
                                className="dropdown-item"
                                style={{
                                  padding: "0.75rem 1rem",
                                  cursor: "pointer",
                                  borderBottom: "1px solid var(--border-color)",
                                }}
                                onClick={() => {
                                  setEditedRequest((prev) => ({ ...prev, type: type, typePreavance: type }))
                                  setShowTypeAvanceSelector(false)
                                }}
                              >
                                {type}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {formErrors.type && (
                        <span className="form-error" style={{ color: "var(--danger)", fontSize: "0.75rem" }}>
                          {formErrors.type}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Montant *</label>
                      <input
                        type="number"
                        name="montant"
                        value={editedRequest.montant || ""}
                        onChange={handleChange}
                        disabled={!isPending}
                      />
                      {formErrors.montant && (
                        <span className="form-error" style={{ color: "var(--danger)", fontSize: "0.75rem" }}>
                          {formErrors.montant}
                        </span>
                      )}
                    </div>
                  </>
                )}

                {/* Autorisation Specific Fields */}
                {demande.demandeType === "autorisation" && (
                  <>
                    <div className="form-group">
                      <label>Date *</label>
                      <input
                        type="date"
                        name="dateDebut"
                        value={
                          editedRequest.dateDebut ? new Date(editedRequest.dateDebut).toISOString().split("T")[0] : ""
                        }
                        onChange={handleChange}
                        disabled={!isPending}
                      />
                      {formErrors.dateDebut && (
                        <span className="form-error" style={{ color: "var(--danger)", fontSize: "0.75rem" }}>
                          {formErrors.dateDebut}
                        </span>
                      )}
                    </div>
                    <div
                      className="time-fields"
                      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
                    >
                      <div className="form-group">
                        <label>Heure de sortie *</label>
                        <input
                          type="time"
                          value={formatTime(editedRequest.horaireSortie, editedRequest.minuteSortie)}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(":")
                            handleTimeChange("horaireSortie", Number.parseInt(hours))
                            handleTimeChange("minuteSortie", Number.parseInt(minutes))
                          }}
                          disabled={!isPending}
                        />
                        {formErrors.heureSortie && (
                          <span className="form-error" style={{ color: "var(--danger)", fontSize: "0.75rem" }}>
                            {formErrors.heureSortie}
                          </span>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Heure de retour *</label>
                        <input
                          type="time"
                          value={formatTime(editedRequest.horaireRetour, editedRequest.minuteRetour)}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(":")
                            handleTimeChange("horaireRetour", Number.parseInt(hours))
                            handleTimeChange("minuteRetour", Number.parseInt(minutes))
                          }}
                          disabled={!isPending}
                        />
                        {formErrors.heureRetour && (
                          <span className="form-error" style={{ color: "var(--danger)", fontSize: "0.75rem" }}>
                            {formErrors.heureRetour}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Conge Specific Fields */}
                {demande.demandeType === "conge" && (
                  <>
                    <div className="form-group">
                      <label>Date de début *</label>
                      <input
                        type="date"
                        name="dateDebut"
                        value={
                          editedRequest.dateDebut ? new Date(editedRequest.dateDebut).toISOString().split("T")[0] : ""
                        }
                        onChange={handleChange}
                        disabled={!isPending}
                      />
                      {formErrors.dateDebut && (
                        <span className="form-error" style={{ color: "var(--danger)", fontSize: "0.75rem" }}>
                          {formErrors.dateDebut}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Période de début</label>
                      <div className="dropdown-container" style={{ position: "relative" }}>
                        <div
                          className="dropdown-trigger"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0.75rem 1rem",
                            border: "1px solid var(--light-border)",
                            borderRadius: "0.375rem",
                            backgroundColor: "var(--background)",
                            cursor: "pointer",
                          }}
                          onClick={() => setShowPeriodeDebutSelector(!showPeriodeDebutSelector)}
                        >
                          <span>
                            {editedRequest.periodeDebut || editedRequest.snjTempDep === "M" ? "matin" : "après-midi"}
                          </span>
                          <span>▼</span>
                        </div>
                        {showPeriodeDebutSelector && (
                          <div
                            className="dropdown-selector"
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              backgroundColor: "white",
                              border: "1px solid var(--border-color)",
                              borderRadius: "0.375rem",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              zIndex: 1000,
                              maxHeight: "200px",
                              overflowY: "auto",
                            }}
                          >
                            {periodeOptions.map((periode) => (
                              <div
                                key={periode}
                                className="dropdown-item"
                                style={{
                                  padding: "0.75rem 1rem",
                                  cursor: "pointer",
                                  borderBottom: "1px solid var(--border-color)",
                                }}
                                onClick={() => {
                                  setEditedRequest((prev) => ({
                                    ...prev,
                                    periodeDebut: periode,
                                    snjTempDep: periode === "matin" ? "M" : "S",
                                  }))
                                  setShowPeriodeDebutSelector(false)
                                }}
                              >
                                {periode}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Date de fin *</label>
                      <input
                        type="date"
                        name="dateFin"
                        value={editedRequest.dateFin ? new Date(editedRequest.dateFin).toISOString().split("T")[0] : ""}
                        onChange={handleChange}
                        disabled={!isPending}
                      />
                      {formErrors.dateFin && (
                        <span className="form-error" style={{ color: "var(--danger)", fontSize: "0.75rem" }}>
                          {formErrors.dateFin}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Période de fin</label>
                      <div className="dropdown-container" style={{ position: "relative" }}>
                        <div
                          className="dropdown-trigger"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0.75rem 1rem",
                            border: "1px solid var(--light-border)",
                            borderRadius: "0.375rem",
                            backgroundColor: "var(--background)",
                            cursor: "pointer",
                          }}
                          onClick={() => setShowPeriodeFinSelector(!showPeriodeFinSelector)}
                        >
                          <span>
                            {editedRequest.periodeFin || editedRequest.snjTempRetour === "M" ? "matin" : "après-midi"}
                          </span>
                          <span>▼</span>
                        </div>
                        {showPeriodeFinSelector && (
                          <div
                            className="dropdown-selector"
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              backgroundColor: "white",
                              border: "1px solid var(--border-color)",
                              borderRadius: "0.375rem",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              zIndex: 1000,
                              maxHeight: "200px",
                              overflowY: "auto",
                            }}
                          >
                            {periodeOptions.map((periode) => (
                              <div
                                key={periode}
                                className="dropdown-item"
                                style={{
                                  padding: "0.75rem 1rem",
                                  cursor: "pointer",
                                  borderBottom: "1px solid var(--border-color)",
                                }}
                                onClick={() => {
                                  setEditedRequest((prev) => ({
                                    ...prev,
                                    periodeFin: periode,
                                    snjTempRetour: periode === "matin" ? "M" : "S",
                                  }))
                                  setShowPeriodeFinSelector(false)
                                }}
                              >
                                {periode}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Nombre de jours</label>
                      <input
                        type="number"
                        name="nbrJours"
                        value={editedRequest.nbrJours || editedRequest.duration || ""}
                        onChange={handleChange}
                        disabled={!isPending}
                      />
                    </div>
                  </>
                )}

                {/* File Management */}
                <div className="form-group">
                  <label>Fichiers joints</label>
                  <div className="file-upload-section">
                    <label
                      className={`file-upload-label ${!isPending ? "disabled" : ""}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1rem",
                        backgroundColor: "var(--background)",
                        border: "1px dashed var(--border-color)",
                        borderRadius: "0.375rem",
                        color: "var(--text-secondary)",
                        fontSize: "0.875rem",
                        cursor: isPending ? "pointer" : "not-allowed",
                        opacity: !isPending ? 0.5 : 1,
                      }}
                    >
                      <FiUpload />
                      {editedRequest.files?.length ? "Remplacer le fichier" : "Ajouter un fichier"}
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={!isPending || fileUploading}
                        style={{ display: "none" }}
                      />
                    </label>

                    {uploadError && (
                      <div
                        className="upload-error"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          color: "var(--danger)",
                          fontSize: "0.875rem",
                        }}
                      >
                        <FiAlertCircle /> {uploadError}
                      </div>
                    )}

                    {editedRequest.files?.map((file, index) => (
                      <div
                        key={index}
                        className="file-preview"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.5rem",
                          backgroundColor: "var(--background)",
                          borderRadius: "0.375rem",
                          border: "1px solid var(--border-color)",
                          fontSize: "0.875rem",
                          color: "var(--text-primary)",
                        }}
                      >
                        <FiFileText />
                        <span>{file.name || `Fichier ${index + 1}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="request-details">
                {/* Common Fields */}
                <div className="demande-info-section">
                  <div className="section-header">
                    <FiFileText />
                    <h3>Informations Générales</h3>
                  </div>
                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-label">Type de Demande</div>
                      <div className="info-value">
                        <span className="info-value">{getTypeText(demande.demandeType)}</span>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Date de Soumission</div>
                      <div className="info-value">{formatDate(demande.dateDemande)}</div>
                    </div>
                    {demande.dateDebut && (
                      <div className="info-item">
                        <div className="info-label">Date de Début</div>
                        <div className="info-value">{formatDate(demande.dateDebut)}</div>
                      </div>
                    )}
                    {demande.dateFin && (
                      <div className="info-item">
                        <div className="info-label">Date de Fin</div>
                        <div className="info-value">{formatDate(demande.dateFin)}</div>
                      </div>
                    )}
                    {demande.nbrJours && (
                      <div className="info-item">
                        <div className="info-label">Nombre de Jours</div>
                        <div className="info-value">{demande.nbrJours}</div>
                      </div>
                    )}
                    {demande.montant && (
                      <div className="info-item">
                        <div className="info-label">Montant</div>
                        <div className="info-value">{demande.montant} DH</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Type-specific details */}
                {demande.demandeType === "document" && (
                  <div className="demande-info-section">
                    <div className="section-header">
                      <FiFileText />
                      <h3>Type de document</h3>
                    </div>
                    <div className="info-value">{demande.typeDocument || "Non spécifié"}</div>
                  </div>
                )}

                {demande.typeDemande === "formation" && (
                  <div className="demande-info-section">
                    <div className="section-header">
                      <FiBook />
                      <h3>Détails de la Formation</h3>
                    </div>
                    <div className="info-grid">
                      <div className="info-item">
                        <div className="info-label">Titre</div>
                        <div className="info-value">
                          {extractStringValue(demande.titre, ["titre", "nom"]) || "Non spécifié"}
                        </div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Type de formation</div>
                        <div className="info-value">{getFormationTypeDisplay(demande)}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Thème</div>
                        <div className="info-value">
                          {extractStringValue(demande.theme, ["theme", "nom"]) || "Non spécifié"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {demande.demandeType === "pre-avance" && (
                  <div className="demande-info-section">
                    <div className="section-header">
                      <FiDollarSign />
                      <h3>Détails de la Pré-Avance</h3>
                    </div>
                    <div className="info-grid">
                      <div className="info-item">
                        <div className="info-label">Type</div>
                        <div className="info-value">{demande.typePreavance || demande.type || "Non spécifié"}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Montant</div>
                        <div className="info-value">{demande.montant} DH</div>
                      </div>
                    </div>
                  </div>
                )}

                {demande.demandeType === "autorisation" && (
                  <div className="demande-info-section">
                    <div className="section-header">
                      <FiClock />
                      <h3>Détails de l'Autorisation</h3>
                    </div>
                    <div className="info-grid">
                      <div className="info-item">
                        <div className="info-label">Heure de sortie</div>
                        <div className="info-value">{formatTime(demande.horaireSortie, demande.minuteSortie)}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Heure de retour</div>
                        <div className="info-value">{formatTime(demande.horaireRetour, demande.minuteRetour)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="demande-info-section">
                  <div className="section-header">
                    <FiFileText />
                    <h3>Description de la Demande</h3>
                  </div>
                  <div className="demande-text-full">
                    {demande.texteDemande || <span className="no-content">Aucune description fournie</span>}
                  </div>
                </div>

                {/* Files */}
                {demande.pieceJointe && (
                  <div className="demande-info-section">
                    <div className="section-header">
                      <FiFileText />
                      <h3>Pièce Jointe</h3>
                    </div>
                    <div className="file-actions">
                      <button className="btn btn-primary" onClick={() => handlePreviewFile(false)}>
                        <FiEye /> Prévisualiser
                      </button>
                      <button className="btn btn-secondary" onClick={() => handleDownloadAttachment(false)}>
                        <FiDownload /> Télécharger
                      </button>
                    </div>
                  </div>
                )}

                {hasFileResponse() && (
                  <div className="demande-info-section">
                    <div className="section-header">
                      <FiFileText />
                      <h3>Réponse du Document</h3>
                    </div>
                    <div className="file-actions">
                      <button className="btn btn-primary" onClick={() => handlePreviewFile(true)}>
                        <FiEye /> Prévisualiser
                      </button>
                      <button className="btn btn-secondary" onClick={() => handleDownloadAttachment(true)}>
                        <FiDownload /> Télécharger
                      </button>
                    </div>
                  </div>
                )}

                {demande.texteReponse && (
                  <div className="demande-info-section">
                    <div className="section-header">
                      <FiFileText />
                      <h3>Réponse</h3>
                    </div>
                    <div className="response-text">{demande.texteReponse}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            {isPending ? (
              isEditing ? (
                <>
                  <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                    Annuler
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveEdit}
                    disabled={fileUploading || savingChanges}
                  >
                    {savingChanges ? (
                      <>
                        <div className="spinner-small"></div> Enregistrement...
                      </>
                    ) : (
                      "Enregistrer"
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-danger" onClick={() => {}}>
                    <FiTrash2 /> Supprimer
                  </button>
                  <button className="btn btn-primary" onClick={handleEditDemande}>
                    <FiEdit /> Modifier
                  </button>
                </>
              )
            ) : (
              <button className="btn btn-secondary" onClick={onClose}>
                Fermer
              </button>
            )}
          </div>
        </div>
      </div>

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
                <embed src={previewFile.url} type="application/pdf" width="100%" height="500px" />
              ) : previewFile.type.includes("image") ? (
                <img
                  src={previewFile.url || "/placeholder.svg"}
                  alt="Preview"
                  style={{ maxWidth: "100%", maxHeight: "500px" }}
                />
              ) : (
                <div className="unsupported-preview">
                  <FiFileText size={48} />
                  <p>Prévisualisation non disponible pour ce type de fichier</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      const a = document.createElement("a")
                      a.href = previewFile.url
                      a.download = "document"
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
    </>
  )
}

export default DemandesModal
