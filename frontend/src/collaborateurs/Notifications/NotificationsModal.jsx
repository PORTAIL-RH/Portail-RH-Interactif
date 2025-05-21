"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FiBell, FiFileText, FiClock, FiCheckCircle, FiInfo, FiX, FiChevronRight } from "react-icons/fi"
import { format } from "date-fns"
import "./NotificationsModal.css"

const API_URL = process.env.REACT_APP_API_URL

const NotificationModal = ({ notifications = [], onClose, onMarkAsRead }) => {
  const navigate = useNavigate()
  const [filteredNotifications, setFilteredNotifications] = useState([])
  const personnelId = localStorage.getItem("userId")

  // Update the useEffect to handle both timestamp and createdAt fields and add better error handling
  useEffect(() => {
    // Log the notifications received for debugging
    console.log(`NotificationModal received ${notifications.length} notifications`)

    // Sort notifications by timestamp (newest first) and limit to 5
    // Handle both timestamp and createdAt fields
    const sorted = [...notifications]
      .sort((a, b) => {
        const dateA = new Date(a.timestamp || a.createdAt || 0)
        const dateB = new Date(b.timestamp || b.createdAt || 0)
        return dateB - dateA
      })
      .slice(0, 5)

    console.log(`Filtered to ${sorted.length} notifications for display`)
    setFilteredNotifications(sorted)
  }, [notifications])

  // Update the formatTimestamp function to handle both fields
  const formatTimestamp = (timestamp, notification) => {
    // Try to use timestamp, fall back to createdAt if timestamp is not available
    const dateStr = timestamp || notification?.createdAt

    if (!dateStr) return "Date inconnue"

    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return "Date inconnue"

      const now = new Date()
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 1) {
        return "À l'instant"
      } else if (diffMins < 60) {
        return `Il y a ${diffMins} minute${diffMins > 1 ? "s" : ""}`
      } else if (diffHours < 24) {
        return `Il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`
      } else if (diffDays < 7) {
        return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`
      } else {
        return format(date, "dd/MM/yyyy, HH:mm")
      }
    } catch (e) {
      console.error("Error formatting date:", e)
      return "Date inconnue"
    }
  }

  const getNotificationIcon = (message) => {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("approuvée") || lowerMessage.includes("acceptée")) {
      return <FiCheckCircle className="notification-icon success" />
    } else if (lowerMessage.includes("rejetée") || lowerMessage.includes("refusée")) {
      return <FiX className="notification-icon danger" />
    } else if (lowerMessage.includes("attente") || lowerMessage.includes("en cours")) {
      return <FiClock className="notification-icon warning" />
    } else if (lowerMessage.includes("document") || lowerMessage.includes("fichier")) {
      return <FiFileText className="notification-icon document" />
    } else {
      return <FiBell className="notification-icon info" />
    }
  }

  const getNotificationTitle = (message) => {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("approuvée") || lowerMessage.includes("acceptée")) {
      return "Demande approuvée"
    } else if (lowerMessage.includes("rejetée") || lowerMessage.includes("refusée")) {
      return "Demande rejetée"
    } else if (lowerMessage.includes("attente") || lowerMessage.includes("en cours")) {
      return "Demande en attente"
    } else if (lowerMessage.includes("document") || lowerMessage.includes("fichier")) {
      return "Nouveau document"
    } else {
      return "Notification"
    }
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.viewed) {
      try {
        const token = localStorage.getItem("authToken")
        if (!token) return

        // Mark notification as read
        await fetch(`${API_URL}/api/notifications/${notification.id}/view`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        // If onMarkAsRead callback is provided, call it to refresh the notification count
        if (onMarkAsRead) {
          onMarkAsRead()
        }
      } catch (error) {
        console.error("Error marking notification as read:", error)
      }
    }
  }

  const handleViewMore = () => {
    navigate("/NotificationsCollab")
    onClose()
  }

  return (
    <div className="notifications-modal-overlay" onClick={onClose}>
      <div className="notifications-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notifications-modal-header">
          <h3>Notifications</h3>
          <button className="close-button" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="notifications-modal-content">
          {filteredNotifications.length === 0 ? (
            <div className="modal-empty-state">
              <div className="modal-empty-icon">
                <FiInfo />
              </div>
              <p>Aucune notification</p>
            </div>
          ) : (
            <ul className="modal-notifications-list">
              {filteredNotifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`modal-notification-item ${notification.viewed ? "read" : "unread"}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="modal-notification-content">
                    <div className="modal-notification-icon-container">{getNotificationIcon(notification.message)}</div>
                    <div className="modal-notification-details">
                      <div className="modal-notification-title">{getNotificationTitle(notification.message)}</div>
                      <div className="modal-notification-message">{notification.message}</div>
                      <div className="modal-notification-time">
                        {formatTimestamp(notification.timestamp, notification)}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="notifications-modal-footer">
          <button className="view-all-button" onClick={handleViewMore}>
            Voir toutes les notifications
            <FiChevronRight />
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotificationModal
