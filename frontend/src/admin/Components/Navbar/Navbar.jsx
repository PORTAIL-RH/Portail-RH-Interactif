import { useState, useEffect } from "react"
import useNotifications from "./useNotifications"
import NotificationModal from "./NotificationModal"
import "./Navbar.css"
import bellIcon from "../../../assets/bell1.png"
import { FiSun, FiMoon, FiLogOut, FiUser } from "react-icons/fi"
import { API_URL } from "../../../config"

const Navbar = ({ theme, toggleTheme, hideNotificationBadge = false }) => {
  const [currentTheme, setCurrentTheme] = useState(theme || "light")
  const [notifications, setNotifications] = useState([])
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem("userData") || "{}")
  const role = userData.role || localStorage.getItem("userRole") || "Admin"
  const userId = localStorage.getItem("userId")

  const {
    notifications: hookNotifications,
    unviewedCount,
    fetchNotifications,
    markAsRead,
  } = useNotifications(role, userId)



  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    setCurrentTheme(savedTheme)
  }, [])

  useEffect(() => {
    if (theme) setCurrentTheme(theme)
  }, [theme])

  const toggleNotifications = () => {
    setIsNotificationsOpen((prev) => !prev)
  }

  const handleMarkAsRead = async (id) => {
    await markAsRead(id)
    fetchNotifications()
  }

  const handleToggleTheme = () => {
    if (toggleTheme) {
      toggleTheme()
    } else {
      const newTheme = currentTheme === "light" ? "dark" : "light"
      setCurrentTheme(newTheme)
      document.documentElement.classList.toggle("dark", newTheme === "dark")
      localStorage.setItem("theme", newTheme)
      window.dispatchEvent(new Event("storage"))
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("userId")
    localStorage.removeItem("userRole")
    localStorage.removeItem("usermatricule")
    localStorage.removeItem("dashboardStats")
    localStorage.removeItem("personnelData")
    localStorage.removeItem("rolesData")
    localStorage.removeItem("servicesData")
    localStorage.removeItem("roleDistribution")
    localStorage.removeItem("authToken")
    localStorage.removeItem("userData")
    window.location.href = "/"
  }

  return (
    <nav className={`navbar ${currentTheme}`}>
      <div className="navbar-welcome">
        <div className="user-info">
          <div className="user-avatar">
            <FiUser />
          </div>
          <span className="welcome-text">
            {role}. Bienvenue, {userData.nom} {userData.prenom}
          </span>
        </div>
      </div>
      <div className="navbar-actions">
        <button
          className="theme-toggle"
          onClick={handleToggleTheme}
          aria-label={currentTheme === "light" ? "Passer au mode sombre" : "Passer au mode clair"}
        >
          {currentTheme === "light" ? <FiMoon /> : <FiSun />}
        </button>
        <div className="notification-container">
          {!hideNotificationBadge && unviewedCount > 0 && (
            <span className="notification-badge">{unviewedCount}</span>
          )}
          <button className="notification-button" onClick={toggleNotifications} aria-label="Notifications">
            <img
              src={bellIcon}
              alt="Notifications"
              className={`notification-icon-img ${currentTheme === "light" ? "notification-icon-light" : ""}`}
            />
          </button>
          {isNotificationsOpen && (
            <NotificationModal
              notifications={notifications}
              unviewedCount={unviewedCount}
              markAsRead={handleMarkAsRead}
              userServiceId={userId}
              onClose={() => setIsNotificationsOpen(false)}
              theme={currentTheme}
            />
          )}
        </div>
        <button className="logout-button" onClick={handleLogout}>
          <FiLogOut className="logout-icon" />
          <span className="logout-text">Déconnexion</span>
        </button>
      </div>
    </nav>
  )
}

export default Navbar