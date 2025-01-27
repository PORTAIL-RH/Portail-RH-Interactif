import React, { useState, useEffect } from 'react';
import './CongeForm.css';
import Navbar from '../../Components/Navbar/Navbar';
import Sidebar from '../../Components/Sidebar/Sidebar';

const CongeForm = () => {
  const [formData, setFormData] = useState({
    dateDebut: '',
    dateFin: '',
    nbrJours: '',
    matPers: '', // This will be filled by the userId from localStorage
    texteDemande: '',
    snjTempDep: '',
    snjTempRetour: '',
    dateReprisePrev: '',
    codeSoc: '',
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Calcul du nombre de jours en fonction des dates
  useEffect(() => {
    if (formData.dateDebut && formData.dateFin) {
      const startDate = new Date(formData.dateDebut);
      const endDate = new Date(formData.dateFin);
      const timeDiff = endDate - startDate;
      const dayDiff = timeDiff / (1000 * 3600 * 24); // Convertir en jours
      setFormData((prevData) => ({
        ...prevData,
        nbrJours: dayDiff + 1, // Ajouter 1 pour inclure le jour de début
      }));
    }
  }, [formData.dateDebut, formData.dateFin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Get user ID (mat_pers) and token from localStorage
    const userId = localStorage.getItem('userId');
    const authToken = localStorage.getItem('authToken');
    console.log('User ID:', userId);
    console.log('Auth Token:', authToken);
  
    if (!authToken || !userId) {
      console.error('Missing token or user ID');
      return;
    }
    console.log('Authorization Header:', `Bearer ${authToken}`);

    // Prepare the form data as JSON
    const requestBody = {
      dateDebut: formData.dateDebut,
      dateFin: formData.dateFin,
      texteDemande: formData.texteDemande,
      snjTempDep: formData.snjTempDep,
      snjTempRetour: formData.snjTempRetour,
      dateReprisePrev: formData.dateReprisePrev,
      codeSoc: formData.codeSoc,
      matPers: userId, // Add userId as matPers
      nbrJours: formData.nbrJours,
    };
  
    try {
      const response = await fetch('http://localhost:8080/api/demande-conge/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${authToken}`
        },
        body: JSON.stringify(requestBody), // Send JSON body
      });
  
      if (response.ok) {
        const result = await response.json();
        console.log('Form submitted successfully:', result);
      } else {
        console.error('Error submitting form:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div className="app">
      {/* Navbar */}
      <Navbar />

      {/* Sidebar */}
      <Sidebar isSidebarOpen={isSidebarOpen} onToggle={handleSidebarToggle} />

      {/* Formulaire de congé */}
      <div className="content">
        <form className="form" onSubmit={handleSubmit}>
          <h2>Demande de Congé</h2>

          {/* Date Début & Fin */}
          <label>
            Date Début:
            <input
              type="date"
              name="dateDebut"
              value={formData.dateDebut}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Date Fin:
            <input
              type="date"
              name="dateFin"
              value={formData.dateFin}
              onChange={handleChange}
              required
            />
          </label>

          {/* Motif */}
          <label>
            Motif:
            <textarea
              name="texteDemande"
              value={formData.texteDemande}
              onChange={handleChange}
              required
            ></textarea>
          </label>

          {/* Nombre de jours */}
          <label>
            Nombre de jours:
            <input
              type="number"
              name="nbrJours"
              value={formData.nbrJours}
              readOnly
            />
          </label>

          <div className="form-time">
            <label></label>
            {/* Matin/Soir Début */}
            <div className="time-group">
              <label>
                Heure Début:
                <input
                  type="time"
                  name="snjTempDep"
                  value={formData.snjTempDep}
                  onChange={handleChange}
                />
              </label>
            </div>

            {/* Matin/Soir Fin */}
            <div className="time-group">
              <label>
                Heure Fin:
                <input
                  type="time"
                  name="snjTempRetour"
                  value={formData.snjTempRetour}
                  onChange={handleChange}
                />
              </label>
            </div>
          </div>

          {/* Nouveau champ : Date de reprise prévue */}
          <label>
            Date de reprise prévue:
            <input
              type="date"
              name="dateReprisePrev"
              value={formData.dateReprisePrev}
              onChange={handleChange}
            />
          </label>

          {/* Nouveau champ : code société */}
          <label>
            Code société:
            <textarea
              name="codeSoc"
              value={formData.codeSoc}
              onChange={handleChange}
            ></textarea>
          </label>

          <button type="submit">Soumettre</button>
        </form>
      </div>
    </div>
  );
};

export default CongeForm;
