import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import useNotifications from "../Navbar/useNotifications";
import bellIcon from "../../../assets/bell.png";
import "./Notifications.css";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";

const Notifications = () => {
  const role = "Chef Hiérarchique"; // Rôle de l'utilisateur
  const [userServiceId, setUserServiceId] = useState(null);

  // Fetch userServiceId from local storage
  useEffect(() => {
    const storedServiceId = localStorage.getItem("userServiceId");
    if (storedServiceId) {
      setUserServiceId(storedServiceId);
    } else {
      console.error("userServiceId not found in local storage");
    }
  }, []);

  const { notifications, unviewedCount, markAsRead, error } = useNotifications(role, userServiceId);

  // Filtrer et trier les notifications
  const sortedNotifications = [...notifications]
    .filter((notification) => {
      return (
        notification.role === role &&
        notification.serviceId === userServiceId
      );
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  console.log("All Notifications:", notifications);
  console.log("Filtered Notifications:", sortedNotifications);
  console.log("Role:", role, "Service ID:", userServiceId);

  if (!userServiceId) {
    return <p>Loading...</p>;
  }

  return (
    <div className="app-container">
    <Sidebar />
    <div className="notifications-chef-container">
      <Navbar   userServiceId={userServiceId}/>
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
                if (isNaN(notificationDate.getTime())) {
                  console.error("Invalid date value:", notification.timestamp);
                  return null;
                }

                return (
                  <div
                    key={notification.id}
                    className={`notification ${notification.viewed ? "read" : "unread"}`}
                    onClick={() => !notification.viewed && markAsRead(notification.id)}
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
    </div>    </div>

  );
};

export default Notifications;