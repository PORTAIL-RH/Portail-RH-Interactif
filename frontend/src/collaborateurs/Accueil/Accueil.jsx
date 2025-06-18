import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FiFileText, FiCalendar, FiUsers, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle } from "react-icons/fi"
import "../common-ui.css" 
import "./Accueil.css"
import Navbar from "../Components/Navbar/Navbar"
import Sidebar from "../Components/Sidebar/Sidebar"
import { API_URL } from "../../config"

const Accueil = () => {
  const navigate = useNavigate()
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    role: "",
    serviceName: "",
  })
  const [stats, setStats] = useState({
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    leaveBalance: 0,
  })
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activityFilter, setActivityFilter] = useState("all")

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = localStorage.getItem("userId")
        const token = localStorage.getItem("authToken")

        if (!userId || !token) {
          throw new Error("Session invalide")
        }

        const response = await fetch(`${API_URL}/api/Personnel/byId/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Erreur lors du chargement des données")
        }

        const data = await response.json()

        setUserData({
          firstName: data.nom || "",
          lastName: data.prenom || "",
          role: data.role || "Employé",
          serviceName: data.serviceName || "Non spécifié",
        })

        // Fetch stats and activities
        await fetchStats(userId, token)
        await fetchActivities(userId, token)
      } catch (error) {
        console.error("Error fetching user data:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const fetchStats = async (userId, token) => {
    try {
      // Simulate API call for stats
      // In a real app, you would fetch this from your API
      setStats({
        pendingRequests: 3,
        approvedRequests: 2,
        rejectedRequests: 2
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const fetchActivities = async (userId, token) => {
    try {
      // Simulate API call for recent activities
      // In a real app, you would fetch this from your API
      setActivities([
        {
          id: 1,
          type: "Congé",
          date: "2023-11-15",
          status: "Approuvée",
          description: "Congé annuel",
        },
        {
          id: 2,
          type: "Document",
          date: "2023-11-10",
          status: "En attente",
          description: "Demande d'attestation de travail",
        },
        {
          id: 3,
          type: "Formation",
          date: "2023-11-05",
          status: "Rejetée",
          description: "Formation sur les nouvelles technologies",
        },
      ])
    } catch (error) {
      console.error("Error fetching activities:", error)
    }
  }

  const filterActivities = () => {
    let filtered = [...activities]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (activity) => activity.type.toLowerCase().includes(query) || activity.description.toLowerCase().includes(query),
      )
    }

    if (activityFilter !== "all") {
      filtered = filtered.filter((activity) => activity.status.toLowerCase() === activityFilter.toLowerCase())
    }

    return filtered
  }

  const clearFilters = () => {
    setSearchQuery("")
    setActivityFilter("all")
  }

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case "approuvée":
        return <FiCheckCircle className="status-icon approved" />
      case "rejetée":
        return <FiXCircle className="status-icon rejected" />
      default:
        return <FiClock className="status-icon pending" />
    }
  }

  if (loading) {
    return (
      <div className="app-container">
        <Sidebar />
        <div className="content-container">
          <Navbar />
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Chargement en cours...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-container">
        <Sidebar />
        <div className="content-container">
          <Navbar />
          <div className="error-container">
            <FiAlertCircle size={48} className="error-icon" />
            <p className="error-message">{error}</p>
            <button onClick={() => (window.location.href = "/login")}>Se connecter</button>
          </div>
        </div>
      </div>
    )
  }

  const filteredActivities = filterActivities()

  return (
    <div className="app-container">
      <Sidebar />
      <div className="content-container">
        <Navbar />
        <div className="page-content">
          <div className="page-header">
            <h1>Tableau de bord</h1>
            <p className="page-subtitle">
              Bienvenue, {userData.firstName} {userData.lastName}
            </p>
          </div>

          {/* Dashboard Grid */}
          <div className="dashboard-grid">
            {/* Welcome Card */}
            <div className="content-card welcome-card">
              <div className="card-header">
                <h2>Bienvenue sur votre portail RH</h2>
              </div>
              <div className="card-content">
                <div className="welcome-content">
                  <img   src={require("../../assets/logo.png")}
 alt="Logo" className="welcome-logo" />
                  <div className="welcome-text">
                    <h2>
                      Bonjour, {userData.firstName} {userData.lastName}
                    </h2>
                    <p>
                      Bienvenue sur votre portail RH. Gérez vos demandes, consultez vos documents et suivez vos congés
                      en un seul endroit.
                    </p>
                    <div className="user-info">
                      <div className="info-item">
                        <span className="info-label">Rôle</span>
                        <span className="info-value">{userData.role}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Service</span>
                        <span className="info-value">{userData.serviceName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="content-card stats-card">
              <div className="card-header">
                <h2>Statistiques</h2>
              </div>
              <div className="card-content">
                <div className="stats-grid">
                  <div className="stat-box">
                    <div className="stat-icon pending-icon">
                      <FiClock />
                    </div>
                    <div className="stat-info">
                      <span className="stat-label">En attente</span>
                      <span className="stat-value">{stats.pendingRequests}</span>
                    </div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-icon approved-icon">
                      <FiCheckCircle />
                    </div>
                    <div className="stat-info">
                      <span className="stat-label">Approuvées</span>
                      <span className="stat-value">{stats.approvedRequests}</span>
                    </div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-icon rejected-icon">
                      <FiXCircle />
                    </div>
                    <div className="stat-info">
                      <span className="stat-label">Rejetées</span>
                      <span className="stat-value">{stats.rejectedRequests}</span>
                    </div>
                  </div>
                 
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="content-card">
              <div className="card-header">
                <h2>Actions rapides</h2>
              </div>
              <div className="card-content">
                <div className="quick-actions">
                  <button className="action-button" onClick={() => navigate("/DemandeConge")}>
                    <FiCalendar className="action-icon" />
                    Demander un congé
                  </button>
                  <button className="action-button" onClick={() => navigate("/DemandeDocument")}>
                    <FiFileText className="action-icon" />
                    Demander un document
                  </button>
                  <button className="action-button" onClick={() => navigate("/Documents")}>
                    <FiFileText className="action-icon" />
                    Mes documents
                  </button>
                  <button className="action-button" onClick={() => navigate("/Profile")}>
                    <FiUsers className="action-icon" />
                    Mon profil
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Accueil

