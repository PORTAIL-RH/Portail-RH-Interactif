import { useState, useEffect } from "react"
import { format } from "date-fns"
import useNotifications from "../Navbar/useNotifications"
import bellIcon from "../../../assets/bell.png"
import "./Notifications.css"
import Sidebar from "../Sidebar/Sidebar"
import Navbar from "../Navbar/Navbar"
import { API_URL } from "../../../config"

const Notifications = () => {
  const role = "RH" // Rôle de l'utilisateur actuel
  const { notifications = [], unviewedCount, setUnviewedCount, fetchNotifications, error } = useNotifications(role)
  const [theme, setTheme] = useState("light")
  const [filterType, setFilterType] = useState("all") // Filter options: all, read, unread

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    setTheme(savedTheme)
    applyTheme(savedTheme)

    // Listen for theme changes
    const handleStorageChange = () => {
      const currentTheme = localStorage.getItem("theme") || "light"
      setTheme(currentTheme)
      applyTheme(currentTheme)
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("themeChanged", (e) => {
      setTheme(e.detail || "light")
      applyTheme(e.detail || "light")
    })

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("themeChanged", handleStorageChange)
    }
  }, [])

  const applyTheme = (theme) => {
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(theme)
    document.body.className = theme
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    applyTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }))
  }

  // Mark a notification as read
  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        console.error("No authentication token found.")
        return
      }

      const response = await fetch(`${API_URL}/api/notifications/${id}/view`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to mark notification as read.")
      }

      // Update the unviewed count
      setUnviewedCount((prev) => Math.max(prev - 1, 0))

      // Refresh notifications
      await fetchNotifications()
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  // Filter and sort notifications based on the selected filter
  const filteredNotifications = [...notifications]
    .filter((notification) => notification.role === role) // Filter by role
    .filter((notification) => {
      if (filterType === "all") return true
      if (filterType === "read") return notification.viewed
      if (filterType === "unread") return !notification.viewed
      return true
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Sort by date (newest first)

  // Count of read notifications
  const readCount = notifications.filter((notification) => notification.role === role && notification.viewed).length

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className="notifications-chef-container">
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <div className="contenttf">
          <div className="notification-section">
            <div className="notification-header">
              <h2>Notifications</h2>
              {unviewedCount > 0 && <span className="notification-badge">{unviewedCount}</span>}
            </div>

            <div className="notification-filter-bar">
              <button
                className={`filter-button ${filterType === "all" ? "active" : ""}`}
                onClick={() => setFilterType("all")}
              >
                All
                <span className="filter-count">{notifications.filter((n) => n.role === role).length}</span>
              </button>
              <button
                className={`filter-button ${filterType === "unread" ? "active" : ""}`}
                onClick={() => setFilterType("unread")}
              >
                Unread
                <span className="filter-count">{unviewedCount}</span>
              </button>
              <button
                className={`filter-button ${filterType === "read" ? "active" : ""}`}
                onClick={() => setFilterType("read")}
              >
                Read
                <span className="filter-count">{readCount}</span>
              </button>
            </div>

            {error && <p className="error-message">{error}</p>}

            {filteredNotifications.length > 0 ? (
              <div className="notification-list">
                {filteredNotifications.map((notification) => {
                  const notificationDate = new Date(notification.timestamp)
                  if (isNaN(notificationDate.getTime())) {
                    console.error("Invalid date value:", notification.timestamp)
                    return null
                  }

                  return (
                    <div
                      key={notification.id}
                      className={`notification ${notification.viewed ? "read" : "unread"}`}
                      onClick={() => !notification.viewed && markAsRead(notification.id)}
                    >
                      <img src={bellIcon || "/placeholder.svg"} alt="Bell Icon" className="bell-icon" />
                      <p>{notification.message}</p>
                      <span className="notification-timestamp">{format(notificationDate, "yyyy-MM-dd HH:mm")}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="empty-notification-message">
                {filterType === "all"
                  ? "Aucune notification."
                  : filterType === "read"
                    ? "Aucune notification lue."
                    : "Aucune notification non lue."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Notifications

