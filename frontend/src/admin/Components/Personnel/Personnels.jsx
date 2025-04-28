import { useState, useEffect } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import "./Personnels.css";
import { API_URL } from "../../../config";

// Constants for localStorage keys
const STORAGE_KEYS = {
  DASHBOARD_STATS: 'dashboardStats',
  PERSONNEL_DATA: 'personnelData',
  ROLES_DATA: 'rolesData',
  SERVICES_DATA: 'servicesData'
};

const Personnel = () => {
  const [personnel, setPersonnel] = useState([]);
  const [roles, setRoles] = useState([]);
  const [services, setServices] = useState([]);
  const [staffError, setStaffError] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [editingPersonnel, setEditingPersonnel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [theme, setTheme] = useState("light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // State for filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMatricule, setFilterMatricule] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterService, setFilterService] = useState("");

  // Helper function to save data to localStorage
  const saveToLocalStorage = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify({
        ...data,
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      console.error(`Error saving to ${key}:`, error);
    }
  };

  // Load data from localStorage
  const loadFromLocalStorage = () => {
    try {
      const personnelData = localStorage.getItem(STORAGE_KEYS.PERSONNEL_DATA);
      const rolesData = localStorage.getItem(STORAGE_KEYS.ROLES_DATA);
      const servicesData = localStorage.getItem(STORAGE_KEYS.SERVICES_DATA);

      return {
        personnel: personnelData ? JSON.parse(personnelData).personnel : [],
        roles: rolesData ? JSON.parse(rolesData).roles : [],
        services: servicesData ? JSON.parse(servicesData).services : [],
        lastUpdated: personnelData ? JSON.parse(personnelData).lastUpdated : null
      };
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      return {
        personnel: [],
        roles: [],
        services: [],
        lastUpdated: null
      };
    }
  };

  // Initialize component
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Try to load from localStorage first
        const cachedData = loadFromLocalStorage();
        
        if (cachedData.personnel.length > 0) {
          setPersonnel(cachedData.personnel);
          setRoles(cachedData.roles);
          setServices(cachedData.services);
          
          // Check if data is stale (older than 5 minutes)
          const lastUpdated = cachedData.lastUpdated ? new Date(cachedData.lastUpdated) : null;
          const now = new Date();
          const isStale = lastUpdated ? (now - lastUpdated) > (5 * 60 * 1000) : true;
          
          if (isStale) {
            console.log("Cached data is stale, fetching fresh data from API");
            await fetchAllData();
          } else {
            console.log("Using cached data");
          }
        } else {
          console.log("No cached data available, fetching from API");
          await fetchAllData();
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        showToast("Error loading initial data", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();

    // Set up polling for personnel every 2 seconds
    const pollingInterval = setInterval(fetchPersonnel, 2000);

    // Sidebar toggle listener
    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail);
    };
    window.addEventListener('sidebarToggled', handleSidebarToggle);
    
    return () => {
      clearInterval(pollingInterval);
      window.removeEventListener('sidebarToggled', handleSidebarToggle);
    };
  }, []);

  // Fetch all data from API
  const fetchAllData = async () => {
    try {
      console.log("Fetching all data from API");
      const [personnelData, rolesData, servicesData] = await Promise.all([
        fetchPersonnelFromAPI(),
        fetchRolesFromAPI(),
        fetchServicesFromAPI()
      ]);
      
      // Update state
      if (personnelData) setPersonnel(personnelData);
      if (rolesData) setRoles(rolesData);
      if (servicesData) setServices(servicesData);
      
      // Save to localStorage with separate keys
      saveToLocalStorage(STORAGE_KEYS.PERSONNEL_DATA, { personnel: personnelData });
      saveToLocalStorage(STORAGE_KEYS.ROLES_DATA, { roles: rolesData });
      saveToLocalStorage(STORAGE_KEYS.SERVICES_DATA, { services: servicesData });
    } catch (error) {
      console.error("Error fetching all data:", error);
      showToast("Error fetching data from server", "error");
    }
  };

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

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Fetch personnel from API
  const fetchPersonnelFromAPI = async () => {
    try {
      console.log("Fetching personnel from API");
      const response = await fetch(`${API_URL}/api/Personnel/all`);
      if (!response.ok) throw new Error('Failed to fetch personnel');
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching personnel:", error);
      showToast(error.message, "error");
      return null;
    }
  };

  // Fetch personnel (with localStorage check)
  const fetchPersonnel = async () => {
    const data = await fetchPersonnelFromAPI();
    if (data) {
      setPersonnel(data);
      saveToLocalStorage(STORAGE_KEYS.PERSONNEL_DATA, { personnel: data });
    }
  };

  // Fetch roles from API
  const fetchRolesFromAPI = async () => {
    try {
      console.log("Fetching roles from API");
      const response = await fetch(`${API_URL}/api/roles`);
      if (!response.ok) throw new Error('Failed to fetch roles');
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching roles:", error);
      showToast("Error loading roles", "error");
      return null;
    }
  };

  // Fetch services from API
  const fetchServicesFromAPI = async () => {
    try {
      console.log("Fetching services from API");
      const response = await fetch(`${API_URL}/api/services/all`);
      if (!response.ok) throw new Error('Failed to fetch services');
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching services:", error);
      showToast("Error loading services", "error");
      return null;
    }
  };

  // Handle role change
  const handleRoleChange = (e) => {
    const role = e.target.value;
    setSelectedRole(role);

    if (role === "Chef Hiérarchique" || role === "collaborateur") {
      setSelectedService(selectedService || "");
    } else {
      setSelectedService("");
    }
  };

  // Handle service change
  const handleServiceChange = (e, personId) => {
    const selectedServiceId = e.target.value;
    const selectedServiceObj = services.find((s) => s.serviceId === selectedServiceId);

    const updatedPersonnel = personnel.map((person) =>
      person.id === personId
        ? {
            ...person,
            service: selectedServiceObj,
            serviceId: selectedServiceId,
            serviceName: selectedServiceObj ? selectedServiceObj.serviceName : null,
          }
        : person,
    );

    setPersonnel(updatedPersonnel);
    setSelectedService(selectedServiceId);
    saveToLocalStorage(STORAGE_KEYS.PERSONNEL_DATA, { personnel: updatedPersonnel });
  };

  // Update personnel
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setUpdatingId(editingPersonnel.id);

    const updatedPersonnel = {
      ...editingPersonnel,
      role: selectedRole,
      serviceId:
        selectedRole === "collaborateur" || selectedRole === "Chef Hiérarchique"
          ? selectedService || editingPersonnel.serviceId
          : null,
    };

    for (const key in updatedPersonnel) {
      if (updatedPersonnel[key] === null || updatedPersonnel[key] === undefined) {
        delete updatedPersonnel[key];
      }
    }

    try {
      showToast("Updating personnel...", "info");

      const response = await fetch(`${API_URL}/api/Personnel/updateAllFields/${updatedPersonnel.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedPersonnel),
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(`Failed to update personnel: ${errorMsg}`);
      }

      const responseText = await response.text();
      let updatedData;
      try {
        updatedData = JSON.parse(responseText);
      } catch (error) {
        updatedData = { message: responseText };
      }

      const selectedServiceObj = services.find((s) => s.serviceId === selectedService);

      // Update only the specific personnel in state
      setPersonnel(prevPersonnel => 
        prevPersonnel.map(person =>
          person.id === updatedPersonnel.id
            ? {
                ...person,
                ...updatedPersonnel,
                service: selectedServiceObj,
                serviceId: selectedServiceObj?.serviceId || null,
                serviceName: selectedServiceObj?.serviceName || null,
              }
            : person
        )
      );

      // Update localStorage
      saveToLocalStorage(STORAGE_KEYS.PERSONNEL_DATA, { personnel: personnel.map(person =>
        person.id === updatedPersonnel.id
          ? {
              ...person,
              ...updatedPersonnel,
              service: selectedServiceObj,
              serviceId: selectedServiceObj?.serviceId || null,
              serviceName: selectedServiceObj?.serviceName || null,
            }
          : person
      )});

      showToast("Personnel updated successfully!", "success");
      setEditingPersonnel(null);
      setSelectedRole("");
      setSelectedService("");
    } catch (error) {
      console.error("Error updating personnel:", error);
      showToast(`Error updating personnel: ${error.message}`, "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle validation (activate/deactivate)
  const handleValidate = async (personnelId, action) => {
    setUpdatingId(personnelId);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        showToast("Please login first", "error");
        setUpdatingId(null);
        return;
      }

      showToast(`${action === "activate" ? "Activating" : "Deactivating"} personnel...`, "info");

      const response = await fetch(
        `${API_URL}/api/admin/${action === "activate" ? "activate" : "desactivate"}-personnel/${personnelId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body:
            action === "activate"
              ? JSON.stringify({
                  role: selectedRole,
                  serviceId: selectedService,
                })
              : null,
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${action} personnel`);
      }

      const result = await response.json();
      showToast(result.message, "success");

      // Update only the specific personnel in state
      setPersonnel(prevPersonnel =>
        prevPersonnel.map(person =>
          person.id === personnelId
            ? {
                ...person,
                active: action === "activate",
                role: action === "activate" ? selectedRole : person.role,
                service:
                  action === "activate" && selectedService
                    ? services.find((s) => s.serviceId === selectedService)
                    : person.service,
                serviceId: action === "activate" ? selectedService : person.serviceId,
                serviceName:
                  action === "activate" && selectedService
                    ? services.find((s) => s.serviceId === selectedService)?.serviceName
                    : person.serviceName,
              }
            : person
        )
      );

      // Update localStorage
      saveToLocalStorage(STORAGE_KEYS.PERSONNEL_DATA, { personnel: personnel.map(person =>
        person.id === personnelId
          ? {
              ...person,
              active: action === "activate",
              role: action === "activate" ? selectedRole : person.role,
              service:
                action === "activate" && selectedService
                  ? services.find((s) => s.serviceId === selectedService)
                  : person.service,
              serviceId: action === "activate" ? selectedService : person.serviceId,
              serviceName:
                action === "activate" && selectedService
                  ? services.find((s) => s.serviceId === selectedService)?.serviceName
                  : person.serviceName,
            }
          : person
      )});
    } catch (error) {
      showToast(error.message, "error");
      console.error(`Error ${action}ing personnel:`, error);
    } finally {
      setUpdatingId(null);
    }
  };
  // Handle cancel editing
  const handleCancelEdit = () => {
    setEditingPersonnel(null);
    setOpenDropdownId(null);
    setSelectedRole("");
    setSelectedService("");
  };

  // Initialize selectedRole and selectedService when editing
  useEffect(() => {
    if (editingPersonnel) {
      setSelectedRole(editingPersonnel.role || "");

      if (editingPersonnel.service && editingPersonnel.service.serviceId) {
        setSelectedService(editingPersonnel.service.serviceId);
      } else if (editingPersonnel.serviceId) {
        setSelectedService(editingPersonnel.serviceId);
      } else {
        setSelectedService("");
      }
    }
  }, [editingPersonnel]);

  // Reset all filters
  const resetFilters = () => {
    setFilterStatus("");
    setFilterMatricule("");
    setFilterName("");
    setFilterRole("");
    setFilterService("");
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Filter personnel based on filter values
  const filteredPersonnel = personnel.filter((person) => {
    const matchesStatus =
      filterStatus === "" ||
      (filterStatus === "active" && person.active) ||
      (filterStatus === "inactive" && !person.active);

    const matchesMatricule =
      filterMatricule === "" ||
      (person.matricule && person.matricule.toLowerCase().includes(filterMatricule.toLowerCase()));

    const matchesName =
      filterName === "" ||
      (person.nom && person.nom.toLowerCase().includes(filterName.toLowerCase())) ||
      (person.prenom && person.prenom.toLowerCase().includes(filterName.toLowerCase()));

    const matchesRole = filterRole === "" || (person.role && person.role === filterRole);

    const matchesService =
      filterService === "" ||
      (person.service && person.service.serviceId === filterService) ||
      (person.serviceId && person.serviceId === filterService);

    return matchesStatus && matchesMatricule && matchesName && matchesRole && matchesService;
  });

  // Calculate statistics
  const totalPersonnel = personnel.length;
  const activePersonnel = personnel.filter((person) => person.active).length;
  const inactivePersonnel = personnel.filter((person) => !person.active).length;

  // Pagination logic
  const totalPages = Math.ceil(filteredPersonnel.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPersonnel.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterMatricule, filterName, filterRole, filterService]);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are fewer than maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);

      // Calculate start and end of middle pages
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 4);
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3);
      }

      // Add ellipsis if needed before middle pages
      if (startPage > 2) {
        pageNumbers.push("...");
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // Add ellipsis if needed after middle pages
      if (endPage < totalPages - 1) {
        pageNumbers.push("...");
      }

      // Always show last page
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className={`dashboard-container ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Navbar theme={theme} toggleTheme={toggleTheme} />

        <div className="dashboard-content">
          {/* Toast Notification */}
          {toast.show && (
            <div className={`toast-notification ${toast.type}`}>
              <div className="toast-icon">
                {toast.type === "success" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                )}
                {toast.type === "error" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                )}
                {toast.type === "info" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                )}
              </div>
              <div className="toast-content">
                <p>{toast.message}</p>
              </div>
              <button className="toast-close" onClick={() => setToast({ show: false, message: "", type: "" })}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
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
          )}

          <div className="page-header">
            <h2 className="page-title">Personnel Management</h2>
          </div>

          {/* Statistics Cards */}
          <div className="stats-container">
            <div className="stat-card all">
              <h3>Total Personnel</h3>
              <div className="stat-value">{totalPersonnel}</div>
              <div className="stat-description">All registered personnel</div>
            </div>
            <div className="stat-card active">
              <h3>Active Personnel</h3>
              <div className="stat-value">{activePersonnel}</div>
              <div className="stat-description">Currently active personnel</div>
            </div>
            <div className="stat-card inactive">
              <h3>Inactive Personnel</h3>
              <div className="stat-value">{inactivePersonnel}</div>
              <div className="stat-description">Pending activation</div>
            </div>
          </div>
          <div className="page-header">
  <h2 className="page-title">Personnel Management</h2>
  <button 
    className="toggle-filters-button" 
    onClick={() => setShowFilters(!showFilters)}
  >
    {showFilters ? (
      <>
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
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        Hide Filters
      </>
    ) : (
      <>
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
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        Show Filters
      </>
    )}
  </button>
</div>
          {/* Enhanced Filtration Section */}
          {showFilters && (
          <div className="filtration-section">
            <div className="filtration-header">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              <h3>Filter Personnel</h3>
            </div>
            <div className="filtration-content">
              <div className="filtration-row">
                <div className="filter-group">
                  <label htmlFor="filterName">Name</label>
                  <div className="filter-input">
                    <svg
                      className="filter-icon"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <input
                      id="filterName"
                      type="text"
                      placeholder="Search by name..."
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="filter-group">
                  <label htmlFor="filterMatricule">Matricule</label>
                  <div className="filter-input">
                    <svg
                      className="filter-icon"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <input
                      id="filterMatricule"
                      type="text"
                      placeholder="Search by matricule..."
                      value={filterMatricule}
                      onChange={(e) => setFilterMatricule(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="filtration-row">
                <div className="filter-group">
                  <label htmlFor="filterStatus">Status</label>
                  <div className="filter-input">
                    <svg
                      className="filter-icon"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <select id="filterStatus" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                      <option value="">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="filter-group">
                  <label htmlFor="filterRole">Role</label>
                  <div className="filter-input">
                    <svg
                      className="filter-icon"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <select id="filterRole" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                      <option value="">All Roles</option>
                      {roles.map((role) => (
                        <option key={role.libelle} value={role.libelle}>
                          {role.libelle}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="filter-group">
                  <label htmlFor="filterService">Service</label>
                  <div className="filter-input">
                    <svg
                      className="filter-icon"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                    <select id="filterService" value={filterService} onChange={(e) => setFilterService(e.target.value)}>
                      <option value="">All Services</option>
                      {services.map((service) => (
                        <option key={service.serviceId} value={service.serviceId}>
                          {service.serviceName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="filter-actions">
                <button className="filter-button secondary" onClick={resetFilters}>
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
                    <path d="M2 12h6"></path>
                    <path d="M22 12h-6"></path>
                    <path d="M12 2v6"></path>
                    <path d="M12 22v-6"></path>
                    <path d="M20 16l-4-4 4-4"></path>
                    <path d="M4 8l4 4-4 4"></path>
                    <path d="M16 4l-4 4-4-4"></path>
                    <path d="M8 20l4-4 4 4"></path>
                  </svg>
                  Reset Filters
                </button>
              </div>
            </div>
            <div className="filter-results">
              <div className="results-count">
                Showing <strong>{indexOfFirstItem + 1}</strong> to{" "}
                <strong>{Math.min(indexOfLastItem, filteredPersonnel.length)}</strong> of{" "}
                <strong>{filteredPersonnel.length}</strong> personnel
              </div>
            </div>
          </div>)}

          {staffError && <div className="error-message">{staffError}</div>}

          {isLoading ? (
            <div className="table-loading">
              <div className="loading-spinner"></div>
              <p>Loading personnel data...</p>
            </div>
          ) : filteredPersonnel.length > 0 ? (
            <div className="table-container">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Matricule</th>
                    <th>Status</th>
                    <th>Role</th>
                    <th>Service</th>
                    <th>Validation</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((person) => (
                    <tr key={person.id}>
                      <td>
                        {person.nom || "Nom non disponible"} {person.prenom || ""}
                      </td>
                      <td>{person.email}</td>
                      <td>{person.matricule}</td>
                      <td>
                        <span className={`status-badge ${person.active ? "active" : "inactive"}`}>
                          {person.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        {person.active ? (
                          <span>{person.role}</span>
                        ) : (
                          <select
                            value={person.id === editingPersonnel?.id ? selectedRole : person.role || ""}
                            onChange={handleRoleChange}
                            disabled={person.active || !person.prenom}
                            className="scrollable-dropdown"
                          >
                            <option value="">Select Role</option>
                            {roles.map((role) => (
                              <option key={role.libelle} value={role.libelle}>
                                {role.libelle}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td>
                        {person.active ? (
                          <span>{person.serviceName || (person.service && person.service.serviceName) || "N/A"}</span>
                        ) : (
                          (selectedRole === "collaborateur" || selectedRole === "Chef Hiérarchique") && (
                            <select
                              value={selectedService || ""}
                              onChange={(e) => handleServiceChange(e, person.id)}
                              disabled={person.active || !person.prenom}
                              className="scrollable-dropdown"
                            >
                              <option value="">Select Service</option>
                              {services.map((service) => (
                                <option key={service.serviceId} value={service.serviceId}>
                                  {service.serviceName}
                                </option>
                              ))}
                            </select>
                          )
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-button activate"
                            onClick={() => handleValidate(person.id, "activate")}
                            disabled={person.active || !person.prenom || updatingId === person.id}
                          >
                            {updatingId === person.id ? (
                              <span className="row-spinner"></span>
                            ) : (
                              <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                Activate
                              </>
                            )}
                          </button>
                          <button
                            className="action-button deactivate"
                            onClick={() => handleValidate(person.id, "deactivate")}
                            disabled={!person.active || !person.prenom || updatingId === person.id}
                          >
                            {updatingId === person.id ? (
                              <span className="row-spinner"></span>
                            ) : (
                              <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="15" y1="9" x2="9" y2="15"></line>
                                  <line x1="9" y1="9" x2="15" y2="15"></line>
                                </svg>
                                Deactivate
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                      <td>
                        <button
                          className="action-button edit"
                          onClick={() => setEditingPersonnel(person)}
                          disabled={!person.prenom}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                          Modifie
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="pagination-container">
                <div className="pagination-info">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPersonnel.length)} of{" "}
                  {filteredPersonnel.length} entries
                </div>
                <div className="pagination-controls">
                  <button className="pagination-button" onClick={prevPage} disabled={currentPage === 1}>
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
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>

                  {getPageNumbers().map((number, index) =>
                    number === "..." ? (
                      <div key={`ellipsis-${index}`} className="pagination-ellipsis">
                        ...
                      </div>
                    ) : (
                      <button
                        key={number}
                        className={`pagination-button ${currentPage === number ? "active" : ""}`}
                        onClick={() => paginate(number)}
                      >
                        {number}
                      </button>
                    ),
                  )}

                  <button className="pagination-button" onClick={nextPage} disabled={currentPage === totalPages}>
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
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <svg
                className="empty-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <p className="empty-text">
                No personnel found matching your filters. Try adjusting your search criteria or reset the filters.
              </p>
              <button className="filter-button secondary" onClick={resetFilters}>
                Reset Filters
              </button>
            </div>
          )}

          {/* Modal for editing personnel */}
          {editingPersonnel && (
            <div className="modal-overlay">
              <div className="modal-container">
                <div className="modal-header">
                  <h3>Edit Personnel</h3>
                  <button className="close-button" onClick={handleCancelEdit}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
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
                <div className="edit-form">
                  <form onSubmit={handleUpdateSubmit}>
                    <div className="form-group">
                      <label htmlFor="matricule">Matricule:</label>
                      <input
                        id="matricule"
                        type="text"
                        value={editingPersonnel?.matricule || ""}
                        disabled={true}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="nom">Nom:</label>
                      <input
                        id="nom"
                        type="text"
                        value={editingPersonnel?.nom || ""}
                        onChange={(e) => setEditingPersonnel({ ...editingPersonnel, nom: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="prenom">Prénom:</label>
                      <input
                        id="prenom"
                        type="text"
                        value={editingPersonnel?.prenom || ""}
                        onChange={(e) => setEditingPersonnel({ ...editingPersonnel, prenom: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email:</label>
                      <input
                        id="email"
                        type="email"
                        value={editingPersonnel?.email || ""}
                        onChange={(e) => setEditingPersonnel({ ...editingPersonnel, email: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="date_naiss">Date de Naissance:</label>
                      <input
                        id="date_naiss"
                        type="date"
                        value={editingPersonnel?.date_naiss || ""}
                        onChange={(e) => setEditingPersonnel({ ...editingPersonnel, date_naiss: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="telephone">Téléphone:</label>
                      <input
                        id="telephone"
                        type="text"
                        value={editingPersonnel?.telephone || ""}
                        onChange={(e) => setEditingPersonnel({ ...editingPersonnel, telephone: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="CIN">CIN:</label>
                      <input
                        id="CIN"
                        type="text"
                        value={editingPersonnel?.CIN || ""}
                        onChange={(e) => setEditingPersonnel({ ...editingPersonnel, CIN: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="sexe">Sexe:</label>
                      <select
                        id="sexe"
                        value={editingPersonnel?.sexe || ""}
                        onChange={(e) => setEditingPersonnel({ ...editingPersonnel, sexe: e.target.value })}
                      >
                        <option value="">Select sexe</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="situation">Situation:</label>
                      <input
                        id="situation"
                        type="text"
                        value={editingPersonnel?.situation || ""}
                        onChange={(e) => setEditingPersonnel({ ...editingPersonnel, situation: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="nbr_enfants">Nombre d'enfants:</label>
                      <input
                        id="nbr_enfants"
                        type="number"
                        value={editingPersonnel?.nbr_enfants || ""}
                        onChange={(e) => setEditingPersonnel({ ...editingPersonnel, nbr_enfants: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="date_embauche">Date d'embauche:</label>
                      <input
                        id="date_embauche"
                        type="date"
                        value={editingPersonnel?.date_embauche || ""}
                        onChange={(e) => setEditingPersonnel({ ...editingPersonnel, date_embauche: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="role">Role:</label>
                      <select 
                        id="role" 
                        value={selectedRole || editingPersonnel?.role || ""} 
                        onChange={handleRoleChange}
                      >
                        <option value="">Select Role</option>
                        {roles.map((role) => (
                          <option key={role.libelle} value={role.libelle}>
                            {role.libelle}
                          </option>
                        ))}
                      </select>
                    </div>

                    {(selectedRole === "collaborateur" || selectedRole === "Chef Hiérarchique") && (
                      <div className="form-group">
                        <label htmlFor="service">Service:</label>
                        <select
                          id="service"
                          value={selectedService || ""}
                          onChange={(e) => setSelectedService(e.target.value)}
                        >
                          <option value="">Select Service</option>
                          {services.map((service) => (
                            <option key={service.serviceId} value={service.serviceId}>
                              {service.serviceName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="form-actions">
                      <button type="button" onClick={handleCancelEdit}>
                        Cancel
                      </button>
                      <button type="submit" disabled={updatingId === editingPersonnel.id}>
                        {updatingId === editingPersonnel.id ? <span className="row-spinner"></span> : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Personnel;