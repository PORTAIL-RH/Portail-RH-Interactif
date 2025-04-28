import { Link } from "react-router-dom"
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react'
import "./Footer.css"

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-column">
            <Link to="/" className="footer-logo">
              <span className="footer-logo-text">Arab<span className="footer-logo-accent">Soft</span></span>
            </Link>
            <p className="footer-description">
              Fournisseur leader de solutions informatiques innovantes, aidant les entreprises à prospérer dans l'ère numérique.
            </p>
            <div className="footer-social">
              <a href="https://facebook.com" className="social-link" aria-label="Facebook">
                <Facebook size={18} />
              </a>
              <a href="https://twitter.com" className="social-link" aria-label="Twitter">
                <Twitter size={18} />
              </a>
              <a href="https://linkedin.com" className="social-link" aria-label="LinkedIn">
                <Linkedin size={18} />
              </a>
              <a href="https://instagram.com" className="social-link" aria-label="Instagram">
                <Instagram size={18} />
              </a>
            </div>
          </div>

          <div className="footer-column">
            <h3 className="footer-heading">Services</h3>
            <ul className="footer-links">
              <li><Link to="">Développement Logiciel</Link></li>
              <li><Link to="">Conseil IT</Link></li>
              <li><Link to="">Solutions Cloud</Link></li>
              <li><Link to="">Applications Mobiles</Link></li>
              <li><Link to="">Intelligence Artificielle</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3 className="footer-heading">Entreprise</h3>
            <ul className="footer-links">
              <li><Link to="">À Propos</Link></li>
              <li><Link to="/careers">Carrières</Link></li>
              <li><Link to="">Partenaires</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3 className="footer-heading">Contact</h3>
            <ul className="footer-contact">
              <li>
                <Phone size={16} />
                <span>+216 71 123 456</span>
              </li>
              <li>
                <Mail size={16} />
                <span>contact@arabsoft.com</span>
              </li>
              <li>
                <MapPin size={16} />
                <span>123 Rue Technologie, Tunis, Tunisie</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="copyright">
            &copy; {currentYear} ArabSoft. Tous droits réservés.
          </div>
          <div className="footer-legal">
            <Link to="/privacy">Politique de Confidentialité</Link>
            <Link to="/terms">Conditions d'Utilisation</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
