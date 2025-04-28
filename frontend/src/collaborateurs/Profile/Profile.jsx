
import { useState, useEffect } from "react"
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiBriefcase, FiEdit } from "react-icons/fi"
import Navbar from '../Components/Navbar/Navbar';
import Sidebar from '../Components/Sidebar/Sidebar';
import Demandes from "./Demandes"
import "./Profile.css"

const Profile = () => {
  const [userData, setUserData] = useState({
    nom: "",
    prenom: "",
    email: "",
    matricule: "",
    serviceName: "",
    role: "",
    dateNaissance: "",
    telephone: "",
    adresse: "",
    dateEmbauche: "",
  })

  const [activeTab, setActiveTab] = useState("profile")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Retrieve the userId from localStorage
  const userId = localStorage.getItem("userId")

  useEffect(() => {
    if (userId) {
      fetchUserData(userId)
    }
  }, [userId])

  const fetchUserData = async (userId) => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:8080/api/Personnel/byId/${userId}`)

      if (!response.ok) {
        throw new Error("Network response was not ok")
      }

      const data = await response.json()

      // Update the state with the fetched user data
      setUserData({
        nom: data.nom || "",
        prenom: data.prenom || "",
        email: data.email || "",
        matricule: data.matricule || "",
        serviceName: data.serviceName || "Non spécifié",
        role: data.role || "Non spécifié",
        dateNaissance: data.dateNaissance || "Non spécifiée",
        telephone: data.telephone || "Non spécifié",
        adresse: data.adresse || "Non spécifiée",
        dateEmbauche: data.dateEmbauche || "Non spécifiée",
      })
    } catch (error) {
      console.error("Error fetching user data:", error)
      setError("Erreur lors du chargement des données utilisateur")
    } finally {
      setLoading(false)
    }
  }

  if (loading && !userData.nom) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="main-content">
        <Sidebar />
        <div className="content-area">
          <div className="page-header">
            <h1>Profil Utilisateur</h1>
            <p className="subtitle">Consultez et gérez vos informations personnelles</p>
          </div>

          <div className="profile-tabs">
            <button
              className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              Informations Personnelles
            </button>
            <button
              className={`tab-button ${activeTab === "demandes" ? "active" : ""}`}
              onClick={() => setActiveTab("demandes")}
            >
              Mes Demandes
            </button>
          </div>

          {activeTab === "profile" && (
            <div className="profile-content">
              <div className="profile-card">
                <div className="profile-header">
                  <div className="profile-avatar">
                    {userData.nom.charAt(0)}
                    {userData.prenom.charAt(0)}
                  </div>
                  <div className="profile-title">
                    <h2>
                      {userData.nom} {userData.prenom}
                    </h2>
                    <p>
                      {userData.role} - {userData.serviceName}
                    </p>
                  </div>
                  <button className="edit-profile-button">
                    <FiEdit />
                    <span>Modifier</span>
                  </button>
                </div>

                <div className="profile-details">
                  <div className="detail-group">
                    <h3>Informations Personnelles</h3>
                    <div className="detail-item">
                      <FiUser className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Nom Complet</span>
                        <span className="detail-value">
                          {userData.nom} {userData.prenom}
                        </span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <FiMail className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Email</span>
                        <span className="detail-value">{userData.email}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <FiPhone className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Téléphone</span>
                        <span className="detail-value">{userData.telephone}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <FiCalendar className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Date de Naissance</span>
                        <span className="detail-value">{userData.dateNaissance}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <FiMapPin className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Adresse</span>
                        <span className="detail-value">{userData.adresse}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-group">
                    <h3>Informations Professionnelles</h3>
                    <div className="detail-item">
                      <FiBriefcase className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Matricule</span>
                        <span className="detail-value">{userData.matricule}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <FiBriefcase className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Service</span>
                        <span className="detail-value">{userData.serviceName}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <FiBriefcase className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Rôle</span>
                        <span className="detail-value">{userData.role}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <FiCalendar className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Date d'Embauche</span>
                        <span className="detail-value">{userData.dateEmbauche}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "demandes" && <Demandes userId={userId} />}
        </div>
      </div>
    </div>
  )
}

export default Profile

