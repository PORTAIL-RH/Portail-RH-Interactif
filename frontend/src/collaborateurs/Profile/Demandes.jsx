import React, { useState, useEffect } from "react";
import "./Profile.css";
import Navbar from '../Components/Navbar/Navbar';

const Demandes = [
  { id: 1, name: "Ester Howard", email: "esterH@gmail.com", role: "Admin", avatar: "https://i.pravatar.cc/40?img=1" },
  { id: 2, name: "Daniel Dmitry", email: "daniel@gmail.com", role: "Owner", avatar: "https://i.pravatar.cc/40?img=2" },
  { id: 3, name: "Joseph Thompson", email: "joseph@gmail.com", role: "Admin", avatar: "https://i.pravatar.cc/40?img=3" },
  { id: 4, name: "Tom Holland", email: "tomholl@gmail.com", role: "Member", avatar: "https://i.pravatar.cc/40?img=4" },
  { id: 5, name: "Robert Rene", email: "robert@gmail.com", role: "Member", avatar: "https://i.pravatar.cc/40?img=5" },
];

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

  // Retrieve the userId from localStorage
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/Personnel/byId/${userId}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        // Update the state with the fetched user data
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

  return (
    <div className="profile-container">
      <Navbar />


    </div>
  );
};

export default Profile;

