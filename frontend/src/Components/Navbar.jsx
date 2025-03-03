import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector , useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand" to="/" onClick={handleLogout}>LMS</Link>
        <div className="collapse navbar-collapse" id="navbarNav">
          {user && (
            <ul className="navbar-nav me-auto">
              {user.role === "admin" && (
                <>
                  <li className="nav-item"><Link to="/admin/dashboard" className="nav-link">Dashboard</Link></li>
                  <li className="nav-item"><Link to="/admin/users" className="nav-link">User Management</Link></li>
                  <li className="nav-item"><Link to="/admin/courses" className="nav-link">Courses</Link></li>
                  <li className="nav-item"><Link to="/admin/reports" className="nav-link">Reports</Link></li>
                  <li className="nav-item"><Link to="/admin/profile" className="nav-link">Profile</Link></li>
                </>
              )}

              {user.role === "instructor" && (
                <>
                  <li className="nav-item"><Link to="/instructor/dashboard" className="nav-link">Dashboard</Link></li>
                  <li className="nav-item"><Link to="/instructor/courses" className="nav-link">My Courses</Link></li>
                  <li className="nav-item"><Link to="/instructor/profile" className="nav-link">Profile</Link></li>
                </>
              )}

              {user.role === "user" && (
                <>
                  <li className="nav-item"><Link to="/my-learning" className="nav-link">My Learning</Link></li>
                  <li className="nav-item"><Link to="/wishlist" className="nav-link">Wishlist</Link></li>
                  <li className="nav-item"><Link to="/profile" className="nav-link">Profile</Link></li>
                  <li className="nav-item"><Link to="/courses" className="nav-link">Courses</Link></li>
                  <li className="nav-item"><Link to="/home" className="nav-link">Home</Link></li>
                </>
              )}
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
