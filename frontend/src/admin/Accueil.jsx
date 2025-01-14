import React, { useState, useEffect } from "react";
import "./Accueil.css";
import bellIcon from "../assets/bell.png"; // Notification bell icon
import { format } from "date-fns"; // Install via `npm install date-fns`

const Accueil = () => {
  const [notifications, setNotifications] = useState([]); // State for notifications
  const [error, setError] = useState(""); // State for error messages (optional)
  const [activeSection, setActiveSection] = useState("home"); // State for active section
  const [collaborators, setCollaborators] = useState([]);
  const [staffError, setStaffError] = useState(""); // For staff fetch errors
  


  //Fetch Collaborators
  useEffect(() => {
    const fetchCollaborators = async () => {
      try {
        // Fetch data from API
        const response = await fetch("http://localhost:8080/api/Collaborateur/all", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
  
        console.log("Response Status:", response.status); // Debugging log
  
        if (response.ok) {
          const data = await response.json();
          console.log("Collaborators Data:", data); // Debugging log
          setCollaborators(data || []);
          setStaffError(null); // Clear errors
        } else {
          // Handle different status codes
          setStaffError(`Failed to fetch collaborators. Status: ${response.status}`);
        }
      } catch (error) {
        // Handle other errors
        setStaffError(error.message || "Error fetching collaborators. Please try again later.");
        console.error("Error Fetching Collaborators:", error);
      }
    };
  
    if (activeSection === "staff") {
      fetchCollaborators();
    }
  }, [activeSection]);
  
  
  
  // Function to mark a notification as read
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

  // Fetch notifications on mount
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
        } else {
          setError(`Failed to fetch notifications. Status: ${response.status}`);
        }
      } catch (error) {
        setError("Error fetching notifications. Please try again later.");
        console.error(error);
      }
    };

    fetchNotifications();
  }, []);

  // Calculate unviewed notifications count
  const unviewedCount = notifications.filter((notification) => !notification.viewed).length;

  return (
    <div className="accueil-container">
      {/* Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-logo">Admin</div>
        <ul className="sidebar-links">
          <li onClick={() => setActiveSection("home")} className={activeSection === "home" ? "active" : ""}>
            Home
          </li>
          <li onClick={() => setActiveSection("notifications")} className={activeSection === "notifications" ? "active" : ""}>
            Notifications
            {unviewedCount > 0 && (
              <span className="notification-badge">{unviewedCount}</span>
            )}
          </li>
          <li onClick={() => setActiveSection("staff")} className={activeSection === "staff" ? "active" : ""}>
            staff
          </li>
          <li onClick={() => setActiveSection("about")} className={activeSection === "about" ? "active" : ""}>
            About
          </li>
        </ul>
      </nav>

      {/* Main Content */}
      <div className="content">
      {/* Dashboard */}
        {activeSection === "home" && (
          <div className="main-content">
            <h1>Welcome to the Dashboard</h1>
            <p>Manage your activities efficiently with MyApp.</p>
          </div>
        )}

      {/* notifications */}
        {activeSection === "notifications" && (
          <div className="notification-section">
            <h2>Notifications</h2>
            {error && <p className="error-message">{error}</p>}
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification ${notification.viewed ? "read" : "unread"}`}
                >
                  <img src={bellIcon} alt="Bell Icon" className="bell-icon" />
                  <p>{notification.message}</p>
                  <span className="notification-timestamp">
                    {format(new Date(notification.timestamp), "yyyy-MM-dd HH:mm")}
                    &nbsp;
                  </span>
                  {!notification.viewed && (
                    <button onClick={() => markAsRead(notification.id)}>
                      Mark as Read
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p>No new notifications.</p>
            )}
          </div>
        )}

      {/* staff */}
      {activeSection === "staff" && (
          <div className="staff-section">
            <h2>Staff Members</h2>
            {staffError && <p className="error-message">{staffError}</p>}
            {collaborators.length > 0 ? (
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Matricule</th>
                    <th>Status</th>
                    <th>Role</th>
                    <th>validation</th>
                  </tr>
                </thead>
                <tbody>
                  
                {collaborators.map((collaborator) => (
                <tr key={collaborator.id}>
                  <td>{collaborator.id}</td>
                  <td>{collaborator.nomUtilisateur}</td>
                  <td>{collaborator.email}</td>
                  <td>{collaborator.matricule}</td>
                  <td>{collaborator.active ? "Active" : "Inactive"}</td>
                      <td>
                        {collaborator.role}
                      </td>
                      <td><button class="button">active</button>
                      </td>

                    </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <p>No staff members found.</p>
            )}
          </div>
        )}


      {/* about */}
        {activeSection === "about" && (
          <div className="about-section">
            <h2>About</h2>
            <p>Learn more about MyApp and its features.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Accueil;
