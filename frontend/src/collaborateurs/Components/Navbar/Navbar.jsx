import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSun, FiMoon, FiLogOut, FiBell } from "react-icons/fi";
import NotificationsModal from "../../Notifications/NotificationsModal";
import "./Navbar.css";
import { API_URL } from "../../../config"; 

const Navbar = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
  });
  const [theme, setTheme] = useState("dark");
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  useEffect(() => {
    // Fetch user data
    const userId = localStorage.getItem("userId");
    if (userId) {
      fetchUserData(userId);
      fetchNotificationsCount(userId);
    }

    // Get theme from localStorage
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      // Set dark theme by default
      setTheme("dark");
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  }, []);

  const fetchUserData = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/Personnel/byId/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserData({
          firstName: data.nom || "User",
          lastName: data.prenom || "",
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchNotificationsCount = async (userId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/notifications/unread/count/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const count = await response.json();
        setUnreadNotifications(count);
      }
    } catch (error) {
      console.error("Error fetching notifications count:", error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    navigate("/");
  };

  const toggleNotificationsModal = () => {
    setShowNotificationsModal(!showNotificationsModal);
  };

  const closeNotificationsModal = () => {
    setShowNotificationsModal(false);
    // Refresh the unread count after closing the modal
    const userId = localStorage.getItem("userId");
    if (userId) {
      fetchNotificationsCount(userId);
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-logo" onClick={() => navigate("/AccueilCollaborateurs")}>
          Portail RH
        </div>

        <div className="navbar-actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Passer au mode sombre" : "Passer au mode clair"}
          >
            {theme === "light" ? <FiMoon /> : <FiSun />}
          </button>

          <button className="notification-button" onClick={toggleNotificationsModal} aria-label="Notifications">
            <FiBell />
            {unreadNotifications > 0 && <span className="notification-badge">{unreadNotifications}</span>}
          </button>

          <div className="user-dropdown">
            <button className="user-button" onClick={() => navigate("/Profile")}>
              <div className="user-avatar">
                {userData.firstName.charAt(0)}
                {userData.lastName.charAt(0)}
              </div>
              <span className="user-name">
                {userData.firstName} {userData.lastName}
              </span>
            </button>
          </div>

          {/**<button className="logout-button" onClick={handleLogout}>
            <FiLogOut className="logout-icon" />
            <span className="logout-text">Déconnexion</span>
          </button>**/}
        </div>
      </nav>

      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={closeNotificationsModal}
        userId={localStorage.getItem("userId")}
        token={localStorage.getItem("authToken")}
      />
    </>
  );
};

export default Navbar;