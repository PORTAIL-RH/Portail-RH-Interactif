"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import useNotifications from "../Navbar/useNotifications"
import "./Notifications.css"
import Sidebar from "../Sidebar/Sidebar"
import Navbar from "../Navbar/Navbar"

const Notifications = () => {
  const [userData, setUserData] = useState({
    role: "",
    serviceId: "",
  })
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState("light")

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

  const { notifications, unviewedCount, markAsRead, error } = useNotifications(userData.role, userData.serviceId)

  // Filter and sort notifications
  const sortedNotifications = [...notifications]
    .filter((notification) => {
      // If serviceId is not available, only filter by role
      if (!userData.serviceId) {
        return notification.role === userData.role
      }
      return notification.role === userData.role && notification.serviceId === userData.serviceId
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  if (loading) {
    return <div className="loading-container">Loading...</div>
  }

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className="notifications-chef-container">
        <Navbar userServiceId={userData.serviceId} theme={theme} toggleTheme={toggleTheme} />
        <div className="contenttf">
          <div className="notification-wrapper">
            <div className="notification-header">
              <div className="notification-title">
                <span className="notification-bell">&#128276;</span>
                <h2>Notifications</h2>
                {unviewedCount > 0 && <span className="notification-count">{unviewedCount}</span>}
              </div>
            </div>

            {error && <p className="error-message">{error}</p>}

            {sortedNotifications.length > 0 ? (
              <div className="notification-list">
                {sortedNotifications.map((notification) => {
                  const notificationDate = new Date(notification.timestamp)
                  if (isNaN(notificationDate.getTime())) {
                    console.error("Invalid date value:", notification.timestamp)
                    return null
                  }

                  return (
                    <div
                      key={notification.id}
                      className={`notification-item ${!notification.viewed ? "unread" : ""}`}
                      onClick={() => !notification.viewed && markAsRead(notification.id)}
                    >
                      <div className="notification-icon">
                        <span className="bell-icon">&#128276;</span>
                      </div>
                      <div className="notification-content">
                        <p className="notification-message">
                          Nouvelle demande d'autorisation ajoutée avec succès par Doe John (Service: IT Department)
                        </p>
                        <span className="notification-timestamp">{format(notificationDate, "yyyy-MM-dd HH:mm")}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="no-notifications">Aucune notification.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Notifications
