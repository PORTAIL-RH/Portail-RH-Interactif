import { format } from "date-fns"
import { useNavigate } from "react-router-dom"
import { FiBell } from "react-icons/fi"
import "./NotificationModal.css"

const NotificationModal = ({ notifications, onClose, theme }) => {
  const navigate = useNavigate()

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Date inconnue"
    try {
      const date = new Date(timestamp)
      return isNaN(date.getTime()) ? "Date inconnue" : format(date, "yyyy-MM-dd HH:mm")
    } catch (e) {
      return "Date inconnue"
    }
  }

  const handleViewMore = () => {
    navigate("/Notificationschef")
    onClose()
  }

  // Generate stable keys for notifications
  const getNotificationKey = (notification, index) => {
    if (notification.id) return `notification-${notification.id}`
    // Fallback to timestamp + index if no ID exists
    return `notification-${notification.timestamp || "no-timestamp"}-${index}`
  }

  const sortedNotifications = [...notifications]
    .filter((n) => n.role === "Chef Hiérarchique") // Filter by role first
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5) // Limit to 5 notifications in the dropdown

  

  return (
    <div className={`notification-popover ${theme}`}>
      <div className="notification-header">
        <h2>Notifications</h2>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>

      {sortedNotifications.length > 0 ? (
        <div className="notification-list">
          {sortedNotifications.map((notification, index) => (
            <div
              key={getNotificationKey(notification, index)}
              className={`notification ${notification.viewed ? "read" : "unread"}`}
            >
              <div className="notification-icon">
                <FiBell className="bell-icon" />
              </div>
              <div className="notification-content">
                <p className="notification-message">{notification.message}</p>
                <span className="notification-timestamp">{formatTimestamp(notification.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-notifications">Aucune notification.</p>
      )}

      <button onClick={handleViewMore} className="view-more-button">
        Voir plus
      </button>
    </div>
  )
}

export default NotificationModal
