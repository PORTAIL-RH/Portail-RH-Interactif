import "./PersonnelsDetailModal.css"
import React, { useState } from "react"

const PersonnelDetailsModal = ({ personnel, onClose, theme }) => {
  const [copiedEmail, setCopiedEmail] = useState(null)

  if (!personnel) return null

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email)
    setCopiedEmail(email)
    setTimeout(() => setCopiedEmail(null), 2000)
  }

  const handleEmailAllChefs = () => {
    if (personnel.chefsHierarchiques && personnel.chefsHierarchiques.length > 0) {
      const emails = personnel.chefsHierarchiques.map(chef => chef.email).join(';')
      window.location.href = `mailto:${emails}`
    }
  }

  return (
    <div className={`modal-overlay ${theme}`}>
      <div className={`modal-container personnel-details-modal ${theme}`}>
        <div className="modal-header">
          <h3>Détails du Personnel</h3>
          <button className="close-button" onClick={onClose} aria-label="Fermer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="personnel-details-content">
          <div className="details-section">
            <h4>Informations de Base</h4>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Matricule :</span>
                <span className="detail-value">{personnel.matricule || "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Nom :</span>
                <span className="detail-value">
                  {personnel.nom || ""} {personnel.prenom || ""}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email :</span>
                <span className="detail-value">
                  {personnel.email ? (
                    <a href={`mailto:${personnel.email}`} className="email-link">
                      {personnel.email}
                    </a>
                  ) : "N/A"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Téléphone :</span>
                <span className="detail-value">
                  {personnel.telephone ? (
                    <a href={`tel:${personnel.telephone}`} className="phone-link">
                      {personnel.telephone}
                    </a>
                  ) : "N/A"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">CIN :</span>
                <span className="detail-value">{personnel.CIN || "N/A"}</span>
              </div>
            </div>
          </div>

          <div className="details-section">
            <h4>Informations Professionnelles</h4>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Rôle :</span>
                <span className="detail-value">{personnel.role || "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Statut :</span>
                <span className={`detail-value status-badge ${personnel.active ? "active" : "inactive"}`}>
                  {personnel.active ? "Actif" : "Inactif"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Service :</span>
                <span className="detail-value">{personnel.serviceName || "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date d'embauche :</span>
                <span className="detail-value">{personnel.date_embauche || "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Code société :</span>
                <span className="detail-value">{personnel.code_soc || "N/A"}</span>
              </div>
              <div className="detail-item chefs-section">
                <span className="detail-label">Chefs hiérarchiques :</span>
                <span className="detail-value">
                  {personnel.chefsHierarchiques && personnel.chefsHierarchiques.length > 0 ? (
                    <div className="chefs-container">
                      {personnel.chefsHierarchiques.map((chef, index) => (
                        <div key={index} className="chef-card">
                          <div className="chef-info">
                            <div className="chef-name">{chef.nomComplet}</div>
                            <div className="chef-details">
                              <span className="chef-matricule">{chef.matricule}</span>
                              <span className="chef-weight">Poids : {chef.poid}</span>
                            </div>
                          </div>
                          <div className="chef-actions">
                            <button 
                              className="action-button email-button" 
                              onClick={() => window.location.href = `mailto:${chef.email}`}
                              title="Envoyer un email à ce chef"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                              </svg>
                            </button>
                            <button 
                              className="action-button copy-button" 
                              onClick={() => handleCopyEmail(chef.email)}
                              title="Copier l'email"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </svg>
                              {copiedEmail === chef.email && <span className="copy-tooltip">Copié!</span>}
                            </button>
                          </div>
                        </div>
                      ))}
                      <button 
                        className="email-all-button" 
                        onClick={handleEmailAllChefs}
                        disabled={!personnel.chefsHierarchiques || personnel.chefsHierarchiques.length === 0}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        Email tous les chefs
                      </button>
                    </div>
                  ) : (
                    <span className="no-chiefs">Aucun chef hiérarchique assigné</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="details-section">
            <h4>Informations Personnelles</h4>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Genre :</span>
                <span className="detail-value">{personnel.sexe || "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Situation familiale :</span>
                <span className="detail-value">{personnel.situation || "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date de naissance :</span>
                <span className="detail-value">{personnel.date_naiss || "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Enfants :</span>
                <span className="detail-value">{personnel.nbr_enfants || "0"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="close-modal-button" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

export default PersonnelDetailsModal