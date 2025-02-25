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
    file: null,
  });

  const [error, setError] = useState('');

  // Fonction pour valider le montant
  const validateMontant = (typeDemande, montant) => {
    const montantsMax = {
      MEDICAL: 2000.0,
      SCOLARITE: 1500.0,
      VOYAGE: 1000.0,
      INFORMATIQUE: 800.0,
      DEMENAGEMENT: 3000.0,
      MARIAGE: 5000.0,
      FUNERAILLES: 2000.0,
    };

    if (montantsMax[typeDemande] && montant > montantsMax[typeDemande]) {
      return `Le montant ne doit pas dépasser ${montantsMax[typeDemande]} euros pour ce type de demande.`;
    }
    return null;
  };

  // Gestionnaire de changement pour les champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Validation du montant si le champ modifié est "montant"
    if (name === 'montant') {
      const errorMessage = validateMontant(formData.typeDemande, value);
      setError(errorMessage);
    }
  };

  // Gestionnaire de changement pour le fichier
  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] });
  };

  // Récupération des données de l'utilisateur depuis le localStorage
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const codeSoc = localStorage.getItem('codeSoc');
    const matPersId = localStorage.getItem('matPers');

    if (userId && codeSoc && matPersId) {
      setFormData((prevData) => ({
        ...prevData,
        codeSoc,
        matPers: { id: matPersId },
      }));
    }
  }, []);

  // Gestionnaire de soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation du montant avant soumission
    const errorMessage = validateMontant(formData.typeDemande, formData.montant);
    if (errorMessage) {
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

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
          matPers: { id: formData.matPers.id },
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

            {/* Affichage des erreurs */}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Champ Type de Demande */}
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

            {/* Champ Montant */}
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

            {/* Champ Upload de fichier */}
            <label>
              Upload File:
              <input
                type="file"
                name="file"
                onChange={handleFileChange}
              />
            </label>

            {/* Bouton de soumission */}
            <button type="submit" className="btn btn-primary mt-4">Envoyer</button>
          </form>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default PreAvanceForm;