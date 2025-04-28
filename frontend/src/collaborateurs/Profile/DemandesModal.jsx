"use client"
import { useState, useEffect } from "react"
import {
  FiEdit, FiX, FiTrash2, FiDownload, FiCalendar, 
  FiFileText, FiAlertCircle, FiCheckCircle, FiClock, 
  FiUpload, FiInfo, FiDollarSign, FiBook, FiBriefcase
} from "react-icons/fi"
import { API_URL } from "../../config";

const DemandeModal = ({ isOpen, onClose, request, onSave, onDelete, token, API_URL }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedRequest, setEditedRequest] = useState({})
  const [fileUploading, setFileUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    if (request) {
      setEditedRequest({ ...request })
      setFormErrors({})
    }
  }, [request])

  const isPending = request?.status?.toLowerCase().includes("attente") || 
                   request?.status?.toLowerCase().includes("instantanée")

  const handleChange = (e) => {
    const { name, value } = e.target
    setEditedRequest(prev => ({ 
      ...prev, 
      [name]: value,
      reponseChef: 'I',
      reponseRH: 'I'
    }))
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleTimeChange = (field, value) => {
    setEditedRequest(prev => ({ 
      ...prev, 
      [field]: value,
      reponseChef: 'I',
      reponseRH: 'I'
    }))
  }

  const handleFileUpload = async (e) => {
    const files = e.target.files
    if (!files.length) return

    setFileUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append("file", files[0])

      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })

      if (!response.ok) throw new Error("Échec du téléversement")

      const uploadedFile = await response.json()
      setEditedRequest(prev => ({
        ...prev,
        files: [uploadedFile],
        reponseChef: 'I',
        reponseRH: 'I'
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
    
    if (request.type === "Document" && !editedRequest.typeDocument) {
      errors.typeDocument = "Type de document requis"
    }
    
    if (request.type === "PreAvance" && !editedRequest.type) {
      errors.type = "Type de pré-avance requis"
    }
    
    if (request.type === "PreAvance" && !editedRequest.montant) {
      errors.montant = "Montant requis"
    }
    
    if (request.type === "Formation" && !editedRequest.dateDebut) {
      errors.dateDebut = "Date de début requise"
    }
    
    if (request.type === "Formation" && !editedRequest.nbrJours) {
      errors.nbrJours = "Nombre de jours requis"
    }
    
    if (request.type === "Autorisation" && !editedRequest.dateDebut) {
      errors.dateDebut = "Date requise"
    }
    
    if (request.type === "Autorisation" && (!editedRequest.horaireSortie || !editedRequest.minuteSortie)) {
      errors.heureSortie = "Heure de sortie requise"
    }
    
    if (request.type === "Autorisation" && (!editedRequest.horaireRetour || !editedRequest.minuteRetour)) {
      errors.heureRetour = "Heure de retour requise"
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = () => {
    if (!validateForm()) return
    
    // Prepare the payload based on request type
    let payload = { ...editedRequest };
    
    // Remove unnecessary fields for each type
    if (request.type === "Document") {
      payload = {
        id: editedRequest.id,
        typeDocument: editedRequest.typeDocument,
        texteDemande: editedRequest.texteDemande,
        files: editedRequest.files
      };
    } else if (request.type === "Formation") {
      payload = {
        id: editedRequest.id,
        dateDebut: editedRequest.dateDebut,
        texteDemande: editedRequest.texteDemande,
        nbrJours: editedRequest.nbrJours,
        files: editedRequest.files
      };
    } else if (request.type === "PreAvance") {
      payload = {
        id: editedRequest.id,
        type: editedRequest.type,
        montant: editedRequest.montant,
        description: editedRequest.description,
        files: editedRequest.files
      };
    } else if (request.type === "Autorisation") {
      payload = {
        id: editedRequest.id,
        dateDebut: editedRequest.dateDebut,
        texteDemande: editedRequest.texteDemande,
        heureSortie: `${editedRequest.horaireSortie}:${editedRequest.minuteSortie}`,
        heureRetour: `${editedRequest.horaireRetour}:${editedRequest.minuteRetour}`,
        files: editedRequest.files
      };
    }
    
    onSave(payload);
    setIsEditing(false);
  }

  const statusConfig = {
    approved: { class: "approved", icon: <FiCheckCircle /> },
    rejected: { class: "rejected", icon: <FiAlertCircle /> },
    pending: { class: "pending", icon: <FiClock /> }
  }

  const getStatusDetails = (status) => {
    const lowerStatus = status?.toLowerCase() || ""
    if (lowerStatus.includes("approuv")) return statusConfig.approved
    if (lowerStatus.includes("rejet")) return statusConfig.rejected
    return statusConfig.pending
  }

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("fr-FR")
    } catch {
      return dateString
    }
  }

  const formatTime = (hours, minutes) => {
    return `${hours?.toString().padStart(2, '0') || '00'}:${minutes?.toString().padStart(2, '0') || '00'}`
  }

  if (!isOpen || !request) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>
            {request.type} - {formatDate(request.dateDemande || request.date)}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {/* Status Display */}
          <div className="status-display">
            <div className={`status-badge ${getStatusDetails(request.status).class}`}>
              {getStatusDetails(request.status).icon}
              {request.status}
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
              
              {/* Common Fields */}
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name={request.type === "Document" ? "texteDemande" : "description"}
                  value={request.type === "Document" ? 
                    (editedRequest.texteDemande || "") : 
                    (editedRequest.description || "")}
                  onChange={handleChange}
                  disabled={!isPending}
                  placeholder="Décrivez votre demande..."
                />
                {formErrors.description && (
                  <span className="form-error">{formErrors.description}</span>
                )}
              </div>

              {/* Document Specific Fields */}
              {request.type === "Document" && (
                <div className="form-group">
                  <label>Type de document</label>
                  <select
                    name="typeDocument"
                    value={editedRequest.typeDocument || ""}
                    onChange={handleChange}
                    disabled={!isPending}
                  >
                    <option value="">Sélectionner un type</option>
                    <option value="Certificat de travail">Certificat de travail</option>
                    <option value="Bulletin de paie">Bulletin de paie</option>
                    <option value="Attestation RH">Attestation RH</option>
                  </select>
                  {formErrors.typeDocument && (
                    <span className="form-error">{formErrors.typeDocument}</span>
                  )}
                </div>
              )}

              {/* Formation Specific Fields */}
              {request.type === "Formation" && (
                <>
                  <div className="form-group">
                    <label>Date de début</label>
                    <input
                      type="date"
                      name="dateDebut"
                      value={editedRequest.dateDebut ? 
                        new Date(editedRequest.dateDebut).toISOString().split('T')[0] : ""}
                      onChange={handleChange}
                      disabled={!isPending}
                    />
                    {formErrors.dateDebut && (
                      <span className="form-error">{formErrors.dateDebut}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Nombre de jours</label>
                    <input
                      type="number"
                      name="nbrJours"
                      value={editedRequest.nbrJours || ""}
                      onChange={handleChange}
                      disabled={!isPending}
                    />
                    {formErrors.nbrJours && (
                      <span className="form-error">{formErrors.nbrJours}</span>
                    )}
                  </div>
                </>
              )}

              {/* PreAvance Specific Fields */}
              {request.type === "PreAvance" && (
                <>
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      name="type"
                      value={editedRequest.type || ""}
                      onChange={handleChange}
                      disabled={!isPending}
                    >
                      <option value="">Sélectionner un type</option>
                      {Object.keys(DemandePreAvance?.getTypesPreAvance?.() || {}).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {formErrors.type && (
                      <span className="form-error">{formErrors.type}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Montant</label>
                    <input
                      type="number"
                      name="montant"
                      value={editedRequest.montant || ""}
                      onChange={handleChange}
                      disabled={!isPending}
                    />
                    {formErrors.montant && (
                      <span className="form-error">{formErrors.montant}</span>
                    )}
                  </div>
                </>
              )}

              {/* Autorisation Specific Fields */}
              {request.type === "Autorisation" && (
                <>
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      name="dateDebut"
                      value={editedRequest.dateDebut ? 
                        new Date(editedRequest.dateDebut).toISOString().split('T')[0] : ""}
                      onChange={handleChange}
                      disabled={!isPending}
                    />
                    {formErrors.dateDebut && (
                      <span className="form-error">{formErrors.dateDebut}</span>
                    )}
                  </div>
                  <div className="time-fields">
                    <div className="form-group">
                      <label>Heure de sortie</label>
                      <input
                        type="time"
                        value={formatTime(editedRequest.horaireSortie, editedRequest.minuteSortie)}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':')
                          handleTimeChange('horaireSortie', parseInt(hours))
                          handleTimeChange('minuteSortie', parseInt(minutes))
                        }}
                        disabled={!isPending}
                      />
                      {formErrors.heureSortie && (
                        <span className="form-error">{formErrors.heureSortie}</span>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Heure de retour</label>
                      <input
                        type="time"
                        value={formatTime(editedRequest.horaireRetour, editedRequest.minuteRetour)}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':')
                          handleTimeChange('horaireRetour', parseInt(hours))
                          handleTimeChange('minuteRetour', parseInt(minutes))
                        }}
                        disabled={!isPending}
                      />
                      {formErrors.heureRetour && (
                        <span className="form-error">{formErrors.heureRetour}</span>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* File Management */}
              <div className="form-group">
                <label>Fichiers joints</label>
                <div className="file-upload-section">
                  <label className={`file-upload-label ${!isPending ? 'disabled' : ''}`}>
                    <FiUpload />
                    {editedRequest.files?.length ? "Remplacer le fichier" : "Ajouter un fichier"}
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      disabled={!isPending || fileUploading}
                    />
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

              {/* Document Specific */}
              {request.type === "Document" && (
                <div className="detail-group">
                  <FiFileText className="detail-icon" />
                  <div>
                    <h4>Type de document</h4>
                    <p>{request.typeDocument || "Non spécifié"}</p>
                  </div>
                </div>
              )}

              {/* Formation Specific */}
              {request.type === "Formation" && (
                <>
                  <div className="detail-group">
                    <FiBook className="detail-icon" />
                    <div>
                      <h4>Titre</h4>
                      <p>{request.titre?.nom || "Non spécifié"}</p>
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
                      <p>{request.nbrJours}</p>
                    </div>
                  </div>
                </>
              )}

              {/* PreAvance Specific */}
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

              {/* Autorisation Specific */}
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
              {request.files?.length > 0 && (
                <div className="detail-group">
                  <FiDownload className="detail-icon" />
                  <div>
                    <h4>Fichiers joints</h4>
                    <div className="file-list">
                      {request.files.map((file, index) => (
                        <a
                          key={index}
                          href={`${API_URL}/files/${file.id || file}`}
                          download
                          className="file-download"
                        >
                          <FiDownload />
                          {file.name || `Fichier ${index + 1}`}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-footer">
          {isPending && (
            <>
              {isEditing ? (
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
              )}
            </>
          )}

          {!isPending && (
            <button className="btn-secondary" onClick={onClose}>
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const DemandePreAvance = {
  getTypesPreAvance: () => ({
    MEDICAL: 2000,
    SCOLARITE: 1500,
    VOYAGE: 1000,
    INFORMATIQUE: 800,
    DEMENAGEMENT: 3000,
    MARIAGE: 5000,
    FUNERAILLES: 2000
  })
}

export default DemandeModal