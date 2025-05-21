"use client"
import { format } from "date-fns"
import { useNavigate } from "react-router-dom"
import "./NotificationModal.css"
import { FiBell } from "react-icons/fi"

const NotificationModal = ({ onClose, notifications = [] }) => {
  const navigate = useNavigate()
  const userId = localStorage.getItem("userId")

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Date inconnue"
    try {
      const date = new Date(timestamp)
      return isNaN(date.getTime()) ? "Date inconnue" : format(date, "dd/MM/yyyy HH:mm")
    } catch {
      return "Date inconnue"
    }
  }

  const handleViewMore = () => {
    navigate("/Notificationsrh")
    onClose?.()
  }

  // Get last 5 notifications sorted by date (newest first)
  const lastFiveNotifications = [...notifications]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5)

  return (
    <div className="notification-modal">
      <div className="notification-modal-header">
        <h2>Notifications</h2>
      </div>

      {lastFiveNotifications.length > 0 ? (
        <div className="notification-modal-list">
          {lastFiveNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-modal-item ${!notification.readBy?.includes(userId) ? "unread" : ""}`}
            >
              <div className="notification-modal-icon">
                <FiBell size={18} />
              </div>
              <div className="notification-modal-content">
                <p className="notification-modal-message">{notification.message}</p>
                <span className="notification-modal-time">
                  {formatTimestamp(notification.timestamp)}
                </span>
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