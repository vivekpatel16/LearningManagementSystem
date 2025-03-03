import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Offcanvas, Button } from "react-bootstrap";
import { FaBars, FaBook, FaUsers, FaChartBar, FaFileAlt, FaHeart, FaChalkboardTeacher, FaHome } from "react-icons/fa";
import defaultProfilePic from "../assets/th.png";

const Sidebar = () => {
  const { user } = useSelector((state) => state.auth);
  const [profileImage, setProfileImage] = useState(defaultProfilePic);
  const [show, setShow] = useState(false); // <-- Define show state

  useEffect(() => {
    setProfileImage(user?.user_image || defaultProfilePic);
  }, [user?.user_image]); // Sidebar will now update when user_image changes

  return (
    <>
      {user && (
        <Button
          variant="light"
          className="position-fixed top-0 end-0 m-3"
          onClick={() => setShow(true)}
        >
          <FaBars />
        </Button>
      )}

      <Offcanvas show={show} onHide={() => setShow(false)} placement="end" style={{ width: "300px", backgroundColor: "#ebf4fd" }}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            {user && (
              <Link to={`/profile`} onClick={() => setShow(false)} className="text-decoration-none text-dark d-flex align-items-center">
                <img
                  src={profileImage}
                  alt="Profile"
                  className="rounded-circle me-2"
                  width="40"
                  height="40"
                  onError={() => setProfileImage(defaultProfilePic)}
                />
                <span>{user.user_name || "Profile"}</span>
              </Link>
            )}
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body>
          <nav className="nav flex-column">
            {user?.role === "admin" && (
              <>
                <Link className="nav-link text-dark" to="/admin/dashboard" onClick={() => setShow(false)}>
                  <FaChartBar className="me-2" /> Dashboard
                </Link>
                <Link className="nav-link text-dark" to="/admin/courses" onClick={() => setShow(false)}>
                  <FaBook className="me-2" /> Course Management
                </Link>
                <Link className="nav-link text-dark" to="/admin/users" onClick={() => setShow(false)}>
                  <FaUsers className="me-2" /> User Management
                </Link>
                <Link className="nav-link text-dark" to="/admin/reports" onClick={() => setShow(false)}>
                  <FaFileAlt className="me-2" /> Reports
                </Link>
              </>
            )}

            {user?.role === "instructor" && (
              <>
                <Link className="nav-link text-dark" to="/instructor/dashboard" onClick={() => setShow(false)}>
                  <FaChalkboardTeacher className="me-2" /> Dashboard
                </Link>
                <Link className="nav-link text-dark" to="/instructor/courses" onClick={() => setShow(false)}>
                  <FaBook className="me-2" /> My Courses
                </Link>
              </>
            )}

            {user?.role === "user" && (
              <>
                <Link className="nav-link text-dark" to="/my-learning" onClick={() => setShow(false)}>
                  <FaBook className="me-2" /> My Learning
                </Link>
                <Link className="nav-link text-dark" to="/wishlist" onClick={() => setShow(false)}>
                  <FaHeart className="me-2" /> Wishlist
                </Link>
                <Link className="nav-link text-dark" to="/courses" onClick={() => setShow(false)}>
                  <FaBook className="me-2" /> Courses
                </Link>
                <Link className="nav-link text-dark" to="/home" onClick={() => setShow(false)}>
                  <FaHome className="me-2" /> Home
                </Link>
              </>
            )}
          </nav>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default Sidebar;
