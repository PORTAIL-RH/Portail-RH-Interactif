import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Client } from "@stomp/stompjs";
import bellIcon from "../../../assets/bell.png";
import "./Notifications.css";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [error, setError] = useState("");

  // Fetch initial notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("authToken");

        const response = await fetch("http://localhost:8080/api/notifications", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setNotifications(data || []);
          const unviewed = data.filter((notification) => !notification.viewed).length;
          setUnviewedCount(unviewed);
        } else {
          setError(`Failed to fetch notifications. Status: ${response.status}`);
        }
      } catch (error) {
        setError("Error fetching notifications. Please try again later.");
      }
    };

    fetchNotifications();
  }, []);

  // Establish WebSocket connection
  useEffect(() => {
    const client = new Client({
      brokerURL: "ws://localhost:8080/ws", // WebSocket endpoint
      debug: function (str) {
        console.log(str);
      },
      reconnectDelay: 5000, // Reconnect after 5 seconds
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log("WebSocket connected");
      client.subscribe("/topic/notifications", (message) => {
        const newNotification = JSON.parse(message.body);
        setNotifications((prevNotifications) => [newNotification, ...prevNotifications]);
        setUnviewedCount((prevCount) => prevCount + 1);
      });
    };

    client.onStompError = (frame) => {
      console.error("WebSocket error:", frame.headers.message);
    };

    client.activate();

    return () => {
      if (client) {
        client.deactivate();
        console.log("WebSocket disconnected");
      }
    };
  }, []);

  // Function to mark a notification as read
  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch(`http://localhost:8080/api/notifications/${id}/view`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) =>
            notification.id === id ? { ...notification, viewed: true } : notification
          )
        );
        setUnviewedCount((prevCount) => prevCount - 1);
      } else {
        console.error(`Failed to mark notification as read. Status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <div className="accueil-containernt">
      <Navbar />
      <Sidebar />
      <div className="contenttf">
        {/* Notification Box */}
        <div className="notification-section">
          <div className="notification-header">
            <h2>Notifications</h2>
            {unviewedCount > 0 && <span className="notification-badge">{unviewedCount}</span>}
          </div>
          {error && <p className="error-message">{error}</p>}
          {notifications.length > 0 ? (
            <div className="notification-list">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification ${notification.viewed ? "read" : "unread"}`}
                  onClick={() => markAsRead(notification.id)} // Mark as read on click
                >
                  <img src={bellIcon} alt="Bell Icon" className="bell-icon" />
                  <p>{notification.message}</p>
                  <span className="notification-timestamp">
                    {format(new Date(notification.timestamp), "yyyy-MM-dd HH:mm")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p>No new notifications.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;