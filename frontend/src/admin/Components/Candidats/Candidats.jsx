import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { API_URL } from "../../../config";
import {
  FiArrowLeft,
  FiDownload,
  FiXCircle,
  FiRefreshCw,
  FiUser,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiChevronDown,
  FiChevronUp,
  FiEye,
} from "react-icons/fi";
import "./Candidats.css";
import { FaStar } from "react-icons/fa";

const CandidatsPostulation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidats, setCandidats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedSkills, setExpandedSkills] = useState({});
  const [totalCandidates, setTotalCandidates] = useState(0);

  useEffect(() => {
    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail);
    };

    window.addEventListener("sidebarToggled", handleSidebarToggle);
    return () => window.removeEventListener("sidebarToggled", handleSidebarToggle);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.add(savedTheme);
  }, []);

  const fetchCandidats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!id) throw new Error("ID de candidature non défini");

      // Récupération du nombre de candidats avec credentials
      const countResponse = await fetch(`${API_URL}/api/candidats/${id}/candidate-count`, {
        credentials: 'include'
      });
      
      if (!countResponse.ok) throw new Error(`Échec du chargement du nombre de candidats : ${countResponse.statusText}`);
      const count = await countResponse.json();
      setTotalCandidates(count);

      // Récupération des candidats avec credentials
      const candidatesResponse = await fetch(`${API_URL}/api/candidats/by-position/${id}`, {
        credentials: 'include'
      });
      
      if (!candidatesResponse.ok) throw new Error(`Échec du chargement des candidats : ${candidatesResponse.statusText}`);

      const responseData = await candidatesResponse.json();
      
      // Vérification si la réponse est un tableau ou contient un tableau dans une propriété
      let candidatesArray = Array.isArray(responseData) ? responseData : 
                          (responseData.candidates || responseData.content || []);
      
      if (!Array.isArray(candidatesArray)) {
        throw new Error("Format de données invalide reçu de l'API");
      }

      const formattedCandidates = candidatesArray.map(candidat => ({
        ...candidat,
        id: candidat.id || candidat._id,
        matchedSkills: Array.isArray(candidat.matchedSkills)
          ? Object.fromEntries(candidat.matchedSkills.map(skill => [skill, 100]))
          : (candidat.matchedSkills || {}),
        missingSkills: Array.isArray(candidat.missingSkills)
          ? Object.fromEntries(candidat.missingSkills.map(skill => [skill, 0]))
          : (candidat.missingSkills || {}),
        date_candidature: candidat.dateCandidature || candidat.date_candidature || null,
        score: Math.round(candidat.matchPercentage || candidat.score || 0),
        status: candidat.accepted ? "Accepté" : "En attente",
        experience: "N/A"
      }));

      setCandidats(formattedCandidates);
      initializeExpandedSkills(formattedCandidates);
    } catch (error) {
      console.error("Erreur de récupération :", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const initializeExpandedSkills = (candidates) => {
    const initialExpandedState = {};
    candidates.forEach(candidat => {
      initialExpandedState[`tech-${candidat.id}`] = false;
      initialExpandedState[`lang-${candidat.id}`] = false;
    });
    setExpandedSkills(initialExpandedState);
  };

  useEffect(() => {
    fetchCandidats();
  }, [id]);

  const handleDownloadCV = async (candidatId) => {
    try {
      if (!candidatId) {
        throw new Error("ID du candidat manquant.");
      }

      const response = await fetch(`${API_URL}/api/candidats/${candidatId}/cv`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Échec du téléchargement du CV : ${response.statusText}`);
      }

      const blob = await response.blob();

      // Extraction du nom de fichier depuis l'en-tête Content-Disposition
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "cv.pdf";
      if (contentDisposition && contentDisposition.includes("filename=")) {
        filename = contentDisposition.split("filename=")[1].replace(/"/g, "");
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur lors du téléchargement du CV :", error);
      alert("Erreur lors du téléchargement du CV : " + error.message);
    }
  };

  const handleViewCV = async (candidatId) => {
    try {
      if (!candidatId) {
        throw new Error("ID du candidat manquant.");
      }

      const response = await fetch(`${API_URL}/api/candidats/${candidatId}/cv`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Échec de l'ouverture du CV : ${response.statusText}`);
      }

      const blob = await response.blob();
      const fileURL = URL.createObjectURL(blob);
      window.open(fileURL, "_blank", "noopener,noreferrer");

      // Nettoyage après un délai
      setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
    } catch (error) {
      console.error("Erreur lors de l'ouverture du CV :", error);
      alert("Erreur lors de l'ouverture du CV : " + error.message);
    }
  };

  const toggleSkills = (skillType, candidatId) => {
    setExpandedSkills(prev => ({
      ...prev,
      [`${skillType}-${candidatId}`]: !prev[`${skillType}-${candidatId}`]
    }));
  };

  const renderSkills = (skills, skillType, candidatId) => {
    if (!skills || Object.keys(skills).length === 0) {
      return <p className="no-skills">Aucune Compétence</p>;
    }

    const isExpanded = expandedSkills[`${skillType}-${candidatId}`];
    const visibleSkills = isExpanded
      ? Object.entries(skills)
      : Object.entries(skills).slice(0, 3);

    return (
      <>
        <div className="skills-container">
          {visibleSkills.map(([skill, percentage]) => (
            <div key={skill} className="skill-item">
              <div className="skill-info">
                <span className="skill-name">{skill}</span>
                <span className="skill-percentage">
                  {Math.round(percentage)}%
                </span>
              </div>
              <div className="skill-bar-container">
                <div
                  className="skill-bar"
                  style={{ width: `${Math.round(percentage)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        {Object.keys(skills).length > 3 && (
          <button
            className="skills-toggle"
            onClick={() => toggleSkills(skillType, candidatId)}
          >
            {isExpanded ? "Voir moins" : "Voir plus"}
          </button>
        )}
      </>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  if (loading) return <div className="loading-container">Chargement des candidats...</div>;
  if (error) return <div className="error-container">Erreur : {error}</div>;
  if (candidats.length === 0) return <div className="empty-state">Aucun candidat trouvé</div>;

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className={`candidats-container ${sidebarCollapsed ? "collapsed" : ""}`}>
        <Navbar theme={theme} />
        <div className="candidats-content">
          <div className="header-section">
            <button onClick={() => navigate(-1)} className="back-button">
              <FiArrowLeft /> Retour
            </button>
            <h2>Candidats par poste</h2>
            <div className="candidate-count">{totalCandidates} candidats</div>
          </div>

          <div className="candidats-grid">
            {candidats.map(candidat => (
              <div key={candidat.id} className="candidat-card">
                <div className="candidat-header">
                  <div className="candidat-info">
                    <h3>{candidat.nom} {candidat.prenom}, {candidat.age} ans</h3>
                    <div className="candidat-meta">
                      <span><FaStar /> {candidat.score}% correspondance</span>
                    </div>
                  </div>
                  <div className={`status-badge ${candidat.status.toLowerCase()}`}>
                    {candidat.status}
                  </div>
                </div>

                <div className="candidat-body">
                  <div className="candidat-contact">
                    <div><FiMail /> {candidat.email}</div>
                    <div><FiPhone /> {candidat.numTel}</div>
                  </div>
                  <div className="skills-section">
                    <h4>Compétences correspondantes</h4>
                    {renderSkills(candidat.matchedSkills, "tech", candidat.id)}
                  </div>
                  <div className="skills-section">
                    <h4>Compétences manquantes</h4>
                    {renderSkills(candidat.missingSkills, "lang", candidat.id)}
                  </div>
                  <div className="detail-item">
                    <span>Date de candidature :</span>
                    <span>{formatDate(candidat.date_candidature)}</span>
                  </div>
                </div>

                <div className="candidat-footer">
                  <button
                    onClick={() => handleDownloadCV(candidat.id)}
                    className="cv-download-button"
                  >
                    <FiDownload /> CV
                  </button>
                  <button onClick={() => handleViewCV(candidat.id)} className="cv-view-button">
                    <FiEye /> Voir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidatsPostulation;