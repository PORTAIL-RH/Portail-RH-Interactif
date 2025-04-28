import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { User, Mail, Phone, Briefcase, Calendar, MapPin, Lock, X } from 'lucide-react';
import "./Profile.css";
import { API_URL } from "../../../config"; 
import "../../Colors.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("light");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    setTheme(savedTheme)
    applyTheme(savedTheme)

    // Listen for theme changes
    const handleStorageChange = () => {
      const currentTheme = localStorage.getItem("theme") || "light"
      setTheme(currentTheme)
      applyTheme(currentTheme)
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("themeChanged", (e) => {
      setTheme(e.detail || "light")
      applyTheme(e.detail || "light")
    })

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("themeChanged", handleStorageChange)
    }
  }, [])

  const applyTheme = (theme) => {
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(theme)
    document.body.className = theme
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    applyTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }))
  }

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Get user ID directly from localStorage
        const userId = localStorage.getItem("userId");
        
        if (!userId) {
          throw new Error("User not authenticated");
        }

        const response = await fetch(`${API_URL}/api/Personnel/byId/${userId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch user data. Status: ${response.status}`);
        }

        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Get initials for avatar
  const getInitials = (user) => {
    if (!user) return "";
    const firstName = user.prenom ? user.prenom.charAt(0).toUpperCase() : "";
    const lastName = user.nom ? user.nom.charAt(0).toUpperCase() : "";
    return firstName + lastName;
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
      
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("authToken");
      
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
      <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
        <div className="profile-container">
        <Navbar theme={theme} toggleTheme={toggleTheme} />
          <div className="profile-content">
            <div className="loading-message">Loading profile data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
        <div className="demandes-chef-container">
        <Navbar theme={theme} toggleTheme={toggleTheme} />
          <div className="demandes-chef-content">
            <div className="error-message">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
        <div className="profile-container">
        <Navbar theme={theme} toggleTheme={toggleTheme} />
          <div className="profile-content">
            <div className="error-message">No user data available</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className="profile-container">
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <div className="profile-content">
          <header className="page-header">
            <h1>Mon Profil</h1>
            <button 
              className="change-password-button"
              onClick={() => setShowPasswordModal(true)}
            >
              <Lock size={16} className="button-icon" />
              Changer le mot de passe
            </button>
          </header>

          <div className="profile-layout">
            {/* Profile Sidebar */}
            <div className="profile-sidebar">
              <div className="profile-card">
                <div className="profile-header">
                  <div className="profile-avatar">
                    {getInitials(user)}
                  </div>
                  <h2 className="profile-name">{user.nom} {user.prenom}</h2>
                  <p className="profile-role">{user.role}</p>
                </div>
                <div className="profile-details">
                  <div className="profile-info-item">
                    <div className="profile-info-icon">
                      <Mail size={18} />
                    </div>
                    <div className="profile-info-content">
                      <p className="profile-info-label">Email</p>
                      <p className="profile-info-value">{user.email || "Non renseigné"}</p>
                    </div>
                  </div>
                  <div className="profile-info-item">
                    <div className="profile-info-icon">
                      <Phone size={18} />
                    </div>
                    <div className="profile-info-content">
                      <p className="profile-info-label">Téléphone</p>
                      <p className="profile-info-value">{user.telephone || "Non renseigné"}</p>
                    </div>
                  </div>
                  <div className="profile-info-item">
                    <div className="profile-info-icon">
                      <Briefcase size={18} />
                    </div>
                    <div className="profile-info-content">
                      <p className="profile-info-label">Service</p>
                      <p className="profile-info-value">{user.serviceName || "Non renseigné"}</p>
                    </div>
                  </div>
                  <div className="profile-info-item">
                    <div className="profile-info-icon">
                      <Calendar size={18} />
                    </div>
                    <div className="profile-info-content">
                      <p className="profile-info-label">Date d'embauche</p>
                      <p className="profile-info-value">{user.date_embauche || "Non renseigné"}</p>
                    </div>
                  </div>
                  {user.adresse && (
                    <div className="profile-info-item">
                      <div className="profile-info-icon">
                        <MapPin size={18} />
                      </div>
                      <div className="profile-info-content">
                        <p className="profile-info-label">Adresse</p>
                        <p className="profile-info-value">{user.adresse}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Main Content */}
            <div className="profile-main">
              {/* Personal Information Section */}
              <div className="profile-section">
                <div className="section-header">
                  <h2>Informations Personnelles</h2>
                </div>
                <div className="section-content">
                  <div className="info-display">
                    <div className="info-grid">
                      <div className="info-item">
                        <h3 className="info-label">Matricule</h3>
                        <p className="info-value">{user.matricule || "Non renseigné"}</p>
                      </div>
                      <div className="info-item">
                        <h3 className="info-label">CIN</h3>
                        <p className="info-value">{user.cin || "Non renseigné"}</p>
                      </div>
                      <div className="info-item">
                        <h3 className="info-label">Date de naissance</h3>
                        <p className="info-value">{user.date_naiss || "Non renseigné"}</p>
                      </div>
                      <div className="info-item">
                        <h3 className="info-label">Situation familiale</h3>
                        <p className="info-value">{user.situation || "Non renseigné"}</p>
                      </div>
                      <div className="info-item">
                        <h3 className="info-label">Nombre d'enfants</h3>
                        <p className="info-value">{user.nbr_enfants || "0"}</p>
                      </div>
                      <div className="info-item">
                        <h3 className="info-label">Sexe</h3>
                        <p className="info-value">{user.sexe || "Non renseigné"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Information Section */}
              <div className="profile-section">
                <div className="section-header">
                  <h2>Informations Professionnelles</h2>
                </div>
                <div className="section-content">
                  <div className="info-grid">
                    <div className="info-item">
                      <h3 className="info-label">Service</h3>
                      <p className="info-value">{user.serviceName || "Non renseigné"}</p>
                    </div>
                    <div className="info-item">
                      <h3 className="info-label">Rôle</h3>
                      <p className="info-value">{user.role || "Non renseigné"}</p>
                    </div>
                    <div className="info-item">
                      <h3 className="info-label">Date d'embauche</h3>
                      <p className="info-value">{user.date_embauche || "Non renseigné"}</p>
                    </div>
                    <div className="info-item">
                      <h3 className="info-label">Code société</h3>
                      <p className="info-value">{user.code_soc || "Non renseigné"}</p>
                    </div>
                    <div className="info-item">
                      <h3 className="info-label">Statut</h3>
                      <p className={`info-value status-badge ${user.active ? "active" : "inactive"}`}>
                        {user.active ? "Actif" : "Inactif"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className={`modal-container ${theme}`}>
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
                <X size={20} />
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