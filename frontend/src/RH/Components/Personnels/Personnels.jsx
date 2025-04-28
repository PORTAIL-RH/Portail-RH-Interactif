"use client"
import { useState, useEffect } from "react"
import Sidebar from "../Sidebar/Sidebar"
import Navbar from "../Navbar/Navbar"
import "./Personnels.css"
import PersonnelDetailsModal from "./PersonnelDetailsModal"
import { API_URL } from "../../../config"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const Personnel = () => {
  // Load initial personnel data from localStorage if available
  const [personnel, setPersonnel] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('personnelData')
      return cached ? JSON.parse(cached) : []
    }
    return []
  })
  
  const [roles, setRoles] = useState([])
  const [staffError, setStaffError] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  const [editingPersonnel, setEditingPersonnel] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedPersonnel, setSelectedPersonnel] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [theme, setTheme] = useState("light")
  const [isLoading, setIsLoading] = useState(false)

  // Filter states
  const [nameFilter, setNameFilter] = useState("")
  const [matriculeFilter, setMatriculeFilter] = useState("")

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    setTheme(savedTheme)
    applyTheme(savedTheme)

    const handleStorageChange = () => {
      const currentTheme = localStorage.getItem("theme") || "light"
      setTheme(currentTheme)
      applyTheme(currentTheme)
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("themeChanged", (e) => {
      setTheme(e.detail || "light")
      applyTheme(e.detail || "light")
    })

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("themeChanged", handleStorageChange)
    }
  }, [])

  const applyTheme = (theme) => {
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(theme)
    document.body.className = theme
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    applyTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }))
  }

  // Fetch roles with loading state and toast
  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoading(true)
      toast.info("Loading roles...", { autoClose: false, toastId: 'roles-loading' })
      try {
        const response = await fetch(`${API_URL}/api/roles`)
        if (response.ok) {
          const data = await response.json()
          setRoles(data || [])
          toast.dismiss('roles-loading')
          toast.success("Roles loaded successfully")
        } else {
          toast.dismiss('roles-loading')
          toast.error(`Failed to fetch roles. Status: ${response.status}`)
          console.error(`Failed to fetch roles. Status: ${response.status}`)
        }
      } catch (error) {
        toast.dismiss('roles-loading')
        toast.error("Error loading roles")
        console.error("Error fetching roles:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRoles()
  }, [])

  // Fetch all personnel - first from localStorage, then from API if needed
  const fetchPersonnel = async () => {
    setIsLoading(true)
    
    // Check if we have cached data
    const cachedPersonnel = localStorage.getItem('personnel')
    if (cachedPersonnel) {
      setPersonnel(JSON.parse(cachedPersonnel))
      setIsLoading(false)
    }
    
    try {
      const response = await fetch(`${API_URL}/api/Personnel/active`)
      if (response.ok) {
        const data = await response.json()
        setPersonnel(data || [])
        localStorage.setItem('personnelData', JSON.stringify(data)) // Cache the data
        setStaffError(null)
      } else {
        setStaffError(`Failed to fetch personnel. Status: ${response.status}`)
      }
    } catch (error) {
      setStaffError("Error fetching personnel. Please try again later.")
      console.error("Error fetching personnel:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch and setup polling
  useEffect(() => {
    // First try to load from localStorage
    const cachedPersonnel = localStorage.getItem('personnelData')
    if (!cachedPersonnel) {
      toast.info("Loading personnel data...", { autoClose: false, toastId: 'personnel-loading' })
    }
    
    fetchPersonnel().then(() => {
      toast.dismiss('personnel-loading')
    })

    // Set up polling every 10 seconds
    const intervalId = setInterval(fetchPersonnel, 10000)

    return () => clearInterval(intervalId)
  }, [])

  // Handle role change
  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value)
  }

  // Handle name filter change
  const handleNameFilterChange = (e) => {
    setNameFilter(e.target.value)
  }

  // Handle matricule filter change
  const handleMatriculeFilterChange = (e) => {
    setMatriculeFilter(e.target.value)
  }

  // Clear all filters
  const clearFilters = () => {
    setNameFilter("")
    setMatriculeFilter("")
  }

  // Handle the form submit for updating personnel
  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
    const updatedPersonnel = { ...editingPersonnel, role: selectedRole }
    
    setIsLoading(true)
    toast.info("Updating personnel...", { autoClose: false, toastId: 'update-loading' })
    
    try {
      const response = await fetch(`${API_URL}/api/personnel/updateAllFields/${updatedPersonnel.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedPersonnel),
      })

      if (response.ok) {
        const updatedData = await response.json()
        setPersonnel((prevPersonnel) =>
          prevPersonnel.map((person) => (person.id === updatedPersonnel.id ? updatedData : person)))
        
        // Update localStorage cache
        const updatedCache = personnel.map(person => 
          person.id === updatedPersonnel.id ? updatedData : person
        )
        localStorage.setItem('personnelData', JSON.stringify(updatedCache))
        
        toast.dismiss('update-loading')
        toast.success("Personnel updated successfully")
        setIsEditDialogOpen(false)
        setEditingPersonnel(null)
      } else {
        toast.dismiss('update-loading')
        toast.error("Failed to update personnel")
      }
    } catch (error) {
      toast.dismiss('update-loading')
      toast.error("Error updating personnel")
      console.error("Error updating personnel:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle edit button click
  const handleEditClick = (person) => {
    setEditingPersonnel(person)
    setSelectedRole(person.role || "")
    setIsEditDialogOpen(true)
  }

  // Handle cancel editing
  const handleCancelEdit = () => {
    setEditingPersonnel(null)
    setIsEditDialogOpen(false)
  }

  // Handle row click to open modal
  const handleRowClick = (person) => {
    setSelectedPersonnel(person)
    setIsModalOpen(true)
  }

  // Filter personnel based on name and matricule
  const filteredPersonnel = personnel.filter((person) => {
    const matchesName = person.nom ? person.nom.toLowerCase().includes(nameFilter.toLowerCase()) : true
    const matchesMatricule = person.matricule
      ? person.matricule.toLowerCase().includes(matriculeFilter.toLowerCase())
      : true
    return matchesName && matchesMatricule
  })

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className="personnel-container">
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <div className="personnel-content">
          {/* Loading overlay */}
          {isLoading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
            </div>
          )}
          
          {/* Toast container */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme={theme}
          />

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
                  <h2>All Personnel</h2>
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

                <div className="results-count">{filteredPersonnel.length} personnel found</div>
              </div>

              <div className="card-content">
                {staffError && <div className="error-message">{staffError}</div>}

                {filteredPersonnel.length > 0 ? (
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
                        {filteredPersonnel.map((person) => (
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
                            <td>{person.role}</td>
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
                    <p>No personnel found matching your filters.</p>
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
                    <button className="close-button" onClick={handleCancelEdit} aria-label="Close">
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
                      <div className="form-group">
                        <label htmlFor="role">Role</label>
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
                      <div className="form-actions">
                        <button type="button" className="cancel-button" onClick={handleCancelEdit}>
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
                theme={theme}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default Personnel