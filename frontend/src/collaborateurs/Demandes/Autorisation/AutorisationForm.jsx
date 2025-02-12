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
    setFile(e.target.files[0]); // Store the selected file
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    formDataToSend.append('heureSortie', formData.heureSortie);
    formDataToSend.append('heureRetour', formData.heureRetour);
    formDataToSend.append('codeSoc', formData.codeSoc);
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
          toast.error('Error submitting form: ' + (errorResult.message || 'Unknown error'));
        } else {
          const errorText = await response.text();
          toast.error('Error submitting form: ' + errorText);
        }
        return;
      }

      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        console.log('Form submitted successfully:', result);
        toast.success('Demande d\'autorisation soumise avec succès !');
        setError('');
      } else {
        const resultText = await response.text();
        console.log('Form submitted successfully:', resultText);
        toast.success('Demande d\'autorisation soumise avec succès !');
        setError('');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error submitting form: ' + error.message);
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="main-content flex-grow-1">
        <Navbar />
        <div className="container mt-4">
          <form onSubmit={handleSubmit} className="autorisation-form container p-4 shadow rounded">
            <h2 className="text-center mb-4">Autorisation Form</h2>
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Ligne pour Date Début et Date Fin */}
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

            {/* Ligne pour Heure Sortie et Heure Retour */}
            <div className="form-row">
              <div>
                <label htmlFor="heureSortie" className="form-label">Sortie</label>
                <select
                  type="time"
                  id="heureSortie"
                  name="heureSortie"
                  className="form-control"
                  value={formData.heureSortie}
                  onChange={handleChange}
                  required
                  >
                  <option value="">Choisissez un horaire</option>
                  <option value="Matin">Matin</option>
                  <option value="Soir">Soir</option>
                </select>
              </div>


              <div>
                <label htmlFor="heureRetour" className="form-label">Retour</label>
                <select
                  type="time"
                  id="heureRetour"
                  name="heureRetour"
                  className="form-control"
                  value={formData.heureRetour}
                  onChange={handleChange}
                  required
                  >
                  <option value="">Choisissez un horaire</option>
                  <option value="Matin">Matin</option>
                  <option value="Soir">Soir</option>
                </select>
              </div>
            </div>

            {/* Texte de la Demande */}
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

            {/* Fichier Joint */}
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

            {/* Bouton de soumission */}
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