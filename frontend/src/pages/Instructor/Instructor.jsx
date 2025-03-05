import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./sidebar";
import Header from "../../Components/Header";
import Dashboard from "./Dashboard";
import CourseManagement from "./CourseManagement";
import AddChapter from "./AddChapter";
import AddVideo from "./AddVideo";
import Profile from "./Profile";
import MyCourse from "./MyCourse";

const Instructor = () => {
  return (
    <>
      <Header />
      <div className="d-flex">
        <Sidebar />
        <div className="container mt-4 flex-grow-1">
          <Routes>
            <Route path="/" element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="courses" element={<CourseManagement />} />
            <Route path="courses/add-chapter" element={<AddChapter />} />
            <Route path="courses/add-videos" element={<AddVideo />} />
            <Route path="profile" element={<Profile />} />
            <Route path="my-courses" element={<MyCourse />} />
          </Routes>
        </div>
      </div>
    </>
  );
};

export default Instructor;
