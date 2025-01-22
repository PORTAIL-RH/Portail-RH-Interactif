import React, { useState, useEffect } from 'react';
import './form.css';

const Form = () => {
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState({
    sexe: '',
    dateNaissance: '',
    situation: '',
    phone: '',
    nbrEnfants: '',
    cin: '',
  });

  const [errors, setErrors] = useState({});

  const calculateProgress = () => {
    const filledFields = Object.values(formData).filter(
      (field) => field !== '' && field !== '0'
    ).length;
    return Math.round((filledFields / Object.keys(formData).length) * 100);
  };

  useEffect(() => {
    setProgress(calculateProgress());
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.sexe) newErrors.sexe = 'Le sexe est requis.';
    if (!formData.dateNaissance) newErrors.dateNaissance = 'La date de naissance est requise.';
    if (!formData.situation) newErrors.situation = 'La situation est requise.';
    if (!formData.phone || !/^\d{8,}$/.test(formData.phone)) {
      newErrors.phone = 'Entrez un numéro de téléphone valide.';
    }
    if (formData.nbrEnfants < 0) newErrors.nbrEnfants = 'Le nombre d\'enfants doit être supérieur ou égal à 0.';
    if (!formData.cin || !/^\d{8}$/.test(formData.cin)) {
      newErrors.cin = 'Entrez un CIN valide (8 chiffres).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getProgressBarColor = () => {
    const colorStep = Math.floor(progress / 10);
    const colors = [
      '#d4a5d1', '#c78bb5', '#b77199', '#a6577d', '#9d4470', // shades of purple
      '#913a63', '#842f56', '#782541', '#6b1b2d', '#4c215e'
    ];
    return colors[colorStep];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Formulaire soumis:', formData);
    }
  };

  return (
    <div className="form-container">
      <div className="form-box">
        <h2 className="form-title">Informations Personnelles</h2>

        {/* Instructions text */}
        <p className="instructions-text">
          Pour accéder à votre compte, vous devez compléter ces étapes : 
          <br />
        </p>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
                backgroundColor: getProgressBarColor(), 
              }}
            ></div>
          </div>
          <p className="progress-text">{progress}% Complété</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Sexe</label>
            <select
              name="sexe"
              value={formData.sexe}
              onChange={handleChange}
              className={`form-select ${errors.sexe ? 'error' : ''}`}
            >
              <option value="">Sélectionner...</option>
              <option value="M">Homme</option>
              <option value="F">Femme</option>
            </select>
            {errors.sexe && <p className="error-message">{errors.sexe}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Date de naissance</label>
            <input
              type="date"
              name="dateNaissance"
              value={formData.dateNaissance}
              onChange={handleChange}
              className={`form-input ${errors.dateNaissance ? 'error' : ''}`}
            />
            {errors.dateNaissance && <p className="error-message">{errors.dateNaissance}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Situation</label>
            <select
              name="situation"
              value={formData.situation}
              onChange={handleChange}
              className={`form-select ${errors.situation ? 'error' : ''}`}
            >
              <option value="">Sélectionner...</option>
              <option value="marie">Marié</option>
              <option value="celib">Célibataire</option>
              <option value="divorce">Divorcé</option>
            </select>
            {errors.situation && <p className="error-message">{errors.situation}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Téléphone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Entrez le numéro de téléphone"
              className={`form-input ${errors.phone ? 'error' : ''}`}
            />
            {errors.phone && <p className="error-message">{errors.phone}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Nombre d'enfants</label>
            <input
              type="number"
              name="nbrEnfants"
              value={formData.nbrEnfants}
              onChange={handleChange}
              className={`form-input ${errors.nbrEnfants ? 'error' : ''}`}
            />
            {errors.nbrEnfants && <p className="error-message">{errors.nbrEnfants}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">CIN</label>
            <input
              type="text"
              name="cin"
              value={formData.cin}
              onChange={handleChange}
              placeholder="Entrez le CIN"
              className={`form-input ${errors.cin ? 'error' : ''}`}
            />
            {errors.cin && <span className="error-message">Le CIN doit contenir exactement 8 chiffres.</span>}
          </div>

          <button
            type="submit"
            className={`submit-button ${progress === 100 ? 'complete' : 'incomplete'}`}
            disabled={progress !== 100}
            style={{
              backgroundColor: getProgressBarColor(), // Apply dynamic color to submit button as well
            }}
          >
            Soumettre
          </button>
        </form>
      </div>
    </div>
  );
};

export default Form;
