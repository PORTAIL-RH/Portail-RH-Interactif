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
    matPersId: '', 
    codeSoc: '', 
    texteDemande: '',
    snjTempDep: '',
    snjTempRetour: '',
    dateReprisePrev: '',
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
    setFormData({ ...formData, file: e.target.files[0] }); 
  };

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userCodeSoc = localStorage.getItem('userCodeSoc');

    if (userId && userCodeSoc) {
      setFormData((prevData) => ({
        ...prevData,
        matPersId: userId,
        codeSoc: userCodeSoc,
      }));
    }
  }, []);

  useEffect(() => {
    if (formData.dateDebut && formData.dateFin) {
      const startDate = new Date(formData.dateDebut);
      const endDate = new Date(formData.dateFin);

      if (endDate < startDate) {
        toast.error('La date de fin ne peut pas être antérieure à la date de début.');
        return;
      }

      const timeDiff = endDate - startDate;
      const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
      setFormData((prevData) => ({
        ...prevData,
        nbrJours: dayDiff,
      }));
    }
  }, [formData.dateDebut, formData.dateFin]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userId = localStorage.getItem('userId');
    const authToken = localStorage.getItem('authToken');

    if (!authToken || !userId) {
      toast.error('Missing token or user ID');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('dateDebut', formData.dateDebut);
    formDataToSend.append('dateFin', formData.dateFin);
    formDataToSend.append('texteDemande', formData.texteDemande);
    formDataToSend.append('snjTempDep', formData.snjTempDep);
    formDataToSend.append('snjTempRetour', formData.snjTempRetour);
    formDataToSend.append('dateReprisePrev', formData.dateReprisePrev);
    formDataToSend.append('codeSoc', formData.codeSoc); 
    formDataToSend.append('matPersId', userId);
    formDataToSend.append('nbrJours', formData.nbrJours.toString());
    formDataToSend.append('typeDemande', formData.typeDemande);

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
        body: formDataToSend, 
      });

      console.log('Response status:', response.status);

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
      <Navbar />

      <Sidebar isSidebarOpen={isSidebarOpen} onToggle={handleSidebarToggle} />

      <div className="content">
        <form className="form" onSubmit={handleSubmit}>
          <h2>Demande de Congé</h2>

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

          <div className="form-row">
            <label>
              Sortie:
              <select
                name="snjTempDep"
                value={formData.snjTempDep}
                onChange={handleChange}
                required
              >
                <option value="">Choisissez un horaire</option>
                <option value="Matin">Matin</option>
                <option value="Soir">Soir</option>
              </select>
            </label>
            <label>
              Retour:
              <select
                name="snjTempRetour"
                value={formData.snjTempRetour}
                onChange={handleChange}
                required
              >
                <option value="">Choisissez un horaire</option>
                <option value="Matin">Matin</option>
                <option value="Soir">Soir</option>
              </select>
            </label>
          </div>

          <label>
            Texte demande:
            <textarea
              name="texteDemande"
              value={formData.texteDemande}
              onChange={handleChange}
              required
            ></textarea>
          </label>

          <label>
            Fichier Joint: (optionnel)
            <input
              type="file"
              name="file"
              onChange={handleFileChange}
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