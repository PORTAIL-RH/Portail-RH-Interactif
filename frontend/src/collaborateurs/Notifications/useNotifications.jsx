"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { API_URL } from "../../config"

const useNotifications = (role, serviceId) => {
  const [notifications, setNotifications] = useState([])
  const [unviewedCount, setUnviewedCount] = useState(0)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const clientRef = useRef(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (clientRef.current) {
        clientRef.current.deactivate()
        console.log("❌ WebSocket disconnected")
      }
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("authToken")
      const userId = localStorage.getItem("userId")

      if (!token || !userId) {
        console.warn("Authentication token or user ID not found")
        setError("Authentification requise")
        setLoading(false)
        return
      }

      // Construire l'URL en fonction de la présence de serviceId
      let url = `${API_URL}/api/notifications?role=${role}&serviceId=${serviceId}`

      console.log(`Fetching notifications with URL: ${url}`)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`HTTP error! status: ${response.status}, message: ${errorText}`)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log(`Received ${data.length} notifications`)

      if (isMountedRef.current) {
        setNotifications(data)
        // Filtrer les notifications non lues pour ce rôle et serviceId (si fourni)
        const filteredUnviewed = data.filter(notif => 
          !notif.viewed && 
          notif.role === role &&
          (serviceId ? notif.serviceId === serviceId : true)
        )
        setUnviewedCount(filteredUnviewed.length)
        setError("")
      }
    } catch (error) {
      console.error("Fetch notifications error:", error)
      if (isMountedRef.current) {
        setError("Impossible de récupérer les notifications.")
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [role, serviceId]) // Ajouter serviceId aux dépendances

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      const response = await fetch(`${API_URL}/api/notifications/${notificationId}/view`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (isMountedRef.current) {
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === notificationId ? { ...notif, viewed: true } : notif)),
        )
        setUnviewedCount((prev) => Math.max(prev - 1, 0))
      }
    } catch (error) {
      console.error("Mark as read error:", error)
      throw error
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken")
      const userId = localStorage.getItem("userId")

      if (!token || !userId) {
        throw new Error("Authentication token or user ID not found")
      }

      const payload = { role }
      // Inclure serviceId dans le payload si fourni
      if (serviceId) {
        payload.serviceId = serviceId
      }

      const response = await fetch(`${API_URL}/api/notifications/mark-all-read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Failed to mark notifications as read:", errorText)
        throw new Error(errorText || "Failed to mark notifications as read")
      }

      const result = await response.json()
      console.log(result.message, result.updatedCount)

      if (isMountedRef.current) {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, viewed: true })))
        setUnviewedCount(0)
      }

      return result
    } catch (error) {
      console.error("Mark all as read error:", error)
      throw error
    }
  }, [role, serviceId]) // Ajouter serviceId aux dépendances

  useEffect(() => {
    isMountedRef.current = true

    // Fetch notifications immediately when the hook is initialized
    fetchNotifications()

    const token = localStorage.getItem("authToken")
    if (!token) return

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_URL}/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => console.log("🛜 WebSocket:", str),
      connectHeaders: { Authorization: `Bearer ${token}` },
    })

    client.onConnect = () => {
      console.log("✅ WebSocket connected")

      // Créer le topic en fonction de role et serviceId
      const topic = serviceId 
        ? `/topic/notifications/${role}/${serviceId}`
        : `/topic/notifications/${role}`

      client.subscribe(topic, (message) => {
        try {
          const newNotification = JSON.parse(message.body)
          if (isMountedRef.current) {
            setNotifications((prev) => {
              // Vérifier si la notification est destinée à ce serviceId (si fourni)
              const shouldAdd = serviceId 
                ? newNotification.serviceId === serviceId
                : true
              
              // Check if notification already exists to avoid duplicates
              const exists = prev.some((n) => n.id === newNotification.id)
              return exists || !shouldAdd ? prev : [newNotification, ...prev]
            })

            if (!newNotification.viewed) {
              // Vérifier aussi le serviceId pour l'incrémentation du compteur
              const shouldCount = serviceId
                ? newNotification.serviceId === serviceId
                : true
              
              if (shouldCount) {
                setUnviewedCount((prev) => prev + 1)
              }
            }
          }
        } catch (error) {
          console.error("Error processing notification message:", error)
        }
      })
    }

    client.onStompError = (frame) => {
      console.error("WebSocket error:", frame.headers.message)
      if (isMountedRef.current) {
        setError("WebSocket connection error")
      }
    }

    client.activate()
    clientRef.current = client

    return () => {
      isMountedRef.current = false
      if (clientRef.current) {
        clientRef.current.deactivate()
      }
    }
  }, [role, serviceId, fetchNotifications]) // Ajouter serviceId aux dépendances

  return {
    notifications,
    unviewedCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  }
}

export default useNotifications