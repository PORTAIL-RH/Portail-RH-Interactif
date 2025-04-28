import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AjoutCandidature.css";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { API_URL } from "../../../config";

const AjoutCandidature = () => {
  const [formData, setFormData] = useState({
    dateFermeturePostulation: "",
    emplacement: "",
    description: "",
    service: "",
    anneeExperiences: 0,
    exigences: "",
    skills: [{ name: "", percentage: 0 }],
  });

  const [societes, setSocietes] = useState([]);
  const [loadingSocietes, setLoadingSocietes] = useState(true);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("light");
  const [totalPercentage, setTotalPercentage] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail);
    };

    window.addEventListener('sidebarToggled', handleSidebarToggle);
    
    return () => {
      window.removeEventListener('sidebarToggled', handleSidebarToggle);
    };
  }, []);

  // Fetch societes on component mount
  useEffect(() => {
    const fetchSocietes = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/societes`);
        setSocietes(response.data);
      } catch (err) {
        console.error("Error fetching societes:", err);
        toast.error("Erreur lors du chargement des emplacements");
      } finally {
        setLoadingSocietes(false);
      }
    };

    fetchSocietes();
  }, []);

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (theme) => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    applyTheme(newTheme);
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }));
  };

  // Calculate total percentage whenever skills change
  useEffect(() => {
    const total = formData.skills.reduce(
      (sum, skill) => sum + (skill.percentage || 0),
      0
    );
    setTotalPercentage(total);
  }, [formData.skills]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle skill name change
  const handleSkillNameChange = (index, value) => {
    const updatedSkills = [...formData.skills];
    updatedSkills[index].name = value;
    setFormData({
      ...formData,
      skills: updatedSkills,
    });
  };

  // Handle skill percentage change
  const handleSkillPercentageChange = (index, value) => {
    const percentage = Math.min(Math.max(parseInt(value) || 0, 0), 100);
    
    const updatedSkills = [...formData.skills];
    updatedSkills[index].percentage = percentage;
    
    setFormData({
      ...formData,
      skills: updatedSkills,
    });
  };

  // Add a new skill field
  const addSkillField = () => {
    setFormData({
      ...formData,
      skills: [...formData.skills, { name: "", percentage: 0 }],
    });
  };

  // Remove a skill field
  const removeSkillField = (index) => {
    if (formData.skills.length > 1) {
      const updatedSkills = formData.skills.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        skills: updatedSkills,
      });
    } else {
      setFormData({
        ...formData,
        skills: [{ name: "", percentage: 0 }],
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate skills
    const validSkills = formData.skills.filter(skill => skill.name.trim() !== "");
    if (validSkills.length === 0) {
      setError("Veuillez ajouter au moins une compétence.");
      return;
    }

    if (totalPercentage > 100) {
      setError("La somme des pourcentages ne doit pas dépasser 100%");
      return;
    }

    try {
      const payload = {
        ...formData,
        dateAjoutPostulation: new Date().toISOString(),
        skillsWithPercentage: validSkills.reduce((acc, skill) => {
          acc[skill.name] = skill.percentage;
          return acc;
        }, {}),
      };

      const response = await axios.post(`${API_URL}/api/candidatures`, payload);
      if (response.status === 201) {
        toast.success("Candidature ajoutée avec succès !", {
          position: "top-right",
          autoClose: 3000,
        });

        // Reset form
        setFormData({
          dateFermeturePostulation: "",
          emplacement: "",
          description: "",
          service: "",
          anneeExperiences: 0,
          exigences: "",
          skills: [{ name: "", percentage: 0 }],
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Erreur lors de l'ajout de la candidature. Veuillez réessayer."
      );
      console.error("Error adding candidature:", err);
    }
  };

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className={`ajout-candidature-container ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <div className="ajout-candidature-content">
          <div className="form-header">
            <h2>Ajouter une Candidature</h2>
            <p className="form-subtitle">Créez une nouvelle offre d'emploi</p>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Date de fermeture:</label>
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
                {loadingSocietes ? (
                  <div className="loading-text">Chargement des emplacements...</div>
                ) : (
                  <select
                    name="emplacement"
                    value={formData.emplacement}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Sélectionnez un emplacement</option>
                    {societes.map((societe) => (
                      <option key={societe.societeId} value={societe.emplacement}>
                        {societe.emplacement} - {societe.societeName}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Service:</label>
              <input
                type="text"
                name="service"
                value={formData.service}
                onChange={handleInputChange}
                placeholder="ex: Développement informatique"
                required
              />
            </div>

            <div className="form-group">
              <label>Description:</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Description détaillée du poste..."
                rows="4"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Années d'expérience:</label>
                <input
                  type="number"
                  name="anneeExperiences"
                  value={formData.anneeExperiences}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Exigences:</label>
              <textarea
                name="exigences"
                value={formData.exigences}
                onChange={handleInputChange}
                placeholder="Qualifications et exigences requises..."
                rows="3"
                required
              />
            </div>

            <div className="form-group skills-section">
              <div className="skills-header">
                <label>
                  Compétences et pourcentages
                  <span className={`percentage-total ${totalPercentage > 100 ? "error" : ""}`}>
                    Total: {totalPercentage}%
                    {totalPercentage > 100 && <span className="percentage-error"> - Dépassement!</span>}
                  </span>
                </label>
              </div>
              
              <div className="skills-container">
                {formData.skills.map((skill, index) => (
                  <div key={index} className="skill-input-group">
                    <div className="skill-input-row">
                      <div className="skill-name-input">
                        <input
                          type="text"
                          placeholder="Nom de la compétence"
                          value={skill.name}
                          onChange={(e) => handleSkillNameChange(index, e.target.value)}
                          required
                        />
                      </div>
                      <div className="skill-percentage-input">
                        <input
                          type="number"
                          placeholder="Pourcentage"
                          min="0"
                          max="100"
                          value={skill.percentage}
                          onChange={(e) => handleSkillPercentageChange(index, e.target.value)}
                          required
                        />
                        <span className="percentage-symbol">%</span>
                      </div>
                      <button
                        type="button"
                        className="remove-skill-button"
                        onClick={() => removeSkillField(index)}
                        title="Supprimer cette compétence"
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                    
                    <div className="skill-percentage-bar">
                      <div 
                        className={`skill-percentage-fill ${
                          totalPercentage > 100 ? "error" : ""
                        }`}
                        style={{ width: `${skill.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                className="add-skill-button"
                onClick={addSkillField}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Ajouter une compétence
              </button>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-button"
                disabled={totalPercentage > 100}
              >
                Ajouter la Candidature
              </button>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default AjoutCandidature;