import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Navbar from '../Navbar/Navbar';
import './Calendar.css';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const daysOfWeek = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];

  useEffect(() => {
    const fetchApprovedLeaves = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/demande-conge/approved');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setApprovedLeaves(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des congés approuvés :', error);
      }
    };

    fetchApprovedLeaves();
  }, []);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleDateClick = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);

    const leave = approvedLeaves.find(leave => {
      const startDate = new Date(leave.dateDebut);
      const endDate = new Date(leave.dateFin);
      return date >= startDate && date <= endDate;
    });

    setSelectedLeave(leave || null);
  };

  const isDateInApprovedLeaves = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return approvedLeaves.some(leave => {
      const startDate = new Date(leave.dateDebut);
      const endDate = new Date(leave.dateFin);
      return date >= startDate && date <= endDate;
    });
  };

  const handleResetFilters = () => {
    setFilterDate('');
    setFilterFrom('');
    setFilterTo('');
  };

  const filteredLeaves = approvedLeaves.filter(leave => {
    const leaveStart = new Date(leave.dateDebut);
    const leaveEnd = new Date(leave.dateFin);
    const filterSingleDate = filterDate ? new Date(filterDate) : null;
    const filterFromDate = filterFrom ? new Date(filterFrom) : null;
    const filterToDate = filterTo ? new Date(filterTo) : null;

    if (filterSingleDate) {
      return leaveStart <= filterSingleDate && leaveEnd >= filterSingleDate;
    } else if (filterFromDate && filterToDate) {
      return leaveEnd >= filterFromDate && leaveStart <= filterToDate;
    }
    return true;
  });

  return (
    <div className="navbar-container">
      <Navbar />
      <div className="sidebar-content-wrapper">
        <Sidebar />
        <div className="calendar">
Barre de filtrage :         <div className="filter-bar">
            <div className="filter-group">
              <label>Date</label>
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            </div>
            <div className="filter-group">
              <label>From</label>
              <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
            </div>
            <div className="filter-group">
              <label>To</label>
              <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
            </div>
            <button className="reset-button" onClick={handleResetFilters}>Reset</button>
          </div>
          <div className="calendar-header">
            <button onClick={handlePrevMonth} aria-label="Previous month">&lt;</button>
            <h3>{months[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
            <button onClick={handleNextMonth} aria-label="Next month">&gt;</button>
          </div>

          

          <div className="calendar-grid">
            {daysOfWeek.map((day) => (
              <div key={day} className="day-name">{day}</div>
            ))}
            {Array(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()).fill('').map((_, i) => (
              <div key={`empty-${i}`} className="empty-cell"></div>
            ))}
            {Array.from({ length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }, (_, i) => i + 1).map((day) => (
              <div
                key={day}
                className={`day-cell ${selectedDate.getDate() === day ? 'selected' : ''} ${isDateInApprovedLeaves(day) ? 'approved' : ''}`}
                onClick={() => handleDateClick(day)}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-legend">
            <div className="legend-item">
              <span className="legend-color approved"></span>
              <span>Congés Approuvés</span>
            </div>
          </div>

          {selectedLeave && (
            <div className="leave-details">
              <h4>Détails du Congé</h4>
              <p><strong>Employé :</strong> {selectedLeave.employee.nom || 'N/A'}</p>
              <p><strong>Date de Début :</strong> {new Date(selectedLeave.dateDebut).toLocaleDateString()}</p>
              <p><strong>Date de Fin :</strong> {new Date(selectedLeave.dateFin).toLocaleDateString()}</p>
              <p><strong>Statut :</strong> Approuvé</p>
            </div>
          )}

          <div className="leave-summary">
            <h4>Résumé des Congés Approuvés</h4>
            <p>Total des Congés Approuvés : {filteredLeaves.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;