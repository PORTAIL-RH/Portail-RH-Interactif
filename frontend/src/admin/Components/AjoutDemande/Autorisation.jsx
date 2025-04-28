
import { useState, useEffect } from "react"
import { FiCalendar, FiClock, FiFileText, FiUpload, FiSend } from "react-icons/fi"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./ajoutDemande.css"
import { useNavigate } from "react-router-dom"
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar"; 
import { API_URL } from "../../../config"; 

const AutorisationForm = () => {
  const [formData, setFormData] = useState({
    dateDebut: "",
    heureSortie: "",
    heureRetour: "",
    codeSoc: "",
    texteDemande: "",
    cod_autorisation: "",
    matPersId: "",
  })

  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState("")
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("AjoutDemandeAutorisation")
  const navigate = useNavigate()
  const [theme, setTheme] = useState("light")
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
  useEffect(() => {
    const userId = localStorage.getItem("userId")
    const userCodeSoc = localStorage.getItem("userCodeSoc")

    if (userId && userCodeSoc) {
      setFormData((prevData) => ({
        ...prevData,
        codeSoc: userCodeSoc,
        matPersId: userId,
      }))
    }
  }, [])

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    switch (tab) {
      case "formation":
        navigate("/AjoutDemandeFormationADMIN");
        break;
      case "conge":
        navigate("/AjoutDemandeCongeADMIN");
        break;
      case "document":
        navigate("/AjoutDemandeDocumentADMIN");
        break;
      case "preAvance":
        navigate("/AjoutDemandePreAvanceADMIN");
        break;
      case "autorisation":
        navigate("/AjoutDemandeAutorisationADMIN");
        break;
      default:
        navigate("/AjoutDemandeAutorisationADMIN");
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      })
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setFileName(selectedFile.name)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.dateDebut) {
      newErrors.dateDebut = "La date est requise"
    }

    if (!formData.heureSortie) {
      newErrors.heureSortie = "L'heure de sortie est requise"
    }

    if (!formData.heureRetour) {
      newErrors.heureRetour = "L'heure de retour est requise"
    }

    if (!formData.texteDemande) {
      newErrors.texteDemande = "Le texte de la demande est requis"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs dans le formulaire")
      return
    }

    setIsSubmitting(true)

    const userId = localStorage.getItem("userId")
    const authToken = localStorage.getItem("authToken")

    if (!authToken || !userId) {
      toast.error("Token ou ID utilisateur manquant")
      setIsSubmitting(false)
      return
    }

    const formDataToSend = new FormData()
    formDataToSend.append("dateDebut", formData.dateDebut)
    formDataToSend.append("heureSortie", formData.heureSortie)
    formDataToSend.append("heureRetour", formData.heureRetour)
    formDataToSend.append("codeSoc", formData.codeSoc)
    formDataToSend.append("texteDemande", formData.texteDemande)
    formDataToSend.append("codAutorisation", formData.cod_autorisation)
    formDataToSend.append("matPersId", userId)

    if (file) {
      formDataToSend.append("file", file)
    }

    try {
      const response = await fetch(`${API_URL}/api/demande-autorisation/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formDataToSend,
      })

      const contentType = response.headers.get("content-type")

      if (!response.ok) {
        if (contentType && contentType.includes("application/json")) {
          const errorResult = await response.json()
          toast.error("Erreur lors de la soumission du formulaire : " + (errorResult.message || "Erreur inconnue"))
        } else {
          const errorText = await response.text()
          toast.error("Erreur lors de la soumission du formulaire : " + errorText)
        }
        setIsSubmitting(false)
        return
      }

      // Reset form on success
      setFormData({
        dateDebut: "",
        heureSortie: "",
        heureRetour: "",
        codeSoc: formData.codeSoc,
        texteDemande: "",
        cod_autorisation: "",
        matPersId: formData.matPersId,
      })
      setFile(null)
      setFileName("")

      toast.success("Demande d'autorisation soumise avec succès !")
    } catch (error) {
      console.error("Erreur lors de la soumission du formulaire :", error)
      toast.error("Erreur lors de la soumission du formulaire : " + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className={`demande-container ${sidebarCollapsed ? 'collapsed' : ''}`}>
    <Navbar theme={theme} toggleTheme={toggleTheme} />
    <div className="autorisation-form-container">
      {/* Navigation Bar */}
      <div className="request-nav-bar">
        <div
          className={`request-nav-item ${activeTab === "formation" ? "active" : ""}`}
          onClick={() => handleTabClick("formation")}
        >
          Formation
        </div>
        <div
          className={`request-nav-item ${activeTab === "conge" ? "active" : ""}`}
          onClick={() => handleTabClick("conge")}
        >
          Congé
        </div>
        <div
          className={`request-nav-item ${activeTab === "document" ? "active" : ""}`}
          onClick={() => handleTabClick("document")}
        >
          Document
        </div>
        <div
          className={`request-nav-item ${activeTab === "preAvance" ? "active" : ""}`}
          onClick={() => handleTabClick("preAvance")}
        >
          PréAvance
        </div>
        <div
          className={`request-nav-item ${activeTab === "autorisation" ? "active" : ""}`}
          onClick={() => handleTabClick("autorisation")}
        >
          Autorisation
        </div>
      </div>

      <div className="form-card">
        <div className="form-header">
          <h2>Demande d'Autorisation</h2>
          <p className="form-subtitle">Remplissez le formulaire pour soumettre une demande d'autorisation de sortie</p>
        </div>

        <form onSubmit={handleSubmit} className="autorisation-form">
          <div className="form-section">
            <h3 className="section-title">
              <FiCalendar className="section-icon" />
              <span>Date et Heures</span>
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dateDebut">Date</label>
                <div className="input-wrapper">
                  <input
                    type="date"
                    id="dateDebut"
                    name="dateDebut"
                    value={formData.dateDebut}
                    onChange={handleChange}
                    className={errors.dateDebut ? "error" : ""}
                  />
                </div>
                {errors.dateDebut && <div className="error-message">{errors.dateDebut}</div>}
              </div>
            </div>

            <div className="form-row two-columns">
              <div className="form-group">
                <label htmlFor="heureSortie">Heure de Sortie</label>
                <div className="input-wrapper">
                  <FiClock className="input-icon" />
                  <input
                    type="time"
                    id="heureSortie"
                    name="heureSortie"
                    value={formData.heureSortie}
                    onChange={handleChange}
                    className={errors.heureSortie ? "error" : ""}
                  />
                </div>
                {errors.heureSortie && <div className="error-message">{errors.heureSortie}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="heureRetour">Heure de Retour</label>
                <div className="input-wrapper">
                  <FiClock className="input-icon" />
                  <input
                    type="time"
                    id="heureRetour"
                    name="heureRetour"
                    value={formData.heureRetour}
                    onChange={handleChange}
                    className={errors.heureRetour ? "error" : ""}
                  />
                </div>
                {errors.heureRetour && <div className="error-message">{errors.heureRetour}</div>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">
              <FiFileText className="section-icon" />
              <span>Détails de la Demande</span>
            </h3>

            <div className="form-group">
              <label htmlFor="texteDemande">Motif de la Demande</label>
              <textarea
                id="texteDemande"
                name="texteDemande"
                value={formData.texteDemande}
                onChange={handleChange}
                placeholder="Veuillez expliquer le motif de votre demande d'autorisation..."
                rows="4"
                className={errors.texteDemande ? "error" : ""}
              ></textarea>
              {errors.texteDemande && <div className="error-message">{errors.texteDemande}</div>}
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">
              <FiUpload className="section-icon" />
              <span>Document Justificatif</span>
            </h3>

            <div className="form-group">
              <label htmlFor="file">Pièce Jointe (optionnel)</label>
              <div className="file-upload-container">
                <input type="file" id="file" name="file" onChange={handleFileChange} className="file-input" />
                <div className="file-upload-box">
                  <FiUpload className="upload-icon" />
                  <span className="upload-text">
                    {fileName ? fileName : "Glissez un fichier ou cliquez pour parcourir"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <FiSend />
                  <span>Soumettre la Demande</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  )
}

export default AutorisationForm