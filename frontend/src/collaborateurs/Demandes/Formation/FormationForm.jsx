import React, { useState } from 'react';
import './Formation.css';
import Navbar from '../../Components/Navbar/Navbar';
import Sidebar from '../../Components/Sidebar/Sidebar';

const FormationForm = () => {
  const [formData, setFormData] = useState({
    date_debut: '',
    date_fin: '',
    cod_tit: '',
    cod_typ: '',
    cod_theme: '',
    annee_f: '',
    id_libre_demande: '',
    cod_soc: '',
    mat_pers: '',
    typ_demande: '',
    date_demande: '',
    fichier_joint: null,
    reponse_chef: '',
    reponse: '',
    txt_dem: '',
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, fichier_joint: e.target.files[0] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form Data Submitted:', formData);
  };

  return (
    <div className="app">
      {/* Navbar */}
      <Navbar />

      {/* Sidebar */}
      <Sidebar isSidebarOpen={isSidebarOpen} onToggle={handleSidebarToggle} />

      {/* Formulaire de Formation */}
      <div className="content">
        <form className="form" onSubmit={handleSubmit}>
          <h2>Demande de Formation</h2>

          <label>
            Date Début:
            <input
              type="date"
              name="date_debut"
              value={formData.date_debut}
              onChange={handleChange}
              required
            />
          </label>
          
          <label>
            Date Fin:
            <input
              type="date"
              name="date_fin"
              value={formData.date_fin}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Code Titre:
            <input
              type="text"
              name="cod_tit"
              value={formData.cod_tit}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Code Type:
            <input
              type="text"
              name="cod_typ"
              value={formData.cod_typ}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Code Thème:
            <input
              type="text"
              name="cod_theme"
              value={formData.cod_theme}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Année Formation:
            <input
              type="text"
              name="annee_f"
              value={formData.annee_f}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            ID Libre Demande:
            <input
              type="text"
              name="id_libre_demande"
              value={formData.id_libre_demande}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Code Société:
            <input
              type="text"
              name="cod_soc"
              value={formData.cod_soc}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Matricule Personnel:
            <input
              type="text"
              name="mat_pers"
              value={formData.mat_pers}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Type de Demande:
            <input
              type="text"
              name="typ_demande"
              value={formData.typ_demande}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Date Demande:
            <input
              type="date"
              name="date_demande"
              value={formData.date_demande}
              onChange={handleChange}
              required
            />
          </label>

          <label className="file-label">
            Fichier Joint:
            <input
              type="file"
              name="fichier_joint"
              onChange={handleFileChange}
              required
            />
          </label>

          <label>
            Réponse Chef:
            <input
              type="text"
              name="reponse_chef"
              value={formData.reponse_chef}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Réponse:
            <input
              type="text"
              name="reponse"
              value={formData.reponse}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Texte Demande:
            <textarea
              name="txt_dem"
              value={formData.txt_dem}
              onChange={handleChange}
              required
            ></textarea>
          </label>

          <button type="submit">Soumettre</button>
        </form>
      </div>
    </div>
  );
};

export default FormationForm;
