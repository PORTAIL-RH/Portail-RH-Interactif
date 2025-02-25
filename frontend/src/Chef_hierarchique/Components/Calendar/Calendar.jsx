import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Navbar from '../Navbar/Navbar';
import './Calendar.css';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [approvedLeaves, setApprovedLeaves] = useState([]); 
  const [selectedLeave, setSelectedLeave] = useState(null); 


  const userService = localStorage.getItem('userService');

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const daysOfWeek = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];

  useEffect(() => {
    const fetchApprovedLeaves = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/demande-conge/approved');
        const data = await response.json();

        const filteredLeaves = data.filter(leave => leave.employee?.service === userService.serviceName);

        setApprovedLeaves(filteredLeaves);
      } catch (error) {
        console.error('Erreur lors de la récupération des congés approuvés :', error);
      }
    };

    fetchApprovedLeaves();
  }, [userService]); 

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

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

  const filteredLeaves = approvedLeaves.filter(leave => {
    if (leave.employeeName && typeof leave.employeeName === 'string') {
      return leave.employeeName.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return false; 
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = new Date(year, month, 1).getDay();

  return (
    <div className="navbar-containerpp">
      <Navbar />
      <div className="sidebar-content-wrapper">
        <Sidebar />
        <div className="calendarrr">
          <div className="calendar-header">
            <button onClick={handlePrevMonth}>&lt;</button>
            <h3>{months[month]} {year}</h3>
            <button onClick={handleNextMonth}>&gt;</button>
          </div>

          <div className="calendar-grid">
            {daysOfWeek.map((day) => (
              <div key={day} className="day-name">{day}</div>
            ))}

            {Array(firstDayIndex).fill('').map((_, i) => (
              <div key={`empty-${i}`} className="empty-cell"></div>
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
              <div
                key={day}
                className={`day-cell 
                  ${selectedDate.getDate() === day &&
                    selectedDate.getMonth() === month &&
                    selectedDate.getFullYear() === year ? 'selected' : ''}
                  ${isDateInApprovedLeaves(day) ? 'approved' : ''}`}
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
              <p><strong>Employé :</strong> {selectedLeave.employeeName || 'N/A'}</p>
              <p><strong>Date de Début :</strong> {new Date(selectedLeave.dateDebut).toLocaleDateString()}</p>
              <p><strong>Date de Fin :</strong> {new Date(selectedLeave.dateFin).toLocaleDateString()}</p>
              <p><strong>Statut :</strong> Approuvé</p>
            </div>
          )}

          <div className="leave-summary">
            <h4>Résumé des Congés Approuvés</h4>
            <p>Total des Congés Approuvés : {approvedLeaves.length}</p>
            <ul>
              {filteredLeaves.map((leave, index) => (
                <li key={index}>
                  {leave.employeeName || 'N/A'} - {new Date(leave.dateDebut).toLocaleDateString()} au {new Date(leave.dateFin).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;