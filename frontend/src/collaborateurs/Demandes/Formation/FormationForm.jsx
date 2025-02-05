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
    heureSortie: '',
    heureRetour: '',
    codAutorisation: '',
    codeSoc: '',
    matPersId: '',
    file: null, // Ensure file is handled correctly
  });

  const [errors, setErrors] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State for dropdown options
  const [types, setTypes] = useState([]);
  const [titres, setTitres] = useState([]);
  const [themes, setThemes] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const typesResponse = await fetch('http://localhost:8080/api/types').then((res) => res.json());
        const titresResponse = await fetch('http://localhost:8080/api/titres').then((res) => res.json());
        const themesResponse = await fetch('http://localhost:8080/api/themes').then((res) => res.json());
  
        setTypes(typesResponse);
        setTitres(titresResponse);
        setThemes(themesResponse);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, file: 'File size must be less than 5MB' });
    } else {
      setFormData({ ...formData, file });
      setErrors({ ...errors, file: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.dateDebut) newErrors.dateDebut = 'Date Début is required';
    if (!formData.dateFin) newErrors.dateFin = 'Date Fin is required';
    if (formData.dateDebut && formData.dateFin && formData.dateDebut > formData.dateFin) {
      newErrors.dateFin = 'Date Fin must be after Date Début';
    }
    if (!formData.typeDemande) newErrors.typeDemande = 'Type de demande is required';
    if (!formData.texteDemande) newErrors.texteDemande = 'Texte Demande is required';
    if (!formData.file) newErrors.file = 'Fichier Joint is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const requestData = new FormData();
    Object.keys(formData).forEach((key) => {
      requestData.append(key, formData[key]);
    });

    try {
      const response = await fetch('http://localhost:8080/api/demande-autorisation/create', {
        method: 'POST',
        body: requestData, // `FormData` handles `multipart/form-data`
      });

      if (!response.ok) throw new Error('Failed to submit request');
      
      alert('Demande envoyée avec succès!');
      setFormData({
        dateDebut: '',
        dateFin: '',
        typeDemande: '',
        texteDemande: '',
        cod_tit: '', 
        cod_typ: '', 
        cod_theme: '', 
        heureSortie: '',
        heureRetour: '',
        codAutorisation: '',
        codeSoc: '',
        matPersId: '',
        file: null,
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Erreur lors de l’envoi de la demande.');
    }
  };

  return (
    <div className="app">
      <Navbar />
      <Sidebar isSidebarOpen={isSidebarOpen} onToggle={handleSidebarToggle} />

      <div className="content">
        <form className="form" onSubmit={handleSubmit}>
          <h2>Demande de Formation</h2>

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

          <div className="form-group">
            <label>Titre de la formation:</label>
            <select
              name="cod_tit"
              value={formData.cod_tit}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionnez un titre</option>
              {titres.map((titre) => (
                <option key={titre.id} value={titre.id}>
                  {titre.nom} {/* Assuming 'nom' is the field for the title name */}
                </option>
              ))}
            </select>
            {errors.cod_tit && <span className="error">{errors.cod_tit}</span>}
          </div>

          <div className="form-group">
            <label>Type de la formation:</label>
            <select
              name="cod_typ"
              value={formData.cod_typ}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionnez un type</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.nom} {/* Assuming 'nom' is the field for the type name */}
                </option>
              ))}
            </select>
            {errors.cod_typ && <span className="error">{errors.cod_typ}</span>}
          </div>

          <div className="form-group">
            <label>Thème de la formation:</label>
            <select
              name="cod_theme"
              value={formData.cod_theme}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionnez un thème</option>
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.nom} {/* Assuming 'nom' is the field for the theme name */}
                </option>
              ))}
            </select>
            {errors.cod_theme && <span className="error">{errors.cod_theme}</span>}
          </div>
          <div className="form-group">
            <label>Texte Demande:</label>
            <textarea name="texteDemande" value={formData.texteDemande} onChange={handleChange} required></textarea>
            {errors.texteDemande && <span className="error">{errors.texteDemande}</span>}
          </div>

          <div className="form-group">
            <label>Fichier Joint:</label>
            <input type="file" name="file" onChange={handleFileChange} required />
            {errors.file && <span className="error">{errors.file}</span>}
          </div>

          <button type="submit" className="submit-button">Soumettre</button>
        </form>
      </div>
    </div>
  );
};

export default FormationForm;
