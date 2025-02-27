import React, { useState } from "react";
import { Container, Table, Button, Badge, Card } from "react-bootstrap";
import { FaToggleOn, FaToggleOff } from "react-icons/fa";

const CourseManagement = () => {
  // Static course data
  const [courses, setCourses] = useState([
    { id: 1, name: "React for Beginners", instructor: "Alice Johnson", status: "Active" },
    { id: 2, name: "Advanced Python", instructor: "Michael Smith", status: "Inactive" },
    { id: 3, name: "Machine Learning Basics", instructor: "David Brown", status: "Active" },
    { id: 4, name: "Cybersecurity Fundamentals", instructor: "Sarah Williams", status: "Inactive" },
  ]);

  // Toggle course status
  const toggleStatus = (id) => {
    setCourses((prevCourses) =>
      prevCourses.map((course) =>
        course.id === id
          ? { ...course, status: course.status === "Active" ? "Inactive" : "Active" }
          : course
      )
    );
  };

  return (
    <Container className="mt-4">
      <Card className="shadow p-3">
        <h4 className="mb-3">Manage Courses</h4>
        <Table striped bordered hover responsive>
          <thead className= "table-dark">
            <tr>
              <th>Index</th>
              <th>Course Name</th>
              <th>Instructor</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course, index) => (
              <tr key={course.id}>
                <td>{index + 1}</td>
                <td>{course.name}</td>
                <td>{course.instructor}</td>
                <td>
                  <Badge bg={course.status === "Active" ? "success" : "secondary"}>
                    {course.status}
                  </Badge>
                </td>
                <td>
                  <Button
                    variant={course.status === "Active" ? "danger" : "success"}
                    size="sm"
                    onClick={() => toggleStatus(course.id)}
                  >
                    {course.status === "Active" ? <FaToggleOff /> : <FaToggleOn />}{" "}
                    {course.status === "Active" ? "Deactivate" : "Activate"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </Container>
  );
};

export default CourseManagement;
