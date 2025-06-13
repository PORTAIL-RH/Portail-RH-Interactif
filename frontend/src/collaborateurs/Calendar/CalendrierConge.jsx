

import { useState, useEffect } from "react"
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiClock,
  FiCheck,
  FiLoader,
  FiFilter,
  FiCheckCircle,
} from "react-icons/fi"
import "./CalendrierConge.css"
import "./days-used-summary.css"
import "../common-ui.css"
import { API_URL } from "../../config"

import Navbar from "../Components/Navbar/Navbar"
import Sidebar from "../Components/Sidebar/Sidebar"

const CalendrierConge = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [leaveData, setLeaveData] = useState([])
  const [daysUsedData, setDaysUsedData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingDaysUsed, setLoadingDaysUsed] = useState(true)
  const [error, setError] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    dateRange: "current",
  })
  const [viewMode, setViewMode] = useState("month")

  // Fetch days used data
  useEffect(() => {
    const fetchDaysUsedData = async () => {
      setLoadingDaysUsed(true)
      try {
        const token = localStorage.getItem("authToken")
        const userId = localStorage.getItem("userId")

        if (!userId) {
          // If no user ID, show empty calendar with default values
          setDaysUsedData({
            status: "success",
            totalDaysUsed: 0,
            maxDaysPerYear: 25,
            year: new Date().getFullYear(),
          })
          setLoadingDaysUsed(false)
          return
        }

        const response = await fetch(`${API_URL}/api/demande-conge/days-used/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          // If API fails, show empty calendar with default values
          console.warn("Days used API failed, showing empty calendar")
          setDaysUsedData({
            status: "success",
            totalDaysUsed: 0,
            maxDaysPerYear: 25,
            year: new Date().getFullYear(),
          })
          setLoadingDaysUsed(false)
          return
        }

        const data = await response.json()
        console.log("Days used data received:", data)
        setDaysUsedData(data)
        setLoadingDaysUsed(false)
      } catch (error) {
        console.warn("Error fetching days used, showing empty calendar:", error)
        // Show empty calendar with default values instead of error
        setDaysUsedData({
          status: "success",
          totalDaysUsed: 0,
          maxDaysPerYear: 25,
          year: new Date().getFullYear(),
        })
        setLoadingDaysUsed(false)
      }
    }

    fetchDaysUsedData()
  }, [])

  // Fetch annual leave data for the logged-in user
  useEffect(() => {
    const fetchLeaveData = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("authToken")
        const userId = localStorage.getItem("userId")

        if (!userId) {
          // If no user ID, show empty calendar
          setLeaveData([])
          setLoading(false)
          return
        }

        // Fetch only accepted leaves
        const acceptedResponse = await fetch(`${API_URL}/api/demande-conge/personnel/${userId}/accepted`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!acceptedResponse.ok) {
          // If API fails, show empty calendar
          console.warn("Leave data API failed, showing empty calendar")
          setLeaveData([])
          setLoading(false)
          return
        }

        const acceptedData = await acceptedResponse.json()

        // Transform the data
        const acceptedLeaves = acceptedData
          .filter((leave) => leave.typeDemande?.toLowerCase() === "congé")
          .map((leave) => ({
            id: leave.id,
            employeeName: `${leave.matPers?.nom || ""} ${leave.matPers?.prenom || ""}`.trim(),
            startDate: leave.dateDebut,
            endDate: leave.dateFin,
            type: "ANNUAL",
            status: "ACCEPTED",
            duration: leave.nbrJours || calculateDuration(leave.dateDebut, leave.dateFin),
            department: leave.matPers?.service?.serviceName || "Unknown",
            description: leave.description || "",
            approvedBy: leave.approvedBy || "",
          }))

        setLeaveData(acceptedLeaves)
        setLoading(false)
      } catch (error) {
        console.warn("Error fetching leave data, showing empty calendar:", error)
        // Show empty calendar instead of error
        setLeaveData([])
        setError(null) // Clear any previous errors
        setLoading(false)
      }
    }

    fetchLeaveData()
  }, [])

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  // Calendar helper functions
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay()

  const prevMonth = () => setCurrentDate((prev) => new Date(prev.setMonth(prev.getMonth() - 1)))
  const nextMonth = () => setCurrentDate((prev) => new Date(prev.setMonth(prev.getMonth() + 1)))
  const goToToday = () => setCurrentDate(new Date())

  // Filter functions
  const toggleFilters = () => setShowFilters((prev) => !prev)

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const applyFilters = (leaves) => {
    return leaves.filter((leave) => {
      // Date range filter
      const today = new Date()
      const startDate = new Date(leave.startDate)
      const endDate = new Date(leave.endDate)

      if (filters.dateRange === "current") {
        // Current month
        const currentMonth = today.getMonth()
        const currentYear = today.getFullYear()
        const leaveStartMonth = startDate.getMonth()
        const leaveStartYear = startDate.getFullYear()
        const leaveEndMonth = endDate.getMonth()
        const leaveEndYear = endDate.getFullYear()

        if (
          !(
            (leaveStartYear === currentYear && leaveStartMonth === currentMonth) ||
            (leaveEndYear === currentYear && leaveEndMonth === currentMonth) ||
            ((leaveStartYear < currentYear || (leaveStartYear === currentYear && leaveStartMonth < currentMonth)) &&
              (leaveEndYear > currentYear || (leaveEndYear === currentYear && leaveEndMonth > currentMonth)))
          )
        ) {
          return false
        }
      } else if (filters.dateRange === "past") {
        // Past leaves (end date is before today)
        if (endDate >= today) {
          return false
        }
      } else if (filters.dateRange === "future") {
        // Future leaves (start date is after today)
        if (startDate <= today) {
          return false
        }
      }

      return true
    })
  }

  const renderDaysUsedSummary = () => {
    if (loadingDaysUsed) {
      return (
        <div className="days-used-summary loading">
          <FiLoader className="loading-spinner" size={24} />
          <span>Chargement des données de congés...</span>
        </div>
      )
    }

    // Always show the summary, even if no data or API failed
    const { totalDaysUsed = 0, maxDaysPerYear = 25, year = new Date().getFullYear() } = daysUsedData || {}

    return (
      <div className="days-used-summary">
        <div className="summary-header">
          <h3>Récapitulatif des Congés {year}</h3>
        </div>

        <div className="summary-cards">
          <div className="summary-card used">
            <div className="card-icon">
              <FiCheckCircle />
            </div>
            <div className="card-content">
              <div className="card-value">{totalDaysUsed}</div>
              <div className="card-label">Jours Utilisés</div>
            </div>
          </div>

          <div className="summary-card total">
            <div className="card-icon">
              <FiCalendar />
            </div>
            <div className="card-content">
              <div className="card-value">{maxDaysPerYear}</div>
              <div className="card-label">Total Annuel</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderCalendar = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    const monthNames = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ]
    const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)

      // Find accepted leaves for this day (will be empty array if no data)
      const acceptedLeaves = leaveData.filter((leave) => {
        const start = new Date(leave.startDate)
        const end = new Date(leave.endDate)
        return date >= start && date <= end
      })

      const hasAccepted = acceptedLeaves.length > 0
      const isToday = new Date().toDateString() === date.toDateString()

      days.push(
        <div key={day} className={`calendar-day ${isToday ? "today" : ""} ${hasAccepted ? "has-accepted" : ""}`}>
          <div className="day-number">{day}</div>
          {hasAccepted && (
            <div className="day-indicators">
              <div className="day-indicator accepted" title="Congé Accepté"></div>
            </div>
          )}
        </div>,
      )
    }

    return (
      <div className="calendar-container">
        <div className="calendar-header">
          <h2>
            {monthNames[month]} {year}
          </h2>
          <div className="calendar-nav">
            <button onClick={prevMonth} className="nav-button">
              <FiChevronLeft />
            </button>
            <button onClick={goToToday} className="today-button">
              Aujourd'hui
            </button>
            <button onClick={nextMonth} className="nav-button">
              <FiChevronRight />
            </button>
          </div>
        </div>

        <div className="calendar-days-header">
          {dayNames.map((day) => (
            <div key={day} className="day-name">
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-grid">{days}</div>
      </div>
    )
  }

  const renderLeavesList = () => {
    const filteredLeaves = applyFilters(leaveData)

    if (filteredLeaves.length === 0) {
      return (
        <div className="no-leaves">
          <p>Aucun congé trouvé pour les critères sélectionnés.</p>
        </div>
      )
    }

    // Sort leaves by start date (most recent first)
    const sortedLeaves = [...filteredLeaves].sort((a, b) => new Date(b.startDate) - new Date(a.startDate))

    return (
      <div className="leaves-list">
        {sortedLeaves.map((leave, index) => (
          <div key={index} className="leave-card leave-accepted">
            <div className="leave-card-header">
              <div className="leave-employee">
                <FiUser className="icon" />
                <span>{leave.employeeName}</span>
              </div>
              <div className="leave-status accepted">
                <FiCheck className="icon" />
                <span>Accepté</span>
              </div>
            </div>

            <div className="leave-card-body">
              <div className="leave-dates">
                <FiCalendar className="icon" />
                <span>
                  {new Date(leave.startDate).toLocaleDateString("fr-FR")} -{" "}
                  {new Date(leave.endDate).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <div className="leave-duration">
                <FiClock className="icon" />
                <span>
                  {leave.duration} jour{leave.duration > 1 ? "s" : ""}
                </span>
              </div>
              {leave.description && (
                <div className="leave-description">
                  <p>{leave.description}</p>
                </div>
              )}
            </div>

            {leave.approvedBy && (
              <div className="leave-card-footer">
                <div className="leave-approved-by">
                  <span>Approuvé par: {leave.approvedBy}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderFilters = () => {
    return (
      <div className={`filters-panel ${showFilters ? "show" : ""}`}>
        <div className="filter-group">
          <label htmlFor="dateRange">Période</label>
          <select id="dateRange" name="dateRange" value={filters.dateRange} onChange={handleFilterChange}>
            <option value="all">Toutes les périodes</option>
            <option value="current">Mois courant</option>
            <option value="past">Passés</option>
            <option value="future">À venir</option>
          </select>
        </div>

        <div className="filter-group view-mode">
          <label>Mode d'affichage</label>
          <div className="view-mode-buttons">
            <button
              className={`view-mode-button ${viewMode === "month" ? "active" : ""}`}
              onClick={() => setViewMode("month")}
            >
              <FiCalendar />
              <span>Calendrier</span>
            </button>
            <button
              className={`view-mode-button ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <FiFilter />
              <span>Liste</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderLegend = () => {
    return (
      <div className="legend">
        <div className="legend-item">
          <div className="legend-color accepted"></div>
          <span>Congé Accepté</span>
        </div>
        <div className="legend-item today">
          <div className="legend-today"></div>
          <span>Aujourd'hui</span>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="calendar-content">
        <Navbar />
        <div className="calendrier-conge-content">
          <div className="page-header">
            <h1>Calendrier des Congés Acceptés</h1>
            <div className="header-actions">
              <button className="filter-toggle" onClick={toggleFilters}>
                <FiFilter />
                <span>Filtres</span>
              </button>
            </div>
          </div>

          {/* Days Used Summary Section - Always show */}
          {renderDaysUsedSummary()}

          {renderFilters()}

          {/* Always show calendar, even if loading or no data */}
          {loading ? (
            <div className="loading-container">
              <FiLoader className="loading-spinner" />
              <p>Chargement des données...</p>
            </div>
          ) : (
            <div className="calendrier-content">
              {viewMode === "month" ? (
                <>
                  <div className="calendar-section">
                    {renderCalendar()}
                    {renderLegend()}
                  </div>
                  <div className="leaves-section">
                    <h2>Mes Congés Acceptés</h2>
                    {renderLeavesList()}
                  </div>
                </>
              ) : (
                <div className="list-view">
                  <h2>Liste des Congés Acceptés</h2>
                  {renderLeavesList()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CalendrierConge
