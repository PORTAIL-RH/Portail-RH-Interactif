import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { FiHome, FiUsers, FiUser } from "react-icons/fi"
import { MdDashboard } from "react-icons/md"
import { FiChevronDown, FiChevronRight, FiChevronLeft } from "react-icons/fi"
import "./Sidebar.css"

const Sidebar = ({ theme }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDemandesOpen, setIsDemandesOpen] = useState(false)
  const [isProfilOpen, setIsProfilOpen] = useState(false)
  const [isEmployesOpen, setIsEmployesOpen] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(theme || "dark")
  const location = useLocation()
  const role = localStorage.getItem("userRole") || "RH"

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    window.dispatchEvent(new CustomEvent("sidebarToggled", { detail: !isCollapsed }));
  };

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark"
    setCurrentTheme(savedTheme)
  }, [])

  // Listen for theme changes
  useEffect(() => {
    const handleStorageChange = () => {
      const currentTheme = localStorage.getItem("theme") || "dark"
      setCurrentTheme(currentTheme)
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("themeChanged", (e) => {
      setCurrentTheme(e.detail || "dark")
    })

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("themeChanged", handleStorageChange)
    }
  }, [])

  // Update theme when prop changes
  useEffect(() => {
    if (theme) {
      setCurrentTheme(theme)
    }
  }, [theme])

  const toggleDemandes = (e) => {
    e.stopPropagation()
    setIsDemandesOpen(!isDemandesOpen)
    setIsProfilOpen(false)
    setIsEmployesOpen(false)
  }

  const toggleProfil = (e) => {
    e.stopPropagation()
    setIsProfilOpen(!isProfilOpen)
    setIsDemandesOpen(false)
    setIsEmployesOpen(false)
  }

  const toggleEmployes = (e) => {
    e.stopPropagation()
    setIsEmployesOpen(!isEmployesOpen)
    setIsDemandesOpen(false)
    setIsProfilOpen(false)
  }

  // Check if a link is active
  const isActive = (path) => {
    return location.pathname === path
  }

  // Render menu items based on role
  const renderMenuItems = () => {
    if (role === "Admin") {
      return (
        <>
          <li className="sidebar-item">
            <Link to="/Accueil" className={`sidebar-link ${isActive("/Accueil") ? "active" : ""}`}>
              <MdDashboard className="sidebar-icon" />
              <span className="sidebar-text">Tableau de bord</span>
            </Link>
          </li>

          <li className="sidebar-item">
            <div className="sidebar-link dropdown-trigger" onClick={toggleEmployes}>
              <FiUsers className="sidebar-icon" />
              <span className="sidebar-text">Employés</span>
              <span className="dropdown-arrow">{isEmployesOpen ? <FiChevronDown /> : <FiChevronRight />}</span>
            </div>
            <ul className={`dropdown-menu ${isEmployesOpen ? "open" : ""}`}>
              <li className="dropdown-item">
                <Link to="/Personnel" className="dropdown-link">
                  Employés
                </Link>
              </li>
              <li className="dropdown-item">
                <Link to="/LockedPersonnel" className="dropdown-link">
                  Locked Employés
                </Link>
              </li>
            </ul>
          </li>

          <li className="sidebar-item">
            <div className="sidebar-link dropdown-trigger" onClick={toggleDemandes}>
              <FiHome className="sidebar-icon" />
              <span className="sidebar-text">Ajout</span>
              <span className="dropdown-arrow">{isDemandesOpen ? <FiChevronDown /> : <FiChevronRight />}</span>
            </div>
            <ul className={`dropdown-menu ${isDemandesOpen ? "open" : ""}`}>
              <li className="dropdown-item">
                <Link to="/AjoutSociete" className="dropdown-link">
                  Société
                </Link>
              </li>
              <li className="dropdown-item">
                <Link to="/AjoutPersonnel" className="dropdown-link">
                  Personnel
                </Link>
              </li>
              <li className="dropdown-item">
                <Link to="/AjoutService" className="dropdown-link">
                  Service
                </Link>
              </li>
              <li className="dropdown-item">
                <Link to="/AjoutCandidature" className="dropdown-link">
                  Candidature
                </Link>
              </li>
            </ul>
          </li>

          <li className="sidebar-item">
            <Link to="/Candidaturesadmin" className={`sidebar-link ${isActive("/Candidaturesadmin") ? "active" : ""}`}>
              <FiUser className="sidebar-icon" />
              <span className="sidebar-text">Candidats</span>
            </Link>
          </li>

          <li className="sidebar-item">
            <div className="sidebar-link dropdown-trigger" onClick={toggleProfil}>
              <FiUser className="sidebar-icon" />
              <span className="sidebar-text">Profil</span>
              <span className="dropdown-arrow">{isProfilOpen ? <FiChevronDown /> : <FiChevronRight />}</span>
            </div>
            <ul className={`dropdown-menu ${isProfilOpen ? "open" : ""}`}>
              <li className="dropdown-item">
                <Link to="/ProfileADMIN" className="dropdown-link">
                  Profil
                </Link>
              </li>
            </ul>
          </li>
        </>
      )
    } else {
      // Default menu items for other roles
      return (
        <>
          <li className="sidebar-item">
            <Link to="/Accueil" className={`sidebar-link ${isActive("/Accueil") ? "active" : ""}`}>
              <MdDashboard className="sidebar-icon" />
              <span className="sidebar-text">Dashboard</span>
            </Link>
          </li>
          <li className="sidebar-item">
            <Link to="/Profile" className={`sidebar-link ${isActive("/Profile") ? "active" : ""}`}>
              <FiUser className="sidebar-icon" />
              <span className="sidebar-text">Profil</span>
            </Link>
          </li>
        </>
      )
    }
  }

  return (
    <div className="sidebar-wrapper">
      <nav className={`sidebar ${isCollapsed ? "collapsed" : ""} ${currentTheme}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">{!isCollapsed && <span>Portail RH</span>}</h2>
          <button className="toggle-btn" onClick={toggleSidebar} aria-label="Toggle Sidebar">
            {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>
        <ul className="sidebar-links">{renderMenuItems()}</ul>
      </nav>
    </div>
  )
}

export default Sidebar