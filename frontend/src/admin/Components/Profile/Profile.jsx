import { useState, useEffect } from "react";
import { 
  FiUser, FiMail, FiHash, FiBriefcase, 
  FiUsers, FiCalendar, FiLock, FiUnlock, 
  FiRefreshCw, FiAlertTriangle, FiHome 
} from "react-icons/fi";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import "./Profile.css";
import { API_URL } from "../../../config";

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [theme, setTheme] = useState("light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = localStorage.getItem("userId");
  const authToken = localStorage.getItem("authToken");

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? dateString : date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const fetchUserData = async () => {
    if (!userId || !authToken) {
      setError("Authentication required. Please login again.");
      setLoading(false);
      localStorage.removeItem("authToken");
      localStorage.removeItem("userId");
      window.location.href = "/login";
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(
        `${API_URL}/api/Personnel/byId/${userId}`, 
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);

      // First get the response as text
      const responseText = await response.text();
      
      // Check if response is empty
      if (!responseText) {
        throw new Error('Empty response from server');
      }

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        // If not JSON, check if it's HTML
        if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
          console.error('Server returned HTML error page:', responseText.substring(0, 300));
          throw new Error('Server is currently unavailable. Please try again later.');
        }
        // If not HTML, return the raw text with status
        throw new Error(`Unexpected response (${response.status}): ${responseText.substring(0, 100)}`);
      }
      
      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      if (!data || Object.keys(data).length === 0) {
        throw new Error("No profile data received");
      }

      setUserData(data);
    } catch (error) {
      console.error("Fetch error:", error);
      let errorMessage = error.message;

      if (error.name === 'AbortError') {
        errorMessage = "Request timed out. Please check your connection.";
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = "Network error. Please check your internet connection.";
      }

      setError(errorMessage);

      if (error.message.includes('401') || error.message.includes('403')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (theme) => {
    document.documentElement.className = theme;
    localStorage.setItem("theme", theme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    applyTheme(newTheme);
  };
  
  useEffect(() => {
    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail);
    };

    window.addEventListener("sidebarToggled", handleSidebarToggle);
    return () => window.removeEventListener("sidebarToggled", handleSidebarToggle);
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [userId, authToken]);

  if (loading && !userData) {
    return (
      <div className={`app-container ${theme}`}>
        <Sidebar theme={theme} />
        <div className={`profile-container ${sidebarCollapsed ? "collapsed" : ""}`}>
        <Navbar theme={theme} toggleTheme={toggleTheme} />
          <div className="loading-state">
            <div className="spinner-container">
              <FiRefreshCw className="spinner" />
            </div>
            <p>Loading your profile information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`app-container ${theme}`}>
        <Sidebar theme={theme} />
        <div className={`profile-container ${sidebarCollapsed ? "collapsed" : ""}`}>
        <Navbar theme={theme} toggleTheme={toggleTheme} />
          <div className="error-state">
            <div className="error-content">
              <FiAlertTriangle className="error-icon" size={48} />
              <h2>Error Loading Profile</h2>
              <p className="error-message">{error}</p>
              
              <div className="action-buttons">
                <button 
                  onClick={fetchUserData} 
                  className="btn retry-btn"
                  disabled={loading}
                >
                  <FiRefreshCw className={loading ? "spin" : ""} />
                  {loading ? "Retrying..." : "Try Again"}
                </button>
                
                <a href="/" className="btn home-btn">
                  <FiHome />
                  Return to Home
                </a>
              </div>
              
              <div className="support-message">
                <p>The server might be experiencing issues.</p>
                <p>
                  Please contact support if the problem persists at{" "}
                  <a href="mailto:support@company.com">support@company.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className={`app-container ${theme}`}>
        <Sidebar theme={theme} />
        <div className={`profile-container ${sidebarCollapsed ? "collapsed" : ""}`}>
        <Navbar theme={theme} toggleTheme={toggleTheme} />
          <div className="empty-state">
            <FiUser className="empty-icon" size={48} />
            <h2>No Profile Data Available</h2>
            <p>We couldn't find any profile information for your account.</p>
            <button onClick={fetchUserData} className="btn refresh-btn">
              <FiRefreshCw /> Refresh Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className={`profile-container ${sidebarCollapsed ? "collapsed" : ""}`}>
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <div className="profile-card">
          <div className="profile-header">
            <div className="avatar">
              <FiUser className="avatar-icon" />
            </div>
            <h1>
              {userData.prenom || "First"} {userData.nom || "Last"}
            </h1>
            <span className="role-badge">{userData.role || "User"}</span>
          </div>

          <div className="profile-body">
            <div className="info-section">
              <h2>Informations</h2>
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">
                    <FiHash className="info-icon" />
                    <span>Matricule</span>
                  </div>
                  <div className="info-value">{userData.matricule || "N/A"}</div>
                </div>

                <div className="info-item">
                  <div className="info-label">
                    <FiMail className="info-icon" />
                    <span>Email</span>
                  </div>
                  <div className="info-value">{userData.email || "N/A"}</div>
                </div>

                <div className="info-item">
                  <div className="info-label">
                    <FiBriefcase className="info-icon" />
                    <span>Code de la société</span>
                  </div>
                  <div className="info-value">{userData.code_soc || "N/A"}</div>
                </div>

                <div className="info-item">
                  <div className="info-label">
                    <FiUsers className="info-icon" />
                    <span>Telephone</span>
                  </div>
                  <div className="info-value">{userData.telephone || "N/A"}</div>
                </div>

                <div className="info-item">
                  <div className="info-label">
                    <FiCalendar className="info-icon" />
                    <span>Date De Naissance</span>
                  </div>
                  <div className="info-value">{formatDate(userData.date_naiss)}</div>
                </div>

                <div className="info-item">
                  <div className="info-label">
                    <FiUsers className="info-icon" />
                    <span>Enfants</span>
                  </div>
                  <div className="info-value">{userData.nbr_enfants || "0"}</div>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h2>Status</h2>
              <div className="status-grid">
                <div className="status-item">
                  <div className="status-label">Active</div>
                  <div className={`status-badge ${userData.active ? "active" : "inactive"}`}>
                    {userData.active ? (
                      <>
                        <FiUser className="status-icon" /> Active
                      </>
                    ) : (
                      <>
                        <FiUser className="status-icon" /> Inactive
                      </>
                    )}
                  </div>
                </div>

                <div className="status-item">
                  <div className="status-label">Compte Bloqué</div>
                  <div className={`status-badge ${userData.accountLocked ? "locked" : "unlocked"}`}>
                    {userData.accountLocked ? (
                      <>
                        <FiLock className="status-icon" /> Bloqué
                      </>
                    ) : (
                      <>
                        <FiUnlock className="status-icon" /> Débloquée
                      </>
                    )}
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

export default ProfilePage;