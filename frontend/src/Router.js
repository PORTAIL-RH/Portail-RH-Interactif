import React, { Suspense, lazy ,useState,useEffect } from 'react';
import { Routes, Route,useNavigate } from 'react-router-dom';

const Authentication = lazy(() => import('./collaborateurs/authentication/Authentication.js'));

export default function Router() {
    const [token, setToken] = useState('');
  
    const handleToken = (value) => {
      setToken(value);
    };
  
    useEffect(() => {
      const token = localStorage.getItem("token");
      if (token) setToken(token);
    }, []);

    
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

    