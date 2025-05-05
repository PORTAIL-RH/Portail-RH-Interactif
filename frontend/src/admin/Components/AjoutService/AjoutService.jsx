import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./AjoutService.css"
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

const STORAGE_KEYS = {
  SERVICES_DATA: 'servicesData'
};

const AjoutService = () => {
  const [formData, setFormData] = useState({
    serviceName: "",
    chefMatricule: "",
  })

  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchingServices, setFetchingServices] = useState(false)
  const [chefInfo, setChefInfo] = useState(null)
  const [theme, setTheme] = useState("light")
  const [chefMatricules, setChefMatricules] = useState([])
  const [filteredMatricules, setFilteredMatricules] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("add")
  const [editingService, setEditingService] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  // Helper functions for localStorage
  const saveServicesToLocalStorage = (servicesData) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SERVICES_DATA, JSON.stringify({
        services: servicesData,
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  const loadServicesFromLocalStorage = () => {
    try {
      const cachedData = localStorage.getItem(STORAGE_KEYS.SERVICES_DATA);
      return cachedData ? JSON.parse(cachedData).services : [];
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      return [];
    }
  };

  useEffect(() => {
    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail);
    };

    window.addEventListener('sidebarToggled', handleSidebarToggle);
    return () => window.removeEventListener('sidebarToggled', handleSidebarToggle);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    setTheme(savedTheme)
    document.documentElement.classList.add(savedTheme)
  }, [])

  // Fetch services when component mounts or when activeTab changes to 'list'
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const matriculesResponse = await axios.get(`${API_URL}/api/Personnel/matricules`)
        setChefMatricules(matriculesResponse.data)
        setFilteredMatricules(matriculesResponse.data)

        const cachedServices = loadServicesFromLocalStorage();
        if (cachedServices.length > 0) {
          setServices(cachedServices);
          const lastUpdated = JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES_DATA))?.lastUpdated;
          if (new Date() - new Date(lastUpdated) > 5 * 60 * 1000) {
            await fetchServices();
          }
        } else {
          await fetchServices();
        }
      } catch (error) {
        console.error("Initial data error:", error)
        toast.error("Failed to load initial data")
      }
    }

    fetchInitialData()
  }, [])

  // Automatically fetch services when switching to list tab
  useEffect(() => {
    if (activeTab === "list") {
      fetchServices();
    }
  }, [activeTab])

  const fetchServices = async () => {
    setFetchingServices(true)
    try {
      const response = await axios.get(`${API_URL}/api/services/all`)
      setServices(response.data)
      saveServicesToLocalStorage(response.data)
      toast.success("Services loaded")
    } catch (error) {
      console.error("Fetch services error:", error)
      toast.error("Failed to load services")
    } finally {
      setFetchingServices(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && inputRef.current !== event.target) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = chefMatricules.filter(
        chef => chef.matricule.includes(searchTerm) ||
               `${chef.nom} ${chef.prenom}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredMatricules(filtered)
    } else {
      setFilteredMatricules(chefMatricules)
    }
  }, [searchTerm, chefMatricules])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    document.documentElement.classList.replace(theme, newTheme)
    localStorage.setItem("theme", newTheme)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (name === "chefMatricule") {
      setSearchTerm(value)
      setShowDropdown(true)
    }
  }

  const handleMatriculeSelect = (matricule, nom, prenom) => {
    setFormData(prev => ({ ...prev, chefMatricule: matricule }))
    setChefInfo(`${nom} ${prenom}`)
    setShowDropdown(false)
  }

  const validateForm = () => {
    if (!formData.serviceName.trim()) {
      toast.error("Service name is required")
      return false
    }
    if (!formData.chefMatricule) {
      toast.error("Chef matricule is required")
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/api/services/create`, formData)
      if ([200, 201].includes(response.status)) {
        toast.success("Service created!")
        setFormData({ serviceName: "", chefMatricule: "" })
        setChefInfo(null)
        const updatedServices = [...services, response.data]
        setServices(updatedServices)
        saveServicesToLocalStorage(updatedServices)
        setActiveTab("list")
      }
    } catch (err) {
      console.error("Creation error:", err)
      toast.error(err.response?.data?.message || "Failed to create service")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (serviceId) => {
    if (!serviceId) {
      toast.error("Invalid service ID")
      return
    }

    if (window.confirm("Delete this service?")) {
      try {
        await axios.delete(`${API_URL}/api/services/delete/${serviceId}`)
        const updatedServices = services.filter(s => s.id !== serviceId)
        setServices(updatedServices)
        saveServicesToLocalStorage(updatedServices)
        toast.success("Service deleted!")
      } catch (error) {
        console.error("Delete error:", error)
        toast.error(error.response?.data?.message || "Delete failed")
      }
    }
  }

  const handleEdit = (service) => {
    if (!service?.id) {
      toast.error("Invalid service data")
      return
    }

    setEditingService({
      id: service.id,
      serviceName: service.serviceName,
      chefMatricule: service.chefMatricule || service.chefHierarchique?.matricule || ""
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()

    if (!editingService?.id) {
      toast.error("Invalid service ID")
      return
    }

    if (!editingService.serviceName?.trim() || !editingService.chefMatricule) {
      toast.error("All fields required")
      return
    }

    try {
      const response = await axios.put(
        `${API_URL}/api/services/update/${editingService.id}`,
        {
          serviceName: editingService.serviceName,
          chefMatricule: editingService.chefMatricule,
        }
      )

      if (response.status === 200) {
        const updatedServices = services.map(s => 
          s.id === editingService.id ? response.data : s
        )
        setServices(updatedServices)
        saveServicesToLocalStorage(updatedServices)
        toast.success("Service updated!")
        setShowEditModal(false)
      }
    } catch (error) {
      console.error("Update error:", error)
      toast.error(error.response?.data?.message || "Update failed")
    }
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditingService(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className={`ajout-container ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <div className="ajout-content">
          <div className="service-container">
            <div className="service-tabs">
              <div className={`tab-indicator ${activeTab === "list" ? "right" : ""}`}></div>
              <button
                className={`service-tab ${activeTab === "add" ? "active" : ""}`}
                onClick={() => setActiveTab("add")}
              >
                <FiPlus /> Add Service
              </button>
              <button
                className={`service-tab ${activeTab === "list" ? "active" : ""}`}
                onClick={() => setActiveTab("list")}
              >
                <FiList /> All Services
              </button>
            </div>

            {activeTab === "add" && (
              <div className="ajout-service-container">
                <h2>Ajouter Un Service</h2>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Nom Du Service:</label>
                    <input
                      type="text"
                      name="serviceName"
                      value={formData.serviceName}
                      onChange={handleInputChange}
                      required
                      placeholder="nom du Service"
                    />
                  </div>

                  <div className="form-group">
                    <label>Matricule Du Chef:</label>
                    <div className="matricule-dropdown-container">
                      <input
                        ref={inputRef}
                        type="text"
                        name="chefMatricule"
                        value={formData.chefMatricule}
                        onChange={handleInputChange}
                        onFocus={() => setShowDropdown(true)}
                        required
                        placeholder="Select chef"
                      />
                      <div className="dropdown-icon" onClick={() => setShowDropdown(!showDropdown)}>
                        <FiChevronDown />
                      </div>

                      {showDropdown && (
                        <div className="matricule-dropdown" ref={dropdownRef}>
                          <div className="dropdown-search">
                            <FiSearch className="search-icon" />
                            <input
                              type="text"
                              placeholder="Search..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                          <div className="dropdown-scroll">
                            {filteredMatricules.length > 0 ? (
                              filteredMatricules.map((chef) => (
                                <div
                                  key={chef.matricule}
                                  className={`dropdown-item ${
                                    formData.chefMatricule === chef.matricule ? "selected" : ""
                                  }`}
                                  onClick={() => handleMatriculeSelect(chef.matricule, chef.nom, chef.prenom)}
                                >
                                  <span className="matricule-number">{chef.matricule}</span>
                                  <span className="chef-name">
                                    {chef.nom} {chef.prenom}
                                  </span>
                                  {formData.chefMatricule === chef.matricule && <FiCheck className="selected-icon" />}
                                </div>
                              ))
                            ) : (
                              <div className="no-results">
                                <FiX className="no-results-icon" />
                                <span>No matches</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {chefInfo && <div className="chef-info valid">{chefInfo}</div>}
                  </div>

                  <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? "Creating..." : "Create Service"}
                  </button>
                </form>
              </div>
            )}

            {activeTab === "list" && (
              <div className="services-list-container">
                <div className="services-list-header">
                  <h2><FiServer /> Services</h2>
                  <button
                    className="submit-button"
                    onClick={fetchServices}
                    disabled={fetchingServices}
                  >
                    <FiRefreshCw /> Refresh
                  </button>
                </div>

                {fetchingServices ? (
                  <div className="loading-container">
                    <div className="loading-spinner-large"></div>
                    <p>Loading...</p>
                  </div>
                ) : services.length > 0 ? (
                  <div className="services-table-container">
                    <table className="services-table">
                      <thead>
                        <tr>
                          <th>nom du Service </th>
                          <th>Matricule du Chef </th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {services.map((service) => (
                          <tr key={service.id}>
                            <td>{service.serviceName}</td>
                            <td>
                              {service.chefMatricule || service.chefHierarchique?.matricule}
                            </td>
                            <td className="actions">
                              <button className="edit-button" onClick={() => handleEdit(service)}>
                                <FiEdit /> Edit
                              </button>
                              <button className="delete-button" onClick={() => handleDelete(service.id)}>
                                <FiTrash2 /> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <FiInfo />
                    <h3>Aucun Services</h3>
                    <p>Ajoute un service</p>
                  </div>
                )}
              </div>
            )}

            {showEditModal && editingService && (
              <div className="modal-overlay">
                <div className="modal-container">
                  <div className="modal-header">
                    <h3>Modifier Un Service</h3>
                    <button className="modal-close" onClick={() => setShowEditModal(false)}>
                      <FiX />
                    </button>
                  </div>
                  <div className="modal-body">
                    <form onSubmit={handleEditSubmit}>
                      <div className="form-group">
                        <label>Service Name:</label>
                        <input
                          type="text"
                          name="serviceName"
                          value={editingService.serviceName}
                          onChange={handleEditChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Chef Matricule:</label>
                        <input
                          type="text"
                          name="chefMatricule"
                          value={editingService.chefMatricule}
                          onChange={handleEditChange}
                          required
                        />
                      </div>
                    </form>
                  </div>
                  <div className="modal-footer">
                    <button className="modal-cancel" onClick={() => setShowEditModal(false)}>
                      Cancel
                    </button>
                    <button className="modal-save" onClick={handleEditSubmit}>
                      Save
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

export default AjoutService