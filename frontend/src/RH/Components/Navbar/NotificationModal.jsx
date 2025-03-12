import React from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import bellIcon from "../../../assets/bell.png";
import "./NotificationModal.css";
import useNotifications from "./useNotifications";

const NotificationModal = ({ setUnviewedCount }) => {
  const role = "RH"; // Rôle de l'utilisateur actuel
  const { notifications, unviewedCount, fetchNotifications, error } = useNotifications(role);
  const navigate = useNavigate();

  // ✅ Vérification stricte du timestamp avant formatage
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Date inconnue";

    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? "Date inconnue" : format(date, "yyyy-MM-dd HH:mm");
  };

  const handleViewMore = () => {
    navigate("/Notificationsrh");
  };

  // ✅ Filtrer et trier les notifications 
  const sortedNotifications = [...notifications]
    .filter((notification) => !notification.viewed && notification.role === role) // Filtrer par rôle et non lues
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Trier par date décroissante

  return (
    <div className="notification-popover">
      <div className="notification-header">
        <h2>Notifications</h2>
        {unviewedCount > 0 && <span className="notification-badge">{unviewedCount}</span>}
      </div>

      {error && <p className="error-message">{error}</p>}

      {sortedNotifications.length > 0 ? (
        <div className="notification-list">
          {sortedNotifications.map((notification) => (
            <div key={notification.id} className={`notification unread`}>
              <img src={bellIcon} alt="Bell Icon" className="bell-icon" />
              <p>{notification.message}</p>
              <span className="notification-timestamp">
                {formatTimestamp(notification.timestamp)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-notifications">No new notifications.</p>
      )}

      <button onClick={handleViewMore} className="view-more-button">
        View More
      </button>
    </div>
  );
};

export default NotificationModal;