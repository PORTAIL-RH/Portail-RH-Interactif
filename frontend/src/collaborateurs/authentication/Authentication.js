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
      <div className="header">
        <div className="text">{action}</div>
        <div
          className="underline"
          onClick={() => setAction(action === "Login" ? "Sign up" : "Login")}
        ></div>
      </div>

      <div className="inputs">
        {action === "Sign up" && (
          <div className="input">
            <img src={profil} alt="profile icon" className="img" />
            <input type="text" placeholder="Username" />
          </div>
        )}
        {action === "Login" && (
        <div className="input">
        <img src={code} alt="password icon" className="img" />
        <input type="text" placeholder="Code" />
      </div>
      )}

        <div className="input">
          <img src={mail} alt="email icon" className="img" />
          <input type="text" placeholder="Email" />
        </div>

        <div className="input">
          <img src={pwd} alt="password icon" className="img" />
          <input type="password" placeholder="Password" />
        </div>
        {action === "Sign up" && (
        <div className="input">
        <img src={pwd} alt="password icon" className="img" />
        <input type="password" placeholder="Confirm Password" />
      </div>
      )}
      </div>

      {action === "Login" && (
        <div className="forgot-password">
          Forgot password<span> Click here!</span>
        </div>
      )}

      <div className="submit-container">
        <div
          className={action === "Sign up" ? "submit gray" : "submit"}
          onClick={() => setAction("Login")}
        >
          Login
        </div>
        <div
          className={action === "Login" ? "submit gray" : "submit"}
          onClick={() => setAction("Sign up")}
        >
          Sign up
        </div>
      </div>
    </div>
  );
};

export default Authentication;
