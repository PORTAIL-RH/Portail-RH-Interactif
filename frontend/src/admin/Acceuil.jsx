import { useState, useEffect } from "react";
import Sidebar from "./Components/Sidebar/Sidebar";
import Navbar from "./Components/Navbar/Navbar";
import { FiUsers, FiUserCheck, FiUserX, FiBell, FiMail, FiLock } from "react-icons/fi";
import { FaFemale, FaMale } from "react-icons/fa";
import "./Acceuil.css";
import { API_URL } from "../config";

// Constants for localStorage keys
const STORAGE_KEYS = {
  DASHBOARD_STATS: 'dashboardStats',
  PERSONNEL_DATA: 'personnelData',
  ROLES_DATA: 'rolesData',
  SERVICES_DATA: 'servicesData',
  NOTIFICATIONS_DATA: 'notificationsData',
  ROLE_DISTRIBUTION: 'roleDistribution',
  LOCKED_ACCOUNTS: 'lockedAccounts'
};

const AcceuilAdmin = () => {
  // State initialization with default values
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [activatedPersonnel, setActivatedPersonnel] = useState(0);
  const [nonActivatedPersonnel, setNonActivatedPersonnel] = useState(0);
  const [totalPersonnel, setTotalPersonnel] = useState(0);
  const [lockedAccountsCount, setLockedAccountsCount] = useState(0);
  const [theme, setTheme] = useState("light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [genderDistribution, setGenderDistribution] = useState({
    male: 0,
    female: 0,
  });
  const [roles, setRoles] = useState([]);
  const [services, setServices] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [roleDistribution, setRoleDistribution] = useState([]);
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");

  // Helper function to save data to localStorage
  const saveToLocalStorage = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify({
        ...data,
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      console.error(`Error saving to ${key}:`, error);
    }
  };

  // Load data from localStorage or set defaults
  const initializeFromLocalStorage = () => {
    try {
      // Load dashboard stats
      const savedStats = localStorage.getItem(STORAGE_KEYS.DASHBOARD_STATS);
      if (savedStats) {
        const stats = JSON.parse(savedStats);
        setUnviewedCount(stats.unviewedCount ?? 0);
        setTotalNotifications(stats.totalNotifications ?? 0);
        setActivatedPersonnel(stats.activatedPersonnel ?? 0);
        setNonActivatedPersonnel(stats.nonActivatedPersonnel ?? 0);
        setTotalPersonnel(stats.totalPersonnel ?? 0);
        setLockedAccountsCount(stats.lockedAccountsCount ?? 0);
        setGenderDistribution({
          male: stats.genderDistribution?.male ?? 0,
          female: stats.genderDistribution?.female ?? 0
        });
      }

      // Load personnel data
      const savedPersonnel = localStorage.getItem(STORAGE_KEYS.PERSONNEL_DATA);
      if (savedPersonnel) {
        const personnelData = JSON.parse(savedPersonnel);
        setPersonnel(personnelData.personnel ?? []);
        setLastUpdated(personnelData.lastUpdated ?? null);
      }

      // Load roles data
      const savedRoles = localStorage.getItem(STORAGE_KEYS.ROLES_DATA);
      if (savedRoles) {
        const rolesData = JSON.parse(savedRoles);
        setRoles(rolesData.roles ?? []);
      }

      // Load services data
      const savedServices = localStorage.getItem(STORAGE_KEYS.SERVICES_DATA);
      if (savedServices) {
        const servicesData = JSON.parse(savedServices);
        setServices(servicesData.services ?? []);
      }

      // Load role distribution
      const savedRoleDistribution = localStorage.getItem(STORAGE_KEYS.ROLE_DISTRIBUTION);
      if (savedRoleDistribution) {
        const roleDistData = JSON.parse(savedRoleDistribution);
        setRoleDistribution(roleDistData.distribution ?? []);
      }

      // Load locked accounts
      const savedLockedAccounts = localStorage.getItem(STORAGE_KEYS.LOCKED_ACCOUNTS);
      if (savedLockedAccounts) {
        const lockedAccountsData = JSON.parse(savedLockedAccounts);
        setLockedAccountsCount(lockedAccountsData.lockedAccounts?.length ?? 0);
      }

    } catch (error) {
      console.error("Error loading from localStorage:", error);
      resetToDefaults();
    }
  };

  // Reset all states to default values
  const resetToDefaults = () => {
    setUnviewedCount(0);
    setTotalNotifications(0);
    setActivatedPersonnel(0);
    setNonActivatedPersonnel(0);
    setTotalPersonnel(0);
    setLockedAccountsCount(0);
    setGenderDistribution({ male: 0, female: 0 });
    setRoles([]);
    setServices([]);
    setPersonnel([]);
    setRoleDistribution([]);
    setLastUpdated(null);
  };

  // Sidebar toggle handler
  useEffect(() => {
    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail);
    };

    window.addEventListener('sidebarToggled', handleSidebarToggle);
    
    return () => {
      window.removeEventListener('sidebarToggled', handleSidebarToggle);
    };
  }, []);

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (theme) => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    applyTheme(newTheme);
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }));
  };

  // Fetch role distribution from API
  const fetchRoleDistribution = async () => {
    try {
      const response = await fetch(`${API_URL}/api/Personnel/role-distribution`);
      if (!response.ok) throw new Error('Failed to fetch role distribution');
      
      const data = await response.json();
      
      // Transform the data to match our expected format
      const distribution = Object.entries(data).map(([roleName, count]) => ({
        name: roleName,
        count: count
      }));
      
      setRoleDistribution(distribution);
      
      // Save to localStorage
      saveToLocalStorage(STORAGE_KEYS.ROLE_DISTRIBUTION, {
        distribution: distribution
      });
      
    } catch (error) {
      console.error("Error fetching role distribution:", error);
      // Fallback to calculating from personnel data if API fails
      calculateRoleDistributionFromPersonnel();
    }
  };

  // Calculate role distribution from personnel data if API fails
  const calculateRoleDistributionFromPersonnel = () => {
    if (!personnel.length || !roles.length) {
      setRoleDistribution([]);
      return;
    }
    
    const distributionMap = {};
    
    // Initialize all roles with count 0
    roles.forEach(role => {
      const roleName = role.libelle;
      distributionMap[roleName] = 0;
    });
    
    // Count personnel per role
    personnel.forEach(person => {
      let roleName = '';
      
      // Handle different role formats
      if (typeof person.role === 'object') {
        roleName = person.role.libelle;
      } else if (roles.some(r => r._id === person.role)) {
        const role = roles.find(r => r._id === person.role);
        roleName = role.libelle;
      } else {
        roleName = person.role;
      }
      
      if (roleName && distributionMap.hasOwnProperty(roleName)) {
        distributionMap[roleName]++;
      }
    });
    
    // Convert to array format
    const distribution = Object.entries(distributionMap)
      .filter(([name]) => name) // Filter out empty/null role names
      .map(([name, count]) => ({
        name,
        count
      }));
    
    setRoleDistribution(distribution);
  };

  // Fetch all dashboard data from API
  const fetchDashboardData = async () => {
    try {
      const [
        personnelResponse, 
        rolesResponse, 
        servicesResponse,
        genderResponse,
        unreadResponse,
        totalResponse,
        lockedAccountsResponse
      ] = await Promise.all([
        fetch(`${API_URL}/api/Personnel/all`),
        fetch(`${API_URL}/api/roles`),
        fetch(`${API_URL}/api/services/all`),
        fetch(`${API_URL}/api/Personnel/gender-distribution`),
        fetch(`${API_URL}/api/notifications/unreadnbr?role=Admin`),
        fetch(`${API_URL}/api/notifications/nbr?role=Admin`),
        fetch(`${API_URL}/api/Personnel/locked-accounts`)
      ]);

      // Check all responses
      if (!personnelResponse.ok) throw new Error('Failed to fetch personnel');
      if (!rolesResponse.ok) throw new Error('Failed to fetch roles');
      if (!servicesResponse.ok) throw new Error('Failed to fetch services');
      if (!genderResponse.ok) throw new Error('Failed to fetch gender distribution');
      if (!unreadResponse.ok) throw new Error('Failed to fetch unread notifications');
      if (!totalResponse.ok) throw new Error('Failed to fetch total notifications');
      if (!lockedAccountsResponse.ok) throw new Error('Failed to fetch locked accounts');

      const [
        personnelData, 
        rolesData, 
        servicesData,
        genderData,
        unreadData,
        totalData,
        lockedAccountsData
      ] = await Promise.all([
        personnelResponse.json(),
        rolesResponse.json(),
        servicesResponse.json(),
        genderResponse.json(),
        unreadResponse.json(),
        totalResponse.json(),
        lockedAccountsResponse.json()
      ]);

      // Calculate personnel stats
      const total = personnelData.length || 0;
      const activated = personnelData.filter(p => p.active).length || 0;
      const nonActivated = total - activated;

      // Calculate rounded gender percentages
      const malePercentage = Math.round(genderData.male || 0);
      const femalePercentage = Math.round(genderData.female || 0);

      // Update state
      setUnviewedCount(unreadData || 0);
      setTotalNotifications(totalData || 0);
      setActivatedPersonnel(activated);
      setNonActivatedPersonnel(nonActivated);
      setTotalPersonnel(total);
      setLockedAccountsCount(lockedAccountsData.length || 0);
      setGenderDistribution({
        male: malePercentage,
        female: femalePercentage
      });
      setRoles(rolesData || []);
      setServices(servicesData || []);
      setPersonnel(personnelData || []);
      setLastUpdated(new Date().toISOString());

      // Save to localStorage with separate keys
      saveToLocalStorage(STORAGE_KEYS.DASHBOARD_STATS, {
        unviewedCount: unreadData || 0,
        totalNotifications: totalData || 0,
        activatedPersonnel: activated,
        nonActivatedPersonnel: nonActivated,
        totalPersonnel: total,
        lockedAccountsCount: lockedAccountsData.length || 0,
        genderDistribution: {
          male: malePercentage,
          female: femalePercentage
        }
      });

      saveToLocalStorage(STORAGE_KEYS.PERSONNEL_DATA, {
        personnel: personnelData || []
      });

      saveToLocalStorage(STORAGE_KEYS.ROLES_DATA, {
        roles: rolesData || []
      });

      saveToLocalStorage(STORAGE_KEYS.SERVICES_DATA, {
        services: servicesData || []
      });

      saveToLocalStorage(STORAGE_KEYS.LOCKED_ACCOUNTS, {
        lockedAccounts: lockedAccountsData || [],
        count: lockedAccountsData.length || 0
      });

      // Fetch role distribution after we have all data
      await fetchRoleDistribution();

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      initializeFromLocalStorage();
    }
  };

  // Fetch only personnel data (for polling)
  const fetchPersonnelData = async () => {
    try {
      const [personnelResponse, lockedAccountsResponse] = await Promise.all([
        fetch(`${API_URL}/api/Personnel/all`),
        fetch(`${API_URL}/api/Personnel/locked-accounts`)
      ]);
      
      if (!personnelResponse.ok) throw new Error('Failed to fetch personnel');
      if (!lockedAccountsResponse.ok) throw new Error('Failed to fetch locked accounts');

      const [personnelData, lockedAccountsData] = await Promise.all([
        personnelResponse.json(),
        lockedAccountsResponse.json()
      ]);

      const total = personnelData.length || 0;
      const activated = personnelData.filter(p => p.active).length || 0;
      const nonActivated = total - activated;

      // Update state
      setActivatedPersonnel(activated);
      setNonActivatedPersonnel(nonActivated);
      setTotalPersonnel(total);
      setLockedAccountsCount(lockedAccountsData.length || 0);
      setPersonnel(personnelData);
      setLastUpdated(new Date().toISOString());

      // Save to localStorage
      saveToLocalStorage(STORAGE_KEYS.PERSONNEL_DATA, {
        personnel: personnelData || []
      });

      saveToLocalStorage(STORAGE_KEYS.LOCKED_ACCOUNTS, {
        lockedAccounts: lockedAccountsData || [],
        count: lockedAccountsData.length || 0
      });

      // Update dashboard stats
      const savedStats = localStorage.getItem(STORAGE_KEYS.DASHBOARD_STATS);
      if (savedStats) {
        const stats = JSON.parse(savedStats);
        saveToLocalStorage(STORAGE_KEYS.DASHBOARD_STATS, {
          ...stats,
          activatedPersonnel: activated,
          nonActivatedPersonnel: nonActivated,
          totalPersonnel: total,
          lockedAccountsCount: lockedAccountsData.length || 0
        });
      }

      // Update role distribution
      await fetchRoleDistribution();

    } catch (error) {
      console.error("Error fetching personnel data:", error);
    }
  };

  // Initialize data
  useEffect(() => {
    initializeFromLocalStorage();
    fetchDashboardData();
  }, []);

  // Set up polling for personnel data only
  useEffect(() => {
    const pollingInterval = setInterval(fetchPersonnelData, 30000);
    return () => clearInterval(pollingInterval);
  }, []);

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className={`dashboard-container ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Navbar theme={theme} toggleTheme={toggleTheme} />

        <div className="dashboard-content">
          <div className="dashboard-header">
            <div className="header-top">
              <h1>Tableau de Bord Administrateur</h1>
              <div className="notification-badges">
                <div className="notification-badge">
                  <FiBell />
                  {unviewedCount > 0 && <span className="badge-count">{unviewedCount}</span>}
                </div>
                <div className="notification-badge">
                  <FiMail />
                  {totalNotifications > 0 && <span className="badge-count">{totalNotifications}</span>}
                </div>
              </div>
            </div>
            <p className="welcome-message">
              Bienvenue, <span className="user-name">{userData?.nom} {userData?.prenom}</span>, dans votre espace administrateur. Voici un aperçu de votre équipe aujourd'hui.
            </p>
          </div>
          
          <div className="dashboard-grid">
            {/* Personnel Overview Card */}
            <div className="dashboard-card">
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

                  <div className="stat-card">
                    <div className="stat-icon locked">
                      <FiLock />
                    </div>
                    <div className="stat-details">
                      <h3>Bloqués</h3>
                      <p className="stat-value">{lockedAccountsCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gender Distribution Card */}
            <div className="dashboard-card">
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
                        <div 
                          className="gender-bar male-bar" 
                          style={{ width: `${genderDistribution.male}%` }}
                        ></div>
                        <span className="gender-percentage">{genderDistribution.male}%</span>
                      </div>
                    </div>

                    <div className="gender-bar-container">
                      <div className="gender-label">
                        <FaFemale className="female-icon" />
                        <span>Femmes</span>
                      </div>
                      <div className="gender-bar-wrapper">
                        <div 
                          className="gender-bar female-bar" 
                          style={{ width: `${genderDistribution.female}%` }}
                        ></div>
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

            {/* Role Distribution Card */}
            <div className="dashboard-card">
              <div className="card-header">
                <h2>Répartition par Rôle</h2>
              </div>
              <div className="card-content">
                {roleDistribution.length > 0 ? (
                  <div className="stat-cards">
                    {roleDistribution.map((role) => (
                      <div key={role.name} className="stat-card">
                        <div className="stat-icon total">
                          <FiUsers />
                        </div>
                        <div className="stat-details">
                          <h3>{role.name}</h3>
                          <p className="stat-value">{role.count}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Aucune donnée de rôle disponible</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcceuilAdmin;