"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { API_URL } from "../../../config"

const useNotifications = () => {
  const [notifications, setNotifications] = useState([])
  const [unviewedCount, setUnviewedCount] = useState(0)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const clientRef = useRef(null)
  const isMountedRef = useRef(true)
  const subscriptionsRef = useRef([])

  // Get RH info from localStorage
  const getRHInfo = useCallback(() => {
    const userData = localStorage.getItem("userData")
    if (!userData) {
      throw new Error("RH user data not found in localStorage")
    }
    const { code_soc: codeSoc } = JSON.parse(userData)
    return { codeSoc }
  }, [])

  // Cleanup effect
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      // Unsubscribe from all WebSocket topics
      subscriptionsRef.current.forEach(sub => sub.unsubscribe())
      clientRef.current?.deactivate()
    }
  }, [])

  // Fetch all notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken")
      const { codeSoc } = getRHInfo()

      const response = await fetch(
        `${API_URL}/api/notifications?role=RH&codeSoc=${codeSoc}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!response.ok) throw new Error("Failed to fetch notifications")
      
      const data = await response.json()
      if (isMountedRef.current) {
        setNotifications(data)
      }
      return data
    } catch (error) {
      console.error("Fetch notifications error:", error)
      if (isMountedRef.current) {
        setError(error.message)
      }
      throw error
    }
  }, [getRHInfo])

  // Fetch unread notifications count
  const fetchUnviewedCount = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken")
      const userId = localStorage.getItem("userId")
      const { codeSoc } = getRHInfo()

      const response = await fetch(
        `${API_URL}/api/notifications/unread-count-for-user?personnelId=${userId}&role=RH&codeSoc=${codeSoc}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!response.ok) throw new Error("Failed to fetch unread count")
      
      const count = await response.json()
      if (isMountedRef.current) {
        setUnviewedCount(count)
      }
      return count
    } catch (error) {
      console.error("Fetch unread count error:", error)
      if (isMountedRef.current) {
        setUnviewedCount(0)
      }
      throw error
    }
  }, [getRHInfo])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken")
      const userId = localStorage.getItem("userId")
      const { codeSoc } = getRHInfo()

      // Optimistic update
      if (isMountedRef.current) {
        setUnviewedCount(0)
        setNotifications(prev => 
          prev.map(n => ({
            ...n,
            readBy: [...(n.readBy || []), userId]
          }))
        )
      }

      await fetch(
        `${API_URL}/api/notifications/mark-all-read-by-user?personnelId=${userId}&role=RH&codeSoc=${codeSoc}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        }
      )

      // Verify with server
      await fetchUnviewedCount()
    } catch (error) {
      console.error("Mark all as read error:", error)
      // Rollback optimistic update
      if (isMountedRef.current) {
        fetchUnviewedCount()
        fetchNotifications()
      }
      throw error
    }
  }, [fetchUnviewedCount, getRHInfo, fetchNotifications])

  // Initialize WebSocket connection
  const initWebSocket = useCallback(() => {
    const token = localStorage.getItem("authToken")
    const userId = localStorage.getItem("userId")
    const { codeSoc } = getRHInfo()

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_URL}/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: { Authorization: `Bearer ${token}` },
      
      onConnect: () => {
        // Clear previous subscriptions
        subscriptionsRef.current.forEach(sub => sub.unsubscribe())
        subscriptionsRef.current = []

        // Subscribe to RH notifications topic
        const subscription = client.subscribe(
          `/topic/notifications/RH/${codeSoc}`,
          (message) => {
            const newNotification = JSON.parse(message.body)
            
            if (isMountedRef.current) {
              setNotifications(prev => {
                // Update existing notification or add new one
                const existingIndex = prev.findIndex(n => n.id === newNotification.id)
                if (existingIndex >= 0) {
                  const updated = [...prev]
                  updated[existingIndex] = newNotification
                  return updated
                }
                return [newNotification, ...prev]
              })

              // Update unread count based on actual read status
              if (!newNotification.readBy?.includes(userId)) {
                setUnviewedCount(prev => prev + 1)
              } else if (newNotification.readBy?.includes(userId)) {
                setUnviewedCount(prev => Math.max(0, prev - 1))
              }
            }
          }
        )
        
        subscriptionsRef.current.push(subscription)
      },
      
      onStompError: (frame) => {
        console.error("WebSocket error:", frame.headers.message)
        if (isMountedRef.current) {
          setError("Connection error")
        }
      },
      
      onDisconnect: () => {
        if (isMountedRef.current) {
          setError("Disconnected from notifications service")
        }
      }
    })

    client.activate()
    return client
  }, [getRHInfo])

  // Initial data loading
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        await Promise.all([fetchNotifications(), fetchUnviewedCount()])
        if (isMountedRef.current) {
          setInitialLoadComplete(true)
        }
      } catch (error) {
        console.error("Initial data fetch error:", error)
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }

    fetchInitialData()
    const client = initWebSocket()
    clientRef.current = client

    return () => {
      client.deactivate()
    }
  }, [fetchNotifications, fetchUnviewedCount, initWebSocket])

  return {
    notifications,
    unviewedCount,
    loading,
    initialLoadComplete,
    error,
    fetchNotifications,
    markAllAsRead,
    fetchUnviewedCount
  }
}

export default useNotifications