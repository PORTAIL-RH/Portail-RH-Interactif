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

  // Get Chef Hiérarchique info from localStorage
  const getChefHierarchiqueInfo = useCallback(() => {
    const userData = localStorage.getItem("userData")
    const services = localStorage.getItem("services")
    
    if (!userData) {
      throw new Error("Chef Hiérarchique user data not found in localStorage")
    }
    
    const { code_soc: codeSoc } = JSON.parse(userData)
    const chefServices = services ? JSON.parse(services) : []
    
    return { 
      serviceIds: chefServices.map(service => service.serviceId),
      codeSoc 
    }
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
      setLoading(true)
      const token = localStorage.getItem("authToken")
      const { serviceIds, codeSoc } = getChefHierarchiqueInfo()

      // Utilisez le nouveau endpoint qui accepte une liste de serviceIds
      const response = await fetch(
        `${API_URL}/api/notifications?role=Chef Hiérarchique&serviceId=${serviceIds.join(',')}&codeSoc=${codeSoc}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!response.ok) throw new Error("Failed to fetch notifications")
      
      const allNotifications = await response.json()
      allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      if (isMountedRef.current) {
        setNotifications(allNotifications)
        setLoading(false)
      }
    } catch (error) {
      console.error("Fetch notifications error:", error)
      if (isMountedRef.current) {
        setError(error.message)
        setLoading(false)
      }
    }
  }, [getChefHierarchiqueInfo])

  const fetchUnviewedCount = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken")
      const userId = localStorage.getItem("userId")
      const { serviceIds, codeSoc } = getChefHierarchiqueInfo()

      // Utilisez le nouveau endpoint qui accepte une liste de serviceIds
      const response = await fetch(
        `${API_URL}/api/notifications/unread-count-for-user?personnelId=${userId}&role=Chef Hiérarchique&serviceId=${serviceIds.join(',')}&codeSoc=${codeSoc}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!response.ok) throw new Error("Failed to fetch unread count")
      
      const totalCount = await response.json()
      
      if (isMountedRef.current) {
        setUnviewedCount(totalCount)
      }
      return totalCount
    } catch (error) {
      console.error("Fetch unread count error:", error)
      if (isMountedRef.current) {
        setUnviewedCount(0)
      }
      return 0
    }
  }, [getChefHierarchiqueInfo])

  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken")
      const userId = localStorage.getItem("userId")
      const { serviceIds, codeSoc } = getChefHierarchiqueInfo()

      // Utilisez le nouveau endpoint qui accepte une liste de serviceIds
      await fetch(
        `${API_URL}/api/notifications/mark-all-read-by-user?personnelId=${userId}&role=Chef Hiérarchique&serviceId=${serviceIds.join(',')}&codeSoc=${codeSoc}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (isMountedRef.current) {
        setUnviewedCount(0)
        // Mise à jour optimiste des notifications
        setNotifications(prev => 
          prev.map(n => ({
            ...n,
            readBy: [...(n.readBy || []), userId]
          }))
        )
      }
    } catch (error) {
      console.error("Mark all as read error:", error)
      throw error
    }
  }, [getChefHierarchiqueInfo])

  useEffect(() => {
    const initWebSocket = () => {
      const token = localStorage.getItem("authToken")
      const { serviceIds, codeSoc } = getChefHierarchiqueInfo()

      const client = new Client({
        webSocketFactory: () => new SockJS(`${API_URL}/ws`),
        reconnectDelay: 5000,
        connectHeaders: { Authorization: `Bearer ${token}` },
        onConnect: () => {
          fetchUnviewedCount()
          
          // Abonnement unique pour toutes les notifications du Chef Hiérarchique
          client.subscribe(
            `/topic/notifications/Chef Hiérarchique/${codeSoc}`,
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
                  setUnviewedCount(prev => prev + 1)
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
  }, [fetchNotifications, fetchUnviewedCount, getChefHierarchiqueInfo])

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