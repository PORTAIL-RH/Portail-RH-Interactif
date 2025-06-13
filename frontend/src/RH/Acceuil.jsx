import { useState, useEffect, useRef, useCallback } from "react"
import Sidebar from "./Components/Sidebar/Sidebar"
import Navbar from "./Components/Navbar/Navbar"
import { FiUsers, FiUserCheck, FiUserX, FiClock, FiMapPin, FiRefreshCw } from "react-icons/fi"
import { FaFemale, FaMale } from "react-icons/fa"
import "./Acceuil.css"
import { API_URL } from "../config"

// Cache management helper
const useCache = () => {
  const get = (key, defaultValue) => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : defaultValue
    } catch (e) {
      console.error(`Cache read error for ${key}:`, e)
      return defaultValue
    }
  }

  const set = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.error(`Cache write error for ${key}:`, e)
    }
  }

  return { get, set }
}

const Accueil = () => {
  const { get: getCache, set: setCache } = useCache()
  const [dashboardStats, setDashboardStats] = useState(() => 
    getCache('dashboardStats', {
      personnel: { activated: 0, nonActivated: 0, total: 0 },
      gender: { male: 0, female: 0, total: 0 }
    })
  )

  const [demandes, setDemandes] = useState(() => 
    getCache('demandes', {
      conge: [], formation: [], document: [], preAvance: [], autorisation: []
    })
  )

  const [personnel, setPersonnel] = useState(() => getCache('personnel', []))
  const [upcomingFormations, setUpcomingFormations] = useState(() => getCache('upcomingFormations', []))
  const [theme, setTheme] = useState("light")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('')
  const [error, setError] = useState(null)

  // Refs for cleanup
  const pollingRef = useRef(null)
  const isMountedRef = useRef(true)

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    setTheme(savedTheme)
    document.documentElement.className = savedTheme
    
    return () => {
      document.documentElement.className = ''
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    document.documentElement.className = newTheme
    localStorage.setItem("theme", newTheme)
  }

  // Fetch upcoming formations with retry logic
  const fetchFormations = useCallback(async () => {
    try {
      const timestamp = Date.now()
      const response = await fetch(`${API_URL}/api/demande-formation/approved?timestamp=${timestamp}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const now = new Date()
      
      const upcoming = (Array.isArray(data) ? data : [])
        .filter(f => f?.dateDebut && new Date(f.dateDebut) >= now)
        .sort((a, b) => new Date(a.dateDebut) - new Date(b.dateDebut))
        .slice(0, 3)

      if (isMountedRef.current) {
        setUpcomingFormations(upcoming)
        setCache('upcomingFormations', upcoming)
        setError(null)
      }
      
      return upcoming
    } catch (err) {
      console.error("Formations fetch failed:", err)
      if (isMountedRef.current) {
        setError("Erreur de chargement des formations")
      }
      throw err
    }
  }, [setCache])

  // Main data fetching function
  const fetchAllData = useCallback(async () => {
    if (!isMountedRef.current) return
    
    console.log("Starting data refresh...")
    setIsRefreshing(true)
    setError(null)
    
    try {
      const timestamp = Date.now()
      const cacheBuster = `?timestamp=${timestamp}`
      
      // Define all endpoints
      const endpoints = {
        stats: {
          activation: `${API_URL}/api/Personnel/activation-status${cacheBuster}`,
          gender: `${API_URL}/api/Personnel/gender-distribution${cacheBuster}`,
          personnel: `${API_URL}/api/Personnel/active${cacheBuster}`
        },
        demandes: {
          conge: `${API_URL}/api/demande-conge/approved${cacheBuster}`,
          formation: `${API_URL}/api/demande-formation/approved${cacheBuster}`,
          document: `${API_URL}/api/demande-document${cacheBuster}`,
          preAvance: `${API_URL}/api/demande-pre-avance${cacheBuster}`,
          autorisation: `${API_URL}/api/demande-autorisation/approved${cacheBuster}`
        }
      }

      // Fetch all data in parallel
      const [
        activationRes,
        genderRes,
        personnelRes,
        congeRes,
        formationRes,
        documentRes,
        preAvanceRes,
        autorisationRes
      ] = await Promise.all([
        fetch(endpoints.stats.activation),
        fetch(endpoints.stats.gender),
        fetch(endpoints.stats.personnel),
        fetch(endpoints.demandes.conge),
        fetch(endpoints.demandes.formation),
        fetch(endpoints.demandes.document),
        fetch(endpoints.demandes.preAvance),
        fetch(endpoints.demandes.autorisation)
      ])

      // Check for any failed responses
      const responses = [activationRes, genderRes, personnelRes, 
                         congeRes, formationRes, documentRes, preAvanceRes, autorisationRes]
      
      const failed = responses.some(res => !res.ok)
      if (failed) {
        throw new Error("Une ou plusieurs requêtes ont échoué")
      }

      // Process all responses
      const [
        activationData,
        genderData,
        personnelData,
        congeData,
        formationData,
        documentData,
        preAvanceData,
        autorisationData
      ] = await Promise.all(responses.map(res => res.json()))

      // Update state
      if (isMountedRef.current) {
        setDashboardStats({
          personnel: {
            activated: activationData.activated,
            nonActivated: activationData.nonActivated,
            total: personnelData.length
          },
          gender: {
            male: genderData.male,
            female: genderData.female,
            total: genderData.male + genderData.female
          }
        })

        setDemandes({
          conge: congeData,
          formation: formationData,
          document: documentData,
          preAvance: preAvanceData,
          autorisation: autorisationData
        })

        setPersonnel(personnelData)

        // Update cache
        setCache('dashboardStats', {
          personnel: {
            activated: activationData.activated,
            nonActivated: activationData.nonActivated,
            total: personnelData.length
          },
          gender: {
            male: genderData.male,
            female: genderData.female,
            total: genderData.male + genderData.female
          }
        })

        setCache('demandes', {
          conge: congeData,
          formation: formationData,
          document: documentData,
          preAvance: preAvanceData,
          autorisation: autorisationData
        })

        setCache('personnel', personnelData)

        // Update timestamp
        setLastUpdated(new Date().toLocaleTimeString())
      }

      // Fetch formations separately
      await fetchFormations()

    } catch (err) {
      console.error("Data fetch error:", err)
      if (isMountedRef.current) {
        setError("Erreur de chargement des données. Réessayez...")
      }
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false)
        console.log("Data refresh completed")
      }
    }
  }, [fetchFormations, setCache])

  // Setup polling
  useEffect(() => {
    isMountedRef.current = true
    
    // Initial load
    fetchAllData()
    
    // Setup polling every 10 seconds
    pollingRef.current = setInterval(fetchAllData, 10000)
    
    // Cleanup
    return () => {
      isMountedRef.current = false
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [fetchAllData])

  // Manual refresh handler
  const handleRefresh = () => {
    if (!isRefreshing) {
      fetchAllData()
    }
  }

  // Calculate percentages
  const malePercentage = dashboardStats.gender.total > 0 
    ? (dashboardStats.gender.male / dashboardStats.gender.total * 100).toFixed(2)
    : 0
  const femalePercentage = dashboardStats.gender.total > 0 
    ? (dashboardStats.gender.female / dashboardStats.gender.total * 100).toFixed(2)
    : 0

  // Calculate request totals
  const demandesTotals = {
    conge: demandes.conge?.length || 0,
    formation: demandes.formation?.length || 0,
    document: demandes.document?.length || 0,
    preAvance: demandes.preAvance?.length || 0,
    autorisation: demandes.autorisation?.length || 0
  }

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className="dashboard-container">
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        
        <div className="dashboard-content">
          
          
          {error && (
            <div className="error-message">
              {error}
              <button onClick={handleRefresh}>Réessayer</button>
            </div>
          )}

          <div className="dashboard-header">
            <div className="header-top">
              <h1>Aperçu du Tableau de Bord</h1>
 
            </div>
            <p>Bienvenue, RH. Voici ce qui se passe avec votre équipe aujourd'hui.</p>

          </div>

          <div className="dashboard-grid">
            {/* Personnel Overview Card */}
            <div className="dashboard-card personnel-overview">
              <div className="card-header">
                <h2>Aperçu du Personnel</h2>
              </div>
              <div className="card-content">
                <div className="stat-cards">
                  <div className="stat-card">
                    <div className="stat-icon activated">
                      <FiUserCheck />
                    </div>
                    <div className="stat-details">
                      <h3>Activé</h3>
                      <p className="stat-value">{dashboardStats.personnel.activated}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon non-activated">
                      <FiUserX />
                    </div>
                    <div className="stat-details">
                      <h3>Non Activé</h3>
                      <p className="stat-value">{dashboardStats.personnel.nonActivated}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon total">
                      <FiUsers />
                    </div>
                    <div className="stat-details">
                      <h3>Total</h3>
                      <p className="stat-value">{dashboardStats.personnel.total}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gender Distribution Card */}
            <div className="dashboard-card gender-distribution">
              <div className="card-header">
                <h2>Répartition par Genre</h2>
              </div>
              <div className="card-content">
                <div className="gender-chart">
                  <div className="gender-bars">
                    <div className="gender-bar-container">
                      <div className="gender-label">
                        <FaMale className="male-icon" />
                        <span>Hommes</span>
                      </div>
                      <div className="gender-bar-wrapper">
                        <div 
                          className="gender-bar male-bar" 
                          style={{ width: `${malePercentage}%` }}
                        ></div>
                        <span className="gender-percentage">{malePercentage}%</span>
                      </div>
                    </div>
                    <div className="gender-bar-container">
                      <div className="gender-label">
                        <FaFemale className="female-icon" />
                        <span>Femmes</span>
                      </div>
                      <div className="gender-bar-wrapper">
                        <div 
                          className="gender-bar female-bar" 
                          style={{ width: `${femalePercentage}%` }}
                        ></div>
                        <span className="gender-percentage">{femalePercentage}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Requests Card */}
            <div className="dashboard-card recent-requests">
              <div className="card-header">
                <h2>Demandes Récentes</h2>
              </div>
              <div className="card-content">
                <div className="requests-summary">
                  <div className="request-type">
                    <h3>Congé</h3>
                    <p>{demandesTotals.conge}</p>
                  </div>
                  <div className="request-type">
                    <h3>Formation</h3>
                    <p>{demandesTotals.formation}</p>
                  </div>
                  <div className="request-type">
                    <h3>Documents</h3>
                    <p>{demandesTotals.document}</p>
                  </div>
                  <div className="request-type">
                    <h3>Pré-Avance</h3>
                    <p>{demandesTotals.preAvance}</p>
                  </div>
                  <div className="request-type">
                    <h3>Autorisation</h3>
                    <p>{demandesTotals.autorisation}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Training Card */}
            <div className="dashboard-card upcoming-formations">
              <div className="card-header">
                <h2>Formations à Venir</h2>
              </div>
              <div className="card-content">
                {upcomingFormations.length > 0 ? (
                  <div className="formations-list">
                    {upcomingFormations.map((formation, index) => {
                      const startDate = new Date(formation.dateDebut)
                      const endDate = formation.dateFin ? new Date(formation.dateFin) : null
                      
                      return (
                        <div key={index} className="formation-event">
                          <div className="calendar-badge">
                            <div className="calendar-month">
                              {startDate.toLocaleString("fr-FR", { month: "short" }).toUpperCase()}
                            </div>
                            <div className="calendar-day">{startDate.getDate()}</div>
                            <div className="calendar-weekday">
                              {startDate.toLocaleString("fr-FR", { weekday: "short" })}
                            </div>
                          </div>
                          <div className="formation-info">
                            <h3 className="formation-title">
                              {formation.theme?.name || formation.titre?.name || "Formation"}
                            </h3>
                            <div className="formation-meta">
                              <span className="meta-item">
                                <FiClock /> 
                                {endDate 
                                  ? `${Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))} jours`
                                  : "1 jour"}
                              </span>
                              {formation.lieu && (
                                <span className="meta-item">
                                  <FiMapPin /> {formation.lieu}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="no-formations">
                    <FiClock className="no-data-icon" />
                    <p>Aucune formation prévue</p>
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

export default Accueil