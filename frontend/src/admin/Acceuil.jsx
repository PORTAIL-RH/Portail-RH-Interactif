import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import Sidebar from "./Components/Sidebar/Sidebar"; 
import Navbar from "./Components/Navbar/Navbar";
import "./Acceuil.css";

const Accueil = () => {
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [personalNumber, setPersonalNumber] = useState(0); 

  useEffect(() => {

  }, []);

  return (
    <div className="accueil-container">
      <Navbar />
      <Sidebar />

      <div className="content">
        <div className="main-content">
          <h1>Welcome to the Dashboard</h1>
          <p>Manage your activities efficiently with MyApp.</p>

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

          <div className="personal-number-container">
            <h3>Your Personal Number</h3>
            <p>{personalNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accueil;
