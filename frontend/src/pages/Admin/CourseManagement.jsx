import React, { useEffect, useState } from "react";
import API from "../../Api/commonApi";
import { Container, Table, Button, Badge, Card } from "react-bootstrap";
import { FaToggleOn, FaToggleOff } from "react-icons/fa";

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);

  const fetchCourses = async () => {
    try {
      const response = await API.get("/users/courses", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setCourses(response.data.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  
  const toggleStatus = async (_id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const response = await API.patch(
        `/admin/course-status/${_id}`,
        { status: newStatus },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
  
      console.log(response.data.message); 
  
      if (response.data.success) {
        setCourses((prevCourses) =>
          prevCourses.map((course) =>
            course._id === _id ? { ...course, status: newStatus } : course
          )
        );
      } else {
        console.error("Failed to update course status");
      }
    } catch (error) {
      console.error("Error updating course status:", error);
    }
  };
  
  return (
    <Container className="mt-4">
      <Card className="shadow p-3">
        <h4 className="mb-3">Manage Courses</h4>
        <Table striped bordered hover responsive>
          <thead className="table-dark">
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
              <tr key={course._id}>
                <td>{index + 1}</td>
                <td>{course.title}</td>
                <td>{course.created_by?.user_name || "Unknown"}</td>
                <td>
                  <Badge bg={course.status ? "success" : "secondary"}>
                    {course.status ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td>
                  <Button
                    variant={course.status ? "danger" : "success"}
                    size="sm"
                    onClick={() => toggleStatus(course._id, course.status)}
                  >
                    {course.status ? <FaToggleOff /> : <FaToggleOn />}{" "}
                    {course.status ? "Deactivate" : "Activate"}
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
