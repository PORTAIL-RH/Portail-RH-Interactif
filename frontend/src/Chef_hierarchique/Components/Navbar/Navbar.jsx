import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import bellIcon from "../../../assets/bell1.png";
import { FiUsers, FiUserCheck, FiUserX, FiBell, FiMail, FiSun, FiMoon } from "react-icons/fi";
import { FaMars, FaVenus } from "react-icons/fa";

const Navbar = () => {
  const [userData, setUserData] = useState({
    id: "",
    firstName: "",
    lastName: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("light"); // State for theme (light or dark)
  const [notifications, setNotifications] = useState([]); // State for notifications

  // Effect to initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Function to toggle between themes
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
  };

  // Retrieve userId from localStorage
  const userId = localStorage.getItem("userId");

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!userId) {
          throw new Error("User ID not found in localStorage.");
        }

        const response = await fetch(`http://localhost:8080/api/Personnel/byId/${userId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setUserData({
          id: data.id,
          firstName: data.nom || "",
          lastName: data.prenom || "",
        });
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  // SSE Logic for Real-Time Updates
  useEffect(() => {
    const eventSource = new EventSource("http://localhost:8080/sse/updates");

    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data);
      const { type, data } = update;

      console.log("Received update:", type, data); // Debugging

      // Handle updates based on type
      switch (type) {
        case "new_notification":
          // Update notifications state
          setNotifications((prevNotifications) => {
            const updatedNotifications = [...prevNotifications, data];

            // Save updated notifications to localStorage
            localStorage.setItem("notifications", JSON.stringify(updatedNotifications));

            return updatedNotifications;
          });
          break;

        case "created":
        case "demande_updated":
          // Handle demande updates (e.g., refresh data on other pages)
          console.log("Demande updated:", data);

          // Map the `typeDemande` field to the correct localStorage key
          const demandeTypeMap = {
            formation: "demandesFormation",
            PreAvnace: "demandesPreAvance",
            Document: "demandesDocument",
            autorisation: "demandesAutorisation",
            congé: "demandesConge",
          };

          const localStorageKey = demandeTypeMap[data.typeDemande] || "demandesOther";

          // Debug: Log the localStorage key
          console.log("LocalStorage key:", localStorageKey);

          // Retrieve existing demandes from localStorage
          const demandes = JSON.parse(localStorage.getItem(localStorageKey) || "[]");

          // Debug: Log existing demandes
          console.log("Existing demandes:", demandes);

          // Update the specific demande
          let updatedDemandes;
          if (type === "created") {
            // Add the new demande to the list
            updatedDemandes = [...demandes, data];
          } else {
            // Update the existing demande
            updatedDemandes = demandes.map((demande) =>
              demande.id === data.id ? { ...demande, ...data } : demande
            );
          }

          // Debug: Log updated demandes
          console.log("Updated demandes:", updatedDemandes);

          // Save updated demandes to localStorage
          localStorage.setItem(localStorageKey, JSON.stringify(updatedDemandes));
          break;

        default:
          console.warn("Unknown update type:", type);
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource failed:", error);
      eventSource.close();
    };

    // Cleanup on component unmount
    return () => {
      eventSource.close();
    };
  }, []);

  // Load notifications from localStorage on component mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem("notifications");
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
  }, []);

  if (loading) {
    return <div className="navbar">Loading user data...</div>;
  }

  if (error) {
    return <div className="navbar">Error: {error}</div>;
  }

  return (
    <nav className="navbar">
      <div className="navbar-text">
        Welcome, {userData.firstName} {userData.lastName}
      </div>
      <div className="navbar-actions">
        <button
          className="theme-toggle-button"
          onClick={toggleTheme}
          aria-label={theme === "light" ? "Passer au mode sombre" : "Passer au mode clair"}
        >
          {theme === "light" ? <FiMoon /> : <FiSun />}
        </button>
        <div className="notification-icon">
          <img src={bellIcon} alt="Notifications" onError={(e) => { e.target.src = "/placeholder.svg"; }} />
          <span className="notification-badge">{notifications.length}</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;