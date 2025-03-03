// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import Header from "../../Components/Header";
// import API from "../../Api/authApi";

// const Login = () => {
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [error, setError] = useState("");
//     const [loading, setLoading] = useState(false);
//     const navigate = useNavigate();

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setLoading(true);
//         setError("");

//         try {
//             const res = await API.post("/users/login", {
//                 email,
//                 password,
//             });
//             console.log(res);
//             if (res.data && res.data.token) {
//                 // ✅ Store token and user info
//                 localStorage.setItem("token", res.data.token);
//                 localStorage.setItem("user", JSON.stringify(res.data.user));

//                 // ✅ Role-based redirection
//                 const { role } = res.data.user;
//                 if (role === "admin") navigate("/admin/dashboard");
//                 else if (role === "instructor") navigate("/instructor/dashboard");
//                 else if (role === "user") navigate("/home");
//                 else navigate("/");
//             }
//         } catch (err) {
//             console.error("Login Error:", err);
//             setError(err.response?.data?.message || "Login failed. Please try again.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div>
//             <Header />
//             <div className="d-flex align-items-center justify-content-center mt-5">
//                 <div className="card p-4 shadow-lg" style={{ width: "400px" }}>
//                     <h3 className="text-center mb-4">Login</h3>
//                     <form onSubmit={handleSubmit}>
//                         <div className="mb-3">
//                             <label className="form-label">Email Address</label>
//                             <input
//                                 type="email"
//                                 className="form-control"
//                                 placeholder="Enter your email"
//                                 value={email}
//                                 onChange={(e) => setEmail(e.target.value)}
//                                 required
//                             />
//                         </div>
//                         <div className="mb-3">
//                             <label className="form-label">Password</label>
//                             <input
//                                 type="password"
//                                 className="form-control"
//                                 placeholder="Enter your password"
//                                 value={password}
//                                 onChange={(e) => setPassword(e.target.value)}
//                                 required
//                             />
//                         </div>
//                         <div className="mb-3 text-end">
//                             <Link to="/forgot-password" className="text-decoration-none">
//                                 Forgot Password?
//                             </Link>
//                         </div>
//                         <button type="submit" className="btn btn-primary w-100" disabled={loading}>
//                             {loading ? "Logging in..." : "Login"}
//                         </button>
//                         {error && <p className="text-danger mt-2">{error}</p>}
//                     </form>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Login;


// import { useState } from "react";
// import { Link } from "react-router-dom";
// import Header from "../../Components/Header"; // Import the Header component
// import axios from "axios";

// const Login = () => {
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         const res = await axios.get("https://jsonplaceholder.typicode.com/posts")
//         console.log(res);
//         console.log("Login Attempt:", { email, password });
//     };

//     return (
//         <div>
//             {/* Header Component */}
//             <Header />

//             {/* Login Form Section */}
//             <div className="d-flex align-items-center justify-content-center mt-5">

//                 <div className="card p-4 shadow-lg" style={{ width: "400px" }}>
//                     <h3 className="text-center mb-4">Login</h3>

//                     <form onSubmit={handleSubmit}>
//                         <div className="mb-3">
//                             <label className="form-label">Email Address</label>
//                             <input
//                                 type="email"
//                                 className="form-control"
//                                 placeholder="Enter your email"
//                                 value={email}
//                                 onChange={(e) => setEmail(e.target.value)}
//                                 required
//                             />
//                         </div>

//                         <div className="mb-3">
//                             <label className="form-label">Password</label>
//                             <input
//                                 type="password"
//                                 className="form-control"
//                                 placeholder="Enter your password"
//                                 value={password}
//                                 onChange={(e) => setPassword(e.target.value)}
//                                 required
//                             />
//                         </div>

//                         <div className="mb-3 text-end">
//                             <Link to="/forgot-password" className="text-decoration-none">
//                                 Forgot Password?
//                             </Link>
//                         </div>

//                         <button type="submit" className="btn btn-primary w-100">
//                             Login
//                         </button>
//                     </form>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Login;


import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../features/auth/authSlice";
import { useNavigate } from "react-router-dom";


const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      {/* Logo on top left */}
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
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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

