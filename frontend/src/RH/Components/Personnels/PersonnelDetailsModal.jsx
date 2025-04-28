"use client"
import "./PersonnelsModal.css"

const PersonnelDetailsModal = ({ personnel, onClose, theme }) => {
  if (!personnel) return null

  return (
    <div className={`modal-overlay ${theme}`}>
      <div className={`modal-container personnel-details-modal ${theme}`}>
        <div className="modal-header">
          <h3>Personnel Details</h3>
          <button className="close-button" onClick={onClose} aria-label="Close">
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
            <h4>Basic Information</h4>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Matricule:</span>
                <span className="detail-value">{personnel.matricule || "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Name:</span>
                <span className="detail-value">
                  {personnel.nom || ""} {personnel.prenom || ""}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{personnel.email || "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{personnel.telephone || "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">CIN:</span>
                <span className="detail-value">{personnel.cin || "N/A"}</span>
              </div>
            </div>
          </div>

          <div className="details-section">
            <h4>Professional Information</h4>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Role:</span>
                <span className="detail-value">{personnel.role || "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className={`detail-value status-badge ${personnel.active ? "active" : "inactive"}`}>
                  {personnel.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Service:</span>
                <span className="detail-value">{personnel.serviceName || "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Hire Date:</span>
                <span className="detail-value">{personnel.date_embauche || "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Company Code:</span>
                <span className="detail-value">{personnel.code_soc || "N/A"}</span>
              </div>
            </div>
          </div>

          <div className="details-section">
            <h4>Personal Information</h4>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Gender:</span>
                <span className="detail-value">{personnel.sexe || "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Marital Status:</span>
                <span className="detail-value">{personnel.situation || "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Birth Date:</span>
                <span className="detail-value">{personnel.date_naiss || "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Children:</span>
                <span className="detail-value">{personnel.nbr_enfants || "0"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="close-modal-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default PersonnelDetailsModal

