import React from 'react';
import './Home.css';
import homeImage from '../../assets/home.png';
import logo from '../../assets/logo.png';
import { Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaComment } from 'react-icons/fa';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import ShinyText from './ShinyText';


function Home() {
  return (
    <div className="company-website-homepage">
         {/* Section d'en-tête */}
         <div className="header">
        <div className="logo">
        <img src={logo} alt="Accueil" />
        </div>
        <div className="nav-links">
        <Link to="/CompanyHome" className="nav-link">Home</Link>
        <span className="nav-link">À propos</span>
          <span className="nav-link">Nos Services</span>
          <span className="nav-link">Contactez-nous</span>
          <Link to="/Form" className="nav-link">Rejoignez-nous</Link>

        </div>
        <div className="sign-in-container">
      <Link to="/" className="sign-in-link">
        <ShinyText 
          text="Se Connecter" 
          disabled={false} 
          speed={1.5} 
          className="sign-in-button" 
        />
      </Link>
    </div>
      </div>

      {/* Section Héro */}
      <div className="hero-section">
        <div className="hero-text">
          <h1>Fournir des solutions de pointe dans le secteur technologique</h1>
          <p>
            ArabSoft est une entreprise tunisienne leader dans le domaine des solutions informatiques, offrant des services innovants et adaptés aux besoins de nos clients.
          </p>
          <div className="learn-more-button">
            <span>En savoir plus</span>
          </div>
        </div>
        <div className="hero-image">
          <img src={homeImage} alt="Accueil" />
        </div>
      </div>

      {/* Section À propos de l'entreprise */}
      <div className="about-company-section">
        <h2>À propos d'ArabSoft</h2>
        <p>
          ArabSoft est une société tunisienne spécialisée dans le développement de solutions logicielles sur mesure. Nous nous engageons à fournir des solutions innovantes qui aident nos clients à atteindre leurs objectifs d'affaires.
        </p>
      </div>

      {/* Section Nos services */}
      <div className="our-services-section">
        <h2>Nos Services</h2>
        <div className="service-cards">
          <div className="service-card">
            <h3>Solutions pour Entreprises Non-IT</h3>
            <p>
              Nous offrons des solutions personnalisées pour les entreprises hors secteur technologique, adaptées à leurs besoins spécifiques.
            </p>
            <div className="learn-more-button">
              <span>En savoir plus</span>
            </div>
          </div>
          <div className="service-card">
            <h3>Développement de Logiciels</h3>
            <p>
              ArabSoft fournit des services de développement de logiciels de qualité, en utilisant les dernières technologies et méthodologies.
            </p>
            <div className="learn-more-button">
              <span>En savoir plus</span>
            </div>
          </div>
          <div className="service-card">
            <h3>Consulting en IT</h3>
            <p>
              Nous offrons des services de conseil pour aider les entreprises à optimiser leurs systèmes informatiques et à mettre en œuvre les meilleures pratiques technologiques.
            </p>
            <div className="learn-more-button">
              <span>En savoir plus</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Section Contactez-nous */}
      <div className="contact-us-section">
        <h2>Contactez-nous</h2>
        <form>
          <div className="input-group">
            <i><FaUser /></i>
            <input type="text" placeholder="Nom Complet" />
          </div>
          <div className="input-group">
            <i><FaEnvelope /></i>
            <input type="email" placeholder="Adresse Email" />
          </div>
          <div className="input-group">
            <i><FaComment /></i>
            <textarea placeholder="Votre Message"></textarea>
          </div>
          <button type="submit">Envoyer le Message</button>
        </form>
      </div>

      {/* Section Footer */}
      <footer className="footer">
        <div className="footer-content">
          {/* Section À propos */}
          <div className="footer-section">
            <h4>À propos d'ArabSoft</h4>
            <p>
              ArabSoft est une société innovante en Tunisie, spécialisée dans le développement de solutions logicielles et le conseil en informatique pour diverses industries.
            </p>
          </div>

          {/* Section Liens rapides */}
          <div className="footer-section">
            <h4>Liens rapides</h4>
            <ul className="footer-links">
              <li><a href="#">Accueil</a></li>
              <li><a href="#">À propos</a></li>
              <li><a href="#">Services</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>

          {/* Section Réseaux sociaux */}
          <div className="footer-section">
            <h4>Suivez-nous</h4>
            <div className="social-icons">
              <a href="#" aria-label="Facebook"><FaFacebook /></a>
              <a href="#" aria-label="Twitter"><FaTwitter /></a>
              <a href="#" aria-label="Instagram"><FaInstagram /></a>
              <a href="#" aria-label="LinkedIn"><FaLinkedin /></a>
            </div>
          </div>

          {/* Section Infos de contact */}
          <div className="footer-section">
            <h4>Informations de contact</h4>
            <p>Email: info@arabsoft.com</p>
            <p>Téléphone: +216 123 456 789</p>
            <p>Adresse: Rue Exemple, Tunis, Tunisie</p>
          </div>
        </div>

        {/* Ligne de séparation */}
        <div className="footer-divider"></div>

        {/* Bas du footer */}
        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} ArabSoft. Tous droits réservés. |{' '}
            <a href="#">Politique de confidentialité</a> | <a href="#">Conditions d'utilisation</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
