import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import "./Navbar.css";
import bellIcon from "../../../assets/bell1.png";
import NotificationModal from "./NotificationModal"; // Update the path if necessary

const Navbar = () => {
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false); // State to toggle notifications view

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
          setUnviewedCount(notifications.length);
        } else {
          console.error(`Failed to fetch unread notifications. Status: ${response.status}`);
        }
      } catch (error) {
        console.error("Error fetching unread notifications:", error);
      }
    };

    fetchUnreadNotifications();
  }, []);

  // Toggle notification popover visibility
  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-text">Welcome, Admin</div>
      <div className="notification-container">
        {unviewedCount > 0 && (
          <span className="notification-badge">{unviewedCount}</span>
        )}
        <img
          src={bellIcon}
          alt="Bell Icon"
          className="icon-notif"
          onClick={toggleNotifications} // Toggle the notifications popover
        />
      </div>

      {/* Display Notifications Popover if it's open */}
      {isNotificationsOpen && <NotificationModal />}
    </nav>
  );
};

export default Navbar;
