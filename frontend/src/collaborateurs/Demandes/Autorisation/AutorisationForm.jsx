import React, { useState } from 'react';
import './AutorisationForm.css';
import Navbar from '../../Components/Navbar/Navbar';
import Sidebar from '../../Components/Sidebar/Sidebar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AutorisationForm = () => {
  const [formData, setFormData] = useState({
    dateDebut: '',
    dateFin: '',
    heureSortie: '',
    heureRetour: '',
    codeSoc: '',
    texteDemande: '',
    cod_autorisation: '',
  });

  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const validateForm = () => {
    const { dateDebut, dateFin, heureSortie, heureRetour } = formData;

    if (new Date(dateDebut) > new Date(dateFin)) {
      toast.error('La date de début ne peut pas être supérieure à la date de fin.');
      return false;
    }
    if (heureSortie >= heureRetour) {
      toast.error('L\'heure de sortie doit être inférieure à l\'heure de retour.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const userId = localStorage.getItem('userId');
    const authToken = localStorage.getItem('authToken');
    const codeSoc = localStorage.getItem('codeSoc');

    if (!authToken || !userId) {
      toast.error('Token ou ID utilisateur manquant');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('dateDebut', formData.dateDebut);
    formDataToSend.append('dateFin', formData.dateFin);
    formDataToSend.append('heureSortie', formData.heureSortie);
    formDataToSend.append('heureRetour', formData.heureRetour);
    formDataToSend.append('codeSoc', codeSoc);
    formDataToSend.append('texteDemande', formData.texteDemande);
    formDataToSend.append('codAutorisation', formData.cod_autorisation);
    formDataToSend.append('matPersId', userId);

    if (file) {
      formDataToSend.append('file', file);
    }

    try {
      const response = await fetch('http://localhost:8080/api/demande-autorisation/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formDataToSend,
      });

      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorResult = await response.json();
          toast.error('Erreur lors de la soumission du formulaire : ' + (errorResult.message || 'Erreur inconnue'));
        } else {
          const errorText = await response.text();
          toast.error('Erreur lors de la soumission du formulaire : ' + errorText);
        }
        return;
      }

      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        console.log('Formulaire soumis avec succès :', result);
        toast.success('Demande d\'autorisation soumise avec succès !');
        setError('');
      } else {
        const resultText = await response.text();
        console.log('Formulaire soumis avec succès :', resultText);
        toast.success('Demande d\'autorisation soumise avec succès !');
        setError('');
      }
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire :', error);
      toast.error('Erreur lors de la soumission du formulaire : ' + error.message);
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="main-content flex-grow-1">
        <Navbar />
        <div className="container mt-4">
          <form onSubmit={handleSubmit} className="autorisation-form container p-4 shadow rounded">
            <h2 className="text-center mb-4">Formulaire d'Autorisation</h2>

            {error && <div className="alert alert-danger">{error}</div>}

            {/* Date Inputs */}
            <div className="form-row">
              <div>
                <label htmlFor="dateDebut" className="form-label">Date Début</label>
                <input
                  type="date"
                  id="dateDebut"
                  name="dateDebut"
                  className="form-control"
                  value={formData.dateDebut}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="dateFin" className="form-label">Date Fin</label>
                <input
                  type="date"
                  id="dateFin"
                  name="dateFin"
                  className="form-control"
                  value={formData.dateFin}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Time Inputs */}
            <div className="form-row">
              <div>
                <label htmlFor="heureSortie" className="form-label">Heure de Sortie</label>
                <input
                  type="time"
                  id="heureSortie"
                  name="heureSortie"
                  className="form-control"
                  value={formData.heureSortie}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="heureRetour" className="form-label">Heure de Retour</label>
                <input
                  type="time"
                  id="heureRetour"
                  name="heureRetour"
                  className="form-control"
                  value={formData.heureRetour}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Textarea for demande */}
            <div className="full-width">
              <label htmlFor="texteDemande" className="form-label">Texte de la Demande</label>
              <textarea
                id="texteDemande"
                name="texteDemande"
                className="form-control"
                value={formData.texteDemande}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            {/* File Input */}
            <div className="full-width">
              <label htmlFor="file" className="form-label">Fichier Joint</label>
              <input
                type="file"
                id="file"
                name="file"
                className="form-control"
                onChange={handleFileChange}
              />
            </div>

            {/* Submit Button */}
            <button type="submit" className="btn btn-primary mt-4">Envoyer</button>
          </form>
        </div>
      </div>

      {/* Toast Container */}
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

export default AutorisationForm;