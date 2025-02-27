import React, { useState } from 'react';
import './AjoutPersonnel.css';
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";

const PersonnelForm = () => {
  const [matricule, setMatricule] = useState('');
  const [email, setEmail] = useState('');
  const [code_soc, setCodeSoc] = useState(''); // Add state for code_soc
  const [personnelList, setPersonnelList] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!matricule || !email || !code_soc) {
      setErrorMessage('Veuillez remplir tous les champs.');
      setSuccessMessage('');
      return;
    }

    const newPersonnel = { matricule, email, code_soc }; // Include code_soc in the object

    try {
      const response = await fetch('http://localhost:8080/api/Personnel/addWithMatriculeAndEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPersonnel),
      });

      const data = await response.json(); // Parse the JSON response

      if (!response.ok) {
        throw new Error(data.message || 'Une erreur est survenue.');
      }

      // Update the personnel list
      setPersonnelList([...personnelList, data.personnel]);
      setSuccessMessage(data.message || 'Personnel ajouté avec succès.');
      setErrorMessage('');
      setMatricule('');
      setEmail('');
      setCodeSoc(''); // Reset code_soc field
    } catch (error) {
      setErrorMessage(error.message);
      setSuccessMessage('');
    }
  };

  return (
    <div className="accueil-containerajpp">
      <Navbar />
      <Sidebar />
      <div className="personnel-form-container">
        <h2>Ajouter un Personnel</h2>

        {/* Display success or error message */}
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="personnel-form">
          <div className="form-group">
            <label htmlFor="matricule">Matricule</label>
            <input
              type="text"
              id="matricule"
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
              placeholder="Entrez le matricule"
              maxLength="5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Entrez l'email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="code_soc">Code Soc</label>
            <input
              type="text"
              id="code_soc"
              value={code_soc} // Bind to code_soc state
              onChange={(e) => setCodeSoc(e.target.value)} // Update code_soc state
              placeholder="Entrez le code soc"
            />
          </div>

          <button type="submit" className="submit-btn">
            Ajouter Personnel
          </button>
        </form>

        {/* Display the list of personnel */}
        <div className="personnel-list">
          <h3>Liste du Personnel</h3>
          <ul>
            {personnelList.map((personnel, index) => (
              <li key={index}>
                <strong>Matricule:</strong> {personnel.matricule}, <strong>Email:</strong> {personnel.email}, <strong>Code Soc:</strong> {personnel.code_soc}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PersonnelForm;