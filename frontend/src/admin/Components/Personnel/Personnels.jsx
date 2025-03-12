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
      if (selectedRole === "collaborateur" || selectedRole ==="Chef Hiérarchique" && !selectedService) {
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
            serviceId: selectedRole === "collaborateur"|| selectedRole ==="Chef Hiérarchique" ? selectedService : null, // Only send serviceId for Collaborateur
          })
        : null;
        //console to check
        console.log("Request Body:", JSON.stringify({
          role: selectedRole,
          serviceId: selectedRole === "collaborateur" || selectedRole === "Chef Hiérarchique" ? selectedService : null,
        }));

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
                    selectedRole === "collaborateur" || selectedRole ==="Chef Hiérarchique"
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

  // Filter personnel based on filter values
  const filteredPersonnel = personnel.filter((person) => {
    const matchesMatricule = person.matricule
      ? person.matricule.toLowerCase().includes(filterMatricule.toLowerCase())
      : true; // If no filter, include all

    const matchesStatus =
      filterStatus === "" ||
      (filterStatus === "active" && person.active) ||
      (filterStatus === "inactive" && !person.active);

    return matchesMatricule && matchesStatus;
  });

  // Display loading message if services are still being fetched
  if (isLoading) {
    return <p>Loading services...</p>;
  }

  return (
    <div className="accueil-containerpp">
      <Navbar />
      <Sidebar />
      <div className="main-contentpp">
        <h2>La liste des personnels</h2>

        {/* Filtration Bar */}
        <div className="filtration-bar">
  <input
    type="text"
    placeholder="Filter by Matricule"
    value={filterMatricule}
    onChange={(e) => setFilterMatricule(e.target.value)}
  />
  <select
    value={filterStatus}
    onChange={(e) => setFilterStatus(e.target.value)}
  >
    <option value="">All Statuses</option>
    <option value="active">Active</option>
    <option value="inactive">Inactive</option>
  </select>
</div>

        {staffError && <p className="error-message">{staffError}</p>}
        {filteredPersonnel.length > 0 ? (
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
              {filteredPersonnel.map((person) => (
                <tr key={person.id}>
                  <td>{person.nom || "Nom non disponible"}</td>
                  <td>{person.email}</td>
                  <td>{person.matricule}</td>
                  <td className={person.active ? "active" : "inactive"}>
                    {person.active ? "Active" : "Inactive"}
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
                    <button
                      onClick={() => handleValidate(person.id, "activate")}
                      disabled={person.active || !person.prenom}
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => handleValidate(person.id, "deactivate")}
                      disabled={!person.active || !person.prenom}
                    >
                      Deactivate
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => setEditingPersonnel(person)}
                      disabled={!person.prenom}
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No staff members found.</p>
        )}

        {/* Form for editing personnel */}
        {editingPersonnel && (
          <div className="edit-form">
            <h3>Edit Personnel</h3>
            <form onSubmit={handleUpdateSubmit}>
              <label>Nom:</label>
              <input
                type="text"
                value={editingPersonnel.nom}
                onChange={(e) =>
                  setEditingPersonnel({
                    ...editingPersonnel,
                    nom: e.target.value,
                  })
                }
              />
              <label>Prénom:</label>
              <input
                type="text"
                value={editingPersonnel.prenom}
                onChange={(e) =>
                  setEditingPersonnel({
                    ...editingPersonnel,
                    prenom: e.target.value,
                  })
                }
              />
              <label>Email:</label>
              <input
                type="email"
                value={editingPersonnel.email}
                onChange={(e) =>
                  setEditingPersonnel({
                    ...editingPersonnel,
                    email: e.target.value,
                  })
                }
              />
              <label>Role:</label>
              <select
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
              {selectedRole === "collaborateur"  && (
                <>
                  <label>Service:</label>
                  <select
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
                </>
              )}
              {selectedRole === "Chef Hiérarchique"  && (
                <>
                  <label>Service:</label>
                  <select
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
                </>
              )}
              <div className="form-actions">
                <button type="submit">Save Changes</button>
                <button type="button" onClick={handleCancelEdit}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Personnel;