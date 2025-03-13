import { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AjoutService.css";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
const AjoutService = () => {
  // État pour stocker les données du formulaire
  const [formData, setFormData] = useState({
    serviceName: "",
    chefHierarchiqueMatricule: "", // Matricule du chef hiérarchique
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [theme, setTheme] = useState("light");

  // Gérer les changements dans les champs du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Envoyer les données du formulaire à l'API backend
      const response = await axios.post("http://localhost:8080/api/services/create", formData);
      if (response.status === 200 || response.status === 201) {
        // Afficher un message de succès
        toast.success("Service ajouté avec succès !", {
          position: "top-right",
          autoClose: 3000, // Fermer après 3 secondes
        });

        // Réinitialiser le formulaire
        setFormData({
          serviceName: "",
          chefHierarchiqueMatricule: "",
        });
      }
    } catch (err) {
      // Afficher un message d'erreur en cas d'échec
      setError("Erreur lors de l'ajout du service. Veuillez réessayer.");
      console.error("Erreur lors de l'ajout du service :", err);
    }
  };
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);
  // Fonction pour basculer entre les thèmes
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
  };
  return (
    <div className={`app-container ${theme}`}>
      <Sidebar />
      <div className="Service-container">
        <Navbar />
    <div className="ajout-service-container">
      <h2>Ajouter un Service</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nom du Service :</label>
          <input
            type="text"
            name="serviceName"
            value={formData.serviceName}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Matricule du Chef Hiérarchique :</label>
          <input
            type="text"
            name="chefHierarchiqueMatricule"
            value={formData.chefHierarchiqueMatricule}
            onChange={handleInputChange}
            required
          />
        </div>
        <button type="submit" className="submit-button">
          Ajouter le Service
        </button>
      </form>
      {/* Conteneur pour les notifications toast */}
      <ToastContainer />
    </div>
    </div>
    </div>

  );
};

export default AjoutService;