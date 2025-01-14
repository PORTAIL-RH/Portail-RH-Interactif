import React, { useState } from 'react';
import "./Authentication.css";
import profil from "../../assets/profil.png";
import mail from "../../assets/mail.png";
import pwd from "../../assets/pwd.png";
import matricule from "../../assets/code.png"; // Renamed import for clarity
import loginImg from "../../assets/se-connecter.gif";

const Authentication = () => {
  const [action, setAction] = useState("Login");
  const [formData, setFormData] = useState({
    username: "",
    matricule: "", // Changed from 'code' to 'matricule'
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async () => {
    if (formData.password.trim() !== formData.confirmPassword.trim()) {
      alert("Passwords do not match");
      return;
    }

    try {
      const requestBody = {
        nomUtilisateur: formData.username.trim(),
        matricule: formData.matricule.trim(), // Changed from 'code' to 'matricule'
        email: formData.email.trim(),
        motDePasse: formData.password.trim(),
        confirmationMotDePasse: formData.confirmPassword.trim()
      };

      console.log("Sign Up Data Sent:", JSON.stringify(requestBody)); // Log for debugging

      const response = await fetch("http://localhost:8080/api/Personnel/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const responseText = await response.text();
      if (!response.ok) {
        console.error("Server error:", responseText);
        alert(`Error: ${responseText}`);
      } else {
        alert("Registration successful!");
        setAction("Login"); // Switch to Login after successful registration
      }
    } catch (error) {
      alert("An error occurred while registering.");
      console.error(error);
    }
  };

  const handleLogin = async () => {
    try {
      const requestBody = {
        matricule: formData.matricule.trim(), // Changed from 'code' to 'matricule'
        motDePasse: formData.password.trim()
      };

      console.log("Login Data Sent:", JSON.stringify(requestBody)); // Log data to verify

      const response = await fetch("http://localhost:8080/api/Personnel/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const responseText = await response.text();
      if (!response.ok) {
        console.error("Server error:", responseText);
        alert(`Error: ${responseText}`);
      } else {
        alert("Login successful!");
        // Optionally, redirect the user or store the token
      }
    } catch (error) {
      alert("An error occurred while logging in.");
      console.error(error);
    }
  };

  return (
    <div className="container">
      <div className="header animated-header">
        <div className="text">{action}</div>
        <div
          className="underline"
          onClick={() => setAction(action === "Login" ? "Sign up" : "Login")}
        ></div>
      </div>

      <div className="inputs">
        {action === "Sign up" && (
          <div className="input animated-input">
            <img src={profil} alt="profile icon" className="img" />
            <input
              type="text"
              placeholder="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
            />
          </div>
        )}
        <div className="input animated-input">
          <img src={matricule} alt="matricule icon" className="img" /> {/* Updated alt text */}
          <input
            type="text"
            placeholder="Matricule"
            name="matricule" // Changed from 'code' to 'matricule'
            value={formData.matricule} // Changed from 'code' to 'matricule'
            onChange={handleChange}
          />
        </div>
        {action === "Sign up" && (
          <div className="input animated-input">
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
        <div className="input animated-input">
          <img src={pwd} alt="password icon" className="img" />
          <input
            type="password"
            placeholder="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>
        {action === "Sign up" && (
          <div className="input animated-input">
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
          className="toggle-action-image"
          onClick={() => {
            if (action === "Login") {
              handleLogin();
            } else {
              handleSignUp();
            }
          }}
        >
          <img src={loginImg} alt="Toggle action" className="img1" />
        </div>
      </div>

      {action === "Login" && (
        <div className="forgot-password animated-pulse">
          Forgot password<span> Click here!</span>
        </div>
      )}

      <div className="submit-container">
        <div
          className={`submit ${action === "Sign up" ? "gray" : ""}`}
          onClick={() => setAction("Login")}
        >
          Login
        </div>
        <div
          className={`submit ${action === "Login" ? "gray" : ""}`}
          onClick={() => setAction("Sign up")}
        >
          Sign up
        </div>
      </div>
    </div>
  );
};

export default Authentication;