"use client"

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
  
  // Use the notifications hook
  const { 
    notifications, 
    unviewedCount, 
    markAllAsRead, 
    loading, 
    error 
  } = useNotifications()

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    setCurrentTheme(savedTheme)
  }, [])

  useEffect(() => {
    if (theme) setCurrentTheme(theme)
  }, [theme])

  const toggleNotifications = () => {
    setIsNotificationsOpen(prev => !prev)
    // Mark all as read when opening notifications
    if (!isNotificationsOpen && unviewedCount > 0) {
      markAllAsRead()
    }
  }

  const handleToggleTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light"
    setCurrentTheme(newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
    localStorage.setItem("theme", newTheme)
    if (toggleTheme) toggleTheme()
  }

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = "/"
  }

  // Debugging
  useEffect(() => {
    console.log("Notification state:", {
      unviewedCount,
      notifications,
      loading,
      error
    })
  }, [unviewedCount, notifications, loading, error])

  return (
    <nav className={`navbar ${currentTheme}`}>
      <div className="navbar-welcome">
        <div className="user-info">
          <div className="user-avatar">
            <FiUser />
          </div>
          <span className="welcome-text">
            {userData.role}. Bienvenue, {userData.nom} {userData.prenom}
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
            <span className="notification-badge">
              {unviewedCount > 9 ? "9+" : unviewedCount}
            </span>
          )}
          <button
            className="notification-button"
            onClick={toggleNotifications}
            aria-label="Notifications"
          >
            <img
              src={bellIcon}
              alt="Notifications"
              className={`notification-icon ${currentTheme}`}
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