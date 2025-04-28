
import { useState, useEffect } from "react"
import { FiDollarSign, FiFileText, FiUpload, FiSend, FiInfo } from "react-icons/fi"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./ajoutDemande.css"
import { useNavigate } from "react-router-dom"
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { API_URL } from "../../../config"; 

const PreAvanceForm = () => {
  const [formData, setFormData] = useState({
    type: '',
    montant: 0,
    codeSoc: '',
    texteDemande: '',
    matPersId: '',
  })
  const [activeTab, setActiveTab] = useState()
  const navigate = useNavigate()

  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState("")
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [typesPreAvance, setTypesPreAvance] = useState({})
  const [theme, setTheme] = useState("light")


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
  useEffect(() => {
    const fetchTypesPreAvance = async () => {
      try {
        const authToken = localStorage.getItem('authToken')
        if (!authToken) {
          toast.error('Token d\'authentification manquant')
          return
        }

        const response = await fetch(`${API_URL}/api/demande-pre-avance/types`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        })

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des types de pré-avances')
        }

        const data = await response.json()
        setTypesPreAvance(data)
      } catch (error) {
        console.error('Erreur lors de la récupération des types de pré-avances :', error)
        toast.error('Erreur lors de la récupération des types de pré-avances')
      }
    }

    fetchTypesPreAvance()
  }, [])

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    const userCodeSoc = localStorage.getItem('userCodeSoc')

    if (userId && userCodeSoc) {
      setFormData((prevData) => ({
        ...prevData,
        codeSoc: userCodeSoc,
        matPersId: userId,
      }))
    }
  }, [])

  const validateMontant = (type, montant) => {
    if (!type) {
      return "Veuillez sélectionner un type de pré-avance"
    }
    
    if (!montant || montant <= 0) {
      return "Le montant doit être supérieur à 0"
    }
    
    if (typesPreAvance[type] && parseFloat(montant) > typesPreAvance[type]) {
      return `Le montant ne doit pas dépasser ${typesPreAvance[type]} euros pour ce type de demande`
    }
    
    return null
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setFileName(selectedFile.name)
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
    
    // Validate montant when type or montant changes
    if (name === 'montant' || name === 'type') {
      const montantError = validateMontant(
        name === 'type' ? value : formData.type, 
        name === 'montant' ? value : formData.montant
      )
      
      if (montantError) {
        setErrors({
          ...errors,
          montant: montantError
        })
      } else {
        setErrors({
          ...errors,
          montant: ""
        })
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.type) {
      newErrors.type = "Le type de pré-avance est requis"
    }

    const montantError = validateMontant(formData.type, formData.montant)
    if (montantError) {
      newErrors.montant = montantError
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
      toast.error('Veuillez corriger les erreurs dans le formulaire')
      return
    }

    setIsSubmitting(true)

    const authToken = localStorage.getItem('authToken')
    const userId = localStorage.getItem('userId')
    
    if (!authToken || !userId) {
      toast.error('Token d\'authentification manquant')
      setIsSubmitting(false)
      return
    }

    const formDataToSend = new FormData()
    formDataToSend.append('type', formData.type)
    formDataToSend.append('montant', formData.montant.toString())
    formDataToSend.append('texteDemande', formData.texteDemande)
    formDataToSend.append('codeSoc', formData.codeSoc)
    formDataToSend.append('matPersId', userId)

    if (file) {
      formDataToSend.append('file', file)
    }

    try {
      const response = await fetch(`${API_URL}/api/demande-pre-avance/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formDataToSend,
      })

      const contentType = response.headers.get('content-type')
      
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorResult = await response.json()
          toast.error('Erreur lors de la soumission du formulaire : ' + (errorResult.message || 'Erreur inconnue'))
        } else {
          const errorText = await response.text()
          toast.error('Erreur lors de la soumission du formulaire : ' + errorText)
        }
        setIsSubmitting(false)
        return
      }

      // Reset form on success
      setFormData({
        type: '',
        montant: 0,
        codeSoc: formData.codeSoc,
        texteDemande: '',
        matPersId: formData.matPersId,
      })
      setFile(null)
      setFileName("")
      
      toast.success('Demande de pré-avance soumise avec succès !')
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire :', error)
      toast.error('Erreur lors de la soumission du formulaire : ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    switch (tab) {
      case "formation":
        navigate("/AjoutDemandeFormationRH");
        break;
      case "conge":
        navigate("/AjoutDemandeCongeRH");
        break;
      case "document":
        navigate("/AjoutDemandeDocumentRH");
        break;
      case "preAvance":
        navigate("/AjoutDemandePreAvanceRH");
        break;
      case "autorisation":
        navigate("/AjoutDemandeAutorisationRH");
        break;
      default:
        navigate("/AjoutDemandeAutorisationRH");
    }
  }
  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className="demande-container">
      <Navbar theme={theme} toggleTheme={toggleTheme} />
        <div className="preavance-form-container">
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
          onClick={() => handleTabClick("AjoutDemandeAutorisation")}
        >
          Autorisation
        </div>
      </div>
          <div className="form-card">
            <div className="form-header">
              <h2>Demande de Pré-Avance</h2>
              <p className="form-subtitle">Remplissez le formulaire pour soumettre une demande de pré-avance</p><br/>
              <bold><p className="subtitle">NB: Si tu veux avoir un montant élevé tu doit contacter votre direction de département directement</p></bold>
            </div>

            <form onSubmit={handleSubmit} className="preavance-form">
              <div className="form-section">
                <h3 className="section-title">
                  <FiDollarSign className="section-icon" />
                  <span>Informations de la Pré-Avance</span>
                </h3>
                
                <div className="form-row two-columns">
                  <div className="form-group">
                    <label htmlFor="type">Type de Pré-Avance</label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className={errors.type ? "error" : ""}
                    >
                      <option value="">Sélectionnez un type</option>
                      {Object.keys(typesPreAvance).map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {errors.type && <div className="error-message">{errors.type}</div>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="montant">
                      Montant {formData.type && `(Max: ${typesPreAvance[formData.type]} €)`}
                    </label>
                    <div className="input-wrapper">
                      <input
                        type="number"
                        id="montant"
                        name="montant"
                        value={formData.montant}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className={errors.montant ? "error" : ""}
                      />
                    </div>
                    {errors.montant && <div className="error-message">{errors.montant}</div>}
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
                    placeholder="Veuillez expliquer le motif de votre demande de pré-avance..."
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
                    <input
                      type="file"
                      id="file"
                      name="file"
                      onChange={handleFileChange}
                      className="file-input"
                    />
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

export default PreAvanceForm
