import { useState, useEffect } from "react"
import { FiFileText, FiList, FiUpload } from "react-icons/fi"
import RequestNavBar from "./RequestNavBar"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./ajout-dem.css"
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";

const DocumentForm = () => {
  const [formData, setFormData] = useState({
    typeDemande: "Document",
    texteDemande: "",
    codeSoc: "",
    typeDocument: "",
    matPers: { id: "" },
  })

  const [errors, setErrors] = useState({})
  const [file, setFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [theme, setTheme] = useState("light")

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    setTheme(savedTheme)
    document.documentElement.classList.add(savedTheme)
    document.body.className = savedTheme

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
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      toast.error("La taille du fichier ne doit pas dépasser 5 Mo.")
      return
    }
    setFile(selectedFile)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

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
  e.preventDefault();

  if (!validateForm()) {
    toast.error("Veuillez corriger les erreurs dans le formulaire");
    return;
  }

  setIsSubmitting(true);

  const authToken = localStorage.getItem("authToken");
  const userId = localStorage.getItem("userId");

  // Enhanced validation
  if (!authToken) {
    toast.error("Session expirée. Veuillez vous reconnecter.");
    setIsSubmitting(false);
    return;
  }

  if (!userId) {
    toast.error("ID utilisateur manquant. Veuillez vous reconnecter.");
    setIsSubmitting(false);
    return;
  }

  console.log("Current user ID from localStorage:", userId); // Debug

  const formDataToSend = new FormData();
  formDataToSend.append("typeDemande", formData.typeDemande);
  formDataToSend.append("texteDemande", formData.texteDemande);
  formDataToSend.append("codeSoc", formData.codeSoc);
  formDataToSend.append("typeDocument", formData.typeDocument);
  formDataToSend.append("matPersId", userId); // Use directly from localStorage

  if (file) {
    formDataToSend.append("file", file);
  }

  // Debug: Log FormData contents
  for (const [key, value] of formDataToSend.entries()) {
    console.log(key, value);
  }

  try {
    const response = await fetch("http://localhost:8080/api/demande-document/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        // Don't set Content-Type for FormData - let browser set it with boundary
      },
      body: formDataToSend,
    });

    console.log("Response status:", response.status); // Debug

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Server error details:", errorData); // Debug
      
      if (response.status === 404 && errorData.error === "Personnel not found") {
        throw new Error("Votre compte utilisateur n'a pas été trouvé. Veuillez contacter l'administrateur.");
      }
      throw new Error(errorData.message || "Erreur lors de la soumission");
    }

    const result = await response.json();
    console.log("Success response:", result); // Debug
    
    toast.success("Demande de document soumise avec succès !");
    
    // Reset form
    setFormData(prev => ({
      ...prev,
      texteDemande: "",
      typeDocument: "",
    }));
    setFile(null);

  } catch (error) {
    console.error("Submission error:", error);
    toast.error(error.message || "Une erreur est survenue lors de la soumission");
  } finally {
    setIsSubmitting(false);
  }
};

  const handleNavigate = (path) => {
    window.location.href = path
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    document.documentElement.className = newTheme
    document.body.className = newTheme
    localStorage.setItem("theme", newTheme)
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }))
  }

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className="demande-container">
        <Navbar theme={theme} toggleTheme={toggleTheme}/>
        <div className="demande-content">
          <div className="page-header">
            <h1>Demande de Document</h1>
            <p className="subtitle">Remplissez le formulaire pour soumettre une demande de document</p>
          </div>

          <RequestNavBar activeRequest="document" onNavigate={handleNavigate} />

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
                    required
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
                  required
                ></textarea>
                {errors.texteDemande && <span className="error-text">{errors.texteDemande}</span>}
              </div>

              <div className="form-group full-width">
                <label htmlFor="file">
                  <FiUpload className="form-icon" />
                  Pièce jointe (optionnel)
                </label>
                <div className="file-input-container">
                  <input 
                    type="file" 
                    id="file" 
                    name="file" 
                    onChange={handleFileChange} 
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <div className="file-input-text">
                    {file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)` : "Choisir un fichier"}
                  </div>
                </div>
                <small className="file-hint">Formats acceptés: PDF, DOC, DOCX, JPG, JPEG, PNG (max 5MB)</small>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => window.history.back()}>
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="submit-button" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner"></span>
                      Soumission en cours...
                    </>
                  ) : "Soumettre la demande"}
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
        theme={theme}
      />
    </div>
  )
}

export default DocumentForm