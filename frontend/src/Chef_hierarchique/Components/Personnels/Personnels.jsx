import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import PersonnelDetailsModal from "./PersonnelsDetailsModal"; // Adjust the path as necessary
import "./Personnels.css";

const Personnel = () => {
  const [personnel, setPersonnel] = useState([]);
  const [roles, setRoles] = useState([]);
  const [staffError, setStaffError] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [editingPersonnel, setEditingPersonnel] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter states
  const [nameFilter, setNameFilter] = useState("");
  const [matriculeFilter, setMatriculeFilter] = useState("");

  // Retrieve userService from localStorage and parse it
  const userService = JSON.parse(localStorage.getItem("userService") || "{}");
  const connectedUserServiceName = userService?.serviceName || ""; // Extract serviceName from userService

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

  // Filter activated personnel with role "collaborateur" and matching serviceName
  const filteredCollaborateurs = personnel.filter(
    (person) => 
      person.active && 
      person.role === "collaborateur" &&
      person.serviceName === connectedUserServiceName && // Filter by serviceName
      (nameFilter === "" || 
        (person.nom && person.nom.toLowerCase().includes(nameFilter.toLowerCase())) ||
        (person.prenom && person.prenom.toLowerCase().includes(nameFilter.toLowerCase()))
      ) &&
      (matriculeFilter === "" || 
        (person.matricule && person.matricule.toLowerCase().includes(matriculeFilter.toLowerCase()))
      )
  );

  // Handle role change
  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
  };

  // Handle name filter change
  const handleNameFilterChange = (e) => {
    setNameFilter(e.target.value);
  };

  // Handle matricule filter change
  const handleMatriculeFilterChange = (e) => {
    setMatriculeFilter(e.target.value);
  };

  // Clear all filters
  const clearFilters = () => {
    setNameFilter("");
    setMatriculeFilter("");
  };

  // Handle the form submit for updating personnel
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    const updatedPersonnel = { ...editingPersonnel, role: selectedRole };
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
        console.log("Updated Personnel:", updatedData);

        setPersonnel((prevPersonnel) =>
          prevPersonnel.map((person) =>
            person.id === updatedPersonnel.id ? updatedData : person
          )
        );
        setIsEditDialogOpen(false);
        setEditingPersonnel(null);
      } else {
        alert("Failed to update personnel.");
      }
    } catch (error) {
      console.error("Error updating personnel:", error);
      alert("Error updating personnel. Please try again.");
    }
  };

  // Handle edit button click
  const handleEditClick = (person) => {
    setEditingPersonnel(person);
    setSelectedRole(person.role || "");
    setIsEditDialogOpen(true);
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    setEditingPersonnel(null);
    setIsEditDialogOpen(false);
  };

  // Handle row click to open modal
  const handleRowClick = (person) => {
    setSelectedPersonnel(person);
    setIsModalOpen(true);
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="personnel-container">
        <Navbar />
        <div className="personnel-content">
          <header className="page-header">
            <h1>Personnel Management</h1>
          </header>
          <main className="personnel-main">
            <div className="personnel-card">
              <div className="card-header">
                <div className="header-title">
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
                    className="icon"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <h2>Activated Collaborateurs</h2>
                </div>
              </div>
              
              {/* Filter section */}
              <div className="filter-section">
                <div className="filter-group">
                  <div className="filter-input-group">
                    <label htmlFor="nameFilter">Name</label>
                    <div className="input-with-icon">
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
                        className="input-icon"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <input
                        id="nameFilter"
                        type="text"
                        placeholder="Filter by name..."
                        value={nameFilter}
                        onChange={handleNameFilterChange}
                      />
                    </div>
                  </div>
                  
                  <div className="filter-input-group">
                    <label htmlFor="matriculeFilter">Matricule</label>
                    <div className="input-with-icon">
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
                        className="input-icon"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      <input
                        id="matriculeFilter"
                        type="text"
                        placeholder="Filter by matricule..."
                        value={matriculeFilter}
                        onChange={handleMatriculeFilterChange}
                      />
                    </div>
                  </div>
                  
                  <button className="clear-filter-button" onClick={clearFilters}>
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
                      className="button-icon"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Clear Filters
                  </button>
                </div>
                
                <div className="results-count">
                  {filteredCollaborateurs.length} collaborateurs found
                </div>
              </div>
              
              <div className="card-content">
                {staffError && <div className="error-message">{staffError}</div>}

                {filteredCollaborateurs.length > 0 ? (
                  <div className="table-container">
                    <table className="personnel-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Matricule</th>
                          <th>Status</th>
                          <th>Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCollaborateurs.map((person) => (
                          <tr key={person.id} onClick={() => handleRowClick(person)}>
                            <td className="name-cell">
                              {person.nom || "Nom non disponible"}
                              {person.prenom && <span className="prenom">{person.prenom}</span>}
                            </td>
                            <td>{person.email}</td>
                            <td>{person.matricule}</td>
                            <td>
                              <span className={`status-badge ${person.active ? "active" : "inactive"}`}>
                                {person.active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td>
                            {person.role}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="no-data-message">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="empty-icon"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                    <p>No collaborateurs found matching your filters.</p>
                    <button className="clear-filter-button" onClick={clearFilters}>
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal for editing personnel */}
            {isEditDialogOpen && (
              <div className="modal-overlay">
                <div className="modal-container">
                  <div className="modal-header">
                    <h3>Edit Personnel</h3>
                    <button
                      className="close-button"
                      onClick={handleCancelEdit}
                      aria-label="Close"
                    >
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
                  {editingPersonnel && (
                    <form onSubmit={handleUpdateSubmit} className="edit-form">
                      <div className="form-group">
                        <label htmlFor="nom">Nom</label>
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
                        <label htmlFor="prenom">Prénom</label>
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
                        <label htmlFor="email">Email</label>
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
                      <div className="form-actions">
                        <button
                          type="button"
                          className="cancel-button"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="save-button">
                          Save Changes
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Modal for personnel details */}
            {isModalOpen && selectedPersonnel && (
              <PersonnelDetailsModal
                key={selectedPersonnel.id}
                personnel={selectedPersonnel}
                onClose={() => setIsModalOpen(false)}
                // Add other necessary props like onApprove, onReject, isActionable if needed
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Personnel;