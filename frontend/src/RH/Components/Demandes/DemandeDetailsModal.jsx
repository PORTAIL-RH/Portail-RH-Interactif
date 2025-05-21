import React from "react";
import { FiX, FiCheck, FiFileText, FiDownload, FiEye } from "react-icons/fi";
import "./DemandeDetailsModal.css";

const DemandeDetailsModal = ({ demande, onClose, onDownload, onPreview }) => {
  const getStatusClass = (status) => {
    switch (status) {
      case "I":
        return { class: "pending", text: "Pending" };
      case "T":
        return { class: "approved", text: "Approved" };
      case "R":
        return { class: "rejected", text: "Rejected" };
      default:
        return { class: "", text: "Unknown" };
    }
  };

  const statusInfo = getStatusClass(demande.reponseRH);

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">Details De La Demande</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          <div className="demande-details-grid">
            <div className="detail-group">
              <span className="detail-label">Employee</span>
              <span className="detail-value">
                {demande.matPers?.nom || "Unknown"} {demande.matPers?.prenom || ""}
              </span>
            </div>

            <div className="detail-group">
              <span className="detail-label">Matricule De L'Employee </span>
              <span className="detail-value">
                {demande.matPers?.matPers || "N/A"}
              </span>
            </div>

            <div className="detail-group">
              <span className="detail-label">Date De La Demande</span>
              <span className="detail-value">
                {demande.dateDemande ? new Date(demande.dateDemande).toLocaleDateString() : "N/A"}
              </span>
            </div>

            <div className="detail-group">
              <span className="detail-label">Status</span>
              <div className="status-text">
                <span className={`status-badge ${statusInfo.class}`}>
                  {statusInfo.text}
                </span>
              </div>
            </div>
          </div>

          <div className="detail-group">
            <span className="detail-label">Text De La Demande</span>
            <div className="detail-value">
              {demande.texteDemande || <span className="empty"></span>}
            </div>
          </div>

          {demande.observation && (
            <div className="detail-group">
              <span className="detail-label">Observation</span>
              <div className="detail-value">
                {demande.observation}
              </div>
            </div>
          )}

          {demande.files && demande.files.length > 0 && (
            <div className="detail-group">
              <span className="detail-label">Response Documents</span>
              <ul className="attachment-list">
                {demande.files.map((file, index) => (
                  <li key={index} className="attachment-item">
                    <div className="file-info">
                      <FiFileText className="file-icon" size={18} />
                      <span className="file-name">{file.filename}</span>
                      <span className="file-size">{file.size ? formatFileSize(file.size) : ""}</span>
                    </div>
                    <div className="file-actions">
                      <button 
                        className="attachment-preview-btn"
                        onClick={() => onPreview(file)}
                      >
                        <FiEye size={14} />
                        Preview
                      </button>
                      <button 
                        className="attachment-download-btn"
                        onClick={() => onDownload(file)}
                      >
                        <FiDownload size={14} />
                        Download
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )} 
          {demande.filesReponse && demande.filesReponse.length > 0 && (
            <div className="detail-group">
              <span className="detail-label">Response Documents</span>
              <ul className="attachment-list">
                {demande.filesReponse.map((file, index) => (
                  <li key={index} className="attachment-item">
                    <div className="file-info">
                      <FiFileText className="file-icon" size={18} />
                      <span className="file-name">{file.filename}</span>
                      <span className="file-size">{file.size ? formatFileSize(file.size) : ""}</span>
                    </div>
                    <div className="file-actions">
                      <button 
                        className="attachment-preview-btn"
                        onClick={() => onPreview(file)}
                      >
                        <FiEye size={14} />
                        Preview
                      </button>
                      <button 
                        className="attachment-download-btn"
                        onClick={() => onDownload(file)}
                      >
                        <FiDownload size={14} />
                        Download
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn modal-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default DemandeDetailsModal;