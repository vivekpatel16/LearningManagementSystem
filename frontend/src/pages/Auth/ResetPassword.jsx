import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Header";
import common_API from "../../Api/commonApi";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetToken, setResetToken] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Get reset token from sessionStorage
    const token = sessionStorage.getItem("resetToken");
    
    if (!token) {
      // Redirect to forgot password page if token is not available
      navigate("/forgot-password");
      return;
    }
    
    setResetToken(token);
  }, [navigate]);

  const handleResetPassword = async () => {
    // Validate passwords
    if (!newPassword || !confirmPassword) {
      setError("Please enter both passwords");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await common_API.post("/reset-password", { resetToken, newPassword });
      
      // Clear sessionStorage
      sessionStorage.removeItem("resetToken");
      
      // Show success message
      alert("Your password has been successfully reset. Redirecting to login...");
      
      // Redirect to login page
      navigate("/");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header Component */}
      <Header />

      {/* Reset Password Section */}
      <div className="d-flex align-items-center justify-content-center mt-5">
        <div className="card p-4 shadow-lg" style={{ width: "400px" }}>
          <h3 className="text-center mb-4">Reset Password</h3>
          
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <div className="mb-3">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <small className="text-muted">
              Password must be at least 8 characters long
            </small>
          </div>

          <div className="mb-3">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button 
            className="btn btn-primary w-100" 
            onClick={handleResetPassword}
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
