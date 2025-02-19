import React from 'react';
import './Navbar.css';
import { useNavigate } from 'react-router-dom'; // Pour la navigation

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear relevant data from localStorage
    localStorage.removeItem('authToken'); // Replace 'authToken' with your actual key
    localStorage.removeItem('userId'); // If you store user data in localStorage

    // Redirect to the main page
    window.location.href = '/';
  };
  const handleLogoClick = () => {
    navigate('/AccueilCollaborateurs'); // Rediriger vers la page d'accueil des collaborateurs
  };

  return (
    <nav className="navbar">
      <div onClick={handleLogoClick} className="navbar-logo">Portail RH</div>
      <div className="navbar-links">
        <a href="/profile">Profil</a>
        <a href="/" className="Déconnexion" onClick={handleLogout}>Déconnexion</a>
      </div>
    </nav>
  );
};

export default Navbar;
