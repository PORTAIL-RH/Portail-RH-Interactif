import { useState, useEffect } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { FiArrowLeft, FiSun, FiMoon, FiCalendar, FiCopy, FiChevronDown, FiTrash2, FiCheck } from "react-icons/fi";
import "./Profile.css";
import { API_URL } from "../../../config";

const Profile = () => {
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cin: "",
    position: "",
    sexe: "",
    department: "",
    hireDate: "",
    situation: "",
    status: "",
    date_naiss: "",
    serviceName: "",
    skills: [],
    code_soc: "",
    matricule: "",
    nbr_enfants: 0,
    role: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedField, setCopiedField] = useState(null); // Track which field was copied

  const userId = localStorage.getItem("userId");
  const [theme, setTheme] = useState("light")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail);
    };

    window.addEventListener('sidebarToggled', handleSidebarToggle);
    
    return () => {
      window.removeEventListener('sidebarToggled', handleSidebarToggle);
    };
  }, []);
  // Copy to clipboard function
  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000); 
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    setTheme(savedTheme)
    applyTheme(savedTheme)
  }, [])

  const applyTheme = (theme) => {
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(theme)
    localStorage.setItem("theme", theme)
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    applyTheme(newTheme)
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }))
  }
  
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/Personnel/byId/${userId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setUserData({
          firstName: data.nom || "",
          lastName: data.prenom || "",
          email: data.email || "",
          phone: data.telephone || "",
          cin: data.cin || "",
          position: data.position || "",
          sexe: data.sexe || "",
          department: data.department || "",
          hireDate: data.date_embauche || "",
          situation: data.situation || "",
          status: data.status || "",
          date_naiss: data.date_naiss || "",
          serviceName: data.serviceName || "",
          skills: data.skills || [],
          code_soc: data.code_soc || "",
          matricule: data.matricule || "",
          nbr_enfants: data.nbr_enfants || 0,
          role: data.role || "",
        });
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    } else {
      setError("User ID not found in localStorage.");
      setLoading(false);
    }
  }, [userId]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className={`profile-container ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <div className="profile-content">
          <div className="profile-header">
            <div className="profile-header-left">
              <div className="profile-title"></div>
            </div>
            <div className="profile-header-right">
              <div className="profile-date">Added on {formatDate(userData.hireDate)}</div>
            </div>
          </div>

          <div className="profile-main">
            {/* Profile Image Section */}
            <div className="profile-section profile-image-section">
              <div className="section-header">
                <h2>Profile </h2>
              </div>
              <div className="section-content">
                <div className="profile-image-container">
                  <div className="profile-image-placeholder">
                    {userData.firstName.charAt(0)}
                    {userData.lastName.charAt(0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Role Section */}
            <div className="profile-section role-section">
              <div className="section-header">
                <h2>Role</h2>
              </div>
              <div className="section-content">
                <div className="role-group">
                  <div className="role-label">Matricule</div>
                  <div className="role-value">
                    <span className="role-name">{userData.matricule}</span>
                    <button 
                      className="copy-button"
                      onClick={() => copyToClipboard(userData.matricule, 'matricule')}
                      title="Copy Matricule"
                    >
                      {copiedField === 'matricule' ? <FiCheck /> : <FiCopy />}
                    </button>
                  </div>
                </div>

                <div className="role-group">
                  <div className="role-label">Role</div>
                  <div className="role-value">
                    <span className="role-name">{userData.role}</span>
                  </div>
                </div>

                <div className="role-group">
                  <div className="role-label">Code Société</div>
                  <div className="role-value">
                    <span className="role-name">{userData.code_soc}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Employee Details Section */}
            <div className="profile-section employee-details">
              <div className="section-header">
                <h2>Employee Details</h2>
              </div>
              <div className="section-content">
                <div className="detail-group">
                  <div className="detail-label">First Name</div>
                  <div className="detail-value">
                    <span className="detail-value-text">{userData.firstName}</span>
                  </div>
                </div>
                <div className="detail-group">
                  <div className="detail-label">Last Name</div>
                  <div className="detail-value">
                    <span className="detail-value-text">{userData.lastName}</span>
                  </div>
                </div>
                <div className="detail-group">
                  <div className="detail-label">Email Address</div>
                  <div className="detail-value">
                    <span className="detail-value-text">{userData.email}</span>
                    <button 
                      className="copy-button"
                      onClick={() => copyToClipboard(userData.email, 'email')}
                      title="Copy Email"
                    >
                      {copiedField === 'email' ? <FiCheck /> : <FiCopy />}
                    </button>
                  </div>
                </div>
                <div className="detail-group">
                  <div className="detail-label">Phone Number</div>
                  <div className="detail-value">
                    <span className="detail-value-text">{userData.phone}</span>
                    <button 
                      className="copy-button"
                      onClick={() => copyToClipboard(userData.phone, 'phone')}
                      title="Copy Phone"
                    >
                      {copiedField === 'phone' ? <FiCheck /> : <FiCopy />}
                    </button>
                  </div>
                </div>

                <div className="detail-group">
                  <div className="detail-label">CIN</div>
                  <div className="detail-value">
                    <span className="detail-value-text">{userData.cin}</span>
                  </div>
                </div>
                <div className="detail-group">
                  <div className="detail-label">Date of Birth</div>
                  <div className="detail-value">
                    <span className="detail-value-text">{formatDate(userData.date_naiss)}</span>
                  </div>
                </div>
                <div className="detail-group">
                  <div className="detail-label">Situation</div>
                  <div className="detail-value">
                    <span className="detail-value-text">{userData.situation}</span>
                  </div>
                </div>
                <div className="detail-group">
                  <div className="detail-label">Number of Children</div>
                  <div className="detail-value">
                    <span className="detail-value-text">{userData.nbr_enfants}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;