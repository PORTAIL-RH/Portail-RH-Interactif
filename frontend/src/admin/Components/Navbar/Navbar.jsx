import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import "./Navbar.css";
import bellIcon from "../../../assets/bell1.png";

const Navbar = () => {
  const [unviewedCount, setUnviewedCount] = useState(0);

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      try {
        const token = localStorage.getItem("authToken");

        const response = await fetch("http://localhost:8080/api/notifications/unread", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const notifications = await response.json();
          setUnviewedCount(notifications.length); // Set the count of unread notifications
        } else {
          console.error(`Failed to fetch unread notifications. Status: ${response.status}`);
        }
      } catch (error) {
        console.error("Error fetching unread notifications:", error);
      }
    };

    fetchUnreadNotifications();
  }, []); // This effect runs once when the component mounts

  return (
    <nav className="navbar">
      <div className="navbar-text">Welcome, Admin</div>
      <div className="notification-container">
        {unviewedCount > 0 && (
          <span className="notification-badge">{unviewedCount}</span> // Display unread count
        )}
        {/* Wrap the bell icon in a Link component to navigate to /Notifications */}
        <Link to="/Notifications">
          <img src={bellIcon} alt="Bell Icon" className="icon-notif" />
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
