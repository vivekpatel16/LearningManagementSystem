import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Form, Button, Alert, InputGroup, Spinner } from "react-bootstrap";
import { motion } from "framer-motion";
import { FaEnvelope, FaKey } from "react-icons/fa";
import common_API from "../../Api/commonApi";
import "../Auth/Login.css"; // Import Login.css styles

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 576);
  const navigate = useNavigate();

  // Add detection for mobile screens
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 576);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add useEffect to prevent body scrolling when component mounts
  useEffect(() => {
    // Save the original overflow style
    const originalStyle = window.getComputedStyle(document.body).overflow;
    
    // Add auth-page class instead of directly setting overflow style
    document.body.classList.add('auth-page');
    
    // Cleanup function to restore original style when component unmounts
    return () => {
      document.body.classList.remove('auth-page');
      document.body.style.overflow = originalStyle;
    };
  }, []);

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
    <div className="login-wrapper">
      <Container className="login-container">
        <div className="login-content">
          {/* Form Side - On Left */}
          <motion.div 
            className="login-form-container"
            initial={{ opacity: 0, x: isMobile ? 0 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="login-form-wrapper">
              <div className="header-gradient">
                <h2>{!otpSent ? "Password Recovery" : "Verify Email"}</h2>
                <p>{!otpSent ? "Reset your password securely." : "Enter the verification code sent to your email."}</p>
              </div>
              
              {success && (
                <motion.div 
                  className="login-success"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    padding: '12px',
                    borderRadius: '10px',
                    marginBottom: '20px',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-check-circle-fill me-2" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                  </svg>
                  {success}
                </motion.div>
              )}

              {error && (
                <motion.div 
                  className="login-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}
              
              <Form>
                {!otpSent ? (
                  <>
                    <Form.Group className="mb-4">
                      <Form.Label>Email Address</Form.Label>
                      <InputGroup className="input-group">
                        <InputGroup.Text style={{
                          backgroundColor: 'white',
                          border: 'none',
                          color: '#0062E6'
                        }}>
                          <FaEnvelope className="input-icon" />
                        </InputGroup.Text>
                        <Form.Control
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          style={{
                            border: 'none',
                            padding: '12px 15px',
                            fontSize: '1rem',
                            backgroundColor: 'white'
                          }}
                          required
                        />
                      </InputGroup>
                      <Form.Text className="text-muted mt-2">
                        We'll send you a verification code to reset your password
                      </Form.Text>
                    </Form.Group>
                    
                    <Button
                      variant="primary"
                      onClick={handleSendOTP}
                      disabled={loading}
                      className="login-button w-100 py-3 mt-2"
                    >
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Sending...
                        </>
                      ) : "Send Verification Code"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Form.Group className="mb-4">
                      <Form.Label>Verification Code</Form.Label>
                      <InputGroup className="input-group">
                        <InputGroup.Text style={{
                          backgroundColor: 'white',
                          border: 'none',
                          color: '#0062E6'
                        }}>
                          <FaKey className="input-icon" />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Enter 6-digit code"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          style={{
                            border: 'none',
                            padding: '12px 15px',
                            fontSize: '1rem',
                            backgroundColor: 'white'
                          }}
                          required
                        />
                      </InputGroup>
                      <Form.Text className="text-muted mt-2">
                        Enter the 6-digit code sent to {email}
                      </Form.Text>
                    </Form.Group>
                    
                    <Button
                      variant="primary"
                      onClick={handleVerifyOTP}
                      disabled={loading}
                      className="login-button w-100 py-3 mb-3"
                    >
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Verifying...
                        </>
                      ) : "Verify Code"}
                    </Button>
                    
                    <div className="text-center mb-3">
                      <Button
                        variant="link"
                        onClick={handleSendOTP}
                        disabled={countdown > 0 || loading}
                        style={{
                          color: countdown > 0 ? '#6c757d' : '#0062E6',
                          textDecoration: 'none',
                          padding: 0,
                          background: 'none',
                          border: 'none'
                        }}
                      >
                        {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
                      </Button>
                    </div>
                  </>
                )}
                
                <div className="d-flex justify-content-center mt-4">
                  <Link to="/" className="forgot-password">
                    Back to Login
                  </Link>
                </div>
              </Form>
            </div>
          </motion.div>
          
          {/* Illustration - On Right or Below on Mobile */}
          <div className="illustration-side">
            <motion.div 
              className="illustration"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              style={{ 
                maxWidth: '100%',
                height: 'auto',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden'
              }}
            >
              <svg 
                viewBox="0 0 600 600" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  width: isMobile ? '300px' : '500px',
                  maxHeight: isMobile ? '300px' : '500px'
                }}
              >
                {/* Background Circle */}
                <circle cx="300" cy="300" r="280" fill="#f8f9fa" stroke="#0062E6" strokeWidth="2" />
                
                {/* Email and Message Elements - Simplified for better responsiveness */}
                <motion.g
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.3 }}
                >
                  {/* Envelope */}
                  <rect x="200" y="180" width="200" height="150" rx="10" fill="#0062E6" />
                  <path d="M200,190 L300,270 L400,190" stroke="#33A1FD" strokeWidth="8" fill="none" />
                  <path d="M200,330 L270,260 M400,330 L330,260" stroke="#33A1FD" strokeWidth="5" fill="none" />
                  
                  {/* Envelope Flap */}
                  <motion.path 
                    d="M200,190 L300,120 L400,190" 
                    fill="#33A1FD"
                    animate={{ 
                      rotateX: [0, 45, 0],
                      y: [0, -20, 0]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 3,
                      ease: "easeInOut",
                      repeatDelay: 1
                    }}
                  />
                  
                  {/* Notification Badge */}
                  <motion.g
                    animate={{ 
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2
                    }}
                  >
                    <circle cx="380" cy="170" r="25" fill="#FF4757" />
                    <text x="380" y="178" textAnchor="middle" fontSize="20" fontWeight="bold" fill="white">1</text>
                  </motion.g>
                </motion.g>
                
                {/* Character checking email - Simplified */}
                <motion.g
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  {/* Body */}
                  <rect x="120" y="380" width="90" height="130" rx="45" fill="#33A1FD" />
                  
                  {/* Head */}
                  <circle cx="165" cy="340" r="40" fill="#FFD7B5" />
                  <circle cx="150" cy="330" r="5" fill="#333333" />
                  <circle cx="180" cy="330" r="5" fill="#333333" />
                  <path d="M155,355 Q165,365 175,355" stroke="#333333" strokeWidth="2" fill="none" />
                  
                  {/* Smartphone */}
                  <rect x="200" y="440" width="70" height="120" rx="10" fill="#333333" />
                  <rect x="205" y="450" width="60" height="100" rx="5" fill="#E6F3FF" />
                  
                  {/* Screen Content */}
                  <rect x="215" y="495" width="40" height="5" rx="2" fill="#0062E6" />
                  
                  {/* Verification Code */}
                  <rect x="215" y="525" width="40" height="15" rx="3" fill="#0062E6" opacity="0.1" />
                  <text x="235" y="536" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#0062E6">123456</text>
                </motion.g>
                
                {/* Confirmation Checkmark */}
                <motion.g
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                >
                  <circle cx="400" cy="420" r="35" fill="#0062E6" />
                  <motion.path 
                    d="M380,420 L395,435 L420,410" 
                    stroke="white" 
                    strokeWidth="8" 
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                  />
                </motion.g>
              </svg>
            </motion.div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ForgotPassword;
