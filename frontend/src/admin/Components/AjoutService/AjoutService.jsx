"use client"

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

const AjoutService = () => {
  // State for simple service creation (name only)
  const [simpleFormData, setSimpleFormData] = useState({
    serviceName: "",
  })

  // State for assigning chefs to service
  const [assignChefsData, setAssignChefsData] = useState({
    selectedServiceId: "",
    serviceName: "",
    chefs: [
      { personnelId: "", poid: 1, matricule: "", nom: "", prenom: "", role: "" },
      { personnelId: "", poid: 2, matricule: "", nom: "", prenom: "", role: "" },
      { personnelId: "", poid: 3, matricule: "", nom: "", prenom: "", role: "" },
    ],
  })

  const [services, setServices] = useState([])
  const [basicServices, setBasicServices] = useState([]) // Services without chefs
  const [personnelList, setPersonnelList] = useState([])
  const [loading, setLoading] = useState({
    createSimple: false,
    assignChefs: false,
    fetch: false,
    update: false,
    delete: false,
  })
  const [theme, setTheme] = useState("light")
  const [activeTab, setActiveTab] = useState("add")
  const [activeCreateMode, setActiveCreateMode] = useState("simple")
  const [editingService, setEditingService] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [dropdownStates, setDropdownStates] = useState([false, false, false])
  const [searchTerms, setSearchTerms] = useState(["", "", ""])
  const [showServiceDropdown, setShowServiceDropdown] = useState(false)
  const [serviceSearchTerm, setServiceSearchTerm] = useState("")

  const dropdownRefs = [useRef(null), useRef(null), useRef(null)]
  const inputRefs = [useRef(null), useRef(null), useRef(null)]
  const serviceDropdownRef = useRef(null)

  // Fetch all necessary data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading((prev) => ({ ...prev, fetch: true }))
      try {
        const [servicesRes, basicServicesRes, personnelRes] = await Promise.all([
          axios.get(`${API_URL}/api/services/all`),
          axios.get(`${API_URL}/api/services/basic`),
          axios.get(`${API_URL}/api/Personnel/matricules`),
        ])

        setServices(servicesRes.data)
        setBasicServices(basicServicesRes.data)
        setPersonnelList(personnelRes.data)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load data")
      } finally {
        setLoading((prev) => ({ ...prev, fetch: false }))
      }
    }

    fetchData()
  }, [])

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Service dropdown
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target)) {
        setShowServiceDropdown(false)
      }

      // Chef dropdowns
      dropdownStates.forEach((state, index) => {
        if (dropdownRefs[index].current && !dropdownRefs[index].current.contains(event.target)) {
          const newDropdownStates = [...dropdownStates]
          newDropdownStates[index] = false
          setDropdownStates(newDropdownStates)
        }
      })
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [dropdownStates])

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

  // In your data fetching code:
  const fetchPersonnel = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/Personnel/matricules`)
      console.log("Fetched personnel data sample:", response.data[0]) // Verify structure

      // Ensure each personnel has an ID
      const validatedPersonnel = response.data.map((p) => ({
        ...p,
        _id: p._id || p.id, // Standardize to _id
      }))

      setPersonnelList(validatedPersonnel)
    } catch (err) {
      console.error("Failed to fetch personnel:", err)
      toast.error("Failed to load personnel data")
    }
  }
  // Simple form handlers
  const handleSimpleInputChange = (e) => {
    const { name, value } = e.target
    setSimpleFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateSimpleForm = () => {
    if (!simpleFormData.serviceName.trim()) {
      toast.error("Service name is required")
      return false
    }
    return true
  }

  const handleSimpleSubmit = async (e) => {
    e.preventDefault()
    if (!validateSimpleForm()) return

    setLoading((prev) => ({ ...prev, createSimple: true }))
    try {
      const response = await axios.post(`${API_URL}/api/services/create`, {
        serviceName: simpleFormData.serviceName,
      })

      if ([200, 201].includes(response.status)) {
        toast.success("Service created!")
        setSimpleFormData({ serviceName: "" })
        setBasicServices([...basicServices, response.data])
        setServices([...services, response.data])
        setActiveTab("list")
      }
    } catch (err) {
      console.error("Creation error:", err)
      toast.error(err.response?.data?.message || "Failed to create service")
    } finally {
      setLoading((prev) => ({ ...prev, createSimple: false }))
    }
  }

  // Assign chefs form handlers
  const handleAssignChefsInputChange = (e) => {
    const { name, value } = e.target
    setAssignChefsData((prev) => ({ ...prev, [name]: value }))
  }

  const handleChefSearchChange = (index, value) => {
    const newSearchTerms = [...searchTerms]
    newSearchTerms[index] = value
    setSearchTerms(newSearchTerms)
  }

  const toggleDropdown = (index) => {
    const newDropdownStates = [...dropdownStates]
    newDropdownStates[index] = !newDropdownStates[index]
    setDropdownStates(newDropdownStates)
  }

  const handleChefSelect = (index, personnel) => {
    console.group(`[DEBUG] Selecting chief ${index + 1}`)
    console.log("Personnel object:", personnel)

    // First try to get the ID from common field names
    const personnelId = personnel._id || personnel.id

    if (!personnelId) {
      console.error("Personnel object missing ID field! Available fields:", Object.keys(personnel))
      toast.error("Selected personnel data is incomplete - missing ID")
      return
    }

    const newChefs = [...assignChefsData.chefs]
    newChefs[index] = {
      ...newChefs[index],
      personnelId: personnelId, // Now guaranteed to have value
      matricule: personnel.matricule,
      nom: personnel.nom,
      prenom: personnel.prenom,
      role: personnel.role,
    }

    console.log("Updated chief data:", newChefs[index])
    setAssignChefsData((prev) => ({ ...prev, chefs: newChefs }))

    console.groupEnd()
  }

  const handleServiceSelect = (service) => {
    setAssignChefsData((prev) => ({
      ...prev,
      selectedServiceId: service.id,
      serviceName: service.serviceName,
    }))
    setShowServiceDropdown(false)
    setServiceSearchTerm("")
  }

  const validateAssignChefsForm = () => {
    if (!assignChefsData.selectedServiceId) {
      toast.error("Please select a service")
      return false
    }

    const hasChef = assignChefsData.chefs.some((chef) => chef.matricule)
    if (!hasChef) {
      toast.error("At least one chief is required")
      return false
    }

    return true
  }

  const handleAssignChefsSubmit = async (e) => {
    e.preventDefault()
    // Verify all selected chiefs have IDs
    const invalidChiefs = assignChefsData.chefs
      .filter((chef) => chef.matricule && !chef.personnelId)
      .map((_, i) => i + 1)

    if (invalidChiefs.length > 0) {
      toast.error(`Chiefs at positions ${invalidChiefs.join(", ")} are missing IDs`)
      return
    }

    console.group("[DEBUG] Chief Assignment Process")
    console.log("=== STARTING CHIEF ASSIGNMENT ===")
    console.log("Initial Form State:", JSON.parse(JSON.stringify(assignChefsData)))

    try {
      setLoading((prev) => ({ ...prev, assignChefs: true }))

      // 1. Validate and prepare chiefs data
      console.log("\n[Step 1] Preparing chiefs data...")
      const requestData = {}
      let validChiefsCount = 0

      assignChefsData.chefs.forEach((chef, index) => {
        const position = index + 1
        console.log(`Checking chief ${position}:`, chef)

        if (chef.personnelId && chef.matricule) {
          console.log(`âœ… Valid chief ${position} found`, {
            personnelId: chef.personnelId,
            poid: chef.poid,
          })

          requestData[`chef${position}`] = {
            personnelId: chef.personnelId,
            poid: chef.poid || position, // Default to position if poid missing
          }
          validChiefsCount++
        } else {
          console.warn(`âš ï¸ Skipping chief ${position} - missing personnelId or matricule`)
        }
      })

      if (validChiefsCount === 0) {
        console.error("âŒ No valid chiefs selected - aborting")
        throw new Error("Please select at least one valid chief")
      }

      console.log(
        "\n[Step 2] Final request payload:",
        JSON.stringify(
          {
            serviceId: assignChefsData.selectedServiceId,
            chiefs: requestData,
          },
          null,
          2,
        ),
      )

      // 2. Make API call
      console.log(
        "\n[Step 3] Making API call to:",
        `${API_URL}/api/services/${assignChefsData.selectedServiceId}/assign-chefs`,
      )

      const response = await axios.put(
        `${API_URL}/api/services/${assignChefsData.selectedServiceId}/assign-chefs`,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          transformRequest: [
            (data) => {
              console.log("Actual request payload being sent:", JSON.stringify(data))
              return JSON.stringify(data)
            },
          ],
        },
      )

      console.log("\n[Step 4] API Response:", response.data)

      // 3. Handle success
      console.log("\n[Step 5] Updating UI state...")
      toast.success("Chiefs assigned successfully!")

      const updatedServices = services.map((s) =>
        s.id === assignChefsData.selectedServiceId ? response.data.service : s,
      )
      setServices(updatedServices)

      setBasicServices((prev) => prev.filter((s) => s.id !== assignChefsData.selectedServiceId))

      console.log("UI state updated successfully")
    } catch (err) {
      console.error("\n[ERROR] Assignment failed:", {
        error: err.message,
        response: err.response?.data,
        request: {
          url: err.config?.url,
          data: err.config?.data ? JSON.parse(err.config.data) : null,
          headers: err.config?.headers,
        },
        stack: err.stack,
      })

      toast.error(err.response?.data?.message || err.message || "Chief assignment failed. Check console for details.")
    } finally {
      setLoading((prev) => ({ ...prev, assignChefs: false }))
      console.groupEnd()
    }
  }

  // Filter functions
  const filteredBasicServices = basicServices.filter((service) =>
    service.serviceName.toLowerCase().includes(serviceSearchTerm.toLowerCase()),
  )

  const filteredPersonnel = (index) => {
    const term = searchTerms[index].toLowerCase()
    if (!term) return personnelList

    return personnelList.filter(
      (personnel) =>
        personnel.matricule.toLowerCase().includes(term) ||
        personnel.nom.toLowerCase().includes(term) ||
        personnel.prenom.toLowerCase().includes(term) ||
        (personnel.role && personnel.role.toLowerCase().includes(term)),
    )
  }

  // Render functions
  const renderChefInputs = (chefs) => {
    return chefs.map((chef, index) => (
      <div className="chef-input-group" key={index}>
        <label>
          Chief {index + 1} (Weight {index + 1}):
        </label>
        <div className="matricule-dropdown-container">
          <input
            ref={inputRefs[index]}
            type="text"
            value={
              chef.matricule
                ? `${chef.matricule} - ${chef.nom} ${chef.prenom}${chef.role ? ` (${chef.role})` : ""}`
                : ""
            }
            onChange={(e) => handleChefSearchChange(index, e.target.value)}
            onFocus={() => {
              const newStates = [...dropdownStates]
              newStates[index] = true
              setDropdownStates(newStates)
            }}
            placeholder="Select chief"
          />
          <div className="dropdown-icon" onClick={() => toggleDropdown(index)}>
            <FiChevronDown />
          </div>

          {dropdownStates[index] && (
            <div className="matricule-dropdown" ref={dropdownRefs[index]}>
              <div className="dropdown-search">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search chief..."
                  value={searchTerms[index]}
                  onChange={(e) => handleChefSearchChange(index, e.target.value)}
                />
              </div>
              <div className="dropdown-scroll">
                {filteredPersonnel(index).length > 0 ? (
                  filteredPersonnel(index).map((personnel) => (
                    <div
                      key={personnel.matricule}
                      className={`dropdown-item ${chef.matricule === personnel.matricule ? "selected" : ""}`}
                      onClick={() => handleChefSelect(index, personnel)}
                    >
                      <span className="matricule-number">{personnel.matricule}</span>
                      <span className="chef-name">
                        {personnel.nom} {personnel.prenom}
                        {personnel.role ? ` (${personnel.role})` : ""}
                      </span>
                      {chef.matricule === personnel.matricule && <FiCheck className="selected-icon" />}
                    </div>
                  ))
                ) : (
                  <div className="no-results">
                    <FiX className="no-results-icon" />
                    <span>No chiefs found</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    ))
  }

  // Helper function to get chief details from personnel list
  const getChefDetails = (chefId) => {
    if (!chefId) return null
    const chef = personnelList.find((p) => (p._id || p.id) === chefId)
    return chef || null
  }

  // Edit functionality
  const handleEdit = (service) => {
    if (!service?.id) {
      toast.error("Invalid service data")
      return
    }

    const chefs = [
      service.chef1
        ? (() => {
            const chef = getChefDetails(service.chef1.id)
            return chef
              ? {
                  personnelId: service.chef1.id,
                  poid: service.poid1 || 1,
                  matricule: chef.matricule,
                  nom: chef.nom,
                  prenom: chef.prenom,
                  role: chef.role,
                }
              : { personnelId: service.chef1.id, poid: 1, matricule: "", nom: "", prenom: "", role: "" }
          })()
        : { personnelId: "", poid: 1, matricule: "", nom: "", prenom: "", role: "" },

      service.chef2
        ? (() => {
            const chef = getChefDetails(service.chef2.id)
            return chef
              ? {
                  personnelId: service.chef2.id,
                  poid: service.poid2 || 2,
                  matricule: chef.matricule,
                  nom: chef.nom,
                  prenom: chef.prenom,
                  role: chef.role,
                }
              : { personnelId: service.chef2.id, poid: 2, matricule: "", nom: "", prenom: "", role: "" }
          })()
        : { personnelId: "", poid: 2, matricule: "", nom: "", prenom: "", role: "" },

      service.chef3
        ? (() => {
            const chef = getChefDetails(service.chef3.id)
            return chef
              ? {
                  personnelId: service.chef3.id,
                  poid: service.poid3 || 3,
                  matricule: chef.matricule,
                  nom: chef.nom,
                  prenom: chef.prenom,
                  role: chef.role,
                }
              : { personnelId: service.chef3.id, poid: 3, matricule: "", nom: "", prenom: "", role: "" }
          })()
        : { personnelId: "", poid: 3, matricule: "", nom: "", prenom: "", role: "" },
    ]

    setEditingService({
      id: service.id,
      serviceName: service.serviceName,
      chefs: chefs,
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()

    if (!editingService?.id) {
      toast.error("Invalid service ID")
      return
    }

    if (!editingService.serviceName?.trim()) {
      toast.error("Service name is required")
      return
    }

    setLoading((prev) => ({ ...prev, update: true }))
    try {
      const requestData = {
        serviceName: editingService.serviceName,
      }

      // Prepare chef assignments in the format the backend expects
      if (editingService.chefs[0].matricule) {
        requestData.chef1 = {
          personnelId: editingService.chefs[0].personnelId,
          poid: editingService.chefs[0].poid,
        }
      }
      if (editingService.chefs[1].matricule) {
        requestData.chef2 = {
          personnelId: editingService.chefs[1].personnelId,
          poid: editingService.chefs[1].poid,
        }
      }
      if (editingService.chefs[2].matricule) {
        requestData.chef3 = {
          personnelId: editingService.chefs[2].personnelId,
          poid: editingService.chefs[2].poid,
        }
      }

      const response = await axios.put(`${API_URL}/api/services/update/${editingService.id}`, requestData)

      if (response.status === 200) {
        const updatedServices = services.map((s) => (s.id === editingService.id ? response.data.service : s))
        setServices(updatedServices)

        // Update basic services list if needed
        if (!response.data.chef1 && !response.data.chef2 && !response.data.chef3) {
          const serviceExists = basicServices.some((s) => s.id === editingService.id)
          if (!serviceExists) {
            setBasicServices([
              ...basicServices,
              {
                id: editingService.id,
                serviceName: response.data.serviceName,
              },
            ])
          }
        } else {
          setBasicServices(basicServices.filter((s) => s.id !== editingService.id))
        }

        toast.success("Service updated!")
        setShowEditModal(false)
      }
    } catch (error) {
      console.error("Update error:", error)
      toast.error(error.response?.data?.message || "Update failed")
    } finally {
      setLoading((prev) => ({ ...prev, update: false }))
    }
  }

  const handleDelete = async (serviceId) => {
    if (!serviceId) {
      toast.error("Invalid service ID")
      return
    }

    if (window.confirm("Delete this service?")) {
      setLoading((prev) => ({ ...prev, delete: true }))
      try {
        await axios.delete(`${API_URL}/api/services/delete/${serviceId}`)

        const updatedServices = services.filter((s) => s.id !== serviceId)
        setServices(updatedServices)

        const updatedBasicServices = basicServices.filter((s) => s.id !== serviceId)
        setBasicServices(updatedBasicServices)

        toast.success("Service deleted!")
      } catch (error) {
        console.error("Delete error:", error)
        toast.error(error.response?.data?.message || "Delete failed")
      } finally {
        setLoading((prev) => ({ ...prev, delete: false }))
      }
    }
  }

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className={`ajout-container ${sidebarCollapsed ? "collapsed" : ""}`}>
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
                <div className="create-mode-tabs">
                  <button
                    className={`create-mode-tab ${activeCreateMode === "simple" ? "active" : ""}`}
                    onClick={() => setActiveCreateMode("simple")}
                  >
                    Create Service
                  </button>
                  <button
                    className={`create-mode-tab ${activeCreateMode === "advanced" ? "active" : ""}`}
                    onClick={() => setActiveCreateMode("advanced")}
                  >
                    Assign Chiefs
                  </button>
                </div>

                {activeCreateMode === "simple" ? (
                  <div className="simple-create-form">
                    <h2>Create New Service</h2>
                    <form onSubmit={handleSimpleSubmit}>
                      <div className="form-group">
                        <label>Service Name:</label>
                        <input
                          type="text"
                          name="serviceName"
                          value={simpleFormData.serviceName}
                          onChange={handleSimpleInputChange}
                          required
                          placeholder="Enter service name"
                        />
                      </div>
                      <button type="submit" className="submit-button" disabled={loading.createSimple}>
                        {loading.createSimple ? "Creating..." : "Create Service"}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="advanced-create-form">
                    <h2>Assign Chiefs to Service</h2>
                    <form onSubmit={handleAssignChefsSubmit}>
                      <div className="form-group">
                        <label>Select Service:</label>
                        <div className="service-dropdown-container" ref={serviceDropdownRef}>
                          <input
                            type="text"
                            value={assignChefsData.serviceName}
                            onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                            onChange={(e) => {
                              setAssignChefsData((prev) => ({
                                ...prev,
                                selectedServiceId: "",
                                serviceName: e.target.value,
                              }))
                              setServiceSearchTerm(e.target.value)
                              setShowServiceDropdown(true)
                            }}
                            placeholder="Search services without chiefs..."
                          />
                          <div className="dropdown-icon" onClick={() => setShowServiceDropdown(!showServiceDropdown)}>
                            <FiChevronDown />
                          </div>

                          {showServiceDropdown && (
                            <div className="service-dropdown">
                              <div className="dropdown-search">
                                <FiSearch className="search-icon" />
                                <input
                                  type="text"
                                  placeholder="Search services..."
                                  value={serviceSearchTerm}
                                  onChange={(e) => setServiceSearchTerm(e.target.value)}
                                  autoFocus
                                />
                              </div>
                              <div className="dropdown-scroll">
                                {filteredBasicServices.length > 0 ? (
                                  filteredBasicServices.map((service) => (
                                    <div
                                      key={service.id}
                                      className={`dropdown-item ${
                                        assignChefsData.selectedServiceId === service.id ? "selected" : ""
                                      }`}
                                      onClick={() => handleServiceSelect(service)}
                                    >
                                      {service.serviceName}
                                      {assignChefsData.selectedServiceId === service.id && (
                                        <FiCheck className="selected-icon" />
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <div className="no-results">
                                    <FiX className="no-results-icon" />
                                    <span>No services found</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="chefs-container">
                        <h3>Service Chiefs</h3>
                        <p className="helper-text">
                          Select up to 3 chiefs for this service with weights. Chief 1 has weight 1 (highest priority),
                          Chief 2 has weight 2, and Chief 3 has weight 3.
                        </p>
                        {renderChefInputs(assignChefsData.chefs)}
                      </div>

                      <button
                        type="submit"
                        className="submit-button"
                        disabled={loading.assignChefs || !assignChefsData.selectedServiceId}
                      >
                        {loading.assignChefs ? "Assigning..." : "Assign Chiefs"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {activeTab === "list" && (
              <div className="services-list-container">
                <div className="services-list-header">
                  <h2>
                    <FiServer /> Services
                  </h2>
                  <div className="action-buttons">
                    <button
                      className="refresh-button"
                      onClick={() => {
                        setLoading((prev) => ({ ...prev, fetch: true }))
                        Promise.all([
                          axios.get(`${API_URL}/api/services/all`),
                          axios.get(`${API_URL}/api/services/basic`),
                        ])
                          .then(([servicesRes, basicServicesRes]) => {
                            setServices(servicesRes.data)
                            setBasicServices(basicServicesRes.data)
                          })
                          .catch((err) => toast.error("Failed to refresh data"))
                          .finally(() => setLoading((prev) => ({ ...prev, fetch: false })))
                      }}
                      disabled={loading.fetch}
                    >
                      <FiRefreshCw /> Refresh
                    </button>
                  </div>
                </div>

                {loading.fetch ? (
                  <div className="loading-container">
                    <div className="loading-spinner-large"></div>
                    <p>Loading services...</p>
                  </div>
                ) : services.length > 0 ? (
                  <div className="services-table-container">
                    <table className="services-table">
                      <thead>
                        <tr>
                          <th>Service Name</th>
                          <th>Chief 1 (Weight 1)</th>
                          <th>Chief 2 (Weight 2)</th>
                          <th>Chief 3 (Weight 3)</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {services.map((service) => (
                          <tr key={service.id}>
                            <td>{service.serviceName}</td>
                            <td>
                              {service.chef1
                                ? (() => {
                                    const chef = getChefDetails(service.chef1.id)
                                    return chef
                                      ? `${chef.matricule} - ${chef.nom} ${chef.prenom}`
                                      : `ID: ${service.chef1.id} (Details not found)`
                                  })()
                                : "-"}
                            </td>
                            <td>
                              {service.chef2
                                ? (() => {
                                    const chef = getChefDetails(service.chef2.id)
                                    return chef
                                      ? `${chef.matricule} - ${chef.nom} ${chef.prenom}`
                                      : `ID: ${service.chef2.id} (Details not found)`
                                  })()
                                : "-"}
                            </td>
                            <td>
                              {service.chef3
                                ? (() => {
                                    const chef = getChefDetails(service.chef3.id)
                                    return chef
                                      ? `${chef.matricule} - ${chef.nom}`
                                      : `ID: ${service.chef3.id} (Details not found)`
                                  })()
                                : "-"}
                            </td>
                            <td className="actions">
                              <button
                                className="edit-button"
                                onClick={() => handleEdit(service)}
                                disabled={loading.update || loading.delete}
                              >
                                <FiEdit /> Edit
                              </button>
                              <button
                                className="delete-button"
                                onClick={() => handleDelete(service.id)}
                                disabled={loading.update || loading.delete}
                              >
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
                    <h3>No Services</h3>
                    <p>Add a service to get started</p>
                  </div>
                )}
              </div>
            )}

            {showEditModal && editingService && (
              <div className="modal-overlay">
                <div className="modal-container">
                  <div className="modal-header">
                    <h3>Edit Service</h3>
                    <button className="modal-close" onClick={() => setShowEditModal(false)} disabled={loading.update}>
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
                          onChange={(e) =>
                            setEditingService({
                              ...editingService,
                              serviceName: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="chefs-container">
                        <h3>Service Chiefs</h3>
                        {renderChefInputs(editingService.chefs)}
                      </div>
                    </form>
                  </div>
                  <div className="modal-footer">
                    <button className="modal-cancel" onClick={() => setShowEditModal(false)} disabled={loading.update}>
                      Cancel
                    </button>
                    <button className="modal-save" onClick={handleEditSubmit} disabled={loading.update}>
                      {loading.update ? "Saving..." : "Save"}
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
