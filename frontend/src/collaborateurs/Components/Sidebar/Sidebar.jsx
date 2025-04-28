import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiHome,
  FiFileText,
  FiUser,
  FiMenu,
  FiChevronRight,
  FiChevronDown,
  FiChevronLeft,
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiCreditCard,
  FiFilePlus,
  FiFolder,
  FiLogOut,
  FiList,
} from "react-icons/fi";
import "./Sidebar.css";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile && !isCollapsed) {
        setIsCollapsed(true);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    const storedSidebarState = localStorage.getItem("sidebarCollapsed");
    if (storedSidebarState !== null) {
      setIsCollapsed(storedSidebarState === "true");
    }

    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        if (isMobile && !isCollapsed) {
          setIsCollapsed(true);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCollapsed, isMobile]);

  useEffect(() => {
    if (isMobile) {
      setOpenMenus({});
    }
  }, [location, isMobile]);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", newState.toString());
  };

  const showSidebar = () => {
    setIsCollapsed(false);
    localStorage.setItem("sidebarCollapsed", "false");
  };

  const toggleMenu = (menuName, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setOpenMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userCodeSoc");
    localStorage.removeItem("usermatricule");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userServiceId");
    localStorage.removeItem("userServiceName");
    localStorage.removeItem("userData");
    navigate("/");
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const isSubmenuActive = (paths) => {
    return paths.some((path) => location.pathname.includes(path));
  };

  const menuItems = [
    {
      name: "Accueil",
      icon: <FiHome className="sidebar-icon" />,
      path: "/AccueilCollaborateurs",
      exact: true,
    },
    {
      name: "Demandes",
      icon: <FiFileText className="sidebar-icon" />,
      submenu: [
        { name: "Formation", path: "/DemandeFormation", icon: <FiBriefcase /> },
        { name: "Congé", path: "/DemandeConge", icon: <FiCalendar /> },
        { name: "Autorisation", path: "/DemandeAutorisation", icon: <FiClock /> },
        { name: "Avance", path: "/DemandePreAvance", icon: <FiCreditCard /> },
        { name: "Document", path: "/DemandeDocument", icon: <FiFilePlus /> },
      ],
    },
    {
      name: "Documents",
      icon: <FiFolder className="sidebar-icon" />,
      path: "/Documents",
    },
    {
      name: "Profil",
      icon: <FiUser className="sidebar-icon" />,
      submenu: [
        { name: "Informations", path: "/Profile", icon: <FiUser /> },
        { name: "Historique Des Demandes", path: "/HistoriqueDemandes", icon: <FiList /> },
      ],
    },
    {
      name: "Calendrier de Congés",
      icon: <FiCalendar className="sidebar-icon" />,
      path: "/CalendarConge",
    },
  ];

  return (
    <>
      <div className={`sidebar-overlay ${!isCollapsed && isMobile ? "active" : ""}`} onClick={toggleSidebar}></div>

      <nav className={`sidebar ${isCollapsed ? "closed" : ""}`} ref={sidebarRef}>
        <div className="sidebar-header">
          <div className="logo-container">{!isCollapsed && <h2 className="sidebar-title">Portail RH</h2>}</div>
          <button
            className="toggle-btn"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>

        <ul className="sidebar-links">
          {menuItems.map((item, index) => (
            <li
              key={index}
              className={`sidebar-item ${
                item.submenu
                  ? isSubmenuActive(item.submenu.map((sub) => sub.path))
                    ? "active"
                    : ""
                  : isActive(item.path)
                    ? "active"
                    : ""
              }`}
            >
              {item.submenu ? (
                <>
                  <div
                    className="sidebar-link dropdown-trigger"
                    onClick={(e) => toggleMenu(item.name, e)}
                    aria-expanded={openMenus[item.name]}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        toggleMenu(item.name, e);
                      }
                    }}
                  >
                    <div className="sidebar-link-content">
                      {item.icon}
                      <span className="sidebar-text">{item.name}</span>
                    </div>
                    <span className="dropdown-arrow">
                      {openMenus[item.name] ? <FiChevronDown /> : <FiChevronRight />}
                    </span>
                  </div>
                  <ul className={`dropdown-menu ${openMenus[item.name] ? "open" : ""}`}>
                    {item.submenu.map((subItem, subIndex) => (
                      <li key={subIndex} className="dropdown-item">
                        <Link to={subItem.path} className={`dropdown-link ${isActive(subItem.path) ? "active" : ""}`}>
                          {subItem.icon && <span className="dropdown-icon">{subItem.icon}</span>}
                          {subItem.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <Link to={item.path} className="sidebar-link">
                  <div className="sidebar-link-content">
                    {item.icon}
                    <span className="sidebar-text">{item.name}</span>
                  </div>
                </Link>
              )}
            </li>
          ))}
        </ul>

        {!isCollapsed && (
          <div className="sidebar-footer">
            <button className="sidebar-action-btn logout-btn" onClick={handleLogout} aria-label="Logout">
              <FiLogOut />
              <span className="action-text">Déconnexion</span>
            </button>
          </div>
        )}
      </nav>

      {isCollapsed && (
        <button className="show-sidebar-button" onClick={showSidebar} aria-label="Show sidebar">
          <FiMenu />
        </button>
      )}
    </>
  );
};

export default Sidebar;