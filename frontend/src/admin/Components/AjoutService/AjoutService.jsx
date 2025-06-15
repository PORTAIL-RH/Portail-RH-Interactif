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
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    serviceId: null,
    serviceName: "",
  })

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
        toast.error("Échec du chargement des données")
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
      toast.error("Échec du chargement des données du personnel")
    }
  }
  // Simple form handlers
  const handleSimpleInputChange = (e) => {
    const { name, value } = e.target
    setSimpleFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateSimpleForm = () => {
    if (!simpleFormData.serviceName.trim()) {
      toast.error("Le nom du service est requis")
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
        toast.success("Service créé avec succès !")
        setSimpleFormData({ serviceName: "" })
        setBasicServices([...basicServices, response.data])
        setServices([...services, response.data])
        setActiveTab("list")
      }
    } catch (err) {
      console.error("Creation error:", err)
      toast.error(err.response?.data?.message || "Échec de la création du service")
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
      toast.error("Les données du personnel sélectionné sont incomplètes - ID manquant")
      return
    }

    // Check if we're in edit mode
    if (showEditModal && editingService) {
      // Handle chef selection for edit modal
      const newChefs = [...editingService.chefs]
      newChefs[index] = {
        ...newChefs[index],
        personnelId: personnelId,
        matricule: personnel.matricule,
        nom: personnel.nom,
        prenom: personnel.prenom,
        role: personnel.role,
      }

      setEditingService((prev) => ({
        ...prev,
        chefs: newChefs,
      }))

      // Close the dropdown
      const newDropdownStates = [...dropdownStates]
      newDropdownStates[index] = false
      setDropdownStates(newDropdownStates)

      // Clear search term
      const newSearchTerms = [...searchTerms]
      newSearchTerms[index] = ""
      setSearchTerms(newSearchTerms)

      console.log("Updated chief data for edit:", newChefs[index])
    } else {
      // Handle chef selection for assign chefs form (existing logic)
      const newChefs = [...assignChefsData.chefs]
      newChefs[index] = {
        ...newChefs[index],
        personnelId: personnelId,
        matricule: personnel.matricule,
        nom: personnel.nom,
        prenom: personnel.prenom,
        role: personnel.role,
      }

      console.log("Updated chief data:", newChefs[index])
      setAssignChefsData((prev) => ({ ...prev, chefs: newChefs }))

      // Close the dropdown
      const newDropdownStates = [...dropdownStates]
      newDropdownStates[index] = false
      setDropdownStates(newDropdownStates)
    }

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
      toast.error("Veuillez sélectionner un service")
      return false
    }

    const hasChef = assignChefsData.chefs.some((chef) => chef.matricule)
    if (!hasChef) {
      toast.error("Au moins un chef est requis")
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
      toast.error(`Les chefs aux positions ${invalidChiefs.join(", ")} n'ont pas d'ID`)
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
          console.log(`✅ Valid chief ${position} found`, {
            personnelId: chef.personnelId,
            poid: chef.poid,
          })

          requestData[`chef${position}`] = {
            personnelId: chef.personnelId,
            poid: chef.poid || position, // Default to position if poid missing
          }
          validChiefsCount++
        } else {
          console.warn(`⚠️ Skipping chief ${position} - missing personnelId or matricule`)
        }
      })

      if (validChiefsCount === 0) {
        console.error("❌ No valid chiefs selected - aborting")
        throw new Error("Veuillez sélectionner au moins un chef valide")
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
      toast.success("Chefs assignés avec succès !")

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

      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Échec de l'assignation des chefs. Vérifiez la console pour plus de détails.",
      )
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
          Chef {index + 1} (Poids {index + 1}) :
        </label>
        <div className="matricule-dropdown-container">
          <input
            ref={inputRefs[index]}
            type="text"
            value={
              chef.matricule
                ? `${chef.matricule} - ${chef.nom} ${chef.prenom}${chef.role ? ` (${chef.role})` : ""}`
                : searchTerms[index] || ""
            }
            onChange={(e) => handleChefSearchChange(index, e.target.value)}
            onFocus={() => {
              const newStates = [...dropdownStates]
              newStates[index] = true
              setDropdownStates(newStates)
            }}
            placeholder="Sélectionner un chef"
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
                  placeholder="Rechercher un chef..."
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
                    <span>Aucun chef trouvé</span>
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
      toast.error("Données de service invalides")
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

    // Reset dropdown states and search terms for edit modal
    setDropdownStates([false, false, false])
    setSearchTerms(["", "", ""])

    setShowEditModal(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()

    if (!editingService?.id) {
      toast.error("ID de service invalide")
      return
    }

    if (!editingService.serviceName?.trim()) {
      toast.error("Le nom du service est requis")
      return
    }

    setLoading((prev) => ({ ...prev, update: true }))
    try {
      const requestData = {
        serviceName: editingService.serviceName,
      }

      // Add chef matricules and poids in the format expected by backend
      editingService.chefs.forEach((chef, index) => {
        const chefNumber = index + 1
        if (chef.matricule && chef.matricule.trim()) {
          requestData[`chef${chefNumber}Matricule`] = chef.matricule
          requestData[`poid${chefNumber}`] = chef.poid || chefNumber
        } else {
          // Send empty string to clear the chef position
          requestData[`chef${chefNumber}Matricule`] = ""
          requestData[`poid${chefNumber}`] = 0
        }
      })

      const response = await axios.put(`${API_URL}/api/services/update/${editingService.id}`, requestData)

      if (response.status === 200) {
        const updatedServices = services.map((s) => (s.id === editingService.id ? response.data : s))

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

        toast.success("Service mis à jour !")
        setShowEditModal(false)
      }
    } catch (error) {
      console.error("Update error:", error)
      toast.error(error.response?.data?.message || "Échec de la mise à jour")
    } finally {
      setLoading((prev) => ({ ...prev, update: false }))
    }
  }

  const handleDelete = async (serviceId, serviceName) => {
    if (!serviceId) {
      toast.error("ID de service invalide")
      return
    }

    setDeleteConfirmation({
      show: true,
      serviceId: serviceId,
      serviceName: serviceName || "ce service",
    })
  }

  const confirmDelete = async () => {
    const { serviceId } = deleteConfirmation
    setLoading((prev) => ({ ...prev, delete: true }))

    try {
      const response = await axios.delete(`${API_URL}/api/services/delete/${serviceId}`)

      if (response.status === 200) {
        setServices((prev) => prev.filter((s) => s.id !== serviceId))
        setBasicServices((prev) => prev.filter((s) => s.id !== serviceId))
        toast.success("Service supprimé avec succès")
      }
    } catch (error) {
      console.error("Delete error details:", {
        error: error.message,
        response: error.response?.data,
        config: error.config,
      })

      let errorMessage = "Échec de la suppression du service"
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data?.message || "Le service ne peut pas être supprimé (personnel associé)"
        } else if (error.response.status === 404) {
          errorMessage = "Service non trouvé"
        } else if (error.response.status === 500) {
          errorMessage = "Erreur serveur. Veuillez vérifier si le service a des dépendances."
        } else {
          errorMessage = error.response.data?.message || `Erreur serveur : ${error.response.status}`
        }
      }

      toast.error(errorMessage)
    } finally {
      setLoading((prev) => ({ ...prev, delete: false }))
      setDeleteConfirmation({ show: false, serviceId: null, serviceName: "" })
    }
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setEditingService(null)
    setDropdownStates([false, false, false])
    setSearchTerms(["", "", ""])
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
                <FiPlus /> Ajouter Service
              </button>
              <button
                className={`service-tab ${activeTab === "list" ? "active" : ""}`}
                onClick={() => setActiveTab("list")}
              >
                <FiList /> Tous les Services
              </button>
            </div>

            {activeTab === "add" && (
              <div className="ajout-service-container">
                <div className="create-mode-tabs">
                  <button
                    className={`create-mode-tab ${activeCreateMode === "simple" ? "active" : ""}`}
                    onClick={() => setActiveCreateMode("simple")}
                  >
                    Créer Service
                  </button>
                  <button
                    className={`create-mode-tab ${activeCreateMode === "advanced" ? "active" : ""}`}
                    onClick={() => setActiveCreateMode("advanced")}
                  >
                    Assigner Chefs
                  </button>
                </div>

                {activeCreateMode === "simple" ? (
                  <div className="simple-create-form">
                    <h2>Créer un Nouveau Service</h2>
                    <form onSubmit={handleSimpleSubmit}>
                      <div className="form-group">
                        <label>Nom du Service :</label>
                        <input
                          type="text"
                          name="serviceName"
                          value={simpleFormData.serviceName}
                          onChange={handleSimpleInputChange}
                          required
                          placeholder="Entrez le nom du service"
                        />
                      </div>
                      <button type="submit" className="submit-button" disabled={loading.createSimple}>
                        {loading.createSimple ? "Création..." : "Créer Service"}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="advanced-create-form">
                    <h2>Assigner des Chefs au Service</h2>
                    <form onSubmit={handleAssignChefsSubmit}>
                      <div className="form-group">
                        <label>Sélectionner Service :</label>
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
                            placeholder="Rechercher services sans chefs..."
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
                                  placeholder="Rechercher services..."
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
                                    <span>Aucun service trouvé</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="chefs-container">
                        <h3>Chefs de Service</h3>
                        <p className="helper-text">
                          Sélectionnez jusqu'à 3 chefs pour ce service avec des poids. Le Chef 1 a le poids 1 (priorité
                          la plus élevée), le Chef 2 a le poids 2, et le Chef 3 a le poids 3.
                        </p>
                        {renderChefInputs(assignChefsData.chefs)}
                      </div>

                      <button
                        type="submit"
                        className="submit-button"
                        disabled={loading.assignChefs || !assignChefsData.selectedServiceId}
                      >
                        {loading.assignChefs ? "Attribution..." : "Assigner Chefs"}
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
                          .catch((err) => toast.error("Échec de l'actualisation des données"))
                          .finally(() => setLoading((prev) => ({ ...prev, fetch: false })))
                      }}
                      disabled={loading.fetch}
                    >
                      <FiRefreshCw /> Actualiser
                    </button>
                  </div>
                </div>

                {loading.fetch ? (
                  <div className="loading-container">
                    <div className="loading-spinner-large"></div>
                    <p>Chargement des services...</p>
                  </div>
                ) : services.length > 0 ? (
                  <div className="services-table-container">
                    <table className="services-table">
                      <thead>
                        <tr>
                          <th>Nom du Service</th>
                          <th>Chef 1 (Poids 1)</th>
                          <th>Chef 2 (Poids 2)</th>
                          <th>Chef 3 (Poids 3)</th>
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
                                      : `ID: ${service.chef1.id} (Détails non trouvés)`
                                  })()
                                : "-"}
                            </td>
                            <td>
                              {service.chef2
                                ? (() => {
                                    const chef = getChefDetails(service.chef2.id)
                                    return chef
                                      ? `${chef.matricule} - ${chef.nom} ${chef.prenom}`
                                      : `ID: ${service.chef2.id} (Détails non trouvés)`
                                  })()
                                : "-"}
                            </td>
                            <td>
                              {service.chef3
                                ? (() => {
                                    const chef = getChefDetails(service.chef3.id)
                                    return chef
                                      ? `${chef.matricule} - ${chef.nom}`
                                      : `ID: ${service.chef3.id} (Détails non trouvés)`
                                  })()
                                : "-"}
                            </td>
                            <td className="actions">
                              <button
                                className="edit-button"
                                onClick={() => handleEdit(service)}
                                disabled={loading.update || loading.delete}
                              >
                                <FiEdit /> Modifier
                              </button>
                              <button
                                className="delete-button"
                                onClick={() => handleDelete(service.id, service.serviceName)}
                                disabled={loading.update || loading.delete}
                              >
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
                    <FiInfo />
                    <h3>Aucun Service</h3>
                    <p>Ajoutez un service pour commencer</p>
                  </div>
                )}
              </div>
            )}

            {showEditModal && editingService && (
              <div className="modal-overlay">
                <div className="modal-container">
                  <div className="modal-header">
                    <h3>Modifier Service</h3>
                    <button className="modal-close" onClick={handleCloseEditModal} disabled={loading.update}>
                      <FiX />
                    </button>
                  </div>
                  <div className="modal-body">
                    <form onSubmit={handleEditSubmit}>
                      <div className="form-group">
                        <label>Nom du Service :</label>
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
                        <h3>Chefs de Service</h3>
                        {renderChefInputs(editingService.chefs)}
                      </div>
                    </form>
                  </div>
                  <div className="modal-footer">
                    <button className="modal-cancel" onClick={handleCloseEditModal} disabled={loading.update}>
                      Annuler
                    </button>
                    <button className="modal-save" onClick={handleEditSubmit} disabled={loading.update}>
                      {loading.update ? "Sauvegarde..." : "Sauvegarder"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {deleteConfirmation.show && (
              <div className="modal-overlay">
                <div className="delete-confirmation-modal">
                  <div className="delete-modal-header">
                    <div className="delete-warning-icon">
                      <FiTrash2 />
                    </div>
                    <h3>Confirmer la Suppression</h3>
                  </div>
                  <div className="delete-modal-body">
                    <p>
                      Êtes-vous sûr de vouloir supprimer <strong>"{deleteConfirmation.serviceName}"</strong> ?
                    </p>
                    <p className="delete-warning">
                      Cette action ne peut pas être annulée. Toutes les données associées seront définitivement
                      supprimées.
                    </p>
                  </div>
                  <div className="delete-modal-footer">
                    <button
                      className="delete-cancel-button"
                      onClick={() => setDeleteConfirmation({ show: false, serviceId: null, serviceName: "" })}
                      disabled={loading.delete}
                    >
                      Annuler
                    </button>
                    <button className="delete-confirm-button" onClick={confirmDelete} disabled={loading.delete}>
                      {loading.delete ? "Suppression..." : "Supprimer Service"}
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
