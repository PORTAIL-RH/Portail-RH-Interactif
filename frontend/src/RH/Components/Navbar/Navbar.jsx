"use client"
import { useState, useEffect } from "react"
import useNotifications from "./useNotifications"
import NotificationModal from "./NotificationModal"
import "./Navbar.css"
import bellIcon from "../../../assets/bell1.png"
import { FiSun, FiMoon, FiLogOut, FiUser } from "react-icons/fi"

const Navbar = ({ theme, toggleTheme }) => {
  const [userData, setUserData] = useState({
    id: "",
    firstName: "",
    lastName: "",
    role: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  
  const {
    notifications: hookNotifications,
    unviewedCount,
    fetchNotifications,
    markAsRead,
  } = useNotifications()

  // Load user data from localStorage
  useEffect(() => {
    try {
      setLoading(true)
      const storedUserData = localStorage.getItem("userData")
      
      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData)
        setUserData({
          id: parsedData.id || localStorage.getItem("userId") || "",
          firstName: parsedData.nom || parsedData.firstName || "",
          lastName: parsedData.prenom || parsedData.lastName || "",
          role: parsedData.role || localStorage.getItem("userRole") || ""
        })
      } else {
        // Fallback to individual localStorage items if userData doesn't exist
        setUserData({
          id: localStorage.getItem("userId") || "",
          firstName: localStorage.getItem("userFirstName") || "",
          lastName: localStorage.getItem("userLastName") || "",
          role: localStorage.getItem("userRole") || ""
        })
      }
    } catch (error) {
      setError("Failed to load user data")
      console.error("Error loading user data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Notification handling
  useEffect(() => {
    const savedNotifications = localStorage.getItem("notifications")
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications))
      } catch (e) {
        console.error("Error parsing notifications:", e)
      }
    }
  }, [])

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id)
      fetchNotifications()
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleLogout = () => {
    // Clear all relevant localStorage items
    const itemsToRemove = [
      "userId", "authToken", "usermatricule", "userCodeSoc", "userRole", 
      "userServiceName", "userData", "demandesOther", "demandesPreAvance", 
      "demandesAutorisation", "demandesConge", "demandesDocument", 
      "demandesFormation", "notifications","dashboardStats","demandes","personnel","personnelData"
    ]
    
    itemsToRemove.forEach(item => localStorage.removeItem(item))
    window.location.href = "/"
  }

  if (loading) return <div className={`navbar loading ${theme}`}>Loading...</div>
  if (error) return <div className={`navbar error ${theme}`}>Error: {error}</div>

  return (
    <nav className={`navbar ${theme}`}>
      <div className="navbar-welcome">
        <div className="user-info">
          <div className="user-avatar">
            <FiUser />
          </div>
          <span className="welcome-text">
            {userData.role ? `${userData.role}. ` : ''}
            Welcome, {userData.firstName} {userData.lastName}
          </span>
        </div>
      </div>
      
      <div className="navbar-actions">
        <button 
          className="theme-toggle" 
          onClick={toggleTheme} 
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? <FiMoon /> : <FiSun />}
        </button>
        
        <div className="notification-container">
          {unviewedCount > 0 && (
            <span className="notification-badge">{unviewedCount}</span>
          )}
          <button 
            className="notification-button" 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          >
            {theme === "light" ? (
              <img src={bellIcon} alt="Notifications" className="notification-icon-img light" />
            ) : (
              <img src={bellIcon} alt="Notifications" className="notification-icon-img dark" />
            )}
          </button>
          
          {isNotificationsOpen && (
            <NotificationModal
              notifications={notifications}
              unviewedCount={unviewedCount}
              markAsRead={handleMarkAsRead}
              userServiceId={userData.id}
              onClose={() => setIsNotificationsOpen(false)}
              theme={theme}
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