import React from "react"
import { X, Calendar, User, FileText, Clock, CheckCircle, AlertCircle, MapPin, Info, MessageSquare, ChevronRight } from 'lucide-react'
import "./DemandeDetailsModal.css"

const DemandeDetailsModal = ({ demande, onClose, onApprove, onReject, isActionable }) => {
  // Format date to local string
  const formatDate = (dateString) => {
    if (!dateString) return "Non spécifiée"
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Get status text and icon
  const getStatusInfo = () => {
    switch (demande.reponseChef) {
      case "I":
        return { text: "En attente", icon: <Clock size={20} />, className: "pending" }
      case "O":
        return { text: "Approuvée", icon: <CheckCircle size={20} />, className: "approved" }
      case "N":
        return { text: "Refusée", icon: <X size={20} />, className: "rejected" }
      default:
        return { text: "Traitée", icon: <CheckCircle size={20} />, className: "processed" }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="demande-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" data-status={statusInfo.className}>
          <div className="status-badge">
            <span className="status-icon">{statusInfo.icon}</span>
            <span className="status-text">{statusInfo.text}</span>
          </div>
          <h2>Détails de la Demande</h2>
          <button className="close-button" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          <div className="demande-info-section">
            <div className="section-header">
              <User size={18} />
              <h3>Informations du Collaborateur</h3>
            </div>
            <div className="info-card">
              <div className="employee-avatar">
                {demande.matPers?.nom?.charAt(0) || "?"}
              </div>
              <div className="employee-details">
                <div className="employee-name">
                  {demande.matPers?.nom || "Inconnu"} {demande.matPers?.prenom || ""}
                </div>
                {demande.matPers?.email && (
                  <div className="employee-email">{demande.matPers.email}</div>
                )}
                <div className="employee-meta">
                  {demande.matPers?.matricule && (
                    <div className="employee-matricule">
                      <span className="meta-label">Matricule:</span>
                      <span className="meta-value">{demande.matPers.matricule}</span>
                    </div>
                  )}
                  {demande.matPers?.serviceName && (
                    <div className="employee-service">
                      <span className="meta-label">Service:</span>
                      <span className="meta-value">{demande.matPers.serviceName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="demande-info-section">
            <div className="section-header">
              <Calendar size={18} />
              <h3>Détails de la Demande</h3>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">
                  <Calendar size={16} className="info-icon" />
                  <span>Date de la Demande</span>
                </div>
                <div className="info-value">{formatDate(demande.dateDemande)}</div>
              </div>

              <div className="info-item">
                <div className="info-label">
                  <MapPin size={16} className="info-icon" />
                  <span>Période de Formation</span>
                </div>
                <div className="info-value date-range">
                  <div className="date-item">
                    <span className="date-label">Début:</span>
                    <span className="date-value">{formatDate(demande.dateDebut)}</span>
                  </div>
                  <div className="date-item">
                    <span className="date-label">Fin:</span>
                    <span className="date-value">{formatDate(demande.dateFin)}</span>
                  </div>
                  {demande.dateDebut && demande.dateFin && (
                    <div className="date-duration">
                      <span className="duration-value">
                        {Math.ceil((new Date(demande.dateFin).getTime() - new Date(demande.dateDebut).getTime()) / (1000 * 60 * 60 * 24) + 1)} jours
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="demande-info-section">
            <div className="section-header">
              <MessageSquare size={18} />
              <h3>Description de la Demande</h3>
            </div>
            <div className="demande-textt">
              {demande.texteDemande || <span className="no-content">Aucun texte fourni</span>}
            </div>
          </div>

          {demande.reponseChef !== "I" && demande.texteReponse && (
            <div className="demande-info-section">
              <div className="section-header">
                <Info size={18} />
                <h3>Réponse</h3>
              </div>
              <div className="response-text">
                {demande.texteReponse}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            <X size={16} />
            <span>Fermer</span>
          </button>
          
          {isActionable && (
            <div className="action-buttons">
              <button className="btn btn-danger" onClick={onReject}>
                <X size={16} />
                <span>Rejeter</span>
              </button>
              <button className="btn btn-success" onClick={onApprove}>
                <CheckCircle size={16} />
                <span>Approuver</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DemandeDetailsModal
