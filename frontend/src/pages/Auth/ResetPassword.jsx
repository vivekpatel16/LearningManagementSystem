import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Header"; // Import Header component

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleResetPassword = () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    console.log("Password Reset Successful");

    // Show success message
    alert("Your password has been successfully reset. Redirecting to login...");

    // Redirect to login page
    navigate("/");
  };

  return (
    <div>
      {/* Header Component */}
      <Header />

      {/* Reset Password Section */}
      <div className="d-flex align-items-center justify-content-center mt-5">
        <div className="card p-4 shadow-lg" style={{ width: "400px" }}>
          <h3 className="text-center mb-4">Reset Password</h3>

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

          <button className="btn btn-primary w-100" onClick={handleResetPassword}>
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
