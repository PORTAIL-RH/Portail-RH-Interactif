import { useState, useEffect } from "react"
import { FiDollarSign, FiFileText, FiList, FiUpload } from "react-icons/fi"
import RequestNavBar from "./RequestNavBar"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./ajout-dem.css"
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { API_URL } from "../../../config"

const AvanceForm = () => {
  const [formData, setFormData] = useState({
    type: "",
    montant: 0,
    codeSoc: "",
    texteDemande: "",
    matPersId: "",
    file: null,
  })

  const [file, setFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [typesPreAvance, setTypesPreAvance] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState("light")

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    setTheme(savedTheme)
    document.documentElement.classList.add(savedTheme)
    document.body.className = savedTheme

    fetchTypesPreAvance()

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

  const fetchTypesPreAvance = async () => {
    try {
      setLoading(true)
      const authToken = localStorage.getItem("authToken")
      if (!authToken) {
        toast.error("Token d'authentification manquant")
        return
      }

      const response = await fetch(`${API_URL}/api/demande-pre-avance/types`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des types de pré-avances")
      }

      const data = await response.json()
      setTypesPreAvance(data)
    } catch (error) {
      console.error("Erreur lors de la récupération des types de pré-avances :", error)
      toast.error("Erreur lors de la récupération des types de pré-avances")
    } finally {
      setLoading(false)
    }
  }

  const validateMontant = (type, montant) => {
    if (typesPreAvance[type] && montant > typesPreAvance[type]) {
      return `Le montant ne doit pas dépasser ${typesPreAvance[type]} euros pour ce type de demande.`
    }
    return null
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

    if (name === "montant" && formData.type) {
      const errorMessage = validateMontant(formData.type, value)
      if (errorMessage) {
        setErrors((prev) => ({
          ...prev,
          montant: errorMessage,
        }))
      }
    }
  }

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.type) newErrors.type = "Le type de demande est requis"
    if (!formData.montant) newErrors.montant = "Le montant est requis"
    if (formData.montant <= 0) newErrors.montant = "Le montant doit être supérieur à 0"

    const montantError = validateMontant(formData.type, formData.montant)
    if (montantError) newErrors.montant = montantError

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
    formDataToSend.append("type", formData.type)
    formDataToSend.append("montant", formData.montant.toString())
    formDataToSend.append("texteDemande", formData.texteDemande)
    formDataToSend.append("codeSoc", formData.codeSoc)
    formDataToSend.append("matPersId", userId)

    if (file) {
      formDataToSend.append("file", file)
    }

    try {
      const response = await fetch(`${API_URL}/api/demande-pre-avance/create`, {
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

      toast.success("Demande de pré-avance soumise avec succès !")

      // Reset form
      setFormData({
        type: "",
        montant: 0,
        codeSoc: formData.codeSoc,
        texteDemande: "",
        matPersId: userId,
        file: null,
      })
      setFile(null)
    } catch (error) {
      console.error("Erreur lors de la soumission du formulaire:", error)
      toast.error(`Erreur lors de la soumission du formulaire: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNavigate = (path) => {
    window.location.href = path
  }
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.add(savedTheme);
    document.body.className = savedTheme;

    const handleStorageChange = () => {
      const currentTheme = localStorage.getItem("theme") || "light";
      setTheme(currentTheme);
      document.documentElement.className = currentTheme;
      document.body.className = currentTheme;
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("themeChanged", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("themeChanged", handleStorageChange);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.className = newTheme;
    document.body.className = newTheme;
    localStorage.setItem("theme", newTheme);
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }));
  };
  return (
    <div className={`app-container ${theme}`}>
        <Sidebar theme={theme} />
      <div className="demande-container">
        <Navbar theme={theme} toggleTheme={toggleTheme}/>
        <div className="demande-content">
          <div className="page-header">
            <h1>Demande de Pré-Avance</h1>
            <p className="subtitle">Remplissez le formulaire pour soumettre une demande de pré-avance</p>
            <p className="subtitle">
              <strong>NB:</strong> Si vous voulez avoir un montant élevé, vous devez contacter votre direction de département directement
            </p>
          </div>

          <RequestNavBar activeRequest="avance" onNavigate={handleNavigate} />

          <div className="form-card">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Chargement des données...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="type">
                      <FiList className="form-icon" />
                      Type de Demande
                    </label>
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
                    {errors.type && <span className="error-text">{errors.type}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="montant">
                      <FiDollarSign className="form-icon" />
                      Montant {formData.type ? `(Max: ${typesPreAvance[formData.type]} €)` : ""}
                    </label>
                    <input
                      type="number"
                      id="montant"
                      name="montant"
                      value={formData.montant}
                      onChange={handleChange}
                      min="1"
                      className={errors.montant ? "error" : ""}
                    />
                    {errors.montant && <span className="error-text">{errors.montant}</span>}
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
                    placeholder="Décrivez votre demande de pré-avance..."
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

export default AvanceForm
