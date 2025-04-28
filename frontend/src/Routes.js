// src/routes.js
import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicRoute, ProtectedRoute } from './contexts/AuthContext';

// Admin Components
const Accueil = lazy(() => import('./admin/Acceuil.jsx'));
const Notifications = lazy(() => import('./admin/Components/Notifications/Notifications.jsx'));
const Personnel = lazy(() => import('./admin/Components/Personnel/Personnels.jsx'));
const LockedPersonnel = lazy(() => import('./admin/Components/Personnel/LockedPersonnels.jsx'));

const Apropos = lazy(() => import('./admin/Components/Apropos/Apropos.jsx'));
const NotificationModal = lazy(() => import('./admin/Components/Navbar/NotificationModal.jsx'));
const AjoutPersonnel = lazy(() => import('./admin/Components/AjoutPersonnel/AjoutPersonnel.jsx'));
const AjoutService = lazy(() => import('./admin/Components/AjoutService/AjoutService.jsx'));
const AjoutSociete = lazy(() => import('./admin/Components/AjoutSociete/AjoutSociete.jsx'));

const AjoutCandidature = lazy(() => import('./admin/Components/AjoutCandidature/AjoutCandidature.jsx'));
const ProfileADMIN = lazy(() => import('./admin/Components/Profile/Profile.jsx'));
const AjoutDemandeFormationADMIN = lazy(() => import('./admin/Components/AjoutDemande/Formation.jsx'));
const AjoutDemandeCongeADMIN = lazy(() => import('./admin/Components/AjoutDemande/Conge.jsx'));
const AjoutDemandePreAvanceADMIN = lazy(() => import('./admin/Components/AjoutDemande/PreAvance.jsx'));
const AjoutDemandeDocumentADMIN = lazy(() => import('./admin/Components/AjoutDemande/Document.jsx'));
const AjoutDemandeAutorisationADMIN = lazy(() => import('./admin/Components/AjoutDemande/Autorisation.jsx'));
const DemandesADMIN = lazy(() => import('./admin/Components/DemandesADMIN/DemandesADMIN.jsx'));
const Candidaturesadmin = lazy(() => import('./admin/Components/Candidats/Candidatures.jsx'));
const Candidats = lazy(() => import('./admin/Components/Candidats/Candidats.jsx'));

// RH Components
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
const DocumentsRH = lazy(() => import('./RH/Components/Documents/Documents.jsx'));

// Chef Components
const AccueilCHEF = lazy(() => import('./Chef_hierarchique/Acceuil.jsx'));
const Personnels = lazy(() => import('./Chef_hierarchique/Components/Personnels/Personnels.jsx'));
const ProfileCHEF = lazy(() => import('./Chef_hierarchique/Components/Profile/Profile.jsx'));
const DemandesCHEF = lazy(() => import('./Chef_hierarchique/Components/DemandesCHEF/DemandesCHEF.jsx'));
const Formation = lazy(() => import('./Chef_hierarchique/Components/Demandes/Formation.jsx'));
const Conge = lazy(() => import('./Chef_hierarchique/Components/Demandes/Conge.jsx'));
const Document = lazy(() => import('./Chef_hierarchique/Components/Demandes/Document.jsx'));
const Autorisation = lazy(() => import('./Chef_hierarchique/Components/Demandes/Autorisation.jsx'));
const PreAvance = lazy(() => import('./Chef_hierarchique/Components/Demandes/PreAvance.jsx'));
const Calendar = lazy(() => import('./Chef_hierarchique/Components/Calendar/Calendar.jsx'));
const Notificationschef = lazy(() => import('./Chef_hierarchique/Components/Notifications/Notifications.jsx'));
const NotificationModalchef = lazy(() => import('./Chef_hierarchique/Components/Navbar/NotificationModal.jsx'));
const Documentschef = lazy(() => import('./Chef_hierarchique/Components/Documents/Documents.jsx'));

// Collaborateur Components
const Authentication = lazy(() => import('./collaborateurs/Authentification/Authentication.jsx'));
const DemandeConge = lazy(() => import('./collaborateurs/Demandes/Conge/CongeForm.jsx'));
const Profile = lazy(() => import('./collaborateurs/Profile/Profile.jsx'));
const DemandesCollaborateur = lazy(() => import('./collaborateurs/Profile/Demandes.jsx'));
const NotificationsCollab = lazy(() => import('./collaborateurs/Notifications/Notifications.jsx'));
const NotificationsModalCollab = lazy(() => import('./collaborateurs/Notifications/NotificationsModal.jsx'));
const Documents = lazy(() => import('./collaborateurs/Documents/Documents.jsx'));
const CalendarConge = lazy(() => import('./collaborateurs/Calendar/CalendrierConge.jsx'));
const DemandeFormation = lazy(() => import('./collaborateurs/Demandes/Formation/FormationForm.jsx'));
const DemandeAutorisation = lazy(() => import('./collaborateurs/Demandes/Autorisation/AutorisationForm.jsx'));
const DemandePreAvance = lazy(() => import('./collaborateurs/Demandes/Avance/Avance.jsx'));
const DemandeDocument = lazy(() => import('./collaborateurs/Demandes/Document/Document.jsx'));
const AccueilCollaborateurs = lazy(() => import('./collaborateurs/Accueil/Accueil.jsx'));
const ResetPasswordPage  = lazy(() => import('./collaborateurs/Authentification/ResetPasswordPage.jsx'));
const HistoriqueDemandes = lazy(() => import('./collaborateurs/Profile/Demandes.jsx'));

// Public Components
const CompanyHome = lazy(() => import('./AppHome/Home/Home.jsx'));
const Form = lazy(() => import('./AppHome/Home/JoinUs.jsx'));
const Careers = lazy(() => import('./AppHome/Home/careers.jsx'));
const Contact = lazy(() => import('./AppHome/Home/contact.jsx'));

export const AppRoutes = () => (
  <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicRoute><Authentication /></PublicRoute>} />
      <Route path="/CompanyHome" element={<CompanyHome />} />
      <Route path="/Form" element={<Form />} />
      <Route path="/Careers" element={<Careers />} />
      <Route path="/Contact" element={<Contact />} />

      {/* Admin Protected Routes */}
      <Route path="/Accueil" element={<ProtectedRoute><Accueil /></ProtectedRoute>} />
      <Route path="/Notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/Personnel" element={<ProtectedRoute><Personnel /></ProtectedRoute>} />
      <Route path="/Apropos" element={<ProtectedRoute><Apropos /></ProtectedRoute>} />
      <Route path="/NotificationModal" element={<ProtectedRoute><NotificationModal /></ProtectedRoute>} />
      <Route path="/AjoutPersonnel" element={<ProtectedRoute><AjoutPersonnel /></ProtectedRoute>} />
      <Route path="/AjoutService" element={<ProtectedRoute><AjoutService /></ProtectedRoute>} />
      <Route path="/AjoutSociete" element={<ProtectedRoute><AjoutSociete /></ProtectedRoute>} />
      <Route path="/LockedPersonnel" element={<ProtectedRoute><LockedPersonnel /></ProtectedRoute>} />

      <Route path="/AjoutCandidature" element={<ProtectedRoute><AjoutCandidature /></ProtectedRoute>} />
      <Route path="/ProfileADMIN" element={<ProtectedRoute><ProfileADMIN /></ProtectedRoute>} />
      <Route path="/AjoutDemandeAutorisationADMIN" element={<ProtectedRoute><AjoutDemandeAutorisationADMIN /></ProtectedRoute>} />
      <Route path="/AjoutDemandeFormationADMIN" element={<ProtectedRoute><AjoutDemandeFormationADMIN /></ProtectedRoute>} />
      <Route path="/AjoutDemandePreAvanceADMIN" element={<ProtectedRoute><AjoutDemandePreAvanceADMIN /></ProtectedRoute>} />
      <Route path="/AjoutDemandeDocumentADMIN" element={<ProtectedRoute><AjoutDemandeDocumentADMIN /></ProtectedRoute>} />
      <Route path="/AjoutDemandeCongeADMIN" element={<ProtectedRoute><AjoutDemandeCongeADMIN /></ProtectedRoute>} />
      <Route path="/DemandesADMIN" element={<ProtectedRoute><DemandesADMIN /></ProtectedRoute>} />
      <Route path="/Candidaturesadmin" element={<ProtectedRoute><Candidaturesadmin /></ProtectedRoute>} />
      <Route path="/candidats/:id" element={<ProtectedRoute><Candidats /></ProtectedRoute>} />

      {/* Chef Protected Routes */}
      <Route path="/AccueilCHEF" element={<ProtectedRoute><AccueilCHEF /></ProtectedRoute>} />
      <Route path="/Personnels" element={<ProtectedRoute><Personnels /></ProtectedRoute>} />
      <Route path="/Formation" element={<ProtectedRoute><Formation /></ProtectedRoute>} />
      <Route path="/Conge" element={<ProtectedRoute><Conge /></ProtectedRoute>} />
      <Route path="/Document" element={<ProtectedRoute><Document /></ProtectedRoute>} />
      <Route path="/Autorisation" element={<ProtectedRoute><Autorisation /></ProtectedRoute>} />
      <Route path="/PreAvance" element={<ProtectedRoute><PreAvance /></ProtectedRoute>} />
      <Route path="/Calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
      <Route path="/ProfileCHEF" element={<ProtectedRoute><ProfileCHEF /></ProtectedRoute>} />
      <Route path="/DemandesCHEF" element={<ProtectedRoute><DemandesCHEF /></ProtectedRoute>} />
      <Route path="/Notificationschef" element={<ProtectedRoute><Notificationschef /></ProtectedRoute>} />
      <Route path="/NotificationModalchef" element={<ProtectedRoute><NotificationModalchef /></ProtectedRoute>} />
      <Route path="/Documentschef" element={<ProtectedRoute><Documentschef /></ProtectedRoute>} />

      
      {/* RH Protected Routes */}
      <Route path="/AccueilRH" element={<ProtectedRoute><AccueilRH /></ProtectedRoute>} />
      <Route path="/PersonnelsRH" element={<ProtectedRoute><PersonnelsRH /></ProtectedRoute>} />
      <Route path="/DemandesRH" element={<ProtectedRoute><DemandesRH /></ProtectedRoute>} />
      <Route path="/FormationRH" element={<ProtectedRoute><FormationRH /></ProtectedRoute>} />
      <Route path="/CongeRH" element={<ProtectedRoute><CongeRH /></ProtectedRoute>} />
      <Route path="/DocumentRH" element={<ProtectedRoute><DocumentRH /></ProtectedRoute>} />
      <Route path="/AutorisationRH" element={<ProtectedRoute><AutorisationRH /></ProtectedRoute>} />
      <Route path="/PreAvanceRH" element={<ProtectedRoute><PreAvanceRH /></ProtectedRoute>} />
      <Route path="/ProfileRH" element={<ProtectedRoute><ProfileRH /></ProtectedRoute>} />
      <Route path="/AjoutDemandeAutorisationRH" element={<ProtectedRoute><AjoutDemandeAutorisationRH /></ProtectedRoute>} />
      <Route path="/AjoutDemandeFormationRH" element={<ProtectedRoute><AjoutDemandeFormationRH /></ProtectedRoute>} />
      <Route path="/AjoutDemandePreAvanceRH" element={<ProtectedRoute><AjoutDemandePreAvanceRH /></ProtectedRoute>} />
      <Route path="/AjoutDemandeDocumentRH" element={<ProtectedRoute><AjoutDemandeDocumentRH /></ProtectedRoute>} />
      <Route path="/AjoutDemandeCongeRH" element={<ProtectedRoute><AjoutDemandeCongeRH /></ProtectedRoute>} />
      <Route path="/CalendarRH" element={<ProtectedRoute><CalendarRH /></ProtectedRoute>} />
      <Route path="/Notificationsrh" element={<ProtectedRoute><Notificationsrh /></ProtectedRoute>} />
      <Route path="/NotificationModalrh" element={<ProtectedRoute><NotificationModalrh /></ProtectedRoute>} />
      <Route path="/DocumentsRH" element={<ProtectedRoute><DocumentsRH /></ProtectedRoute>} />

      {/* Collaborateur Protected Routes */}
      <Route path="/DemandeConge" element={<ProtectedRoute><DemandeConge /></ProtectedRoute>} />
      <Route path="/DemandeFormation" element={<ProtectedRoute><DemandeFormation /></ProtectedRoute>} />
      <Route path="/DemandeAutorisation" element={<ProtectedRoute><DemandeAutorisation /></ProtectedRoute>} />
      <Route path="/DemandePreAvance" element={<ProtectedRoute><DemandePreAvance /></ProtectedRoute>} />
      <Route path="/DemandeDocument" element={<ProtectedRoute><DemandeDocument /></ProtectedRoute>} />
      <Route path="/AccueilCollaborateurs" element={<ProtectedRoute><AccueilCollaborateurs /></ProtectedRoute>} />
      <Route path="/Profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/HistoriqueDemandes" element={<ProtectedRoute><HistoriqueDemandes /></ProtectedRoute>} />

      <Route path="/DemandesCollaborateur" element={<ProtectedRoute><DemandesCollaborateur /></ProtectedRoute>} />
      <Route path="/NotificationsCollab" element={<ProtectedRoute><NotificationsCollab /></ProtectedRoute>} />
      <Route path="/NotificationsModalCollab" element={<ProtectedRoute><NotificationsModalCollab /></ProtectedRoute>} />
      <Route path="/Documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
      <Route path="/CalendarConge" element={<ProtectedRoute><CalendarConge /></ProtectedRoute>} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />   
      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);