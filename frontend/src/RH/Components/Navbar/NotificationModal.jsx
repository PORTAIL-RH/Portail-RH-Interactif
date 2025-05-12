"use client"
import { format } from "date-fns"
import { useNavigate } from "react-router-dom"
import "./NotificationModal.css"
import { FiBell, FiCheckCircle } from "react-icons/fi"

const NotificationModal = ({ onClose, notifications = [], unviewedCount = 0 }) => {
  const role = "RH"
  const navigate = useNavigate()

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Date inconnue"
    const date = new Date(timestamp)
    return isNaN(date.getTime()) ? "Date inconnue" : format(date, "dd/MM/yyyy HH:mm")
  }

  const handleViewMore = () => {
    navigate("/Notificationsrh")
    if (onClose) onClose()
  }


  const sortedNotifications = [...notifications]
    .filter((n) => n.role === role)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5) // Limit to 5 notifications in the dropdown

  return (
    <div className="notification-modal">
      <div className="notification-modal-header">
        <h2>Notifications</h2>
        
      </div>

      {sortedNotifications.length > 0 ? (
        <div className="notification-modal-list">
          {sortedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-modal-item ${!notification.viewed ? "unread" : ""}`}
            >
              <div className="notification-modal-icon">
                <FiBell size={18} />
              </div>
              <div className="notification-modal-content">
                <p className="notification-modal-message">{notification.message}</p>
                <span className="notification-modal-time">{formatTimestamp(notification.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="notification-modal-empty">Aucune notification.</p>
      )}

      <button onClick={handleViewMore} className="view-all-button">
        Voir toutes les notifications
      </button>
    </div>
  )
}

export default NotificationModal
