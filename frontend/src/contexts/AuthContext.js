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
  localStorage.setItem('userId', userData._id || userData.id);
  localStorage.setItem('userRole', userData.role);
  localStorage.setItem('usermatricule', userData.matricule);

  if (userData.code_soc) {
    localStorage.setItem('userCodeSoc', userData.code_soc);
  }
  
 // Nouvelle méthode pour extraire le serviceId
 let serviceId = null;
  
 // Cas 1: service est une DBRef avec $id (format MongoDB)
 if (userData.service && userData.service.$id) {
   serviceId = userData.service.$id.$oid || userData.service.$id;
 }
 // Cas 2: service est une DBRef avec id direct
 else if (userData.service && userData.service.id) {
   serviceId = userData.service.id.$oid || userData.service.id;
 }
 // Cas 3: service est un string (ID direct)
 else if (typeof userData.service === 'string') {
   serviceId = userData.service;
 }
 // Cas 4: serviceId est au niveau racine
 else if (userData.serviceId) {
   serviceId = userData.serviceId;
 }

 if (serviceId) {
   localStorage.setItem('userServiceId', serviceId);
 } else {
   console.warn('Service ID not found in user data:', userData);
 }

 // Extraction du chef hiérarchique si nécessaire
 if (userData.chefHierarchique && userData.chefHierarchique.$id) {
   const chefId = userData.chefHierarchique.$id.$oid || userData.chefHierarchique.$id;
   localStorage.setItem('chefHierarchiqueId', chefId);
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