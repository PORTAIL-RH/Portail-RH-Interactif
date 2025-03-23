import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiHome, FiUsers, FiBriefcase, FiUser, FiCalendar, FiSettings } from "react-icons/fi";
import { MdDashboard } from "react-icons/md";
import { FiChevronDown, FiChevronRight, FiChevronLeft } from "react-icons/fi";
import "./Sidebar.css";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAjoutOpen, setIsAjoutOpen] = useState(false); // État pour le menu "Ajout"
  const [isProfilOpen, setIsProfilOpen] = useState(false); // État pour le menu "Profil"

  // Basculer l'état de la sidebar (réduite ou étendue)
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Basculer le menu "Ajout"
  const toggleAjout = (e) => {
    e.stopPropagation(); // Empêche la propagation de l'événement
    setIsAjoutOpen(!isAjoutOpen);
    setIsProfilOpen(false); // Ferme le menu "Profil" si ouvert
  };

  // Basculer le menu "Profil"
  const toggleProfil = (e) => {
    e.stopPropagation(); // Empêche la propagation de l'événement
    setIsProfilOpen(!isProfilOpen);
    setIsAjoutOpen(false); // Ferme le menu "Ajout" si ouvert
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
          <Link to="/Accueil" className="sidebar-link">
            <MdDashboard className="sidebar-icon" />
            <span className="sidebar-text">Dashboard</span>
          </Link>
        </li>

        <li className="sidebar-item">
          <Link to="/Personnel" className="sidebar-link">
            <FiUsers className="sidebar-icon" />
            <span className="sidebar-text">Employees</span>
          </Link>
        </li>

        {/* Menu "Ajout" */}
        <li className="sidebar-item">
          <div className="sidebar-link dropdown-trigger" onClick={toggleAjout}>
            <FiUser className="sidebar-icon" />
            <span className="sidebar-text">Ajout</span>
            <span className="dropdown-arrow">
              {isAjoutOpen ? <FiChevronDown /> : <FiChevronRight />}
            </span>
          </div>
          <ul className={`dropdown-menu ${isAjoutOpen ? "open" : ""}`}>
            <li className="dropdown-item">
              <Link to="/AjoutPersonnel" className="dropdown-link">Personnel</Link>
            </li>
            <li className="dropdown-item">
              <Link to="/AjoutRole" className="dropdown-link">Role</Link>
            </li>
            <li className="dropdown-item">
              <Link to="/AjoutService" className="dropdown-link">Service</Link>
            </li>
            <li className="dropdown-item">
              <Link to="/AjoutCandidature" className="dropdown-link">Candidature</Link>
            </li>
          </ul>
        </li>

        <li className="sidebar-item">
          <Link to="/Candidaturesadmin" className="sidebar-link">
            <FiUser className="sidebar-icon" />
            <span className="sidebar-text">Candidats</span>
          </Link>
        </li>

        {/* Menu "Profil" */}
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
              <Link to="/ProfileADMIN" className="dropdown-link">Profil</Link>
            </li>
            <li className="dropdown-item">
              <Link to="/DemandesADMIN" className="dropdown-link">Mes demandes</Link>
            </li>
            <li className="dropdown-item">
              <Link to="/AjoutDemandeAutorisationADMIN" className="dropdown-link">Ajout-demande</Link>
            </li>
          </ul>
        </li>

        <li className="sidebar-item">
          <Link to="/settings" className="sidebar-link">
            <FiSettings className="sidebar-icon" />
            <span className="sidebar-text">Paramètres</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;