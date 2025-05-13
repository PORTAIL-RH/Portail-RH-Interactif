import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AjoutService.css";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { API_URL } from "../../../config";
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
} from "react-icons/fi";

const STORAGE_KEYS = {
  SERVICES: 'servicesData',
  PERSONNEL: 'personnelData',
  LAST_FETCHED: 'lastFetched'
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration

const AjoutService = () => {
  const [formData, setFormData] = useState({
    serviceName: "",
    chefs: [
      { personnelId: "", poid: 1, matricule: "", nom: "", prenom: "", role: "" },
      { personnelId: "", poid: 2, matricule: "", nom: "", prenom: "", role: "" },
      { personnelId: "", poid: 3, matricule: "", nom: "", prenom: "", role: "" }
    ]
  });

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState({
    services: false,
    personnel: false
  });
  const [personnelList, setPersonnelList] = useState([]);
  const [theme, setTheme] = useState("light");
  const [activeTab, setActiveTab] = useState("add");
  const [editingService, setEditingService] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dropdownStates, setDropdownStates] = useState([false, false, false]);
  const [searchTerms, setSearchTerms] = useState(["", "", ""]);

  const dropdownRefs = [useRef(null), useRef(null), useRef(null)];
  const inputRefs = [useRef(null), useRef(null), useRef(null)];

  // Save data to localStorage with timestamp
  const saveToStorage = (key, data) => {
    try {
      const storageData = {
        data,
        timestamp: new Date().getTime()
      };
      localStorage.setItem(key, JSON.stringify(storageData));
    } catch (error) {
      console.error(`Error saving to localStorage (${key}):`, error);
    }
  };

  // Load data from localStorage and check if expired
  const loadFromStorage = (key) => {
    try {
      const storedData = localStorage.getItem(key);
      if (!storedData) return null;
      
      const parsedData = JSON.parse(storedData);
      return {
        data: parsedData.data,
        timestamp: parsedData.timestamp,
        isExpired: (new Date().getTime() - parsedData.timestamp) > CACHE_DURATION
      };
    } catch (error) {
      console.error(`Error loading from localStorage (${key}):`, error);
      return null;
    }
  };

  // Fetch services from API
  const fetchServices = async () => {
    setFetchingData(prev => ({...prev, services: true}));
    try {
      const response = await axios.get(`${API_URL}/api/services/all`);
      setServices(response.data);
      saveToStorage(STORAGE_KEYS.SERVICES, response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to load services");
      throw error;
    } finally {
      setFetchingData(prev => ({...prev, services: false}));
    }
  };

  // Fetch personnel from API
  const fetchPersonnel = async () => {
    setFetchingData(prev => ({...prev, personnel: true}));
    try {
      const response = await axios.get(`${API_URL}/api/Personnel/matricules`);
      setPersonnelList(response.data);
      saveToStorage(STORAGE_KEYS.PERSONNEL, response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching personnel:", error);
      toast.error("Failed to load personnel data");
      throw error;
    } finally {
      setFetchingData(prev => ({...prev, personnel: false}));
    }
  };

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load services
        const cachedServices = loadFromStorage(STORAGE_KEYS.SERVICES);
        if (cachedServices && !cachedServices.isExpired) {
          setServices(cachedServices.data);
        } else {
          await fetchServices();
        }

        // Load personnel
        const cachedPersonnel = loadFromStorage(STORAGE_KEYS.PERSONNEL);
        if (cachedPersonnel && !cachedPersonnel.isExpired) {
          setPersonnelList(cachedPersonnel.data);
        } else {
          await fetchPersonnel();
        }
      } catch (error) {
        console.error("Initial data loading error:", error);
      }
    };

    loadInitialData();
  }, []);

  // Refresh services when switching to list tab if data is stale
  useEffect(() => {
    if (activeTab === "list") {
      const cachedServices = loadFromStorage(STORAGE_KEYS.SERVICES);
      if (!cachedServices || cachedServices.isExpired) {
        fetchServices();
      }
    }
  }, [activeTab]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      dropdownStates.forEach((state, index) => {
        if (dropdownRefs[index].current && 
            !dropdownRefs[index].current.contains(event.target) && 
            inputRefs[index].current !== event.target) {
          const newDropdownStates = [...dropdownStates];
          newDropdownStates[index] = false;
          setDropdownStates(newDropdownStates);
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownStates]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.replace(theme, newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChefSearchChange = (index, value) => {
    const newSearchTerms = [...searchTerms];
    newSearchTerms[index] = value;
    setSearchTerms(newSearchTerms);
  };

  const toggleDropdown = (index) => {
    const newDropdownStates = [...dropdownStates];
    newDropdownStates[index] = !newDropdownStates[index];
    setDropdownStates(newDropdownStates);
  };

  const handleChefSelect = (index, personnel) => {
    const newChefs = [...formData.chefs];
    newChefs[index] = {
      ...newChefs[index],
      personnelId: personnel.id || "",
      matricule: personnel.matricule,
      nom: personnel.nom,
      prenom: personnel.prenom,
      role: personnel.role
    };
    setFormData(prev => ({ ...prev, chefs: newChefs }));
    
    const newDropdownStates = [...dropdownStates];
    newDropdownStates[index] = false;
    setDropdownStates(newDropdownStates);
  };

  const validateForm = () => {
    if (!formData.serviceName.trim()) {
      toast.error("Service name is required");
      return false;
    }
    
    const hasChef = formData.chefs.some(chef => chef.matricule);
    if (!hasChef) {
      toast.error("At least one chief is required");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const requestData = {
        serviceName: formData.serviceName,
        ...formData.chefs.reduce((acc, chef, index) => {
          if (chef.matricule) {
            acc[`chef${index + 1}`] = { 
              matricule: chef.matricule,
              poid: index + 1
            };
          }
          return acc;
        }, {})
      };

      const response = await axios.post(`${API_URL}/api/services/create`, requestData);
      if ([200, 201].includes(response.status)) {
        toast.success("Service created!");
        setFormData({
          serviceName: "",
          chefs: [
            { personnelId: "", poid: 1, matricule: "", nom: "", prenom: "", role: "" },
            { personnelId: "", poid: 2, matricule: "", nom: "", prenom: "", role: "" },
            { personnelId: "", poid: 3, matricule: "", nom: "", prenom: "", role: "" }
          ]
        });
        setSearchTerms(["", "", ""]);
        const updatedServices = [...services, response.data.service];
        setServices(updatedServices);
        saveToStorage(STORAGE_KEYS.SERVICES, updatedServices);
        setActiveTab("list");
      }
    } catch (err) {
      console.error("Creation error:", err);
      toast.error(err.response?.data?.message || "Failed to create service");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (serviceId) => {
    if (!serviceId) {
      toast.error("Invalid service ID");
      return;
    }

    if (window.confirm("Delete this service?")) {
      try {
        await axios.delete(`${API_URL}/api/services/delete/${serviceId}`);
        const updatedServices = services.filter(s => s.id !== serviceId);
        setServices(updatedServices);
        saveToStorage(STORAGE_KEYS.SERVICES, updatedServices);
        toast.success("Service deleted!");
      } catch (error) {
        console.error("Delete error:", error);
        toast.error(error.response?.data?.message || "Delete failed");
      }
    }
  };

  const handleEdit = (service) => {
    if (!service?.id) {
      toast.error("Invalid service data");
      return;
    }

    const chefs = [
      service.chef1 ? { 
        personnelId: service.chef1.id, 
        poid: 1,
        matricule: service.chef1.matricule,
        nom: service.chef1.nom,
        prenom: service.chef1.prenom,
        role: service.chef1.role
      } : { personnelId: "", poid: 1, matricule: "", nom: "", prenom: "", role: "" },
      service.chef2 ? { 
        personnelId: service.chef2.id, 
        poid: 2,
        matricule: service.chef2.matricule,
        nom: service.chef2.nom,
        prenom: service.chef2.prenom,
        role: service.chef2.role
      } : { personnelId: "", poid: 2, matricule: "", nom: "", prenom: "", role: "" },
      service.chef3 ? { 
        personnelId: service.chef3.id, 
        poid: 3,
        matricule: service.chef3.matricule,
        nom: service.chef3.nom,
        prenom: service.chef3.prenom,
        role: service.chef3.role
      } : { personnelId: "", poid: 3, matricule: "", nom: "", prenom: "", role: "" }
    ];

    setEditingService({
      id: service.id,
      serviceName: service.serviceName,
      chefs: chefs
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editingService?.id) {
      toast.error("Invalid service ID");
      return;
    }

    if (!editingService.serviceName?.trim()) {
      toast.error("Service name is required");
      return;
    }

    try {
      const requestData = {
        serviceName: editingService.serviceName
      };

      editingService.chefs.forEach((chef, index) => {
        if (chef.matricule) {
          requestData[`chef${index + 1}Matricule`] = chef.matricule;
          requestData[`poid${index + 1}`] = index + 1;
        }
      });

      const response = await axios.put(
        `${API_URL}/api/services/update/${editingService.id}`,
        requestData
      );

      if (response.status === 200) {
        const updatedServices = services.map(s => 
          s.id === editingService.id ? response.data : s
        );
        setServices(updatedServices);
        saveToStorage(STORAGE_KEYS.SERVICES, updatedServices);
        toast.success("Service updated!");
        setShowEditModal(false);
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || "Update failed");
    }
  };

  const handleEditChefSelect = (index, personnel) => {
    const newChefs = [...editingService.chefs];
    newChefs[index] = {
      ...newChefs[index],
      personnelId: personnel.id || "",
      matricule: personnel.matricule,
      nom: personnel.nom,
      prenom: personnel.prenom,
      role: personnel.role
    };
    setEditingService(prev => ({ ...prev, chefs: newChefs }));
  };

  const filteredPersonnel = (index) => {
    const term = searchTerms[index].toLowerCase();
    if (!term) return personnelList;

    return personnelList.filter(personnel => 
      personnel.matricule.toLowerCase().includes(term) ||
      personnel.nom.toLowerCase().includes(term) ||
      personnel.prenom.toLowerCase().includes(term) ||
      (personnel.role && personnel.role.toLowerCase().includes(term))
    );
  };

  const renderChefInputs = (chefs, isEditing = false) => {
    return chefs.map((chef, index) => (
      <div className="chef-input-group" key={index}>
        <label>Chief {index + 1} (Weight {index + 1}):</label>
        <div className="matricule-dropdown-container">
          <input
            ref={inputRefs[index]}
            type="text"
            value={chef.matricule ? `${chef.matricule} - ${chef.nom} ${chef.prenom}${chef.role ? ` (${chef.role})` : ''}` : ""}
            onChange={(e) => isEditing ? null : handleChefSearchChange(index, e.target.value)}
            onFocus={() => {
              const newStates = [...dropdownStates];
              newStates[index] = true;
              setDropdownStates(newStates);
            }}
            placeholder="Select chief"
            readOnly={isEditing}
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
                      className={`dropdown-item ${
                        chef.matricule === personnel.matricule ? "selected" : ""
                      }`}
                      onClick={() => isEditing ? 
                        handleEditChefSelect(index, personnel) : 
                        handleChefSelect(index, personnel)
                      }
                    >
                      <span className="matricule-number">{personnel.matricule}</span>
                      <span className="chef-name">
                        {personnel.nom} {personnel.prenom}{personnel.role ? ` (${personnel.role})` : ''}
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
    ));
  };

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
                <h2>Add Service</h2>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Service Name:</label>
                    <input
                      type="text"
                      name="serviceName"
                      value={formData.serviceName}
                      onChange={handleInputChange}
                      required
                      placeholder="Service name"
                    />
                  </div>

                  <div className="chefs-container">
                    <h3>Service Chiefs</h3>
                    <p className="helper-text">
                      Select up to 3 chiefs for this service with fixed weights.
                      Chief 1 has weight 1 (highest priority), Chief 2 has weight 2, and Chief 3 has weight 3.
                    </p>
                    {renderChefInputs(formData.chefs)}
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
                  <div className="action-buttons">
                    <button
                      className="submit-button"
                      onClick={fetchServices}
                      disabled={fetchingData.services}
                    >
                      <FiRefreshCw /> Refresh Services
                    </button>
                    <button
                      className="submit-button"
                      onClick={fetchPersonnel}
                      disabled={fetchingData.personnel}
                    >
                      <FiRefreshCw /> Refresh Chiefs
                    </button>
                  </div>
                </div>

                {fetchingData.services ? (
                  <div className="loading-container">
                    <div className="loading-spinner-large"></div>
                    <p>Loading services...</p>
                  </div>
) : Array.isArray(services) && services.length > 0 ? (
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
                              {service.chef1 ? 
                                `${service.chef1.matricule} - ${service.chef1.nom}${service.chef1.role ? ` (${service.chef1.role})` : ''}` : 
                                '-'}
                            </td>
                            <td>
                              {service.chef2 ? 
                                `${service.chef2.matricule} - ${service.chef2.nom}${service.chef2.role ? ` (${service.chef2.role})` : ''}` : 
                                '-'}
                            </td>
                            <td>
                              {service.chef3 ? 
                                `${service.chef3.matricule} - ${service.chef3.nom}${service.chef3.role ? ` (${service.chef3.role})` : ''}` : 
                                '-'}
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
                          onChange={(e) => setEditingService({...editingService, serviceName: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div className="chefs-container">
                        <h3>Service Chiefs</h3>
                        {renderChefInputs(editingService.chefs, true)}
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
  );
};

export default AjoutService;