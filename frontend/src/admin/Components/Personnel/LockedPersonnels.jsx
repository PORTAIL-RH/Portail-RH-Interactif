import { useState, useEffect } from "react"
import Sidebar from "../Sidebar/Sidebar"
import Navbar from "../Navbar/Navbar"
import "./Personnels.css" // Reusing the same CSS
import { API_URL } from "../../../config"

const LockedAccounts = () => {
  const [lockedAccounts, setLockedAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState({ show: false, message: "", type: "" })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [filterMatricule, setFilterMatricule] = useState("")
  const [filterName, setFilterName] = useState("")
  const [theme, setTheme] = useState("light")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [unlockingId, setUnlockingId] = useState(null)

  useEffect(() => {
    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail)
    }

    window.addEventListener('sidebarToggled', handleSidebarToggle)
    
    return () => {
      window.removeEventListener('sidebarToggled', handleSidebarToggle)
    }
  }, [])

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

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" })
    }, 3000)
  }

  // Fetch locked accounts
  const fetchLockedAccounts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/Personnel/locked-accounts`)
      if (!response.ok) {
        throw new Error("Failed to fetch locked accounts")
      }
      const data = await response.json()
      setLockedAccounts(data || [])
    } catch (error) {
      console.error("Error fetching locked accounts:", error)
      showToast(error.message, "error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLockedAccounts()
  }, [])

  // Unlock account
  const handleUnlockAccount = async (matricule) => {
    setUnlockingId(matricule)
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        showToast("Please login first", "error")
        setUnlockingId(null)
        return
      }

      showToast("Unlocking account...", "info")

      const response = await fetch(`${API_URL}/api/Personnel/unlock-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ matricule }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to unlock account")
      }

      const result = await response.json()
      showToast(result.message, "success")

      // Update the local state instead of refetching
      setLockedAccounts(prev => prev.filter(account => account.matricule !== matricule))
    } catch (error) {
      showToast(error.message, "error")
      console.error("Error unlocking account:", error)
    } finally {
      setUnlockingId(null)
    }
  }

  // Reset filters
  const resetFilters = () => {
    setFilterMatricule("")
    setFilterName("")
    setCurrentPage(1)
  }

  // Filter locked accounts
  const filteredAccounts = lockedAccounts.filter((account) => {
    const matchesMatricule =
      filterMatricule === "" ||
      (account.matricule && account.matricule.toLowerCase().includes(filterMatricule.toLowerCase()))

    const matchesName =
      filterName === "" ||
      (account.fullName && account.fullName.toLowerCase().includes(filterName.toLowerCase()))

    return matchesMatricule && matchesName
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredAccounts.slice(indexOfFirstItem, indexOfLastItem)

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber)
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1))

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterMatricule, filterName])

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      pageNumbers.push(1)

      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)

      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 4)
      }

      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3)
      }

      if (startPage > 2) {
        pageNumbers.push("...")
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }

      if (endPage < totalPages - 1) {
        pageNumbers.push("...")
      }

      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }


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
            <h2 className="page-title">Locked Accounts Management</h2>
          </div>

          {/* Statistics Card */}
          <div className="stats-container">
            <div className="stat-card inactive">
              <h3>Locked Accounts</h3>
              <div className="stat-value">{lockedAccounts.length}</div>
              <div className="stat-description">Accounts currently locked</div>
            </div>
          </div>

          {/* Enhanced Filtration Section */}
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
              <h3>Filter Locked Accounts</h3>
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
                <strong>{Math.min(indexOfLastItem, filteredAccounts.length)}</strong> of{" "}
                <strong>{filteredAccounts.length}</strong> locked accounts
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="table-loading">
              <div className="loading-spinner"></div>
              <p>Loading locked accounts...</p>
            </div>
          ) : filteredAccounts.length > 0 ? (
            <div className="table-container">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Matricule</th>
                    <th>Lock Reason</th>
                    <th>Failed Attempts</th>
                    <th>Lock Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((account) => (
                    <tr key={account.matricule}>
                      <td>{account.fullName}</td>
                      <td>{account.email}</td>
                      <td>{account.matricule}</td>
                      <td>{account.lockReason || "Too many failed attempts"}</td>
                      <td>{account.failedAttempts || "N/A"}</td>
                      <td>
                        {account.lockTime ? new Date(account.lockTime).toLocaleString() : "N/A"}
                      </td>
            
                      <td>
                        <button
                          className="action-button activate"
                          onClick={() => handleUnlockAccount(account.matricule)}
                          disabled={unlockingId === account.matricule}
                        >
                          {unlockingId === account.matricule ? (
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
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                              </svg>
                              Unlock
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="pagination-container">
                <div className="pagination-info">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredAccounts.length)} of{" "}
                  {filteredAccounts.length} entries
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
                No locked accounts found matching your filters. Try adjusting your search criteria or reset the filters.
              </p>
              <button className="filter-button secondary" onClick={resetFilters}>
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LockedAccounts