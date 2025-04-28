// src/App.js
import { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ApiProvider } from './contexts/ApiContext';
import { AppRoutes } from './Routes';
import useIdleTimer from './hooks/useIdleTimer'; 

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);


  useIdleTimer(3600000);
  return (
    <AuthProvider>
      <ApiProvider>
  
          <AppRoutes />
      </ApiProvider>
    </AuthProvider>
  );
}



export default App;