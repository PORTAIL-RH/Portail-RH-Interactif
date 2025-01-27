import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Admin
const Accueil = lazy(() => import('./admin/Acceuil.jsx'));
const Notifications = lazy(() => import('./admin/Components/Notifications/Notifications.jsx'));
const Personnel = lazy(() => import('./admin/Components/Personnel/Personnels.jsx'));
const Apropos = lazy(() => import('./admin/Components/Apropos/Apropos.jsx'));
const NotificationModal = lazy(() => import('./admin/Components/Navbar/NotificationModal.jsx'));
const Addpers = lazy(() => import('./admin/Components/AjoutPersonnel/AjoutPersonnel.jsx'));


// Collaborateurs
const Authentication = lazy(() => import('./collaborateurs/Authentification/Authentication.jsx'));
const DemandeConge = lazy(() => import('./collaborateurs/Demandes/Conge/CongeForm.jsx'));
const DemandeFormation = lazy(() => import('./collaborateurs/Demandes/Formation/FormationForm.jsx'));
const DemandeAutorisation = lazy(() => import('./collaborateurs/Demandes/Autorisation/AutorisationForm.jsx'));

// AppGen

const CompanyHome = lazy(() => import('./AppHome/Home/Home.jsx'));

//Not
const Form = lazy(() => import('./AppHome/Home/JoinUs.jsx'));

function App() {
  return (
    <div>
      {/* Suspense is used to display a loading indicator while the component is being loaded */}
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          {/* Admin */}
          <Route path="/Accueil" element={<Accueil />} />
          <Route path="/Notifications" element={<Notifications />} />
          <Route path="/Personnel" element={<Personnel />} />
          <Route path="/Apropos" element={<Apropos />} />
          <Route path="/NotificationModal" element={<NotificationModal />} />
          <Route path="/Addpers" element={<Addpers />} />

          
          {/* Collaborateurs */}
          <Route path="/" element={<Authentication />} />
          <Route path="/DemandeConge" element={<DemandeConge />} />
          <Route path="/DemandeFormation" element={<DemandeFormation />} />
          <Route path="/DemandeAutorisation" element={<DemandeAutorisation />} />



          {/* AppGen */}
          <Route path="/CompanyHome" element={<CompanyHome />} />

          
          {/* Not */}
          <Route path="/Form" element={<Form />} />

        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
