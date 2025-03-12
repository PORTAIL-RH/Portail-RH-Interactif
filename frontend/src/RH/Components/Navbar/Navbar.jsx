import React, { useState, useEffect } from "react";
import useNotifications from "./useNotifications";
import "./Navbar.css";
import bellIcon from "../../../assets/bell1.png";
import NotificationModal from "./NotificationModal";

const Navbar = () => {
  const role = "RH"; // Récupérez le rôle de l'utilisateur (par exemple, depuis le contexte ou l'API)
  const { unviewedCount, fetchNotifications, setUnviewedCount } = useNotifications(role);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Re-fetch notifications whenever unviewedCount changes
  useEffect(() => {
    fetchNotifications();
  }, [unviewedCount, fetchNotifications]);

  const toggleNotifications = async () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    if (!isNotificationsOpen) {
      await fetchNotifications();
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-text">Welcome, RH</div>
     
      <div className="notification-container">
        {unviewedCount > 0 && <span className="notification-badge">{unviewedCount}</span>}
        <img src={bellIcon} alt="Bell Icon" className="icon-notif" onClick={toggleNotifications} />
      </div>
      {isNotificationsOpen && <NotificationModal setUnviewedCount={setUnviewedCount} />}
    
    </nav>
  );
};

export default Navbar;
