import React, { useState, useEffect } from 'react';
import './CongeForm.css';
import Navbar from '../../Components/Navbar/Navbar';
import Sidebar from '../../Components/Sidebar/Sidebar';

const CongeForm = () => {
  const [formData, setFormData] = useState({
    dateDebut: '',
    dateFin: '',
    nbrJours: 0,
    matPers: '', // This will be filled by the userId from localStorage
    texteDemande: '',
    snjTempDep: '',
    snjTempRetour: '',
    dateReprisePrev: '',
    codeSoc: '',
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState('');

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
      const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Convertir en jours
      setFormData((prevData) => ({
        ...prevData,
        nbrJours: dayDiff,
      }));
    }
  }, [formData.dateDebut, formData.dateFin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Get user ID (mat_pers) and token from localStorage
    const userId = localStorage.getItem('userId');
    const authToken = localStorage.getItem('authToken');
  
    if (!authToken || !userId) {
      setError('Missing token or user ID');
      return;
    }

    // Prepare the form data as JSON
    const requestBody = {
      dateDebut: new Date(formData.dateDebut),
      dateFin: new Date(formData.dateFin),
      texteDemande: formData.texteDemande,
      snjTempDep: formData.snjTempDep,
      snjTempRetour: formData.snjTempRetour,
      dateReprisePrev: new Date(formData.dateReprisePrev),
      codeSoc: formData.codeSoc,
      matPers: { id: userId }, // Structure matPers as an object with id
      nbrJours: formData.nbrJours,
    };
  
    try {
      const response = await fetch('http://localhost:8080/api/demande-conge/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody), // Send JSON body
      });
  
      if (response.ok) {
        const result = await response.json();
        console.log('Form submitted successfully:', result);
        setError(''); // Clear any previous errors
        // Optionally, you can redirect the user or show a success message
      } else {
        const errorData = await response.json();
        console.error('Error submitting form:', errorData);
        setError('Error submitting form: ' + (errorData.message || response.statusText));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Error submitting form: ' + error.message);
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

          {error && <div className="error-message">{error}</div>}

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