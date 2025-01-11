import React, { useState, useEffect } from "react";
import "./Accueil.css";
import bellIcon from "../assets/bell.png"; // Notification bell icon
import { format } from "date-fns"; // Install via `npm install date-fns`

const Accueil = () => {
  const [notifications, setNotifications] = useState([]); // State for notifications
  const [error, setError] = useState(""); // State for error messages (optional)

  // Function to mark a notification as read
  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("authToken");

      // Send a request to mark the notification as viewed
      const response = await fetch(`http://localhost:8080/api/notifications/${id}/view`, {
        method: "POST", // Correct HTTP method
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Update the state to reflect the change
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) =>
            notification.id === id ? { ...notification, viewed: true } : notification
          )
        );
      } else {
        console.error(`Failed to mark notification as read. Status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Fetch notifications on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch("http://localhost:8080/api/notifications", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setNotifications(data || []); // Directly set the array as notifications
        } else {
          setError(`Failed to fetch notifications. Status: ${response.status}`);
        }
      } catch (error) {
        setError("Error fetching notifications. Please try again later.");
        console.error(error);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <div className="accueil-container">
      {/* Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-logo">MyApp</div>
        <ul className="sidebar-links">
          <li>Home</li>
          <li>Notifications</li>
          <li>About</li>
        </ul>
      </nav>

      {/* Main Content */}
      <div className="content">
        {/* Notification Section */}
        <div className="notification-section">
          <h2>Notifications</h2>
          {error && <p className="error-message">{error}</p>}
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification ${notification.viewed ? "read" : "unread"}`}
              >
                <img src={bellIcon} alt="Bell Icon" className="bell-icon" />
                <p>{notification.message}</p>
                <span className="notification-timestamp">
                  {format(new Date(notification.timestamp), "yyyy-MM-dd HH:mm")}
                  &nbsp;
                  </span>
                {/* Only show the button for unread notifications */}
                {!notification.viewed && (
                  <button onClick={() => markAsRead(notification.id)}>
                    Mark as Read
                  </button>
                )}
              </div>
            ))
          ) : (
            <p>No new notifications.</p>
          )}
        </div>

        {/* Main Content */}
        <div className="main-content">
          <h1>Welcome to the Dashboard</h1>
          <p>Manage your activities efficiently with MyApp.</p>
        </div>
      </div>
    </div>
  );
};

export default Accueil;
