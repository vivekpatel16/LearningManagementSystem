import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Auth/Login";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";  // ✅ Import Reset Password
import Admin from "./pages/Admin/Admin";
import Instructor from "./pages/Instructor/Instructor";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />  {/* ✅ Add this route */}
        <Route path="/Admin/*" element={<Admin />} />
        <Route path="/Instructor/*" element={<Instructor />} />
      </Routes>
    </Router>
  );
}

export default App;
