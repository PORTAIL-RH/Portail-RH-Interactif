import React, { useEffect } from "react";
import { format } from "date-fns";
import useNotifications from "../Navbar/useNotifications";
import bellIcon from "../../../assets/bell.png";
import "./Notifications.css";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";

const Notifications = () => {
  const role = "RH"; // Rôle de l'utilisateur actuel
  const {
    notifications = [],
    unviewedCount,
    setUnviewedCount,
    fetchNotifications,
    error,
  } = useNotifications(role);

  // Mark a notification as read
  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No authentication token found.");
        return;
      }

      const response = await fetch(`http://localhost:8080/api/notifications/${id}/view`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to mark notification as read.");
      }

      // Update the unviewed count
      setUnviewedCount((prev) => Math.max(prev - 1, 0));

      // Refresh notifications
      await fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Filter and sort notifications for the admin
  const sortedNotifications = [...notifications]
    .filter((notification) => notification.role === role) // Filter by role
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by date (newest first)

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="app-container">
      <Sidebar />
      <div className="dashboard-container">
        <Navbar />
        <div className="contenttf">
          <div className="notification-section">
            <div className="notification-header">
              <h2>Notifications</h2>
              {unviewedCount > 0 && (
                <span className="notification-badge">{unviewedCount}</span>
              )}
            </div>

            {error && <p className="error-message">{error}</p>}

            {sortedNotifications.length > 0 ? (
              <div className="notification-list">
                {sortedNotifications.map((notification) => {
                  const notificationDate = new Date(notification.timestamp);

                  // Skip invalid dates
                  if (isNaN(notificationDate.getTime())) {
                    console.error("Invalid date value:", notification.timestamp);
                    return null;
                  }

                  return (
                    <div
                      key={notification.id}
                      className={`notification ${notification.viewed ? "read" : "unread"}`}
                      onClick={() => !notification.viewed && markAsRead(notification.id)} // Mark as read if unread
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
    </div>
  );
};

export default Notifications;