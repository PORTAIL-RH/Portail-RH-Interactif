import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiHome, FiUsers, FiBriefcase, FiUser, FiCalendar, FiSettings } from "react-icons/fi";
import { MdDashboard } from "react-icons/md";
import { FiChevronDown, FiChevronRight, FiChevronLeft } from "react-icons/fi";
import "./Sidebar.css";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDemandesOpen, setIsDemandesOpen] = useState(false);
  const [isProfilOpen, setIsProfilOpen] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleDemandes = (e) => {
    e.stopPropagation(); // Empêche la propagation de l'événement
    setIsDemandesOpen(!isDemandesOpen);
    setIsProfilOpen(false); // Close the other dropdown
  };

  const toggleProfil = (e) => {
    e.stopPropagation(); // Empêche la propagation de l'événement
    setIsProfilOpen(!isProfilOpen);
    setIsDemandesOpen(false); // Close the other dropdown
  };

  return (
    <nav className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">
          {!isCollapsed && <span>Portail RH</span>}
        </h2>
        <button className="toggle-btn" onClick={toggleSidebar}>
          {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>
      <ul className="sidebar-links">
        <li className="sidebar-item">
          <Link to="/AccueilCHEF" className="sidebar-link">
            <MdDashboard className="sidebar-icon" />
            <span className="sidebar-text">Dashboard</span>
          </Link>
        </li>

        <li className="sidebar-item">
          <Link to="/Personnels" className="sidebar-link">
            <FiUsers className="sidebar-icon" />
            <span className="sidebar-text">Employees</span>
          </Link>
        </li>

        <li className="sidebar-item">
          <div className="sidebar-link dropdown-trigger" onClick={toggleDemandes}>
            <FiHome className="sidebar-icon" />
            <span className="sidebar-text">Demandes</span>
            <span className="dropdown-arrow">
              {isDemandesOpen ? <FiChevronDown /> : <FiChevronRight />}
            </span>
          </div>
          <ul className={`dropdown-menu ${isDemandesOpen ? "open" : ""}`}>
            <li className="dropdown-item">
              <Link to="/Formation" className="dropdown-link">Formation</Link>
            </li>
            <li className="dropdown-item">
              <Link to="/Autorisation" className="dropdown-link">Autorisation</Link>
            </li>
            <li className="dropdown-item">
              <Link to="/PreAvance" className="dropdown-link">Pre-Avance</Link>
            </li>
            <li className="dropdown-item">
              <Link to="/Document" className="dropdown-link">Document</Link>
            </li>
            <li className="dropdown-item">
              <Link to="/Conge" className="dropdown-link">Conge</Link>
            </li>
          </ul>
        </li>

        <li className="sidebar-item">
          <Link to="/calendar" className="sidebar-link">
            <FiCalendar className="sidebar-icon" />
            <span className="sidebar-text">Canlendrier de congés</span>
          </Link>
        </li>
        <li className="sidebar-item">
          <Link to="/Candidatures" className="sidebar-link">
            <FiUser className="sidebar-icon" />
            <span className="sidebar-text">Condidats</span>
          </Link>
        </li>
        <li className="sidebar-item">
          <div className="sidebar-link dropdown-trigger" onClick={toggleProfil}>
            <FiUser className="sidebar-icon" />
            <span className="sidebar-text">Profil</span>
            <span className="dropdown-arrow">
              {isProfilOpen ? <FiChevronDown /> : <FiChevronRight />}
            </span>
          </div>
          <ul className={`dropdown-menu ${isProfilOpen ? "open" : ""}`}>
            <li className="dropdown-item">
              <Link to="/ProfileCHEF" className="dropdown-link">Profil</Link>
            </li>
            <li className="dropdown-item">
              <Link to="/DemandesCHEF" className="dropdown-link">Mes demandes</Link>
            </li>
            <li className="dropdown-item">
              <Link to="/AjoutDemandeAutorisation" className="dropdown-link">Ajout-demande</Link>
            </li>

          </ul>
        </li>

        <li className="sidebar-item">
          <Link to="/settings" className="sidebar-link">
            <FiSettings className="sidebar-icon" />
            <span className="sidebar-text">Paramétres</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;