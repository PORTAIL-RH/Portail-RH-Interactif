"use client"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import useNotifications from "../Navbar/useNotifications"
import "./Notifications.css"
import Sidebar from "../Sidebar/Sidebar"
import Navbar from "../Navbar/Navbar"
import { FiBell, FiCheckCircle, FiEye, FiFilter } from "react-icons/fi"

const Notifications = () => {
  const {
    notifications,
    unviewedCount,
    loading,
    error,
    markAllAsRead
  } = useNotifications()

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

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }

  // Calculate counts
  const readCount = notifications?.filter(n => 
    n.readBy?.includes(localStorage.getItem("userId"))
  ).length || 0
  const unreadCount = unviewedCount || 0
  const totalCount = notifications?.length || 0

  // Filter and sort notifications
  const filteredNotifications = notifications
    ?.filter(notification => {
      if (activeFilter === "unread") return !notification.readBy?.includes(localStorage.getItem("userId"))
      if (activeFilter === "read") return notification.readBy?.includes(localStorage.getItem("userId"))
      return true
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) || []

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className={`notifications-page-container ${sidebarCollapsed ? "collapsed" : ""}`}>
        <Navbar theme={theme} toggleTheme={toggleTheme} hideNotificationBadge />
        <div className="notifications-page-content">
          <div className="notifications-page-header">
            <h1>Notifications</h1>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
              >
                <FiCheckCircle size={18} />
                Tout marquer comme lu
              </button>
            )}
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
            <button
              className={`filter-btn ${activeFilter === "unread" ? "active" : ""}`}
              onClick={() => setActiveFilter("unread")}
            >
              <FiBell />
              <span>Non lues</span>
              <span className="filter-count">{unreadCount}</span>
            </button>
            <button
              className={`filter-btn ${activeFilter === "read" ? "active" : ""}`}
              onClick={() => setActiveFilter("read")}
            >
              <FiEye />
              <span>Lues</span>
              <span className="filter-count">{readCount}</span>
            </button>
          </div>

          <div className="notifications-page-list-container">
            {loading && <p className="loading-message">Chargement des notifications...</p>}
            {error && <p className="notifications-page-error">{error}</p>}

            {!loading && filteredNotifications.length > 0 ? (
              <div className="notifications-page-list">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-page-item ${
                      notification.readBy?.includes(localStorage.getItem("userId")) ? "read" : "unread"
                    }`}
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
              !loading && (
                <div className="notifications-page-empty">
                  <FiBell size={48} />
                  <p>
                    {activeFilter === "all" && "Vous n'avez aucune notification."}
                    {activeFilter === "unread" && "Vous n'avez aucune notification non lue."}
                    {activeFilter === "read" && "Vous n'avez aucune notification lue."}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Notifications