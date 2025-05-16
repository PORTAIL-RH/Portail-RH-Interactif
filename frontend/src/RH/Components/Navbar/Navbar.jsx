import { useState, useEffect } from "react"
import useNotifications from "./useNotifications"
import NotificationModal from "./NotificationModal"
import "./Navbar.css"
import bellIcon from "../../../assets/bell1.png"
import { FiSun, FiMoon, FiLogOut, FiUser } from "react-icons/fi"

const Navbar = ({ theme, toggleTheme, hideNotificationBadge = false }) => {
  const [currentTheme, setCurrentTheme] = useState(theme || "light")
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem("userData") || "{}")
  const role = userData.role || "RH"
  const serviceId = userData.service?.$id?.$oid || 
    localStorage.getItem('userServiceId') || 
    userData.serviceId;

  const { 
    notifications, 
    unviewedCount, 
    markAllAsRead
  } = useNotifications(role, serviceId)

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

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
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
    localStorage.clear()
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
          <button
            className="notification-button"
            onClick={() => {
              toggleNotifications()
              if (unviewedCount > 0) {
                handleMarkAllAsRead()
              }
            }}
            aria-label="Notifications"
          >
            <img
              src={bellIcon || "/placeholder.svg"}
              alt="Notifications"
              className={`notification-icon-img ${currentTheme === "light" ? "notification-icon-light" : ""}`}
            />
          </button>
          {isNotificationsOpen && (
            <NotificationModal
              onClose={() => setIsNotificationsOpen(false)}
              notifications={notifications}
              unviewedCount={unviewedCount}
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