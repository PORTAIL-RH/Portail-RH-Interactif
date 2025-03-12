import { useState, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const useNotifications = (role, userServiceId) => {
  const [notifications, setNotifications] = useState([]);
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [error, setError] = useState("");
  const clientRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("authToken");
      let url = "http://localhost:8080/api/notifications";
      
      // Add query parameters
      const params = new URLSearchParams();
      params.append("role", role);
      if (role === "Chef Hiérarchique" && userServiceId) {
        params.append("serviceId", userServiceId);
      }

      url += `?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Notifications reçues:", data);
        setNotifications(data);
        setUnviewedCount(data.filter((notif) => !notif.viewed).length);
      } else {
        const errorText = await response.text(); // Handle plain text error messages
        console.error("Error fetching notifications:", errorText);
        setError(`Erreur: ${errorText}`);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError("Impossible de récupérer les notifications.");
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("authToken");
      let url = "http://localhost:8080/api/notifications/unreadnbr";
      
      // Add query parameters
      const params = new URLSearchParams();
      params.append("role", role);
      if (role === "Chef Hiérarchique" && userServiceId) {
        params.append("serviceId", userServiceId);
      }

      url += `?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Unread count:", data);
        setUnviewedCount(data);
      } else {
        const errorText = await response.text(); // Handle plain text error messages
        console.error("Error fetching unread count:", errorText);
        setError(`Erreur: ${errorText}`);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
      setError("Impossible de récupérer le nombre de notifications non lues.");
    }
  };

  useEffect(() => {
    if (!userServiceId) {
      console.error("userServiceId is undefined");
      return;
    }

    fetchNotifications();
    fetchUnreadCount(); // Fetch unread count

    const token = localStorage.getItem("authToken");
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,
      debug: (str) => console.log("🛜 WebSocket:", str),
      connectHeaders: { Authorization: `Bearer ${token}` },
    });

    client.onConnect = () => {
      console.log("✅ WebSocket connecté");

      // Subscribe to notifications for the Chef Hiérarchique
      client.subscribe(`/topic/notifications/${role}`, (message) => {
        const newNotification = JSON.parse(message.body);
        if (newNotification.serviceId === userServiceId) {
          setNotifications((prev) => [newNotification, ...prev]);
          setUnviewedCount((prevCount) => prevCount + 1);
        }
      });
    };

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      console.log("❌ WebSocket déconnecté");
    };
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

      // Mettre à jour le compteur de notifications non lues
      setUnviewedCount((prev) => Math.max(prev - 1, 0));

      // Recharger les notifications
      await fetchNotifications();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };

  return { notifications, unviewedCount, setUnviewedCount, fetchNotifications, markAsRead, error };
};

export default useNotifications;