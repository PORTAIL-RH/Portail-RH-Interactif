import React, { useState, useEffect } from "react";
import "./Accueil.css";
import bellIcon from "../assets/bell.png";
import bellIcon1 from "../assets/bell1.png";

import { format } from "date-fns"; // Install via `npm install date-fns`

const Accueil = () => {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("home");
  const [personnel, setPersonnel] = useState([]); // Renamed to personnel
  const [staffError, setStaffError] = useState("");
  const [roles, setRoles] = useState([]); // State for roles

  // Fetch Roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/roles", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setRoles(data || []); // Set roles in state
        } else {
          console.error(`Failed to fetch roles. Status: ${response.status}`);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };

    fetchRoles();
  }, []);

  // Fetch Personnel
  useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/Personnel/all", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPersonnel(data || []); // Renamed to personnel
          setStaffError(null);
        } else {
          setStaffError(`Failed to fetch personnel. Status: ${response.status}`);
        }
      } catch (error) {
        setStaffError(error.message || "Error fetching personnel. Please try again later.");
      }
    };

    if (activeSection === "staff") {
      fetchPersonnel(); // Renamed to fetchPersonnel
    }
  }, [activeSection]);

  // Fetch notifications
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
      }
    };

    fetchNotifications();
  }, []);

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

  // Calculate unviewed notifications count
  const unviewedCount = notifications.filter((notification) => !notification.viewed).length;

  // Handle role change
  const handleRoleChange = async (e, personnelId) => {
    const newRole = e.target.value;

    try {
      const response = await fetch(`http://localhost:8080/api/roles/update/${personnelId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        const updatedPersonnel = personnel.map((person) =>
          person.id === personnelId
            ? { ...person, role: newRole }
            : person
        );
        setPersonnel(updatedPersonnel); // Renamed to setPersonnel
      } else {
        console.error("Failed to update role.");
      }
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  // Handle personnel validation (e.g., activating a user)
  const handleValidate = async (personnelId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/activate-personnel/${personnelId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (response.ok) {
        const updatedPersonnel = personnel.map((person) =>
          person.id === personnelId
            ? { ...person, active: true }
            : person
        );
        setPersonnel(updatedPersonnel); // Renamed to setPersonnel
      } else {
        console.error("Failed to validate personnel.");
      }
    } catch (error) {
      console.error("Error validating personnel:", error);
    }
  };

  return (
    <div className="accueil-container">
      <nav className="navbar">
        <div className="navbar-logo">Admin</div>
        <div 
          onClick={() => setActiveSection("notifications")} 
          className={activeSection === "notifications" ? "active" : ""} 
        >
          {unviewedCount > 0 && <span className="notification-badge">{unviewedCount}</span>}
          <img src={bellIcon1} alt="Bell Icon" className="icon-notif"/>
        </div>
      </nav>

      <nav className="sidebar">
        <ul className="sidebar-links">
          <li onClick={() => setActiveSection("home")} className={activeSection === "home" ? "active" : ""}>
            Home
          </li>
          {/*<li onClick={() => setActiveSection("notifications")} className={activeSection === "notifications" ? "active" : ""}>
            Notifications
            {unviewedCount > 0 && <span className="notification-badge">{unviewedCount}</span>}
          </li>*/}
          <li onClick={() => setActiveSection("staff")} className={activeSection === "staff" ? "active" : ""}>
            Personnels
          </li>
          <li onClick={() => setActiveSection("about")} className={activeSection === "about" ? "active" : ""}>
            About
          </li>
        </ul>
      </nav>

      <div className="content">
        {activeSection === "home" && (
          <div className="main-content">
            <h1>Welcome to the Dashboard</h1>
            <p>Manage your activities efficiently with MyApp.</p>
            <div className="stats">
              <div className="stat-item">
                <h3>Personnel</h3>
                <p>{personnel.length} Members</p>
              </div>
              <div className="stat-item">
                <h3>Notifications</h3>
                <p>{unviewedCount} Unread</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === "notifications" && (
          <div className="notification-section">
            <h2>Notifications</h2>
            {error && <p className="error-message">{error}</p>}
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification ${notification.viewed ? "read" : "unread"}`}
                  onClick={() => markAsRead(notification.id)}  // Mark notification as read on click
                >
                  <img src={bellIcon} alt="Bell Icon" className="bell-icon" />
                  <p>{notification.message}</p>
                  <span className="notification-timestamp">
                    {format(new Date(notification.timestamp), "yyyy-MM-dd HH:mm")}
                  </span>
                </div>
              ))
            ) : (
              <p>No new notifications.</p>
            )}
          </div>
        )}

        {activeSection === "staff" && (
          <div className="staff-section">
            <h2>Staff Members</h2>
            {staffError && <p className="error-message">{staffError}</p>}
            {personnel.length > 0 ? (
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Matricule</th>
                    <th>Status</th>
                    <th>Role</th>
                    <th>Validation</th>
                  </tr>
                </thead>
                <tbody>
                  {personnel.map((person) => (
                    <tr key={person.id}>
                      <td>{person.id}</td>
                      <td>{person.prenom}</td>
                      <td>{person.email}</td>
                      <td>{person.matricule}</td>
                      <td>{person.active ? "Active" : "Inactive"}</td>
                      <td>
                        <select
                          value={person.role}
                          onChange={(e) => handleRoleChange(e, person.id)}
                        >
                          {roles.map((role) => (
                            <option key={role.libelle} value={role.libelle}>
                              {role.libelle}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {!person.active && (
                          <button onClick={() => handleValidate(person.id)}>Validate</button>
                        )}
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

        {activeSection === "about" && (
          <div className="about-section">
            <h2>About</h2>
            <p>Information about the platform goes here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Accueil;
