import { useState, useEffect } from "react";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiBriefcase,
  FiUsers,
  FiAlertCircle,
  FiList,
  FiLock,
  FiX
} from "react-icons/fi";
import Navbar from "../Components/Navbar/Navbar";
import Sidebar from "../Components/Sidebar/Sidebar";
import "../common-ui.css";
import "./Profile.css";
import { API_URL } from "../../config";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cin: "",
    position: "",
    sexe: "",
    department: "",
    hireDate: "",
    situation: "",
    status: "",
    date_naiss: "",
    serviceName: "",
    skills: [],
    code_soc: "",
    matricule: "",
    nbr_enfants: 0,
    role: "",
    chefHierarchiqueNom: "",
    chefHierarchiquePrenom: "",
    chefHierarchiqueEmail: ""
  });

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("authToken");
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    if (!dateString) return "Non spécifié";
    try {
      return new Date(dateString).toLocaleDateString("fr-FR");
    } catch (error) {
      return dateString;
    }
  };

  const fetchUserData = async (userId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/Personnel/byId/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();

      setUserData({
        firstName: data.nom || "",
        lastName: data.prenom || "",
        email: data.email || "",
        phone: data.telephone || "",
        cin: data.cin || "",
        position: data.position || "",
        sexe: data.sexe || "",
        department: data.department || "",
        hireDate: data.date_embauche || "",
        situation: data.situation || "",
        status: data.status || "",
        date_naiss: data.date_naiss || "",
        serviceName: data.serviceName || "",
        skills: data.skills || [],
        code_soc: data.code_soc || "",
        matricule: data.matricule || "",
        nbr_enfants: data.nbr_enfants || 0,
        role: data.role || "",
        chefHierarchiqueNom: data.chefHierarchiqueNom || "",
        chefHierarchiquePrenom: data.chefHierarchiquePrenom || "",
        chefHierarchiqueEmail: data.chefHierarchiqueEmail || ""
      });

    } catch (error) {
      console.error("Erreur lors de la récupération des données utilisateur:", error);
      setError("Erreur lors du chargement des données. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && token) {
      fetchUserData(userId);
    } else {
      setError("Session invalide. Veuillez vous reconnecter.");
      setLoading(false);
    }
  }, [userId, token]);

  const handleNavigateToHistorique = () => {
    navigate("/HistoriqueDemandes");
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = "Le mot de passe actuel est requis";
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = "Le nouveau mot de passe est requis";
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = "Le mot de passe doit contenir au moins 8 caractères";
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = "Veuillez confirmer le nouveau mot de passe";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Les mots de passe ne correspondent pas";
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;
    
    try {
      setIsChangingPassword(true);
      setPasswordErrors({});
      
      const response = await fetch(`${API_URL}/api/Personnel/change-password/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors du changement de mot de passe");
      }
      
      setPasswordSuccess(true);
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      }, 2000);
    } catch (error) {
      setPasswordErrors({ submit: error.message });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement en cours...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <FiAlertCircle size={48} className="error-icon" />
        <p className="error-message">{error}</p>
        {!token && (
          <button className="login-button" onClick={() => (window.location.href = "/login")}>
            Se connecter
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="content-container">
        <Navbar />
        <div className="page-content">
          <div className="page-header">
            <h1>Profil Utilisateur</h1>
            <p className="page-subtitle">Consultez et gérez vos informations personnelles</p>
          </div>

          <div className="profile-tabs">
            <button
              className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <FiUser className="tab-icon" />
              Informations Personnelles
            </button>
          </div>

          {activeTab === "profile" && (
            <div className="profile-content">
              <div className="content-card">
                <div className="profile-header">
                  <div className="profile-avatar">
                    {userData.firstName?.charAt(0) || ""}
                    {userData.lastName?.charAt(0) || ""}
                  </div>
                  <div className="profile-title">
                    <h2>
                      {userData.firstName} {userData.lastName}
                    </h2>
                    <p>
                      {userData.role || "Employé"} - {userData.serviceName || "Non spécifié"}
                    </p>
                  </div>
                  <button 
                    className="change-password-button"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    <FiLock className="button-icon" />
                    Changer votre mot de passe
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
                          {userData.firstName} {userData.lastName}
                        </span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <FiMail className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Email</span>
                        <span className="detail-value">{userData.email || "Non spécifié"}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <FiPhone className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Téléphone</span>
                        <span className="detail-value">{userData.phone || "Non spécifié"}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <FiCalendar className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Date de Naissance</span>
                        <span className="detail-value">{formatDate(userData.date_naiss)}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <FiMapPin className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Situation</span>
                        <span className="detail-value">{userData.situation || "Non spécifié"}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <FiUsers className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Nombre d'Enfants</span>
                        <span className="detail-value">{userData.nbr_enfants}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-group">
                    <h3>Informations Professionnelles</h3>
                    <div className="detail-item">
                      <FiBriefcase className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Matricule</span>
                        <span className="detail-value">{userData.matricule || "Non spécifié"}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <FiBriefcase className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Service</span>
                        <span className="detail-value">{userData.serviceName || "Non spécifié"}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <FiBriefcase className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Rôle</span>
                        <span className="detail-value">{userData.role || "Non spécifié"}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <FiBriefcase className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Chef Hiérarchique</span>
                        {userData.chefHierarchiqueNom ? (
                          <div className="chef-info">
                            <div className="chef-name">
                              {userData.chefHierarchiqueNom} {userData.chefHierarchiquePrenom}
                            </div>
                            {userData.chefHierarchiqueEmail && (
                              <div className="chef-email">
                                <FiMail className="email-icon" />
                                <a href={`mailto:${userData.chefHierarchiqueEmail}`}>{userData.chefHierarchiqueEmail}</a>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="detail-value">Non spécifié</span>
                        )}
                      </div>
                    </div>
                    <div className="detail-item">
                      <FiCalendar className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Date d'Embauche</span>
                        <span className="detail-value">{formatDate(userData.hireDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Changer votre mot de passe</h3>
              <button 
                className="modal-close-button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordErrors({});
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                  });
                }}
              >
                <FiX />
              </button>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="password-form">
              {passwordSuccess ? (
                <div className="success-message">
                  <p>Votre mot de passe a été changé avec succès!</p>
                </div>
              ) : (
                <>
                  {passwordErrors.submit && (
                    <div className="error-message">
                      <p>{passwordErrors.submit}</p>
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label htmlFor="currentPassword">Mot de passe actuel</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className={passwordErrors.currentPassword ? "error" : ""}
                    />
                    {passwordErrors.currentPassword && (
                      <span className="error-text">{passwordErrors.currentPassword}</span>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="newPassword">Nouveau mot de passe</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className={passwordErrors.newPassword ? "error" : ""}
                    />
                    {passwordErrors.newPassword && (
                      <span className="error-text">{passwordErrors.newPassword}</span>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className={passwordErrors.confirmPassword ? "error" : ""}
                    />
                    {passwordErrors.confirmPassword && (
                      <span className="error-text">{passwordErrors.confirmPassword}</span>
                    )}
                  </div>
                  
                  <div className="form-actions">
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => {
                        setShowPasswordModal(false);
                        setPasswordErrors({});
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: ""
                        });
                      }}
                      disabled={isChangingPassword}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="submit-button"
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? "En cours..." : "Changer le mot de passe"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;