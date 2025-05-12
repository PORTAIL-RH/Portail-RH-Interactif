import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { FiSun, FiMoon, FiLogOut, FiBell } from "react-icons/fi"
import "./Navbar.css"
import NotificationsModal from "../../Notifications/NotificationsModal"
import { API_URL } from "../../../config"
import useNotifications from "../../Notifications/useNotifications"


const Navbar = () => {
  const navigate = useNavigate()
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    role: "Collaborateur", // Default role
  })
  const [theme, setTheme] = useState("dark")
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotificationsModal, setShowNotificationsModal] = useState(false)

  // Get user role from localStorage
  useEffect(() => {
    const userRole = localStorage.getItem("userRole") || "Collaborateur"
    setUserData((prev) => ({
      ...prev,
      role: userRole,
    }))
  }, [])

  // Use the notifications hook
  const { notifications, unviewedCount, markAllAsRead, fetchNotifications } = useNotifications(userData.role)

  useEffect(() => {
    // Fetch user data
    const userId = localStorage.getItem("userId")
    if (userId) {
      fetchUserData(userId)
    }

    // Get theme from localStorage
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    } else {
      // Set dark theme by default
      setTheme("dark")
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    }

    // Fetch notifications when component mounts
    fetchNotifications()
  }, [fetchNotifications])

  const fetchUserData = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/Personnel/byId/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setUserData({
          firstName: data.nom || "User",
          lastName: data.prenom || "",
          role: data.role || "Collaborateur",
        })
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
    localStorage.setItem("theme", newTheme)
  }

  const toggleNotificationsModal = useCallback(async () => {
    // If opening the modal, fetch notifications first to ensure we have the latest data
    if (!showNotificationsModal) {
      try {
        // Fetch notifications first to ensure we have the latest data
        await fetchNotifications()

        // Then mark all as read
        await markAllAsRead()

        // Refresh notifications to update the UI
        await fetchNotifications()
      } catch (error) {
        console.error("Error handling notifications:", error)
      }
    }

    setShowNotificationsModal(!showNotificationsModal)
  }, [showNotificationsModal, markAllAsRead, fetchNotifications])


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
            {unviewedCount > 0 && <span className="notification-badge">{unviewedCount}</span>}
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

          
        </div>
      </nav>

      {showNotificationsModal && (
        <NotificationsModal notifications={notifications} onClose={() => setShowNotificationsModal(false)} />
      )}
    </>
  )
}

export default Navbar
