"use client"

import { useState, useEffect } from "react"
import "./Auth2.css"
import { useNavigate } from "react-router-dom"
import { API_URL } from "../../config"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { FiUser, FiMail, FiLock, FiHash, FiLogIn, FiUserPlus, FiSun, FiMoon } from "react-icons/fi"
import { useAuth } from "../../contexts/AuthContext"
import ResetPasswordButton from "./ResetPasswordComponent"

// MouseMoveBackground component included directly in the file
const MouseMoveBackground = ({ theme }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePosition({ x: event.clientX, y: event.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  const isDark = theme === "dark"

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* Rich gradient background - different for light/dark */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isDark
            ? "linear-gradient(125deg, #111827 0%,rgb(7, 12, 27) 50%,rgb(4, 12, 53) 100%)"
            : "linear-gradient(125deg, #f0f4f8 0%, #e2eaf2 50%, #f0f4f8 100%)",
        }}
      />

      {/* Top right blob - different colors for light/dark */}
      <div
        style={{
          position: "absolute",
          right: "-100px",
          top: "-100px",
          height: "600px",
          width: "600px",
          backgroundColor: isDark ? "rgba(56, 189, 248, 0.25)" : "rgba(56, 189, 248, 0.15)",
          filter: "blur(120px)",
          borderRadius: "100%",
          transform: "rotate(-15deg)",
        }}
      />

      {/* Center blob - different colors for light/dark */}
      <div
        style={{
          position: "absolute",
          right: "35%",
          top: "40%",
          height: "400px",
          width: "400px",
          backgroundColor: isDark ? "rgba(244, 114, 182, 0.15)" : "rgba(244, 114, 182, 0.1)",
          filter: "blur(130px)",
          borderRadius: "100%",
        }}
      />

      {/* Bottom left blob - different colors for light/dark */}
      <div
        style={{
          position: "absolute",
          bottom: "-100px",
          left: "-100px",
          height: "600px",
          width: "600px",
          backgroundColor: isDark ? "rgba(139, 92, 246, 0.25)" : "rgba(139, 92, 246, 0.15)",
          filter: "blur(120px)",
          borderRadius: "100%",
          transform: "rotate(15deg)",
        }}
      />

      {/* Mouse move effect - different colors for light/dark */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isDark
            ? `radial-gradient(800px at ${mousePosition.x}px ${mousePosition.y}px, rgba(56, 189, 248, 0.2), transparent 70%)`
            : `radial-gradient(800px at ${mousePosition.x}px ${mousePosition.y}px, rgba(56, 189, 248, 0.15), transparent 70%)`,
          transition: "opacity 300ms",
        }}
      />
    </div>
  )
}

// Custom styles object for inline styling with theme support
const getStyles = (theme) => {
  const isDark = theme === "dark"

  return {
    authContainer: {
      position: "relative",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      zIndex: 1,
      color: isDark ? "white" : "#1a1f38",
    },
    authCard: {
      position: "relative",
      zIndex: 2,
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.7)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: isDark ? "1px solid rgba(255, 255, 255, 0.18)" : "1px solid rgba(255, 255, 255, 0.5)",
      borderRadius: "16px",
      boxShadow: isDark ? "0 8px 32px rgba(0, 0, 0, 0.2)" : "0 8px 32px rgba(0, 0, 0, 0.1)",
      width: "100%",
      maxWidth: "480px",
      overflow: "hidden",
      padding: "2rem",
      transition: "all 0.3s ease",
    },

    authBranding: {
      display: "flex",
      alignItems: "center",
      marginBottom: "2rem",
      gap: "0.75rem",
      zIndex: 2,
      position: "relative",
    },
    authLogo: {
      fontSize: "2.5rem",
      color: isDark ? "white" : "#1a1f38",
      filter: isDark ? "drop-shadow(0 0 8px rgba(56, 189, 248, 0.5))" : "drop-shadow(0 0 8px rgba(56, 189, 248, 0.3))",
    },
    authCompanyName: {
      fontSize: "1.5rem",
      fontWeight: 700,
      color: isDark ? "white" : "#1e3a8a",
    },
    authTitle: {
      fontSize: "1.75rem",
      fontWeight: 700,
      marginBottom: "0.5rem",
      color: isDark ? "white" : "#1e3a8a",
    },
    authSubtitle: {
      color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(30, 58, 138, 0.7)",
      marginBottom: "1.5rem",
    },
    themeToggle: {
      position: "absolute",
      top: "20px",
      right: "20px",
      zIndex: 10,
      background: "transparent",
      border: "none",
      color: isDark ? "white" : "#1a1f38",
      fontSize: "1.5rem",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0.5rem",
      borderRadius: "50%",
      transition: "all 0.3s ease",
    },
    authHeaderWrapper: {
      marginBottom: "2rem",
    },

    authSwitchButton: {
      background: "transparent",
      border: "none",
      color: isDark ? "rgb(242, 241, 245)" : "rgb(30, 58, 138)",
      fontWeight: 500,
      cursor: "pointer",
      padding: "0.5rem 0",
      transition: "all 0.3s ease",
    },
    authInputGroup: {
      marginBottom: "1.5rem",
      color: "rgb(251, 249, 249)",
    },
    authInputLabel: {
      display: "block",
      marginBottom: "0.5rem",
      fontWeight: 500,
      color: isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(26, 31, 56, 0.9)",
    },
    authInputWrapper: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(255, 255, 255, 0.5)",
      border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid rgba(26, 31, 56, 0.15)",
      borderRadius: "8px",
      transition: "all 0.3s ease",
    },
    authIcon: {
      marginLeft: "1rem",
      color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(26, 31, 56, 0.6)",
    },
    authInput: {
      flex: 1,
      background: "transparent",
      border: "none",
      color: isDark ? "white" : "#1a1f38",
      padding: "0.75rem 1rem",
      fontSize: "1rem",
      outline: "none",
    },
    authSubmitWrapper: {
      marginTop: "1.5rem",
    },
    authSubmitButton: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem",
      background: isDark
        ? "linear-gradient(90deg, #0f172a 0%, rgba(15, 23, 42, 0.9) 50%, #0f172a 100%)"
        : "linear-gradient(90deg, #1e4454 0%, rgba(32, 9, 85, 0.9) 100%)",
      color: "white",
      border: "none",
      borderRadius: "8px",
      padding: "0.75rem 1.5rem",
      fontSize: "1rem",
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.3s ease",
      "&:hover": {
        transform: "translateY(-1px)",
        boxShadow: isDark ? "0 4px 12px rgba(15, 23, 42, 0.4)" : "0 4px 12px rgba(32, 9, 85, 0.3)",
      },
      "&:active": {
        transform: "translateY(0)",
      },
    },
    authSpinner: {
      display: "inline-block",
      width: "1.5rem",
      height: "1.5rem",
      border: isDark ? "2px solid rgba(255, 255, 255, 0.3)" : "2px solid rgba(255, 255, 255, 0.5)",
      borderRadius: "50%",
      borderTopColor: "white",
      animation: "spin 1s ease-in-out infinite",
    },
    authFooter: {
      marginTop: "1.5rem",
      textAlign: "center",
      color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(26, 31, 56, 0.5)",
      fontSize: "0.875rem",
    },
    themeAwareLogo: {
      height: 60,
      width: "auto",
      opacity: isDark ? 1 : 0.9,
      filter: isDark ? "brightness(0) invert(1)" : "none",
    },
  }
}

// Add keyframes for spinner animation to document
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style")
  styleSheet.type = "text/css"
  styleSheet.innerText = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .Toastify__toast--dark {
      background-color: rgba(30, 41, 59, 0.8) !important;
      backdrop-filter: blur(10px) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
    }
    
    /* Custom toast styling for light theme */
    .Toastify__toast--light {
      background-color: rgba(255, 255, 255, 0.8) !important;
      backdrop-filter: blur(10px) !important;
      border: 1px solid rgba(0, 0, 0, 0.1) !important;
    }
  `
  document.head.appendChild(styleSheet)
}

const Authentication = () => {
  const [action, setAction] = useState("Login")
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    matricule: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState("light")
  const { login } = useAuth()
  const navigate = useNavigate()

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark")
      document.documentElement.classList.add("dark")
    }
  }, [])

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
    localStorage.setItem("theme", newTheme)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSignUp = async () => {
    setLoading(true);
  
    // Validate all required fields
    if (
      !formData.nom ||
      !formData.prenom ||
      !formData.matricule ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      toast.error("Tous les champs sont obligatoires");
      setLoading(false);
      return;
    }
  
    // Validate matricule format (5 digits)
    if (!formData.matricule.match(/^\d{5}$/)) {
      toast.error("Le matricule doit être composé de 5 chiffres");
      setLoading(false);
      return;
    }
  
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Veuillez entrer une adresse email valide");
      setLoading(false);
      return;
    }
  
    // Validate password strength
    if (formData.password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      setLoading(false);
      return;
    }
  
    if (formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }
  
    try {
      const toastId = toast.loading("Enregistrement en cours...");
  
      const response = await fetch(`${API_URL}/api/Personnel/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matricule: formData.matricule.trim(),
          email: formData.email.trim(),
          nom: formData.nom.trim(),
          prenom: formData.prenom.trim(),
          password: formData.password.trim(),
          confirmPassword: formData.confirmPassword.trim(),
        }),
        credentials: 'include' // Important for session cookies
      });
  
      const responseData = await response.json();
  
      if (!response.ok) {
        // Handle account locked case
        if (response.status === 403 && responseData.error === "Account locked") {
          const remainingTime = responseData.remainingTime || 0;
          const minutes = Math.ceil(remainingTime / 60000);
          
          toast.update(toastId, {
            render: `Compte verrouillé. Veuillez réessayer dans ${minutes} minute(s) ou contacter l'administrateur.`,
            type: "error",
            isLoading: false,
            autoClose: 10000,
          });
        } 
        // Handle too many attempts (session-based)
        else if (response.status === 429) {
          toast.update(toastId, {
            render: "Trop de tentatives. Veuillez réessayer plus tard.",
            type: "error",
            isLoading: false,
            autoClose: 5000,
          });
        }
        // Handle existing user case
        else if (response.status === 400 && responseData.error === "Email cannot be changed for existing user") {
          toast.update(toastId, {
            render: "L'email ne peut pas être modifié pour un utilisateur existant",
            type: "error",
            isLoading: false,
            autoClose: 5000,
          });
        }
        // Handle email already in use
        else if (response.status === 400 && responseData.error === "Email already in use") {
          toast.update(toastId, {
            render: "Cet email est déjà utilisé par un autre compte",
            type: "error",
            isLoading: false,
            autoClose: 5000,
          });
        }
        // Handle other errors
        else {
          toast.update(toastId, {
            render: responseData.message || "Erreur lors de l'enregistrement",
            type: "error",
            isLoading: false,
            autoClose: 5000,
          });
        }
        setLoading(false);
        return;
      }
  
      // Success case - check if it's an update or new registration
      const isUpdate = responseData.action === "update";
      
      toast.update(toastId, {
        render: responseData.message || 
          (isUpdate 
            ? "Informations du compte mises à jour avec succès" 
            : "Enregistrement réussi! Votre compte est en attente d'activation."),
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });
  
      // Reset form if it was a new registration
      if (!isUpdate) {
        setFormData({
          nom: "",
          prenom: "",
          matricule: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
  
        // Switch to login view after successful registration
        setTimeout(() => {
          setAction("Login");
        }, 3000);
      }
  
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Une erreur est survenue lors de la connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

const handleLogin = async () => {
  setLoading(true);

  if (!formData.matricule || !formData.password) {
    toast.error("Matricule and password are required");
    setLoading(false);
    return;
  }

  try {
    const toastId = toast.loading("Authenticating...", {
      autoClose: false,
      closeButton: false
    });

    // 1. First authenticate to get token
    const authResponse = await fetch(`${API_URL}/api/Personnel/login`, {
      method: "POST",
      credentials: 'include', // Important for session cookies
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        matricule: formData.matricule.trim(),
        password: formData.password.trim(),
      }),
    });

    const authData = await authResponse.json();

    if (!authResponse.ok) {
      // Handle account locked case
      if (authResponse.status === 401 && authData.error === "Account locked") {
        toast.update(toastId, {
          render: authData.message || "Account locked. Please try again later or contact support.",
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
      } 
      // Handle invalid credentials with attempts left
      else if (authData.attemptsLeft !== undefined) {
        toast.update(toastId, {
          render: `Invalid credentials. ${authData.attemptsLeft} attempt${authData.attemptsLeft !== 1 ? 's' : ''} remaining.`,
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
      }
      // Handle other errors
      else {
        toast.update(toastId, {
          render: authData.message || "Login failed. Please try again.",
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
      }
      setLoading(false);
      return;
    }

    // 2. Successful authentication - get user details
    const { token, user } = authData;

    // Use the correct endpoint to fetch user details
    const userDetailsResponse = await fetch(`${API_URL}/api/Personnel/matricule/${user.matricule}`, {
      method: "GET",
      credentials: 'include', // Important for session cookies
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!userDetailsResponse.ok) {
      throw new Error(await userDetailsResponse.text());
    }

    const userDetails = await userDetailsResponse.json();

    // Verify account is active
    if (!userDetails.active) {
      toast.update(toastId, {
        render: "Account not activated. Please contact administrator.",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
      setLoading(false);
      return;
    }

    // 3. Complete login process
    login(token, userDetails);

    toast.update(toastId, {
      render: `Welcome, ${userDetails.prenom}!`,
      type: "success",
      isLoading: false,
      autoClose: 2000,
    });

    // Redirect based on role
    setTimeout(() => {
      switch (userDetails.role) {
        case "collaborateur":
          navigate("/AccueilCollaborateurs");
          break;
        case "RH":
          navigate("/AccueilRH");
          break;
        case "Chef Hiérarchique":
          navigate("/AccueilCHEF");
          break;
        case "Admin":
          navigate("/Accueil");
          break;
        default:
          navigate("/");
      }
    }, 1500);

  } catch (error) {
    console.error("Login error:", error);
    toast.error(error.message || "An error occurred during login", {
      autoClose: 5000,
    });
  } finally {
    setLoading(false);
  }
};
  // Get styles based on current theme
  const styles = getStyles(theme)

  return (
    <div style={styles.authContainer} className={`auth-container ${theme}`}>
      {/* Add the enhanced background with mouse effect */}
      <MouseMoveBackground theme={theme} />

      {/* Theme toggle button */}
      <button
        style={styles.themeToggle}
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? <FiSun /> : <FiMoon />}
      </button>

      <div style={styles.authBranding}>
        <img
          src={require("../../assets/logo.png") || "/placeholder.svg"}
          alt="Logo Portail RH"
          style={styles.themeAwareLogo}
        />
      </div>

      <div style={styles.authCard}>
        <div style={styles.authHeaderWrapper}>
          <div className="auth-header">
            <h1 style={styles.authTitle} className="auth-title">
              {action === "Login" ? "Se Connecter" : "Créer un compte"}
            </h1>

            <button
              style={styles.authSwitchButton}
              className="auth-switch-button"
              onClick={() => {
                setAction(action === "Login" ? "Sign up" : "Login")
                setFormData({
                  nom: "",
                  prenom: "",
                  matricule: "",
                  email: "",
                  password: "",
                  confirmPassword: "",
                })
              }}
              disabled={loading}
            >
              {action === "Login" ? "Créer un compte" : "Se connecter"}
            </button>
          </div>
        </div>

        <div className="auth-form">
          {action === "Sign up" && (
            <>
              <div style={styles.authInputGroup} className="auth-input-group">
                <label style={styles.authInputLabel} className="auth-input-label">
                  Nom
                </label>
                <div style={styles.authInputWrapper} className="auth-input-wrapper">
                  <FiUser style={styles.authIcon} className="auth-icon" />
                  <input
                    style={styles.authInput}
                    className="auth-input"
                    type="text"
                    placeholder="Votre nom"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div style={styles.authInputGroup} className="auth-input-group">
                <label style={styles.authInputLabel} className="auth-input-label">
                  Prénom
                </label>
                <div style={styles.authInputWrapper} className="auth-input-wrapper">
                  <FiUser style={styles.authIcon} className="auth-icon" />
                  <input
                    style={styles.authInput}
                    className="auth-input"
                    type="text"
                    placeholder="Votre prénom"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div style={styles.authInputGroup} className="auth-input-group">
            <label style={styles.authInputLabel} className="auth-input-label">
              Matricule
            </label>
            <div style={styles.authInputWrapper} className="auth-input-wrapper">
              <FiHash style={styles.authIcon} className="auth-icon" />
              <input
                style={styles.authInput}
                className="auth-input"
                type="text"
                placeholder="5 chiffres"
                name="matricule"
                value={formData.matricule}
                onChange={handleChange}
                maxLength="5"
                pattern="\d{5}"
                disabled={loading}
                required
              />
            </div>
          </div>

          {action === "Sign up" && (
            <div style={styles.authInputGroup} className="auth-input-group">
              <label style={styles.authInputLabel} className="auth-input-label">
                Email
              </label>
              <div style={styles.authInputWrapper} className="auth-input-wrapper">
                <FiMail style={styles.authIcon} className="auth-icon" />
                <input
                  style={styles.authInput}
                  className="auth-input"
                  type="email"
                  placeholder="Votre email professionnel"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          )}

          <div style={styles.authInputGroup} className="auth-input-group">
            <label style={styles.authInputLabel} className="auth-input-label">
              Mot de passe
            </label>
            <div style={styles.authInputWrapper} className="auth-input-wrapper">
              <FiLock style={styles.authIcon} className="auth-icon" />
              <input
                style={styles.authInput}
                className="auth-input"
                type="password"
                placeholder="Votre mot de passe"
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
          </div>

          {action === "Sign up" && (
            <div style={styles.authInputGroup} className="auth-input-group">
              <label style={styles.authInputLabel} className="auth-input-label">
                Confirmer le mot de passe
              </label>
              <div style={styles.authInputWrapper} className="auth-input-wrapper">
                <FiLock style={styles.authIcon} className="auth-icon" />
                <input
                  style={styles.authInput}
                  className="auth-input"
                  type="password"
                  placeholder="Confirmez votre mot de passe"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          )}

          <div style={styles.authSubmitWrapper} className="auth-submit-wrapper">
            <button
              style={styles.authSubmitButton}
              className="auth-submit-button"
              onClick={action === "Login" ? handleLogin : handleSignUp}
              disabled={loading || (action === "Sign up" && (!formData.nom || !formData.prenom))}
            >
              {loading ? (
                <span style={styles.authSpinner} className="auth-spinner"></span>
              ) : (
                <>
                  {action === "Login" ? <FiLogIn /> : <FiUserPlus />}
                  {action === "Login" ? "Se connecter" : "S'inscrire"}
                </>
              )}
            </button>
          </div>

          {/* Add Reset Password Button */}
          {action === "Login" && <ResetPasswordButton theme={theme} />}
        </div>

        <div style={styles.authFooter} className="auth-footer">
          {action === "Login" ? <span>Portail RH</span> : <span></span>}
        </div>
      </div>

      <ToastContainer
        position="top-right"
        theme={theme} // Use current theme for toasts
      />
    </div>
  )
}

export default Authentication

