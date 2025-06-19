
import React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import Sidebar from "./Components/Sidebar/Sidebar"
import Navbar from "./Components/Navbar/Navbar"
import { FiUsers, FiClock, FiMapPin, FiRefreshCw } from "react-icons/fi"
import { FaFemale, FaMale } from "react-icons/fa"
import { toast } from "react-toastify"
import "react-calendar/dist/Calendar.css"
import "./Acceuil.css"
import { API_URL } from "../config"


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error("Erreur capturée par ErrorBoundary:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Quelque chose s'est mal passé</h2>
          <button onClick={() => window.location.reload()}>Rafraîchir la page</button>
        </div>
      )
    }
    return this.props.children
  }
}

const safeParse = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key)
    if (stored === null || stored === "undefined") return defaultValue
    return JSON.parse(stored)
  } catch (e) {
    console.error(`Erreur de parsing ${key} depuis localStorage:`, e)
    return defaultValue
  }
}

const deepEqual = (x, y) => {
  if (x === y) return true
  if (typeof x !== "object" || x === null || typeof y !== "object" || y === null) return false

  const keysX = Object.keys(x)
  const keysY = Object.keys(y)

  if (keysX.length !== keysY.length) return false

  for (const key of keysX) {
    if (!keysY.includes(key)) return false
    if (!deepEqual(x[key], y[key])) return false
  }

  return true
}

const fetchWithRetry = async (url, options = {}, retries = 3) => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("Aucun token d'authentification trouvé");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }

    // First try to parse as JSON, but fall back to text if it fails
    try {
      return await response.json();
    } catch (e) {
      // If response is empty, return empty object
      if (response.status === 204) return {};
      // Otherwise return the text content
      return await response.text();
    }
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return fetchWithRetry(url, options, retries - 1);
  }
};

const validateServiceResponse = (response) => {
  if (!response) return { isValid: false, error: "Réponse vide" }

  if (response.status === "error") {
    return {
      isValid: false,
      error: response.message || "Erreur du serveur",
    }
  }

  if (response.status === "success") {
    return {
      isValid: true,
      collaborators: Array.isArray(response.collaborators) ? response.collaborators : [],
      serviceName: response.serviceName || "Service",
      numberOfCollaborateurs: response.numberOfCollaborators || 0,
    }
  }

  return { isValid: false, error: "Structure de réponse invalide" }
}

const Accueil = () => {
  const userId = localStorage.getItem("userId")
  const userData = safeParse("userData", {})
  const userFirstName = userData.prenom || ""
  const userLastName = userData.nom || ""

  const [serviceInfo, setServiceInfo] = useState(() =>
    safeParse("serviceInfo", {
      name: "",
      activatedCount: 0,
      nonActivatedCount: 0,
      total: 0,
      maleCount: 0,
      femaleCount: 0,
      malePercentage: 0,
      femalePercentage: 0,
      error: null,
    }),
  )

  const [personnels, setPersonnels] = useState(() => safeParse("personnels", []))
  const [previousPersonnels, setPreviousPersonnels] = useState([])
  const [demandes, setDemandes] = useState(() => {
    const stored = safeParse("demandes", null)
    return (
      stored || {
        conge: { data: [], total: 0, approved: 0, pending: 0 },
        formation: { data: [], total: 0, approved: 0, pending: 0 },
        autorisation: { data: [], total: 0, approved: 0, pending: 0 },
      }
    )
  })
  const [previousDemandes, setPreviousDemandes] = useState(() => ({
    conge: { data: [], total: 0, approved: 0, pending: 0 },
    formation: { data: [], total: 0, approved: 0, pending: 0 },
    autorisation: { data: [], total: 0, approved: 0, pending: 0 },
  }))
  const [chefServices, setChefServices] = useState([])
  const [upcomingFormations, setUpcomingFormations] = useState(() => safeParse("upcomingFormations", []))
  const [approvedLeaves, setApprovedLeaves] = useState(() => safeParse("approvedLeaves", []))
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(() => {
    const stored = localStorage.getItem("lastUpdated")
    return stored && stored !== "undefined" ? stored : ""
  })
  const [theme, setTheme] = useState("light")
  const [newUpdates, setNewUpdates] = useState([])
  const [showUpdatesPanel, setShowUpdatesPanel] = useState(false)

  const personnelsRef = useRef(personnels)
  const serviceInfoRef = useRef(serviceInfo)
  const demandesRef = useRef(demandes)
  const upcomingFormationsRef = useRef(upcomingFormations)
  const approvedLeavesRef = useRef(approvedLeaves)

  useEffect(() => {
    personnelsRef.current = personnels
  }, [personnels])

  useEffect(() => {
    serviceInfoRef.current = serviceInfo
  }, [serviceInfo])

  useEffect(() => {
    demandesRef.current = demandes
  }, [demandes])

  useEffect(() => {
    upcomingFormationsRef.current = upcomingFormations
  }, [upcomingFormations])

  useEffect(() => {
    approvedLeavesRef.current = approvedLeaves
  }, [approvedLeaves])

  useEffect(() => {
    const savedTheme =
      localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    setTheme(savedTheme)
    document.documentElement.className = savedTheme
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    document.documentElement.className = newTheme
    localStorage.setItem("theme", newTheme)
  }

  useEffect(() => {
    const savedServices = localStorage.getItem("services")

    if (savedServices) {
      try {
        const parsedServices = JSON.parse(savedServices)
        if (Array.isArray(parsedServices)) {
          setChefServices(parsedServices)
        } else {
          console.warn("Données de services invalides dans localStorage.")
        }
      } catch (err) {
        console.error("Erreur de parsing des services depuis localStorage :", err)
      }
    } else {
      const fetchServices = async () => {
        const userId = localStorage.getItem("userId")

        if (userId) {
          try {
            const response = await fetchWithRetry(`${API_URL}/api/validators/by-chef/${userId}`)
            if (Array.isArray(response)) {
              setChefServices(response)
              localStorage.setItem("services", JSON.stringify(response))
            } else {
              console.warn("Réponse inattendue de l'API :", response)
            }
          } catch (err) {
            console.error("Erreur lors de la récupération des services :", err)
          }
        } else {
          console.warn("userId non trouvé dans localStorage.")
        }
      }

      fetchServices()
    }
  }, [])

  const saveToLocalStorage = useCallback((key, data) => {
    try {
      if (data) {
        localStorage.setItem(key, JSON.stringify(data))
        const now = new Date().toISOString()
        localStorage.setItem("lastUpdated", now)
        setLastUpdated(now)
      }
    } catch (e) {
      console.error("Erreur de sauvegarde dans LocalStorage:", e)
    }
  }, [])

  const processDemandes = useCallback((data, type) => {
    try {
      let demandesArray = []

      if (Array.isArray(data)) {
        demandesArray = data
      } else if (data && Array.isArray(data.demandes)) {
        demandesArray = data.demandes
      } else if (data && data.demandeAutorisations) {
        demandesArray = data.demandeAutorisations
      }

      return {
        data: demandesArray,
        total: demandesArray.length,
        approved: demandesArray.filter((d) => d?.reponseChef === "O").length,
        pending: demandesArray.filter((d) => d?.reponseChef === "I").length,
      }
    } catch (e) {
      console.error("Erreur de traitement des demandes:", e)
      return {
        data: [],
        total: 0,
        approved: 0,
        pending: 0,
      }
    }
  }, [])

const fetchApprovedLeaves = useCallback(
  async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetchWithRetry(`${API_URL}/api/demande-conge/approved`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Handle both array response and object with demandes property
      const demandesArray = Array.isArray(response) ? response : (response?.demandes || []);

      // Transform the data - keep all that the API returned as "approved"
      const formattedLeaves = demandesArray.map(leave => {
        const personnel = leave.matPers || leave.personnel || {};
        return {
          id: leave.id || leave._id,
          employeeName: `${personnel.nom || ""} ${personnel.prenom || ""}`.trim(),
          start: new Date(leave.dateDebut),
          end: new Date(leave.dateFin),
          title: personnel.nom ? `${personnel.nom} ${personnel.prenom}` : "Employé",
          type: "ANNUAL",
          status: "ACCEPTED", // Mark all as accepted since API already filtered
          duration: calculateDuration(leave.dateDebut, leave.dateFin),
          department: personnel.serviceName || "Unknown",
          approvedBy: "Manager",
          description: leave.texteDemande || "Congé annuel",
          rawData: leave // Keep original data
        };
      });

      setApprovedLeaves(formattedLeaves);
      saveToLocalStorage("approvedLeaves", formattedLeaves);

    } catch (error) {
      console.error("Error fetching approved leaves:", error);
      toast.error("Échec du chargement des demandes de congé approuvées");
    } finally {
      if (!silent) setLoading(false);
    }
  },
  [saveToLocalStorage],
);

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }
  const tileContent = ({ date, view }) => {
    if (view !== "month") return null

    const leavesOnDay = approvedLeaves.filter((leave) => date >= leave.start && date <= leave.end)

    if (leavesOnDay.length > 0) {
      return (
        <div className="calendar-event-indicator">
          {leavesOnDay.map((leave, i) => (
            <div key={i} className={`event-dot ${leave.type.toLowerCase().replace(" ", "-")}`} />
          ))}
        </div>
      )
    }
    return null
  }

  const tileClassName = ({ date, view }) => {
    if (view !== "month") return null

    const hasLeave = approvedLeaves.some((leave) => date >= leave.start && date <= leave.end)

    return hasLeave ? "has-leave" : null
  }

  const onDateClick = (date) => {
    const leavesOnDate = approvedLeaves.filter((leave) => date >= leave.start && date <= leave.end)

    if (leavesOnDate.length > 0) {
      toast.info(
        <div>
          <h4>Congés le {date.toLocaleDateString("fr-FR")}:</h4>
          <ul>
            {leavesOnDate.map((leave, i) => (
              <li key={i}>
                {leave.title} - {leave.type} (du {leave.start.toLocaleDateString("fr-FR")} au{" "}
                {leave.end.toLocaleDateString("fr-FR")})
              </li>
            ))}
          </ul>
        </div>,
        { autoClose: false },
      )
    }
  }

  const detectPersonnelChanges = useCallback((oldPersonnels, newPersonnels) => {
    const updates = []

    newPersonnels.forEach((newPerson) => {
      const exists = oldPersonnels.some((oldPerson) => oldPerson.id === newPerson.id)
      if (!exists) {
        updates.push({
          type: "nouveau_personnel",
          data: newPerson,
          timestamp: new Date().toISOString(),
          message: `Nouvel employé ajouté: ${newPerson.nom} ${newPerson.prenom}`,
        })
      }
    })

    oldPersonnels.forEach((oldPerson) => {
      const newPerson = newPersonnels.find((p) => p.id === oldPerson.id)
      if (newPerson && !deepEqual(oldPerson, newPerson)) {
        const changedFields = Object.keys(newPerson).filter((key) => !deepEqual(oldPerson[key], newPerson[key]))
        if (changedFields.length > 0) {
          updates.push({
            type: "personnel_mis_a_jour",
            data: newPerson,
            timestamp: new Date().toISOString(),
            message: `Employé mis à jour: ${newPerson.nom} ${newPerson.prenom} (${changedFields.join(", ")})`,
          })
        }
      }
    })

    oldPersonnels.forEach((oldPerson) => {
      const exists = newPersonnels.some((newPerson) => newPerson.id === oldPerson.id)
      if (!exists) {
        updates.push({
          type: "personnel_supprime",
          data: oldPerson,
          timestamp: new Date().toISOString(),
          message: `Employé supprimé: ${oldPerson.nom} ${oldPerson.prenom}`,
        })
      }
    })

    return updates
  }, [])

  const detectDemandesChanges = useCallback((oldDemandes, newDemandes) => {
    const updates = []

    const getRequesterName = (demande) => {
      if (!demande.personnel) return "Inconnu"
      return `${demande.personnel.nom} ${demande.personnel.prenom}`
    }

    Object.keys(newDemandes).forEach((type) => {
      const oldData = oldDemandes[type]?.data || []
      const newData = newDemandes[type]?.data || []

      newData.forEach((newDemande) => {
        const exists = oldData.some((oldDemande) => oldDemande.id === newDemande.id)
        if (!exists) {
          updates.push({
            type: `nouvelle_demande_${type}`,
            data: newDemande,
            timestamp: new Date().toISOString(),
            message: `Nouvelle demande ${type} de ${getRequesterName(newDemande)}`,
          })
        }
      })

      oldData.forEach((oldDemande) => {
        const newDemande = newData.find((d) => d.id === oldDemande.id)
        if (newDemande && oldDemande.reponseChef !== newDemande.reponseChef) {
          const statusMap = {
            O: "approuvée",
            I: "en attente",
            R: "rejetée",
          }
          updates.push({
            type: `statut_demande_${type}_change`,
            data: newDemande,
            timestamp: new Date().toISOString(),
            message: `Demande ${type} de ${getRequesterName(newDemande)} ${statusMap[newDemande.reponseChef]}`,
          })
        }
      })
    })

    return updates
  }, [])

  const fetchServiceData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true)
      try {
        if (!userId) {
          throw new Error("ID utilisateur non disponible")
        }

        const response = await fetchWithRetry(`${API_URL}/api/Personnel/collaborateurs-by-chef/${userId}`)

        const { isValid, collaborators, serviceName, numberOfCollaborateurs, error } = validateServiceResponse(response)

        if (!isValid) {
          throw new Error(error || "Format des données de service invalide")
        }

        if (collaborators.length > 0 || previousPersonnels.length > 0) {
          const personnelUpdates = detectPersonnelChanges(previousPersonnels, collaborators)
          if (personnelUpdates.length > 0) {
            setNewUpdates((prev) => [...prev.slice(-9), ...personnelUpdates])
          }
        }

        setPreviousPersonnels(collaborators)

        const stats = collaborators.reduce(
          (acc, person) => {
            if (person?.sexe === "male") acc.maleCount++
            if (person?.sexe === "female") acc.femaleCount++
            if (person?.active) acc.activatedCount++
            else acc.nonActivatedCount++
            return acc
          },
          { maleCount: 0, femaleCount: 0, activatedCount: 0, nonActivatedCount: 0 },
        )

        const total = numberOfCollaborateurs || collaborators.length
        const serviceData = {
          name: serviceName || "Service inconnu",
          ...stats,
          total,
          malePercentage: total > 0 ? Math.round((stats.maleCount / total) * 100) : 0,
          femalePercentage: total > 0 ? Math.round((stats.femaleCount / total) * 100) : 0,
          error: null,
        }

        setServiceInfo(serviceData)
        setPersonnels(collaborators)
        saveToLocalStorage("serviceInfo", serviceData)
        saveToLocalStorage("personnels", collaborators)

        return { serviceData, collaborators }
      } catch (error) {
        console.error("Erreur des données de service:", error)
        toast.error(`Échec du chargement des données de service: ${error.message}`)
        setServiceInfo((prev) => ({ ...prev, error: error.message }))
        return {
          serviceData: serviceInfoRef.current,
          collaborators: personnelsRef.current,
        }
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [userId, saveToLocalStorage, detectPersonnelChanges],
  )

  const fetchAllDemandes = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true)
      try {
        const endpoints = [
          { key: "conge", path: `demande-conge/collaborateurs-by-service/${userId}` },
          { key: "formation", path: `demande-formation/collaborateurs-by-service/${userId}` },
          { key: "autorisation", path: `demande-autorisation/collaborateurs-by-service/${userId}` },
        ]

        const results = await Promise.all(
          endpoints.map(async ({ key, path }) => {
            try {
              const data = await fetchWithRetry(`${API_URL}/api/${path}`)
              return { key, data: processDemandes(data, key) }
            } catch (err) {
              console.error(`Erreur ${key}:`, err)
              return {
                key,
                data: demandesRef.current[key] || {
                  data: [],
                  total: 0,
                  approved: 0,
                  pending: 0,
                },
              }
            }
          }),
        )

        const newDemandes = results.reduce((acc, { key, data }) => {
          acc[key] = data
          return acc
        }, {})

        const hasNewData = results.some((result) => !deepEqual(result.data.data, demandesRef.current[result.key].data))

        if (hasNewData) {
          if (
            previousDemandes.conge.data.length > 0 ||
            previousDemandes.formation.data.length > 0 ||
            previousDemandes.autorisation.data.length > 0
          ) {
            const demandeUpdates = detectDemandesChanges(previousDemandes, newDemandes)
            if (demandeUpdates.length > 0) {
              setNewUpdates((prev) => [...prev.slice(-9), ...demandeUpdates])
            }
          }

          setPreviousDemandes(newDemandes)
          setDemandes(newDemandes)
          saveToLocalStorage("demandes", newDemandes)
        }

        return newDemandes
      } catch (error) {
        console.error("Erreur de récupération des demandes:", error)
        toast.error("Échec du chargement des données de demandes")
        return demandesRef.current
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [userId, processDemandes, saveToLocalStorage, detectDemandesChanges],
  )

const fetchFormations = useCallback(
  async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetchWithRetry(`${API_URL}/api/demande-formation/personnel/${userId}/approved-by-chef1`);
      
      // Handle cases where response might be empty or not JSON
      let data = [];
      if (response) {
        try {
          // If response is already parsed (from fetchWithRetry), use it directly
          data = Array.isArray(response) ? response : [];
        } catch (e) {
          console.warn("Response was not valid JSON, using empty array");
          data = [];
        }
      }

      const now = new Date();
      const upcoming = data
        .filter((f) => f?.dateDebut && new Date(f.dateDebut) >= now)
        .sort((a, b) => new Date(a.dateDebut) - new Date(b.dateDebut))
        .slice(0, 3);

      setUpcomingFormations(upcoming);
      saveToLocalStorage("upcomingFormations", upcoming);

      return upcoming;
    } catch (error) {
      console.error("Erreur des formations:", error);
      if (error.message !== "Failed to execute 'json' on 'Response'") {
        toast.error("Échec du chargement des données de formation");
      }
      return upcomingFormationsRef.current;
    } finally {
      if (!silent) setLoading(false);
    }
  },
  [userId, saveToLocalStorage],
);

  const formatDate = useCallback((dateString) => {
    try {
      const options = { weekday: "short", day: "numeric", month: "short", year: "numeric" }
      return new Date(dateString).toLocaleDateString("fr-FR", options)
    } catch {
      return "Date invalide"
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([fetchServiceData(), fetchAllDemandes(), fetchFormations(), fetchApprovedLeaves()])
    } catch (e) {
      console.error("Erreur lors du rafraîchissement:", e)
    } finally {
      setLoading(false)
    }
  }, [fetchServiceData, fetchAllDemandes, fetchFormations, fetchApprovedLeaves])

  const toggleUpdatesPanel = () => {
    setShowUpdatesPanel(!showUpdatesPanel)
  }

  useEffect(() => {
    const storedServiceInfo = safeParse("serviceInfo", null)
    const storedPersonnels = safeParse("personnels", [])
    const storedDemandes = safeParse("demandes", null)
    const storedFormations = safeParse("upcomingFormations", [])
    const storedLeaves = safeParse("approvedLeaves", [])

    if (storedServiceInfo) setServiceInfo(storedServiceInfo)
    if (storedPersonnels) setPersonnels(storedPersonnels)
    if (storedDemandes) {
      setDemandes(storedDemandes)
    } else {
      // S'assurer que demandes a une structure par défaut
      setDemandes({
        conge: { data: [], total: 0, approved: 0, pending: 0 },
        formation: { data: [], total: 0, approved: 0, pending: 0 },
        autorisation: { data: [], total: 0, approved: 0, pending: 0 },
      })
    }
    if (storedFormations) setUpcomingFormations(storedFormations)
    if (storedLeaves) setApprovedLeaves(storedLeaves)

    const fetchInitialData = async () => {
      await fetchServiceData(true)
      await fetchAllDemandes(true)
      await fetchFormations(true)
      await fetchApprovedLeaves(true)
    }

    fetchInitialData()
  }, [fetchServiceData, fetchAllDemandes, fetchFormations, fetchApprovedLeaves])

  useEffect(() => {
    let isMounted = true
    const abortController = new AbortController()

    const loadData = async () => {
      if (!isMounted) return

      try {
        await Promise.all([
          fetchServiceData(true),
          fetchAllDemandes(true),
          fetchFormations(true),
          fetchApprovedLeaves(true),
        ])
      } catch (e) {
        console.error("Erreur lors du polling:", e)
      }
    }

    const pollingInterval = setInterval(loadData, 10 * 1000)
    loadData()

    return () => {
      isMounted = false
      abortController.abort()
      clearInterval(pollingInterval)
    }
  }, [fetchServiceData, fetchAllDemandes, fetchFormations, fetchApprovedLeaves])

  return (
    <ErrorBoundary>
      <div className={`app-container ${theme}`}>
        <Sidebar theme={theme} />
        <div className="dashboard-container">
          <Navbar userId={userId} theme={theme} toggleTheme={toggleTheme} />

          <div className="dashboard-content">
            <div className="dashboard-header">
              <div className="header-top">
                <h1>Aperçu du Tableau de Bord</h1>
     
              </div>
              <p className="welcome-message">
                Bienvenue,{" "}
                <span className="user-name">
                  {userFirstName} {userLastName}
                </span>
                . Chef du département <span className="service-name">{serviceInfo.name}</span>.
              </p>

            </div>

            <div className="dashboard-grid">
              {serviceInfo.error ? (
                <div className="dashboard-card error-card">
                  <div className="card-header">
                    <h2>Erreur de Chargement des Données</h2>
                  </div>
                  <div className="card-content">
                    <p>{serviceInfo.error}</p>
                    <button onClick={handleRefresh} className="retry-btn">
                      <FiRefreshCw /> Réessayer
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="dashboard-card personnel-overview">
                    <div className="card-header">
                      <h2>Aperçu du Personnel</h2>
                    </div>
                    <div className="card-content">
                      <div className="stat-cards">
                        <div className="stat-card">
                          <div className="stat-icon total">
                            <FiUsers />
                          </div>
                          <div className="stat-details">
                            <h3>Total</h3>
                            <p className="stat-value">{serviceInfo.total}</p>
                          </div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-icon male">
                            <FaMale className={theme} />
                          </div>
                          <div className="stat-details">
                            <h3>Hommes</h3>
                            <p className="stat-value">
                              {serviceInfo.maleCount} ({serviceInfo.malePercentage}%)
                            </p>
                          </div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-icon female">
                            <FaFemale className={theme} />
                          </div>
                          <div className="stat-details">
                            <h3>Femmes</h3>
                            <p className="stat-value">
                              {serviceInfo.femaleCount} ({serviceInfo.femalePercentage}%)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <div className="card-header">
                      <h2>Services du Chef Actuel</h2>
                    </div>
                    <div className="card-content">
                      {chefServices.length === 0 ? (
                        <p>Aucun service trouvé.</p>
                      ) : (
                        <ul>
                          {chefServices.map((service) => (
                            <li key={service.id}>
                              <strong>Nom Du Service : {service.serviceName}</strong> — Poids: {service.poid}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="dashboard-card recent-requests">
                    <div className="card-header">
                      <h2>Demandes Récentes</h2>
                    </div>
                    <div className="card-content">
                      <div className="requests-summary">
                        <div className="request-type conge">
                          <div className="request-icon">
                            <FiClock />
                          </div>
                          <h3>Congé</h3>
                          <p className="request-total">{demandes?.conge?.total || 0}</p>
                        </div>
                        <div className="request-type formation">
                          <div className="request-icon">
                            <FiUsers />
                          </div>
                          <h3>Formation</h3>
                          <p className="request-total">{demandes?.formation?.total || 0}</p>
                        </div>
                        <div className="request-type autorisation">
                          <div className="request-icon">
                            <FiMapPin />
                          </div>
                          <h3>Autorisation</h3>
                          <p className="request-total">{demandes?.autorisation?.total || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>


                </>
              )}
            </div>
          </div>
        </div>

        {showUpdatesPanel && (
          <div className="real-time-updates-panel">
            <div className="panel-header">
              <h3>Mises à Jour Récentes</h3>
              <button onClick={toggleUpdatesPanel} className="close-panel">
                &times;
              </button>
            </div>
            <div className="updates-feed">
              {newUpdates.length === 0 ? (
                <p className="no-updates">Aucune mise à jour récente</p>
              ) : (
                newUpdates
                  .slice()
                  .reverse()
                  .map((update, index) => (
                    <div key={index} className="update-item">
                      <div className="update-header">
                        <span className="update-type">{update.type?.replace("_", " ") || "mise à jour"}</span>
                        <span className="update-time">{new Date(update.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="update-content">{update.message}</div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default Accueil
