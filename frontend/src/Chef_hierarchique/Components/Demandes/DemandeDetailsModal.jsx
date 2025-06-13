import { FiX, FiCheck, FiClock, FiFileText, FiEye } from "react-icons/fi"
import "./DemandeDetailsModal.css"
import { useState } from "react"
import { API_URL } from "../../../config";

const DemandeDetailsModal = ({ demande, onClose, onApprove, onReject, isActionable }) => {
  const [previewFileUrl, setPreviewFileUrl] = useState(null)
  const [previewFileId, setPreviewFileId] = useState(null)

  const [actionMode, setActionMode] = useState(null) // 'approve' or 'reject'
  const [observation, setObservation] = useState("")

  if (!demande) return null

  const formatDate = (dateString) => {
    if (!dateString) return "Non spécifiée"
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
    })
  }

  const getStatusText = (status) => {
    switch (status) {
      case "I": return "En attente"
      case "O": return "Approuvée"
      case "N": return "Refusée"
      default: return "Statut inconnu"
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case "I": return "pending"
      case "O": return "approved"
      case "N": return "rejected"
      default: return ""
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "I": return <FiClock />
      case "O": return <FiCheck />
      case "N": return <FiX />
      default: return <FiFileText />
    }
  }

  const fetchFileBlobUrl = async (fileId) => {
    const token = localStorage.getItem("authToken")
    const response = await fetch(`${API_URL}/api/files/download/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) throw new Error("Erreur HTTP: " + response.status)
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  }

  const handlePreview = async (fileId) => {
    if (previewFileId === fileId) {
      setPreviewFileId(null)
      setPreviewFileUrl(null)
      return
    }
    try {
      const url = await fetchFileBlobUrl(fileId)
      setPreviewFileId(fileId)
      setPreviewFileUrl(url)
    } catch (err) {
      console.error("Erreur d'aperçu:", err)
      alert("Impossible d'afficher la pièce jointe.")
    }
  }

  const handleDownload = async (fileId, filename = "piece_jointe.pdf") => {
    try {
      const url = await fetchFileBlobUrl(fileId)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Erreur de téléchargement:", err)
      alert("Échec du téléchargement.")
    }
  }

  const confirmAction = () => {
    if (actionMode === "approve") {
      onApprove(observation)
    } else if (actionMode === "reject") {
      onReject(observation)
    }
    setObservation("")
    setActionMode(null)
  }

  const cancelAction = () => {
    setObservation("")
    setActionMode(null)
  }

  const renderChefResponse = (responseCode, observation) => {
    let statusText = "";
    let statusClass = "";
    
    switch (responseCode) {
      case "O":
        statusText = "Approuvée";
        statusClass = "approved";
        break;
      case "N":
        statusText = "Rejetée";
        statusClass = "rejected";
        break;
      case "I":
        statusText = "En attente";
        statusClass = "pending";
        break;
      default:
        statusText = "Non spécifié";
        statusClass = "";
    }
    
    return (
      <div className={`chef-response ${statusClass}`}>
        <span className="response-status">{statusText}</span>
        {observation && <span className="response-observation">{observation}</span>}
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Détails de la demande</h2>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>
        
<div className="chefs-responses-section">
  <h3 className="section-title">Réponses des chefs</h3>
  <div className="chefs-responses-grid">
  
    <div className="chef-response-group">
      <div className="chef-label">Chef 1</div>
      <div className="chef-value">
        {demande.reponseChef?.responseChef1 
          ? renderChefResponse(
              demande.reponseChef.responseChef1,
              "Observation: " + demande.reponseChef.observationChef1
            )
          : <span className="empty">Non spécifié</span>}
      </div>
    </div>

    <div className="chef-response-group">
      <div className="chef-label">Chef 2</div>
      <div className="chef-value">
        {demande.reponseChef?.responseChef2 
          ? renderChefResponse(
              demande.reponseChef.responseChef2,
              "Observation: " + demande.reponseChef.observationChef2
            )
          : <span className="empty">Non spécifié</span>}
      </div>
    </div>

    <div className="chef-response-group">
      <div className="chef-label">Chef 3</div>
      <div className="chef-value">
        {demande.reponseChef?.responseChef3 
          ? renderChefResponse(
              demande.reponseChef.responseChef3,
              "Observation: " + demande.reponseChef.observationChef3
            )
          : <span className="empty">Non spécifié</span>}
      </div>
    </div>

  </div>
</div>


        <div className="modal-body">
          <div className="demande-details-grid">
            <div className="detail-group">
              <div className="detail-label">Collaborateur</div>
              <div className="detail-value">
                {demande.matPers?.nom ? `${demande.matPers.nom} ${demande.matPers.prenom || ""}` : "Non spécifié"}
              </div>
            </div>
            <div className="detail-group">
              <div className="detail-label">Date de demande</div>
              <div className="detail-value">{formatDate(demande.dateDemande)}</div>
            </div>
            <div className="detail-group">
              <div className="detail-label">Date de début</div>
              <div className="detail-value">
                {demande.dateDebut ? formatDate(demande.dateDebut) : <span className="empty">Non spécifiée</span>}
              </div>
            </div>
            <div className="detail-group">
              <div className="detail-label">Date de fin</div>
              <div className="detail-value">
                {demande.dateFin ? formatDate(demande.dateFin) : <span className="empty">Non spécifiée</span>}
              </div>
            </div>
          </div>

          <div className="detail-group">
            <div className="detail-label">Pièces jointes</div>
            {demande.files && demande.files.length > 0 ? (
              <ul className="attachment-list">
                {demande.files.map((file, index) => (
                  <li key={file.fileId} className="attachment-item">
                    <div className="file-info">
                      <span className="file-name">{file.filename || `Fichier ${index + 1}`}</span>
                      {file.size && <span className="file-size">({(file.size / 1024).toFixed(1)} Ko)</span>}
                    </div>
                    <div className="file-actions">
                      <button
                        className="attachment-preview-btn"
                        onClick={() => handlePreview(file.fileId)}
                      >
                        <FiEye /> {previewFileId === file.fileId ? "Fermer" : "Aperçu"}
                      </button>
                      <button
                        className="attachment-download-btn"
                        onClick={() => handleDownload(file.fileId, file.filename)}
                      >
                        📥 Télécharger
                      </button>
                    </div>
                    {previewFileId === file.fileId && previewFileUrl && (
                      <div className="file-preview-inline">
                        <iframe
                          src={previewFileUrl}
                          title="Aperçu"
                          style={{ width: "100%", height: "400px", marginTop: "10px", border: "1px solid #ccc" }}
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="empty">Aucune pièce jointe</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DemandeDetailsModal
