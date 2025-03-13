import { useState, useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const useNotifications = (role, userServiceId) => {
  const [notifications, setNotifications] = useState([]);
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [error, setError] = useState("");
  const clientRef = useRef(null);

  // Memoized function to fetch notifications
  const fetchNotifications = useCallback(async () => {
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
        setUnviewedCount(data.filter((notif) => !notif.viewed).length); // Update unviewed count
      } else {
        const errorText = await response.text();
        console.error("Erreur lors de la récupération des notifications:", errorText);
        setError(`Erreur: ${errorText}`);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications:", error);
      setError("Impossible de récupérer les notifications.");
    }
  }, [role, userServiceId]);

  // Function to mark a notification as read
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

      // Update unviewed count
      setUnviewedCount((prev) => Math.max(prev - 1, 0));

      // Update the notification in the list
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, viewed: true } : notif
        )
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la notification:", error);
    }
  };

  // Initialize WebSocket and fetch notifications
  useEffect(() => {
    if (!userServiceId) {
      console.error("userServiceId est indéfini");
      return;
    }

    fetchNotifications();

    const token = localStorage.getItem("authToken");
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,
      debug: (str) => console.log("🛜 WebSocket:", str),
      connectHeaders: { Authorization: `Bearer ${token}` },
    });

    client.onConnect = () => {
      console.log("✅ WebSocket connecté");

      // Subscribe to notifications for the specified role
      client.subscribe(`/topic/notifications/${role}`, (message) => {
        const newNotification = JSON.parse(message.body);
        if (newNotification.serviceId === userServiceId) {
          setNotifications((prev) => [newNotification, ...prev]);
          if (!newNotification.viewed) {
            setUnviewedCount((prevCount) => prevCount + 1); // Increment unviewed count
          }
        }
      });
    };

    client.activate();
    clientRef.current = client;

    // Cleanup WebSocket on unmount
    return () => {
      client.deactivate();
      console.log("❌ WebSocket déconnecté");
    };
  }, [role, userServiceId, fetchNotifications]);

  return { notifications, unviewedCount, fetchNotifications, markAsRead, error };
};

export default useNotifications;