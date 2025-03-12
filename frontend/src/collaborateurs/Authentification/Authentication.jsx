import React, { useState } from 'react';
import './Authentication.css';
import { useNavigate } from 'react-router-dom';
import profil from '../../assets/profil.png';
import mail from '../../assets/mail.png';
import pwd from '../../assets/pwd.png';
import matricule from '../../assets/code.png';

const Authentication = () => {
  const [action, setAction] = useState('Login');
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    matricule: '',
    code_soc: '',
    service: '',

    email: '',
    password: '',
    confirmPassword: '',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async () => {
    if (formData.password.trim() !== formData.confirmPassword.trim()) {
      alert('Passwords do not match');
      return;
    }

    if (!formData.nom || !formData.prenom || !formData.matricule || !formData.email) {
      alert('All fields are required.');
      return;
    }

    const requestBody = {
      nom: formData.nom.trim(),
      prenom: formData.prenom.trim(),
      matricule: formData.matricule.trim(),
      email: formData.email.trim(),
      code_soc: formData.code_soc.trim(),
      service: formData.service.trim(),

      motDePasse: formData.password.trim(),
      confirmationMotDePasse: formData.confirmPassword.trim(),
      role: 'collaborateur',
    };

    console.log('Request body: ', requestBody);

    try {
      const response = await fetch('http://localhost:8080/api/Personnel/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const responseText = await response.text();
        console.error('Server error:', responseText);
        alert(`Error: ${responseText}`);
      } else {
        alert('Registration successful!');
        setAction('Login');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while registering.');
    }
  };

  const handleLogin = async () => {
    try {
      const requestBody = {
        matricule: formData.matricule.trim(),
        motDePasse: formData.password.trim(),
      };
  
      const response = await fetch('http://localhost:8080/api/Personnel/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
  
      if (response.ok) {
        const responseData = await response.json();
        const { token, id } = responseData;
  
        if (token && id) {
          localStorage.setItem('authToken', token);
          localStorage.setItem('userId', id);
  
          // Fetch user details by ID to get the role and service
          const userResponse = await fetch(`http://localhost:8080/api/Personnel/byId/${id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
  
          if (userResponse.ok) {
            const userData = await userResponse.json();
            const { role, service } = userData;
  
            console.log('User Role:', role); // Log the role to verify it matches
            console.log('User Service:', service); // Log the service for debugging
  
            if (role) {
              localStorage.setItem('userRole', role);
              localStorage.setItem('usermatricule', formData.matricule);
              localStorage.setItem('userCodeSoc', userData.code_soc);
  
              // Check if the service is defined and resolve it if it's a DBRef
              if (service && service.$ref === 'Services') {
                // Resolve the DBRef to get the service details
                const serviceResponse = await fetch(`http://localhost:8080/api/Services/${service.$id}`, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                });
  
                if (serviceResponse.ok) {
                  const serviceData = await serviceResponse.json();
                  console.log('Service Data:', serviceData);
  
                  // Store the serviceId and serviceName
                  if (serviceData.serviceId) {
                    localStorage.setItem('userServiceId', serviceData.serviceId);
                    console.log('Service ID stored:', serviceData.serviceId);
                  } else {
                    console.error('Service ID not found in service data:', serviceData);
                  }
  
                  if (serviceData.serviceName) {
                    localStorage.setItem('userServiceName', serviceData.serviceName);
                    console.log('Service Name stored:', serviceData.serviceName);
                  } else {
                    console.error('Service Name not found in service data:', serviceData);
                  }
                } else {
                  const errorText = await serviceResponse.text();
                  console.error('Error resolving service DBRef:', errorText);
                }
              } else if (service && service.serviceId) {
                // If service is already an object with serviceId, store it directly
                localStorage.setItem('userServiceId', service.serviceId);
                console.log('Service ID stored:', service.serviceId);
  
                if (service.serviceName) {
                  localStorage.setItem('userServiceName', service.serviceName);
                  console.log('Service Name stored:', service.serviceName);
                } else {
                  console.error('Service Name not found in service object:', service);
                }
              } else {
                console.error('Service is not a valid DBRef or object:', service);
              }
  
              alert('Login successful!');
  
              // Role-based redirection
              switch (role) {
                case 'collaborateur':
                  navigate('/AccueilCollaborateurs');
                  break;
                case 'RH':
                  navigate('/AccueilRH');
                  break;
                case 'Chef Hiérarchique': // Ensure this matches the database role name
                  navigate('/AccueilCHEF');
                  break;
                case 'Admin':
                  navigate('/Accueil');
                  break;
                default:
                  navigate('/'); // Default redirection
              }
            } else {
              alert('Role not found in user data.');
            }
          } else {
            const errorText = await userResponse.text();
            alert(`Error fetching user details: ${errorText}`);
          }
        } else {
          alert('Invalid response data.');
        }
      } else {
        const errorText = await response.text();
        alert(`Error: ${errorText}`);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred while logging in.');
    }
  };
  return (
    <div className="body">
      <div className="auth-containerl">
        <div className="auth-headerl">
          <div className="auth-text">{action}</div>
          <div className="auth-underline"></div>
          <div
            className="auth-switch-button"
            onClick={() => setAction(action === 'Login' ? 'Sign up' : 'Login')}
          >
            {action === 'Login' ? 'Switch to Sign up' : 'Switch to Login'}
          </div>
        </div>

        <div className="auth-inputs">
          {action === 'Sign up' && (
            <>
              <div className="auth-input">
                <img src={profil} alt="profile icon" className="img" />
                <input
                  type="text"
                  placeholder="Nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                />
              </div>
              <div className="auth-input">
                <img src={profil} alt="profile icon" className="img" />
                <input
                  type="text"
                  placeholder="Prénom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                />
              </div>
            </>
          )}
          <div className="auth-input">
            <img src={matricule} alt="matricule icon" className="img" />
            <input
              type="text"
              placeholder="Matricule"
              name="matricule"
              value={formData.matricule}
              onChange={handleChange}
            />
          </div>
          {action === 'Sign up' && (
            <div className="auth-input">
              <img src={mail} alt="email icon" className="img" />
              <input
                type="email"
                placeholder="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          )}
          <div className="auth-input">
            <img src={pwd} alt="password icon" className="img" />
            <input
              type="password"
              placeholder="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          {action === 'Sign up' && (
            <div className="auth-input">
              <img src={pwd} alt="confirm password icon" className="img" />
              <input
                type="password"
                placeholder="Confirm Password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          )}

          <div
            className="auth-submit-container"
            onClick={() => {
              if (action === 'Login') {
                handleLogin();
              } else {
                handleSignUp();
              }
            }}
          >
            <div className="auth-submit">
              {action === 'Login' ? 'Login' : 'Sign up'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Authentication;