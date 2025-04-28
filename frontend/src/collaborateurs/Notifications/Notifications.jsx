import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../Components/Navbar/Navbar"
import Sidebar from "../Components/Sidebar/Sidebar"
import {
  FiCheck,
  FiTrash2,
  FiFileText,
  FiCalendar,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiRefreshCw,
} from "react-icons/fi"
import "./Notifications.css"
import { API_URL } from "../../config"; 

const Notifications = () => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState("all") // all, unread, read

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const userId = localStorage.getItem("userId")
      const token = localStorage.getItem("authToken")

      if (!userId || !token) {
        navigate("/")
        return
      }

      let url = `${API_URL}/api/notifications/${userId}`
      if (filter === "unread") {
        url = `${API_URL}/api/notifications/unread/${userId}`
      } else if (filter === "read") {
        url = `${API_URL}/api/notifications/read/${userId}`
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des notifications")
      }

      const data = await response.json()
      setNotifications(data)
      setError(null)
    } catch (err) {
      console.error("Error fetching notifications:", err)
      setError("Impossible de charger les notifications. Veuillez réessayer plus tard.")
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("authToken")
      const response = await fetch(`${API_URL}/api/notifications/read/${notificationId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        // Update the notification in the state
        setNotifications(
          notifications.map((notification) =>
            notification.id === notificationId ? { ...notification, read: true } : notification,
          ),
        )
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem("authToken")
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        // Remove the notification from the state
        setNotifications(notifications.filter((notification) => notification.id !== notificationId))
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const userId = localStorage.getItem("userId")
      const token = localStorage.getItem("authToken")
      const response = await fetch(`${API_URL}/api/notifications/readAll/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        // Update all notifications in the state
        setNotifications(notifications.map((notification) => ({ ...notification, read: true })))
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case "DOCUMENT":
        return <FiFileText className="notification-icon document" />
      case "LEAVE":
        return <FiCalendar className="notification-icon leave" />
      case "REMINDER":
        return <FiClock className="notification-icon reminder" />
      case "WARNING":
        return <FiAlertCircle className="notification-icon warning" />
      case "SUCCESS":
        return <FiCheckCircle className="notification-icon success" />
      default:
        return <FiInfo className="notification-icon info" />
    }
  }

  const handleNotificationClick = (notification) => {
    // If notification is not read, mark it as read
    if (!notification.read) {
      markAsRead(notification.id)
    }

    // Navigate based on notification type and reference
    if (notification.type === "DOCUMENT" && notification.referenceId) {
      navigate(`/documents/${notification.referenceId}`)
    } else if (notification.type === "LEAVE" && notification.referenceId) {
      navigate(`/conges/${notification.referenceId}`)
    } else if (notification.link) {
      navigate(notification.link)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
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
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    }
  }

  return (
    <div className="app-container">
    <Sidebar />
    <div className="notifications-container">
      <Navbar />
    <div className="notifications-content">
      <div className="notifications-header">
        <h1>Notifications</h1>
        <div className="notifications-actions">
          <div className="filter-buttons">
            <button className={`filter-button ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
              Toutes
            </button>
            <button
              className={`filter-button ${filter === "unread" ? "active" : ""}`}
              onClick={() => setFilter("unread")}
            >
              Non lues
            </button>
            <button className={`filter-button ${filter === "read" ? "active" : ""}`} onClick={() => setFilter("read")}>
              Lues
            </button>
          </div>
          <div className="header-actions">
            <button className="refresh-button" onClick={fetchNotifications}>
              <FiRefreshCw />
            </button>
            <button className="mark-all-button" onClick={markAllAsRead}>
              Tout marquer comme lu
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
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FiInfo />
            </div>
            <h3>Aucune notification</h3>
            <p>
              {filter === "all"
                ? "Vous n'avez pas de notifications pour le moment."
                : filter === "unread"
                  ? "Vous n'avez pas de notifications non lues."
                  : "Vous n'avez pas de notifications lues."}
            </p>
          </div>
        ) : (
          <ul className="notifications-list">
            {notifications.map((notification) => (
              <li key={notification.id} className={`notification-item ${notification.read ? "read" : "unread"}`}>
                <div className="notification-content" onClick={() => handleNotificationClick(notification)}>
                  <div className="notification-icon-container">{getNotificationIcon(notification.type)}</div>
                  <div className="notification-details">
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{formatDate(notification.createdAt)}</div>
                  </div>
                </div>
                <div className="notification-actions">
                  {!notification.read && (
                    <button
                      className="action-button read-button"
                      onClick={() => markAsRead(notification.id)}
                      aria-label="Marquer comme lu"
                    >
                      <FiCheck />
                    </button>
                  )}
                  <button
                    className="action-button delete-button"
                    onClick={() => deleteNotification(notification.id)}
                    aria-label="Supprimer"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>    </div>
    </div>

  )
}

export default Notifications

