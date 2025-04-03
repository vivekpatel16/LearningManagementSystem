import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa"; 

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

