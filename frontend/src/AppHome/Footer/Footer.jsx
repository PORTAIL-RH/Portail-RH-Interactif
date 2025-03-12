import React from "react";
import "./Footer.css"; 
import logo from "../../assets/logo.png";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-logo">
            <img src={logo || "/placeholder.svg"} alt="Logo de Société Arab Soft" className="logo-image" />
            <p className="company-description">
              Votre partenaire technologique de confiance pour des solutions innovantes et sur mesure.
            </p>
            <div className="social-links">
              <a href="#" className="social-link">
                <i className="social-icon facebook"></i>
              </a>
              <a href="#" className="social-link">
                <i className="social-icon twitter"></i>
              </a>
              <a href="#" className="social-link">
                <i className="social-icon instagram"></i>
              </a>
              <a href="#" className="social-link">
                <i className="social-icon linkedin"></i>
              </a>
            </div>
          </div>
          
          <div className="footer-links">
            <div className="footer-column">
              <h4 className="column-title">Entreprise</h4>
              <ul className="footer-menu">
                <li className="footer-menu-item">
                  <a href="/about" className="footer-menu-link">À propos</a>
                </li>
                <li className="footer-menu-item">
                  <a href="/services" className="footer-menu-link">Services</a>
                </li>
                <li className="footer-menu-item">
                  <a href="/candidates" className="footer-menu-link">Carrières</a>
                </li>
                <li className="footer-menu-item">
                  <a href="/contact" className="footer-menu-link">Contact</a>
                </li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4 className="column-title">Ressources</h4>
              <ul className="footer-menu">
                <li className="footer-menu-item">
                  <a href="/blog" className="footer-menu-link">Blog</a>
                </li>
                <li className="footer-menu-item">
                  <a href="/case-studies" className="footer-menu-link">Études de cas</a>
                </li>
                <li className="footer-menu-item">
                  <a href="/faq" className="footer-menu-link">FAQ</a>
                </li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4 className="column-title">Légal</h4>
              <ul className="footer-menu">
                <li className="footer-menu-item">
                  <a href="/privacy" className="footer-menu-link">Politique de confidentialité</a>
                </li>
                <li className="footer-menu-item">
                  <a href="/terms" className="footer-menu-link">Conditions d'utilisation</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="copyright">
            &copy; {new Date().getFullYear()} Société Arab Soft. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
