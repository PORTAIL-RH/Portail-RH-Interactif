import { useState, useEffect, useRef } from "react"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { API_URL } from "../../../config"

const useNotifications = (role, serviceId, userId) => {
  const [notifications, setNotifications] = useState([])
  const [unviewedCount, setUnviewedCount] = useState(0)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const clientRef = useRef(null)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("authToken")
      const response = await fetch(`${API_URL}/api/notifications?role=${role}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des notifications")
      }

      const data = await response.json()
      setNotifications(data)

      // Count unviewed notifications
      const unviewed = data.filter((notification) => !notification.viewed).length
      setUnviewedCount(unviewed)

      setError(null)
    } catch (err) {
      console.error("Erreur:", err)
      setError("Impossible de charger les notifications")
    } finally {
      setLoading(false)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("authToken")
      const response = await fetch(`${API_URL}/api/notifications/mark-all-read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role,
          serviceId: userId,
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors du marquage des notifications comme lues")
      }

      // Update the unviewed count immediately
      setUnviewedCount(0)

      // Refresh notifications
      await fetchNotifications()

      return true
    } catch (err) {
      console.error("Erreur:", err)
      setError("Impossible de marquer les notifications comme lues")
      return false
    }
  }

  useEffect(() => {
    fetchNotifications()

    const token = localStorage.getItem("authToken")
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_URL}/ws`),
      reconnectDelay: 5000,
      debug: (str) => console.log("🛜 WebSocket:", str),
      connectHeaders: { Authorization: `Bearer ${token}` },
    })

    client.onConnect = () => {
      console.log("✅ WebSocket connecté")

      // Souscrire aux notifications spécifiques au rôle
      client.subscribe(`/topic/notifications/${role}`, (message) => {
        const newNotification = JSON.parse(message.body)
        setNotifications((prev) => [newNotification, ...prev])
        setUnviewedCount((prevCount) => prevCount + 1)
      })
    }

    client.activate()
    clientRef.current = client

    // Set up polling for notifications
    const interval = setInterval(fetchNotifications, 30000)

    return () => {
      client.deactivate()
      console.log("❌ WebSocket déconnecté")
      clearInterval(interval)
    }
  }, [role, userId])

  return {
    notifications,
    unviewedCount,
    setUnviewedCount,
    loading,
    error,
    fetchNotifications,
    markAllAsRead,
  }
}

export default useNotifications
