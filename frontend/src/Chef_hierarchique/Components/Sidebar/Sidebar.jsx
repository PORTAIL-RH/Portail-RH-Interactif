import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiUser,
  FiCalendar,
  FiChevronDown,
  FiChevronRight,
  FiChevronLeft,
  FiSettings,
} from "react-icons/fi";
import { MdDashboard } from "react-icons/md";
import "./Sidebar.css";

const Sidebar = ({ theme }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDemandesOpen, setIsDemandesOpen] = useState(false);
  const [isProfilOpen, setIsProfilOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(theme || "light");
  const location = useLocation();
  const role = localStorage.getItem("userRole") || "Chef Hiérarchique";

  // Initialize theme and collapse state
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    const savedCollapse = localStorage.getItem("isSidebarCollapsed") === "true";
    setCurrentTheme(savedTheme);
    setIsCollapsed(savedCollapse);
  }, []);

  // Listen for theme changes
  useEffect(() => {
    const handleStorageChange = () => {
      const currentTheme = localStorage.getItem("theme") || "light";
      setCurrentTheme(currentTheme);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("themeChanged", (e) => {
      setCurrentTheme(e.detail || "light");
    });

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("themeChanged", handleStorageChange);
    };
  }, []);

  // Watch for theme prop changes
  useEffect(() => {
    if (theme) {
      setCurrentTheme(theme);
    }
  }, [theme]);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("isSidebarCollapsed", newState);
  };

  const toggleDemandes = (e) => {
    e.stopPropagation();
    setIsDemandesOpen(!isDemandesOpen);
    setIsProfilOpen(false);
  };

  const toggleProfil = (e) => {
    e.stopPropagation();
    setIsProfilOpen(!isProfilOpen);
    setIsDemandesOpen(false);
  };

  const isActive = (path) => location.pathname === path;
  const isPathActive = (path) => location.pathname.startsWith(path);

  return (
    <nav className={`sidebar ${isCollapsed ? "collapsed" : ""} ${currentTheme}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">{!isCollapsed && <span>Portail RH</span>}</h2>
        <button className="toggle-btn" onClick={toggleSidebar} aria-label="Toggle Sidebar">
          {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>

      <ul className="sidebar-links">
        <li className="sidebar-item">
          <Link to="/AccueilCHEF" className={`sidebar-link ${isActive("/AccueilCHEF") ? "active" : ""}`}>
            <MdDashboard className="sidebar-icon" />
            <span className="sidebar-text">Dashboard</span>
          </Link>
        </li>

        <li className="sidebar-item">
          <Link to="/Personnels" className={`sidebar-link ${isActive("/Personnels") ? "active" : ""}`}>
            <FiUsers className="sidebar-icon" />
            <span className="sidebar-text">Employés</span>
          </Link>
        </li>

        <li className="sidebar-item">
          <div
            className={`sidebar-link dropdown-trigger ${
              isPathActive("/Formation") ||
              isPathActive("/Autorisation") ||
              isPathActive("/PreAvance") ||
              isPathActive("/Conge")
                ? "active"
                : ""
            }`}
            onClick={toggleDemandes}
            role="button"
            tabIndex={0}
            aria-expanded={isDemandesOpen}
          >
            <FiHome className="sidebar-icon" />
            <span className="sidebar-text">Demandes</span>
            <span className="dropdown-arrow">{isDemandesOpen ? <FiChevronDown /> : <FiChevronRight />}</span>
          </div>
          <ul className={`dropdown-menu ${isDemandesOpen ? "open" : ""}`}>
            <li className="dropdown-item">
              <Link to="/Formation" className={`dropdown-link ${isActive("/Formation") ? "active" : ""}`}>
                Formation
              </Link>
            </li>
            <li className="dropdown-item">
              <Link to="/Autorisation" className={`dropdown-link ${isActive("/Autorisation") ? "active" : ""}`}>
                Autorisation
              </Link>
            </li>
            <li className="dropdown-item">
              <Link to="/Conge" className={`dropdown-link ${isActive("/Conge") ? "active" : ""}`}>
                Congé
              </Link>
            </li>
          </ul>
        </li>

        <li className="sidebar-item">
          <Link to="/calendar" className={`sidebar-link ${isActive("/calendar") ? "active" : ""}`}>
            <FiCalendar className="sidebar-icon" />
            <span className="sidebar-text">Calendrier de congés</span>
          </Link>
        </li>

        <li className="sidebar-item">
          <div
            className={`sidebar-link dropdown-trigger ${
              isPathActive("/ProfileCHEF") ||
              isPathActive("/Documentschef") ||
              isPathActive("/DemandesCHEF") ||
              isPathActive("/AjoutDemandeAutorisationCHEF")
                ? "active"
                : ""
            }`}
            onClick={toggleProfil}
            role="button"
            tabIndex={0}
            aria-expanded={isProfilOpen}
          >
            <FiUser className="sidebar-icon" />
            <span className="sidebar-text">Profil</span>
            <span className="dropdown-arrow">{isProfilOpen ? <FiChevronDown /> : <FiChevronRight />}</span>
          </div>
          <ul className={`dropdown-menu ${isProfilOpen ? "open" : ""}`}>
            <li className="dropdown-item">
              <Link to="/ProfileCHEF" className={`dropdown-link ${isActive("/ProfileCHEF") ? "active" : ""}`}>
                Profil
              </Link>
            </li>
            <li className="dropdown-item">
              <Link to="/Documentschef" className={`dropdown-link ${isActive("/Documentschef") ? "active" : ""}`}>
                Mes documents
              </Link>
            </li>
            <li className="dropdown-item">
              <Link to="/DemandesCHEF" className={`dropdown-link ${isActive("/DemandesCHEF") ? "active" : ""}`}>
                Mes demandes
              </Link>
            </li>
            <li className="dropdown-item">
              <Link
                to="/CongeChef"
                className={`dropdown-link ${isActive("/CongeChef") ? "active" : ""}`}
              >
                Ajout-demande
              </Link>
            </li>
          </ul>
        </li>

        {role === "Admin" && (
          <li className="sidebar-item">
            <Link to="/admin" className={`sidebar-link ${isActive("/admin") ? "active" : ""}`}>
              <FiSettings className="sidebar-icon" />
              <span className="sidebar-text">Admin Panel</span>
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Sidebar;
