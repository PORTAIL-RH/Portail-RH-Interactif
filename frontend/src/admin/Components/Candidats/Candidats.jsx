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
      
      if (!id) throw new Error("Candidature ID is undefined");

      // Fetch candidate count with credentials
      const countResponse = await fetch(`${API_URL}/api/candidats/${id}/candidate-count`, {
        credentials: 'include'
      });
      
      if (!countResponse.ok) throw new Error(`Failed to load candidate count: ${countResponse.statusText}`);
      const count = await countResponse.json();
      setTotalCandidates(count);

      // Fetch candidates with credentials
      const candidatesResponse = await fetch(`${API_URL}/api/candidats/by-position/${id}`, {
        credentials: 'include'
      });
      
      if (!candidatesResponse.ok) throw new Error(`Failed to load candidates: ${candidatesResponse.statusText}`);

      const responseData = await candidatesResponse.json();
      
      // Check if the response is an array or contains an array in a property
      let candidatesArray = Array.isArray(responseData) ? responseData : 
                          (responseData.candidates || responseData.content || []);
      
      if (!Array.isArray(candidatesArray)) {
        throw new Error("Invalid data format received from API");
      }

      const formattedCandidates = candidatesArray.map(candidat => ({
        ...candidat,
        id: candidat.id || candidat._id, // Handle both id and _id cases
        technicalSkills: candidat.technicalSkills || {},
        languageSkills: candidat.languageSkills || {},
        date_candidature: candidat.dateCandidature || candidat.date_candidature || null,
        score: Math.round(candidat.matchPercentage || candidat.score || 0),
        status: candidat.accepted ? "Accepted" : "Pending",
        experience: "N/A"
      }));

      setCandidats(formattedCandidates);
      initializeExpandedSkills(formattedCandidates);
    } catch (error) {
      console.error("Fetch error:", error);
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

  const handleDownloadCV = async (candidatId, cvFilePath) => {
    try {
      if (!cvFilePath) throw new Error("No CV file available");

      const response = await fetch(`${API_URL}/api/candidats/${candidatId}/cv`, {
        method: "GET",
        credentials: "include"
      });

      if (!response.ok) throw new Error("Failed to download CV");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = cvFilePath.split('/').pop() || "CV.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading CV:", error);
      alert("Error downloading CV: " + error.message);
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
      return <p className="no-skills">No skills specified</p>;
    }

    const isExpanded = expandedSkills[`${skillType}-${candidatId}`];
    const visibleSkills = isExpanded ? Object.entries(skills) : Object.entries(skills).slice(0, 3);

    return (
      <>
        <div className="skills-container">
          {visibleSkills.map(([skill, percentage]) => (
            <div key={skill} className="skill-item">
              <div className="skill-info">
                <span className="skill-name">{skill}</span>
                <span className="skill-percentage">{Math.round(percentage)}%</span>
              </div>
              <div className="skill-bar-container">
                <div className="skill-bar" style={{ width: `${Math.round(percentage)}%` }}></div>
              </div>
            </div>
          ))}
        </div>
        {Object.keys(skills).length > 3 && (
          <button 
            className="skills-toggle" 
            onClick={() => toggleSkills(skillType, candidatId)}
          >
            {isExpanded ? "Show Less" : "Show More"}
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

  if (loading) return <div className="loading-container">Loading candidates...</div>;
  if (error) return <div className="error-container">Error: {error}</div>;
  if (candidats.length === 0) return <div className="empty-state">No candidates found</div>;

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className={`candidats-container ${sidebarCollapsed ? "collapsed" : ""}`}>
        <Navbar theme={theme} />
        <div className="candidats-content">
          <div className="header-section">
            <button onClick={() => navigate(-1)} className="back-button">
              <FiArrowLeft /> Back
            </button>
            <h2>Candidates for Position</h2>
            <div className="candidate-count">{totalCandidates} candidates</div>
          </div>

          <div className="candidats-grid">
            {candidats.map(candidat => (
              <div key={candidat.id} className="candidat-card">
                <div className="candidat-header">
                  <div className="candidat-info">
                    <h3>{candidat.nom} {candidat.prenom}, {candidat.age} years</h3>
                    <div className="candidat-meta">
                      <span><FiBriefcase /> {candidat.experience}</span>
                      <span><FaStar /> {candidat.score}% match</span>
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
                    <h4>Technical Skills</h4>
                    {renderSkills(candidat.technicalSkills, "tech", candidat.id)}
                  </div>

                  <div className="skills-section">
                    <h4>Language Skills</h4>
                    {renderSkills(candidat.languageSkills, "lang", candidat.id)}
                  </div>

                  <div className="detail-item">
                    <span>Application Date:</span>
                    <span>{formatDate(candidat.date_candidature)}</span>
                  </div>
                </div>

                <div className="candidat-footer">
                  <button
                    onClick={() => handleDownloadCV(candidat.id, candidat.cvFilePath)}
                    disabled={!candidat.cvFilePath}
                    title={candidat.cvFilePath ? "Download CV" : "No CV available"}
                  >
                    <FiDownload /> CV
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