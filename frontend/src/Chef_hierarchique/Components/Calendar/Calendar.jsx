import { useState, useEffect, useCallback } from "react";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiClock,
  FiCheck,
  FiX,
  FiLoader,
  FiFilter,
} from "react-icons/fi";
import "./Calendar.css";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import { API_URL } from "../../../config";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const CalendrierConge = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [theme, setTheme] = useState("light");
  const [filters, setFilters] = useState({
    dateRange: "current", // "current", "past", "future", "all"
  });
  const [viewMode, setViewMode] = useState("month"); // "month", "list"

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.className = savedTheme;
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  const calculateDuration = (startDate, endDate) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime())) throw new Error("Invalid start date");
      if (isNaN(end.getTime())) throw new Error("Invalid end date");
      const diffTime = Math.abs(end - start);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } catch (e) {
      console.error("Error calculating duration:", e);
      return 1;
    }
  };

  // Fetch annual leave data with caching and polling
const fetchLeaveData = useCallback(async () => {
  setLoading(true);
  setError(null);
  
  try {
    // First try to load from localStorage under 'approvedLeaves' key
    const cached = localStorage.getItem('approvedLeaves');
    console.log("Checking localStorage for approvedLeaves...");
    
    if (cached) {
      const parsedData = JSON.parse(cached);
      console.log("Found approvedLeaves in localStorage:", parsedData);
      
      if (Array.isArray(parsedData)) {
        const transformedData = transformLeaveData(parsedData);
        setLeaveData(transformedData);
        console.log("Using approvedLeaves from localStorage");
        setLoading(false);
        return;
      }
    }

    console.log("No valid approvedLeaves found in localStorage, fetching from API...");
    const token = localStorage.getItem("authToken");
    
    const response = await fetch(`${API_URL}/api/demande-conge/approved`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error(await response.text());
    
    const data = await response.json();
    console.log("API response data:", data);
    
    // Transform and set the new data
    const transformedData = transformLeaveData(data);
    setLeaveData(transformedData);
    
    // Save to localStorage under 'approvedLeaves' key
    localStorage.setItem("approvedLeaves", JSON.stringify(data));
    console.log("Saved approved leaves to localStorage");
    
  } catch (error) {
    console.error("Error fetching leave data:", error);
    setError(error.message);
    
    // If we have no cached data, show error to user
    const cached = localStorage.getItem('approvedLeaves');
    if (!cached) {
      toast.error("Erreur de chargement des congés");
    }
  } finally {
    setLoading(false);
  }
}, []);

// In your initial data loading useEffect
useEffect(() => {
  console.log("Initializing component...");
  
  // First try to load from localStorage under 'approvedLeaves' key
  const cached = localStorage.getItem('approvedLeaves');
  if (cached) {
    console.log("Found approvedLeaves in localStorage, loading initially");
    const parsedData = JSON.parse(cached);
    if (Array.isArray(parsedData)) {
      const transformedData = transformLeaveData(parsedData);
      setLeaveData(transformedData);
    }
  }

  // Then fetch from API
  fetchLeaveData();
  
  // Set up polling every 30 seconds
  const intervalId = setInterval(fetchLeaveData, 30000);
  console.log("Set up polling interval (30s)");

  return () => {
    clearInterval(intervalId);
    console.log("Cleaned up polling interval");
  };
}, [fetchLeaveData]);

  // Helper function to transform leave data with validation
const transformLeaveData = (data) => {
  return data.map(leave => {
    try {
      // Handle both API response and localStorage formats
      const startDate = leave.startDate || leave.start;
      const endDate = leave.endDate || leave.end;
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime())) throw new Error("Invalid start date");
      if (isNaN(end.getTime())) throw new Error("Invalid end date");
      
      return {
        id: leave.id || leave._id,
        employeeName: leave.employeeName || 
                     `${leave.employee?.nom || ''} ${leave.employee?.prenom || ''}`.trim() ||
                     `${leave.matPers?.nom || ''} ${leave.matPers?.prenom || ''}`.trim(),
        startDate: startDate,
        endDate: endDate,
        type: leave.type || "ANNUAL",
        status: leave.status || "ACCEPTED",
        duration: calculateDuration(startDate, endDate),
        department: leave.department || 
                   leave.employee?.serviceName || 
                   leave.matPers?.serviceName || 
                   "Unknown",
        approvedBy: leave.approvedBy || "System",
        description: leave.description || "Congé annuel"
      };
    } catch (e) {
      console.error("Invalid leave data:", leave, e);
      return null;
    }
  }).filter(Boolean);
};

  // Initial data fetch and setup polling
  useEffect(() => {
    console.log("Initializing component...");
    
    // First try to load from localStorage
    const cached = localStorage.getItem('demandes');
    if (cached) {
      console.log("Found cached data, loading initially from localStorage");
      const parsedData = JSON.parse(cached);
      if (parsedData.conge && parsedData.conge.length > 0) {
        const transformedData = transformLeaveData(parsedData.conge);
        setLeaveData(transformedData);
      }
    }

    // Then fetch from API
    fetchLeaveData();
    
    // Set up polling every 30 seconds
    const intervalId = setInterval(fetchLeaveData, 30000);
    console.log("Set up polling interval (30s)");

    return () => {
      clearInterval(intervalId);
      console.log("Cleaned up polling interval");
    };
  }, [fetchLeaveData]);
  // Calendar helper functions
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Filter functions
  const toggleFilters = () => setShowFilters(prev => !prev);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = (leaves) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return leaves.filter(leave => {
      try {
        if (!leave.startDate || !leave.endDate) return false;
        
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
        
        switch(filters.dateRange) {
          case "current":
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            return (start.getMonth() === currentMonth && start.getFullYear() === currentYear) || 
                   (end.getMonth() === currentMonth && end.getFullYear() === currentYear) ||
                   (start < new Date(currentYear, currentMonth, 1) && end > new Date(currentYear, currentMonth + 1, 0));
          case "past":
            return end < today;
          case "future":
            return start > today;
          default:
            return true;
        }
      } catch (e) {
        console.error("Error filtering leave:", leave, e);
        return false;
      }
    });
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];

      // Find leaves for this day with proper date validation
      const leavesOnDay = leaveData.filter(leave => {
        try {
          // Validate dates first
          if (!leave.startDate || !leave.endDate) return false;
          
          const startDate = new Date(leave.startDate);
          const endDate = new Date(leave.endDate);
          
          if (isNaN(startDate.getTime())) return false;
          if (isNaN(endDate.getTime())) return false;
          
          const leaveStart = startDate.toISOString().split('T')[0];
          const leaveEnd = endDate.toISOString().split('T')[0];
          
          return dateString >= leaveStart && dateString <= leaveEnd;
        } catch (e) {
          console.error("Invalid date in leave data:", leave, e);
          return false;
        }
      });

      const hasLeaves = leavesOnDay.length > 0;
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <div 
          key={day} 
          className={`calendar-day ${isToday ? "today" : ""} ${hasLeaves ? "has-leave" : ""}`}
        >
          <div className="day-number">{day}</div>
          {hasLeaves && (
            <>
              <div className="day-indicators">
                <div className="day-indicator accepted" title={`${leavesOnDay.length} congé(s)`}></div>
              </div>
              <div className="day-tooltip">
                <div className="tooltip-header">
                  {day} {monthNames[month]} {year}
                  <span className="tooltip-count"> ({leavesOnDay.length} congé{leavesOnDay.length > 1 ? 's' : ''})</span>
                </div>
                {leavesOnDay.map((leave, idx) => {
                  try {
                    const startDate = new Date(leave.startDate);
                    const endDate = new Date(leave.endDate);
                    
                    return (
                      <div key={idx} className="tooltip-item">
                        <FiUser className="icon" />
                        <div>
                          <div>{leave.employeeName}</div>
                          <div className="tooltip-dates">
                            {!isNaN(startDate.getTime()) ? startDate.toLocaleDateString("fr-FR") : 'Date invalide'} - {' '}
                            {!isNaN(endDate.getTime()) ? endDate.toLocaleDateString("fr-FR") : 'Date invalide'}
                          </div>
                        </div>
                      </div>
                    );
                  } catch (e) {
                    console.error("Error rendering leave tooltip:", leave, e);
                    return null;
                  }
                })}
              </div>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="calendar-container">
        <div className="calendar-header">
          <h2>{monthNames[month]} {year}</h2>
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
          {dayNames.map(day => (
            <div key={day} className="day-name">{day}</div>
          ))}
        </div>

        <div className="calendar-grid">{days}</div>
      </div>
    );
  };

  const renderLeavesList = () => {
    const filteredLeaves = applyFilters(leaveData);

    if (filteredLeaves.length === 0) {
      return (
        <div className="no-leaves">
          <p>Aucun congé trouvé pour les critères sélectionnés.</p>
        </div>
      );
    }

    return (
      <div className="leaves-list">
        {filteredLeaves.map((leave, index) => {
          try {
            const startDate = new Date(leave.startDate);
            const endDate = new Date(leave.endDate);
            
            return (
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
                      {!isNaN(startDate.getTime()) ? startDate.toLocaleDateString("fr-FR") : 'Date invalide'} - {' '}
                      {!isNaN(endDate.getTime()) ? endDate.toLocaleDateString("fr-FR") : 'Date invalide'}
                    </span>
                  </div>
                  <div className="leave-duration">
                    <FiClock className="icon" />
                    <span>{leave.duration} jour{leave.duration > 1 ? 's' : ''}</span>
                  </div>
                  <div className="leave-description">
                    <p>{leave.description}</p>
                  </div>
                </div>

                <div className="leave-card-footer">
                  <div className="leave-approved-by">
                    <span>Approuvé par: {leave.approvedBy}</span>
                  </div>
                </div>
              </div>
            );
          } catch (e) {
            console.error("Error rendering leave card:", leave, e);
            return null;
          }
        })}
      </div>
    );
  };

  const renderFilters = () => (
    <div className={`filters-panel ${showFilters ? "show" : ""}`}>
      <div className="filter-group">
        <label htmlFor="dateRange">Période</label>
        <select 
          id="dateRange" 
          name="dateRange" 
          value={filters.dateRange} 
          onChange={handleFilterChange}
        >
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
  );

  const renderLegend = () => (
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
  );

  // Show loading only when we have no cached data and are loading
  const showLoading = loading && leaveData.length === 0;

  if (showLoading) {
    return (
      <div className={`app-container ${theme}`}>
        <Sidebar theme={theme} />
        <div className="calendar-content">
          <Navbar theme={theme} toggleTheme={toggleTheme} />
          <div className="loading-container">
            <FiLoader className="loading-spinner" />
            <p>Chargement des congés...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && leaveData.length === 0) {
    return (
      <div className={`app-container ${theme}`}>
        <Sidebar theme={theme} />
        <div className="calendar-content">
          <Navbar theme={theme} toggleTheme={toggleTheme} />
          <div className="error-container">
            <FiX className="error-icon" />
            <p>Erreur: {error}</p>
            <button onClick={() => fetchLeaveData()}>Réessayer</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className="calendar-content">
        <Navbar theme={theme} toggleTheme={toggleTheme} />
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

          {renderFilters()}

          <div className="calendrier-content">
            {viewMode === "month" ? (
              <>
                <div className="calendar-section">
                  {renderCalendar()}
                  {renderLegend()}
                </div>
                <div className="leaves-section">
                  <h2>Congés Acceptés</h2>
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
        </div>
      </div>
    </div>
  );
};

export default CalendrierConge;