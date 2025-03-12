import React, { useState, useEffect } from "react";
import useNotifications from "./useNotifications";
import "./Navbar.css";
import bellIcon from "../../../assets/bell1.png";
import NotificationModal from "./NotificationModal";

const Navbar = ({ userServiceId }) => {
  const role = "Chef Hiérarchique";
  const { notifications, unviewedCount, fetchNotifications, markAsRead } = useNotifications(role, userServiceId);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const toggleNotifications = () => {
    setIsNotificationsOpen((prev) => !prev);
  };

  const handleMarkAsRead = async (id) => {
    await markAsRead(id);
    fetchNotifications(); // Refresh notifications after marking as read
  };

  return (
    <nav className="navbar">
      <div className="navbar-text">Welcome, Chef Hiérarchique</div>
      <div className="notification-container">
        {unviewedCount > 0 && <span className="notification-badge">{unviewedCount}</span>}
        <img src={bellIcon} alt="Bell Icon" className="icon-notif" onClick={toggleNotifications} />
      </div>
      {isNotificationsOpen && (
        <NotificationModal
          notifications={notifications}
          unviewedCount={unviewedCount}
          markAsRead={handleMarkAsRead}
          userServiceId={userServiceId}
          onClose={() => setIsNotificationsOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;