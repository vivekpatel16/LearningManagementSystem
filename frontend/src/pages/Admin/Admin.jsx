import React from "react";
import { Container } from "react-bootstrap";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminNavbar from "./sidebar"; // Sidebar stays visible
import Header from "../../components/Header";
import Dashboard from "./Dashboard";
import CourseManagement from "./CourseManagement";
import UserManagement from "./UserManagement";
import Reports from "./reports";
import AdminProfile from "./Profile"; // Import Profile Component

const Admin = () => {
  return (
    <>
      {/* ✅ Header for all admin pages */}
      <Header />

      {/* ✅ Sidebar always visible */}
      <div className="d-flex">
        <AdminNavbar />

        {/* ✅ Main Content Section */}
        <Container className="mt-4 flex-grow-1">
          <Routes>
            <Route path="/" element={<Navigate to="Dashboard" />} />
            <Route path="Dashboard" element={<Dashboard />} />
            <Route path="Courses" element={<CourseManagement />} />
            <Route path="Users" element={<UserManagement />} />
            <Route path="Reports" element={<Reports />} />
            <Route path="Profile" element={<AdminProfile />} />
          </Routes>
        </Container>
      </div>
    </>
  );
};

export default Admin;
