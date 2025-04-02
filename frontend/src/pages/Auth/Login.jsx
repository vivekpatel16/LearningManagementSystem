import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import API_CONFIG from "../../config/apiConfig";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Direct fetch to production API
    const loginUrl = "https://learningmanagementsystem-2-bj3z.onrender.com/api/users/login";
    console.log("Attempting login with fetch to:", loginUrl);

    // Save these for the final fallback method
    const loginFormData = new FormData();
    loginFormData.append("email", email);
    loginFormData.append("password", password);
    
    let loginSuccess = false;

    try {
      let response;
      let data;
      
      try {
        // Try direct fetch first
        response = await fetch(loginUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': window.location.origin
          },
          body: JSON.stringify({ email, password })
        });
        
        console.log("Login response status:", response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Login failed");
        }
        
        data = await response.json();
        loginSuccess = true;
      } catch (directError) {
        console.error("Direct fetch failed, trying with CORS proxy:", directError);
        
        try {
          // If direct fetch fails, try using a CORS proxy
          const corsProxyUrl = "https://cors-anywhere.herokuapp.com/";
          const proxyLoginUrl = corsProxyUrl + loginUrl;
          
          console.log("Attempting with CORS proxy:", proxyLoginUrl);
          
          // Need to request temporary access at: https://cors-anywhere.herokuapp.com/corsdemo
          response = await fetch(proxyLoginUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ email, password })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Login failed");
          }
          
          data = await response.json();
          loginSuccess = true;
        } catch (proxyError) {
          console.error("CORS proxy failed, attempting final fallback:", proxyError);
          
          // Final desperate fallback - create hidden form and submit it
          const tempForm = document.createElement('form');
          tempForm.method = 'POST';
          tempForm.action = loginUrl;
          tempForm.style.display = 'none';
          
          const emailInput = document.createElement('input');
          emailInput.name = 'email';
          emailInput.value = email;
          tempForm.appendChild(emailInput);
          
          const passwordInput = document.createElement('input');
          passwordInput.name = 'password';
          passwordInput.value = password;
          tempForm.appendChild(passwordInput);
          
          // Create a response handler iframe
          const responseFrame = document.createElement('iframe');
          responseFrame.name = 'loginResponseFrame';
          responseFrame.style.display = 'none';
          document.body.appendChild(responseFrame);
          
          // Set form to submit to the iframe
          tempForm.target = 'loginResponseFrame';
          document.body.appendChild(tempForm);
          
          // Listen for iframe load and extract response
          responseFrame.addEventListener('load', function() {
            try {
              // Try to parse the response from the iframe
              const frameContent = responseFrame.contentDocument.body.innerHTML;
              data = JSON.parse(frameContent);
              processLoginData(data);
              
              // Clean up
              document.body.removeChild(tempForm);
              document.body.removeChild(responseFrame);
            } catch (frameError) {
              console.error("Failed to process iframe response:", frameError);
              setError("All login methods failed. Please try again later.");
              setLoading(false);
            }
          });
          
          // Submit the form
          console.log("Submitting form fallback...");
          tempForm.submit();
          
          // Return early since we're handling the response asynchronously
          return;
        }
      }
      
      console.log("Login successful");
      processLoginData(data);
      
    } catch (error) {
      console.error("Login failed:", error.message);
      setError(error.message || "Login failed. Please check your credentials.");
      
      // Also update Redux with error
      dispatch({ 
        type: 'auth/loginUser/rejected', 
        payload: { message: error.message || "Login failed" }
      });
      setLoading(false);
    }
  };
  
  // Separate function to handle successful login data
  const processLoginData = (data) => {
    // Store auth data in localStorage
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);
    
    // Also update Redux state
    dispatch({ 
      type: 'auth/loginUser/fulfilled', 
      payload: data
    });
    
    console.log("Login successful for role:", data.user.role);
    
    // Navigate based on role
    const { role } = data.user;
    if (role === "admin") navigate("/admin/dashboard");
    else if (role === "instructor") navigate("/instructor/dashboard");
    else if (role === "user") navigate("/home");
    else navigate("/");
    
    setLoading(false);
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100">
      <img
        src="/logo.png"
        alt="Logo"
        className="mb-3"
        style={{
          width: "200px",
          position: "absolute",
          top: "10px",
          left: "10px",
        }}
      />

      <div className="card p-4 shadow-lg" style={{ width: "400px" }}>
        <h3 className="text-center mb-4">Login</h3>

        <form onSubmit={handleSubmit}>
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

        
          <div className="mb-3">
            <label className="form-label">Password</label>
            <div className="position-relative">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: "40px" }} 
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="position-absolute"
                style={{
                  top: "50%",
                  right: "10px",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <div className="mb-3 text-end">
            <Link to="/forgot-password" className="text-decoration-none">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          {error && (
            <p className="text-danger mt-2">
              {typeof error === "string"
                ? error
                : error?.message || "Login failed"}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;

