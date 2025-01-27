import React from 'react';
import './Navbar.css';

const Navbar = () => {
  const handleLogout = () => {
    // Clear relevant data from localStorage
    localStorage.removeItem('authToken'); // Replace 'authToken' with your actual key
    localStorage.removeItem('userId'); // If you store user data in localStorage

    // Redirect to the main page
    window.location.href = '/';
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">Portail RH</div>
      <div className="navbar-links">
        <a href="/profile">Profil</a>
        <a href="/" onClick={handleLogout}>Déconnexion</a>
      </div>
    </nav>
  );
};

export default Navbar;
