import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import Sidebar from "./Components/Sidebar/Sidebar"; 
import Navbar from "./Components/Navbar/Navbar";
import "./Acceuil.css";

const Accueil = () => {
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [personalNumber, setPersonalNumber] = useState(""); 
  const [activatedPersonnel, setActivatedPersonnel] = useState(0); 
  const [nonActivatedPersonnel, setNonActivatedPersonnel] = useState(0); 
  const [totalPersonnel, setTotalPersonnel] = useState(0); // New state for total personnel count
  useEffect(() => {
    // Fetch personnel data from the backend
    fetch("http://localhost:8080/api/Personnel/all")
      .then((response) => response.json())
      .then((data) => {
        setTotalPersonnel(data.length); // Total personnel count
        const activated = data.filter(person => person.status === "activated").length;
        const nonActivated = data.filter(person => person.status === "non-activated").length;
        setActivatedPersonnel(activated);
        setNonActivatedPersonnel(nonActivated);
      })
      .catch((error) => console.error("Error fetching personnel data:", error));

    // Fetch unread notifications count
    fetch("http://localhost:8080/api/notifications/unreadnbr")
      .then((response) => response.json())
      .then((data) => {
        setUnviewedCount(data); // `data` should now be an integer (count)
      })
      .catch((error) => console.error("Error fetching unread notifications:", error));

    // Fetch all notifications count
    fetch("http://localhost:8080/api/notifications/nbr")
      .then((response) => response.json())
      .then((data) => {
        setTotalNotifications(data); // `data` should now be an integer (count)
      })
      .catch((error) => console.error("Error fetching all notifications:", error));

    // Fetch personal number (adjust according to your backend)
    setPersonalNumber("1234567890"); // Replace with actual dynamic data if available
}, []);



  return (
    <div className="accueil-containerp">
      <Navbar />
      <Sidebar />

      <div className="contentp">
        <div className="main-contentp">
          <h1>Welcome to the Dashboard</h1>
          <p>Manage your activities efficiently with MyApp.</p>

        
          {/* Activated and Non-Activated Personnel Section */}
          <div className="personnel-section">
            <h2>Personnel Overview</h2>
            <div className="personnel-container">
              <div className="personnel-card activated-personnel">
                <h3>Activated Personnel</h3>
                <p>{activatedPersonnel} activated personnel</p>
              </div>
              <div className="personnel-card non-activated-personnel">
                <h3>Non-Activated Personnel</h3>
                <p>{nonActivatedPersonnel} non-activated personnel</p>
              </div>
              <div className="personnel-card total-personnel">
                <h3>Total Personnel</h3>
                <p>{totalPersonnel} total personnel</p>
              </div>
            </div>
          </div>
        </div>

       {/* Notifications Section */}
<div className="notifications-section">
  <h2>Notifications</h2>
  <div className="notifications-container">
    <div className="notification-card">
      <h3>Unread Notifications</h3>
      <p>{unviewedCount} new notifications</p>
    </div>
    <div className="notification-card">
      <h3>All Notifications</h3>
      <p>{totalNotifications} notifications</p>
    </div>
  </div>
</div>

      </div>
    </div>
  );
};

export default Accueil;
