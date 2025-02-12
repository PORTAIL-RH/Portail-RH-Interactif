import React, { useState, useEffect } from 'react';
import './CongeForm.css';
import Navbar from '../../Components/Navbar/Navbar';
import Sidebar from '../../Components/Sidebar/Sidebar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CongeForm = () => {
  const [formData, setFormData] = useState({
    dateDebut: '',
    dateFin: '',
    nbrJours: 0,
    matPers: '',
    texteDemande: '',
    snjTempDep: '',
    snjTempRetour: '',
    dateReprisePrev: '',
    codeSoc: '',
    file: null,
    typeDemande: 'conge',
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] }); // Store the selected file
  };

  useEffect(() => {
    if (formData.dateDebut && formData.dateFin) {
      const startDate = new Date(formData.dateDebut);
      const endDate = new Date(formData.dateFin);

      if (endDate < startDate) {
        toast.error('La date de fin ne peut pas être antérieure à la date de début.');
        return;
      }

      const timeDiff = endDate - startDate;
      const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Convert to days
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
    const codeSoc = localStorage.getItem('codeSoc');

    if (!authToken || !userId) {
      toast.error('Missing token or user ID');
      return;
    }

    // Create FormData object
    const formDataToSend = new FormData();
    formDataToSend.append('dateDebut', formData.dateDebut);
    formDataToSend.append('dateFin', formData.dateFin);
    formDataToSend.append('texteDemande', formData.texteDemande);
    formDataToSend.append('snjTempDep', formData.snjTempDep);
    formDataToSend.append('snjTempRetour', formData.snjTempRetour);
    formDataToSend.append('dateReprisePrev', formData.dateReprisePrev);
    formDataToSend.append('codeSoc', codeSoc || '');
    formDataToSend.append('matPersId', userId);
    formDataToSend.append('nbrJours', formData.nbrJours.toString());
    formDataToSend.append('typeDemande', formData.typeDemande);

    // Append the file if it exists
    if (formData.file) {
      formDataToSend.append('file', formData.file);
    }

    try {
      console.log('Sending request to backend...');
      const response = await fetch('http://localhost:8080/api/demande-conge/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formDataToSend, // Send FormData
      });

      console.log('Response status:', response.status);

      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        if (response.ok) {
          console.log('Form submitted successfully:', result);
          toast.success('Demande de congé soumise avec succès !');
        } else {
          console.error('Error submitting form:', result);
          toast.error('Error submitting form: ' + (result.message || response.statusText));
        }
      } else {
        // Handle non-JSON responses (e.g., plain text or HTML)
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse);
        toast.error('Error submitting form: ' + textResponse);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error submitting form: ' + error.message);
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

          {/* Ligne pour Date Début, Date Fin et Nombre de jours */}
          <div className="form-row">
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
            <label>
              Nombre de jours:
              <input
                type="number"
                name="nbrJours"
                value={formData.nbrJours}
                readOnly
              />
            </label>
          </div>

          {/* Ligne pour Heure Début, Heure Fin et Date de reprise prévue */}
          <div className="form-row">
            <label>
              Heure Début:
              <input
                type="time"
                name="snjTempDep"
                value={formData.snjTempDep}
                onChange={handleChange}
              />
            </label>
            <label>
              Heure Fin:
              <input
                type="time"
                name="snjTempRetour"
                value={formData.snjTempRetour}
                onChange={handleChange}
              />
            </label>
            <label>
              Date de reprise prévue:
              <input
                type="date"
                name="dateReprisePrev"
                value={formData.dateReprisePrev}
                onChange={handleChange}
              />
            </label>
          </div>

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

          {/* File upload */}
          <label>
            Upload File:
            <input
              type="file"
              name="file"
              onChange={handleFileChange}
              required
            />
          </label>

          <button type="submit">Soumettre</button>
        </form>
      </div>

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
      />
    </div>
  );
};

export default CongeForm;