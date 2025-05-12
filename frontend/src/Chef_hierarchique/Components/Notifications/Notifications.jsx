"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import useNotifications from "../Navbar/useNotifications"
import "./Notifications.css"
import Sidebar from "../Sidebar/Sidebar"
import Navbar from "../Navbar/Navbar"
import { FiBell, FiCheckCircle, FiEye, FiFilter } from "react-icons/fi"

const Notifications = () => {
  // Get user data from localStorage
  const [userData, setUserData] = useState({
    role: "",
    serviceId: "",
  })
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState("light")
  const [activeFilter, setActiveFilter] = useState("all")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Fetch user data from local storage
  useEffect(() => {
    const storedUserData = localStorage.getItem("userData")
    const storedServiceId = localStorage.getItem("userServiceId")
    const storedRole = localStorage.getItem("userRole")

    if (storedUserData) {
      try {
        const parsedData = JSON.parse(storedUserData)
        setUserData({
          role: storedRole || parsedData.role || "Chef Hiérarchique",
          serviceId: storedServiceId || parsedData.serviceId || "",
        })
      } catch (error) {
        console.error("Error parsing user data:", error)
        setUserData({
          role: storedRole || "Chef Hiérarchique",
          serviceId: storedServiceId || "",
        })
      }
    } else {
      setUserData({
        role: storedRole || "Chef Hiérarchique",
        serviceId: storedServiceId || "",
      })
    }
    setLoading(false)
  }, [])

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark")
      document.documentElement.classList.add("dark")
    }
  }, [])

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
    localStorage.setItem("theme", newTheme)
  }

  // Sidebar toggle handler
  useEffect(() => {
    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail)
    }
    window.addEventListener("sidebarToggled", handleSidebarToggle)
    return () => window.removeEventListener("sidebarToggled", handleSidebarToggle)
  }, [])

  // Get notifications
  const { notifications, unviewedCount, markAllAsRead, error } = useNotifications(
    userData.role,
    userData.serviceId,
  )

  // Filter and sort notifications
  const filteredNotifications = notifications
    .filter((notification) => {
      if (notification.role !== userData.role) return false
      if (activeFilter === "unread") return !notification.viewed
      if (activeFilter === "read") return notification.viewed
      return true
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  // Count statistics
  const readCount = notifications.filter((n) => n.viewed && n.role === userData.role).length
  const unreadCount = notifications.filter((n) => !n.viewed && n.role === userData.role).length
  const totalCount = notifications.filter((n) => n.role === userData.role).length





  if (loading) {
    return <div className="loading-container">Loading...</div>
  }

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
