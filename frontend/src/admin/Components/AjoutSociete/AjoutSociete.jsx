import { useState, useEffect } from "react"
import axios from "axios"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./AjoutSociete.css"
import Sidebar from "../Sidebar/Sidebar"
import Navbar from "../Navbar/Navbar"
import { API_URL } from "../../../config"
import {
  FiChevronDown,
  FiCheck,
  FiX,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiList,
  FiServer,
  FiRefreshCw,
  FiInfo,
} from "react-icons/fi"

const AjoutSociete = () => {
  // Form states
  const [formData, setFormData] = useState({
    societeName: "",
    societeCodeSoc: "",
    emplacement: ""
  })

  // societes list states
  const [societes, setSocietes] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchingSocietes, setFetchingSocietes] = useState(false)
  const [theme, setTheme] = useState("light")
  const [activeTab, setActiveTab] = useState("add") // 'add' or 'list'
  const [editingSociete, setEditingSociete] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail)
    }

    window.addEventListener('sidebarToggled', handleSidebarToggle)
    
    return () => {
      window.removeEventListener('sidebarToggled', handleSidebarToggle)
    }
  }, [])

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    setTheme(savedTheme)
    applyTheme(savedTheme)
  }, [])

  // Fetch societes when component mounts or when activeTab changes to 'list'
  useEffect(() => {
    if (activeTab === "list") {
      fetchSocietes()
    }
  }, [activeTab])

  // Fetch societes with loading state and toast notification
  const fetchSocietes = async () => {
    setFetchingSocietes(true)

    try {
      const response = await axios.get(`${API_URL}/api/societes`)
      setSocietes(response.data)
    } catch (error) {
      console.error("Error fetching companies:", error)
      toast.error("Failed to load companies")
    } finally {
      setFetchingSocietes(false)
    }
  }

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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const validateForm = () => {
    if (!formData.societeName.trim()) {
      toast.error("Company name is required")
      return false
    }

    if (!formData.societeCodeSoc.trim()) {
      toast.error("Company code is required")
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      const response = await axios.post(`${API_URL}/api/societes`, formData)

      if (response.status === 200 || response.status === 201) {
        toast.success("Company created successfully!")

        // Reset form
        setFormData({
          societeName: "",
          societeCodeSoc: "",
          emplacement: ""
        })

        // Refresh companies list
        await fetchSocietes()

        // Switch to list tab
        setActiveTab("list")
      }
    } catch (err) {
      console.error("Company creation error:", err)
      const errorMessage = err.response?.data?.message || "Failed to create company"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (societeId) => {
    if (window.confirm("Are you sure you want to delete this company?")) {
      try {
        await axios.delete(`${API_URL}/api/societes/${societeId}`)
        setSocietes(societes.filter((societe) => societe.societeId !== societeId))
        toast.success("Company deleted successfully!")
      } catch (error) {
        console.error("Error deleting company:", error)
        toast.error("Failed to delete company")
      }
    }
  }

  const handleEdit = (societe) => {
    setEditingSociete(societe)
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()

    if (!editingSociete.societeName.trim() || !editingSociete.societeCodeSoc.trim()) {
      toast.error("Company name and code are required")
      return
    }

    try {
      const response = await axios.put(
        `${API_URL}/api/societes/${editingSociete.societeId}`,
        editingSociete
      )

      if (response.status === 200) {
        // Update companies list
        setSocietes(societes.map((societe) => 
          societe.societeId === editingSociete.societeId ? editingSociete : societe
        ))

        toast.success("Company updated successfully!")
        setShowEditModal(false)
      }
    } catch (error) {
      console.error("Error updating company:", error)
      toast.error("Failed to update company")
    }
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditingSociete({
      ...editingSociete,
      [name]: value,
    })
  }

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className={`main-container ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <div className="main-content">
          <div className="societe-container">
            {/* Tab Navigation */}
            <div className="societe-tabs">
              <div className={`tab-indicator ${activeTab === "list" ? "right" : ""}`}></div>
              <button
                className={`societe-tab ${activeTab === "add" ? "active" : ""}`}
                onClick={() => setActiveTab("add")}
              >
                <FiPlus /> Ajouter Une Succursale Société
              </button>
              <button
                className={`societe-tab ${activeTab === "list" ? "active" : ""}`}
                onClick={() => setActiveTab("list")}
              >
                <FiList /> Tout Les Succursales Sociétés
              </button>
            </div>

            {/* Add societe Form */}
            {activeTab === "add" && (
              <div className="ajout-societe-container">
                <h2>Ajouter Une Succursale Société</h2>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Nom:</label>
                    <input
                      type="text"
                      name="societeName"
                      value={formData.societeName}
                      onChange={handleInputChange}
                      required
                      maxLength={100}
                      placeholder="Enter company name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Code:</label>
                    <input
                      type="text"
                      name="societeCodeSoc"
                      value={formData.societeCodeSoc}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter company code"
                    />
                  </div>

                  <div className="form-group">
                    <label>Emplacement:</label>
                    <input
                      type="text"
                      name="emplacement"
                      value={formData.emplacement}
                      onChange={handleInputChange}
                      placeholder="Enter company location"
                    />
                  </div>

                  <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner"></span> Creating...
                      </>
                    ) : (
                      "Create Company"
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Companies List */}
            {activeTab === "list" && (
              <div className="societes-list-container">
                <div className="societes-list-header">
                  <h2>
                    <FiServer /> La Liste Des Succursales Sociétés
                  </h2>
                  <button
                    className="submit-button"
                    style={{ width: "auto", padding: "0.5rem 1rem" }}
                    onClick={fetchSocietes}
                    disabled={fetchingSocietes}
                  >
                    {fetchingSocietes ? (
                      <>
                        <span className="spinner"></span> Refreshing...
                      </>
                    ) : (
                      <>
                        <FiRefreshCw /> Refresh
                      </>
                    )}
                  </button>
                </div>

                {fetchingSocietes ? (
                  <div className="loading-container">
                    <div className="loading-spinner-large"></div>
                    <p className="loading-text">Charger les Succursales...</p>
                  </div>
                ) : societes.length > 0 ? (
                  <div className="societes-table-container">
                    <table className="societes-table">
                      <thead>
                        <tr>
                          <th>Nom</th>
                          <th>Code</th>
                          <th>Emplacement</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {societes.map((societe) => (
                          <tr key={societe.societeId}>
                            <td>{societe.societeName}</td>
                            <td>{societe.societeCodeSoc}</td>
                            <td>{societe.emplacement || "-"}</td>
                            <td className="actions">
                              <button className="edit-button" onClick={() => handleEdit(societe)}>
                                <FiEdit /> Modifier
                              </button>
                              <button className="delete-button" onClick={() => handleDelete(societe.societeId)}>
                                <FiTrash2 /> Supprimer
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <FiInfo className="empty-state-icon" />
                    <h3>Aucun Succursale </h3>
                    <p>
                      Il n'y a encore aucune entreprise dans le système. Créez votre première entreprise en cliquant sur l'onglet « Ajouter une entreprise ».
                    </p>
                  </div>
                )}
              </div>
            )}

{/* Modal de modification d'entreprise */}
{showEditModal && editingSociete && (
  <div className="modal-overlay">
    <div className="modal-container">
      <div className="modal-header">
        <h3 className="modal-title">Modifier l'entreprise</h3>
        <button className="modal-close" onClick={() => setShowEditModal(false)}>
          <FiX />
        </button>
      </div>
      <div className="modal-body">
        <form onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label>Nom de l'entreprise :</label>
            <input
              type="text"
              name="societeName"
              value={editingSociete.societeName}
              onChange={handleEditChange}
              required
              maxLength={100}
            />
          </div>
          <div className="form-group">
            <label>Code de l'entreprise :</label>
            <input
              type="text"
              name="societeCodeSoc"
              value={editingSociete.societeCodeSoc}
              onChange={handleEditChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Emplacement :</label>
            <input
              type="text"
              name="emplacement"
              value={editingSociete.emplacement}
              onChange={handleEditChange}
              placeholder="Entrez l'emplacement de l'entreprise"
            />
          </div>
        </form>
      </div>
      <div className="modal-footer">
        <button className="modal-cancel" onClick={() => setShowEditModal(false)}>
          Annuler
        </button>
        <button className="modal-save" onClick={handleEditSubmit}>
          Enregistrer les modifications
        </button>
      </div>
    </div>
  </div>
)}

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
      </div>

      </div>
    </div>
  )
}

export default AjoutSociete