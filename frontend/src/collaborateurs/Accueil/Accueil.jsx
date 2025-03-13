import { useState, useEffect } from "react"
import "./Accueil.css"
import logo3D from '../../assets/logo.png';
import { useNavigate } from "react-router-dom"
import Navbar from '../Components/Navbar/Navbar';
import Sidebar from '../Components/Sidebar/Sidebar';
import { FiFileText, FiCalendar, FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi"

const HomePage = () => {
  const navigate = useNavigate()
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    role: "",
    department: "",
  })
  const [stats, setStats] = useState({
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    upcomingLeaves: 0,
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch user data
    const userId = localStorage.getItem("userId")
    if (userId) {
      fetchUserData(userId)
      fetchUserStats(userId)
      fetchRecentActivity(userId)
    }
  }, [])

  const fetchUserData = async (userId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/Personnel/byId/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setUserData({
          firstName: data.nom || "User",
          lastName: data.prenom || "",
          role: data.role || "Collaborateur",
          department: data.serviceName || "Department",
        })
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStats = async (userId) => {
    // This would be replaced with actual API calls
    // Simulating data for now
    setStats({
      pendingRequests: 3,
      approvedRequests: 12,
      rejectedRequests: 2,
      upcomingLeaves: 1,
    })
  }

  const fetchRecentActivity = async (userId) => {
    // This would be replaced with actual API calls
    // Simulating data for now
    setRecentActivity([
      { id: 1, type: "Formation", status: "Approved", date: "2023-11-15", icon: "check" },
      { id: 2, type: "Congé", status: "Pending", date: "2023-11-10", icon: "clock" },
      { id: 3, type: "Document", status: "Rejected", date: "2023-11-05", icon: "x" },
      { id: 4, type: "Autorisation", status: "Approved", date: "2023-10-28", icon: "check" },
    ])
  }

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <FiCheckCircle className="status-icon approved" />
      case "pending":
        return <FiClock className="status-icon pending" />
      case "rejected":
        return <FiXCircle className="status-icon rejected" />
      default:
        return null
    }
  }

  if (loading) {
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
            <h1>Tableau de Bord</h1>
            <p className="subtitle">
              Bienvenue, {userData.firstName} {userData.lastName}. Voici un aperçu de vos demandes et activités.
            </p>
          </div>

          <div className="dashboard-grid">
            {/* Welcome Card */}
            <div className="dashboard-card welcome-card">
              <div className="card-content">
                <div className="welcome-content">
                  <img src={logo3D || "/placeholder.svg"} alt="Logo" className="welcome-logo" />
                  <div className="welcome-text">
                    <h2>Bienvenue sur le Portail RH</h2>
                    <p>Gérez vos demandes et suivez leur statut facilement.</p>
                    <div className="user-info">
                      <div className="info-item">
                        <span className="info-label">Rôle:</span>
                        <span className="info-value">{userData.role}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Département:</span>
                        <span className="info-value">{userData.department}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="dashboard-card stats-card">
              <div className="card-header">
                <h2 className="card-title">Statistiques des Demandes</h2>
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

                  <div className="stat-box">
                    <div className="stat-icon leave-icon">
                      <FiCalendar />
                    </div>
                    <div className="stat-info">
                      <span className="stat-label">Congés à venir</span>
                      <span className="stat-value">{stats.upcomingLeaves}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="dashboard-card actions-card">
              <div className="card-header">
                <h2 className="card-title">Actions Rapides</h2>
              </div>
              <div className="card-content">
                <div className="quick-actions">
                  <button className="action-button" onClick={() => navigate("/DemandeFormation")}>
                    <FiFileText className="action-icon" />
                    <span>Nouvelle Formation</span>
                  </button>
                  <button className="action-button" onClick={() => navigate("/DemandeConge")}>
                    <FiCalendar className="action-icon" />
                    <span>Demande de Congé</span>
                  </button>
                  <button className="action-button" onClick={() => navigate("/DemandeAutorisation")}>
                    <FiClock className="action-icon" />
                    <span>Autorisation</span>
                  </button>
                  <button className="action-button" onClick={() => navigate("/DemandeDocument")}>
                    <FiFileText className="action-icon" />
                    <span>Document</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity Card */}
            <div className="dashboard-card activity-card">
              <div className="card-header">
                <h2 className="card-title">Activités Récentes</h2>
              </div>
              <div className="card-content">
                {recentActivity.length > 0 ? (
                  <div className="activity-list">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="activity-item">
                        {getStatusIcon(activity.status)}
                        <div className="activity-details">
                          <div className="activity-type">{activity.type}</div>
                          <div className="activity-date">{activity.date}</div>
                        </div>
                        <div className={`activity-status status-${activity.status.toLowerCase()}`}>
                          {activity.status}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>Aucune activité récente</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage

