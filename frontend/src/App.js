import React, { Suspense, lazy } from 'react';
import { Routes, Route, } from 'react-router-dom';


const Authentication = lazy(() => import('./collaborateurs/authentication/Authentication.jsx'));

function App() {
 
 

  return (
    <div>
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
          {/* <!-- Client Pages --> */}
          <Route path='/' element={<Authentication />} />
      </Routes>
      </Suspense>
    </div>
  );
}



export default App;
