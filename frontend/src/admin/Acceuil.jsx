import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import Sidebar from "./Components/Sidebar/Sidebar"; 
import Navbar from "./Components/Navbar/Navbar";
import "./Acceuil.css";

const Accueil = () => {
  const [unviewedCount, setUnviewedCount] = useState(0);

  return (
    <div className="accueil-container">
      {/* Including Navbar Component */}
      <Navbar />

      {/* Including Sidebar Component */}
      <Sidebar />

      <div className="content">
        <div className="main-content">
          <h1>Welcome to the Dashboard</h1>
          <p>Manage your activities efficiently with MyApp.</p>
        </div>
      </div>
    </div>
  );
};

export default Accueil;
