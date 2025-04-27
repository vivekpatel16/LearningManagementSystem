import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Form, Button, Alert, InputGroup } from "react-bootstrap";
import { motion } from "framer-motion";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import common_API from "../../Api/commonApi";
import "./Login.css"; // Import the Login styles

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  // Keep useEffect to prevent body scrolling when component mounts
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
      navigate("/login");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <Container className="login-container">
        <div className="login-content">
          {/* Reset Password Form - On Left */}
          <motion.div 
            className="login-form-container"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="login-form-wrapper">
              <div className="header-gradient">
                <h2>Reset Password</h2>
                <p>Create a new secure password for your account</p>
              </div>
        
              {error && (
                <motion.div 
                  className="login-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-exclamation-circle-fill me-2" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
                  </svg>
                  {error}
                </motion.div>
              )}
              
              <Form>
                <Form.Group className="mb-4">
                  <Form.Label>New Password</Form.Label>
                  <InputGroup className="input-group">
                    <InputGroup.Text>
                      <FaLock className="input-icon" />
                    </InputGroup.Text>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <InputGroup.Text 
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </InputGroup.Text>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Password must be at least 8 characters long
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Confirm Password</Form.Label>
                  <InputGroup className="input-group">
                    <InputGroup.Text>
                      <FaLock className="input-icon" />
                    </InputGroup.Text>
                    <Form.Control
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <InputGroup.Text 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="password-toggle"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </InputGroup.Text>
                  </InputGroup>
                </Form.Group>

                <Button
                  variant="primary"
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="login-button"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
                
                <div className="text-center mt-4">
                  <Link to="/login" 
                    className="forgot-password"
                  >
                    Back to Login
                  </Link>
                </div>
              </Form>
            </div>
          </motion.div>
          
          {/* Illustration - On Right */}
          <div className="illustration-side">
            <motion.div 
              className="illustration"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <svg width="500" height="500" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background Circle */}
                <circle cx="300" cy="300" r="280" fill="#f8f9fa" stroke="#0062E6" strokeWidth="2" />
                
                {/* Wave pattern background */}
                <motion.path
                  d="M50,350 C100,320 150,380 200,350 C250,320 300,380 350,350 C400,320 450,380 500,350 C550,320 600,380 650,350"
                  stroke="#E6F3FF"
                  strokeWidth="120"
                  fill="none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ duration: 1 }}
                />
                
                {/* Lock and Security Elements */}
                <motion.g
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.3 }}
                >
                  {/* Large lock in the center */}
                  <rect x="230" y="200" width="140" height="120" rx="20" fill="#0062E6" />
                  <rect x="250" y="160" width="100" height="40" rx="20" fill="#0062E6" />
                  
                  {/* Keyhole */}
                  <circle cx="300" cy="240" r="25" fill="#f8f9fa" />
                  <rect x="290" y="240" width="20" height="40" rx="5" fill="#f8f9fa" />
                  
                  {/* Padlock shading */}
                  <rect x="230" y="200" width="140" height="40" rx="10" fill="#33A1FD" fillOpacity="0.5" />
                </motion.g>
                
                {/* Character with key */}
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
                  
                  {/* Arms and key */}
                  <motion.g
                    animate={{ 
                      rotate: [-10, 10, -10]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 3,
                      ease: "easeInOut"
                    }}
                  >
                    <path
                      d="M210,410 L250,370"
                      stroke="#33A1FD"
                      strokeWidth="15"
                      fill="none"
                    />
                    
                    {/* Key */}
                    <circle cx="260" cy="355" r="15" fill="#FFD700" />
                    <rect x="255" cy="355" width="40" height="10" rx="2" fill="#FFD700" />
                    <rect x="280" cy="350" width="5" height="20" rx="2" fill="#FFD700" />
                    <rect x="290" cy="350" width="5" height="20" rx="2" fill="#FFD700" />
                  </motion.g>
                  
                  <path
                    d="M120,430 C90,450 90,480 120,490"
                    stroke="#33A1FD"
                    strokeWidth="15"
                    fill="none"
                  />
                </motion.g>
                
                {/* Shield Animation */}
                <motion.g
                  animate={{ y: [-10, 10, -10], rotate: [-3, 3, -3] }}
                  transition={{ repeat: Infinity, duration: 6 }}
                >
                  <path d="M450,260 L500,230 L550,260 L500,400 L450,260" fill="#0062E6" />
                  <path d="M460,270 L500,245 L540,270 L500,380 L460,270" fill="#33A1FD" />
                  <path d="M480,290 L520,290 L520,315 L500,330 L480,315 Z" fill="#f8f9fa" />
                </motion.g>
                
                {/* Checkmark Animation */}
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
                
                {/* Animated Rings */}
                <motion.g
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                >
                  <circle cx="300" cy="300" r="150" stroke="#0062E6" strokeWidth="2" strokeDasharray="5 5" fill="none" />
                </motion.g>
                
                <motion.g
                  animate={{ scale: [1.1, 1, 1.1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 4, delay: 2 }}
                >
                  <circle cx="300" cy="300" r="200" stroke="#33A1FD" strokeWidth="2" strokeDasharray="10 10" fill="none" />
                </motion.g>
              </svg>
            </motion.div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ResetPassword;
