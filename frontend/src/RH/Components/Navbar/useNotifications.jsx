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
  const clientRef = useRef(null)
  const isMountedRef = useRef(true)

  // Get RH info from localStorage
  const getRHInfo = useCallback(() => {
    const userData = localStorage.getItem("userData")
    if (!userData) {
      throw new Error("RH user data not found in localStorage")
    }
    const { code_soc: codeSoc } = JSON.parse(userData)
    return {  codeSoc }
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      clientRef.current?.deactivate()
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken")
      const {  codeSoc } = getRHInfo()

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
        setLoading(false)
      }
    } catch (error) {
      console.error("Fetch notifications error:", error)
      if (isMountedRef.current) {
        setError(error.message)
        setLoading(false)
      }
    }
  }, [getRHInfo])

  const fetchUnviewedCount = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken")
      const userId = localStorage.getItem("userId")
      const {  codeSoc } = getRHInfo()

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
      return 0
    }
  }, [getRHInfo])

  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken")
      const userId = localStorage.getItem("userId")
      const { codeSoc } = getRHInfo()

      await fetch(
        `${API_URL}/api/notifications/mark-all-read-by-user?personnelId=${userId}&role=RH&codeSoc=${codeSoc}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (isMountedRef.current) {
        fetchUnviewedCount()
      }
    } catch (error) {
      console.error("Mark all as read error:", error)
      throw error
    }
  }, [fetchUnviewedCount, getRHInfo])

  useEffect(() => {
    const initWebSocket = () => {
      const token = localStorage.getItem("authToken")
      const { codeSoc } = getRHInfo()

      const client = new Client({
        webSocketFactory: () => new SockJS(`${API_URL}/ws`),
        reconnectDelay: 5000,
        connectHeaders: { Authorization: `Bearer ${token}` },
        onConnect: () => {
          fetchUnviewedCount()
          
          client.subscribe(
            `/topic/notifications/RH/${codeSoc}`,
            (message) => {
              const newNotification = JSON.parse(message.body)
              const userId = localStorage.getItem("userId")

              if (isMountedRef.current) {
                setNotifications(prev => {
                  if (!prev.some(n => n.id === newNotification.id)) {
                    return [newNotification, ...prev]
                  }
                  return prev
                })

                if (!newNotification.readBy?.includes(userId)) {
                  fetchUnviewedCount()
                }
              }
            }
          )
        },
        onStompError: (frame) => {
          console.error("WebSocket error:", frame.headers.message)
          setError("Connection error")
        },
      })

      client.activate()
      return client
    }

    const fetchInitialData = async () => {
      try {
        await Promise.all([fetchNotifications(), fetchUnviewedCount()])
      } catch (error) {
        console.error("Initial data fetch error:", error)
      }
    }

    fetchInitialData()
    const client = initWebSocket()
    clientRef.current = client

    return () => client.deactivate()
  }, [fetchNotifications, fetchUnviewedCount, getRHInfo])

  return {
    notifications,
    unviewedCount,
    loading,
    error,
    fetchNotifications,
    markAllAsRead,
  }
}

export default useNotifications