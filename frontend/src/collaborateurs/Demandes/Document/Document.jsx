import React, { useState, useEffect } from 'react';
import './Document.css';
import Navbar from '../../Components/Navbar/Navbar';
import Sidebar from '../../Components/Sidebar/Sidebar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DocumentForm = () => {
  const [formData, setFormData] = useState({
    typeDemande: 'Document',
    texteDemande: '',
    codeSoc: '',
    file: null,
    typeDocument: '',
    matPers: { id: '' },
  });

  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userCodeSoc = localStorage.getItem('userCodeSoc');

    if (userId && userCodeSoc) {
      setFormData((prevData) => ({
        ...prevData,
        codeSoc: userCodeSoc,
        matPers: { id: userId },
      }));
    }
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.typeDocument || !formData.texteDemande) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      setIsSubmitting(false);
      return;
    }

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast.error('Token d\'authentification manquant');
      setIsSubmitting(false);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('typeDemande', formData.typeDemande);
    formDataToSend.append('texteDemande', formData.texteDemande);
    formDataToSend.append('codeSoc', formData.codeSoc);
    formDataToSend.append('typeDocument', formData.typeDocument);
    formDataToSend.append('matPersId', formData.matPers.id);

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La taille du fichier ne doit pas dépasser 5 Mo.');
        setIsSubmitting(false);
        return;
      }
      formDataToSend.append('file', file);
    }

    try {
      const response = await fetch('http://localhost:8080/api/demande-document/create', {
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
        toast.success('Demande de document soumise avec succès !');
        setError('');
        setFormData({
          typeDemande: 'Document',
          texteDemande: '',
          codeSoc: '',
          file: null,
          typeDocument: '',
          matPers: { id: '' },
        });
        setFile(null);
      } else {
        const resultText = await response.text();
        console.log('Formulaire soumis avec succès :', resultText);
        toast.success('Demande de document soumise avec succès !');
        setError('');
      }
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire :', error);
      toast.error('Erreur lors de la soumission du formulaire : ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="main-content flex-grow-1">
        <Navbar />
        <div className="container mt-4">
          <form onSubmit={handleSubmit} className="autorisation-form container p-4 shadow rounded">
            <h2 className="text-center mb-4">Formulaire Document</h2>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="full-width">
              <label className="form-label">Type de Document :</label>
              <select
                name="typeDocument"
                value={formData.typeDocument}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionnez un type</option>
                <option value="Documents administratifs et légaux">Documents administratifs et légaux</option>
                <option value="Documents fiscaux">Documents fiscaux</option>
                <option value="Documents sociaux">Documents sociaux</option>
                <option value="Documents de formation et de développement professionnel">Documents de formation et de développement professionnel</option>
                <option value="Documents liés à la sécurité sociale">Documents liés à la sécurité sociale</option>
                <option value="Documents liés à la santé et à la sécurité">Documents liés à la santé et à la sécurité</option>
                <option value="Documents de fin de contrat">Documents de fin de contrat</option>
              </select>
            </div>

            <div className="full-width">
              <label className="form-label">texteDemande :</label>
              <textarea
                type="textarea"
                name="texteDemande"
                value={formData.texteDemande}
                onChange={handleChange}
                required
              />
            </div>

            <div className="full-width">
              <label className="form-label">Fichier Joint : (optionnel)</label>
              <input
                type="file"
                name="file"
                onChange={handleFileChange}
              />
            </div>

            <button type="submit" className="btn btn-primary mt-4" disabled={isSubmitting}>
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
            </button>
          </form>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default DocumentForm;