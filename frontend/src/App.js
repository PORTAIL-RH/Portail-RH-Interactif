import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load components to split bundles
const Authentication = lazy(() => import('./collaborateurs/authentication/Authentification/Authentication.jsx'));
const Accueil = lazy(() => import('./admin/Acceuil.jsx'));
const Notifications = lazy(() => import('./admin/Components/Notifications/Notifications.jsx'));
const Personnel = lazy(() => import('./admin/Components/Personnel/Personnels.jsx'));
const Form = lazy(() => import('./collaborateurs/authentication/Home/form.jsx'));

function App() {
  return (
    <div>
      {/* Suspense is used to display a loading indicator while the component is being loaded */}
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          {/* Define your route paths and components */}
          <Route path="/" element={<Authentication />} />
          <Route path="/Accueil" element={<Accueil />} />
          <Route path="/Notifications" element={<Notifications />} />

          <Route path="/Form" element={<Form />} />
          <Route path="/Personnel" element={<Personnel />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
