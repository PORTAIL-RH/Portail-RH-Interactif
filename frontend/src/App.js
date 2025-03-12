import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Admin
const Accueil = lazy(() => import('./admin/Acceuil.jsx'));
const Notifications = lazy(() => import('./admin/Components/Notifications/Notifications.jsx'));
const Personnel = lazy(() => import('./admin/Components/Personnel/Personnels.jsx'));
const Apropos = lazy(() => import('./admin/Components/Apropos/Apropos.jsx'));
const NotificationModal = lazy(() => import('./admin/Components/Navbar/NotificationModal.jsx'));
const Addpers = lazy(() => import('./admin/Components/AjoutPersonnel/AjoutPersonnel.jsx'));


// RH
const AccueilRH = lazy(() => import('./RH/Acceuil.jsx'));
const PersonnelsRH = lazy(() => import('./RH/Components/Personnels/Personnels.jsx'));
const DemandesRH = lazy(() => import('./RH/Components/Demandes/Demandes.jsx')); 
const CalendarRH = lazy(() => import('./RH/Components/Calendar/Calendar.jsx'));

// CHEF
const AccueilCHEF = lazy(() => import('./Chef_hierarchique/Acceuil.jsx'));
const Personnels = lazy(() => import('./Chef_hierarchique/Components/Personnels/Personnels.jsx'));
const ProfileCHEF = lazy(() => import('./Chef_hierarchique/Components/Profile/Profile.jsx'));
const DemandesCHEF = lazy(() => import('./Chef_hierarchique/Components/DemandesCHEF/DemandesCHEF.jsx'));
const AjoutDemandeFormation = lazy(() => import('./Chef_hierarchique/Components/AjoutDemande/Formation.jsx'));
const AjoutDemandeConge = lazy(() => import('./Chef_hierarchique/Components/AjoutDemande/Conge.jsx'));
const AjoutDemandePreAvance = lazy(() => import('./Chef_hierarchique/Components/AjoutDemande/PreAvance.jsx'));
const AjoutDemandeDocument = lazy(() => import('./Chef_hierarchique/Components/AjoutDemande/Document.jsx'));
const AjoutDemandeAutorisation = lazy(() => import('./Chef_hierarchique/Components/AjoutDemande/Autorisation.jsx'));
const Candidatures = lazy(() => import('./Chef_hierarchique/Components/Candidats/Candidatures.jsx'));
const Candidats = lazy(() => import('./Chef_hierarchique/Components/Candidats/Candidats.jsx'));

const Formation = lazy(() => import('./Chef_hierarchique/Components/Demandes/Formation.jsx'));
const Conge = lazy(() => import('./Chef_hierarchique/Components/Demandes/Conge.jsx'));
const Document = lazy(() => import('./Chef_hierarchique/Components/Demandes/Document.jsx'));
const Autorisation = lazy(() => import('./Chef_hierarchique/Components/Demandes/Autorisation.jsx'));
const PreAvance = lazy(() => import('./Chef_hierarchique/Components/Demandes/PreAvance.jsx'));

const Calendar = lazy(() => import('./Chef_hierarchique/Components/Calendar/Calendar.jsx'));

// Collaborateurs
const Authentication = lazy(() => import('./collaborateurs/Authentification/Authentication.jsx'));
const DemandeConge = lazy(() => import('./collaborateurs/Demandes/Conge/CongeForm.jsx'));
const Profile = lazy(() => import('./collaborateurs/Profile/Profile.jsx'));
const DemandesCollaborateur = lazy(() => import('./collaborateurs/Profile/Demandes.jsx'));


const DemandeFormation = lazy(() => import('./collaborateurs/Demandes/Formation/FormationForm.jsx'));
const DemandeAutorisation = lazy(() => import('./collaborateurs/Demandes/Autorisation/AutorisationForm.jsx'));
const DemandePreAvance = lazy(() => import('./collaborateurs/Demandes/Avance/Avance.jsx'));
const DemandeDocument = lazy(() => import('./collaborateurs/Demandes/Document/Document.jsx'));
const AccueilCollaborateurs = lazy(() => import('./collaborateurs/Accueil/Accueil.jsx'));

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
          
  {/* chef hierarchique */}
  <Route path="/AccueilCHEF" element={<AccueilCHEF />} />
          <Route path="/Personnels" element={<Personnels />} />
          <Route path="/Formation" element={<Formation />} />
          <Route path="/Conge" element={<Conge />} />
          <Route path="/Document" element={<Document />} />
          <Route path="/Autorisation" element={<Autorisation />} />
          <Route path="/PreAvance" element={<PreAvance />} />
          <Route path="/Calendar" element={<Calendar />} />
          <Route path="/ProfileCHEF" element={<ProfileCHEF />} />
          <Route path="/DemandesCHEF" element={<DemandesCHEF />} />
          <Route path="/AjoutDemandeAutorisation" element={<AjoutDemandeAutorisation />} />
          <Route path="/AjoutDemandeFormation" element={<AjoutDemandeFormation />} />
          <Route path="/AjoutDemandePreAvance" element={<AjoutDemandePreAvance />} />
          <Route path="/AjoutDemandeDocument" element={<AjoutDemandeDocument />} />
          <Route path="/AjoutDemandeConge" element={<AjoutDemandeConge />} />
          <Route path="/candidats/:id" element={<Candidats />} />
          <Route path="/Candidatures" element={<Candidatures />} />

          
            {/* RH */}
  <Route path="/AccueilRH" element={<AccueilRH />} />
          <Route path="/PersonnelsRH" element={<PersonnelsRH />} />
          <Route path="/DemandesRH" element={<DemandesRH />} />
          <Route path="/CalendarRH" element={<CalendarRH />} />



          {/* Collaborateurs */}
          <Route path="/" element={<Authentication />} />
          <Route path="/DemandeConge" element={<DemandeConge />} />
          <Route path="/DemandeFormation" element={<DemandeFormation />} />
          <Route path="/DemandeAutorisation" element={<DemandeAutorisation />} />
          <Route path="/DemandePreAvance" element={<DemandePreAvance />} />
          <Route path="/DemandeDocument" element={<DemandeDocument />} />
          <Route path="/AccueilCollaborateurs" element={<AccueilCollaborateurs />} />
          <Route path="/Profile" element={<Profile />} />
          <Route path="/DemandesCollaborateur" element={<DemandesCollaborateur />} />


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
