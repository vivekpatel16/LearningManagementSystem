import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header"; // Import the Header component

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Login Attempt:", { email, password });
    };

    return (
        <div>
            {/* Header Component */}
            <Header />

            {/* Login Form Section */}
            <div className="d-flex align-items-center justify-content-center mt-5">

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

                        <button type="submit" className="btn btn-primary w-100">
                            Login
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
