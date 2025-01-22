import React from "react";
import { Link } from 'react-router-dom';
import "./Sidebar.css";

const Sidebar = () => {
    return (
<nav className="sidebar">
        <ul className="sidebar-links">
          <li className="sidebar-item">
            <Link to="/Accueil" className="sidebar-link">
              <span className="sidebar-text">Acceuil</span>
            </Link>
          </li>
          <li className="sidebar-item">
            <Link to="/Personnel" className="sidebar-link">
              <span className="sidebar-text">Personnels</span>
            </Link>
          </li>
          <li className="sidebar-item">
            <Link to="/about" className="sidebar-link">
              <span className="sidebar-text">A propos de nous</span>
            </Link>
          </li>
        </ul>
      </nav>
    );
};

export default Sidebar;