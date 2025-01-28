import React, { useState } from 'react';
import './AutorisationForm.css';
import Navbar from '../../Components/Navbar/Navbar';
import Sidebar from '../../Components/Sidebar/Sidebar';


const AutorisationForm = () => {
  const [formData, setFormData] = useState({
    dat_debut: '',
    dat_fin: '',
    heur_s: '',
    min_s: '',
    heur_r: '',
    min_r: '',
    cod_aut: '',
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

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'file' ? files[0] : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form Data Submitted:', formData);
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="main-content flex-grow-1">
        <Navbar />
        <div className="container mt-4">
        <form onSubmit={handleSubmit} className="autorisation-form container p-4 shadow rounded">
      <h2 className="text-center mb-4">Autorisation Form</h2>
      <div className="row g-3">
        <div className="col-md-6">
          <label htmlFor="dat_debut" className="form-label">Date Début</label>
          <input
            type="date"
            id="dat_debut"
            name="dat_debut"
            className="form-control"
            value={formData.dat_debut}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="dat_fin" className="form-label">Date Fin</label>
          <input
            type="date"
            id="dat_fin"
            name="dat_fin"
            className="form-control"
            value={formData.dat_fin}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-3">
          <label htmlFor="heur_s" className="form-label">Heure Début (h)</label>
          <input
            type="number"
            id="heur_s"
            name="heur_s"
            className="form-control"
            min="0"
            max="23"
            value={formData.heur_s}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-3">
          <label htmlFor="min_s" className="form-label">Minutes Début (m)</label>
          <input
            type="number"
            id="min_s"
            name="min_s"
            className="form-control"
            min="0"
            max="59"
            value={formData.min_s}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-3">
          <label htmlFor="heur_r" className="form-label">Heure Retour (h)</label>
          <input
            type="number"
            id="heur_r"
            name="heur_r"
            className="form-control"
            min="0"
            max="23"
            value={formData.heur_r}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-3">
          <label htmlFor="min_r" className="form-label">Minutes Retour (m)</label>
          <input
            type="number"
            id="min_r"
            name="min_r"
            className="form-control"
            min="0"
            max="59"
            value={formData.min_r}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="cod_aut" className="form-label">Code Autorisation</label>
          <input
            type="text"
            id="cod_aut"
            name="cod_aut"
            className="form-control"
            value={formData.cod_aut}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="id_libre_demande" className="form-label">ID Libre Demande</label>
          <input
            type="text"
            id="id_libre_demande"
            name="id_libre_demande"
            className="form-control"
            value={formData.id_libre_demande}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="cod_soc" className="form-label">Code Société</label>
          <input
            type="text"
            id="cod_soc"
            name="cod_soc"
            className="form-control"
            value={formData.cod_soc}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="mat_pers" className="form-label">Matricule Personnel</label>
          <input
            type="text"
            id="mat_pers"
            name="mat_pers"
            className="form-control"
            value={formData.mat_pers}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="typ_demande" className="form-label">Type Demande</label>
          <input
            type="text"
            id="typ_demande"
            name="typ_demande"
            className="form-control"
            value={formData.typ_demande}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="date_demande" className="form-label">Date Demande</label>
          <input
            type="date"
            id="date_demande"
            name="date_demande"
            className="form-control"
            value={formData.date_demande}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="fichier_joint" className="form-label">Fichier Joint</label>
          <input
            type="file"
            id="fichier_joint"
            name="fichier_joint"
            className="form-control"
            onChange={handleChange}
          />
        </div>
        <div className="col-md-12">
          <label htmlFor="reponse_chef" className="form-label">Réponse Chef</label>
          <textarea
            id="reponse_chef"
            name="reponse_chef"
            className="form-control"
            value={formData.reponse_chef}
            onChange={handleChange}
          ></textarea>
        </div>
        <div className="col-md-12">
          <label htmlFor="reponse" className="form-label">Réponse</label>
          <textarea
            id="reponse"
            name="reponse"
            className="form-control"
            value={formData.reponse}
            onChange={handleChange}
          ></textarea>
        </div>
        <div className="col-md-12">
          <label htmlFor="txt_dem" className="form-label">Texte Demande</label>
          <textarea
            id="txt_dem"
            name="txt_dem"
            className="form-control"
            value={formData.txt_dem}
            onChange={handleChange}
          ></textarea>
        </div>
      </div>
      <button type="submit" className="btn btn-primary mt-4">Submit</button>
    </form>

        </div>
      </div>
    </div>
  );
};

export default AutorisationForm;
