import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Auth/Login";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import Admin from "./pages/Admin/Admin";
import Instructor from "./pages/Instructor/Instructor";
import Learner from "./pages/Learner/Learner";  
import Footer from "./Components/Footer"; // Ensure correct path
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <main className="flex-grow-1">
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/Admin/*" element={<Admin />} />
            <Route path="/Instructor/*" element={<Instructor />} />
            <Route path="/Learner/*" element={<Learner />} />
          </Routes>
        </Router>
      </main>
      <Footer />
    </div>
  );
}

export default App;
