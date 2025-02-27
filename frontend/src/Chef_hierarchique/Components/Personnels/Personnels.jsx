import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import "./Personnels.css";

const Personnel = () => {
  const [personnel, setPersonnel] = useState([]);
  const [roles, setRoles] = useState([]);
  const [staffError, setStaffError] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [editingPersonnel, setEditingPersonnel] = useState(null); // Add state for editing

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

  // Filter activated personnel with role "collaborateur"
  const activatedCollaborateurs = personnel.filter(
    (person) => person.active && person.role === "collaborateur"
  );

  // Handle role change
  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
  };

  // Handle the form submit for updating personnel
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    const updatedPersonnel = { ...editingPersonnel, role: selectedRole }; // Add role if needed
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
        console.log("Updated Personnel:", updatedData); // Add a log to verify updated data

        setPersonnel((prevPersonnel) =>
          prevPersonnel.map((person) =>
            person.id === updatedPersonnel.id ? updatedData : person
          )
        );
        alert("Personnel updated successfully!");
        setEditingPersonnel(null); // Close the edit form
      } else {
        alert("Failed to update personnel.");
      }
    } catch (error) {
      console.error("Error updating personnel:", error);
      alert("Error updating personnel. Please try again.");
    }
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    setEditingPersonnel(null); // Close the edit form
  };

  return (
    <div className="accueil-containerpp">
      <Navbar />
      <Sidebar />
      <div className="main-contentpp">
        <h2>Activated Collaborateurs</h2>
        {staffError && <p className="error-message">{staffError}</p>}
        {activatedCollaborateurs.length > 0 ? (
          <table className="staff-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Matricule</th>
                <th>Status</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activatedCollaborateurs.map((person) => (
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
                    <button
                      onClick={() => setEditingPersonnel(person)} 
                      disabled={!person.nom}
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No activated collaborateurs found.</p>
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