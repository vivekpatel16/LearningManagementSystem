import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Header";
import common_API from "../../Api/commonApi";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSendOTP = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await common_API.post("/check-email", { email });
      setSuccess("OTP sent successfully to your email");
      setOtpSent(true);
      setCountdown(60); // Start countdown from 60 seconds
    } catch (error) {
      setError(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerifyOTP = async () => {
    if (!otp) {
      setError("Please enter the OTP");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await common_API.post("/verify-otp", { email, otp });
      setSuccess("OTP verified successfully");
      
      // Store reset token in sessionStorage
      sessionStorage.setItem("resetToken", response.data.resetToken);
      
      navigate("/reset-password");
    } catch (error) {
      setError(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header Component */}
      <Header />

      {/* Forgot Password Section */}
      <div className="d-flex align-items-center justify-content-center mt-5">
        <div className="card p-4 shadow-lg" style={{ width: "400px" }}>
          <h3 className="text-center mb-4">Forgot Password</h3>

          {success && (
            <div className="alert alert-success" role="alert">
              {success}
            </div>
          )}

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {!otpSent ? (
            <>
              <div className="mb-3">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button 
                className="btn btn-primary w-100" 
                onClick={handleSendOTP}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </>
          ) : (
            <>
              <div className="mb-3">
                <label className="form-label">Enter OTP</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
                <small className="text-muted">
                  OTP has been sent to your email address
                </small>
              </div>
              <button 
                className="btn btn-success w-100 mb-2" 
                onClick={handleVerifyOTP}
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
              <button
                className="btn btn-secondary w-100"
                onClick={handleSendOTP}
                disabled={countdown > 0 || loading}
              >
                {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
