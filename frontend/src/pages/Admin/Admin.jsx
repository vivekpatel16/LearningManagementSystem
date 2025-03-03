import React from "react";
import { Container } from "react-bootstrap";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminNavbar from "./sidebar"; 
import Header from "../../Components/Header";
import Dashboard from "./Dashboard";
import CourseManagement from "./CourseManagement";
import UserManagement from "./UserManagement";
// import Reports from "./reports";
import AdminProfile from "./Profile"; 
const Admin = () => {
  return (
    <>
   
      <Header />

    
      <div className="d-flex">
        <AdminNavbar />

       
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
