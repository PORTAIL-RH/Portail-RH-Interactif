import React from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import bellIcon from "../../../assets/bell.png";
import "./NotificationModal.css";

const NotificationModal = ({ notifications, unviewedCount, markAsRead, userServiceId, onClose }) => {
  const role = "Chef Hiérarchique";
  const navigate = useNavigate();

  // Filter and sort notifications
  const sortedNotifications = notifications
    .filter(
      (notification) =>
        !notification.viewed && notification.role === role && notification.serviceId === userServiceId
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  console.log("Notifications filtrées (NotificationModal):", sortedNotifications);

  return (
    <div className="notification-popover">
      <div className="notification-header">
        <h2>Notifications</h2>
        {unviewedCount > 0 && <span className="notification-badge">{unviewedCount}</span>}
      </div>

      {sortedNotifications.length > 0 ? (
        <div className="notification-list">
          {sortedNotifications.map((notification) => (
            <div
              key={notification.id}
              className="notification unread"
              onClick={() => markAsRead(notification.id)}
            >
              <img src={bellIcon} alt="Bell Icon" className="bell-icon" />
              <p>{notification.message}</p>
              <span className="notification-timestamp">
                {format(new Date(notification.timestamp), "yyyy-MM-dd HH:mm")}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-notifications">No new notifications.</p>
      )}

      <button onClick={() => navigate("/Notificationschef")} className="view-more-button">
        View More
      </button>
    </div>
  );
};

export default NotificationModal;