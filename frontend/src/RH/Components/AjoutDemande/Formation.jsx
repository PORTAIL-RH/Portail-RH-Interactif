
import { useState, useEffect } from "react"
import { FiCalendar, FiClock, FiFileText, FiUpload, FiSend, FiBookOpen, FiLayers, FiTag } from "react-icons/fi"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./Formation.css"
import { useNavigate } from "react-router-dom"
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar"; 
const FormationForm = () => {
  const [formData, setFormData] = useState({
    nbrJours: "",
    dateDebut: "",
    typeDemande: "formation",
    texteDemande: "",
    titre: "",
    type: "",
    theme: "",
    annee_f: new Date().getFullYear().toString(),
    codeSoc: "",
    matPers: "",
  })

  const [errors, setErrors] = useState({})
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Data for dropdowns
  const [titres, setTitres] = useState([])
  const [types, setTypes] = useState({})
  const [themes, setThemes] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingError, setLoadingError] = useState(null)
  const [activeTab, setActiveTab] = useState("AjoutDemandeAutorisation")
  const navigate = useNavigate()

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
  useEffect(() => {
    fetchTitres()
    
    const userId = localStorage.getItem("userId")
    const userCodeSoc = localStorage.getItem("userCodeSoc")

    if (userId && userCodeSoc) {
      setFormData((prevData) => ({
        ...prevData,
        codeSoc: userCodeSoc,
        matPers: userId,
      }))
    }
  }, [])

  const fetchTitres = async () => {
    setLoading(true)
    setLoadingError(null)

    try {
      const response = await fetch("http://localhost:8080/api/titres/")
      if (!response.ok) {
        throw new Error("Erreur réseau")
      }
      const data = await response.json()

      const adaptedData = data.map((titre) => ({
        ...titre,
        types: titre.types?.map((type) => ({
          ...type,
          nom: type.type,
          themes: type.themes?.map((theme) => ({
            ...theme,
            nom: theme.theme,
          })) || [],
        })) || [],
      }))

      setTitres(adaptedData)

      const typesMap = {}
      adaptedData.forEach((titre) => {
        typesMap[titre.id] = titre.types || []
      })

      setTypes(typesMap)
    } catch (err) {
      setLoadingError("Erreur lors du chargement des données")
      toast.error("Erreur lors du chargement des données")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    
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

  const handleTypeChange = (e) => {
    const selectedType = e.target.value
    setFormData({ ...formData, type: selectedType, theme: "" })

    if (formData.titre && types[formData.titre]) {
      const typeObject = types[formData.titre].find((type) => type.id === selectedType)
      if (typeObject) {
        setThemes(typeObject.themes || [])
      } else {
        setThemes([])
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nbrJours) {
      newErrors.nbrJours = "Le nombre de jours est requis"
    } else if (formData.nbrJours <= 0) {
      newErrors.nbrJours = "Le nombre de jours doit être supérieur à 0"
    }

    if (!formData.dateDebut) {
      newErrors.dateDebut = "La date de début est requise"
    }

    if (!formData.titre) {
      newErrors.titre = "Le titre de la formation est requis"
    }

    if (!formData.type) {
      newErrors.type = "Le type de formation est requis"
    }

    if (!formData.theme) {
      newErrors.theme = "Le thème de formation est requis"
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
    const userCodeSoc = localStorage.getItem("userCodeSoc")

    if (!authToken || !userId || !userCodeSoc) {
      toast.error("Token ou ID utilisateur manquant")
      setIsSubmitting(false)
      return
    }

    const formDataToSend = new FormData()
    formDataToSend.append("nbrJours", formData.nbrJours)
    formDataToSend.append("dateDebut", formData.dateDebut)
    formDataToSend.append("typeDemande", "formation")
    formDataToSend.append("texteDemande", formData.texteDemande)
    formDataToSend.append("titre", formData.titre)
    formDataToSend.append("type", formData.type)
    formDataToSend.append("theme", formData.theme)
    formDataToSend.append("annee_f", formData.annee_f)
    formDataToSend.append("codeSoc", userCodeSoc)
    formDataToSend.append("matPersId", userId)

    if (file) {
      formDataToSend.append("file", file)
    }

    try {
      const response = await fetch("http://localhost:8080/api/demande-formation/create", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`,
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
        nbrJours: "",
        dateDebut: "",
        typeDemande: "formation",
        texteDemande: "",
        titre: "",
        type: "",
        theme: "",
        annee_f: new Date().getFullYear().toString(),
        codeSoc: userCodeSoc,
        matPers: userId,
      })
      setFile(null)
      setFileName("")
      
      toast.success("Demande de formation soumise avec succès !")
    } catch (error) {
      console.error("Erreur lors de la soumission du formulaire :", error)
      toast.error("Erreur lors de la soumission du formulaire : " + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="app-container">
    <Sidebar />
    <div className="demande-container">
      <Navbar />
        <div className="formation-form-container">
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
              <h2>Demande de Formation</h2>
              <p className="form-subtitle">Remplissez le formulaire pour soumettre une demande de formation professionnelle</p>
            </div>

            {loading && (
              <div className="loading-overlay">
                <div className="spinner"></div>
                <p>Chargement des données...</p>
              </div>
            )}

            {loadingError && (
              <div className="error-message-global">
                <FiFileText className="error-icon" />
                <p>{loadingError}</p>
                <button onClick={fetchTitres} className="retry-button">Réessayer</button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="formation-form">
              <div className="form-section">
                <h3 className="section-title">
                  <FiCalendar className="section-icon" />
                  <span>Période de Formation</span>
                </h3>
                
                <div className="form-row two-columns">
                  <div className="form-group">
                    <label htmlFor="dateDebut">Date de Début</label>
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

                  <div className="form-group">
                    <label htmlFor="nbrJours">Nombre de Jours</label>
                    <div className="input-wrapper">
                      <FiClock className="input-icon" />
                      <input
                        type="number"
                        id="nbrJours"
                        name="nbrJours"
                        min="1"
                        value={formData.nbrJours}
                        onChange={handleChange}
                        className={errors.nbrJours ? "error" : ""}
                      />
                    </div>
                    {errors.nbrJours && <div className="error-message">{errors.nbrJours}</div>}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">
                  <FiBookOpen className="section-icon" />
                  <span>Détails de la Formation</span>
                </h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="titre">Titre de la Formation</label>
                    <div className="select-wrapper">
                      <select
                        id="titre"
                        name="titre"
                        value={formData.titre}
                        onChange={handleChange}
                        className={errors.titre ? "error" : ""}
                        disabled={loading || titres.length === 0}
                      >
                        <option value="">Sélectionnez un titre</option>
                        {titres.map(titre => (
                          <option key={titre.id} value={titre.id}>
                            {titre.titre}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.titre && <div className="error-message">{errors.titre}</div>}
                  </div>
                </div>

                <div className="form-row two-columns">
                  <div className="form-group">
                    <label htmlFor="type">Type de Formation</label>
                    <div className="select-wrapper">
                      <FiLayers className="input-icon" />
                      <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleTypeChange}
                        className={errors.type ? "error" : ""}
                        disabled={!formData.titre || loading}
                      >
                        <option value="">Sélectionnez un type</option>
                        {types[formData.titre]?.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.type && <div className="error-message">{errors.type}</div>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="theme">Thème de Formation</label>
                    <div className="select-wrapper">
                      <FiTag className="input-icon" />
                      <select
                        id="theme"
                        name="theme"
                        value={formData.theme}
                        onChange={handleChange}
                        className={errors.theme ? "error" : ""}
                        disabled={!formData.type || loading}
                      >
                        <option value="">Sélectionnez un thème</option>
                        {Array.isArray(themes) && themes.map((theme) => (
                          <option key={theme.id} value={theme.id}>
                            {theme.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.theme && <div className="error-message">{errors.theme}</div>}
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
                    placeholder="Veuillez expliquer le motif de votre demande de formation..."
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
                <button type="submit" className="submit-button" disabled={isSubmitting || loading}>
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
          </div>          </div>
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

export default FormationForm
