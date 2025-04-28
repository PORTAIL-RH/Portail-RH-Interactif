import React from "react";
import { FiX, FiCheck, FiFileText, FiDownload } from "react-icons/fi";

const DemandeDetailsModal = ({ demande, onClose, onDownload }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Request Details</h2>
          <button className="close-button" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-content">
          <div className="detail-row">
            <span className="detail-label">Employee:</span>
            <span className="detail-value">
              {demande.matPers?.nom || "Unknown"} {demande.matPers?.prenom || ""}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Request Date:</span>
            <span className="detail-value">
              {demande.dateDemande ? new Date(demande.dateDemande).toLocaleDateString() : "N/A"}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className={`status-badge ${
              demande.reponseRH === "I" ? "pending" :
              demande.reponseRH === "T" ? "processed" : "rejected"
            }`}>
              {demande.reponseRH === "I" ? "Pending" :
               demande.reponseRH === "T" ? "Processed" : "Rejected"}
            </span>
          </div>

          <div className="detail-row full-width">
            <span className="detail-label">Request Text:</span>
            <div className="detail-value text-content">
              {demande.texteDemande || <span className="no-content">No content</span>}
            </div>
          </div>

          {demande.observation && (
            <div className="detail-row full-width">
              <span className="detail-label">Observation:</span>
              <div className="detail-value text-content">
                {demande.observation}
              </div>
            </div>
          )}

          {demande.filesReponse && demande.filesReponse.length > 0 && (
            <div className="detail-row full-width">
              <span className="detail-label">Response Documents:</span>
              <div className="response-files">
                {demande.filesReponse.map((file, index) => (
                  <div key={index} className="response-file-item">
                    <FiFileText className="file-icon" />
                    <span className="file-name">{file.filename}</span>
                    <button 
                      onClick={() => onDownload(file.filename)}
                      className="download-button"
                    >
                      <FiDownload /> Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemandeDetailsModal;