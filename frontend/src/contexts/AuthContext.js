// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('authToken');
  });

 // In your AuthContext.js
 const login = (token, userData) => {
    try {
      // Store basic auth info
      localStorage.setItem('authToken', token);
      
      // Create a simplified user object for localStorage
      const userToStore = {
        id: userData._id?.$oid || userData._id || userData.id,
        matricule: userData.matricule,
        nom: userData.nom,
        prenom: userData.prenom,
        email: userData.email,
        role: userData.role,
        active: userData.active,
        code_soc: userData.code_soc,
        serviceId: userData.service_id // Using service_id from backend response
      };

      // Store all data in localStorage
      localStorage.setItem('userData', JSON.stringify(userToStore));
      localStorage.setItem('userId', userToStore.id);
      localStorage.setItem('userRole', userToStore.role);
      localStorage.setItem('usermatricule', userToStore.matricule);

      // Store additional fields separately for easy access
      if (userToStore.code_soc) {
        localStorage.setItem('userCodeSoc', userToStore.code_soc);
      }
      if (userToStore.serviceId) {
        localStorage.setItem('userServiceId', userToStore.serviceId);
      }

      console.log("Stored user data:", userToStore); // Debug log

      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error in login function:", error);
      throw error;
    }
  };

  const logout = () => {
    // Clear all auth-related items
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('usermatricule');
    localStorage.removeItem('userCodeSoc');
    localStorage.removeItem('userServiceId');
    setIsAuthenticated(false);
  };


  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate(); // Now properly imported

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return isAuthenticated ? children : null;
};

export const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate(); // Now properly imported
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      switch(userData.role) {
        case 'Admin': navigate('/Accueil', { replace: true }); break;
        case 'RH': navigate('/AccueilRH', { replace: true }); break;
        case 'Chef Hiérarchique': navigate('/AccueilCHEF', { replace: true }); break;
        case 'collaborateur': navigate('/AccueilCollaborateurs', { replace: true }); break;

        default: navigate('/');
      }
    }
    setCheckedAuth(true);
  }, [isAuthenticated, navigate]);

  if (!checkedAuth) return null;
  return !isAuthenticated ? children : null;
};