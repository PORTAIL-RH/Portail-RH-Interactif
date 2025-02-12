import React, { useState, useEffect } from 'react';
import './Formation.css';
import Navbar from '../../Components/Navbar/Navbar';
import Sidebar from '../../Components/Sidebar/Sidebar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const FormationForm = () => {
  const [formData, setFormData] = useState({
    dateDebut: '',
    dateFin: '',
    typeDemande: '',
    texteDemande: '',
    titre: '',
    type: '',
    theme: '',
    annee_f: '',
    codeSoc: '',
    matPers: '',
    file: null,
  });

  const [errors, setErrors] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [titres, setTitres] = useState([]);
  const [types, setTypes] = useState({});
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchTitres();
  }, []);

  const fetchTitres = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/api/titres/');
      if (!response.ok) {
        throw new Error('Erreur réseau');
      }
      const data = await response.json();

      const adaptedData = data.map((titre) => ({
        ...titre,
        types: titre.types?.map((type) => ({
          ...type,
          nom: type.type,
          themes: type.themes?.map((theme) => ({
            ...theme,
            nom: theme.theme,
          })) || [],
        })) || [],
      }));

      setTitres(adaptedData);

      const typesMap = {};
      const themesMap = {};

      adaptedData.forEach((titre) => {
        typesMap[titre.id] = titre.types || [];
        titre.types?.forEach((type) => {
          themesMap[type.id] = type.themes || [];
        });
      });

      setTypes(typesMap);
      setThemes(themesMap[formData.type] || []);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      toast.error('Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.dateDebut) newErrors.dateDebut = 'Date Début est requise';
    if (!formData.dateFin) newErrors.dateFin = 'Date Fin est requise';
    if (formData.dateDebut && formData.dateFin && formData.dateDebut > formData.dateFin) {
      newErrors.dateFin = 'Date Fin doit être postérieure à Date Début';
    }
    if (!formData.texteDemande) newErrors.texteDemande = 'Texte Demande est requis';
    if (!file) newErrors.file = 'Fichier Joint est requis';

    setErrors(newErrors);
    console.log("Validation errors:", newErrors); // Debugging line
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submission triggered");

    const userId = localStorage.getItem('userId');
    const authToken = localStorage.getItem('authToken');
    const codeSoc = localStorage.getItem('codeSoc');

    if (!authToken || !userId) {
      setError('Missing token or user ID');
      toast.error('Missing token or user ID');
      return;
    }

    // Set typeDemande to "formation" before validation
    setFormData((prevFormData) => ({
      ...prevFormData,
      typeDemande: "formation",
    }));

    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire.');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('dateDebut', formData.dateDebut);
    formDataToSend.append('dateFin', formData.dateFin);
    formDataToSend.append('typeDemande', "formation");
    formDataToSend.append('texteDemande', formData.texteDemande);
    formDataToSend.append('titre', formData.titre);
    formDataToSend.append('type', formData.type);
    formDataToSend.append('theme', formData.theme);
    formDataToSend.append('annee_f', formData.annee_f);
    formDataToSend.append('codeSoc', codeSoc);
    formDataToSend.append('matPersId', userId);
    formDataToSend.append('file', file);

    try {
      const response = await fetch('http://localhost:8080/api/demande-formation/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formDataToSend,
      });

      console.log("Response status:", response.status);
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorResult = await response.json();
          console.error("Server error:", errorResult);
          toast.error('Erreur lors de la soumission du formulaire: ' + (errorResult.message || 'Erreur inconnue'));
        } else {
          const errorText = await response.text();
          console.error("Server error:", errorText);
          toast.error('Erreur lors de la soumission du formulaire: ' + errorText);
        }
        return;
      }

      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        console.log('Form submitted successfully:', result);
        toast.success('Formulaire soumis avec succès !');
        setError('');
      } else {
        const resultText = await response.text();
        console.log('Form submitted successfully:', resultText);
        toast.success('Formulaire soumis avec succès !');
        setError('');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Erreur lors de la soumission du formulaire: ' + error.message);
    }
  };

  const handleTypeChange = (e) => {
    const selectedType = e.target.value;
    setFormData({ ...formData, type: selectedType, theme: '' });

    if (formData.titre && types[formData.titre]) {
      const typeObject = types[formData.titre].find((type) => type.id === selectedType);
      if (typeObject) {
        setThemes(typeObject.themes || []);
      } else {
        setThemes([]);
      }
    }
  };

  return (
    <div className="app">
      <Navbar />
      <Sidebar isSidebarOpen={isSidebarOpen} onToggle={handleSidebarToggle} />

      <div className="content">
      <form className="form" onSubmit={handleSubmit}>
        <h2>Demande de Formation</h2>

        {loading && <div className="loading">Chargement...</div>}
        {error && <div className="error">{error}</div>}

        {/* Ligne pour Date Début et Date Fin */}
        <div className="form-row">
          <div className="form-group">
            <label>Date Début:</label>
            <input type="date" name="dateDebut" value={formData.dateDebut} onChange={handleChange} required />
            {errors.dateDebut && <span className="error">{errors.dateDebut}</span>}
          </div>
          <div className="form-group">
            <label>Date Fin:</label>
            <input type="date" name="dateFin" value={formData.dateFin} onChange={handleChange} required />
            {errors.dateFin && <span className="error">{errors.dateFin}</span>}
          </div>
        </div>

        {/* Ligne pour Titre, Type et Thème */}
        <div className="form-row-3">
          <div className="form-group">
            <label>Titre de la formation:</label>
            <select name="titre" value={formData.titre} onChange={handleChange} required>
              <option value="">Sélectionnez un titre</option>
              {titres.map(titre => (
                <option key={titre.id} value={titre.id}>
                  {titre.titre}
                </option>
              ))}
            </select>
            {errors.titre && <span className="error">{errors.titre}</span>}
          </div>
          <div className="form-group">
            <label>Type de demande:</label>
            <select name="type" value={formData.type} onChange={handleTypeChange} required>
              <option value="">Sélectionnez un type</option>
              {types[formData.titre]?.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.type}
                </option>
              ))}
            </select>
            {errors.type && <span className="error">{errors.type}</span>}
          </div>
          <div className="form-group">
            <label>Thème de la formation:</label>
            <select name="theme" value={formData.theme} onChange={handleChange} required>
              <option value="">Sélectionnez un thème</option>
              {Array.isArray(themes) && themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.nom}
                </option>
              ))}
            </select>
            {errors.theme && <span className="error">{errors.theme}</span>}
          </div>
        </div>

        {/* Texte Demande */}
        <div className="form-group">
          <label>Texte Demande:</label>
          <textarea name="texteDemande" value={formData.texteDemande} onChange={handleChange} required></textarea>
          {errors.texteDemande && <span className="error">{errors.texteDemande}</span>}
        </div>

        {/* Fichier Joint */}
        <div className="form-group">
          <label>Fichier Joint:</label>
          <input type="file" name="file" onChange={handleFileChange} required />
          {errors.file && <span className="error">{errors.file}</span>}
        </div>

        {/* Bouton de soumission */}
        <button type="submit" className="submit-button">Soumettre</button>
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

export default FormationForm;