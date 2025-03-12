"use client"

import { useState, useEffect } from "react"
import "./Nav.css" // Fichier CSS pour le style
import logo from "../../assets/logo.png" // Importez l'image du logo

const Navbar = ({ transparent = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Close mobile menu when window is resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMenuOpen) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [isMenuOpen])

  return (
    <header className={`candidates-headerr ${transparent ? "transparent" : ""} ${isScrolled ? "scrolled" : ""}`}>
      <div className="header-container">
        <div className="logo">
          <img src={logo || "/placeholder.svg"} alt="Logo de Société Arab Soft" className="logoo-icon" />
        </div>

        <button className="mobile-menu-button" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
          {isMenuOpen ? "✕" : "☰"}
        </button>

        <nav className={`main-nav ${isMenuOpen ? "open" : ""}`}>
          <ul>
            <li>
              <a href="/" className={window.location.pathname === "/" ? "active" : ""}>
                Accueil
              </a>
            </li>
            <li>
              <a href="/about" className={window.location.pathname === "/about" ? "active" : ""}>
                À propos
              </a>
            </li>
            <li>
              <a href="/services" className={window.location.pathname === "/services" ? "active" : ""}>
                Services
              </a>
            </li>
            <li>
              <a href="/candidates" className={window.location.pathname === "/candidates" ? "active" : ""}>
                Carrières
              </a>
            </li>
            <li>
              <a href="/contact" className={window.location.pathname === "/contact" ? "active" : ""}>
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Navbar

