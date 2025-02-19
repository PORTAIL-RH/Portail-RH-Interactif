import React, { useState, useEffect } from 'react';
import './Avance.css';
import Navbar from '../../Components/Navbar/Navbar';
import Sidebar from '../../Components/Sidebar/Sidebar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PreAvanceForm = () => {
  const [formData, setFormData] = useState({
    typeDemande: '',
    montant: 0,
    codeSoc: '',
    matPers: { id: '' }, 
  });

  const [error, setError] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const codeSoc = localStorage.getItem('codeSoc');
    const matPersId = localStorage.getItem('matPers');

    if (userId && codeSoc && matPersId) {
      setFormData((prevData) => ({
        ...prevData,
        codeSoc,
        matPers: { id: matPersId }, // Set matPers as an object with id
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast.error('Token d\'authentification manquant');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/demande-pre-avance/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          matPers: { id: formData.matPers.id }, // Ensure matPers is sent as an object
        }),
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
        toast.success('Demande de pré-avance soumise avec succès !');
        setError('');
      } else {
        const resultText = await response.text();
        console.log('Formulaire soumis avec succès :', resultText);
        toast.success('Demande de pré-avance soumise avec succès !');
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
            <h2 className="text-center mb-4">Formulaire de Pré-Avance</h2>

            {error && <div className="alert alert-danger">{error}</div>}
            
            <div className="full-width">
              <label className="form-label">Type de Demande :</label>
              <select
                name="typeDemande"
                value={formData.typeDemande}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionnez un type</option>
                <option value="MEDICAL">Médical</option>
                <option value="SCOLARITE">Scolarité</option>
                <option value="VOYAGE">Voyage</option>
                <option value="INFORMATIQUE">Informatique</option>
                <option value="DEMENAGEMENT">Déménagement</option>
                <option value="MARIAGE">Mariage</option>
                <option value="FUNERAILLES">Funérailles</option>
              </select>
            </div>

            <div className="full-width">
              <label className="form-label">Montant :</label>
              <input
                type="number"
                name="montant"
                value={formData.montant}
                onChange={handleChange}
                required
              />
            </div>

          

            <button type="submit" className="btn btn-primary mt-4">Envoyer</button>
          </form>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default PreAvanceForm;