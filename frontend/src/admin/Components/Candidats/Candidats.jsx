import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { FiSearch, FiFilter, FiCalendar, FiArrowLeft, FiDownload, FiEye, FiXCircle, FiClock, FiRefreshCw, FiUser, FiMail, FiPhone, FiFileText, FiMapPin, FiBriefcase } from "react-icons/fi";
import "./Candidats.css";

const CandidatsPostulation = () => {
  const { id } = useParams(); // Extract the `id` parameter from the URL
  const navigate = useNavigate();
  const [candidats, setCandidats] = useState([]); // Store fetched candidates
  const [filteredCandidats, setFilteredCandidats] = useState([]); // Store filtered candidates
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  // Fetch candidates for the specific candidature
  useEffect(() => {
    const fetchCandidats = async () => {
      try {
        if (!id) {
          console.error("Candidature ID is undefined");
          return;
        }

        console.log("Fetching candidates for candidature ID:", id);
        const url = `http://localhost:8080/api/candidats/byCandidature/${id}`;
        console.log("Fetch URL:", url);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Erreur lors du chargement des candidats: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Fetched data:", data);

        // Ensure `skills` is defined
        if (!data.skills) {
          data.skills = []; // Set a default value for `skills`
        }

        // Handle single candidate object
        setCandidats([data]);
        setFilteredCandidats([data]);
      } catch (error) {
        console.error("Fetch error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidats();
  }, [id]);

  // Render the component
  return (
    <div className="app-container">
      <Sidebar />
      <div className="candidats-container">
        <Navbar />
        <div className="candidats-content">
          {/* Loading State */}
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Chargement des candidats...</p>
            </div>
          ) : error ? (
            // Error State
            <div className="error-container">
              <div className="error-icon">
                <FiXCircle size={48} />
              </div>
              <h2>Erreur lors du chargement des données</h2>
              <p>{error}</p>
              <button className="retry-button" onClick={() => window.location.reload()}>
                <FiRefreshCw /> Réessayer
              </button>
            </div>
          ) : (
            // Success State
            <div className="candidats-grid">
              {filteredCandidats.map((candidat) => (
                <div key={candidat.id} className="candidat-card">
                  <div className="candidat-header">
                    <div className="candidat-photo">
                      <img src={candidat.photo || "/placeholder.svg"} alt={candidat.nom} />
                    </div>
                    <div className="candidat-info">
                      <h3 className="candidat-name">{candidat.nom} {candidat.prenom}</h3>
                      <div className="candidat-meta">
                        <span className="candidat-experience">{candidat.experience}</span>
                        <span className="candidat-location">
                          <FiMapPin className="meta-icon" />
                          {candidat.location}
                        </span>
                      </div>
                    </div>
                    <div className="candidat-status">
                      <span className={`status-badge ${candidat.status}`}>
                        {candidat.status}
                      </span>
                    </div>
                  </div>

                  <div className="candidat-body">
                    <div className="candidat-contact">
                      <div className="contact-item">
                        <FiMail className="contact-icon" />
                        <span>{candidat.email}</span>
                      </div>
                      <div className="contact-item">
                        <FiPhone className="contact-icon" />
                        <span>{candidat.numTel}</span>
                      </div>
                    </div>

                    <div className="candidat-skills">
                      {candidat.skills?.slice(0, 5).map((skill, index) => (
                        <span key={index} className="skill-badge">{skill}</span>
                      ))}
                      {candidat.skills?.length > 5 && (
                        <span className="skill-badge more">+{candidat.skills.length - 5}</span>
                      )}
                    </div>

                    <div className="candidat-details">
                      <div className="detail-item">
                        <span className="detail-label">Date de candidature</span>
                        <span className="detail-value">
                          {candidat.applicationDate ? new Date(candidat.applicationDate).toLocaleDateString("fr-FR") : "N/A"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Formation</span>
                        <span className="detail-value education">{candidat.education || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="candidat-footer">
                    <button
                      className="action-button view"
                      onClick={() => navigate(`/candidats/${candidat.id}`)}
                      title="Voir les détails"
                    >
                      <FiEye />
                      <span>Détails</span>
                    </button>
                    <button
                      className="action-button download"
                      onClick={() => alert(`Téléchargement du CV de ${candidat.nom}`)}
                      title="Télécharger le CV"
                    >
                      <FiDownload />
                      <span>CV</span>
                    </button>
                    <button
                      className="action-button download"
                      onClick={() => alert(`Téléchargement de la lettre de motivation de ${candidat.nom}`)}
                      title="Télécharger la lettre de motivation"
                    >
                      <FiFileText />
                      <span>LM</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidatsPostulation;