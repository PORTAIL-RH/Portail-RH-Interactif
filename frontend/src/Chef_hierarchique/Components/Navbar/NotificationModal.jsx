
import { format } from "date-fns"
import { useNavigate } from "react-router-dom"
import { FiBell } from "react-icons/fi"
import "./NotificationModal.css"

const NotificationModal = ({ notifications = [], onClose, theme, markAllAsRead }) => {
  const navigate = useNavigate()
  const userId = localStorage.getItem("userId")

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Date inconnue"
    try {
      const date = new Date(timestamp)
      return isNaN(date.getTime()) ? "Date inconnue" : format(date, "dd/MM/yyyy HH:mm")
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
    return `notification-${notification.timestamp || "no-timestamp"}-${index}`
  }

  const handleNotificationClick = (notification) => {
    if (!notification.readBy?.includes(userId)) {
      // Optimistically update the UI
      const updatedNotifications = notifications.map(n => 
        n.id === notification.id 
          ? { ...n, readBy: [...(n.readBy || []), userId] }
          : n
      )
      
      // Call markAllAsRead (you might want to implement markSingleAsRead in useNotifications)
      markAllAsRead?.()
    }
  }

  const sortedNotifications = [...notifications]
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
              className={`notification ${
                notification.readBy?.includes(userId) ? "read" : "unread"
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-icon">
                <FiBell className="bell-icon" />
              </div>
              <div className="notification-content">
                <p className="notification-message">{notification.message}</p>
                <span className="notification-timestamp">
                  {formatTimestamp(notification.timestamp)}
                </span>
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