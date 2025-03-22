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

                // Fetch user details by ID to get the role, serviceId, and serviceName
                const userResponse = await fetch(`http://localhost:8080/api/Personnel/byId/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    const { role, serviceId, serviceName } = userData;

                    console.log('User Role:', role);
                    console.log('User Service ID:', serviceId);
                    console.log('User Service Name:', serviceName);

                    if (role) {
                        localStorage.setItem('userRole', role);
                        localStorage.setItem('usermatricule', formData.matricule);
                        localStorage.setItem('userCodeSoc', userData.code_soc);

                        // Store serviceId and serviceName if they exist
                        if (serviceId) {
                            localStorage.setItem('userServiceId', serviceId);
                            console.log('Stored userServiceId:', serviceId);
                        } else {
                            console.error('serviceId not found in user data');
                        }

                        if (serviceName) {
                            localStorage.setItem('userServiceName', serviceName);
                            console.log('Stored userServiceName:', serviceName);
                        } else {
                            console.error('serviceName not found in user data');
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
                            case 'Chef Hiérarchique':
                                navigate('/AccueilCHEF');
                                break;
                            case 'Admin':
                                navigate('/Accueil');
                                break;
                            default:
                                navigate('/');
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
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-title">{action}</div>
          <div className="auth-underline"></div>
          <button
            className="auth-switch-button"
            onClick={() => setAction(action === 'Login' ? 'Sign up' : 'Login')}
          >
            {action === 'Login' ? 'Switch to Sign up' : 'Switch to Login'}
          </button>
        </div>

        <div className="auth-form">
          {action === 'Sign up' && (
            <>
              <div className="auth-input-group">
                <img src={profil} alt="profile icon" className="auth-icon" />
                <input
                  type="text"
                  placeholder="Nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                />
              </div>
              <div className="auth-input-group">
                <img src={profil} alt="profile icon" className="auth-icon" />
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
          <div className="auth-input-group">
            <img src={matricule} alt="matricule icon" className="auth-icon" />
            <input
              type="text"
              placeholder="Matricule"
              name="matricule"
              value={formData.matricule}
              onChange={handleChange}
            />
          </div>
          {action === 'Sign up' && (
            <div className="auth-input-group">
              <img src={mail} alt="email icon" className="auth-icon" />
              <input
                type="email"
                placeholder="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          )}
          <div className="auth-input-group">
            <img src={pwd} alt="password icon" className="auth-icon" />
            <input
              type="password"
              placeholder="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          {action === 'Sign up' && (
            <div className="auth-input-group">
              <img src={pwd} alt="confirm password icon" className="auth-icon" />
              <input
                type="password"
                placeholder="Confirm Password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          )}

          <button
            className="auth-submit-button"
            onClick={() => {
              if (action === 'Login') {
                handleLogin();
              } else {
                handleSignUp();
              }
            }}
          >
            {action === 'Login' ? 'Login' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Authentication;