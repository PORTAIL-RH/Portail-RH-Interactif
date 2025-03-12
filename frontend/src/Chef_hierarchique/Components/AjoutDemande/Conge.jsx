
import { useState, useEffect } from "react"
import { FiCalendar, FiClock, FiFileText, FiUpload, FiSend, FiArrowRight } from "react-icons/fi"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useNavigate } from "react-router-dom"
import "./Conge.css"
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar"; 
const CongeForm = () => {
  const [formData, setFormData] = useState({
    dateDebut: '',
    dateFin: '',
    nbrJours: 0,
    matPersId: '',
    codeSoc: '',
    texteDemande: '',
    snjTempDep: '',
    snjTempRetour: '',
    dateReprisePrev: '',
    typeDemande: 'conge',
  })
  const [activeTab, setActiveTab] = useState("")
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState("")
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    const userCodeSoc = localStorage.getItem('userCodeSoc')

    if (userId && userCodeSoc) {
      setFormData((prevData) => ({
        ...prevData,
        matPersId: userId,
        codeSoc: userCodeSoc,
      }))
    }
  }, [])

  useEffect(() => {
    if (formData.dateDebut && formData.dateFin) {
      const startDate = new Date(formData.dateDebut)
      const endDate = new Date(formData.dateFin)

      if (endDate < startDate) {
        setErrors({
          ...errors,
          dateFin: 'La date de fin ne peut pas être antérieure à la date de début'
        })
        return
      } else {
        // Clear the error if it was previously set
        if (errors.dateFin) {
          setErrors({
            ...errors,
            dateFin: ''
          })
        }
      }

      const timeDiff = endDate - startDate
      const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1 // Include both start and end days
      setFormData((prevData) => ({
        ...prevData,
        nbrJours: dayDiff,
        dateReprisePrev: new Date(endDate.getTime() + 86400000).toISOString().split('T')[0] // Next day after end date
      }))
    }
  }, [formData.dateDebut, formData.dateFin, errors])

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
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.dateDebut) {
      newErrors.dateDebut = "La date de début est requise"
    }

    if (!formData.dateFin) {
      newErrors.dateFin = "La date de fin est requise"
    } else if (new Date(formData.dateFin) < new Date(formData.dateDebut)) {
      newErrors.dateFin = "La date de fin ne peut pas être antérieure à la date de début"
    }

    if (!formData.snjTempDep) {
      newErrors.snjTempDep = "L'horaire de sortie est requis"
    }

    if (!formData.snjTempRetour) {
      newErrors.snjTempRetour = "L'horaire de retour est requis"
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
    formDataToSend.append('dateDebut', formData.dateDebut)
    formDataToSend.append('dateFin', formData.dateFin)
    formDataToSend.append('texteDemande', formData.texteDemande)
    formDataToSend.append('snjTempDep', formData.snjTempDep)
    formDataToSend.append('snjTempRetour', formData.snjTempRetour)
    formDataToSend.append('dateReprisePrev', formData.dateReprisePrev)
    formDataToSend.append('codeSoc', formData.codeSoc)
    formDataToSend.append('matPersId', userId)
    formDataToSend.append('nbrJours', formData.nbrJours.toString())
    formDataToSend.append('typeDemande', formData.typeDemande)

    if (file) {
      formDataToSend.append('file', file)
    }

    try {
      const response = await fetch('http://localhost:8080/api/demande-conge/create', {
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
        dateDebut: '',
        dateFin: '',
        nbrJours: 0,
        matPersId: userId,
        codeSoc: formData.codeSoc,
        texteDemande: '',
        snjTempDep: '',
        snjTempRetour: '',
        dateReprisePrev: '',
        typeDemande: 'conge',
      })
      setFile(null)
      setFileName("")
      
      toast.success('Demande de congé soumise avec succès !')
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
        navigate("/AjoutDemandeFormation");
        break;
      case "conge":
        navigate("/AjoutDemandeConge");
        break;
      case "document":
        navigate("/AjoutDemandeDocument");
        break;
      case "preAvance":
        navigate("/AjoutDemandePreAvance");
        break;
      case "autorisation":
        navigate("/AjoutDemandeAutorisation");
        break;
      default:
        navigate("/AjoutDemandeAutorisation");
    }
  }
  return (
    <div className="app-container">
      <Sidebar />
      <div className="demande-container">
        <Navbar />
        <div className="conge-form-container">
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
              <h2>Demande de Congé</h2>
              <p className="form-subtitle">Remplissez le formulaire pour soumettre une demande de congé</p>
            </div>

            <form onSubmit={handleSubmit} className="conge-form">
              <div className="form-section">
                <h3 className="section-title">
                  <FiCalendar className="section-icon" />
                  <span>Période du Congé</span>
                </h3>
                
                <div className="form-row two-columns">
                  <div className="form-group">
                    <label htmlFor="dateDebut">Date de Début</label>
                    <input
                      type="date"
                      id="dateDebut"
                      name="dateDebut"
                      value={formData.dateDebut}
                      onChange={handleChange}
                      className={errors.dateDebut ? "error" : ""}
                    />
                    {errors.dateDebut && <div className="error-message">{errors.dateDebut}</div>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="dateFin">Date de Fin</label>
                    <input
                      type="date"
                      id="dateFin"
                      name="dateFin"
                      value={formData.dateFin}
                      onChange={handleChange}
                      className={errors.dateFin ? "error" : ""}
                    />
                    {errors.dateFin && <div className="error-message">{errors.dateFin}</div>}
                  </div>
                </div>

                <div className="form-row two-columns">
                  <div className="form-group">
                    <label htmlFor="nbrJours">Nombre de Jours</label>
                    <input
                      type="number"
                      id="nbrJours"
                      name="nbrJours"
                      value={formData.nbrJours}
                      readOnly
                      className="readonly-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="dateReprisePrev">Date de Reprise Prévue</label>
                    <input
                      type="date"
                      id="dateReprisePrev"
                      name="dateReprisePrev"
                      value={formData.dateReprisePrev}
                      readOnly
                      className="readonly-input"
                    />
                  </div>
                </div>

                <div className="form-row two-columns">
                  <div className="form-group">
                    <label htmlFor="snjTempDep">Horaire de Sortie</label>
                    <select
                      id="snjTempDep"
                      name="snjTempDep"
                      value={formData.snjTempDep}
                      onChange={handleChange}
                      className={errors.snjTempDep ? "error" : ""}
                    >
                      <option value="">Choisissez un horaire</option>
                      <option value="Matin">Matin</option>
                      <option value="Soir">Soir</option>
                    </select>
                    {errors.snjTempDep && <div className="error-message">{errors.snjTempDep}</div>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="snjTempRetour">Horaire de Retour</label>
                    <select
                      id="snjTempRetour"
                      name="snjTempRetour"
                      value={formData.snjTempRetour}
                      onChange={handleChange}
                      className={errors.snjTempRetour ? "error" : ""}
                    >
                      <option value="">Choisissez un horaire</option>
                      <option value="Matin">Matin</option>
                      <option value="Soir">Soir</option>
                    </select>
                    {errors.snjTempRetour && <div className="error-message">{errors.snjTempRetour}</div>}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">
                  <FiFileText className="section-icon" />
                  <span>Détails de la Demande</span>
                </h3>
                
                <div className="form-group">
                  <label htmlFor="texteDemande">Motif du Congé</label>
                  <textarea
                    id="texteDemande"
                    name="texteDemande"
                    value={formData.texteDemande}
                    onChange={handleChange}
                    placeholder="Veuillez expliquer le motif de votre demande de congé..."
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

export default CongeForm
