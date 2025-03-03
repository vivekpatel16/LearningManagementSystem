import React from "react";
import { Container } from "react-bootstrap";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./sidebar";  
import Header from "../../Components/Header";  
import Dashboard from "./Dashboard";  
import CourseManagement from "./CourseManagement";  
import Profile from "./Profile";  

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
