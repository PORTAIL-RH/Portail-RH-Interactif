import React, { useState } from 'react';
import './AutorisationForm.css';
import Navbar from '../../Components/Navbar/Navbar';
import Sidebar from '../../Components/Sidebar/Sidebar';

const AutorisationForm = () => {
  const [formData, setFormData] = useState({
    dateDebut: '',
    dateFin: '',
    heureSortie: '',
    heureRetour: '',
    codeSoc: '',
    texteDemande: '',
    typeDemande: '',
    reponseChef: 'I', 
    reponseRH: 'I', 
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

    if (!authToken || !userId) {
      setError('Missing token or user ID');
      return;
    }

    const requestData = {
      dateDebut: formData.dateDebut,
      dateFin: formData.dateFin,
      heureSortie: formData.heureSortie,
      heureRetour: formData.heureRetour,
      codeSoc: formData.codeSoc,
      texteDemande: formData.texteDemande,
      typeDemande: formData.typeDemande,
      reponseChef: formData.reponseChef,
      reponseRH: formData.reponseRH,
      cod_autorisation: formData.cod_autorisation,
      matPers: { id: userId },
    };

    const formDataToSend = new FormData();
    formDataToSend.append('demande', new Blob([JSON.stringify(requestData)], { type: 'application/json' }));
    
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

      const result = await response.json();
      if (!response.ok) {
        setError('Error submitting form: ' + result.message);
        return;
      }

      console.log('Form submitted successfully:', result);
      setError('');
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Error submitting form: ' + error.message);
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
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="dateDebut" className="form-label">Date Début</label>
                <input type="date" id="dateDebut" name="dateDebut" className="form-control" value={formData.dateDebut} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label htmlFor="dateFin" className="form-label">Date Fin</label>
                <input type="date" id="dateFin" name="dateFin" className="form-control" value={formData.dateFin} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label htmlFor="heureSortie" className="form-label">Heure Sortie</label>
                <input type="time" id="heureSortie" name="heureSortie" className="form-control" value={formData.heureSortie} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label htmlFor="heureRetour" className="form-label">Heure Retour</label>
                <input type="time" id="heureRetour" name="heureRetour" className="form-control" value={formData.heureRetour} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label htmlFor="codeSoc" className="form-label">Code Société</label>
                <input type="text" id="codeSoc" name="codeSoc" className="form-control" value={formData.codeSoc} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label htmlFor="typeDemande" className="form-label">Type de Demande</label>
                <input id="typeDemande" name="typeDemande" className="form-control" value={formData.typeDemande} onChange={handleChange} required />
              </div>
              <div className="col-md-12">
                <label htmlFor="texteDemande" className="form-label">Texte de la Demande</label>
                <textarea id="texteDemande" name="texteDemande" className="form-control" value={formData.texteDemande} onChange={handleChange} required></textarea>
              </div>
              <div className="col-md-12">
                <label htmlFor="file" className="form-label">Fichier Joint</label>
                <input type="file" id="file" name="file" className="form-control" onChange={handleFileChange} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary mt-4">Envoyer</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AutorisationForm;
