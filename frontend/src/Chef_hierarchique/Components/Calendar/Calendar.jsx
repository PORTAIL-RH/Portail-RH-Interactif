import { useState, useEffect } from "react";
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
import { toast } from "react-toastify";
import "./Calendar.css";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import { API_URL } from "../../../config";
import "../../Colors.css";

const CalendrierConge = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [theme, setTheme] = useState("light");

  const [filters, setFilters] = useState({
    dateRange: "current",
  });
  const [viewMode, setViewMode] = useState("month");

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    applyTheme(savedTheme);

    const handleStorageChange = () => {
      const currentTheme = localStorage.getItem("theme") || "light";
      setTheme(currentTheme);
      applyTheme(currentTheme);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("themeChanged", (e) => {
      setTheme(e.detail || "light");
      applyTheme(e.detail || "light");
    });

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("themeChanged", handleStorageChange);
    };
  }, []);

  const applyTheme = (theme) => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    document.body.className = theme;
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }));
  };

  const getUserId = () => {
    try {
      const userData = localStorage.getItem("userId");
      if (!userData) return null;
      
      try {
        const parsed = JSON.parse(userData);
        return parsed?.userId || parsed?.id || null;
      } catch {
        return userData;
      }
    } catch (e) {
      console.error("Error reading userId from localStorage:", e);
      return null;
    }
  };

  const userId = getUserId();

  // Transform leave data to consistent format

useEffect(() => {
  const fetchLeaveData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check localStorage for cached data under "approvedLeaves"
      const cachedData = localStorage.getItem("approvedLeaves");
      const cacheTimestamp = localStorage.getItem("approvedLeavesTimestamp");
      const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      // Use cached data if it exists and is less than 1 day old
      if (cachedData && cacheTimestamp && (Date.now() - parseInt(cacheTimestamp))) {
        const parsedData = JSON.parse(cachedData);
        setLeaveData(transformLeaveData(parsedData));
        setLoading(false);
        
        // Fetch fresh data in background
        fetchFreshData();
      } else {
        // If no valid cached data, fetch from API
        await fetchFreshData();
      }
    } catch (error) {
      console.error("Error in initial data fetch:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchFreshData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }
      
      const response = await fetch(`${API_URL}/api/demande-conge/collaborateurs-by-service/${userId}/approved`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch leave data: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform and set data
      const transformedData = transformLeaveData(data);
      setLeaveData(transformedData);
      
      // Cache the data in localStorage
      localStorage.setItem("approvedLeaves", JSON.stringify(data));
      localStorage.setItem("approvedLeavesTimestamp", Date.now().toString());
    } catch (error) {
      console.error("Error fetching fresh leave data:", error);
      if (leaveData.length === 0) {
        setError("Impossible de charger les données. Veuillez vérifier votre connexion.");
      } else {
        toast.warning("Les données peuvent ne pas être à jour. Vérifiez votre connexion.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (userId) {
    fetchLeaveData();
  } else {
    setError("Identifiant utilisateur non trouvé");
    setLoading(false);
  }
}, [userId]);

  // Enhanced transformLeaveData function
  const transformLeaveData = (rawData) => {
    // Handle both array and object with demandes property
    const rawLeaves = Array.isArray(rawData) ? rawData : (rawData.demandes || []);
    
    return rawLeaves.map(leave => {
      // Extract employee name from nested structure if available
      let employeeName = "";
      if (leave.matPers) {
        employeeName = `${leave.matPers.nom || ''} ${leave.matPers.prenom || ''}`.trim();
      } else if (leave.personnel) {
        employeeName = `${leave.personnel.nom || ''} ${leave.personnel.prenom || ''}`.trim();
      }
      
      return {
        id: leave.id || leave._id,
        employeeName: employeeName || "Inconnu",
        startDate: leave.dateDebut,
        endDate: leave.dateFin,
        type: leave.typeConge?.nom || "ANNUAL",
        status: leave.statut || "ACCEPTED",
        duration: calculateDuration(leave.dateDebut, leave.dateFin),
        department: leave.matPers?.serviceName || leave.service?.nom || "Unknown",
        approvedBy: leave.approuvePar || "Manager",
        description: leave.texteDemande || leave.motif || "Congé annuel"
      };
    });
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // Calendar functions
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Filters
  const toggleFilters = () => setShowFilters(prev => !prev);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = (leaves) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return leaves.filter(leave => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      
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

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];

      const leavesOnDay = leaveData.filter(leave => {
        const leaveStart = new Date(leave.startDate).toISOString().split('T')[0];
        const leaveEnd = new Date(leave.endDate).toISOString().split('T')[0];
        return dateString >= leaveStart && dateString <= leaveEnd;
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
                {leavesOnDay.map((leave, idx) => (
                  <div key={idx} className="tooltip-item">
                    <FiUser className="icon" />
                    <div>
                      <div>{leave.employeeName}</div>
                      <div className="tooltip-dates">
                        {new Date(leave.startDate).toLocaleDateString("fr-FR")} - {' '}
                        {new Date(leave.endDate).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  </div>
                ))}
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
        {filteredLeaves.map((leave, index) => (
          <div key={leave.id || index} className="leave-card leave-accepted">
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
                  {new Date(leave.startDate).toLocaleDateString("fr-FR")} - {' '}
                  {new Date(leave.endDate).toLocaleDateString("fr-FR")}
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
              <div className="leave-department">
                <span>Service: {leave.department}</span>
              </div>
            </div>
          </div>
        ))}
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

          {loading ? (
            <div className="loading-container">
              <FiLoader className="loading-spinner" />
              <p>Chargement des données...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <FiX className="error-icon" />
              <p>Erreur: {error}</p>
              <button onClick={() => window.location.reload()}>Réessayer</button>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendrierConge;