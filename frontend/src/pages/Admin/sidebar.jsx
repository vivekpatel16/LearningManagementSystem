import React, { useState } from "react"; 
import { Link } from "react-router-dom";
import { Offcanvas, Button } from "react-bootstrap";
import { FaBars, FaBook, FaUsers, FaChartBar ,   FaFileAlt } from "react-icons/fa";
import defaultProfilePic from "./th.png";

const AdminSidebar = () => {
  const [show, setShow] = useState(false);

  return (
    <>
      {/* Hamburger Button - Moved to the right */}
      <Button
        variant="light"
        className="position-fixed top-0 end-0 m-3"
        onClick={() => setShow(true)}
      >
        <FaBars />
      </Button>

      {/* Sidebar - Opens from the right */}
      <Offcanvas show={show} onHide={() => setShow(false)} placement="end" style={{ width: "300px", backgroundColor: "#ebf4fd" }}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            <Link
              to="/Admin/Profile"
              onClick={() => setShow(false)}
              className="text-decoration-none text-dark d-flex align-items-center"
            >
              <img
                src={defaultProfilePic}
                alt="Admin"
                className="rounded-circle me-2"
                width="40"
                height="40"
              />
              <span>Admin</span>
            </Link>
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body>
          <nav className="nav flex-column">
            <Link className="nav-link text-dark" to="/Admin/Dashboard" onClick={() => setShow(false)}>
              <FaChartBar  className="me-2" /> Dashboard
            </Link>
            <Link className="nav-link text-dark" to="/Admin/courses" onClick={() => setShow(false)}>
              <FaBook className="me-2" /> Course Management
            </Link>
            <Link className="nav-link text-dark" to="/Admin/users" onClick={() => setShow(false)}>
              <FaUsers className="me-2" /> User Management
            </Link>
            <Link className="nav-link text-dark" to="/Admin/reports" onClick={() => setShow(false)}>
              <FaFileAlt className="me-2" /> Reports
            </Link>
          </nav>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default AdminSidebar;
