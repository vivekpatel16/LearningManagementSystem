import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [countdown, setCountdown] = useState(0);
    const navigate = useNavigate();

    const handleSendOTP = () => {
        console.log("OTP Sent to:", email);
        setOtpSent(true);
        setCountdown(60); // Start countdown from 60 seconds
    };

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleVerifyOTP = () => {
        console.log("OTP Verified:", otp);
        navigate("/reset-password");
    };

    return (
        <div className="d-flex align-items-center justify-content-center vh-100">
<img
                src="/logo.png"
                alt="Logo"
                className="mb-3"
                style={{ width: "200px", position: "absolute", top: "10px", left: "10px" }}
            />            <div className="card p-4 shadow-lg" style={{ width: "400px" }}>
                <h3 className="text-center mb-4">Forgot Password</h3>

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
                        <button className="btn btn-primary w-100" onClick={handleSendOTP}>
                            Send OTP
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
                        </div>
                        <button className="btn btn-success w-100 mb-2" onClick={handleVerifyOTP}>
                            Verify OTP
                        </button>
                        <button
                            className="btn btn-secondary w-100"
                            onClick={handleSendOTP}
                            disabled={countdown > 0}
                        >
                            {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
