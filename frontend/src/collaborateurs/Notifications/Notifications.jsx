
import { useState } from "react"
import { format } from "date-fns"
import { useNavigate } from "react-router-dom"
import Navbar from "../Components/Navbar/Navbar"
import Sidebar from "../Components/Sidebar/Sidebar"
import { FiBell, FiFileText, FiClock, FiAlertCircle, FiCheckCircle, FiRefreshCw, FiX } from "react-icons/fi"
import "./Notifications.css"
import useNotifications from "./useNotifications"

const Notifications = () => {
  const navigate = useNavigate()
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)

  // Get user data from localStorage
  const userRole = localStorage.getItem("userRole") || "Collaborateur"
  const userId = localStorage.getItem("userId")

  // Use the notifications hook with personnelId
  const { notifications, loading, error, fetchNotifications, markAsRead } = useNotifications(
    userRole,
    userId,
  )

  // Sort notifications by timestamp (newest first)
  const sortedNotifications = [...notifications].sort((a, b) => {
    const dateA = new Date(b.timestamp || b.createdAt || 0)
    const dateB = new Date(a.timestamp || a.createdAt || 0)
    return dateA - dateB
  })

  const handleNotificationClick = async (notification) => {
    // If notification is not viewed, mark it as viewed
    if (!notification.viewed) {
      try {
        await markAsRead(notification.id)
        // Update the notification in the list
        fetchNotifications()
      } catch (error) {
        console.error("Error marking notification as read:", error)
      }
    }

    // Show notification details
    setSelectedNotification(notification)
    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
    setSelectedNotification(null)
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Date inconnue"

    try {
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) return "Date inconnue"

      const now = new Date()
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)

      if (date.toDateString() === now.toDateString()) {
        return `Aujourd'hui, ${format(date, "HH:mm")}`
      } else if (date.toDateString() === yesterday.toDateString()) {
        return `Hier, ${format(date, "HH:mm")}`
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

  return (
    <div className="app-container">
      <Sidebar />
      <div className="notifications-container">
        <Navbar />
        <div className="notifications-content">
          <div className="notifications-header">
            <h1 className="notifications-header">Notifications</h1>
            <div className="notifications-actions">
              <div className="header-actions">
                <button className="refresh-button" onClick={fetchNotifications}>
                  <FiRefreshCw />
                </button>
                
              </div>
            </div>
          </div>

          <div className="notifications-content">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Chargement des notifications...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <FiAlertCircle className="error-icon" />
                <p>{error}</p>
                <button onClick={fetchNotifications}>Réessayer</button>
              </div>
            ) : sortedNotifications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <FiBell />
                </div>
                <h3>Aucune notification</h3>
                <p>Vous n'avez pas de notifications pour le moment.</p>
              </div>
            ) : (
              <ul className="notifications-list">
                {sortedNotifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`notification-item ${notification.viewed ? "read" : "unread"}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-content">
                      <div className="notification-icon-container">{getNotificationIcon(notification.message)}</div>
                      <div className="notification-details">
                        <div className="notification-title">{getNotificationTitle(notification.message)}</div>
                        <div className="notification-message">{notification.message}</div>
                        <div className="notification-time">{formatTimestamp(notification.timestamp)}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Notification Details Modal */}
      {modalVisible && selectedNotification && (
        <div className="notification-detail-modal-overlay" onClick={closeModal}>
          <div className="notification-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-container">{getNotificationIcon(selectedNotification.message)}</div>
              <h3>{getNotificationTitle(selectedNotification.message)}</h3>
              <button className="close-modal-button" onClick={closeModal}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-message">{selectedNotification.message}</p>
              <div className="modal-details">
                <div className="detail-row">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">{formatTimestamp(selectedNotification.timestamp)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Statut:</span>
                  <span className="detail-value">{selectedNotification.viewed ? "Lu" : "Non lu"}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-close-button" onClick={closeModal}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Notifications
