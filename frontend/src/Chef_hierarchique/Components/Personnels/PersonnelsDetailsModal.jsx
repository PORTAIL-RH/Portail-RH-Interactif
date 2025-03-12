import React from "react";
import { X, Calendar, User, FileText, Clock, CheckCircle, AlertCircle, MapPin, Info, MessageSquare, ChevronRight } from 'lucide-react';
import "./PersonnelsDetailModal.css";

const PersonnelDetailsModal = ({ personnel, onClose, onApprove, onReject, isActionable }) => {
  // Format date to local string
  const formatDate = (dateString) => {
    if (!dateString) return "Non spécifiée";
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Get status text and icon
  const getStatusInfo = () => {
    if (!personnel.active) {
      return { text: "Inactive", icon: <X size={20} />, className: "rejected" };
    }
    return { text: "Active", icon: <CheckCircle size={20} />, className: "approved" };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="demande-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" data-status={statusInfo.className}>
          <div className="status-badge">
            <span className="status-icon">{statusInfo.icon}</span>
            <span className="status-text">{statusInfo.text}</span>
          </div>
          <h2>Détails du personnel {personnel.nom}</h2>
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
                {personnel.nom?.charAt(0) || "?"}
              </div>
              <div className="employee-details">
                <div className="employee-name">
                  {personnel.nom || "Inconnu"} {personnel.prenom || ""}
                </div>
                {personnel.email && (
                  <div className="employee-email">{personnel.email}</div>
                )}
                <div className="employee-meta">
                  {personnel.matricule && (
                    <div className="employee-matricule">
                      <span className="meta-label">Matricule:</span>
                      <span className="meta-value">{personnel.matricule}</span>
                    </div>
                  )}
                  {personnel.serviceName && (
                    <div className="employee-service">
                      <span className="meta-label">Service:</span>
                      <span className="meta-value">{personnel.serviceName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="demande-info-section">
            <div className="section-header">
              <Calendar size={18} />
              <h3>Détails supplémentaires</h3>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">
                  <Calendar size={16} className="info-icon" />
                  <span>Date d'embauche</span>
                </div>
                <div className="info-value">{formatDate(personnel.date_embauche)}</div>
              </div>

              <div className="info-item">
                <div className="info-label">
                  <User size={16} className="info-icon" />
                  <span>Rôle</span>
                </div>
                <div className="info-value">{personnel.role}</div>
              </div>
            </div>
          </div>

          {personnel.telephone && (
            <div className="demande-info-section">
              <div className="section-header">
                <Info size={18} />
                <h3>Contact</h3>
              </div>
              <div className="info-item">
                <div className="info-label">
                  <MapPin size={16} className="info-icon" />
                  <span>Téléphone</span>
                </div>
                <div className="info-value">{personnel.telephone}</div>
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
  );
};

export default PersonnelDetailsModal;