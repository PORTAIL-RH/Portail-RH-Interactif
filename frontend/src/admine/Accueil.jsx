import React, { useState } from "react";
import "./Accueil.css";
import bellIcon from "../assets/bell.png"; // Notification bell icon

const Accueil = () => {
  const [notifications, setNotifications] = useState([
    { id: 1, message: "Your profile was updated successfully." },
    { id: 2, message: "New message from Admin." },
  ]);

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
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div key={notification.id} className="notification">
                <img src={bellIcon} alt="Bell Icon" className="bell-icon" />
                <p>{notification.message}</p>
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
