"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import useNotifications from "../Navbar/useNotifications"
import "./Notifications.css"
import Sidebar from "../Sidebar/Sidebar"
import Navbar from "../Navbar/Navbar"

const Notifications = () => {
  const role = "Chef Hiérarchique" // Rôle de l'utilisateur
  const [userServiceId, setUserServiceId] = useState(null)

  // Fetch userServiceId from local storage
  useEffect(() => {
    const storedServiceId = localStorage.getItem("userServiceId")
    if (storedServiceId) {
      setUserServiceId(storedServiceId)
    } else {
      console.error("userServiceId not found in local storage")
    }
  }, [])

  const { notifications, unviewedCount, markAsRead, error } = useNotifications(role, userServiceId)

  // Filtrer et trier les notifications
  const sortedNotifications = [...notifications]
    .filter((notification) => {
      return notification.role === role && notification.serviceId === userServiceId
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  console.log("All Notifications:", notifications)
  console.log("Filtered Notifications:", sortedNotifications)
  console.log("Role:", role, "Service ID:", userServiceId)

  if (!userServiceId) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <Navbar userServiceId={userServiceId} />
      <div className="main-content">
        <Sidebar />
        <div className="content-area">
          <div className="page-header">
            <h1>Aperçu du Tableau de Bord</h1>
            <p className="subtitle">Bienvenue, CHEF. Voici ce qui se passe avec votre équipe aujourd'hui.</p>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-card notification-card">
              <div className="card-header">
                <h2 className="card-title">Notifications</h2>
              </div>

              <div className="card-content">
                <div className="notification-stats">
                  <div className="stat-box">
                    <div className="stat-icon unread-icon">
                      <i className="bell-icon"></i>
                    </div>
                    <div className="stat-info">
                      <span className="stat-label">Non lues</span>
                      <span className="stat-value">{unviewedCount}</span>
                    </div>
                  </div>

                  <div className="stat-box">
                    <div className="stat-icon total-icon">
                      <i className="envelope-icon"></i>
                    </div>
                    <div className="stat-info">
                      <span className="stat-label">Total</span>
                      <span className="stat-value">{notifications.length}</span>
                    </div>
                  </div>
                </div>

                {error && <p className="error-message">{error}</p>}

                {sortedNotifications.length > 0 ? (
                  <div className="notification-list">
                    {sortedNotifications.slice(0, 5).map((notification) => {
                      const notificationDate = new Date(notification.timestamp)
                      if (isNaN(notificationDate.getTime())) {
                        console.error("Invalid date value:", notification.timestamp)
                        return null
                      }

                      return (
                        <div
                          key={notification.id}
                          className={`notification-item ${notification.viewed ? "read" : "unread"}`}
                          onClick={() => !notification.viewed && markAsRead(notification.id)}
                        >
                          <div className="notification-content">
                            <p className="notification-message">{notification.message}</p>
                            <span className="notification-time">{format(notificationDate, "yyyy-MM-dd HH:mm")}</span>
                          </div>
                        </div>
                      )
                    })}

                    {sortedNotifications.length > 5 && (
                      <div className="view-all-link">
                        <a href="/all-notifications">Voir toutes les notifications</a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>Aucune notification.</p>
                  </div>
                )}
              </div>
            </div>

            {/* You can add other dashboard cards here */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Notifications

