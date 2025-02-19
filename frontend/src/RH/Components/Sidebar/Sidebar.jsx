import React, { useState } from "react";
import { Link } from 'react-router-dom';
import "./Sidebar.css";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false); 
  
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <nav className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="toggle-btn" onClick={toggleSidebar}>
        {isCollapsed ? '>' : '<'}
      </button>
      <ul className="sidebar-links">
        <li className="sidebar-item">
          <Link to="/AccueilRH" className="sidebar-link">
            <span className={`sidebar-text ${isCollapsed ? 'hidden' : ''}`}>Acceuil</span>
          </Link>
        </li>
        <li className="sidebar-item">
          <Link to="/PersonnelsRH" className="sidebar-link">
            <span className={`sidebar-text ${isCollapsed ? 'hidden' : ''}`}>Liste Des Personnels</span>
          </Link>
        </li>
        <li className="sidebar-item">
          <Link to="/DemandesRH" className="sidebar-link">
            <span className={`sidebar-text ${isCollapsed ? 'hidden' : ''}`}>Liste Des Demandes</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;
