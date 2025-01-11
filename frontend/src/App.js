import React, { Suspense, lazy } from 'react';
import { Routes, Route, } from 'react-router-dom';


const Authentication = lazy(() => import('./collaborateurs/authentication/Authentication.jsx'));
const Accueil = lazy(() => import('./admin/Accueil.jsx'));


function App() {
 
 

  return (
    <div>
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
          {/* <!-- Client Pages --> */}
          <Route path='/' element={<Authentication />} />
          <Route path='/Accueil' element={<Accueil />} />

      </Routes>
      </Suspense>
    </div>
  );
}



export default App;
