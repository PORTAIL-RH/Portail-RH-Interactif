import { useState } from "react";
import { FiMail, FiX, FiRefreshCw } from "react-icons/fi";
import { toast } from "react-toastify";
import { API_URL } from "../../config";
import "./ResetPasswordButton.css";

const ResetPasswordModal = ({ isOpen, onClose, theme }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);

    try {
      const toastId = toast.loading("Sending reset link...");

      const response = await fetch(`${API_URL}/api/Personnel/request-password-reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send reset link");
      }

      toast.update(toastId, {
        render: "If an account exists, a reset link has been sent",
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });

      setEmail("");
      onClose();
    } catch (error) {
      console.error("Reset request error:", error);
      toast.error(error.message || "Error requesting password reset");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`reset-modal-overlay ${theme}`}>
      <div className="reset-modal">
        <button className="reset-modal-close" onClick={onClose}>
          <FiX />
        </button>

        <div className="reset-modal-header">
          <h2>Reset Password</h2>
        </div>

        <form className="reset-form" onSubmit={handleSubmit}>
          <div className="reset-input-group">
            <label>Enter your email to receive a reset link</label>
            <div className="reset-input-wrapper">
              <FiMail className="reset-input-icon" />
              <input
                type="email"
                className="reset-input"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <button type="submit" className="reset-submit-button" disabled={loading}>
            {loading ? (
              <span className="spinner"></span>
            ) : (
              <>
                <FiRefreshCw />
                Send Reset Link
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const ResetPasswordButton = ({ theme }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        className="reset-password-button"
        onClick={() => setIsModalOpen(true)}
        style={{
          background: "transparent",
          border: "none",
          color: theme === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(26, 31, 56, 0.7)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginTop: "1rem",
          fontSize: "0.875rem",
        }}
      >
        <FiRefreshCw size={14} />
        Forgot Password?
      </button>

      <ResetPasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        theme={theme}
      />
    </>
  );
};

export default ResetPasswordButton;