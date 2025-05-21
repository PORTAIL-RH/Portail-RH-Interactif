"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { API_URL } from "../../config"

const useNotifications = (role, personnelId = null) => {
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
      const userPersonnelId = personnelId || localStorage.getItem("userId")
      const token = localStorage.getItem("authToken")

      if (!userPersonnelId || !token) {
        console.warn("Missing auth token or personnel ID")
        return
      }

      const response = await fetch(
        `${API_URL}/api/notifications/unreadnbr?role=${role}&personnelId=${userPersonnelId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

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
  }, [role, personnelId])

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("authToken")
      const userPersonnelId = personnelId || localStorage.getItem("userId")
      const serviceId = localStorage.getItem("serviceId") || ""
      const codeSoc = localStorage.getItem("codeSoc") || ""

      if (!token || !userPersonnelId) {
        setError("Authentification requise")
        setLoading(false)
        return
      }

      const url = `${API_URL}/api/notifications?role=${role}&personnelId=${userPersonnelId}&serviceId=${serviceId}&codeSoc=${codeSoc}`

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
  }, [role, personnelId, fetchUnviewedCount])

  const markAsRead = useCallback(
    async (notificationId) => {
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
            prev.map((notif) => (notif.id === notificationId ? { ...notif, viewed: true } : notif)),
          )
          fetchUnviewedCount()
        }
      } catch (error) {
        console.error("Mark as read error:", error)
        throw error
      }
    },
    [fetchUnviewedCount],
  )

  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken")
      const userPersonnelId = personnelId || localStorage.getItem("userId")

      if (!token || !userPersonnelId) throw new Error("Authentication token or user ID not found")

      const payload = { role, personnelId: userPersonnelId }

      const response = await fetch(`${API_URL}/api/notifications/mark-all-read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Failed to mark all as read")

      const result = await response.json()

      if (isMountedRef.current) {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, viewed: true })))
        fetchUnviewedCount()
      }

      return result
    } catch (error) {
      console.error("Mark all as read error:", error)
      throw error
    }
  }, [role, personnelId, fetchUnviewedCount])

  useEffect(() => {
    fetchNotifications()

    const token = localStorage.getItem("authToken")
    const userPersonnelId = personnelId || localStorage.getItem("userId")
    if (!token || !userPersonnelId) return

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

      const topic = `/topic/notifications/${role}/${userPersonnelId}`

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
  }, [role, personnelId, fetchNotifications, fetchUnviewedCount])

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
