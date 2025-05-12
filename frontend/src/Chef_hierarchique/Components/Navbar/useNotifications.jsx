import { useState, useEffect, useRef, useCallback } from "react"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"

const useNotifications = (role, userServiceId) => {
  const [notifications, setNotifications] = useState([])
  const [unviewedCount, setUnviewedCount] = useState(0)
  const [error, setError] = useState("")
  const clientRef = useRef(null)
  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (clientRef.current) {
        clientRef.current.deactivate()
      }
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      const url = "http://localhost:8080/api/notifications"
      const params = new URLSearchParams({ role })
      if (role === "Chef Hiérarchique" && userServiceId) {
        params.append("serviceId", userServiceId)
      }

      const response = await fetch(`${url}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (isMountedRef.current) {
        setNotifications(data)
        setUnviewedCount(data.filter((notif) => !notif.viewed).length)
      }
    } catch (error) {
      console.error("Fetch notifications error:", error)
      if (isMountedRef.current) {
        setError(error.message)
      }
    }
  }, [role, userServiceId])

  const markAsRead = useCallback(async (id) => {
    try {
      const token = localStorage.getItem("authToken")
      const response = await fetch(`http://localhost:8080/api/notifications/${id}/view`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (isMountedRef.current) {
        setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, viewed: true } : notif)))
        setUnviewedCount((prev) => Math.max(prev - 1, 0))
      }
    } catch (error) {
      console.error("Mark as read error:", error)
      throw error
    }
  }, [])

  // Update the markAllAsRead function to properly handle the API requirements
  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      // Ensure role is not empty
      if (!role) {
        throw new Error("Role is required")
      }

      // Create request body
      const requestBody = { role }

      // For non-Admin roles, serviceId is required
      if (role !== "Admin") {
        if (!userServiceId) {
          console.error("ServiceId is required for non-admin roles")
          throw new Error("ServiceId is required for non-admin roles")
        }
        requestBody.serviceId = userServiceId
      }

      console.log("Sending mark all as read request:", requestBody)

      const response = await fetch(`http://localhost:8080/api/notifications/mark-all-read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`HTTP error! status: ${response.status}, message: ${errorText}`)
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const result = await response.json()
      console.log("Marked as read result:", result)

      // Update local state
      if (isMountedRef.current) {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, viewed: true })))
        setUnviewedCount(0)
      }

      return result
    } catch (error) {
      console.error("Mark all as read error:", error)
      setError(error.message)
      throw error
    }
  }, [role, userServiceId])

  useEffect(() => {
    fetchNotifications()

    const token = localStorage.getItem("authToken")
    if (!token) return

    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: { Authorization: `Bearer ${token}` },
    })

    client.onConnect = () => {
      const topic =
        role === "Chef Hiérarchique" && userServiceId
          ? `/topic/notifications/${role}/${userServiceId}`
          : `/topic/notifications/${role}`

      client.subscribe(topic, (message) => {
        const newNotification = JSON.parse(message.body)
        if (isMountedRef.current) {
          setNotifications((prev) => {
            const exists = prev.some((n) => n.id === newNotification.id)
            return exists ? prev : [newNotification, ...prev]
          })
          if (!newNotification.viewed) {
            setUnviewedCount((prev) => prev + 1)
          }
        }
      })
    }

    client.onStompError = (frame) => {
      console.error("STOMP error:", frame.headers.message)
      if (isMountedRef.current) {
        setError("WebSocket connection error")
      }
    }

    client.activate()
    clientRef.current = client

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate()
      }
    }
  }, [role, userServiceId, fetchNotifications])

  return {
    notifications,
    unviewedCount,
    markAsRead,
    markAllAsRead,
    error,
    fetchNotifications,
  }
}

export default useNotifications
