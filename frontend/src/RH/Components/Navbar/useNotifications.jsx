import { useState, useEffect, useRef, useCallback } from "react"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { API_URL } from "../../../config"

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

  const fetchUnviewedCount = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken")
      const userId = localStorage.getItem("userId")

      if (!token || !userId) {
        console.warn("Missing auth token or user ID")
        return
      }

      let url = `${API_URL}/api/notifications/unreadnbr?role=${role}`
      if (serviceId && role !== "Admin") {
        url += `&serviceId=${serviceId}`
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch unread count")
      }

      const count = await response.json()
      if (isMountedRef.current) {
        setUnviewedCount(count)
      }
    } catch (error) {
      console.error("Error fetching unread count:", error)
    }
  }, [role, serviceId])

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("authToken")
      const userId = localStorage.getItem("userId")

      if (!token || !userId) {
        setError("Authentification requise")
        setLoading(false)
        return
      }

      let url = `${API_URL}/api/notifications?role=${role}`
      if (serviceId && role !== "Admin") {
        url += `&serviceId=${serviceId}`
      }

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const data = await response.json()

      if (isMountedRef.current) {
        setNotifications(data)
        setError("")
      }

      fetchUnviewedCount()
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
  }, [role, serviceId, fetchUnviewedCount])

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem("authToken")
      if (!token) throw new Error("Authentication token not found")

      const response = await fetch(`${API_URL}/api/notifications/${notificationId}/view`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      if (isMountedRef.current) {
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === notificationId ? { ...notif, viewed: true } : notif))
        )
        fetchUnviewedCount()
      }
    } catch (error) {
      console.error("Mark as read error:", error)
      throw error
    }
  }, [fetchUnviewedCount])

  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken")
      const userId = localStorage.getItem("userId")

      if (!token || !userId) throw new Error("Authentication token or user ID not found")

      const payload = { role }
      if (serviceId && role !== "Admin") {
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

      if (!response.ok) throw new Error("Failed to mark all as read")

      if (isMountedRef.current) {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, viewed: true })))
        fetchUnviewedCount()
      }

      return true
    } catch (error) {
      console.error("Mark all as read error:", error)
      throw error
    }
  }, [role, serviceId, fetchUnviewedCount])

  useEffect(() => {
    fetchNotifications()

    const token = localStorage.getItem("authToken")
    const userId = localStorage.getItem("userId")
    if (!token || !userId) return

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

      const topic = serviceId && role !== "Admin" 
        ? `/topic/notifications/${role}/${serviceId}`
        : `/topic/notifications/${role}`

      client.subscribe(topic, (message) => {
        try {
          const newNotification = JSON.parse(message.body)
          if (isMountedRef.current) {
            const exists = notifications.some((n) => n.id === newNotification.id)
            if (!exists) {
              setNotifications((prev) => [newNotification, ...prev])
              fetchUnviewedCount()
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
      if (clientRef.current) clientRef.current.deactivate()
    }
  }, [role, serviceId, fetchNotifications, fetchUnviewedCount, notifications])

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