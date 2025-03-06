import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedCourses = JSON.parse(localStorage.getItem("courses")) || [];
    console.log("Loaded courses from localStorage:", storedCourses); // Debugging
    setCourses(storedCourses);
  }, []);

  const handleEditCourse = (course) => {
    navigate("/instructor/courses/add-chapter", { state: { course } });
  };

  const handleDeleteCourse = (courseId) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      const updatedCourses = courses.filter((course) => course.id !== courseId);
      setCourses(updatedCourses);
      localStorage.setItem("courses", JSON.stringify(updatedCourses));
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Course List</h2>
      {courses.length === 0 ? (
        <p>No courses available. Please add and save a course.</p>
      ) : (
        <div className="row">
          {courses.map((course, index) => (
            <div key={course.id || `course-${index}`} className="col-md-4 mb-3">
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
                    <button
                      className="btn btn-primary me-2"
                      onClick={() => handleEditCourse(course)}
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteCourse(course.id)}
                    >
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

export default MyCourses;