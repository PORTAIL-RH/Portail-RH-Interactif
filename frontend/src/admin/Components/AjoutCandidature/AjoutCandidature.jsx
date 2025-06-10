"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./AjoutCandidature.css"
import Sidebar from "../Sidebar/Sidebar"
import Navbar from "../Navbar/Navbar"
import { API_URL } from "../../../config"
import {
  FiCalendar,
  FiMapPin,
  FiFileText,
  FiServer,
  FiClock,
  FiCheckSquare,
  FiPlus,
  FiX,
  FiTarget,
} from "react-icons/fi"

const AjoutCandidature = () => {
  const [formData, setFormData] = useState({
    dateFermeturePostulation: "",
    emplacement: "",
    description: "",
    service: "",
    anneeExperiences: 0,
    exigences: "",
    skills: [{ name: "", percentage: 0 }],
  })

  const [societes, setSocietes] = useState([])
  const [services, setServices] = useState([])
  const [loadingSocietes, setLoadingSocietes] = useState(true)
  const [loadingServices, setLoadingServices] = useState(true)
  const [error, setError] = useState("")
  const [theme, setTheme] = useState("light")
  const [totalPercentage, setTotalPercentage] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail)
    }

    window.addEventListener("sidebarToggled", handleSidebarToggle)

    return () => {
      window.removeEventListener("sidebarToggled", handleSidebarToggle)
    }
  }, [])

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch societes
        const societesResponse = await axios.get(`${API_URL}/api/societes`)
        setSocietes(societesResponse.data)

        // Fetch services
        const servicesResponse = await axios.get(`${API_URL}/api/services/all`)
        setServices(servicesResponse.data)
      } catch (err) {
        console.error("Error fetching data:", err)
        toast.error("Erreur lors du chargement des données")
      } finally {
        setLoadingSocietes(false)
        setLoadingServices(false)
      }
    }

    fetchData()
  }, [])

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    setTheme(savedTheme)
    applyTheme(savedTheme)
  }, [])

  const applyTheme = (theme) => {
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(theme)
    localStorage.setItem("theme", theme)
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    applyTheme(newTheme)
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }))
  }

  // Calculate total percentage whenever skills change
  useEffect(() => {
    const total = formData.skills.reduce((sum, skill) => sum + (skill.percentage || 0), 0)
    setTotalPercentage(total)
  }, [formData.skills])

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Handle skill name change
  const handleSkillNameChange = (index, value) => {
    const updatedSkills = [...formData.skills]
    updatedSkills[index].name = value
    setFormData({
      ...formData,
      skills: updatedSkills,
    })
  }

  // Handle skill percentage change
  const handleSkillPercentageChange = (index, value) => {
    const percentage = Math.min(Math.max(Number.parseInt(value) || 0, 0), 100)

    const updatedSkills = [...formData.skills]
    updatedSkills[index].percentage = percentage

    setFormData({
      ...formData,
      skills: updatedSkills,
    })
  }

  // Add a new skill field
  const addSkillField = () => {
    setFormData({
      ...formData,
      skills: [...formData.skills, { name: "", percentage: 0 }],
    })
  }

  // Remove a skill field
  const removeSkillField = (index) => {
    if (formData.skills.length > 1) {
      const updatedSkills = formData.skills.filter((_, i) => i !== index)
      setFormData({
        ...formData,
        skills: updatedSkills,
      })
    } else {
      setFormData({
        ...formData,
        skills: [{ name: "", percentage: 0 }],
      })
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Validate skills
    const validSkills = formData.skills.filter((skill) => skill.name.trim() !== "")
    if (validSkills.length === 0) {
      setError("Veuillez ajouter au moins une compétence.")
      setLoading(false)
      return
    }

    if (totalPercentage > 100) {
      setError("La somme des pourcentages ne doit pas dépasser 100%")
      setLoading(false)
      return
    }

    try {
      const payload = {
        ...formData,
        dateAjoutPostulation: new Date().toISOString(),
        skillsWithPercentage: validSkills.reduce((acc, skill) => {
          acc[skill.name] = skill.percentage
          return acc
        }, {}),
      }

      const response = await axios.post(`${API_URL}/api/candidatures`, payload)
      if (response.status === 201) {
        toast.success("Candidature ajoutée avec succès !", {
          position: "top-right",
          autoClose: 3000,
        })

        // Reset form
        setFormData({
          dateFermeturePostulation: "",
          emplacement: "",
          description: "",
          service: "",
          anneeExperiences: 0,
          exigences: "",
          skills: [{ name: "", percentage: 0 }],
        })
      }
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'ajout de la candidature. Veuillez réessayer.")
      console.error("Error adding candidature:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className={`ajout-candidature-container ${sidebarCollapsed ? "collapsed" : ""}`}>
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <div className="ajout-candidature-content">
          <div className="candidature-form-container">
            <h2>Ajouter une Offre</h2>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="candidature-form">
              <div className="form-group">
                <label htmlFor="dateFermeturePostulation">
                  <FiCalendar className="form-icon" /> Date de fermeture
                </label>
                <input
                  type="date"
                  id="dateFermeturePostulation"
                  name="dateFermeturePostulation"
                  value={formData.dateFermeturePostulation}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="emplacement">
                  <FiMapPin className="form-icon" /> Emplacement
                </label>
                {loadingSocietes ? (
                  <div className="loading-text">Chargement des emplacements...</div>
                ) : (
                  <select
                    id="emplacement"
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

              <div className="form-group">
                <label htmlFor="service">
                  <FiServer className="form-icon" /> Service
                </label>
                {loadingServices ? (
                  <div className="loading-text">Chargement des services...</div>
                ) : (
                  <select id="service" name="service" value={formData.service} onChange={handleInputChange} required>
                    <option value="">Sélectionnez un service</option>
                    {services.map((service) => (
                      <option key={service._id} value={service.serviceName}>
                        {service.serviceName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="description">
                  <FiFileText className="form-icon" /> Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Description détaillée du poste..."
                  rows="4"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="anneeExperiences">
                  <FiClock className="form-icon" /> Années d'expérience
                </label>
                <input
                  type="number"
                  id="anneeExperiences"
                  name="anneeExperiences"
                  value={formData.anneeExperiences}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="exigences">
                  <FiCheckSquare className="form-icon" /> Exigences
                </label>
                <textarea
                  id="exigences"
                  name="exigences"
                  value={formData.exigences}
                  onChange={handleInputChange}
                  placeholder="Qualifications et exigences requises..."
                  rows="3"
                  required
                />
              </div>

              <div className="form-group skills-section">
                <label>
                  <FiTarget className="form-icon" /> Compétences et pourcentages
                  <span className={`percentage-total ${totalPercentage > 100 ? "error" : ""}`}>
                    Total: {totalPercentage}%
                    {totalPercentage > 100 && <span className="percentage-error"> - Dépassement!</span>}
                  </span>
                </label>

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
                          <FiX />
                        </button>
                      </div>

                      <div className="skill-percentage-bar">
                        <div
                          className={`skill-percentage-fill ${totalPercentage > 100 ? "error" : ""}`}
                          style={{ width: `${skill.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                <button type="button" className="add-skill-button" onClick={addSkillField}>
                  <FiPlus />
                  Ajouter une compétence
                </button>
              </div>

              <button type="submit" className="submit-btn" disabled={totalPercentage > 100 || loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span> Ajout en cours...
                  </>
                ) : (
                  <>
                    <FiPlus /> Ajouter l'offre
                  </>
                )}
              </button>
            </form>
          </div>

          
        </div>
      </div>
      <ToastContainer />
    </div>
  )
}

export default AjoutCandidature
