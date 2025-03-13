import { useState, useEffect } from "react"
import { FiCalendar, FiClock, FiFileText, FiUpload } from "react-icons/fi"
import './CongeForm.css';
import Navbar from '../../Components/Navbar/Navbar';
import Sidebar from '../../Components/Sidebar/Sidebar';
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "../common-form.css"

const CongeForm = () => {
  const [formData, setFormData] = useState({
    dateDebut: "",
    dateFin: "",
    nbrJours: 0,
    matPersId: "",
    codeSoc: "",
    texteDemande: "",
    snjTempDep: "",
    snjTempRetour: "",
    dateReprisePrev: "",
    typeDemande: "conge",
  })

  const [file, setFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Get user data from localStorage
    const userId = localStorage.getItem("userId")
    const userCodeSoc = localStorage.getItem("userCodeSoc")

    if (userId && userCodeSoc) {
      setFormData((prev) => ({
        ...prev,
        matPersId: userId,
        codeSoc: userCodeSoc,
      }))
    }
  }, [])

  // Calculate number of days when dates change
  useEffect(() => {
    if (formData.dateDebut && formData.dateFin) {
      const startDate = new Date(formData.dateDebut)
      const endDate = new Date(formData.dateFin)

      if (endDate < startDate) {
        setErrors((prev) => ({
          ...prev,
          dateFin: "La date de fin ne peut pas être antérieure à la date de début",
        }))
        return
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.dateFin
          return newErrors
        })
      }

      const timeDiff = endDate - startDate
      const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1 // +1 to include both start and end days
      setFormData((prev) => ({
        ...prev,
        nbrJours: dayDiff,
        dateReprisePrev: new Date(endDate.getTime() + 86400000).toISOString().split("T")[0], // Next day after end date
      }))
    }
  }, [formData.dateDebut, formData.dateFin])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

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

    if (!formData.dateDebut) newErrors.dateDebut = "La date de début est requise"
    if (!formData.dateFin) newErrors.dateFin = "La date de fin est requise"
    if (!formData.snjTempDep) newErrors.snjTempDep = "Veuillez sélectionner l'horaire de sortie"
    if (!formData.snjTempRetour) newErrors.snjTempRetour = "Veuillez sélectionner l'horaire de retour"
    if (!formData.texteDemande) newErrors.texteDemande = "La description est requise"

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
    formDataToSend.append("dateFin", formData.dateFin)
    formDataToSend.append("texteDemande", formData.texteDemande)
    formDataToSend.append("snjTempDep", formData.snjTempDep)
    formDataToSend.append("snjTempRetour", formData.snjTempRetour)
    formDataToSend.append("dateReprisePrev", formData.dateReprisePrev)
    formDataToSend.append("codeSoc", formData.codeSoc)
    formDataToSend.append("matPersId", userId)
    formDataToSend.append("nbrJours", formData.nbrJours.toString())
    formDataToSend.append("typeDemande", formData.typeDemande)

    if (file) {
      formDataToSend.append("file", file)
    }

    try {
      const response = await fetch("http://localhost:8080/api/demande-conge/create", {
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

      toast.success("Demande de congé soumise avec succès !")

      // Reset form
      setFormData({
        dateDebut: "",
        dateFin: "",
        nbrJours: 0,
        matPersId: userId,
        codeSoc: formData.codeSoc,
        texteDemande: "",
        snjTempDep: "",
        snjTempRetour: "",
        dateReprisePrev: "",
        typeDemande: "conge",
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
    <div className="dashboard-container">
      <Navbar />
      <div className="main-content">
        <Sidebar />
        <div className="content-area">
          <div className="page-header">
            <h1>Demande de Congé</h1>
            <p className="subtitle">Remplissez le formulaire pour soumettre une demande de congé</p>
          </div>

          <div className="form-card">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Chargement...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="dateDebut">
                      <FiCalendar className="form-icon" />
                      Date de début
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
                    <label htmlFor="dateFin">
                      <FiCalendar className="form-icon" />
                      Date de fin
                    </label>
                    <input
                      type="date"
                      id="dateFin"
                      name="dateFin"
                      value={formData.dateFin}
                      onChange={handleChange}
                      className={errors.dateFin ? "error" : ""}
                    />
                    {errors.dateFin && <span className="error-text">{errors.dateFin}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="nbrJours">
                      <FiCalendar className="form-icon" />
                      Nombre de jours
                    </label>
                    <input
                      type="number"
                      id="nbrJours"
                      name="nbrJours"
                      value={formData.nbrJours}
                      readOnly
                      className="readonly"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="snjTempDep">
                      <FiClock className="form-icon" />
                      Horaire de sortie
                    </label>
                    <select
                      id="snjTempDep"
                      name="snjTempDep"
                      value={formData.snjTempDep}
                      onChange={handleChange}
                      className={errors.snjTempDep ? "error" : ""}
                    >
                      <option value="">Sélectionnez un horaire</option>
                      <option value="Matin">Matin</option>
                      <option value="Soir">Soir</option>
                    </select>
                    {errors.snjTempDep && <span className="error-text">{errors.snjTempDep}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="snjTempRetour">
                      <FiClock className="form-icon" />
                      Horaire de retour
                    </label>
                    <select
                      id="snjTempRetour"
                      name="snjTempRetour"
                      value={formData.snjTempRetour}
                      onChange={handleChange}
                      className={errors.snjTempRetour ? "error" : ""}
                    >
                      <option value="">Sélectionnez un horaire</option>
                      <option value="Matin">Matin</option>
                      <option value="Soir">Soir</option>
                    </select>
                    {errors.snjTempRetour && <span className="error-text">{errors.snjTempRetour}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="dateReprisePrev">
                      <FiCalendar className="form-icon" />
                      Date de reprise prévue
                    </label>
                    <input
                      type="date"
                      id="dateReprisePrev"
                      name="dateReprisePrev"
                      value={formData.dateReprisePrev}
                      onChange={handleChange}
                      readOnly
                      className="readonly"
                    />
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
                    placeholder="Décrivez votre demande de congé..."
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
            )}
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  )
}

export default CongeForm

