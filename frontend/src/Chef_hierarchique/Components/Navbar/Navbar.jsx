import React, { useState, useEffect, useCallback } from "react";
import useNotifications from "./useNotifications";
import "./Navbar.css";
import bellIcon from "../../../assets/bell1.png";
import NotificationModal from "./NotificationModal";
import { FiSun, FiMoon, FiLogOut, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const Navbar = ({ toggleTheme: externalToggleTheme, theme: externalTheme }) => {
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    role: "",
    serviceId: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const navigate = useNavigate();

  // Theme management
  const [localTheme, setLocalTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });
  const theme = externalTheme || localTheme;

  // Get user data from localStorage
  useEffect(() => {
    try {
      const storedUserData = localStorage.getItem("userData");
      const storedServiceId = localStorage.getItem("userServiceId");
      
      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData);
        setUserData({
          firstName: parsedData.nom || "",
          lastName: parsedData.prenom || "",
          role: parsedData.role || "Chef Hiérarchique",
          serviceId: storedServiceId || ""
        });
      }
    } catch (error) {
      setError("Failed to parse user data");
      console.error("Error parsing userData from localStorage:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Notifications hook
  const {
    notifications,
    unviewedCount,
    markAsRead,
  } = useNotifications(userData.role, userData.serviceId);

  // Theme toggle handler
  const handleToggleTheme = useCallback(() => {
    if (externalToggleTheme) {
      externalToggleTheme();
    } else {
      const newTheme = theme === "light" ? "dark" : "light";
      setLocalTheme(newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "dark");
      localStorage.setItem("theme", newTheme);
      window.dispatchEvent(new Event("storage"));
    }
  }, [theme, externalToggleTheme]);

  // Notification handlers
  const toggleNotifications = useCallback(() => {
    setIsNotificationsOpen(prev => !prev);
  }, []);

  const handleMarkAsRead = useCallback(async (id) => {
    try {
      await markAsRead(id);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, [markAsRead]);

  // Logout handler
  const handleLogout = useCallback(() => {
    [
      "authToken", "userId", "userRole", "usermatricule", 
      "userCodeSoc", "userServiceId", "userServiceName", "userData"
    ].forEach(key => localStorage.removeItem(key));
    navigate("/");
  }, [navigate]);

  if (loading) {
    return <div className="navbar loading">Chargement des données...</div>;
  }

  if (error) {
    return <div className="navbar error">Erreur: {error}</div>;
  }

  return (
    <nav className={`navbar ${theme}`} aria-label="Main navigation">
      <div className="navbar-welcome">
        <div className="user-info">
          <div className="user-avatar" aria-hidden="true">
            <FiUser />
          </div>
          <span className="welcome-text">
            {userData.role}. Bienvenue, {userData.firstName} {userData.lastName}
          </span>
        </div>
      </div>

      <div className="navbar-actions">
        <button
          className="theme-toggle"
          onClick={handleToggleTheme}
          aria-label={theme === "light" ? "Passer au mode sombre" : "Passer au mode clair"}
        >
          {theme === "light" ? <FiMoon /> : <FiSun />}
        </button>

        <div className="notification-container">
          <button 
            className="notification-button" 
            onClick={toggleNotifications}
            aria-label={`Notifications (${unviewedCount} non lues)`}
            aria-expanded={isNotificationsOpen}
          >
            <img
              src={bellIcon}
              alt="Notifications"
              className={`notification-icon-img ${theme === "light" ? "notification-icon-light" : ""}`}
              onError={(e) => {
                e.target.src = "/placeholder.svg?height=24&width=24";
              }}
            />
            {unviewedCount > 0 && (
              <span className="notification-badge">
                {unviewedCount > 9 ? "9+" : unviewedCount}
              </span>
            )}
          </button>
          
          {isNotificationsOpen && (
            <NotificationModal
              notifications={notifications}
              unviewedCount={unviewedCount}
              markAsRead={handleMarkAsRead}
              onClose={() => setIsNotificationsOpen(false)}
              theme={theme}
            />
          )}
        </div>

        <button 
          className="logout-button"
          onClick={handleLogout}
          aria-label="Déconnexion"
        >
          <FiLogOut className="logout-icon" />
          <span className="logout-text">Déconnexion</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;