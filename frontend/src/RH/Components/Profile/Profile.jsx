import { useState, useEffect } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiFileText, FiEdit, FiSun, FiMoon, FiList } from "react-icons/fi";
import { FaBriefcase, FaIdCard } from "react-icons/fa";
import "./Profile.css";

const ProfilePage = () => {
  const [theme, setTheme] = useState("light");
  const [userData, setUserData] = useState({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cin: "",
    sexe: "",
    department: "",
    hireDate: "",
    situation: "",
    status: "",
    date_naiss: "",
    serviceName: "",
    skills: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Retrieve userId from localStorage
  const userId = localStorage.getItem("userId");

  // Retrieve userService from localStorage and parse it
  const userService = JSON.parse(localStorage.getItem("userService"));
  const serviceName = userService?.serviceName || ""; // Extract serviceName from userService

  // Effet pour initialiser le thème
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Fetch personnel data from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/Personnel/byId/${userId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setUserData({
          id: data.id,
          firstName: data.nom || "",
          lastName: data.prenom || "",
          email: data.email || "",
          phone: data.telephone || "",
          cin: data.cin || "",
          sexe: data.sexe || "",
          department: data.department || "",
          hireDate: data.date_embauche || "",
          situation: data.situation || "",
          status: data.status || "",
          date_naiss: data.date_naiss || "",
          serviceName: serviceName, // Use the serviceName from localStorage
          skills: data.skills || [],
        });
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    } else {
      setError("User ID not found in localStorage.");
      setLoading(false);
    }
  }, [userId, serviceName]);

  // Fonction pour basculer entre les thèmes
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
  };

  // Fonction pour accéder aux demandes
  const handleAccessDemandes = () => {
    // Rediriger vers la page des demandes
    window.location.href = "/DemandesCHEF"; // Mettez à jour l'URL selon votre route
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar />
      <div className="dashboard-container">
        <Navbar />
        <div className="dashboard-content">
          <div className="dashboard-header">
            <div className="header-top">
              <h1>Profil de l'Employé</h1>
              <div className="header-actions">
                <button 
                  className="access-demandes-button" 
                  onClick={handleAccessDemandes}
                >
                  <FiList />
                  <span>Espace Des Demandes</span>
                </button>
                <button 
                  className="theme-toggle-button" 
                  onClick={toggleTheme}
                  aria-label={theme === "light" ? "Passer au mode sombre" : "Passer au mode clair"}
                >
                  {theme === "light" ? <FiMoon /> : <FiSun />}
                </button>
              </div>
            </div>
            <p>Consultez les informations de profil de l'employé.</p>
          </div>

          <div className="profile-grid">
            {/* Carte d'informations personnelles */}
            <div className="dashboard-card profile-card">
              <div className="card-header">
                <h2>Informations Personnelles</h2>
              </div>
              <div className="card-content">
                <div className="profile-header">
                  <div className="profile-avatar">
                    {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
                  </div>
                  <div className="profile-name">
                    <h3>{userData.firstName} {userData.lastName}</h3>
                    <p className="profile-position">{userData.position}</p>
                    <p className="profile-department">{userData.department}</p>
                  </div>
                </div>

                <div className="profile-details">
                  <div className="detail-item">
                    <FiMail className="detail-icon" />
                    <div className="detail-content">
                      <h4>Email</h4>
                      <p>{userData.email}</p>
                    </div>
                  </div>
                  <div className="detail-item">
                    <FiPhone className="detail-icon" />
                    <div className="detail-content">
                      <h4>Téléphone</h4>
                      <p>{userData.phone}</p>
                    </div>
                  </div>
                  <div className="detail-item">
                    <FiMapPin className="detail-icon" />
                    <div className="detail-content">
                      <h4>Date de naissance</h4>
                      <p>{userData.date_naiss}</p>
                    </div>
                  </div>
                  <div className="detail-item">
                    <FiMapPin className="detail-icon" />
                    <div className="detail-content">
                      <h4>Sexe</h4>
                      <p>{userData.sexe}</p>
                    </div>
                  </div>
                  <div className="detail-item">
                    <FiMapPin className="detail-icon" />
                    <div className="detail-content">
                      <h4>CIN</h4>
                      <p>{userData.cin}</p>
                    </div>
                  </div>
                  <div className="detail-item">
                    <FiMapPin className="detail-icon" />
                    <div className="detail-content">
                      <h4>Situation</h4>
                      <p>{userData.situation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Carte d'informations professionnelles */}
            <div className="dashboard-card profile-card">
              <div className="card-header">
                <h2>Informations Professionnelles</h2>
              </div>
              <div className="card-content">
                <div className="profile-details">
                  <div className="detail-item">
                    <FaBriefcase className="detail-icon" />
                    <div className="detail-content">
                      <h4>Service</h4>
                      <p>{userData.serviceName}</p>
                    </div>
                  </div>
                  <div className="detail-item">
                    <FiCalendar className="detail-icon" />
                    <div className="detail-content">
                      <h4>Date d'embauche</h4>
                      <p>{userData.hireDate}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;