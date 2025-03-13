"use client"

import { useState, useEffect } from "react"
import useNotifications from "./useNotifications"
import NotificationModal from "./NotificationModal"
import "./Navbar.css"
import bellIcon from "../../../assets/bell1.png"
import { FiSun, FiMoon } from "react-icons/fi"

const Navbar = () => {
  const [userData, setUserData] = useState({
    id: "",
    firstName: "",
    lastName: "",
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [theme, setTheme] = useState("dark") // Default to dark theme
  const [notifications, setNotifications] = useState([]) // State for notifications
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const role = "RH"; // Récupérez le rôle de l'utilisateur (par exemple, depuis le contexte ou l'API)
  const userId = localStorage.getItem("userId") // Retrieve userId from localStorage
  const {
    notifications: hookNotifications,
    unviewedCount,
    fetchNotifications,
    markAsRead,
  } = useNotifications(role, userId)

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!userId) {
          throw new Error("User ID not found in localStorage.")
        }

        const response = await fetch(`http://localhost:8080/api/Personnel/byId/${userId}`)
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const data = await response.json()
        setUserData({
          id: data.id,
          firstName: data.nom || "",
          lastName: data.prenom || "",
        })
        setLoading(false)
      } catch (error) {
        setError(error.message)
        setLoading(false)
      }
    }

    fetchUserData()
  }, [userId])

  // SSE Logic for Real-Time Updates
  useEffect(() => {
    const eventSource = new EventSource("http://localhost:8080/sse/updates")

    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data)
      const { type, data } = update

      console.log("Received update:", type, data) // Debugging

      // Handle updates based on type
      switch (type) {
        case "new_notification":
          setNotifications((prevNotifications) => {
            const updatedNotifications = [...prevNotifications, data]
            localStorage.setItem("notifications", JSON.stringify(updatedNotifications))
            return updatedNotifications
          })
          break

        case "created":
        case "demande_updated":
          // Handle demande updates (e.g., refresh data on other pages)
          console.log("Demande updated:", data)

          const demandeTypeMap = {
            formation: "demandesFormation",
            PreAvnace: "demandesPreAvance",
            Document: "demandesDocument",
            autorisation: "demandesAutorisation",
            congé: "demandesConge",
          }

          const localStorageKey = demandeTypeMap[data.typeDemande] || "demandesOther"
          const demandes = JSON.parse(localStorage.getItem(localStorageKey) || "[]")

          let updatedDemandes
          if (type === "created") {
            updatedDemandes = [...demandes, data]
          } else {
            updatedDemandes = demandes.map((demande) => (demande.id === data.id ? { ...demande, ...data } : demande))
          }

          localStorage.setItem(localStorageKey, JSON.stringify(updatedDemandes))
          break

        default:
          console.warn("Unknown update type:", type)
      }
    }

    eventSource.onerror = (error) => {
      console.error("EventSource failed:", error)
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [])

  // Load notifications from localStorage on component mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem("notifications")
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications))
    }

    // Set dark theme by default
    document.documentElement.classList.add("dark")
    localStorage.setItem("theme", "dark")
  }, [])

  // Toggle notifications modal
  const toggleNotifications = () => {
    setIsNotificationsOpen((prev) => !prev)
  }

  // Mark notification as read
  const handleMarkAsRead = async (id) => {
    await markAsRead(id)
    fetchNotifications() // Refresh notifications after marking as read
  }

  // Theme toggle logic
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
    localStorage.setItem("theme", newTheme)
  }

  if (loading) {
    return <div className="navbar loading">Chargement des données...</div>
  }

  if (error) {
    return <div className="navbar error">Erreur: {error}</div>
  }

  return (
    <nav className="navbar">
      <div className="navbar-welcome">
        <span className="welcome-text">
          Welcome, {userData.firstName} {userData.lastName}
        </span>
      </div>
      <div className="navbar-actions">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === "light" ? "Passer au mode sombre" : "Passer au mode clair"}
        >
          {theme === "light" ? <FiMoon /> : <FiSun />}
        </button>
        <div className="notification-container">
          {unviewedCount > 0 && <span className="notification-badge">{unviewedCount}</span>}
          <button className="notification-button" onClick={toggleNotifications}>
            <img src={bellIcon || "/placeholder.svg"} alt="Notifications" className="notification-icon-img" />
          </button>
          {isNotificationsOpen && (
            <NotificationModal
              notifications={notifications}
              unviewedCount={unviewedCount}
              markAsRead={handleMarkAsRead}
              userServiceId={userId}
              onClose={() => setIsNotificationsOpen(false)}
            />
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
