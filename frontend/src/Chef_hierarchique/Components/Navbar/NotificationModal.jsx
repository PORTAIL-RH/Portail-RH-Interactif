"use client"
import { format } from "date-fns"
import { useNavigate } from "react-router-dom"
import bellIcon from "../../../assets/bell.png"
import "./NotificationModal.css"

const NotificationModal = ({ notifications, unviewedCount, markAsRead, userServiceId, onClose }) => {
  const role = "Chef Hiérarchique"
  const navigate = useNavigate()

  // Filter and sort notifications
  const sortedNotifications = notifications
    .filter(
      (notification) => !notification.viewed && notification.role === role && notification.serviceId === userServiceId,
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  console.log("Notifications filtrées (NotificationModal):", sortedNotifications)

  return (
    <div className="notification-modal">
      <div className="modal-header">
        <h2>Notifications</h2>
        {unviewedCount > 0 && <span className="notification-count">{unviewedCount}</span>}
      </div>

      <div className="modal-body">
        {sortedNotifications.length > 0 ? (
          <div className="modal-notification-list">
            {sortedNotifications.map((notification) => (
              <div
                key={notification.id}
                className="modal-notification-item"
                onClick={() => markAsRead(notification.id)}
              >
                <div className="notification-icon">
                  <img src={bellIcon || "/placeholder.svg"} alt="Notification" />
                </div>
                <div className="notification-details">
                  <p className="notification-text">{notification.message}</p>
                  <span className="notification-date">
                    {format(new Date(notification.timestamp), "yyyy-MM-dd HH:mm")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-notifications">
            <p>Aucune nouvelle notification</p>
          </div>
        )}
      </div>

      <button
        className="view-all-button"
        onClick={() => {
          navigate("/Notificationschef")
          onClose()
        }}
      >
        Voir toutes les notifications
      </button>
    </div>
  )
}

export default NotificationModal

