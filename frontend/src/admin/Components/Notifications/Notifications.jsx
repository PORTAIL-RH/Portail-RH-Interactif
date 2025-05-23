import { useState, useEffect } from "react"
import { format } from "date-fns"
import useNotifications from "../Navbar/useNotifications"
import "./Notifications.css"
import Sidebar from "../Sidebar/Sidebar"
import Navbar from "../Navbar/Navbar"
import { FiBell, FiCheckCircle, FiEye, FiFilter } from "react-icons/fi"

const Notifications = () => {
  const userData = JSON.parse(localStorage.getItem("userData") || "{}")
  const role = userData.role || "Admin"
  const userId = localStorage.getItem("userId")

  const {
    notifications = [],
    unviewedCount,
    fetchNotifications,
    error,
  } = useNotifications(role, userId)

  const [activeFilter, setActiveFilter] = useState("all")
  const [theme, setTheme] = useState("light")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail)
    }
    window.addEventListener("sidebarToggled", handleSidebarToggle)
    return () => window.removeEventListener("sidebarToggled", handleSidebarToggle)
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    setTheme(savedTheme)
    document.documentElement.classList.add(savedTheme)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    document.documentElement.classList.replace(theme, newTheme)
    localStorage.setItem("theme", newTheme)
  }



  const filteredNotifications = notifications
    .filter((notification) => {
      if (notification.role !== role) return false
      if (activeFilter === "unread") return !notification.viewed
      if (activeFilter === "read") return notification.viewed
      return true
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  const readCount = notifications.filter((n) => n.viewed && n.role === role).length
  const unreadCount = notifications.filter((n) => !n.viewed && n.role === role).length
  const totalCount = notifications.filter((n) => n.role === role).length

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className={`notifications-page-container ${sidebarCollapsed ? "collapsed" : ""}`}>
        <Navbar theme={theme} toggleTheme={toggleTheme} hideNotificationBadge />
        <div className="notifications-page-content">
          <div className="notifications-page-header">
            <h1>Notifications</h1>
            
          </div>

          <div className="notifications-page-filters">
            <button
              className={`filter-btn ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              <FiFilter />
              <span>Toutes</span>
              <span className="filter-count">{totalCount}</span>
            </button>
          
          </div>

          <div className="notifications-page-list-container">
            {error && <p className="notifications-page-error">{error}</p>}

            {filteredNotifications.length > 0 ? (
              <div className="notifications-page-list">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-page-item ${notification.viewed ? "read" : "unread"}`}
                    
                  >
                    <div className="notification-page-icon">
                      <FiBell size={20} />
                    </div>
                    <div className="notification-page-content">
                      <p className="notification-page-message">{notification.message}</p>
                      <span className="notification-page-time">
                        {format(new Date(notification.timestamp), "dd/MM/yyyy à HH:mm")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="notifications-page-empty">
                <FiBell size={48} />
                <p>
                  {activeFilter === "all" && "Vous n'avez aucune notification."}
                  
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Notifications
