"use client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import bellIcon from "../../../assets/bell.png";
import "./NotificationModal.css";

const NotificationModal = ({ notifications, unviewedCount, markAsRead, onClose, theme }) => {
  const navigate = useNavigate();

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Date inconnue";
    try {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? "Date inconnue" : format(date, "yyyy-MM-dd HH:mm");
    } catch (e) {
      return "Date inconnue";
    }
  };

  const handleViewMore = () => {
    navigate("/Notificationschef");
    onClose();
  };

  // Generate stable keys for notifications
  const getNotificationKey = (notification, index) => {
    if (notification.id) return `notification-${notification.id}`;
    // Fallback to timestamp + index if no ID exists
    return `notification-${notification.timestamp || 'no-timestamp'}-${index}`;
  };

  const unreadNotifications = [...notifications]
    .filter((notification) => !notification.viewed)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const handleNotificationClick = async (id) => {
    if (!id) return; // Skip if no ID exists
    try {
      await markAsRead(id);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <div className={`notification-popover ${theme}`}>
      <div className="notification-header">
        <h2>Notifications</h2>
        {unviewedCount > 0 && <span className="notification-badge">{unviewedCount}</span>}
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>

      {unreadNotifications.length > 0 ? (
        <div className="notification-list">
          {unreadNotifications.map((notification, index) => (
            <div
              key={getNotificationKey(notification, index)}
              className={`notification ${notification.viewed ? "read" : "unread"}`}
              onClick={() => handleNotificationClick(notification.id)}
            >
              <img src={bellIcon || "/placeholder.svg"} alt="Bell Icon" className="bell-icon" />
              <div className="notification-content">
                <p>{notification.message}</p>
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
  );
};

export default NotificationModal;