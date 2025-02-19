import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {isOpen ? '×' : '☰'}
      </button>
      <ul>
        <h3>Demandes :</h3>
        <li><a href="/DemandeFormation">Formation</a></li>
        <li><a href="/DemandeConge">Congé</a></li>
        <li><a href="/DemandeAutorisation">Autorisation</a></li>
        <li><a href="/DemandePreAvance">Avance</a></li>
        <li><a href="/DemandeDocument">Document</a></li>
      </ul>
    </div>
  );
};

export default Sidebar;
