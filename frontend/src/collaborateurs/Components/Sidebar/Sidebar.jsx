import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { FiHome, FiFileText, FiUser, FiMenu, FiChevronRight, FiChevronDown, FiChevronLeft } from "react-icons/fi"
import "./Sidebar.css"

const Sidebar = () => {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDemandesOpen, setIsDemandesOpen] = useState(false)
  const [isProfilOpen, setIsProfilOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
    }

    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)

    // Check if sidebar state is stored in localStorage
    const storedSidebarState = localStorage.getItem("sidebarCollapsed")
    if (storedSidebarState !== null) {
      setIsCollapsed(storedSidebarState === "true")
    }

    return () => {
      window.removeEventListener("resize", checkScreenSize)
    }
  }, [])

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("sidebarCollapsed", newState.toString())

    // Update content area margin
    document.querySelector(".content-area").style.marginLeft = newState ? "70px" : "250px"
  }

  const showSidebar = () => {
    setIsCollapsed(false)
    localStorage.setItem("sidebarCollapsed", "false")

    // Update content area margin
    document.querySelector(".content-area").style.marginLeft = "250px"
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

  const isActive = (path) => {
    return location.pathname === path
  }

  const isSubmenuActive = (paths) => {
    return paths.some((path) => location.pathname.includes(path))
  }

  return (
    <>
      {/* Overlay for mobile */}
      <div className={`sidebar-overlay ${!isCollapsed && isMobile ? "active" : ""}`} onClick={toggleSidebar}></div>

      <nav className={`sidebar ${isCollapsed ? "closed" : ""}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">{!isCollapsed && <span>Portail RH</span>}</h2>
          <button className="toggle-btn" onClick={toggleSidebar}>
            {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>

        <ul className="sidebar-links">
          <li className={`sidebar-item ${isActive("/AccueilCollaborateurs") ? "active" : ""}`}>
            <Link to="/AccueilCollaborateurs" className="sidebar-link">
              <FiHome className="sidebar-icon" />
              <span className="sidebar-text">Accueil</span>
            </Link>
          </li>

          <li
            className={`sidebar-item ${isSubmenuActive(["/DemandeFormation", "/DemandeConge", "/DemandeAutorisation", "/DemandePreAvance", "/DemandeDocument"]) ? "active" : ""}`}
          >
            <div className="sidebar-link dropdown-trigger" onClick={toggleDemandes}>
              <FiFileText className="sidebar-icon" />
              <span className="sidebar-text">Demandes</span>
              <span className="dropdown-arrow">{isDemandesOpen ? <FiChevronDown /> : <FiChevronRight />}</span>
            </div>
            <ul className={`dropdown-menu ${isDemandesOpen ? "open" : ""}`}>
              <li className="dropdown-item">
                <Link to="/DemandeFormation" className="dropdown-link">
                  Formation
                </Link>
              </li>
              <li className="dropdown-item">
                <Link to="/DemandeConge" className="dropdown-link">
                  Congé
                </Link>
              </li>
              <li className="dropdown-item">
                <Link to="/DemandeAutorisation" className="dropdown-link">
                  Autorisation
                </Link>
              </li>
              <li className="dropdown-item">
                <Link to="/DemandePreAvance" className="dropdown-link">
                  Avance
                </Link>
              </li>
              <li className="dropdown-item">
                <Link to="/DemandeDocument" className="dropdown-link">
                  Document
                </Link>
              </li>
            </ul>
          </li>

          <li className={`sidebar-item ${isActive("/Profile") ? "active" : ""}`}>
            <Link to="/Profile" className="sidebar-link">
              <FiUser className="sidebar-icon" />
              <span className="sidebar-text">Profil</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Show sidebar button - appears when sidebar is collapsed */}
      {isCollapsed && !isMobile && (
        <button className="show-sidebar-button" onClick={showSidebar}>
          <FiMenu />
        </button>
      )}
    </>
  )
}

export default Sidebar

