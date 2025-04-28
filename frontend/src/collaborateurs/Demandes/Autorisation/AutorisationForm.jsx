import { useState, useEffect } from "react"
import { FiCalendar, FiClock, FiFileText, FiUpload } from "react-icons/fi"
import Navbar from '../../Components/Navbar/Navbar';
import Sidebar from '../../Components/Sidebar/Sidebar';
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "../common-form.css"

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
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.dateDebut) newErrors.dateDebut = "La date est requise"
    if (!formData.heureSortie) newErrors.heureSortie = "L'heure de sortie est requise"
    if (!formData.heureRetour) newErrors.heureRetour = "L'heure de retour est requise"
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
      const response = await fetch("http://localhost:8080/api/demande-autorisation/create", {
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

      toast.success("Demande d'autorisation soumise avec succès !")

      // Reset form
      setFormData({
        dateDebut: "",
        heureSortie: "",
        heureRetour: "",
        codeSoc: formData.codeSoc,
        texteDemande: "",
        cod_autorisation: "",
        matPersId: userId,
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
            <h1>Demande d'Autorisation</h1>
            <p className="subtitle">Remplissez le formulaire pour soumettre une demande d'autorisation</p>
          </div>

          <div className="form-card">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="dateDebut">
                    <FiCalendar className="form-icon" />
                    Date
                  </label>
                  <input
                    type="date"
                    id="dateDebut"
                    name="dateDebut"
                    value={formData.dateDebut}
                    onChange={handleChange}
                    className={errors.dateDebut ? "error" : ""}
                  />
                  {errors.dateDebut && <span className="error-text">{errors.dateDebut}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="heureSortie">
                    <FiClock className="form-icon" />
                    Heure de Sortie
                  </label>
                  <input
                    type="time"
                    id="heureSortie"
                    name="heureSortie"
                    value={formData.heureSortie}
                    onChange={handleChange}
                    className={errors.heureSortie ? "error" : ""}
                  />
                  {errors.heureSortie && <span className="error-text">{errors.heureSortie}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="heureRetour">
                    <FiClock className="form-icon" />
                    Heure de Retour
                  </label>
                  <input
                    type="time"
                    id="heureRetour"
                    name="heureRetour"
                    value={formData.heureRetour}
                    onChange={handleChange}
                    className={errors.heureRetour ? "error" : ""}
                  />
                  {errors.heureRetour && <span className="error-text">{errors.heureRetour}</span>}
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="texteDemande">
                  <FiFileText className="form-icon" />
                  Texte de la Demande
                </label>
                <textarea
                  id="texteDemande"
                  name="texteDemande"
                  value={formData.texteDemande}
                  onChange={handleChange}
                  rows="4"
                  className={errors.texteDemande ? "error" : ""}
                  placeholder="Décrivez votre demande d'autorisation..."
                ></textarea>
                {errors.texteDemande && <span className="error-text">{errors.texteDemande}</span>}
              </div>

              <div className="form-group full-width">
                <label htmlFor="file">
                  <FiUpload className="form-icon" />
                  Fichier Joint (optionnel)
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

export default AutorisationForm

