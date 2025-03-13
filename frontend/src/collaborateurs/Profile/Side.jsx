import React from 'react';
import './Profile.css';

const Sidebar = ({ showManageDemandes, setShowManageDemandes }) => {
  return (
    <div className="sidebar-container">
      <aside className="sidebar">
        <h2>My Settings</h2>
        <ul>
          <li className={!showManageDemandes ? "active" : ""} onClick={() => setShowManageDemandes(false)}>
            Profile
          </li>
          <li className={showManageDemandes ? "active" : ""} onClick={() => setShowManageDemandes(true)}>
            Manage Demandes
          </li>
          <li>Manage Payment Account</li>
          <li>Sign Out</li>
        </ul>
      </aside>
    </div>
  );
};

export default Sidebar;

