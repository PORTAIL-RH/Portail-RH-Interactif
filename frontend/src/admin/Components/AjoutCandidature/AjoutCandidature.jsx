import React, { useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AjoutCandidature.css";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";

const AjoutCandidature = () => {
  const [formData, setFormData] = useState({
    dateAjoutPostulation: "",
    dateFermeturePostulation: "",
    Emplacement: "",
    description: "",
    service: "",
    anneeExperiences: 0,
    exigences: "",
    skills: [],
  });

  const [error, setError] = useState("");

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle skills input (comma-separated)
  const handleSkillsChange = (e) => {
    const skillsArray = e.target.value.split(",").map((skill) => skill.trim());
    setFormData({
      ...formData,
      skills: skillsArray,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Ensure the dateAjoutPostulation is set to the current date
      const updatedFormData = {
        ...formData,
        dateAjoutPostulation: new Date().toISOString().split("T")[0], // Format as YYYY-MM-DD
      };

      const response = await axios.post("http://localhost:8080/api/candidatures", updatedFormData);
      if (response.status === 201) {
        // Show success toast
        toast.success("Candidature ajoutée avec succès !", {
          position: "top-right",
          autoClose: 30000, // Close after 3 seconds
        });

        // Clear form data
        setFormData({
          dateAjoutPostulation: "",
          dateFermeturePostulation: "",
          Emplacement: "",
          description: "",
          service: "",
          anneeExperiences: 0,
          exigences: "",
          skills: [],
        });
      }
    } catch (err) {
      setError("Erreur lors de l'ajout de la candidature. Veuillez réessayer.");
      console.error("Error adding candidature:", err);
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="candidature-admin-container">
        <Navbar />
        <div className="ajout-candidature-container">
          <h2>Ajouter une Candidature</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Date d'ajout de la postulation:</label>
              <input
                type="date"
                name="dateAjoutPostulation"
                value={formData.dateAjoutPostulation}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Date de fermeture de la postulation:</label>
              <input
                type="date"
                name="dateFermeturePostulation"
                value={formData.dateFermeturePostulation}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Emplacement:</label>
              <input
                type="text"
                name="Emplacement"
                value={formData.Emplacement}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Service:</label>
              <input
                type="text"
                name="service"
                value={formData.service}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Années d'expérience:</label>
              <input
                type="number"
                name="anneeExperiences"
                value={formData.anneeExperiences}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Exigences:</label>
              <textarea
                name="exigences"
                value={formData.exigences}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Compétences (séparées par des virgules):</label>
              <input
                type="text"
                name="skills"
                value={formData.skills.join(", ")}
                onChange={handleSkillsChange}
                required
              />
            </div>
            <button type="submit" className="submit-button">
              Ajouter la Candidature
            </button>
          </form>
        </div>
      </div>
      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default AjoutCandidature;