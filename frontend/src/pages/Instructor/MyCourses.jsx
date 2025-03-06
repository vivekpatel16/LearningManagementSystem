import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import common_API from "../../Api/commonApi";

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await common_API.get("/courses");

        console.log("Fetched courses:", response.data.data);
        setCourses(response.data.data); // Set fetched courses
      } catch (error) {
        console.error("Error fetching user courses:", error);
      }
    };

    fetchCourses();
  }, []);

  const handleEditCourse = (course) => {
    navigate("/instructor/courses/add-chapter", { state: { course } });
  };

  const handleDeleteCourse = (courseId) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      const updatedCourses = courses.filter((course) => course.id !== courseId);
      setCourses(updatedCourses);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Course List</h2>
      {courses.length === 0 ? (
        <p>No courses available.</p>
      ) : (
        <div className="row">
          {courses.map((course) => (
            <div key={course._id} className="col-md-4 mb-3">
              <div className="card shadow-sm">
                <img
                  src={course.image || "https://via.placeholder.com/300"}
                  className="card-img-top"
                  alt={course.title}
                />
                <div className="card-body">
                  <h5 className="card-title">{course.title}</h5>
                  <p className="card-text">{course.description}</p>
                  <p><strong>Category:</strong> {course.category}</p>
                  <div className="d-flex justify-content-between">
                    <button className="btn btn-primary me-2" onClick={() => handleEditCourse(course)}>
                      <FaEdit /> Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDeleteCourse(course._id)}>
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseList;
