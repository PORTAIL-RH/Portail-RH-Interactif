import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import "./Personnels.css";

const Personnel = () => {
  const [personnel, setPersonnel] = useState([]);
  const [roles, setRoles] = useState([]);
  const [staffError, setStaffError] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

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
        const response = await fetch(
          "http://localhost:8080/api/Personnel/all"
        );
        if (response.ok) {
          const data = await response.json();
          setPersonnel(data || []);
          setStaffError(null);
        } else {
          setStaffError(`Failed to fetch personnel. Status: ${response.status}`);
        }
      } catch (error) {
        setStaffError(
          "Error fetching personnel. Please try again later."
        );
      }
    };
    fetchPersonnel();
  }, []);

  // Handle role change
  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
  };

  // Handle activation and assign role
// Handle activation and assign role
const handleValidate = async (personnelId, action) => {
  if (action === "activate" && !selectedRole) {
    alert("Please select a role before activating!");
    return;
  }

  const endpoint =
    action === "activate"
      ? `http://localhost:8080/api/admin/activate-personnel/${personnelId}`
      : `http://localhost:8080/api/admin/desactivate-personnel/${personnelId}`;

  const method = action === "activate" ? "POST" : "POST"; // Use "DELETE" for deactivation if needed
  const body =
    action === "activate"
      ? JSON.stringify({ libelle: selectedRole })
      : null;

  try {
    const response = await fetch(endpoint, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    });

    if (response.ok) {
      setPersonnel((prevPersonnel) =>
        prevPersonnel.map((person) =>
          person.id === personnelId
            ? { ...person, active: action === "activate", role: selectedRole }
            : person
        )
      );
    } else {
      console.error(`Failed to ${action} personnel.`);
    }
  } catch (error) {
    console.error(`Error ${action}ing personnel:`, error);
  }
};

  return (
    <div className="accueil-container">
      <Navbar />
      <Sidebar />
      <div className="main-content">
        <h2>La liste des personnels</h2>
        {staffError && <p className="error-message">{staffError}</p>}
        {personnel.length > 0 ? (
          <table className="staff-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Matricule</th>
                <th>Status</th>
                <th>Role</th>
                <th>Validation</th>
              </tr>
            </thead>
            <tbody>
              {personnel.map((person) => (
                <tr key={person.id}>
                  <td>{person.prenom}</td>
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
                        disabled={person.active}
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
                      onClick={() => handleValidate(person.id, "activate")}
                      disabled={person.active}
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => handleValidate(person.id, "deactivate")}
                      disabled={!person.active}
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No staff members found.</p>
        )}
      </div>
    </div>
  );
};

export default Personnel;
