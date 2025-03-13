import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Admin
const Accueil = lazy(() => import('./admin/Acceuil.jsx'));
const Notifications = lazy(() => import('./admin/Components/Notifications/Notifications.jsx'));
const Personnel = lazy(() => import('./admin/Components/Personnel/Personnels.jsx'));
const Apropos = lazy(() => import('./admin/Components/Apropos/Apropos.jsx'));
const NotificationModal = lazy(() => import('./admin/Components/Navbar/NotificationModal.jsx'));
const AjoutPersonnel = lazy(() => import('./admin/Components/AjoutPersonnel/AjoutPersonnel.jsx'));
const AjoutRole = lazy(() => import('./admin/Components/AjoutRole/AjoutRole.jsx'));
const AjoutService = lazy(() => import('./admin/Components/AjoutService/AjoutService.jsx'));
const AjoutCandidature = lazy(() => import('./admin/Components/AjoutCandidature/AjoutCandidature.jsx'));

const ProfileADMIN = lazy(() => import('./admin/Components/Profile/Profile.jsx'));
const AjoutDemandeFormationADMIN = lazy(() => import('./admin/Components/AjoutDemande/Formation.jsx'));
const AjoutDemandeCongeADMIN = lazy(() => import('./admin/Components/AjoutDemande/Conge.jsx'));
const AjoutDemandePreAvanceADMIN = lazy(() => import('./admin/Components/AjoutDemande/PreAvance.jsx'));
const AjoutDemandeDocumentADMIN = lazy(() => import('./admin/Components/AjoutDemande/Document.jsx'));
const AjoutDemandeAutorisationADMIN = lazy(() => import('./admin/Components/AjoutDemande/Autorisation.jsx'));
const DemandesADMIN = lazy(() => import('./admin/Components/DemandesADMIN/DemandesADMIN.jsx'));

// RH
const AccueilRH = lazy(() => import('./RH/Acceuil.jsx'));
const PersonnelsRH = lazy(() => import('./RH/Components/Personnels/Personnels.jsx'));
const CalendarRH = lazy(() => import('./RH/Components/Calendar/Calendar.jsx'));
const Notificationsrh = lazy(() => import('./RH/Components/Notifications/Notifications.jsx'));
const NotificationModalrh = lazy(() => import('./RH/Components/Navbar/NotificationModal.jsx'));
const FormationRH = lazy(() => import('./RH/Components/Demandes/Formation.jsx'));
const CongeRH = lazy(() => import('./RH/Components/Demandes/Conge.jsx'));
const DocumentRH = lazy(() => import('./RH/Components/Demandes/Document.jsx'));
const AutorisationRH = lazy(() => import('./RH/Components/Demandes/Autorisation.jsx'));
const PreAvanceRH = lazy(() => import('./RH/Components/Demandes/PreAvance.jsx'));
const ProfileRH = lazy(() => import('./RH/Components/Profile/Profile.jsx'));
const AjoutDemandeFormationRH = lazy(() => import('./RH/Components/AjoutDemande/Formation.jsx'));
const AjoutDemandeCongeRH = lazy(() => import('./RH/Components/AjoutDemande/Conge.jsx'));
const AjoutDemandePreAvanceRH = lazy(() => import('./RH/Components/AjoutDemande/PreAvance.jsx'));
const AjoutDemandeDocumentRH = lazy(() => import('./RH/Components/AjoutDemande/Document.jsx'));
const AjoutDemandeAutorisationRH = lazy(() => import('./RH/Components/AjoutDemande/Autorisation.jsx'));
const DemandesRH = lazy(() => import('./RH/Components/DemandesRH/DemandesRH.jsx'));

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
const Notificationschef = lazy(() => import('./Chef_hierarchique/Components/Notifications/Notifications.jsx'));
const NotificationModalchef = lazy(() => import('./Chef_hierarchique/Components/Navbar/NotificationModal.jsx'));

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
          <Route path="/AjoutPersonnel" element={<AjoutPersonnel />} />
          <Route path="/AjoutRole" element={<AjoutRole />} />
          <Route path="/AjoutService" element={<AjoutService />} />
          <Route path="/AjoutCandidature" element={<AjoutCandidature />} />

          <Route path="/ProfileADMIN" element={<ProfileADMIN />} />
          <Route path="/AjoutDemandeAutorisationADMIN" element={<AjoutDemandeAutorisationADMIN />} />
          <Route path="/AjoutDemandeFormationADMIN" element={<AjoutDemandeFormationADMIN />} />
          <Route path="/AjoutDemandePreAvanceADMIN" element={<AjoutDemandePreAvanceADMIN />} />
          <Route path="/AjoutDemandeDocumentADMIN" element={<AjoutDemandeDocumentADMIN />} />
          <Route path="/AjoutDemandeCongeADMIN" element={<AjoutDemandeCongeADMIN />} />
          <Route path="/DemandesADMIN" element={<DemandesADMIN />} />




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
          <Route path="/Notificationschef" element={<Notificationschef />} />
          <Route path="/NotificationModalchef" element={<NotificationModalchef />} />

            {/* RH */}
  <Route path="/AccueilRH" element={<AccueilRH />} />
          <Route path="/PersonnelsRH" element={<PersonnelsRH />} />
          <Route path="/DemandesRH" element={<DemandesRH />} />
          <Route path="/FormationRH" element={<FormationRH />} />
          <Route path="/CongeRH" element={<CongeRH />} />
          <Route path="/DocumentRH" element={<DocumentRH />} />
          <Route path="/AutorisationRH" element={<AutorisationRH />} />
          <Route path="/PreAvanceRH" element={<PreAvanceRH />} />
          <Route path="/ProfileRH" element={<ProfileRH />} />
          <Route path="/AjoutDemandeAutorisationRH" element={<AjoutDemandeAutorisationRH />} />
          <Route path="/AjoutDemandeFormationRH" element={<AjoutDemandeFormationRH />} />
          <Route path="/AjoutDemandePreAvanceRH" element={<AjoutDemandePreAvanceRH />} />
          <Route path="/AjoutDemandeDocumentRH" element={<AjoutDemandeDocumentRH />} />
          <Route path="/AjoutDemandeCongeRH" element={<AjoutDemandeCongeRH />} />
          <Route path="/CalendarRH" element={<CalendarRH />} />
          <Route path="/DemandesRH" element={<DemandesRH />} />
          <Route path="/Notificationsrh" element={<Notificationsrh />} />
          <Route path="/NotificationModalrh" element={<NotificationModalrh />} />

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
