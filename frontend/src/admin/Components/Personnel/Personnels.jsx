import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import "./Personnels.css";

const Personnel = () => {
  const [personnel, setPersonnel] = useState([]);
  const [roles, setRoles] = useState([]);
  const [services, setServices] = useState([]);
  const [staffError, setStaffError] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [editingPersonnel, setEditingPersonnel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMatricule, setFilterMatricule] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterService, setFilterService] = useState("");

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/roles");
        if (response.ok) {
          const data = await response.json();
          setRoles(data || []);
        } else {
          console.error(`Failed to fetch roles. Status: ${response.status}`);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };
    fetchRoles();
  }, []);

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/services/all");
        if (response.ok) {
          const data = await response.json();
          setServices(data || []);
        } else {
          console.error(`Failed to fetch services. Status: ${response.status}`);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Fetch personnel
  useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/Personnel/all");
        if (response.ok) {
          const data = await response.json();
          setPersonnel(data || []);
          setStaffError(null);
        } else {
          setStaffError(`Failed to fetch personnel. Status: ${response.status}`);
        }
      } catch (error) {
        setStaffError("Error fetching personnel. Please try again later.");
      }
    };
    fetchPersonnel();
  }, []);

  // Handle role change
  const handleRoleChange = (e) => {
    const role = e.target.value;
    setSelectedRole(role);
  
    // Enable service selection for "chef hierarchique" or "collaborateur"
    if (role === "Chef Hiérarchique" || role === "collaborateur") {
      setSelectedService(selectedService || ""); // Keep the selected service if already selected
    } else {
      setSelectedService(""); // Reset service selection if not "chef hierarchique" or "collaborateur"
    }
  };
  
  // Handle service change
  const handleServiceChange = (e) => {
    setSelectedService(e.target.value);
  };

  // Handle validation (activate/deactivate)
  const handleValidate = async (personnelId, action) => {
    if (action === "activate") {
      if (!selectedRole) {
        alert("Please select a role before activating!");
        return;
      }
      // Only check for service if the role is "collaborateur"
      if ((selectedRole === "collaborateur" || selectedRole === "Chef Hiérarchique") && !selectedService) {
        alert("Please select a service before activating!");
        return;
      }
    }

    const endpoint =
      action === "activate"
        ? `http://localhost:8080/api/admin/activate-personnel/${personnelId}`
        : `http://localhost:8080/api/admin/desactivate-personnel/${personnelId}`;

    const method = "POST";
    const body =
      action === "activate"
        ? JSON.stringify({
            role: selectedRole,
            serviceId: selectedRole === "collaborateur" || selectedRole === "Chef Hiérarchique" ? selectedService : null,
          })
        : null;

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });

      const responseData = await response.json();

      if (response.ok) {
        setPersonnel((prevPersonnel) =>
          prevPersonnel.map((person) =>
            person.id === personnelId
              ? {
                  ...person,
                  active: action === "activate",
                  role: selectedRole,
                  service:
                    selectedRole === "collaborateur" || selectedRole === "Chef Hiérarchique"
                      ? services.find((s) => s.serviceId === selectedService)
                      : null,
                }
              : person
          )
        );
        alert(responseData.message || "Action completed successfully!");
      } else {
        alert(`Failed to ${action} personnel: ${responseData.message || "Unknown error"}`);
      }
    } catch (error) {
      alert(`Error ${action}ing personnel: ${error.message}`);
    }
  };

  // Handle the form submit for updating personnel
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    
    // Ensure serviceId is sent for the correct roles
    const updatedPersonnel = {
      ...editingPersonnel,
      role: selectedRole,
      serviceId: (selectedRole === "collaborateur" || selectedRole === "Chef Hiérarchique") 
        ? (selectedService || editingPersonnel.serviceId)  // Ensure a value is set
        : null,
    };
  
    try {
      const response = await fetch(
        `http://localhost:8080/api/personnel/updateAllFields/${updatedPersonnel.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedPersonnel),
        }
      );
  
      if (response.ok) {
        const updatedData = await response.json();
        setPersonnel((prevPersonnel) =>
          prevPersonnel.map((person) =>
            person.id === updatedPersonnel.id ? updatedData : person
          )
        );
        alert("Personnel updated successfully!");
        setEditingPersonnel(null);
        setSelectedRole("");
        setSelectedService("");
      } else {
        const errorMsg = await response.text();
        alert(`Failed to update personnel. Server Response: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Error updating personnel:", error);
      alert("Error updating personnel. Please try again.");
    }
  };
  
  // Handle cancel editing
  const handleCancelEdit = () => {
    setEditingPersonnel(null);
    setSelectedRole("");
    setSelectedService("");
  };

  // Initialize selectedRole and selectedService when editing
  useEffect(() => {
    if (editingPersonnel) {
      setSelectedRole(editingPersonnel.role || "");
      setSelectedService(editingPersonnel.service?.serviceId || "");
    }
  }, [editingPersonnel]);

  // Reset all filters
  const resetFilters = () => {
    setFilterStatus("");
    setFilterMatricule("");
    setFilterName("");
    setFilterRole("");
    setFilterService("");
  };

  // Filter personnel based on filter values
  const filteredPersonnel = personnel.filter((person) => {
    // Status filter
    const matchesStatus =
      filterStatus === "" ||
      (filterStatus === "active" && person.active) ||
      (filterStatus === "inactive" && !person.active);

    // Matricule filter
    const matchesMatricule = filterMatricule === "" || 
      (person.matricule && person.matricule.toLowerCase().includes(filterMatricule.toLowerCase()));

    // Name filter
    const matchesName = filterName === "" || 
      (person.nom && person.nom.toLowerCase().includes(filterName.toLowerCase())) ||
      (person.prenom && person.prenom.toLowerCase().includes(filterName.toLowerCase()));

    // Role filter
    const matchesRole = filterRole === "" || 
      (person.role && person.role === filterRole);

    // Service filter
    const matchesService = filterService === "" || 
      (person.service && person.service.serviceId === filterService);

    return matchesStatus && matchesMatricule && matchesName && matchesRole && matchesService;
  });

  // Calculate statistics
  const totalPersonnel = personnel.length;
  const activePersonnel = personnel.filter(person => person.active).length;
  const inactivePersonnel = personnel.filter(person => !person.active).length;

  // Display loading message if services are still being fetched
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading services...</p>
      </div>
    );
  }

  return (
    <div className="accueil-containerpp">
      <Navbar />
      <Sidebar />
      <div className="main-contentpp">
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

        {/* Enhanced Filtration Section */}
        <div className="filtration-section">
          <div className="filtration-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            <h3>Filter Personnel</h3>
          </div>
          <div className="filtration-content">
            <div className="filtration-row">
              <div className="filter-group">
                <label htmlFor="filterName">Name</label>
                <div className="filter-input">
                  <svg className="filter-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg className="filter-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg className="filter-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <select
                    id="filterStatus"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="filter-group">
                <label htmlFor="filterRole">Role</label>
                <div className="filter-input">
                  <svg className="filter-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <select
                    id="filterRole"
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                  >
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
                  <svg className="filter-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                  <select
                    id="filterService"
                    value={filterService}
                    onChange={(e) => setFilterService(e.target.value)}
                  >
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
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              Showing <strong>{filteredPersonnel.length}</strong> of <strong>{personnel.length}</strong> personnel
            </div>
          </div>
        </div>

        {staffError && <div className="error-message">{staffError}</div>}
        
        {filteredPersonnel.length > 0 ? (
          <div className="table-container">
            
  <table className="staff-table">
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
      {filteredPersonnel.map((person) => (
        <tr key={person.id}>
          <td>{person.nom || "Nom non disponible"} {person.prenom || ""}</td>
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
                value={selectedRole}
                onChange={handleRoleChange}
                disabled={person.active || !person.prenom}
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
              <span>{person.service?.serviceName || "N/A"}</span>
            ) : (
              (selectedRole === "collaborateur" || selectedRole === "Chef Hiérarchique") && (
                <select
                  value={selectedService}
                  onChange={handleServiceChange}
                  disabled={person.active || !person.prenom}
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
                disabled={person.active || !person.prenom}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Activate
              </button>
              <button
                className="action-button deactivate"
                onClick={() => handleValidate(person.id, "deactivate")}
                disabled={!person.active || !person.prenom}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                Deactivate
              </button>
            </div>
          </td>
          <td>
            <button
              className="action-button edit"
              onClick={() => setEditingPersonnel(person)}
              disabled={!person.prenom}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit
            </button>
          </td>
        </tr>
      ))}
  </table>
</div>
        ) : (
          <div className="empty-state">
            <svg className="empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            <p className="empty-text">No personnel found matching your filters. Try adjusting your search criteria or reset the filters.</p>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div className="edit-form">
                <form onSubmit={handleUpdateSubmit}>
                  <div className="form-group">
                    <label htmlFor="nom">Nom:</label>
                    <input
                      id="nom"
                      type="text"
                      value={editingPersonnel.nom || ""}
                      onChange={(e) =>
                        setEditingPersonnel({
                          ...editingPersonnel,
                          nom: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="prenom">Prénom:</label>
                    <input
                      id="prenom"
                      type="text"
                      value={editingPersonnel.prenom || ""}
                      onChange={(e) =>
                        setEditingPersonnel({
                          ...editingPersonnel,
                          prenom: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                      id="email"
                      type="email"
                      value={editingPersonnel.email || ""}
                      onChange={(e) =>
                        setEditingPersonnel({
                          ...editingPersonnel,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="role">Role:</label>
                    <select
                      id="role"
                      value={selectedRole}
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
                        value={selectedService}
                        onChange={handleServiceChange}
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
                    <button type="submit">Save Changes</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Personnel;
