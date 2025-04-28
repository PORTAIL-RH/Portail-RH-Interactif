import { useState, useEffect } from "react"
import "./AjoutPersonnel.css"
import Sidebar from "../Sidebar/Sidebar"
import Navbar from "../Navbar/Navbar"
import { API_URL } from "../../../config"
import { FiUser, FiMail, FiCode, FiPlus, FiChevronDown } from "react-icons/fi"

const PersonnelForm = () => {
  const [email, setEmail] = useState("")
  const [code_soc, setCodeSoc] = useState("")
  const [personnelList, setPersonnelList] = useState([])
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState("light")
  const [societes, setSocietes] = useState([])
  const [showSocieteDropdown, setShowSocieteDropdown] = useState(false)
  const [societeSearchTerm, setSocieteSearchTerm] = useState("")
  const [generatedMatricule, setGeneratedMatricule] = useState("")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail);
    };

    window.addEventListener('sidebarToggled', handleSidebarToggle);
    
    return () => {
      window.removeEventListener('sidebarToggled', handleSidebarToggle);
    };
  }, []);
  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    setTheme(savedTheme)
    applyTheme(savedTheme)
  }, [])

  // Fetch societes on component mount
  useEffect(() => {
    const fetchSocietes = async () => {
      try {
        const response = await fetch(`${API_URL}/api/societes`)
        const data = await response.json()
        if (response.ok) {
          setSocietes(data)
        }
      } catch (error) {
        console.error("Error fetching societes:", error)
      }
    }
    fetchSocietes()

    // Fetch the next available matricule
    const fetchNextMatricule = async () => {
      try {
        const response = await fetch(`${API_URL}/api/Personnel/max-matricule`)
        const data = await response.json()
        if (response.ok && data.maxMatricule) {
          // Generate next matricule
          const nextMatricule = generateNextMatricule(data.maxMatricule)
          setGeneratedMatricule(nextMatricule)
        }
      } catch (error) {
        console.error("Error fetching max matricule:", error)
      }
    }
    fetchNextMatricule()
  }, [])

  // Function to generate next matricule
  const generateNextMatricule = (currentMatricule) => {
    try {
      const lastNumber = Number.parseInt(currentMatricule)
      const nextNumber = lastNumber + 1
      return String(nextNumber).padStart(5, "0")
    } catch (e) {
      console.error("Error generating matricule:", e)
      return "00001"
    }
  }

  const applyTheme = (theme) => {
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(theme)
    localStorage.setItem("theme", theme)
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    applyTheme(newTheme)
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }))
  }

  const filteredSocietes = societes.filter(
    (societe) =>
      societe.societeCodeSoc.toLowerCase().includes(societeSearchTerm.toLowerCase()) ||
      societe.societeName.toLowerCase().includes(societeSearchTerm.toLowerCase()),
  )

  const handleSocieteSelect = (codeSoc) => {
    setCodeSoc(codeSoc)
    setShowSocieteDropdown(false)
    setSocieteSearchTerm("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Clear previous messages
    setErrorMessage("")
    setSuccessMessage("")

    // Validate form
    if (!email || !code_soc) {
      setErrorMessage("Veuillez remplir tous les champs.")
      return
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage("Veuillez entrer une adresse email valide.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/Personnel/addWithMatriculeAndEmail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code_soc }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Une erreur est survenue.")
      }

      // Update the personnel list with the new personnel including the generated matricule
      if (data.personnel) {
        setPersonnelList([...personnelList, data.personnel])
        setSuccessMessage(data.message || "Personnel ajouté avec succès.")

        // Update the generated matricule for the next personnel
        if (data.personnel.matricule) {
          setGeneratedMatricule(generateNextMatricule(data.personnel.matricule))
        }
      }

      // Reset form
      setEmail("")
      setCodeSoc("")
    } catch (error) {
      setErrorMessage(error.message || "Une erreur est survenue lors de l'ajout du personnel.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className={`ajout-container ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <div className="ajout-content">
          <div className="personnel-form-container">
            <h2>Ajouter un Personnel</h2>

            {errorMessage && <div className="error-message">{errorMessage}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}

            <form onSubmit={handleSubmit} className="personnel-form">
              <div className="form-group">
                <label htmlFor="codeSoc">
                  <FiCode className="form-icon" /> Code société
                </label>
                <div className="dropdown-container">
                  <input
                    type="text"
                    id="codeSoc"
                    value={code_soc}
                    onChange={(e) => {
                      setCodeSoc(e.target.value)
                      setSocieteSearchTerm(e.target.value)
                    }}
                    onFocus={() => setShowSocieteDropdown(true)}
                    placeholder="Sélectionnez ou entrez le code société"
                  />
                  <FiChevronDown
                    className="dropdown-icon"
                    onClick={() => setShowSocieteDropdown(!showSocieteDropdown)}
                  />
                  {showSocieteDropdown && (
                    <div className="form-dropdown-menu">
                      <div className="dropdown-search">
                        <input
                          type="text"
                          placeholder="Rechercher une société..."
                          value={societeSearchTerm}
                          onChange={(e) => setSocieteSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="dropdown-scroll">
                        {filteredSocietes.length > 0 ? (
                          filteredSocietes.map((societe) => (
                            <div
                              key={societe.societeId}
                              className={`form-dropdown-item ${code_soc === societe.societeCodeSoc ? "selected" : ""}`}
                              onClick={() => handleSocieteSelect(societe.societeCodeSoc)}
                            >
                              <span className="societe-code">{societe.societeCodeSoc}</span>
                              <span className="societe-name">{societe.societeName}</span>
                            </div>
                          ))
                        ) : (
                          <div className="dropdown-no-results">Aucune société trouvée</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="matricule">
                  <FiUser className="form-icon" /> Matricule(générer automatiquement)
                </label>
                <input
                  type="text"
                  id="matricule"
                  value={generatedMatricule}
                  readOnly
                  disabled
                  className="disabled-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  <FiMail className="form-icon" /> Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Entrez l'adresse email"
                  required
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span> Ajout en cours...
                  </>
                ) : (
                  <>
                    <FiPlus /> Ajouter Personnel
                  </>
                )}
              </button>
            </form>

            <div className="personnel-list">
              <h3>Liste du Personnel</h3>
              {personnelList.length > 0 ? (
                <ul>
                  {personnelList.map((personnel, index) => (
                    <li key={index}>
                      <strong>Matricule:</strong> {personnel.matricule}, <strong>Email:</strong> {personnel.email},{" "}
                      <strong>Code Soc:</strong> {personnel.code_soc}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="personnel-list-empty">
                  <p>Aucun personnel n'a été ajouté pour le moment.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PersonnelForm
