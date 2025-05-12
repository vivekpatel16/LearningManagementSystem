import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../features/auth/authSlice";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from "react-icons/fa";
import { Container, Form, Button, InputGroup } from "react-bootstrap";
import { motion } from "framer-motion";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); 

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await dispatch(loginUser({ email, password }));

    if (response.meta.requestStatus === "fulfilled") {
      const { role } = response.payload.user;
      if (role === "admin") navigate("/admin/dashboard");
      else if (role === "instructor") navigate("/instructor/dashboard");
      else if (role === "user") navigate("/home");
      else navigate("/");
    }
  };

  // Keep useEffect to prevent body scrolling when Login component mounts
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

  return (
    <div className="login-wrapper">
      <Container className="login-container">
        <div className="login-content">
          {/* Login Form - On Left */}
          <motion.div 
            className="login-form-container"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="login-form-wrapper">
              <div className="header-gradient">
                <h2>Login</h2>
                <p>Continue your journey to knowledge and excellence</p>
              </div>
              
              {error && (
                <motion.div 
                  className="login-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {typeof error === "string" ? error : error?.message || "Login failed"}
                </motion.div>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4 email-input">
                  <Form.Label>Email Address</Form.Label>
                  <InputGroup>
                    <InputGroup.Text style={{
                      backgroundColor: 'white',
                      border: 'none',
                      color: '#0062E6'
                    }}>
                      <FaEnvelope className="input-icon" />
                    </InputGroup.Text>
                    <Form.Control
              type="email"
                      placeholder="Email"
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
                </Form.Group>

                <Form.Group className="mb-4 password-input">
                  <Form.Label>Password</Form.Label>
                  <InputGroup>
                    <InputGroup.Text style={{
                      backgroundColor: 'white',
                      border: 'none',
                      color: '#0062E6'
                    }}>
                      <FaLock className="input-icon" />
                    </InputGroup.Text>
                    <Form.Control
                type={showPassword ? "text" : "password"}
                      placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                      style={{
                        border: 'none',
                        padding: '12px 15px',
                        fontSize: '1rem',
                        backgroundColor: 'white'
                      }}
                required
              />
                    <InputGroup.Text 
                onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                style={{
                        cursor: 'pointer',
                        backgroundColor: 'white',
                        border: 'none',
                        color: '#6e84a3'
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </InputGroup.Text>
                  </InputGroup>
                </Form.Group>

                <div className="d-flex justify-content-end mb-4">
                  <Link to="/forgot-password" className="forgot-password">
              Forgot Password?
            </Link>
          </div>

                <Button
                  variant="primary"
            type="submit"
                  className="login-button w-100 py-3 mt-2"
            disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
          >
            {loading ? "Logging in..." : "Login"}
                </Button>
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
              <svg width="550" height="500" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background Circle */}
                <circle cx="300" cy="300" r="280" fill="#f8f9fa" stroke="#0062E6" strokeWidth="2" />
                
                {/* Wave pattern background */}
                <motion.path
                  d="M 50 350 Q 175 300 300 350 T 550 350"
                  stroke="#E6F3FF"
                  strokeWidth="120"
                  fill="none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ duration: 1 }}
                />
                
                {/* Learning platform elements */}
                <motion.g
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.3 }}
                >
                  {/* Main device frame - tablet/laptop combo */}
                  <rect x="150" y="150" width="300" height="220" rx="10" fill="#ffffff" stroke="#0062E6" strokeWidth="2" />
                  <rect x="160" y="170" width="280" height="180" rx="5" fill="#E6F3FF" />
                  
                  {/* Top app bar */}
                  <rect x="160" y="170" width="280" height="40" rx="5" fill="#0062E6" />
                  <circle cx="185" cy="190" r="8" fill="#ffffff" />
                  <circle cx="210" cy="190" r="8" fill="#ffffff" />
                  <circle cx="235" cy="190" r="8" fill="#ffffff" />
                  
                  {/* Learning content interface */}
                  <rect x="175" y="225" width="100" height="15" rx="2" fill="#0062E6" opacity="0.7" />
                  <rect x="175" y="250" width="80" height="10" rx="2" fill="#0062E6" opacity="0.5" />
                  <rect x="175" y="270" width="90" height="10" rx="2" fill="#0062E6" opacity="0.5" />
                  <rect x="175" y="290" width="70" height="10" rx="2" fill="#0062E6" opacity="0.5" />
                  
                  {/* Video player */}
                  <rect x="290" y="225" width="135" height="90" rx="5" fill="#0062E6" />
                  <polygon points="340,255 370,270 340,285" fill="#ffffff" />
                  
                  {/* Progress indicators */}
                  <rect x="290" y="325" width="135" height="10" rx="5" fill="#DDDDDD" />
                  <motion.rect 
                    x="290" 
                    y="325" 
                    width="0" 
                    height="10" 
                    rx="5" 
                    fill="#33A1FD"
                    animate={{ width: 100 }}
                    transition={{ duration: 2, delay: 1.5 }}
                  />
                </motion.g>
                
                {/* Character with graduation cap */}
                <motion.g
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  {/* Body */}
                  <rect x="350" y="380" width="90" height="130" rx="45" fill="#33A1FD" />
                  
                  {/* Head */}
                  <circle cx="395" cy="340" r="40" fill="#FFD7B5" />
                  <circle cx="380" cy="330" r="5" fill="#333333" />
                  <circle cx="410" cy="330" r="5" fill="#333333" />
                  <path d="M385,355 Q395,365 405,355" stroke="#333333" strokeWidth="2" fill="none" />
                  
                  {/* Graduation cap */}
                  <motion.g
                    animate={{ 
                      y: [-3, 3, -3],
                      rotate: [-5, 5, -5]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 5,
                      ease: "easeInOut"
                    }}
                  >
                    <polygon points="395,290 365,305 395,320 425,305" fill="#333333" />
                    <rect x="393" y="290" width="4" height="20" fill="#333333" />
                    <polygon points="365,305 365,315 395,330 425,315 425,305 395,320" fill="#0062E6" />
                    <rect x="415" y="305" width="20" height="3" rx="1" fill="#0062E6" />
                  </motion.g>
                  
                  {/* Arms */}
                  <motion.path
                    d="M350,430 C320,450 320,480 350,490"
                    stroke="#33A1FD"
                    strokeWidth="15"
                    fill="none"
                    animate={{ 
                      d: [
                        "M350,430 C320,450 320,480 350,490",
                        "M350,430 C330,440 320,470 350,490",
                        "M350,430 C320,450 320,480 350,490"
                      ]
                    }}
                    transition={{ 
                      repeat: Infinity,
                      duration: 4,
                      ease: "easeInOut"
                    }}
                  />
                  
                  <motion.path
                    d="M440,430 C470,450 470,480 440,490"
                    stroke="#33A1FD"
                    strokeWidth="15"
                    fill="none"
                    animate={{ 
                      d: [
                        "M440,430 C470,450 470,480 440,490",
                        "M440,430 C460,440 470,470 440,490",
                        "M440,430 C470,450 470,480 440,490"
                      ]
                    }}
                    transition={{ 
                      repeat: Infinity,
                      duration: 4,
                      delay: 0.5,
                      ease: "easeInOut"
                    }}
                  />
                </motion.g>
                
                {/* Floating LMS elements */}
                <motion.g
                  animate={{ y: [-10, 10, -10], rotate: [-3, 3, -3] }}
                  transition={{ repeat: Infinity, duration: 6 }}
                >
                  {/* Certificate */}
                  <rect x="120" y="250" width="70" height="50" rx="5" fill="#ffffff" stroke="#0062E6" strokeWidth="2" />
                  <path d="M130,265 L180,265" stroke="#0062E6" strokeWidth="2" />
                  <path d="M130,280" stroke="#0062E6" strokeWidth="2" />
                  <path d="M130,280 L170,280" stroke="#0062E6" strokeWidth="2" />
                  <path d="M155,300 L165,310 L175,290" stroke="#33A1FD" strokeWidth="2" />
                </motion.g>
                
                <motion.g
                  animate={{ y: [-8, 8, -8], rotate: [3, -3, 3] }}
                  transition={{ repeat: Infinity, duration: 5, delay: 1 }}
                >
                  {/* Book */}
                  <rect x="500" y="280" width="60" height="70" rx="5" fill="#ffffff" stroke="#0062E6" strokeWidth="2" />
                  <rect x="505" y="290" width="50" height="5" rx="2" fill="#33A1FD" />
                  <rect x="505" y="305" width="50" height="5" rx="2" fill="#33A1FD" />
                  <rect x="505" y="320" width="50" height="5" rx="2" fill="#33A1FD" />
                  <rect x="505" y="335" width="30" height="5" rx="2" fill="#33A1FD" />
                </motion.g>
                
                {/* Learning stats */}
                <motion.g
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                >
                  {/* Progress circle */}
                  <circle cx="110" cy="420" r="35" stroke="#DDDDDD" strokeWidth="10" fill="transparent" />
                  <motion.circle 
                    cx="110" 
                    cy="420" 
                    r="35" 
                    stroke="#0062E6" 
                    strokeWidth="10" 
                    fill="transparent"
                    strokeDasharray="220" 
                    initial={{ strokeDashoffset: 220 }}
                    animate={{ strokeDashoffset: 55 }}
                    transition={{ delay: 1.5, duration: 2 }}
                  />
                  <text x="110" y="425" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#0062E6">75%</text>
                  
                  {/* Stars rating */}
                  <motion.g
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <polygon points="480,420 490,440 510,445 495,460 500,480 480,470 460,480 465,460 450,445 470,440" fill="#FFD700" />
                    <text x="480" y="455" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#333333">5.0</text>
                  </motion.g>
                  
                  {/* Quiz icon */}
                  <motion.g
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ repeat: Infinity, duration: 4, delay: 0.5 }}
                  >
                    <circle cx="200" cy="480" r="30" fill="#ffffff" stroke="#0062E6" strokeWidth="2" />
                    <text x="200" y="487" textAnchor="middle" fontSize="30" fontWeight="bold" fill="#33A1FD">Q</text>
                  </motion.g>
                </motion.g>
                
                {/* Course badges */}
                <motion.g
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  <circle cx="300" cy="480" r="25" fill="#ffffff" stroke="#0062E6" strokeWidth="2" />
                  <path d="M290,475 L300,485 L315,470" stroke="#33A1FD" strokeWidth="3" strokeLinecap="round" />
                </motion.g>
                
                <motion.g
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
                >
                  <circle cx="370" cy="480" r="25" fill="#ffffff" stroke="#0062E6" strokeWidth="2" />
                  <text x="370" y="487" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#33A1FD">+1</text>
                </motion.g>
              </svg>
            </motion.div>
          </div>
      </div>
      </Container>
    </div>
  );
};

export default Login;

