import React from "react";
import { format } from "date-fns";
import useNotifications from "../Navbar/useNotifications";
import bellIcon from "../../../assets/bell.png";
import "./Notifications.css";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";

const Notifications = () => {
  const { notifications = [], unviewedCount, setUnviewedCount, fetchNotifications, error } = useNotifications() || {};

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("authToken");
      await fetch(`http://localhost:8080/api/notifications/${id}/view`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setUnviewedCount((prev) => Math.max(prev - 1, 0));
      fetchNotifications();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };

  // ✅ Trier toutes les notifications par date (du plus ancien au plus récent)
  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  return (
    <div className="accueil-containernt">
      <Navbar />
      <Sidebar />
      <div className="contenttf">
        <div className="notification-section">
          <div className="notification-header">
            <h2>Notifications</h2>
            {unviewedCount > 0 && <span className="notification-badge">{unviewedCount}</span>}
          </div>

          {error && <p className="error-message">{error}</p>}

          {sortedNotifications.length > 0 ? (
            <div className="notification-list">
              {sortedNotifications.reverse().map((notification) => {
                const notificationDate = new Date(notification.timestamp);

                // Check for invalid date
                if (isNaN(notificationDate.getTime())) {
                  console.error("Invalid date value:", notification.timestamp);
                  return null; // Skip this notification if date is invalid
                }

                return (
                  <div
                    key={notification.id}
                    className={`notification ${notification.viewed ? "read" : "unread"}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <img src={bellIcon} alt="Bell Icon" className="bell-icon" />
                    <p>{notification.message}</p>
                    <span className="notification-timestamp">
                      {format(notificationDate, "yyyy-MM-dd HH:mm")}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>Aucune notification.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
