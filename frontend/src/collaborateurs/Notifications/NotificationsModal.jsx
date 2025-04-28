import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiCheck, 
  FiTrash2, 
  FiFileText, 
  FiCalendar, 
  FiClock, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiInfo, 
  FiX,
  FiChevronRight
} from "react-icons/fi";
import "./NotificationsModal.css";
import { API_URL } from "../../config"; 

const NotificationsModal = ({ isOpen, onClose, userId, token }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const modalRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && userId && token) {
      fetchNotifications();
    }
  }, [isOpen, userId, token]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Fetch only the 5 most recent notifications
      const response = await fetch(`${API_URL}/api/notifications/recent/${userId}?limit=5`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des notifications");
      }

      const data = await response.json();
      setNotifications(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Impossible de charger les notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId, event) => {
    event.stopPropagation();
    try {
      const response = await fetch(`${API_URL}/api/notifications/read/${notificationId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Update the notification in the state
        setNotifications(notifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        ));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId, event) => {
    event.stopPropagation();
    try {
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Remove the notification from the state
        setNotifications(notifications.filter(notification => notification.id !== notificationId));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "DOCUMENT":
        return <FiFileText className="notification-icon document" />;
      case "LEAVE":
        return <FiCalendar className="notification-icon leave" />;
      case "REMINDER":
        return <FiClock className="notification-icon reminder" />;
      case "WARNING":
        return <FiAlertCircle className="notification-icon warning" />;
      case "SUCCESS":
        return <FiCheckCircle className="notification-icon success" />;
      default:
        return <FiInfo className="notification-icon info" />;
    }
  };

  const handleNotificationClick = (notification) => {
    // If notification is not read, mark it as read
    if (!notification.read) {
      markAsRead(notification.id, { stopPropagation: () => {} });
    }

    // Close the modal
    onClose();

    // Navigate based on notification type and reference
    if (notification.type === "DOCUMENT" && notification.referenceId) {
      navigate(`/documents/${notification.referenceId}`);
    } else if (notification.type === "LEAVE" && notification.referenceId) {
      navigate(`/conges/${notification.referenceId}`);
    } else if (notification.link) {
      navigate(notification.link);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return "À l'instant";
    } else if (diffMins < 60) {
      return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit'
      });
    }
  };

  const viewAllNotifications = () => {
    onClose();
    navigate("/NotificationsCollab");
  };

  if (!isOpen) return null;

  return (
    <div className="notifications-modal-overlay">
      <div className="notifications-modal" ref={modalRef}>
        <div className="notifications-modal-header">
          <h3>Notifications</h3>
          <button className="close-button" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="notifications-modal-content">
          {loading ? (
            <div className="modal-loading-state">
              <div className="modal-loading-spinner"></div>
              <p>Chargement...</p>
            </div>
          ) : error ? (
            <div className="modal-error-state">
              <FiAlertCircle className="modal-error-icon" />
              <p>{error}</p>
              <button onClick={fetchNotifications}>Réessayer</button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="modal-empty-state">
              <div className="modal-empty-icon">
                <FiInfo />
              </div>
              <p>Aucune notification</p>
            </div>
          ) : (
            <ul className="modal-notifications-list">
              {notifications.map((notification) => (
                <li 
                  key={notification.id} 
                  className={`modal-notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="modal-notification-content">
                    <div className="modal-notification-icon-container">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="modal-notification-details">
                      <div className="modal-notification-message">{notification.message}</div>
                      <div className="modal-notification-time">{formatDate(notification.createdAt)}</div>
                    </div>
                  </div>
                  <div className="modal-notification-actions">
                    {!notification.read && (
                      <button 
                        className="modal-action-button read-button" 
                        onClick={(e) => markAsRead(notification.id, e)}
                        aria-label="Marquer comme lu"
                      >
                        <FiCheck />
                      </button>
                    )}
                    <button 
                      className="modal-action-button delete-button" 
                      onClick={(e) => deleteNotification(notification.id, e)}
                      aria-label="Supprimer"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="notifications-modal-footer">
          <button className="view-all-button" onClick={viewAllNotifications}>
            Voir toutes les notifications
            <FiChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;