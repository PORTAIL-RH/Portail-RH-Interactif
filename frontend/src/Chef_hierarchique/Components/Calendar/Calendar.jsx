import { useState, useEffect } from "react"
import Sidebar from "../Sidebar/Sidebar"
import Navbar from "../Navbar/Navbar"
import { FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi"
import "./Calendar.css"

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 1, 1)) // February 2025
  const [selectedDate, setSelectedDate] = useState(null)
  const [filters, setFilters] = useState({
    specificDate: "",
    startDate: "",
    endDate: ""
  })
  const [approvedLeaves, setApprovedLeaves] = useState([]) // Store fetched approved leaves
  const [filteredLeaves, setFilteredLeaves] = useState([]) // Store filtered approved leaves
  const [userService, setUserService] = useState("") // Store logged-in user's service name

  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ]

  const daysOfWeek = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"]

  // Fetch approved leaves from the backend
  useEffect(() => {
    const fetchApprovedLeaves = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/demande-conge/approved")
        if (!response.ok) {
          throw new Error("Failed to fetch approved leaves")
        }
        const data = await response.json()
        setApprovedLeaves(data)
      } catch (error) {
        console.error("Error fetching approved leaves:", error)
      }
    }

    fetchApprovedLeaves()
  }, [])

  // Get logged-in user's service name from local storage
  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"))
    if (loggedInUser && loggedInUser.serviceName) {
      setUserService(loggedInUser.serviceName)
    }
  }, [])

  // Apply filters and filter by role and service
  useEffect(() => {
    applyFilters()
  }, [filters, approvedLeaves, userService])

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(clickedDate)

    // Find leave details for the clicked date
    const leaveDetails = filteredLeaves.find(leave => {
      const startDate = new Date(leave.dateDebut)
      const endDate = new Date(leave.dateFin)
      return clickedDate >= startDate && clickedDate <= endDate
    })

    // Display leave details in the sidebar
    if (leaveDetails) {
      const detailsSection = document.querySelector(".details-placeholder")
      detailsSection.innerHTML = `
        <h4>Détails du Congé</h4>
        <p><strong>Employé:</strong> ${leaveDetails.employee.nom} ${leaveDetails.employee.prenom}</p>
        <p><strong>Date de Début:</strong> ${new Date(leaveDetails.dateDebut).toLocaleDateString()}</p>
        <p><strong>Date de Fin:</strong> ${new Date(leaveDetails.dateFin).toLocaleDateString()}</p>
        <p><strong>Matricule:</strong> ${leaveDetails.employee.matricule}</p>
        <p><strong>Service:</strong> ${leaveDetails.employee.serviceName}</p>
      `
    }
  }

  const resetFilters = () => {
    setFilters({
      specificDate: "",
      startDate: "",
      endDate: ""
    })
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Apply filters to approved leaves
  const applyFilters = () => {
    let filtered = approvedLeaves

    // Filter by role and service
    if (userService) {
      filtered = filtered.filter(leave => {
        return (
          leave.employee.role === "Collaborateur" &&
          leave.employee.serviceName === userService
        )
      })
    }

    // Apply date filters
    if (filters.specificDate) {
      const specificDate = new Date(filters.specificDate)
      filtered = filtered.filter(leave => {
        const startDate = new Date(leave.dateDebut)
        const endDate = new Date(leave.dateFin)
        return specificDate >= startDate && specificDate <= endDate
      })
    }

    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate)
      const endDate = new Date(filters.endDate)
      filtered = filtered.filter(leave => {
        const leaveStartDate = new Date(leave.dateDebut)
        const leaveEndDate = new Date(leave.dateFin)
        return (
          (leaveStartDate >= startDate && leaveStartDate <= endDate) ||
          (leaveEndDate >= startDate && leaveEndDate <= endDate)
        )
      })
    }

    setFilteredLeaves(filtered)
  }

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const isApproved = filteredLeaves.some(leave => {
        const startDate = new Date(leave.dateDebut)
        const endDate = new Date(leave.dateFin)
        return date >= startDate && date <= endDate
      })

      days.push(
        <div
          key={day}
          className={`calendar-day ${isApproved ? "approved" : ""}`}
          onClick={() => handleDateClick(day)}
        >
          {day}
        </div>
      )
    }

    return days
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="calendar-container">
        <Navbar />
        <div className="calendar-content">
          <div className="filters-section">
            <h2>Filtres</h2>
            <div className="filters-grid">
              <div className="filter-group">
                <label>Date spécifique</label>
                <input
                  type="date"
                  name="specificDate"
                  value={filters.specificDate}
                  onChange={handleFilterChange}
                  placeholder="jj/mm/aaaa"
                />
              </div>
              <div className="filter-group">
                <label>De</label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  placeholder="jj/mm/aaaa"
                />
              </div>
              <div className="filter-group">
                <label>À</label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  placeholder="jj/mm/aaaa"
                />
              </div>
            </div>
            <button className="reset-button" onClick={resetFilters}>
              <FiX /> Réinitialiser
            </button>
          </div>

          <div className="calendar-layout">
            <div className="calendar-main">
              <div className="calendar-header">
                <h2>Calendrier</h2>
                <div className="month-navigation">
                  <button onClick={handlePrevMonth} className="nav-button">
                    <FiChevronLeft />
                  </button>
                  <span className="current-month">
                    {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </span>
                  <button onClick={handleNextMonth} className="nav-button">
                    <FiChevronRight />
                  </button>
                </div>
              </div>

              <div className="calendar-grid">
                {daysOfWeek.map(day => (
                  <div key={day} className="calendar-day-name">{day}</div>
                ))}
                {generateCalendarDays()}
              </div>

              <div className="calendar-legend">
                <div className="legend-item">
                  <div className="legend-color approved"></div>
                  <span>Congés Approuvés</span>
                </div>
              </div>
            </div>

            <div className="calendar-sidebar">
              {/* Total des Congés Approuvés Section */}
              <div className="sidebar-section">
                <h3>Total des Congés Approuvés</h3>
                <div className="leave-summary">
                  <div className="summary-item">
                    <span className="summary-label">Total</span>
                    <span className="summary-value">{filteredLeaves.length}</span>
                  </div>
                </div>
              </div>

              {/* Détails du Congé Section */}
              <div className="sidebar-section">
                <h3>Détails du Congé</h3>
                <p className="details-placeholder">
                  Sélectionnez une date avec un congé approuvé pour voir les détails.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Calendar