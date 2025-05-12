import { useState, useEffect, useRef } from "react"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { API_URL } from "../../../config"

const useNotifications = (role, serviceId) => {
  const [notifications, setNotifications] = useState([])
  const [unviewedCount, setUnviewedCount] = useState(0)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const clientRef = useRef(null)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("authToken")
      
      // Construire l'URL en fonction de la présence de serviceId
      let url = `${API_URL}/api/notifications?role=${role}`
      if (serviceId && role !== "Admin") {
        url += `&serviceId=${serviceId}`
      }

      const response = await fetch(url, {
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

      // Compter les notifications non lues
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
          serviceId: role !== "Admin" ? serviceId : null, // Envoyer serviceId seulement si ce n'est pas un Admin
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors du marquage des notifications comme lues")
      }

      // Mettre à jour le compteur immédiatement
      setUnviewedCount(0)

      // Actualiser les notifications
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
      const subscriptionPath = serviceId && role !== "Admin" 
        ? `/topic/notifications/${role}/${serviceId}`
        : `/topic/notifications/${role}`
      
      client.subscribe(subscriptionPath, (message) => {
        const newNotification = JSON.parse(message.body)
        setNotifications((prev) => [newNotification, ...prev])
        setUnviewedCount((prevCount) => prevCount + 1)
      })
    }

    client.activate()
    clientRef.current = client

    // Configurer le polling pour les notifications
    const interval = setInterval(fetchNotifications, 30000)

    return () => {
      client.deactivate()
      console.log("❌ WebSocket déconnecté")
      clearInterval(interval)
    }
  }, [role, serviceId])

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