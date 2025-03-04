import React, { useState } from "react";
import { Table, Button } from "react-bootstrap";

const MyCourse = () => {
  // Sample courses added by the instructor
  const [courses, setCourses] = useState([
    {
      id: 1,
      title: "React for Beginners",
      category: "Programming & Scripting",
      description: "Learn React basics with this comprehensive course.",
      image: "https://via.placeholder.com/100",
    },
    {
      id: 2,
      title: "UI/UX Design Principles",
      category: "UI/UX & Web Design",
      description: "Master the principles of UI/UX design.",
      image: "https://via.placeholder.com/100",
    },
  ]);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      setCourses(courses.filter((course) => course.id !== id));
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">My Courses</h2>
      <Table striped bordered hover responsive>
        <thead className="bg-dark text-white">
          <tr>
            <th>Image</th>
            <th>Title</th>
            <th>Category</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course.id}>
              <td>
                <img src={course.image} alt={course.title} width="80" />
              </td>
              <td>{course.title}</td>
              <td>{course.category}</td>
              <td>{course.description}</td>
              <td>
                <Button variant="info" className="me-2">
                  Edit
                </Button>
                <Button variant="danger" onClick={() => handleDelete(course.id)}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default MyCourse;
