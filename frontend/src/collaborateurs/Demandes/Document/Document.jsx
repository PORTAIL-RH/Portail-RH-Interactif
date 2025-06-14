import { useState, useEffect } from "react"
import { FiFileText, FiList, FiUpload } from "react-icons/fi"
import Navbar from '../../Components/Navbar/Navbar';
import Sidebar from '../../Components/Sidebar/Sidebar';
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "../common-form.css"
import { API_URL } from "../../../config"

const DocumentForm = () => {
  const [formData, setFormData] = useState({
    typeDemande: "Document",
    texteDemande: "",
    codeSoc: "",
    file: null,
    typeDocument: "",
    matPers: { id: "" },
  })

  const [errors, setErrors] = useState({})
  const [file, setFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const userId = localStorage.getItem("userId")
    const userCodeSoc = localStorage.getItem("userCodeSoc")

    if (userId && userCodeSoc) {
      setFormData((prevData) => ({
        ...prevData,
        codeSoc: userCodeSoc,
        matPers: { id: userId },
      }))
    }
  }, [])

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.typeDocument) newErrors.typeDocument = "Le type de document est requis"
    if (!formData.texteDemande) newErrors.texteDemande = "Le texte de la demande est requis"

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

    const authToken = localStorage.getItem("authToken")
    const userId = localStorage.getItem("userId")

    if (!authToken || !userId) {
      toast.error("Token ou ID utilisateur manquant")
      setIsSubmitting(false)
      return
    }

    const formDataToSend = new FormData()
    formDataToSend.append("typeDemande", formData.typeDemande)
    formDataToSend.append("texteDemande", formData.texteDemande)
    formDataToSend.append("codeSoc", formData.codeSoc)
    formDataToSend.append("typeDocument", formData.typeDocument)
    formDataToSend.append("matPersId", formData.matPers.id)

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La taille du fichier ne doit pas dépasser 5 Mo.")
        setIsSubmitting(false)
        return
      }
      formDataToSend.append("file", file)
    }

    try {
      const response = await fetch(`${API_URL}/api/demande-document/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formDataToSend,
      })

      if (!response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const errorResult = await response.json()
          throw new Error(errorResult.message || "Erreur inconnue")
        } else {
          const errorText = await response.text()
          throw new Error(errorText || "Erreur inconnue")
        }
      }

      toast.success("Demande de document soumise avec succès !")

      // Reset form
      setFormData({
        typeDemande: "Document",
        texteDemande: "",
        codeSoc: formData.codeSoc,
        file: null,
        typeDocument: "",
        matPers: { id: formData.matPers.id },
      })
      setFile(null)
    } catch (error) {
      console.error("Erreur lors de la soumission du formulaire:", error)
      toast.error(`Erreur lors de la soumission du formulaire: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="demande-container">
        <Navbar />
        <div className="demande-content">
          <div className="page-header">
            <h1>Demande de Document</h1>
            <p className="subtitle">Remplissez le formulaire pour soumettre une demande de document</p>
          </div>

          <div className="form-card">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="typeDocument">
                    <FiList className="form-icon" />
                    Type de Document
                  </label>
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
                    <option value="Documents de formation et de développement professionnel">
                      Documents de formation et de développement professionnel
                    </option>
                    <option value="Documents liés à la sécurité sociale">Documents liés à la sécurité sociale</option>
                    <option value="Documents liés à la santé et à la sécurité">
                      Documents liés à la santé et à la sécurité
                    </option>
                    <option value="Documents de fin de contrat">Documents de fin de contrat</option>
                  </select>
                  {errors.typeDocument && <span className="error-text">{errors.typeDocument}</span>}
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="texteDemande">
                  <FiFileText className="form-icon" />
                  Description de la demande
                </label>
                <textarea
                  id="texteDemande"
                  name="texteDemande"
                  value={formData.texteDemande}
                  onChange={handleChange}
                  rows="4"
                  className={errors.texteDemande ? "error" : ""}
                  placeholder="Décrivez votre demande de document..."
                ></textarea>
                {errors.texteDemande && <span className="error-text">{errors.texteDemande}</span>}
              </div>

              <div className="form-group full-width">
                <label htmlFor="file">
                  <FiUpload className="form-icon" />
                  Pièce jointe (optionnel)
                </label>
                <div className="file-input-container">
                  <input type="file" id="file" name="file" onChange={handleFileChange} />
                  <div className="file-input-text">{file ? file.name : "Choisir un fichier"}</div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => window.history.back()}>
                  Annuler
                </button>
                <button type="submit" className="submit-button" disabled={isSubmitting}>
                  {isSubmitting ? "Soumission en cours..." : "Soumettre la demande"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  )
}

export default DocumentForm

