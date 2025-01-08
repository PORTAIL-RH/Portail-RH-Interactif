import React, { useState } from 'react';
import "./Authentication.css";
import profil from "../../assets/profil.png";
import mail from "../../assets/mail.png";
import pwd from "../../assets/pwd.png";
import code from "../../assets/code.png";

const Authentication = () => {
  const [action, setAction] = useState("Login");

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
            <input type="text" placeholder="Username" />
          </div>
        )}
        {action === "Login" && (
          <div className="input animated-input">
            <img src={code} alt="password icon" className="img" />
            <input type="text" placeholder="Code" />
          </div>
        )}
        <div className="input animated-input">
          <img src={mail} alt="email icon" className="img" />
          <input type="text" placeholder="Email" />
        </div>
        <div className="input animated-input">
          <img src={pwd} alt="password icon" className="img" />
          <input type="password" placeholder="Password" />
        </div>
        {action === "Sign up" && (
          <div className="input animated-input">
            <img src={pwd} alt="password icon" className="img" />
            <input type="password" placeholder="Confirm Password" />
          </div>
        )}
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