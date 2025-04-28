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
  localStorage.setItem('authToken', token);
  localStorage.setItem('userData', JSON.stringify(userData));
  localStorage.setItem('userId', userData.id);
  localStorage.setItem('userRole', userData.role);
  localStorage.setItem('usermatricule', userData.matricule);
  
  if (userData.code_soc) {
    localStorage.setItem('userCodeSoc', userData.code_soc);
  }
  if (userData.serviceId) {
    localStorage.setItem('userServiceId', userData.serviceId);
  }
  if (userData.serviceName) {
    localStorage.setItem('userServiceName', userData.serviceName);
  }
  
  setIsAuthenticated(true);
};

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
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