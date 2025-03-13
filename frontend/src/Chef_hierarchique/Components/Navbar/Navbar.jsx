import React, { useState, useEffect, useCallback } from "react";
import useNotifications from "./useNotifications";
import "./Navbar.css";
import bellIcon from "../../../assets/bell1.png";
import NotificationModal from "./NotificationModal";
import { FiMoon, FiSun } from "react-icons/fi"; // Import the icons

const Navbar = ({ userServiceId }) => {
  const [theme, setTheme] = useState("dark"); // Default to dark theme
  const role = "Chef Hiérarchique"; // Define the role
  const {
    notifications,
    unviewedCount,
    fetchNotifications,
    markAsRead,
    error,
  } = useNotifications(role, userServiceId); // Use the hook
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Memoize fetchNotifications to avoid infinite loops
  const memoizedFetchNotifications = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Fetch notifications on component mount and when userServiceId changes
  useEffect(() => {
    memoizedFetchNotifications();
  }, [userServiceId, memoizedFetchNotifications]);

  // Toggle the notification modal
  const toggleNotifications = () => {
    setIsNotificationsOpen((prev) => !prev);
  };

  // Handle marking a notification as read
  const handleMarkAsRead = async (id) => {
    await markAsRead(id); // Mark the notification as read
    memoizedFetchNotifications(); // Refresh the notifications list
  };

  // Theme toggle logic
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
  };

  return (
    <nav className="navbar">
      <div className="navbar-text">Welcome, Chef Hiérarchique</div>
      <div className="navbar-actions">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === "light" ? "Passer au mode sombre" : "Passer au mode clair"}
        >
          {theme === "light" ? <FiMoon /> : <FiSun />}
        </button>
        <div className="notification-container">
          {/* Display the unread notification count */}
          {unviewedCount > 0 && (
            <span className="notification-badge">{unviewedCount}</span>
          )}
          {/* Bell icon to toggle notifications */}
          <img
            src={bellIcon}
            alt="Bell Icon"
            className="icon-notif"
            onClick={toggleNotifications}
            aria-label="Notifications"
          />
        </div>
      </div>
      {/* Notification modal */}
      {isNotificationsOpen && (
        <NotificationModal
          notifications={notifications}
          unviewedCount={unviewedCount}
          markAsRead={handleMarkAsRead}
          userServiceId={userServiceId} // Pass userServiceId to NotificationModal
          onClose={() => setIsNotificationsOpen(false)}
        />
      )}
      {/* Display error messages if any */}
      {error && <div className="error-message">{error}</div>}
    </nav>
  );
};

export default Navbar;