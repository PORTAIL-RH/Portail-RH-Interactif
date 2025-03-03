import React from 'react';
import './Navbar.css';
import { useNavigate } from 'react-router-dom'; 

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken'); 
    localStorage.removeItem('userId'); 

    window.location.href = '/';
  };
  const handleLogoClick = () => {
    navigate('/AccueilCollaborateurs'); 
  };

  return (
    <nav className="navbar">
      <div onClick={handleLogoClick} className="navbar-logo">Portail RH</div>
      <div className="navbar-links">
      <a href="/AccueilCollaborateurs">Acceuil</a>

        <a href="/Profile">Profil</a>

        <a href="/" className="Déconnexion" onClick={handleLogout}>Déconnexion</a>
      </div>
    </nav>
  );
};

export default Navbar;
