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
          <Link to="/AccueilCHEF" className="sidebar-link">
            <span className={`sidebar-text ${isCollapsed ? 'hidden' : ''}`}>Acceuil</span>
          </Link>
        </li>
        <li className="sidebar-item">
          <Link to="/Personnels" className="sidebar-link">
            <span className={`sidebar-text ${isCollapsed ? 'hidden' : ''}`}>Liste Des Collaborateurs</span>
          </Link>
        </li>
        <li className="sidebar-item">
          <Link to="/Demandes" className="sidebar-link">
            <span className={`sidebar-text ${isCollapsed ? 'hidden' : ''}`}>Liste Des Demandes</span>
          </Link>
        </li>
        <li className="sidebar-item">
          <Link to="/Calendar" className="sidebar-link">
            <span className={`sidebar-text ${isCollapsed ? 'hidden' : ''}`}>Calendrier des Conges</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;
