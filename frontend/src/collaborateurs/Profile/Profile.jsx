import React, { useState, useEffect } from "react";
import "./Profile.css";
import Navbar from '../Components/Navbar/Navbar';

const Profile = () => {
  const [userData, setUserData] = useState({
    nom: '',
    prenom: '',
    email: '',
    matricule: '',
    serviceName: '',
    role: '',
  });

  const [showManageDemandes, setShowManageDemandes] = useState(false);
  const [demandes, setDemandes] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'O', 'N', 'I'
  const [filterType, setFilterType] = useState('all'); // 'all', 'Conge', 'Formation', 'Autorisation'

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/Personnel/byId/${userId}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        setUserData({
          nom: data.nom || '',
          prenom: data.prenom || '',
          email: data.email || '',
          matricule: data.matricule || '',
          serviceName: data.serviceName || 'America',
          role: data.role || 'Seattle',
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  useEffect(() => {
    const fetchAllDemandes = async () => {
      if (showManageDemandes && userData.matricule) {
        try {
          const [congesResponse, formationsResponse, autorisationsResponse] = await Promise.all([
            fetch(`http://localhost:8080/api/demande-conge/personnel/${userId}`),
            fetch(`http://localhost:8080/api/demande-formation/personnel/${userId}`),
            fetch(`http://localhost:8080/api/demande-autorisation/personnel/${userId}`),
          ]);

          if (!congesResponse.ok || !formationsResponse.ok || !autorisationsResponse.ok) {
            throw new Error('Failed to fetch demandes');
          }

          const congesData = await congesResponse.json();
          const formationsData = await formationsResponse.json();
          const autorisationsData = await autorisationsResponse.json();

          const combinedDemandes = [
            ...congesData.map((demande) => ({ ...demande, type: 'Conge' })),
            ...formationsData.map((demande) => ({ ...demande, type: 'Formation' })),
            ...autorisationsData.map((demande) => ({ ...demande, type: 'Autorisation' })),
          ];

          setDemandes(combinedDemandes);
        } catch (error) {
          console.error('Error fetching demandes:', error);
        }
      }
    };

    fetchAllDemandes();
  }, [showManageDemandes, userData.matricule, userId]);

  const getStatusText = (status) => {
    switch (status) {
      case 'O':
        return 'Approved';
      case 'N':
        return 'Rejected';
      case 'I':
        return 'Pending';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleUpdateStatus = (id, type) => {
    // Implement the logic to update the status of the demande
    console.log(`Updating status for demande ${id} of type ${type}`);
  };

  // Filter demandes based on selected status and type
  const filteredDemandes = demandes.filter((demande) => {
    const matchesStatus = filterStatus === 'all' || demande.reponseChef === filterStatus;
    const matchesType = filterType === 'all' || demande.type === filterType;
    return matchesStatus && matchesType;
  });

  return (
    <div className="profile-container">
      <Navbar />

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
          </ul>
        </aside>
      </div>

      <main className="profile-content">
        {showManageDemandes ? (
          <>
            <h2>Manage Demandes</h2>

            {/* Filter Bar */}
            <div className="filter-bar">
              <label>
                Filter by Status:
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">All</option>
                  <option value="O">Approved</option>
                  <option value="N">Rejected</option>
                  <option value="I">Pending</option>
                </select>
              </label>

              <label>
                Filter by Type:
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="all">All</option>
                  <option value="Conge">Conge</option>
                  <option value="Formation">Formation</option>
                  <option value="Autorisation">Autorisation</option>
                </select>
              </label>
            </div>

            {/* Table */}
            <div className="table-container">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Date Demande</th>
                    <th>Details</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDemandes.map((demande) => (
                    <tr key={demande.id}>
                      <td>{demande.type}</td>
                      <td>{formatDate(demande.dateDemande)}</td>
                      <td>{demande.texteDemande}</td>
                      <td>
                        <span className={`status ${demande.reponseChef.toLowerCase()}`}>
                          {getStatusText(demande.reponseChef)}
                        </span>
                      </td>
                      <td>
                        {demande.reponseChef === 'I' ? (
                          <button
                            className="update-button"
                            onClick={() => handleUpdateStatus(demande.id, demande.type)}
                          >
                            Update
                          </button>
                        ) : (
                          <button className="update-button" disabled>
                            Update
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button className="add-user-button">+ Add new Demande</button>
          </>
        ) : (
          <>
            <h2>Profile</h2>

            <div className="personal-info">
              <label>First Name</label>
              <input type="text" value={userData.nom} readOnly />

              <label>Last Name</label>
              <input type="text" value={userData.prenom} readOnly />

              <label>Email Address</label>
              <input type="email" value={userData.email} readOnly />
            </div>

            <div className="other-info">
              <label>Matricule</label>
              <input type="text" value={userData.matricule} readOnly />

              <label>Service</label>
              <input type="text" value={userData.serviceName} readOnly />

              <label>Role</label>
              <input type="text" value={userData.role} readOnly />
            </div>

            <div className="password-section">
              <label>Password</label>
              <button className="change-password">Change Password</button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Profile;