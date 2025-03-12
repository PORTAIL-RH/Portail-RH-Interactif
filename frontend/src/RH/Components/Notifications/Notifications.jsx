import React from "react";
import { format } from "date-fns";
import useNotifications from "../Navbar/useNotifications";
import bellIcon from "../../../assets/bell.png";
import "./Notifications.css";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";

const Notifications = () => {
  const role = "RH"; // Rôle de l'utilisateur actuel
  const { notifications = [], unviewedCount, setUnviewedCount, fetchNotifications, error } = useNotifications(role);

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

      // Mettre à jour le compteur de notifications non lues
      setUnviewedCount((prev) => Math.max(prev - 1, 0));

      // Recharger les notifications
      await fetchNotifications();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };

  // ✅ Filtrer et trier les notifications pour l'admin
  const sortedNotifications = [...notifications]
    .filter((notification) => notification.role === role) // Filtrer par rôle
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Trier par date (du plus récent au plus ancien)

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
              {sortedNotifications.map((notification) => {
                const notificationDate = new Date(notification.timestamp);

                // Vérifier si la date est valide
                if (isNaN(notificationDate.getTime())) {
                  console.error("Invalid date value:", notification.timestamp);
                  return null; // Ignorer cette notification si la date est invalide
                }

                return (
                  <div
                    key={notification.id}
                    className={`notification ${notification.viewed ? "read" : "unread"}`}
                    onClick={() => !notification.viewed && markAsRead(notification.id)} // Marquer comme lue uniquement si elle n'est pas déjà lue
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