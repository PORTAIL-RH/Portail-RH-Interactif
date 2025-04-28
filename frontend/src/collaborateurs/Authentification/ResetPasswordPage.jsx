import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiLock, FiCheck } from "react-icons/fi";
import { toast } from "react-toastify";
import { API_URL } from "../../config";
import "./ResetPasswordPage.css";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [isValidToken, setIsValidToken] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
      validateToken(tokenParam);
    } else {
      setTokenChecked(true);
      setIsValidToken(false);
    }
  }, [searchParams]);

  const validateToken = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/Personnel/validate-reset-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
  
      const data = await response.json();
      
      if (response.ok) {
        setIsValidToken(true);
      } else {
        toast.error(data.message || "Invalid reset link");
        setIsValidToken(false);
      }
    } catch (error) {
      console.error("Token validation error:", error);
      toast.error("Error validating reset token");
      setIsValidToken(false);
    } finally {
      setTokenChecked(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setLoading(true);

    try {
      const toastId = toast.loading("Resetting password...");

      const response = await fetch(`${API_URL}/api/Personnel/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Password reset failed");
      }

      toast.update(toastId, {
        render: "Password reset successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      console.error("Reset error:", error);
      toast.error(error.message || "Error resetting password");
    } finally {
      setLoading(false);
    }
  };

  if (!tokenChecked) {
    return (
      <div className="reset-container">
        <div className="reset-card">
          <h2>Verifying reset link...</h2>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="reset-container">
        <div className="reset-card">
          <h2>Invalid Reset Link</h2>
          <p>The password reset link is invalid or has expired.</p>
          <button onClick={() => navigate("/login")}>Return to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-container">
      <div className="reset-card">
        <h2>Reset Your Password</h2>
        <p>Please enter your new password</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>New Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength="8"
              />
            </div>
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength="8"
              />
            </div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? (
              <span className="spinner"></span>
            ) : (
              <>
                <FiCheck />
                Reset Password
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;