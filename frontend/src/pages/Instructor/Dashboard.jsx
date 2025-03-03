import React from "react";
import { Container } from "react-bootstrap";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./sidebar";  // ✅ Ensure Sidebar is correctly exported from sidebar.jsx
import Header from "../../Components/Header";  // ✅ Ensure Header is correctly exported
import Dashboard from "./Dashboard";  // ✅ Ensure Dashboard is default exported
import CourseManagement from "./CourseManagement";  // ✅ Ensure default export
import Profile from "./Profile";  // ✅ Ensure default export

const Instructor = () => {
  return (
    <>
      <Header />

      <div className="d-flex">
        <Sidebar />
        <Container className="mt-4 flex-grow-1">
          <Routes>
            <Route path="/" element={<Navigate to="Dashboard" />} />
            <Route path="Dashboard" element={<Dashboard />} />
            <Route path="Courses" element={<CourseManagement />} />
            <Route path="Profile" element={<Profile />} />
          </Routes>
        </Container>
      </div>
    </>
  );
};

export default Instructor;