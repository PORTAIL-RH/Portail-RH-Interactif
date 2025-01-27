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
          <Link to="/Accueil" className="sidebar-link">
            <span className={`sidebar-text ${isCollapsed ? 'hidden' : ''}`}>Acceuil</span>
          </Link>
        </li>
        <li className="sidebar-item">
          <Link to="/Personnel" className="sidebar-link">
            <span className={`sidebar-text ${isCollapsed ? 'hidden' : ''}`}>Personnels</span>
          </Link>
        </li>
        <li className="sidebar-item">
          <Link to="/Addpers" className="sidebar-link">
            <span className={`sidebar-text ${isCollapsed ? 'hidden' : ''}`}>Ajouter Personnel</span>
          </Link>
        </li>
        <li className="sidebar-item">
          <Link to="/Addpers" className="sidebar-link">
            <span className={`sidebar-text ${isCollapsed ? 'hidden' : ''}`}>Demandes</span>
          </Link>
        </li>
        <li className="sidebar-item">
          <Link to="/Apropos" className="sidebar-link">
            <span className={`sidebar-text ${isCollapsed ? 'hidden' : ''}`}>A propos de nous</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;
