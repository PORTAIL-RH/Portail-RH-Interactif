import { useState, useEffect } from "react";
import Sidebar from "./Components/Sidebar/Sidebar";
import Navbar from "./Components/Navbar/Navbar";
import { FiUsers, FiUserCheck, FiUserX, FiBell, FiMail, FiSun, FiMoon } from "react-icons/fi";
import { FaFemale, FaMale } from "react-icons/fa";
import "./Acceuil.css";

const Accueil = () => {
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [personalNumber, setPersonalNumber] = useState("");
  const [activatedPersonnel, setActivatedPersonnel] = useState(0);
  const [nonActivatedPersonnel, setNonActivatedPersonnel] = useState(0);
  const [totalPersonnel, setTotalPersonnel] = useState(0);
  const [demandesConge, setDemandesConge] = useState([]);
  const [demandesFormation, setDemandesFormation] = useState([]);
  const [demandesDocument, setDemandesDocument] = useState([]);
  const [demandesPreAvance, setDemandesPreAvance] = useState([]);
  const [demandesAutorisation, setDemandesAutorisation] = useState([]);
  const [theme, setTheme] = useState("light");

  const [genderDistribution, setGenderDistribution] = useState({
    male: 65,
    female: 35,
  });

  // Initialize theme
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

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
  };

  // Fetch and filter demandes


  // Fetch initial data and listen for SSE updates
  useEffect(() => {
    // Fetch personnel data
    fetch("http://localhost:8080/api/Personnel/all")
      .then((response) => response.json())
      .then((data) => {
        setTotalPersonnel(data.length);
        const activated = data.filter((person) => person.status === "activated").length;
        const nonActivated = data.filter((person) => person.status === "non-activated").length;
        setActivatedPersonnel(activated);
        setNonActivatedPersonnel(nonActivated);

        const males = data.filter((person) => person.gender === "male").length;
        const females = data.filter((person) => person.gender === "female").length;

        if (data.length > 0) {
          const malePercentage = Math.round((males / data.length) * 100);
          const femalePercentage = 100 - malePercentage;
          setGenderDistribution({
            male: malePercentage,
            female: femalePercentage,
          });
        }
      })
      .catch((error) => console.error("Error fetching personnel data:", error));

      // Fetch notifications
      fetch("http://localhost:8080/api/notifications/unreadnbr?role=Admin")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => setUnviewedCount(data))
      .catch((error) => console.error("Error fetching unread notifications:", error));


      fetch("http://localhost:8080/api/notifications/nbr?role=Admin")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => setTotalNotifications(data))
      .catch((error) => console.error("Error fetching total notifications:", error));
   

    // Listen for SSE updates
    const eventSource = new EventSource("http://localhost:8080/sse/updates");

    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data);
      const { type, data } = update;

      console.log("Received update:", type, data); // Debugging

      // Refresh data based on the update type
      switch (type) {
        case "created":
        case "updated":
        case "deleted":
          
          break;
        default:
          console.warn("Unknown update type:", type);
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource failed:", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar />
      <div className="dashboard-container">
        <Navbar />
        <div className="dashboard-content">
          <div className="dashboard-header">
            <div className="header-top">
              <h1>Aperçu du Tableau de Bord</h1>
              <div className="header-actions">
                <button
                  className="theme-toggle-button"
                  onClick={toggleTheme}
                  aria-label={theme === "light" ? "Passer au mode sombre" : "Passer au mode clair"}
                >
                  {theme === "light" ? <FiMoon /> : <FiSun />}
                </button>
              </div>
            </div>
            <p>Bienvenue, Admin. Voici ce qui se passe avec votre équipe aujourd'hui.</p>
          </div>

          <div className="dashboard-grid">
            {/* Personnel Overview Card */}
            <div className="dashboard-card personnel-overview">
              <div className="card-header">
                <h2>Aperçu du Personnel</h2>
              </div>
              <div className="card-content">
                <div className="stat-cards">
                  <div className="stat-card">
                    <div className="stat-icon activated">
                      <FiUserCheck />
                    </div>
                    <div className="stat-details">
                      <h3>Activé</h3>
                      <p className="stat-value">{activatedPersonnel}</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon non-activated">
                      <FiUserX />
                    </div>
                    <div className="stat-details">
                      <h3>Non Activé</h3>
                      <p className="stat-value">{nonActivatedPersonnel}</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon total">
                      <FiUsers />
                    </div>
                    <div className="stat-details">
                      <h3>Total</h3>
                      <p className="stat-value">{totalPersonnel}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gender Distribution Card */}
            <div className="dashboard-card gender-distribution">
              <div className="card-header">
                <h2>Répartition par Genre</h2>
              </div>
              <div className="card-content">
                <div className="gender-chart">
                  <div className="gender-bars">
                    <div className="gender-bar-container">
                      <div className="gender-label">
                        <FaMale className="male-icon" />
                        <span>Hommes</span>
                      </div>
                      <div className="gender-bar-wrapper">
                        <div className="gender-bar male-bar" style={{ width: `${genderDistribution.male}%` }}></div>
                        <span className="gender-percentage">{genderDistribution.male}%</span>
                      </div>
                    </div>

                    <div className="gender-bar-container">
                      <div className="gender-label">
                        <FaFemale className="female-icon" />
                        <span>Femmes</span>
                      </div>
                      <div className="gender-bar-wrapper">
                        <div className="gender-bar female-bar" style={{ width: `${genderDistribution.female}%` }}></div>
                        <span className="gender-percentage">{genderDistribution.female}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="gender-pie-chart">
                    <div
                      className="pie-chart"
                      style={{
                        background: `conic-gradient(
                        #4f46e5 0% ${genderDistribution.male}%, 
                        #ec4899 ${genderDistribution.male}% 100%
                      )`,
                      }}
                    ></div>
                    <div className="pie-chart-legend">
                      <div className="legend-item">
                        <FaMale className="male-icon" />
                        <span>Hommes</span>
                      </div>
                      <div className="legend-item">
                        <FaFemale className="female-icon" />
                        <span>Femmes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications Card */}
            <div className="dashboard-card notifications">
              <div className="card-header">
                <h2>Notifications</h2>
              </div>
              <div className="card-content">
                <div className="stat-cards">
                  <div className="stat-card">
                    <div className="stat-icon unread">
                      <FiBell />
                    </div>
                    <div className="stat-details">
                      <h3>Non lues</h3>
                      <p className="stat-value">{unviewedCount}</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon total-notifications">
                      <FiMail />
                    </div>
                    <div className="stat-details">
                      <h3>Total</h3>
                      <p className="stat-value">{totalNotifications}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Requests Card */}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Accueil;