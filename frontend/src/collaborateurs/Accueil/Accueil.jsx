import React from 'react';
import './Accueil.css'; // Fichier CSS pour le style
import logo3D from '../../assets/logo.png'; // Importez votre image 3D du logo
import { useNavigate } from 'react-router-dom';
import Navbar from '../Components/Navbar/Navbar';
import Sidebar from '../Components/Sidebar/Sidebar';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="homepage">
        <Sidebar />
      {/* Section Hero (Bannière principale) */}
      <div className="hero-section">
      <Navbar />
        <div className="hero-content">
          <img src={logo3D} alt="Logo 3D de la société" className="logo-3d" />
          <h1>Bienvenue sur le Portail RH</h1>
          <p>Gérez vos demandes .</p>
          
        </div>
      </div>

    
      
    </div>
  );
};

export default HomePage;