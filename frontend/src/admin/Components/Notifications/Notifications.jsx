import { useState, useEffect } from "react"
import { format } from "date-fns"
import useNotifications from "../Navbar/useNotifications"
import bellIcon from "../../../assets/bell.png"
import "./Notifications.css"
import Sidebar from "../Sidebar/Sidebar"
import Navbar from "../Navbar/Navbar"
import { API_URL } from "../../../config"

const Notifications = () => {
  const userData = JSON.parse(localStorage.getItem("userData") || {})
  const role = userData.role || "Admin"
  const userId = localStorage.getItem("userId")
  
  const { 
    notifications = [], 
    unviewedCount, 
    setUnviewedCount, 
    fetchNotifications, 
    error 
  } = useNotifications(role, userId)
  
  const [activeFilter, setActiveFilter] = useState("all")
  const [theme, setTheme] = useState("light")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail)
    }
    window.addEventListener('sidebarToggled', handleSidebarToggle)
    return () => window.removeEventListener('sidebarToggled', handleSidebarToggle)
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

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("authToken")
      await fetch(`${API_URL}/api/notifications/${id}/view`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      setUnviewedCount((prev) => Math.max(prev - 1, 0))
      await fetchNotifications()
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error)
    }
  }

  const filteredNotifications = notifications
    .filter((notification) => {
      if (notification.role !== role) return false
      if (activeFilter === "unread") return !notification.viewed
      if (activeFilter === "read") return notification.viewed
      return true
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  const readCount = notifications.filter(n => n.viewed).length
  const unreadCount = notifications.filter(n => !n.viewed).length
  const totalCount = notifications.length

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className={`notifications-chef-container ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Navbar theme={theme} toggleTheme={toggleTheme} hideNotificationBadge />
        <div className="notifications-chef-content">
          <div className="notification-section">
            <div className="notification-header">
              <h2>Notifications</h2>
              <span className="notification-badge-page">{unviewedCount}</span>
            </div>

            <div className="notification-filters">
              <button
                className={`filter-tab ${activeFilter === "all" ? "active" : ""}`}
                onClick={() => setActiveFilter("all")}
              >
                Toutes <span className="count">{totalCount}</span>
              </button>
              <button
                className={`filter-tab ${activeFilter === "unread" ? "active" : ""}`}
                onClick={() => setActiveFilter("unread")}
              >
                Non lues <span className="count">{unreadCount}</span>
              </button>
              <button
                className={`filter-tab ${activeFilter === "read" ? "active" : ""}`}
                onClick={() => setActiveFilter("read")}
              >
                Lues <span className="count">{readCount}</span>
              </button>
            </div>

            {error && <p className="error-message">{error}</p>}

            {filteredNotifications.length > 0 ? (
              <div className="notification-list">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification ${notification.viewed ? "read" : "unread"}`}
                    onClick={() => !notification.viewed && markAsRead(notification.id)}
                  >
                    <img src={bellIcon} alt="Bell Icon" className="bell-icon" />
                    <div className="notification-content">
                      <p>{notification.message}</p>
                      <span className="notification-timestamp">
                        {format(new Date(notification.timestamp), "yyyy-MM-dd HH:mm")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔔</div>
                <p className="empty-text">
                  {activeFilter === "all" && "Vous n'avez aucune notification."}
                  {activeFilter === "unread" && "Vous n'avez aucune notification non lue."}
                  {activeFilter === "read" && "Vous n'avez aucune notification lue."}
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