import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import bellIcon from "../../../assets/bell.png";
import { useNavigate } from "react-router-dom"; // Replace useHistory with useNavigate
import "./NotificationModal.css";

const NotificationModal = () => {
  const [notifications, setNotifications] = useState([]);
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Use useNavigate for navigation

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("authToken");

        const response = await fetch("http://localhost:8080/api/notifications", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setNotifications(data || []);
          const unviewed = data.filter(notification => !notification.viewed).length;
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

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch(`http://localhost:8080/api/notifications/${id}/view`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) =>
            notification.id === id ? { ...notification, viewed: true } : notification
          )
        );
      } else {
        console.error(`Failed to mark notification as read. Status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleViewMore = () => {
    navigate("/Notifications"); // Use navigate for redirection
  };

  return (
    <div className="notification-popover">
      <div className="notification-header">
        <h2>Notifications</h2>
        {unviewedCount > 0 && <span className="notification-badge">{unviewedCount}</span>}
      </div>
      {error && <p className="error-message">{error}</p>}
      {notifications.length > 0 ? (
        <div className="notification-list">
          {/* Display only 6 notifications on smaller screens */}
          {notifications.slice(0, 6).map((notification) => (
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
          {/* Show View More button if there are more than 6 notifications */}
          {notifications.length > 6 && (
            <button onClick={handleViewMore} className="view-more-button">
              View More
            </button>
          )}
        </div>
      ) : (
        <p>No new notifications.</p>
      )}
    </div>
  );
};

export default NotificationModal;
