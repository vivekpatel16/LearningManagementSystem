import React, { useState } from "react"; 
import { Link } from "react-router-dom";
import Header from "../../Components/Header";
import axios from "axios";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await axios.get("https://jsonplaceholder.typicode.com/posts");
            console.log("Login Successful:", res.data);
        } catch (err) {
            setError("Something went wrong. Please try again.");
            console.error("Login Error:", err);
        }
    };

    return (
        <div>
            <Header />
            <div className="d-flex align-items-center justify-content-center vh-100">
                <div className="card p-4 shadow-lg" style={{ width: "400px" }}>
                    <h3 className="text-center mb-4">Login</h3>
                    {error && <p className="text-danger text-center">{error}</p>}
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
