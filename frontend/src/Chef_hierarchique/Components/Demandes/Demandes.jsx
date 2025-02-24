import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import "./Demandes.css";

const Demandes = () => {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredDemandes, setFilteredDemandes] = useState([]);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [error, setError] = useState(null);

  const fetchDemandes = async () => {
    try {
      const token = localStorage.getItem("authToken");

      // Fetch demande-conge
      const congeResponse = await fetch("http://localhost:8082/api/demande-conge", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!congeResponse.ok) {
        const errorText = await congeResponse.text();
        throw new Error(`Conge request failed: ${congeResponse.status} - ${errorText}`);
      }

      const congeData = await congeResponse.json();

      const mappedCongeData = congeData.map((demande) => ({
        ...demande,
        dateDemande: demande.dateDemande || demande.dateCreation || "Inconnu",
      }));

      // Fetch demande-autorisation
      const autorisationResponse = await fetch("http://localhost:8082/api/demande-autorisation", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!autorisationResponse.ok) {
        const errorText = await autorisationResponse.text();
        throw new Error(`Autorisation request failed: ${autorisationResponse.status} - ${errorText}`);
      }

      const autorisationData = await autorisationResponse.json();

      // Fetch demande-formation
      const formationResponse = await fetch("http://localhost:8082/api/demande-formation", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!formationResponse.ok) {
        const errorText = await formationResponse.text();
        throw new Error(`Formation request failed: ${formationResponse.status} - ${errorText}`);
      }

      const formationData = await formationResponse.json();

      // Fetch demande-pre-avance
      const preAvanceResponse = await fetch("http://localhost:8082/api/demande-pre-avance", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!preAvanceResponse.ok) {
        const errorText = await preAvanceResponse.text();
        throw new Error(`PreAvance request failed: ${preAvanceResponse.status} - ${errorText}`);
      }

      const preAvanceData = await preAvanceResponse.json();

      // Fetch demande-document
      const documentResponse = await fetch("http://localhost:8082/api/demande-document", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!documentResponse.ok) {
        const errorText = await documentResponse.text();
        throw new Error(`Document request failed: ${documentResponse.status} - ${errorText}`);
      }

      const documentData = await documentResponse.json();

      // Combine the data
      const combinedData = [
        ...mappedCongeData,
        ...formationData,
        ...autorisationData,
        ...preAvanceData,
        ...documentData,
      ];

      // Filter demands to include only those from personnel with role "Collaborateur"
      const filteredData = combinedData.filter((demande) => {
        return demande.matPers?.role === "collaborateur"; 
      });

      setDemandes(filteredData);
      setFilteredDemandes(filteredData);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  useEffect(() => {
    let filtered = demandes;

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((demande) => demande.typeDemande === selectedType);
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter((demande) => demande.reponseChef === selectedStatus);
    }

    // Filter by date range (using dateDemande)
    if (startDate && endDate) {
      filtered = filtered.filter((demande) => {
        const demandeDate = new Date(demande.dateDemande);
        return demandeDate >= new Date(startDate) && demandeDate <= new Date(endDate);
      });
    }

    setFilteredDemandes(filtered);
  }, [selectedType, selectedStatus, startDate, endDate, demandes]);

  const handleTypeChange = (e) => {
    setSelectedType(e.target.value);
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="demandes-container">
      <Navbar />
      <div className="main-content">
        <Sidebar />
        <div className="demandes-content">
          <h1>Liste des Demandes</h1>

          {/* Filters */}
          <div className="filters">
            <select value={selectedType} onChange={handleTypeChange}>
              <option value="all">Tous les types</option>
              <option value="autorisation">Autorisation</option>
              <option value="congé">Congé</option>
              <option value="formation">Formation</option>
              <option value="preAvance">PreAvance</option>
              <option value="document">Document</option>
            </select>

            <select value={selectedStatus} onChange={handleStatusChange}>
              <option value="all">Tous les statuts</option>
              <option value="I">En attente</option>
              <option value="O">Approuvé</option>
              <option value="N">Rejeté</option>
              <option value="T">Traitee</option>
            </select>

            <div className="date-range">
              <input
                type="date"
                value={startDate || ""}
                onChange={handleStartDateChange}
                placeholder="Date de début"
              />
              <input
                type="date"
                value={endDate || ""}
                onChange={handleEndDateChange}
                placeholder="Date de fin"
              />
            </div>
          </div>

          {/* Demandes Table */}
          <table className="demandes-table">
            <thead>
              <tr>
                <th>Date Demande</th>
                <th>Type</th>
                <th>Nom</th>
                <th>Date</th>
                <th>Texte Demande</th>
                <th>Statut</th>
                <th>Détails</th>
              </tr>
            </thead>
            <tbody>
              {filteredDemandes.map((demande) => (
                <tr key={demande.id || demande.id_libre_demande}>
                  <td>
                    {demande.dateDemande
                      ? new Date(demande.dateDemande).toLocaleDateString()
                      : "Inconnu"}
                  </td>
                  <td>{demande.typeDemande}</td>
                  <td>{demande.matPers?.nom || "Inconnu"}</td>
                  <td>
                    {demande.dateDebut && demande.dateFin
                      ? `${new Date(demande.dateDebut).toLocaleDateString()} - ${new Date(demande.dateFin).toLocaleDateString()}`
                      : demande.dateDebut
                      ? new Date(demande.dateDebut).toLocaleDateString()
                      : "Inconnu"}
                  </td>
                  <td>{demande.texteDemande || "N/A"}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        demande.reponseChef === "I"
                          ? "pending"
                          : demande.reponseChef === "O"
                          ? "approved"
                          : demande.reponseChef === "N"
                          ? "rejected"
                          : "processed"
                      }`}
                    >
                      {demande.reponseChef === "I"
                        ? "En attente"
                        : demande.reponseChef === "O"
                        ? "Approuvé"
                        : demande.reponseChef === "N"
                        ? "Rejeté"
                        : "Traitee"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="details-button"
                      onClick={() => console.log("Afficher les détails pour :", demande)}
                    >
                      Voir détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Demandes;