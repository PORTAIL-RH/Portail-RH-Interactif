import { useState, useEffect } from "react"
import Sidebar from "../Sidebar/Sidebar"
import Navbar from "../Navbar/Navbar"
import "./Personnels.css" // Réutilisation du même CSS
import { API_URL } from "../../../config"

const ComptesBloques = () => {
  const [comptesBloques, setComptesBloques] = useState([])
  const [chargement, setChargement] = useState(true)
  const [toast, setToast] = useState({ show: false, message: "", type: "" })
  const [pageCourante, setPageCourante] = useState(1)
  const [elementsParPage] = useState(10)
  const [filtreMatricule, setFiltreMatricule] = useState("")
  const [filtreNom, setFiltreNom] = useState("")
  const [theme, setTheme] = useState("light")
  const [sidebarReplie, setSidebarReplie] = useState(false)
  const [deverouillageId, setDeverouillageId] = useState(null)

  useEffect(() => {
    const gererToggleSidebar = (e) => {
      setSidebarReplie(e.detail)
    }

    window.addEventListener('sidebarToggled', gererToggleSidebar)
    
    return () => {
      window.removeEventListener('sidebarToggled', gererToggleSidebar)
    }
  }, [])

  // Gestion du thème
  useEffect(() => {
    const themeSauvegarde = localStorage.getItem("theme") || "light"
    setTheme(themeSauvegarde)
    appliquerTheme(themeSauvegarde)
  }, [])

  const appliquerTheme = (theme) => {
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(theme)
    localStorage.setItem("theme", theme)
  }

  const basculerTheme = () => {
    const nouveauTheme = theme === "light" ? "dark" : "light"
    setTheme(nouveauTheme)
    appliquerTheme(nouveauTheme)
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: nouveauTheme }))
  }

  // Afficher une notification toast
  const afficherToast = (message, type = "success") => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" })
    }, 3000)
  }

  // Récupérer les comptes bloqués
  const recupererComptesBloques = async () => {
    setChargement(true)
    try {
      const reponse = await fetch(`${API_URL}/api/Personnel/locked-accounts`)
      if (!reponse.ok) {
        throw new Error("Échec de la récupération des comptes bloqués")
      }
      const donnees = await reponse.json()
      setComptesBloques(donnees || [])
    } catch (erreur) {
      console.error("Erreur lors de la récupération des comptes bloqués:", erreur)
      afficherToast(erreur.message, "error")
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    recupererComptesBloques()
  }, [])

  // Déverrouiller un compte
  const deverrouillerCompte = async (matricule) => {
    setDeverouillageId(matricule)
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        afficherToast("Veuillez vous connecter d'abord", "error")
        setDeverouillageId(null)
        return
      }

      afficherToast("Déverrouillage du compte...", "info")

      const reponse = await fetch(`${API_URL}/api/Personnel/unlock-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ matricule }),
      })

      if (!reponse.ok) {
        const erreur = await reponse.json()
        throw new Error(erreur.error || "Échec du déverrouillage du compte")
      }

      const resultat = await reponse.json()
      afficherToast(resultat.message, "success")

      // Mettre à jour l'état local au lieu de recharger
      setComptesBloques(prev => prev.filter(compte => compte.matricule !== matricule))
    } catch (erreur) {
      afficherToast(erreur.message, "error")
      console.error("Erreur lors du déverrouillage du compte:", erreur)
    } finally {
      setDeverouillageId(null)
    }
  }

  // Réinitialiser les filtres
  const reinitialiserFiltres = () => {
    setFiltreMatricule("")
    setFiltreNom("")
    setPageCourante(1)
  }

  // Filtrer les comptes bloqués
  const comptesFiltres = comptesBloques.filter((compte) => {
    const correspondMatricule =
      filtreMatricule === "" ||
      (compte.matricule && compte.matricule.toLowerCase().includes(filtreMatricule.toLowerCase()))

    const correspondNom =
      filtreNom === "" ||
      (compte.fullName && compte.fullName.toLowerCase().includes(filtreNom.toLowerCase()))

    return correspondMatricule && correspondNom
  })

  // Logique de pagination
  const pagesTotales = Math.ceil(comptesFiltres.length / elementsParPage)
  const indexDernierElement = pageCourante * elementsParPage
  const indexPremierElement = indexDernierElement - elementsParPage
  const elementsCourants = comptesFiltres.slice(indexPremierElement, indexDernierElement)

  // Changer de page
  const paginer = (numeroPage) => setPageCourante(numeroPage)
  const pageSuivante = () => setPageCourante((prev) => Math.min(prev + 1, pagesTotales))
  const pagePrecedente = () => setPageCourante((prev) => Math.max(prev - 1, 1))

  // Réinitialiser à la page 1 lorsque les filtres changent
  useEffect(() => {
    setPageCourante(1)
  }, [filtreMatricule, filtreNom])

  // Générer les numéros de page pour la pagination
  const obtenirNumerosPage = () => {
    const numerosPage = []
    const pagesMaxAffichees = 5

    if (pagesTotales <= pagesMaxAffichees) {
      for (let i = 1; i <= pagesTotales; i++) {
        numerosPage.push(i)
      }
    } else {
      numerosPage.push(1)

      let pageDebut = Math.max(2, pageCourante - 1)
      let pageFin = Math.min(pagesTotales - 1, pageCourante + 1)

      if (pageCourante <= 3) {
        pageFin = Math.min(pagesTotales - 1, 4)
      }

      if (pageCourante >= pagesTotales - 2) {
        pageDebut = Math.max(2, pagesTotales - 3)
      }

      if (pageDebut > 2) {
        numerosPage.push("...")
      }

      for (let i = pageDebut; i <= pageFin; i++) {
        numerosPage.push(i)
      }

      if (pageFin < pagesTotales - 1) {
        numerosPage.push("...")
      }

      numerosPage.push(pagesTotales)
    }

    return numerosPage
  }


  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className={`dashboard-container ${sidebarReplie ? 'collapsed' : ''}`}>
        <Navbar theme={theme} basculerTheme={basculerTheme} />
        <div className="dashboard-content">
          {/* Notification Toast */}
          {toast.show && (
            <div className={`toast-notification ${toast.type}`}>
              <div className="toast-icon">
                {toast.type === "success" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                )}
                {toast.type === "error" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                )}
                {toast.type === "info" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                )}
              </div>
              <div className="toast-content">
                <p>{toast.message}</p>
              </div>
              <button className="toast-close" onClick={() => setToast({ show: false, message: "", type: "" })}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          )}

          <div className="page-header">
            <h2 className="page-title">Gestion des Comptes Bloqués</h2>
          </div>

          {/* Carte de Statistiques */}
          <div className="stats-container">
            <div className="stat-card inactive">
              <h3>Comptes Bloqués</h3>
              <div className="stat-value">{comptesBloques.length}</div>
              <div className="stat-description">Comptes actuellement bloqués</div>
            </div>
          </div>

          {/* Section de Filtrage Améliorée */}
          <div className="filtration-section">
            <div className="filtration-header">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              <h3>Filtrer les Comptes Bloqués</h3>
            </div>
            <div className="filtration-content">
              <div className="filtration-row">
                <div className="filter-group">
                  <label htmlFor="filterName">Nom</label>
                  <div className="filter-input">
                    <svg
                      className="filter-icon"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <input
                      id="filterName"
                      type="text"
                      placeholder="Rechercher par nom..."
                      value={filtreNom}
                      onChange={(e) => setFiltreNom(e.target.value)}
                    />
                  </div>
                </div>
                <div className="filter-group">
                  <label htmlFor="filterMatricule">Matricule</label>
                  <div className="filter-input">
                    <svg
                      className="filter-icon"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <input
                      id="filterMatricule"
                      type="text"
                      placeholder="Rechercher par matricule..."
                      value={filtreMatricule}
                      onChange={(e) => setFiltreMatricule(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="filter-actions">
                <button className="filter-button secondary" onClick={reinitialiserFiltres}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12h6"></path>
                    <path d="M22 12h-6"></path>
                    <path d="M12 2v6"></path>
                    <path d="M12 22v-6"></path>
                    <path d="M20 16l-4-4 4-4"></path>
                    <path d="M4 8l4 4-4 4"></path>
                    <path d="M16 4l-4 4-4-4"></path>
                    <path d="M8 20l4-4 4 4"></path>
                  </svg>
                  Réinitialiser les Filtres
                </button>
              </div>
            </div>
            <div className="filter-results">
              <div className="results-count">
                Affichage de <strong>{indexPremierElement + 1}</strong> à{" "}
                <strong>{Math.min(indexDernierElement, comptesFiltres.length)}</strong> sur{" "}
                <strong>{comptesFiltres.length}</strong> comptes bloqués
              </div>
            </div>
          </div>

          {chargement ? (
            <div className="table-loading">
              <div className="loading-spinner"></div>
              <p>Chargement des comptes bloqués...</p>
            </div>
          ) : comptesFiltres.length > 0 ? (
            <div className="table-container">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Matricule</th>
                    <th>Raison du Blocage</th>
                    <th>Tentatives Échouées</th>
                    <th>Heure de Blocage</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {elementsCourants.map((compte) => (
                    <tr key={compte.matricule}>
                      <td>{compte.fullName}</td>
                      <td>{compte.email}</td>
                      <td>{compte.matricule}</td>
                      <td>{compte.lockReason || "Trop de tentatives échouées"}</td>
                      <td>{compte.failedAttempts || "N/A"}</td>
                      <td>
                        {compte.lockTime ? new Date(compte.lockTime).toLocaleString() : "N/A"}
                      </td>
            
                      <td>
                        <button
                          className="action-button activate"
                          onClick={() => deverrouillerCompte(compte.matricule)}
                          disabled={deverouillageId === compte.matricule}
                        >
                          {deverouillageId === compte.matricule ? (
                            <span className="row-spinner"></span>
                          ) : (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                              </svg>
                              Déverrouiller
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="pagination-container">
                <div className="pagination-info">
                  Affichage de {indexPremierElement + 1} à {Math.min(indexDernierElement, comptesFiltres.length)} sur{" "}
                  {comptesFiltres.length} entrées
                </div>
                <div className="pagination-controls">
                  <button className="pagination-button" onClick={pagePrecedente} disabled={pageCourante === 1}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>

                  {obtenirNumerosPage().map((numero, index) =>
                    numero === "..." ? (
                      <div key={`ellipsis-${index}`} className="pagination-ellipsis">
                        ...
                      </div>
                    ) : (
                      <button
                        key={numero}
                        className={`pagination-button ${pageCourante === numero ? "active" : ""}`}
                        onClick={() => paginer(numero)}
                      >
                        {numero}
                      </button>
                    ),
                  )}

                  <button className="pagination-button" onClick={pageSuivante} disabled={pageCourante === pagesTotales}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <svg
                className="empty-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <p className="empty-text">
                Aucun compte bloqué trouvé correspondant à vos critères. Essayez d'ajuster vos critères de recherche ou réinitialisez les filtres.
              </p>
              <button className="filter-button secondary" onClick={reinitialiserFiltres}>
                Réinitialiser les Filtres
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ComptesBloques