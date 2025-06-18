"use client"
import { useState, useEffect } from "react"
import {
  FiEdit,
  FiX,
  FiTrash2,
  FiDownload,
  FiCalendar,
  FiFileText,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiUpload,
  FiInfo,
  FiDollarSign,
  FiBook,
  FiBriefcase,
} from "react-icons/fi"

const DemandeModal = ({ isOpen, onClose, request, onSave, onDelete, token, API_URL }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedRequest, setEditedRequest] = useState({})
  const [fileUploading, setFileUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [error, setError] = useState(null)

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

  // Helper function to extract string value from nested objects (updated)
  const extractStringValue = (value, possibleKeys = ["titre", "type", "theme", "nom", "name"]) => {
    if (!value) return ""
    if (typeof value === "string") return value
    if (typeof value === "object") {
      // Try different possible keys
      for (const key of possibleKeys) {
        if (value[key] && typeof value[key] === "string") {
          return value[key]
        }
      }
      // Fallback to $id if no string value found
      return value.$id || value.id || ""
    }
    return ""
  }

  // Helper function to extract ID from nested objects (same as mobile)
  const extractIdValue = (value) => {
    if (!value) return ""
    if (typeof value === "string") return value
    if (typeof value === "object") {
      return value.id || value.$id || ""
    }
    return ""
  }

  // Helper function to get formation type display value (corrected to use theme.id)
  const getFormationTypeDisplay = (request) => {
    console.log("Getting formation type display for:", request)

    // Pour les demandes de formation
    if (request.typeDemande === "formation") {
      // Méthode 1: Utiliser theme.id pour trouver le type correspondant dans titre.types
      if (request.theme && request.theme.id && request.titre && request.titre.types) {
        const themeId = request.theme.id
        console.log("Looking for theme ID:", themeId)

        // Parcourir tous les types dans titre.types pour trouver celui qui contient ce thème
        for (const typeObj of request.titre.types) {
          if (typeObj.themes && Array.isArray(typeObj.themes)) {
            const hasTheme = typeObj.themes.some((theme) => theme.id === themeId)
            if (hasTheme) {
              console.log("Found type for theme:", typeObj.type)
              return typeObj.type
            }
          }
        }
      }

      // Méthode 2: Si on a un seul type dans titre.types, c'est probablement le bon
      if (request.titre && request.titre.types && request.titre.types.length === 1) {
        console.log("Found single type in titre.types:", request.titre.types[0].type)
        return request.titre.types[0].type
      }

      // Méthode 3: Chercher dans la liste des types chargés par l'API
      if (types.length > 0 && request.theme && request.theme.id) {
        // Trouver le type qui contient ce thème
        const matchingType = types.find((type) => {
          // Ici on devrait vérifier si ce type contient le thème, mais on n'a pas cette info
          // Pour l'instant, on prend le premier type disponible
          return type.id
        })
        if (matchingType) {
          console.log("Found matching type in API list:", matchingType.name)
          return matchingType.name
        }
      }

      // Méthode 4: Fallback - prendre le premier type disponible dans titre.types
      if (request.titre && request.titre.types && request.titre.types.length > 0) {
        const firstType = request.titre.types[0]
        console.log("Using first available type:", firstType.type)
        return firstType.type
      }

      console.log("No formation type found, using fallback")
      return "Non spécifié"
    }

    // Fallback pour typeFormation si présent
    if (request.typeFormation) {
      return extractStringValue(request.typeFormation, ["type", "nom", "name"])
    }

    console.log("No formation type found")
    return "Non spécifié"
  }

  // Helper function to get the correct type ID for formations
  const getFormationTypeId = (request) => {
    if (request.typeDemande === "formation") {
      // Utiliser la même logique que getFormationTypeDisplay pour trouver l'ID
      if (request.theme && request.theme.id && request.titre && request.titre.types) {
        const themeId = request.theme.id

        // Parcourir tous les types dans titre.types pour trouver celui qui contient ce thème
        for (const typeObj of request.titre.types) {
          if (typeObj.themes && Array.isArray(typeObj.themes)) {
            const hasTheme = typeObj.themes.some((theme) => theme.id === themeId)
            if (hasTheme) {
              return typeObj.id
            }
          }
        }
      }

      // Fallback: prendre le premier type disponible
      if (request.titre && request.titre.types && request.titre.types.length > 0) {
        return request.titre.types[0].id
      }
    }
    return null
  }

  // Fetch titres from API (same as mobile)
  const fetchTitres = async () => {
    try {
      const response = await fetch(`${API_URL}/api/titres/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        const transformedTitres = data.map((titre) => ({ id: titre.id, name: titre.titre }))
        setTitres(transformedTitres)

        // Handle existing titre selection with proper object extraction
        if (request?.titre) {
          const titreValue = extractStringValue(request.titre, ["titre", "nom"])
          const titreId = extractIdValue(request.titre)
          const matchingTitre = transformedTitres.find((t) => t.name === titreValue || t.id === titreId)

          if (matchingTitre) {
            setSelectedTitreId(matchingTitre.id)
            setEditedRequest((prev) => ({
              ...prev,
              titre: matchingTitre.name,
              titreId: matchingTitre.id,
            }))
            await fetchTypesByTitreId(matchingTitre.id)
          }
        }
      }
    } catch (err) {
      console.error("Error fetching titres:", err)
    }
  }

  // Fetch types by titreId (same as mobile)
  const fetchTypesByTitreId = async (titreId) => {
    try {
      const response = await fetch(`${API_URL}/api/titres/${titreId}/types`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        const transformedTypes = data
          .filter((type) => type.type !== null)
          .map((type) => ({ id: type.id, name: type.type }))
        setTypes(transformedTypes)

        // Handle existing type selection - utiliser la nouvelle fonction pour obtenir l'ID correct
        if (request?.typeDemande === "formation") {
          const typeId = getFormationTypeId(request)
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

  // Fetch themes by typeId (same as mobile)
  const fetchThemesByTypeId = async (titreId, typeId) => {
    try {
      const response = await fetch(`${API_URL}/api/titres/${titreId}/types/${typeId}/themes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        const transformedThemes = data
          .filter((theme) => theme.theme !== null)
          .map((theme) => ({ id: theme.id, name: theme.theme }))
        setThemes(transformedThemes)

        // Handle existing theme selection
        if (request?.theme) {
          const themeValue = extractStringValue(request.theme, ["theme", "nom"])
          const themeId = extractIdValue(request.theme)
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

  // Select titre
  const selectTitre = (id, name) => {
    setSelectedTitreId(id)
    setEditedRequest((prev) => ({ ...prev, titre: name, titreId: id }))
    setShowTitreSelector(false)
    // Reset type and theme when titre changes
    setSelectedTypeId(null)
    setSelectedThemeId(null)
    setEditedRequest((prev) => ({ ...prev, typeFormation: "", typeId: "", theme: "", themeId: "" }))
    setTypes([])
    setThemes([])
    fetchTypesByTitreId(id)
  }

  // Select type
  const selectType = (id, name) => {
    setSelectedTypeId(id)
    setEditedRequest((prev) => ({ ...prev, typeFormation: name, typeId: id }))
    setShowTypeSelector(false)
    // Reset theme when type changes
    setSelectedThemeId(null)
    setEditedRequest((prev) => ({ ...prev, theme: "", themeId: "" }))
    setThemes([])
    if (selectedTitreId) {
      fetchThemesByTypeId(selectedTitreId, id)
    }
  }

  // Select theme
  const selectTheme = (id, name) => {
    setSelectedThemeId(id)
    setEditedRequest((prev) => ({ ...prev, theme: name, themeId: id }))
    setShowThemeSelector(false)
  }

  useEffect(() => {
    if (request) {
      console.log("Request data:", request)

      // Create a copy of the request and normalize the nested objects
      const normalizedRequest = { ...request }

      // Handle Formation-specific nested objects (adapted from mobile logic)
      if (request.typeDemande === "formation") {
        console.log("Processing formation request")

        // Extract titre value and ID
        if (request.titre) {
          const titreValue = extractStringValue(request.titre, ["titre", "nom"])
          const titreId = extractIdValue(request.titre)
          if (titreValue) {
            normalizedRequest.titre = titreValue
            normalizedRequest.titreId = titreId
          }
        }

        // Extract type value and ID - utiliser la nouvelle fonction
        const typeValue = getFormationTypeDisplay(request)
        const typeId = getFormationTypeId(request)
        if (typeValue && typeValue !== "Non spécifié") {
          normalizedRequest.typeFormation = typeValue
          normalizedRequest.typeId = typeId
        }

        // Extract theme value and ID
        if (request.theme) {
          const themeValue = extractStringValue(request.theme, ["theme", "nom"])
          const themeId = extractIdValue(request.theme)
          if (themeValue) {
            normalizedRequest.theme = themeValue
            normalizedRequest.themeId = themeId
          }
        }

        setEditedRequest(normalizedRequest)
        fetchTitres()
      } else {
        setEditedRequest(normalizedRequest)
        setFormErrors({})
        setError(null)
      }
    }
  }, [request])

  const isPending =
    request?.status?.toLowerCase()?.includes("attente") || request?.status?.toLowerCase()?.includes("instantanée")

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


    const handleFileUpload = async (fileId, filename = "document") => {
    if (!fileId) {
      toast.warning("No file selected");
      return;
    }

    const toastId = toast.loading("Preparing download...");
    
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${API_URL}/api/files/download/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error: ${response.status}`);
      }

      const contentDisposition = response.headers.get('content-disposition');
      let actualFilename = filename;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          actualFilename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = actualFilename;
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.update(toastId, {
        render: "Download started!",
        type: "success",
        isLoading: false,
        autoClose: 2000
      });
    } catch (err) {
      console.error("Download error:", err);
      toast.update(toastId, {
        render: `Download failed: ${err.message}`,
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    }
  };

  const validateForm = () => {
    const errors = {}

    if (!editedRequest.texteDemande && !editedRequest.description) {
      errors.description = "Description requise"
    }

    // Utiliser typeDemande pour identifier le type de demande
    if (request.typeDemande === "formation") {
      if (!editedRequest.dateDebut) {
        errors.dateDebut = "Date de début requise"
      }

      // Pour les formations, vérifier si on a soit les nouvelles valeurs sélectionnées, soit les valeurs originales
      const hasOriginalTitre = request.titre && (extractIdValue(request.titre) || extractStringValue(request.titre))
      const hasOriginalType = getFormationTypeId(request) // Utiliser la nouvelle fonction
      const hasOriginalTheme = request.theme && (extractIdValue(request.theme) || extractStringValue(request.theme))

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

    if (request.type === "Document" && !editedRequest.typeDocument) {
      errors.typeDocument = "Type de document requis"
    }

    if (request.type === "PreAvance") {
      if (!editedRequest.type && !editedRequest.typePreavance) {
        errors.type = "Type de pré-avance requis"
      }
      if (!editedRequest.montant) {
        errors.montant = "Montant requis"
      }
    }

    if (request.type === "Autorisation") {
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

    if (request.type === "Conge") {
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
      if (!request?.typeDemande && !request?.type) {
        throw new Error("Type de demande non défini")
      }

      const apiTypeMap = {
        formation: "formation",
        document: "document",
        "pre-avance": "pre-avance",
        autorisation: "autorisation",
        conge: "conge",
      }

      // Utiliser typeDemande si disponible, sinon fallback sur type
      const requestType = request.typeDemande || request.type
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
            matPers: request.matPers,
            codeSoc: request.codeSoc,
          }
          break

        case "formation":
          // Utiliser les valeurs sélectionnées ou les valeurs originales
          const finalTitreId = selectedTitreId || extractIdValue(request.titre)
          const finalTypeId = selectedTypeId || getFormationTypeId(request)
          const finalThemeId = selectedThemeId || extractIdValue(request.theme)

          payload = {
            dateDebut: editedRequest.dateDebut,
            texteDemande: editedRequest.texteDemande || editedRequest.description,
            nbrJours: editedRequest.nbrJours || editedRequest.duration,
            titre: { id: finalTitreId },
            type: { id: finalTypeId },
            theme: { id: finalThemeId },
            matPers: request.matPers,
            codeSoc: request.codeSoc,
            annee_f: new Date().getFullYear().toString(),
          }
          break

        case "pre-avance":
          payload = {
            typePreavance: (editedRequest.type || editedRequest.typePreavance || "MEDICAL").toUpperCase(),
            montant: Number.parseFloat(editedRequest.montant),
            texteDemande: editedRequest.texteDemande || editedRequest.description,
            matPers: {
              id: request.matPers?.id || request.matPers?.$id || request.matPers,
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
            matPers: request.matPers,
            codeSoc: request.codeSoc,
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
            matPers: request.matPers,
            codeSoc: request.codeSoc,
          }
          break

        default:
          throw new Error(`Type de demande non supporté: ${requestType}`)
      }

      return {
        ...payload,
        type: apiType,
        id: request.id,
      }
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  const handleSave = () => {
    if (!validateForm()) return

    const payload = preparePayload()
    if (payload) {
      onSave(payload)
      setIsEditing(false)
    }
  }

  const statusConfig = {
    approved: { class: "approved", icon: <FiCheckCircle /> },
    rejected: { class: "rejected", icon: <FiAlertCircle /> },
    pending: { class: "pending", icon: <FiClock /> },
  }

  const getStatusDetails = (status) => {
    if (!status) return statusConfig.pending
    const lowerStatus = status.toLowerCase()
    if (lowerStatus.includes("approuv")) return statusConfig.approved
    if (lowerStatus.includes("rejet")) return statusConfig.rejected
    return statusConfig.pending
  }

  const formatDate = (dateString) => {
    try {
      return dateString ? new Date(dateString).toLocaleDateString("fr-FR") : "Non spécifié"
    } catch {
      return "Date invalide"
    }
  }

  const formatTime = (hours, minutes) => {
    return `${hours?.toString().padStart(2, "0") || "00"}:${minutes?.toString().padStart(2, "0") || "00"}`
  }

  if (!isOpen || !request) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>
            {request.type || "Demande"} - {formatDate(request.dateDemande || request.date)}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <FiAlertCircle /> {error}
          </div>
        )}

        {/* Content */}
        <div className="modal-content">
          {/* Status Display */}
          <div className="status-display">
            <div className={`status-badge ${getStatusDetails(request.status).class}`}>
              {getStatusDetails(request.status).icon}
              {request.status || "Statut inconnu"}
            </div>
            {!isPending && (
              <div className="status-warning">
                <FiInfo />
                <p>Cette demande ne peut plus être modifiée</p>
              </div>
            )}
          </div>

          {/* View/Edit Toggle */}
          {isEditing ? (
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
                />
                {formErrors.description && <span className="form-error">{formErrors.description}</span>}
              </div>

              {/* Formation Specific Fields */}
              {request?.typeDemande === "formation" && isEditing && (
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
                    {formErrors.dateDebut && <span className="form-error">{formErrors.dateDebut}</span>}
                  </div>

                  <div className="form-group">
                    <label>Titre *</label>
                    <div className="dropdown-container">
                      <div className="dropdown-trigger" onClick={() => setShowTitreSelector(!showTitreSelector)}>
                        <span>{editedRequest.titre || "Sélectionner un titre"}</span>
                        <span>▼</span>
                      </div>
                      {showTitreSelector && (
                        <div className="dropdown-selector">
                          {titres.map((item) => (
                            <div
                              key={item.id}
                              className="dropdown-item"
                              onClick={() => selectTitre(item.id, item.name)}
                            >
                              {item.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {formErrors.titre && <span className="form-error">{formErrors.titre}</span>}
                  </div>

                  <div className="form-group">
                    <label>Type de formation *</label>
                    <div className="dropdown-container">
                      <div
                        className={`dropdown-trigger ${!selectedTitreId ? "disabled" : ""}`}
                        onClick={() => selectedTitreId && setShowTypeSelector(!showTypeSelector)}
                      >
                        <span>{editedRequest.typeFormation || "Sélectionner un type"}</span>
                        <span>▼</span>
                      </div>
                      {showTypeSelector && selectedTitreId && (
                        <div className="dropdown-selector">
                          {types.map((item) => (
                            <div key={item.id} className="dropdown-item" onClick={() => selectType(item.id, item.name)}>
                              {item.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {formErrors.typeFormation && <span className="form-error">{formErrors.typeFormation}</span>}
                  </div>

                  <div className="form-group">
                    <label>Thème *</label>
                    <div className="dropdown-container">
                      <div
                        className={`dropdown-trigger ${!selectedTypeId ? "disabled" : ""}`}
                        onClick={() => selectedTypeId && setShowThemeSelector(!showThemeSelector)}
                      >
                        <span>{editedRequest.theme || "Sélectionner un thème"}</span>
                        <span>▼</span>
                      </div>
                      {showThemeSelector && selectedTypeId && (
                        <div className="dropdown-selector">
                          {themes.map((item) => (
                            <div
                              key={item.id}
                              className="dropdown-item"
                              onClick={() => selectTheme(item.id, item.name)}
                            >
                              {item.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {formErrors.theme && <span className="form-error">{formErrors.theme}</span>}
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
                    {formErrors.nbrJours && <span className="form-error">{formErrors.nbrJours}</span>}
                  </div>
                </>
              )}

              {/* Document Specific Fields */}
              {request.type === "Document" && (
                <div className="form-group">
                  <label>Type de document *</label>
                  <div className="dropdown-container">
                    <div
                      className="dropdown-trigger"
                      onClick={() => setShowDocumentTypeSelector(!showDocumentTypeSelector)}
                    >
                      <span>{editedRequest.typeDocument || "Sélectionner un type"}</span>
                      <span>▼</span>
                    </div>
                    {showDocumentTypeSelector && (
                      <div className="dropdown-selector">
                        {documentTypes.map((type) => (
                          <div
                            key={type}
                            className="dropdown-item"
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
                  {formErrors.typeDocument && <span className="form-error">{formErrors.typeDocument}</span>}
                </div>
              )}

              {/* PreAvance Specific Fields */}
              {request.type === "PreAvance" && (
                <>
                  <div className="form-group">
                    <label>Type de pré-avance *</label>
                    <div className="dropdown-container">
                      <div
                        className="dropdown-trigger"
                        onClick={() => setShowTypeAvanceSelector(!showTypeAvanceSelector)}
                      >
                        <span>{editedRequest.type || editedRequest.typePreavance || "Sélectionner un type"}</span>
                        <span>▼</span>
                      </div>
                      {showTypeAvanceSelector && (
                        <div className="dropdown-selector">
                          {typesAvance.map((type) => (
                            <div
                              key={type}
                              className="dropdown-item"
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
                    {formErrors.type && <span className="form-error">{formErrors.type}</span>}
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
                    {formErrors.montant && <span className="form-error">{formErrors.montant}</span>}
                  </div>
                </>
              )}

              {/* Autorisation Specific Fields */}
              {request.type === "Autorisation" && (
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
                    {formErrors.dateDebut && <span className="form-error">{formErrors.dateDebut}</span>}
                  </div>
                  <div className="time-fields">
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
                      {formErrors.heureSortie && <span className="form-error">{formErrors.heureSortie}</span>}
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
                      {formErrors.heureRetour && <span className="form-error">{formErrors.heureRetour}</span>}
                    </div>
                  </div>
                </>
              )}

              {/* Conge Specific Fields */}
              {request.type === "Conge" && (
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
                    {formErrors.dateDebut && <span className="form-error">{formErrors.dateDebut}</span>}
                  </div>

                  <div className="form-group">
                    <label>Période de début</label>
                    <div className="dropdown-container">
                      <div
                        className="dropdown-trigger"
                        onClick={() => setShowPeriodeDebutSelector(!showPeriodeDebutSelector)}
                      >
                        <span>
                          {editedRequest.periodeDebut || editedRequest.snjTempDep === "M" ? "matin" : "après-midi"}
                        </span>
                        <span>▼</span>
                      </div>
                      {showPeriodeDebutSelector && (
                        <div className="dropdown-selector">
                          {periodeOptions.map((periode) => (
                            <div
                              key={periode}
                              className="dropdown-item"
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
                    {formErrors.dateFin && <span className="form-error">{formErrors.dateFin}</span>}
                  </div>

                  <div className="form-group">
                    <label>Période de fin</label>
                    <div className="dropdown-container">
                      <div
                        className="dropdown-trigger"
                        onClick={() => setShowPeriodeFinSelector(!showPeriodeFinSelector)}
                      >
                        <span>
                          {editedRequest.periodeFin || editedRequest.snjTempRetour === "M" ? "matin" : "après-midi"}
                        </span>
                        <span>▼</span>
                      </div>
                      {showPeriodeFinSelector && (
                        <div className="dropdown-selector">
                          {periodeOptions.map((periode) => (
                            <div
                              key={periode}
                              className="dropdown-item"
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
                  <label className={`file-upload-label ${!isPending ? "disabled" : ""}`}>
                    <FiUpload />
                    {editedRequest.files?.length ? "Remplacer le fichier" : "Ajouter un fichier"}
                    <input type="file" onChange={handleFileUpload} disabled={!isPending || fileUploading} />
                  </label>

                  {uploadError && (
                    <div className="upload-error">
                      <FiAlertCircle /> {uploadError}
                    </div>
                  )}

                  {editedRequest.files?.map((file, index) => (
                    <div key={index} className="file-preview">
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
              <div className="detail-group">
                <FiCalendar className="detail-icon" />
                <div>
                  <h4>Date de demande</h4>
                  <p>{formatDate(request.dateDemande || request.date)}</p>
                </div>
              </div>

              {/* Type-specific details */}
              {request.type === "Document" && (
                <div className="detail-group">
                  <FiFileText className="detail-icon" />
                  <div>
                    <h4>Type de document</h4>
                    <p>{request.typeDocument || "Non spécifié"}</p>
                  </div>
                </div>
              )}

              {request.typeDemande === "formation" && !isEditing && (
                <>
                  <div className="detail-group">
                    <FiBook className="detail-icon" />
                    <div>
                      <h4>Titre</h4>
                      <p>{extractStringValue(request.titre, ["titre", "nom"]) || "Non spécifié"}</p>
                    </div>
                  </div>
                  <div className="detail-group">
                    <FiBook className="detail-icon" />
                    <div>
                      <h4>Type de formation</h4>
                      <p>{getFormationTypeDisplay(request)}</p>
                    </div>
                  </div>
                  <div className="detail-group">
                    <FiBook className="detail-icon" />
                    <div>
                      <h4>Thème</h4>
                      <p>{extractStringValue(request.theme, ["theme", "nom"]) || "Non spécifié"}</p>
                    </div>
                  </div>
                  <div className="detail-group">
                    <FiCalendar className="detail-icon" />
                    <div>
                      <h4>Date de début</h4>
                      <p>{formatDate(request.dateDebut)}</p>
                    </div>
                  </div>
                  <div className="detail-group">
                    <FiClock className="detail-icon" />
                    <div>
                      <h4>Nombre de jours</h4>
                      <p>{request.nbrJours || request.duration}</p>
                    </div>
                  </div>
                </>
              )}

              {request.type === "PreAvance" && (
                <>
                  <div className="detail-group">
                    <FiBriefcase className="detail-icon" />
                    <div>
                      <h4>Type</h4>
                      <p>{request.type || "Non spécifié"}</p>
                    </div>
                  </div>
                  <div className="detail-group">
                    <FiDollarSign className="detail-icon" />
                    <div>
                      <h4>Montant</h4>
                      <p>{request.montant} DH</p>
                    </div>
                  </div>
                </>
              )}

              {request.type === "Autorisation" && (
                <>
                  <div className="detail-group">
                    <FiCalendar className="detail-icon" />
                    <div>
                      <h4>Date</h4>
                      <p>{formatDate(request.dateDebut)}</p>
                    </div>
                  </div>
                  <div className="time-details">
                    <div className="detail-group">
                      <FiClock className="detail-icon" />
                      <div>
                        <h4>Heure de sortie</h4>
                        <p>{formatTime(request.horaireSortie, request.minuteSortie)}</p>
                      </div>
                    </div>
                    <div className="detail-group">
                      <FiClock className="detail-icon" />
                      <div>
                        <h4>Heure de retour</h4>
                        <p>{formatTime(request.horaireRetour, request.minuteRetour)}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {request.type === "Conge" && (
                <>
                  <div className="detail-group">
                    <FiCalendar className="detail-icon" />
                    <div>
                      <h4>Date de début</h4>
                      <p>{formatDate(request.dateDebut)}</p>
                    </div>
                  </div>
                  <div className="detail-group">
                    <FiCalendar className="detail-icon" />
                    <div>
                      <h4>Date de fin</h4>
                      <p>{formatDate(request.dateFin)}</p>
                    </div>
                  </div>
                  <div className="detail-group">
                    <FiClock className="detail-icon" />
                    <div>
                      <h4>Nombre de jours</h4>
                      <p>{request.nbrJours}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Description */}
              <div className="detail-group full-width">
                <FiFileText className="detail-icon" />
                <div>
                  <h4>Description</h4>
                  <p className="description-text">
                    {request.texteDemande || request.description || "Aucune description fournie"}
                  </p>
                </div>
              </div>

              {/* Files */}

            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-footer">
          {isPending ? (
            isEditing ? (
              <>
                <button className="btn-secondary" onClick={() => setIsEditing(false)}>
                  Annuler
                </button>
                <button className="btn-primary" onClick={handleSave} disabled={fileUploading}>
                  Enregistrer
                </button>
              </>
            ) : (
              <>
                <button className="btn-danger" onClick={() => onDelete(request.id, request.type)}>
                  <FiTrash2 /> Supprimer
                </button>
                <button className="btn-primary" onClick={() => setIsEditing(true)}>
                  <FiEdit /> Modifier
                </button>
              </>
            )
          ) : (
            <button className="btn-secondary" onClick={onClose}>
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default DemandeModal
