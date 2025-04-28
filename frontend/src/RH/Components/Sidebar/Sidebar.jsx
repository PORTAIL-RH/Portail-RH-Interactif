import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { FiHome, FiUsers, FiUser, FiCalendar } from "react-icons/fi"
import { MdDashboard } from "react-icons/md"
import { FiChevronDown, FiChevronRight, FiChevronLeft } from "react-icons/fi"
import "./Sidebar.css"

const Sidebar = ({ theme }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDemandesOpen, setIsDemandesOpen] = useState(false)
  const [isProfilOpen, setIsProfilOpen] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(theme || "light")

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    setCurrentTheme(savedTheme)
  }, [])

  // Listen for theme changes
  useEffect(() => {
    const handleStorageChange = () => {
      const currentTheme = localStorage.getItem("theme") || "light"
      setCurrentTheme(currentTheme)
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("themeChanged", (e) => {
      setCurrentTheme(e.detail || "light")
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

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const toggleDemandes = (e) => {
    e.stopPropagation() // Prevent event propagation
    setIsDemandesOpen(!isDemandesOpen)
    setIsProfilOpen(false) // Close the other dropdown
  }

  const toggleProfil = (e) => {
    e.stopPropagation() // Prevent event propagation
    setIsProfilOpen(!isProfilOpen)
    setIsDemandesOpen(false) // Close the other dropdown
  }

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
          <Link to="/AccueilRH" className="sidebar-link">
            <MdDashboard className="sidebar-icon" />
            <span className="sidebar-text">Dashboard</span>
          </Link>
        </li>

        <li className="sidebar-item">
          <Link to="/PersonnelsRH" className="sidebar-link">
            <FiUsers className="sidebar-icon" />
            <span className="sidebar-text">Employees</span>
          </Link>
        </li>

        <li className="sidebar-item">
          <div className="sidebar-link dropdown-trigger" onClick={toggleDemandes}>
            <FiHome className="sidebar-icon" />
            <span className="sidebar-text">Demandes</span>
            <span className="dropdown-arrow">{isDemandesOpen ? <FiChevronDown /> : <FiChevronRight />}</span>
          </div>
          <ul className={`dropdown-menu ${isDemandesOpen ? "open" : ""}`}>
            <li className="dropdown-item">
              <Link to="/FormationRH" className="dropdown-link">
                Formation
              </Link>
            </li>
            <li className="dropdown-item">
              <Link to="/AutorisationRH" className="dropdown-link">
                Autorisation
              </Link>
            </li>
            <li className="dropdown-item">
              <Link to="/PreAvanceRH" className="dropdown-link">
                Pre-Avance
              </Link>
            </li>
            <li className="dropdown-item">
              <Link to="/DocumentRH" className="dropdown-link">
                Document
              </Link>
            </li>
            <li className="dropdown-item">
              <Link to="/CongeRH" className="dropdown-link">
                Conge
              </Link>
            </li>
          </ul>
        </li>

        <li className="sidebar-item">
          <Link to="/calendarRH" className="sidebar-link">
            <FiCalendar className="sidebar-icon" />
            <span className="sidebar-text">Calendrier de congés</span>
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
              <Link to="/ProfileRH" className="dropdown-link">
                Profil
              </Link>
            </li>
            <li className="dropdown-item">
              <Link to="/DemandesRH" className="dropdown-link">
                Mes demandes
              </Link>
            </li>
            <li className="dropdown-item">
              <Link to="/AjoutDemandeAutorisationRH" className="dropdown-link">
                Ajout-demande
              </Link>
            </li>
            <li className="dropdown-item">
              <Link to="/DocumentsRH" className="dropdown-link">
                Documents
              </Link>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  )
}

export default Sidebar

