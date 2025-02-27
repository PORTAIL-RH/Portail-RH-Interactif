import React, { useState, useEffect } from 'react';
import './Avance.css';
import Navbar from '../../Components/Navbar/Navbar';
import Sidebar from '../../Components/Sidebar/Sidebar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PreAvanceForm = () => {
  const [formData, setFormData] = useState({
    type: '',
    montant: 0,
    codeSoc: '',
    texteDemande: '',
    matPersId: '', 
    file: null,
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [typesPreAvance, setTypesPreAvance] = useState({});

  useEffect(() => {
    const fetchTypesPreAvance = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          toast.error('Token d\'authentification manquant');
          return;
        }

        const response = await fetch('http://localhost:8080/api/demande-pre-avance/types', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des types de pré-avances');
        }

        const data = await response.json();
        setTypesPreAvance(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des types de pré-avances :', error);
        toast.error('Erreur lors de la récupération des types de pré-avances');
      }
    };

    fetchTypesPreAvance();
  }, []);

  const validateMontant = (type, montant) => {
    if (typesPreAvance[type] && montant > typesPreAvance[type]) {
      return `Le montant ne doit pas dépasser ${typesPreAvance[type]} euros pour ce type de demande.`;
    }
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === 'montant') {
      const errorMessage = validateMontant(formData.type, value);
      setError(errorMessage);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userCodeSoc = localStorage.getItem('userCodeSoc');

    if (userId && userCodeSoc) {
      setFormData((prevData) => ({
        ...prevData,
        codeSoc: userCodeSoc,
        matPersId: userId, 
      }));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errorMessage = validateMontant(formData.type, formData.montant);
    if (errorMessage) {
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    const authToken = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    if (!authToken || !userId) {
      setError('Missing token or user ID');
      toast.error('Missing token or user ID');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('type', formData.type);
    formDataToSend.append('montant', formData.montant.toString());
    formDataToSend.append('texteDemande', formData.texteDemande);
    formDataToSend.append('codeSoc', formData.codeSoc);
    formDataToSend.append('matPersId', userId);

    if (file) {
      formDataToSend.append('file', file);
    }

    // Log FormData contents for debugging
    for (let [key, value] of formDataToSend.entries()) {
      console.log(key, value);
    }

    try {
      const response = await fetch('http://localhost:8080/api/demande-pre-avance/create', {
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
        toast.success('Demande de pré-avance soumise avec succès !');
        setError('');
      } else {
        const resultText = await response.text();
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
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionnez un type</option>
                {Object.keys(typesPreAvance).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="full-width">
              <label className="form-label">
                Montant (Max: {formData.type ? `${typesPreAvance[formData.type]} €` : 'Sélectionnez un type'}) :
              </label>
              <input
                type="number"
                name="montant"
                value={formData.montant}
                onChange={handleChange}
                required
              />
            </div>

            <div className="full-width">
              <label htmlFor="texteDemande" className="form-label">Texte de la Demande</label>
              <textarea
                id="texteDemande"
                name="texteDemande"
                className="form-control"
                value={formData.texteDemande}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="full-width">
              <label htmlFor="file" className="form-label">Fichier Joint : (optionnel)</label>
              <input
                type="file"
                id="file"
                name="file"
                className="form-control"
                onChange={handleFileChange}
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