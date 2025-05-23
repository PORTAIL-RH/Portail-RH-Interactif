import { useState, useEffect } from "react"
import { FiFile, FiCalendar, FiBookOpen, FiList, FiTag, FiUpload } from "react-icons/fi"
import RequestNavBar from "./RequestNavBar"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./ajout-dem.css"
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
    file: null,
  })

  const [errors, setErrors] = useState({})
  const [titres, setTitres] = useState([])
  const [types, setTypes] = useState({})
  const [themes, setThemes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [file, setFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [theme, setTheme] = useState("light")

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    setTheme(savedTheme)
    document.documentElement.classList.add(savedTheme)
    document.body.className = savedTheme

    const verifyAuth = () => {
      const token = localStorage.getItem("authToken")
      const userId = localStorage.getItem("userId")

      if (!token || !userId) {
        toast.error("Veuillez vous connecter pour accéder à cette page")
        setTimeout(() => (window.location.href = "/login"), 2000)
        return false
      }
      return true
    }

    if (verifyAuth()) {
      fetchTitres()

      const userId = localStorage.getItem("userId")
      const userCodeSoc = localStorage.getItem("userCodeSoc")

      if (userId && userCodeSoc) {
        setFormData((prev) => ({
          ...prev,
          codeSoc: userCodeSoc,
          matPers: userId,
        }))
      }
    }
  }, [])

  const fetchTitres = async () => {
    setLoading(true)
    setError(null)

    try {
      const authToken = localStorage.getItem("authToken")
      if (!authToken) {
        throw new Error("Token d'authentification manquant")
      }

      const response = await fetch("http://localhost:8080/api/titres/", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear()
          window.location.href = "/login"
          return
        }
        throw new Error("Erreur réseau")
      }

      const data = await response.json()
      const adaptedData = data.map((titre) => ({
        ...titre,
        types:
          titre.types?.map((type) => ({
            ...type,
            nom: type.type,
            themes:
              type.themes?.map((theme) => ({
                ...theme,
                nom: theme.theme,
              })) || [],
          })) || [],
      }))

      setTitres(adaptedData)

      const typesMap = {}
      const themesMap = {}

      adaptedData.forEach((titre) => {
        typesMap[titre.id] = titre.types || []
        titre.types?.forEach((type) => {
          themesMap[type.id] = type.themes || []
        })
      })

      setTypes(typesMap)
      setThemes(themesMap[formData.type] || [])
    } catch (err) {
      setError("Erreur lors du chargement des données")
      toast.error("Erreur lors du chargement des données")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    setErrors({ ...errors, [name]: "" })
  }

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.nbrJours) newErrors.nbrJours = "Nombre de Jours est requis"
    if (!formData.dateDebut) newErrors.dateDebut = "Date Début est requise"
    if (!formData.texteDemande) newErrors.texteDemande = "Texte Demande est requis"
    if (!formData.titre) newErrors.titre = "Titre est requis"
    if (!formData.type) newErrors.type = "Type est requis"
    if (!formData.theme) newErrors.theme = "Thème est requis"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs dans le formulaire.")
      return
    }

    const userId = localStorage.getItem("userId")
    const authToken = localStorage.getItem("authToken")
    const userCodeSoc = localStorage.getItem("userCodeSoc")

    if (!authToken) {
      toast.error("Session expirée. Veuillez vous reconnecter.")
      localStorage.clear()
      window.location.href = "/login"
      return
    }

    if (!userId) {
      toast.error("ID utilisateur manquant. Veuillez vous reconnecter.")
      localStorage.clear()
      window.location.href = "/login"
      return
    }

    setIsSubmitting(true)

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
          Authorization: `Bearer ${authToken}`,
        },
        body: formDataToSend,
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear()
          window.location.href = "/login"
          return
        }

        const errorText = await response.text()
        throw new Error(errorText || "Erreur inconnue du serveur")
      }

      toast.success("Demande de formation soumise avec succès !")

      // Reset form
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
        file: null,
      })
      setFile(null)
      setError(null)
    } catch (error) {
      console.error("Erreur lors de la soumission du formulaire:", error)
      toast.error(`Erreur lors de la soumission: ${error.message}`)
      setError(error.message)
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
            <h1>Demande de Formation</h1>
            <p className="subtitle">Remplissez le formulaire pour soumettre une demande de formation</p>
          </div>

          <RequestNavBar activeRequest="formation" onNavigate={handleNavigate} />

          <div className="form-card">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Chargement des données...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && <div className="error-message">{error}</div>}

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
                    <label htmlFor="nbrJours">
                      <FiCalendar className="form-icon" />
                      Nombre de jours
                    </label>
                    <input
                      type="number"
                      id="nbrJours"
                      name="nbrJours"
                      value={formData.nbrJours}
                      onChange={handleChange}
                      min="1"
                      className={errors.nbrJours ? "error" : ""}
                    />
                    {errors.nbrJours && <span className="error-text">{errors.nbrJours}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="titre">
                      <FiBookOpen className="form-icon" />
                      Titre de la formation
                    </label>
                    <select
                      id="titre"
                      name="titre"
                      value={formData.titre}
                      onChange={handleChange}
                      className={errors.titre ? "error" : ""}
                    >
                      <option value="">Sélectionnez un titre</option>
                      {titres.map((titre) => (
                        <option key={titre.id} value={titre.id}>
                          {titre.titre}
                        </option>
                      ))}
                    </select>
                    {errors.titre && <span className="error-text">{errors.titre}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="type">
                      <FiList className="form-icon" />
                      Type de formation
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleTypeChange}
                      className={errors.type ? "error" : ""}
                      disabled={!formData.titre}
                    >
                      <option value="">Sélectionnez un type</option>
                      {types[formData.titre]?.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.type}
                        </option>
                      ))}
                    </select>
                    {errors.type && <span className="error-text">{errors.type}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="theme">
                      <FiTag className="form-icon" />
                      Thème de formation
                    </label>
                    <select
                      id="theme"
                      name="theme"
                      value={formData.theme}
                      onChange={handleChange}
                      className={errors.theme ? "error" : ""}
                      disabled={!formData.type}
                    >
                      <option value="">Sélectionnez un thème</option>
                      {Array.isArray(themes) &&
                        themes.map((theme) => (
                          <option key={theme.id} value={theme.id}>
                            {theme.nom}
                          </option>
                        ))}
                    </select>
                    {errors.theme && <span className="error-text">{errors.theme}</span>}
                  </div>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="texteDemande">
                    <FiFile className="form-icon" />
                    Description de la demande
                  </label>
                  <textarea
                    id="texteDemande"
                    name="texteDemande"
                    value={formData.texteDemande}
                    onChange={handleChange}
                    rows="4"
                    className={errors.texteDemande ? "error" : ""}
                    placeholder="Décrivez votre demande de formation..."
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

export default FormationForm
