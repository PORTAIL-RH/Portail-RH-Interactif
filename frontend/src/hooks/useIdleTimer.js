import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const useIdleTimer = (timeout = 3600000) => {
  const timerRef = useRef(null);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear(); // ou localStorage.removeItem("token") si besoin
    alert("Vous avez été déconnecté(e) après 1h d'inactivité.");
    navigate("/login");
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, timeout);
  };

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "scroll", "click"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer(); // Démarre le timer au montage

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
};

export default useIdleTimer;
