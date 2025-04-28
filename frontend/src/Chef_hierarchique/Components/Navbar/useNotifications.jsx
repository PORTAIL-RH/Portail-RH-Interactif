import { useState, useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const useNotifications = (role, userServiceId) => {
  const [notifications, setNotifications] = useState([]);
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [error, setError] = useState("");
  const clientRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Authentication token not found");
        return;
      }

      let url = "http://localhost:8080/api/notifications";
      const params = new URLSearchParams();
      params.append("role", role);
      
      if (role === "Chef Hiérarchique" && userServiceId) {
        params.append("serviceId", userServiceId);
      }

      const response = await fetch(`${url}?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnviewedCount(data.filter(notif => !notif.viewed).length);
      } else {
        const errorText = await response.text();
        setError(`Error: ${errorText}`);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError("Failed to fetch notifications");
    }
  }, [role, userServiceId]);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("authToken");
      await fetch(`http://localhost:8080/api/notifications/${id}/view`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, viewed: true } : notif
        )
      );
      setUnviewedCount(prev => Math.max(prev - 1, 0));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const token = localStorage.getItem("authToken");
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: { Authorization: `Bearer ${token}` },
    });

    client.onConnect = () => {
      const topic = role === "Chef Hiérarchique" && userServiceId
        ? `/topic/notifications/${role}/${userServiceId}`
        : `/topic/notifications/${role}`;

      client.subscribe(topic, (message) => {
        const newNotification = JSON.parse(message.body);
        setNotifications(prev => [newNotification, ...prev]);
        if (!newNotification.viewed) {
          setUnviewedCount(prev => prev + 1);
        }
      });
    };

    client.onStompError = (frame) => {
      console.error("STOMP error:", frame.headers.message);
      setError("Connection error");
    };

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [role, userServiceId, fetchNotifications]);

  return { 
    notifications, 
    unviewedCount, 
    markAsRead, 
    error 
  };
};

export default useNotifications;