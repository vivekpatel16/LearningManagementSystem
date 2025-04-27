import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { Offcanvas, Button } from "react-bootstrap";
import { FaBars, FaBook, FaUsers, FaChartBar, FaFileAlt, FaHeart, FaChalkboardTeacher, FaHome, FaSignOutAlt, FaFolderOpen, FaLayerGroup, FaUserCircle } from "react-icons/fa";
import defaultProfilePic from "../assets/th.png";
import { logout } from "../features/auth/authSlice"; // Adjust import path if needed
import Footer from "./Footer"; // Import Footer component

const Sidebar = ({ show, onHide }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [profileImage, setProfileImage] = useState(defaultProfilePic);
  const location = useLocation();

  useEffect(() => {
    setProfileImage(user?.user_image || defaultProfilePic);
  }, [user?.user_image]);

  // Helper function to determine if a link is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <>
      <Offcanvas 
        show={show} 
        onHide={onHide} 
        placement="end" 
        style={{ 
          width: "320px", 
          backgroundColor: "#ffffff",
          boxShadow: "-5px 0 20px rgba(0, 0, 0, 0.1)"
        }}
      >
        <div 
          className="sidebar-header" 
          style={{ 
            background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)",
            padding: "25px 20px 20px",
            position: "relative"
          }}
        >
          <Button 
            variant="link" 
            className="position-absolute top-0 end-0 mt-2 me-2 text-white p-2" 
            onClick={onHide}
            style={{ 
              fontSize: "1.8rem", 
              zIndex: 5,
              textDecoration: "none",
              lineHeight: 1,
              fontWeight: "300"
            }}
          >
            ×
          </Button>
          
          {user && (
            <Link to={`/profile`} onClick={onHide} className="text-decoration-none text-white d-flex align-items-center">
              <div className="position-relative">
                <img
                  src={profileImage}
                  alt="Profile"
                  className="rounded-circle me-3"
                  width="60"
                  height="60"
                  style={{ 
                    border: "3px solid white",
                    objectFit: "cover",
                    boxShadow: "0 3px 8px rgba(0, 0, 0, 0.2)"
                  }}
                  onError={() => setProfileImage(defaultProfilePic)}
                />
              </div>
              <div>
                <div className="fw-bold fs-5">{user.user_name || "Profile"}</div>
                <div style={{ fontSize: "0.85rem", opacity: "0.9" }}>{user.role === "user" ? "Learner" : user.role}</div>
              </div>
            </Link>
          )}
        </div>

        <div className="d-flex flex-column justify-content-between" style={{ height: "calc(100% - 105px)" }}>
          <nav className="nav flex-column p-3">
            {user?.role === "admin" && (
              <>
                <div className="text-uppercase text-muted ms-3 mb-2 mt-3" style={{ fontSize: "0.8rem", fontWeight: "500" }}>Management</div>
                <Link 
                  className={`nav-link ${isActive("/admin/dashboard") ? "active-link" : ""}`} 
                  to="/admin/dashboard" 
                  onClick={onHide}
                  style={{ 
                    padding: "10px 15px",
                    borderRadius: "8px",
                    marginBottom: "5px",
                    display: "flex",
                    alignItems: "center",
                    color: isActive("/admin/dashboard") ? "#0062E6" : "#495057",
                    backgroundColor: isActive("/admin/dashboard") ? "rgba(0, 98, 230, 0.08)" : "transparent",
                    transition: "all 0.2s ease"
                  }}
                >
                  <FaChartBar className="me-3" style={{ fontSize: "1.2rem", opacity: "0.9" }} /> 
                  <span>Dashboard</span>
                </Link>
                <Link 
                  className={`nav-link ${isActive("/admin/courses") ? "active-link" : ""}`} 
                  to="/admin/courses" 
                  onClick={onHide}
                  style={{ 
                    padding: "10px 15px",
                    borderRadius: "8px",
                    marginBottom: "5px",
                    display: "flex",
                    alignItems: "center",
                    color: isActive("/admin/courses") ? "#0062E6" : "#495057",
                    backgroundColor: isActive("/admin/courses") ? "rgba(0, 98, 230, 0.08)" : "transparent",
                    transition: "all 0.2s ease"
                  }}
                >
                  <FaBook className="me-3" style={{ fontSize: "1.2rem", opacity: "0.9" }} /> 
                  <span>Course Management</span>
                </Link>
                <Link 
                  className={`nav-link ${isActive("/admin/users") ? "active-link" : ""}`} 
                  to="/admin/users" 
                  onClick={onHide}
                  style={{ 
                    padding: "10px 15px",
                    borderRadius: "8px",
                    marginBottom: "5px",
                    display: "flex",
                    alignItems: "center",
                    color: isActive("/admin/users") ? "#0062E6" : "#495057", 
                    backgroundColor: isActive("/admin/users") ? "rgba(0, 98, 230, 0.08)" : "transparent",
                    transition: "all 0.2s ease"
                  }}
                >
                  <FaUsers className="me-3" style={{ fontSize: "1.2rem", opacity: "0.9" }} /> 
                  <span>User Management</span>
                </Link>
                <Link 
                  className={`nav-link ${isActive("/admin/reports") ? "active-link" : ""}`} 
                  to="/admin/reports" 
                  onClick={onHide}
                  style={{ 
                    padding: "10px 15px",
                    borderRadius: "8px",
                    marginBottom: "5px",
                    display: "flex",
                    alignItems: "center",
                    color: isActive("/admin/reports") ? "#0062E6" : "#495057",
                    backgroundColor: isActive("/admin/reports") ? "rgba(0, 98, 230, 0.08)" : "transparent", 
                    transition: "all 0.2s ease"
                  }}
                >
                  <FaFileAlt className="me-3" style={{ fontSize: "1.2rem", opacity: "0.9" }} /> 
                  <span>Reports</span>
                </Link>
                <Link 
                  className={`nav-link ${isActive("/admin/category") ? "active-link" : ""}`} 
                  to="/admin/category" 
                  onClick={onHide}
                  style={{ 
                    padding: "10px 15px",
                    borderRadius: "8px",
                    marginBottom: "5px",
                    display: "flex",
                    alignItems: "center",
                    color: isActive("/admin/category") ? "#0062E6" : "#495057",
                    backgroundColor: isActive("/admin/category") ? "rgba(0, 98, 230, 0.08)" : "transparent",
                    transition: "all 0.2s ease"
                  }}
                >
                  <FaLayerGroup className="me-3" style={{ fontSize: "1.2rem", opacity: "0.9" }} /> 
                  <span>Categories</span>
                </Link>
              </>
            )}

            {user?.role === "instructor" && (
              <>
                <div className="text-uppercase text-muted ms-3 mb-2 mt-3" style={{ fontSize: "0.8rem", fontWeight: "500" }}>Instructor</div>
                <Link 
                  className={`nav-link ${isActive("/instructor/dashboard") ? "active-link" : ""}`} 
                  to="/instructor/dashboard" 
                  onClick={onHide}
                  style={{ 
                    padding: "10px 15px",
                    borderRadius: "8px",
                    marginBottom: "5px",
                    display: "flex",
                    alignItems: "center",
                    color: isActive("/instructor/dashboard") ? "#0062E6" : "#495057",
                    backgroundColor: isActive("/instructor/dashboard") ? "rgba(0, 98, 230, 0.08)" : "transparent",
                    transition: "all 0.2s ease"
                  }}
                >
                  <FaChalkboardTeacher className="me-3" style={{ fontSize: "1.2rem", opacity: "0.9" }} /> 
                  <span>Dashboard</span>
                </Link>
                <Link 
                  className={`nav-link ${isActive("/instructor/courses") ? "active-link" : ""}`} 
                  to="/instructor/courses" 
                  onClick={onHide}
                  style={{ 
                    padding: "10px 15px",
                    borderRadius: "8px",
                    marginBottom: "5px",
                    display: "flex",
                    alignItems: "center",
                    color: isActive("/instructor/courses") ? "#0062E6" : "#495057",
                    backgroundColor: isActive("/instructor/courses") ? "rgba(0, 98, 230, 0.08)" : "transparent",
                    transition: "all 0.2s ease"
                  }}
                >
                  <FaBook className="me-3" style={{ fontSize: "1.2rem", opacity: "0.9" }} /> 
                  <span>Courses</span>
                </Link>
                <Link 
                  className={`nav-link ${isActive("/instructor/mycourses") ? "active-link" : ""}`} 
                  to="/instructor/mycourses" 
                  onClick={onHide}
                  style={{ 
                    padding: "10px 15px",
                    borderRadius: "8px",
                    marginBottom: "5px",
                    display: "flex",
                    alignItems: "center",
                    color: isActive("/instructor/mycourses") ? "#0062E6" : "#495057",
                    backgroundColor: isActive("/instructor/mycourses") ? "rgba(0, 98, 230, 0.08)" : "transparent",
                    transition: "all 0.2s ease"
                  }}
                >
                  <FaFolderOpen className="me-3" style={{ fontSize: "1.2rem", opacity: "0.9" }} /> 
                  <span>My Courses</span>
                </Link>
              </>
            )}

            {user?.role === "user" && (
              <>
                <Link 
                  className={`nav-link ${isActive("/home") ? "active-link" : ""}`} 
                  to="/home" 
                  onClick={onHide}
                  style={{ 
                    padding: "10px 15px",
                    borderRadius: "8px",
                    marginBottom: "5px",
                    display: "flex",
                    alignItems: "center",
                    color: isActive("/home") ? "#0062E6" : "#495057",
                    backgroundColor: isActive("/home") ? "rgba(0, 98, 230, 0.08)" : "transparent",
                    transition: "all 0.2s ease"
                  }}
                >
                  <FaHome className="me-3" style={{ fontSize: "1.2rem", opacity: "0.9" }} /> 
                  <span>Home</span>
                </Link>
                <Link 
                  className={`nav-link ${isActive("/courses") ? "active-link" : ""}`} 
                  to="/courses" 
                  onClick={onHide}
                  style={{ 
                    padding: "10px 15px",
                    borderRadius: "8px",
                    marginBottom: "5px",
                    display: "flex",
                    alignItems: "center",
                    color: isActive("/courses") ? "#0062E6" : "#495057",
                    backgroundColor: isActive("/courses") ? "rgba(0, 98, 230, 0.08)" : "transparent",
                    transition: "all 0.2s ease"
                  }}
                >
                  <FaBook className="me-3" style={{ fontSize: "1.2rem", opacity: "0.9" }} /> 
                  <span>Courses</span>
                </Link>
                <Link 
                  className={`nav-link ${isActive("/my-learning") ? "active-link" : ""}`} 
                  to="/my-learning" 
                  onClick={onHide}
                  style={{ 
                    padding: "10px 15px",
                    borderRadius: "8px",
                    marginBottom: "5px",
                    display: "flex",
                    alignItems: "center",
                    color: isActive("/my-learning") ? "#0062E6" : "#495057",
                    backgroundColor: isActive("/my-learning") ? "rgba(0, 98, 230, 0.08)" : "transparent",
                    transition: "all 0.2s ease"
                  }}
                >
                  <FaFolderOpen className="me-3" style={{ fontSize: "1.2rem", opacity: "0.9" }} /> 
                  <span>My Learning</span>
                </Link>
                <Link 
                  className={`nav-link ${isActive("/wishlist") ? "active-link" : ""}`} 
                  to="/wishlist" 
                  onClick={onHide}
                  style={{ 
                    padding: "10px 15px",
                    borderRadius: "8px",
                    marginBottom: "5px",
                    display: "flex",
                    alignItems: "center",
                    color: isActive("/wishlist") ? "#0062E6" : "#495057",
                    backgroundColor: isActive("/wishlist") ? "rgba(0, 98, 230, 0.08)" : "transparent",
                    transition: "all 0.2s ease"
                  }}
                >
                  <FaHeart className="me-3" style={{ fontSize: "1.2rem", opacity: "0.9" }} /> 
                  <span>Wishlist</span>
                </Link>
              </>
            )}
          </nav>

          {/* Logout Button and Footer at Bottom */}
          <div className="mt-auto p-3">
            <Button 
              variant="primary" 
              className="w-100 mb-3 py-2" 
              onClick={() => dispatch(logout())}
              style={{
                background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)",
                border: "none",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "500",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.filter = "brightness(1.1)";
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 5px 15px rgba(0, 98, 230, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.target.style.filter = "brightness(1)";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }}
            >
              <FaSignOutAlt className="me-2" /> Logout
            </Button>
            <div 
              className="text-center text-muted pb-2"
              style={{ fontSize: "0.85rem" }}
            >
              <Footer /> {/* Footer Component */}
            </div>
          </div>
        </div>
      </Offcanvas>

      {/* Add global CSS for hover effects and animations */}
      <style jsx="true">{`
        .nav-link:hover {
          background-color: rgba(0, 98, 230, 0.04) !important;
          color: #0062E6 !important;
          transform: translateX(3px);
        }
        
        .active-link {
          font-weight: 500 !important;
        }
      `}</style>
    </>
  );
};

export default Sidebar;
