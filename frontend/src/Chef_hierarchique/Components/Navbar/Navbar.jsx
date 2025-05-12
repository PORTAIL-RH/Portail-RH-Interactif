"use client"

import { useState, useEffect, useCallback } from "react"
import useNotifications from "./useNotifications"
import "./Navbar.css"
import bellIcon from "../../../assets/bell1.png"
import NotificationModal from "./NotificationModal"
import { FiSun, FiMoon, FiLogOut, FiUser } from "react-icons/fi"
import { useNavigate } from "react-router-dom"

const Navbar = ({ toggleTheme: externalToggleTheme, theme: externalTheme }) => {
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    role: "",
    serviceId: "",
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const navigate = useNavigate()

  // Theme management
  const [localTheme, setLocalTheme] = useState(() => {
    return localStorage.getItem("theme") || "light"
  })
  const theme = externalTheme || localTheme

  // Get user data from localStorage
  useEffect(() => {
    try {
      const storedUserData = localStorage.getItem("userData")
      const storedServiceId = localStorage.getItem("userServiceId")

      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData)
        setUserData({
          firstName: parsedData.nom || "",
          lastName: parsedData.prenom || "",
          role: parsedData.role || "Chef Hiérarchique",
          serviceId: storedServiceId || "",
        })
      }
    } catch (error) {
      setError("Failed to parse user data")
      console.error("Error parsing userData:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Notifications hook
  const {
    notifications,
    unviewedCount,
    markAsRead,
    markAllAsRead,
    error: notificationError,
    fetchNotifications,
  } = useNotifications(userData.role, userData.serviceId)

  // Toggle notifications panel, matching admin implementation
  const toggleNotifications = useCallback(() => {
    setIsNotificationsOpen((prev) => !prev)
  }, [])

  // Theme toggle handler
  const handleToggleTheme = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light"
    if (externalToggleTheme) {
      externalToggleTheme()
    } else {
      setLocalTheme(newTheme)
      localStorage.setItem("theme", newTheme)
      document.documentElement.classList.toggle("dark", newTheme === "dark")
    }
  }, [theme, externalToggleTheme])

  // Logout handler
  const handleLogout = useCallback(() => {
    ;[
      "authToken",
      "userId",
      "userRole",
      "usermatricule",
      "userCodeSoc",
      "userServiceId",
      "userServiceName",
      "userData",
    ].forEach((key) => localStorage.removeItem(key))
    navigate("/")
  }, [navigate])

  if (loading) return <div className="navbar loading">Loading...</div>
  if (error) return <div className="navbar error">Error: {error}</div>

  return (
    <nav className={`navbar ${theme}`}>
      <div className="navbar-welcome">
        <div className="user-info">
          <FiUser className="user-avatar" />
          <span>
            {userData.role}. Welcome, {userData.firstName} {userData.lastName}
          </span>
        </div>
      </div>

      <div className="navbar-actions">
        <button
          className="theme-toggle"
          onClick={handleToggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? <FiMoon /> : <FiSun />}
        </button>

        <div className="notification-container">
          <button
            className="notification-button"
            onClick={() => {
              toggleNotifications()
              // Mark all as read when opening the notification panel
              if (!isNotificationsOpen && unviewedCount > 0) {
                markAllAsRead().catch((error) => {
                  console.error("Failed to mark notifications as read:", error)
                  // Optionally show an error message to the user
                })
              }
            }}
            aria-label={`Notifications (${unviewedCount} unread)`}
          >
            <img
              src={bellIcon || "/placeholder.svg"}
              alt="Notifications"
              className={`notification-icon ${theme}`}
              onError={(e) => {
                e.target.src = "/placeholder.svg"
              }}
            />
            {unviewedCount > 0 && <span className="notification-badge">{unviewedCount}</span>}
          </button>

          {isNotificationsOpen && (
            <NotificationModal
              notifications={notifications}
              unviewedCount={unviewedCount}
              markAsRead={markAsRead}
              onClose={() => setIsNotificationsOpen(false)}
              theme={theme}
            />
          )}
        </div>

        <button className="logout-button" onClick={handleLogout}>
          <FiLogOut />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  )
}

export default Navbar
