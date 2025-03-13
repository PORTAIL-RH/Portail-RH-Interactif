"use client"

import { useState, useEffect } from "react"
import { FiFileText, FiUpload, FiSend, FiList } from "react-icons/fi"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useNavigate } from "react-router-dom"
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar"; 
import "./Document.css"

const DocumentForm = () => {
  const [formData, setFormData] = useState({
    typeDemande: 'Document',
    texteDemande: '',
    codeSoc: '',
    typeDocument: '',
    matPers: { id: '' },
  })
  const [activeTab, setActiveTab] = useState("AjoutDemandeAutorisation")
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
        codeSoc: userCodeSoc,
        matPers: { id: userId },
      }))
    }
  }, [])

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('La taille du fichier ne doit pas dépasser 5 Mo.')
        return
      }
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

    if (!formData.typeDocument) {
      newErrors.typeDocument = "Le type de document est requis"
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
    formDataToSend.append('typeDemande', formData.typeDemande)
    formDataToSend.append('texteDemande', formData.texteDemande)
    formDataToSend.append('codeSoc', formData.codeSoc)
    formDataToSend.append('typeDocument', formData.typeDocument)
    formDataToSend.append('matPersId', userId)

    if (file) {
      formDataToSend.append('file', file)
    }

    try {
      const response = await fetch('http://localhost:8080/api/demande-document/create', {
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
        typeDemande: 'Document',
        texteDemande: '',
        codeSoc: formData.codeSoc,
        typeDocument: '',
        matPers: { id: userId },
      })
      setFile(null)
      setFileName("")
      
      toast.success('Demande de document soumise avec succès !')
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

  return (
    <div className="app-container">
      <Sidebar />
      <div className="demande-container">
        <Navbar />
        <div className="document-form-container">
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
              <h2>Demande de Document</h2>
              <p className="form-subtitle">Remplissez le formulaire pour soumettre une demande de document</p>
            </div>

            <form onSubmit={handleSubmit} className="document-form">
              <div className="form-section">
                <h3 className="section-title">
                  <FiList className="section-icon" />
                  <span>Type de Document</span>
                </h3>
                
                <div className="form-group">
                  <label htmlFor="typeDocument">Sélectionnez le type de document</label>
                  <select
                    id="typeDocument"
                    name="typeDocument"
                    value={formData.typeDocument}
                    onChange={handleChange}
                    className={errors.typeDocument ? "error" : ""}
                  >
                    <option value="">Sélectionnez un type</option>
                    <option value="Documents administratifs et légaux">Documents administratifs et légaux</option>
                    <option value="Documents fiscaux">Documents fiscaux</option>
                    <option value="Documents sociaux">Documents sociaux</option>
                    <option value="Documents de formation et de développement professionnel">Documents de formation et de développement professionnel</option>
                    <option value="Documents liés à la sécurité sociale">Documents liés à la sécurité sociale</option>
                    <option value="Documents liés à la santé et à la sécurité">Documents liés à la santé et à la sécurité</option>
                    <option value="Documents de fin de contrat">Documents de fin de contrat</option>
                  </select>
                  {errors.typeDocument && <div className="error-message">{errors.typeDocument}</div>}
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
                    placeholder="Veuillez expliquer le motif de votre demande de document..."
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
                  <p className="file-size-note">Taille maximale: 5 Mo</p>
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

export default DocumentForm
