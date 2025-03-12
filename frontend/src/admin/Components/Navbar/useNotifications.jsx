import { useState, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const useNotifications = (role) => {
  const [notifications, setNotifications] = useState([]);
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [error, setError] = useState("");
  const clientRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `http://localhost:8080/api/notifications?role=${role}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnviewedCount(data.filter((notif) => !notif.viewed && notif.role === role).length);
      } else {
        setError(`Erreur: ${response.status}`);
      }
    } catch (error) {
      setError("Impossible de récupérer les notifications.");
    }
  };

  useEffect(() => {
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

      // Souscrire aux notifications spécifiques au rôle
      client.subscribe(`/topic/notifications/${role}`, (message) => {
        const newNotification = JSON.parse(message.body);
        setNotifications((prev) => [newNotification, ...prev]);
        setUnviewedCount((prevCount) => prevCount + 1);
      });
    };

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      console.log("❌ WebSocket déconnecté");
    };
  }, [role]);

  return { notifications, unviewedCount, setUnviewedCount, fetchNotifications, error };
};

export default useNotifications;