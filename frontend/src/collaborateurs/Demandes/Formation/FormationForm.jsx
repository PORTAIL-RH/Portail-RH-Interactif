import React, { useState, useEffect } from 'react';
import './Formation.css';
import Navbar from '../../Components/Navbar/Navbar';
import Sidebar from '../../Components/Sidebar/Sidebar';

const FormationForm = () => {
  const [formData, setFormData] = useState({
    dateDebut: '',
    dateFin: '',
    typeDemande: '',
    texteDemande: '',
    titre: '',
    type: '',
    theme: '',
    annee_f:'',
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

  

  // Function to adapt API data to the expected format
  const adapterDonneesAPI = (data) => {
    return data.map((titre) => ({
      ...titre,
      types: titre.types?.map((type) => ({
        ...type,
        nom: type.type, // Map "type" field to "nom" for frontend compatibility
        themes: type.themes?.map((theme) => ({
          ...theme,
          nom: theme.theme, // Map "theme" field to "nom" for frontend compatibility
        })) || [],
      })) || [],
    }));
  };

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

      const adaptedData = adapterDonneesAPI(data);
      setTitres(adaptedData);

      // Map types and themes for cascading dropdowns
      const typesMap = {};
      const themesMap = {};

      adaptedData.forEach((titre) => {
        typesMap[titre.id] = titre.types || [];
        titre.types?.forEach((type) => {
          themesMap[type.id] = type.themes || [];
        });
      });

      setTypes(typesMap);
      setThemes(themesMap);
    } catch (err) {
      setError('Erreur lors du chargement des données');
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
    setFile(e.target.files[0]); // Store the selected file
    console.log('File:', file);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.dateDebut) newErrors.dateDebut = 'Date Début est requise';
    if (!formData.dateFin) newErrors.dateFin = 'Date Fin est requise';
    if (formData.dateDebut && formData.dateFin && formData.dateDebut > formData.dateFin) {
      newErrors.dateFin = 'Date Fin doit être postérieure à Date Début';
    }
    if (!formData.typeDemande) newErrors.typeDemande = 'Type de demande est requis';
    if (!formData.texteDemande) newErrors.texteDemande = 'Texte Demande est requis';
    if (!formData.file) newErrors.file = 'Fichier Joint est requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const userId = localStorage.getItem('userId');
    const authToken = localStorage.getItem('authToken');
  
    if (!authToken || !userId) {
      setError('Missing token or user ID');
      console.error('Missing token or user ID');
      return;
    }
  
    const formDataToSend = new FormData();
    formDataToSend.append('dateDebut', formData.dateDebut);
    formDataToSend.append('dateFin', formData.dateFin);
    formDataToSend.append('typeDemande', "formation");
    formDataToSend.append('texteDemande', formData.texteDemande);
    formDataToSend.append('titreId', formData.titre || '');
    formDataToSend.append('typeId', formData.type || '');
    formDataToSend.append('themeId', formData.theme || '');
    formDataToSend.append('codeSoc', formData.codeSoc || 'defaultValue');
    formDataToSend.append('annee_f', new Date().getFullYear().toString());
    formDataToSend.append('matPersId', userId);
  
    if (file) {
      formDataToSend.append('file', file);
    }
  
    for (let [key, value] of formDataToSend.entries()) {
      console.log(key, value);
    }
  
    try {
      const response = await fetch('http://localhost:8080/api/demande-formation/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formDataToSend,
      });
  
      console.log('Authorization Header:', `Bearer ${authToken}`);
  
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        const errorText = contentType?.includes('application/json')
          ? await response.json()
          : await response.text();
        console.error('Error submitting form:', errorText);
        setError('Error submitting form: ' + errorText.message || 'Unknown error');
        return;
      }
  
      console.log('Form submitted successfully:', await response.json());
      setError('');
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Error submitting form: ' + error.message);
    }
  };
  


  const handleTypeChange = (e) => {
  const selectedTypeId = e.target.value; // This will be the type ID
  setFormData({ ...formData, type: selectedTypeId, theme: '' }); // Update type with ID and reset theme

  // Load themes for the selected type
  if (formData.titre && types[formData.titre]) {
    const typeObject = types[formData.titre].find((type) => type.id === selectedTypeId);
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

          {/* Dropdown pour les titres */}
          <div className="form-group">
            <label>Titre de la formation:</label>
            <select
              name="titre"
              value={formData.titre} // Use formData.titre (ID) instead of formData.titre.id
              onChange={handleChange}
              required
            >
              <option value="">Sélectionnez un titre</option>
              {titres.map((titre) => (
                <option key={titre.id} value={titre.id}>
                  {titre.titre}
                </option>
              ))}
            </select>
            {errors.titre && <span className="error">{errors.titre}</span>}
          </div>

          {/* Dropdown pour les types */}
          <div className="form-group">
            <label>Type de demande:</label>
            <select
              name="type"
              value={formData.type} // Use formData.type (ID) instead of formData.type.id
              onChange={handleTypeChange}
              required
            >
              <option value="">Sélectionnez un type</option>
              {types[formData.titre]?.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.type}
                </option>
              ))}
            </select>
            {errors.type && <span className="error">{errors.type}</span>}
          </div>

          {/* Dropdown pour les thèmes */}
          <div className="form-group">
            <label>Thème de la formation:</label>
            <select
              name="theme"
              value={formData.theme} // Use formData.theme (ID) instead of formData.theme.id
              onChange={handleChange}
              required
            >
              <option value="">Sélectionnez un thème</option>
              {Array.isArray(themes) && themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.nom}
                </option>
              ))}
            </select>
            {errors.theme && <span className="error">{errors.theme}</span>}
          </div>


          <div className="form-group">
            <label>Texte Demande:</label>
            <textarea name="texteDemande" value={formData.texteDemande} onChange={handleChange} required></textarea>
            {errors.texteDemande && <span className="error">{errors.texteDemande}</span>}
          </div>

          <div className="col-md-12">
                <label htmlFor="file" className="form-label">Fichier Joint</label>
                <input type="file" id="file" name="file" className="form-control" onChange={handleFileChange} />
          </div>

          <button type="submit" className="submit-button">Soumettre</button>
        </form>
      </div>
    </div>
  );
};

export default FormationForm;
