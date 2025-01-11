import React, { useState } from 'react';
import "./Authentication.css";
import profil from "../../assets/profil.png";
import mail from "../../assets/mail.png";
import pwd from "../../assets/pwd.png";
import code from "../../assets/code.png";
import loginImg from "../../assets/se-connecter.gif";

const Authentication = () => {
  const [action, setAction] = useState("Login");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    code: ""
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
            code: formData.code,
            email: formData.email.trim(),
            motDePasse: formData.password.trim(),
            confirmationMotDePasse: formData.confirmPassword.trim() // ✅ Fixed field name
        };

        console.log("Sign Up Data Sent:", JSON.stringify(requestBody)); // Log for debugging

        const response = await fetch("http://localhost:8080/api/Collaborateur/register", {
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
        }
    } catch (error) {
        alert("An error occurred while registering.");
        console.error(error);
    }
};

  

  const handleLogin = async () => {
    try {
      const requestBody = {
        code: formData.code,
        motDePasse: formData.password
      };

      console.log("Login Data Sent:", JSON.stringify(requestBody)); // Log data to verify

      const response = await fetch("http://localhost:8080/api/Collaborateur/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();  // Change to text() for raw response
        console.error("Server error:", errorData);
        alert(`Error: ${errorData}`);  // Display error message
      } else {
        alert("Login successful!");
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
            <input type="text" placeholder="Username" name="username" onChange={handleChange} />
          </div>
        )}
        {/* Show 'matricule' input  */}
        
          <div className="input animated-input">
            <img src={code} alt="code icon" className="img" />
            <input type="text" placeholder="matricule" name="code" onChange={handleChange} />
          </div>
        {action === "Sign up" && (
        <div className="input animated-input">
          <img src={mail} alt="email icon" className="img" />
          <input type="email" placeholder="Email" name="email" onChange={handleChange} />
        </div>
        )}
        <div className="input animated-input">
          <img src={pwd} alt="password icon" className="img" />
          <input type="password" placeholder="Password" name="password" onChange={handleChange} />
        </div>
        {action === "Sign up" && (
          <div className="input animated-input">
            <img src={pwd} alt="confirm password icon" className="img" />
            <input type="password" placeholder="Confirm Password" name="confirmPassword" onChange={handleChange} />
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