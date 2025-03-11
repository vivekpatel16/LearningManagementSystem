import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import common_API from "../../Api/commonApi";
import Courses_API from "../../Api/courseApi";
import defaultImage from "../../assets/default-course.png";
import { Container, Row, Col, Card, Button, Spinner, Alert } from "react-bootstrap";

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await common_API.get("/courses");
        console.log("Fetched courses:", response.data.data);
        setCourses(response.data.data);
      } catch (error) {
        console.error("Error fetching user courses:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await Courses_API.get("/category");
        console.log("Fetched categories:", response.data);
        setCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCourses();
    fetchCategories();
  }, []);

  const handleEditCourse = (course) => {
    navigate("/instructor/courses", { state: { course } });
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    try {
      const response = await Courses_API.delete(`/${courseId}`);
      if (response.status === 200) {
        alert("Course deleted successfully.");
        setCourses((prevCourses) =>
          prevCourses.filter((course) => course._id !== courseId)
        );
      } else {
        alert("Failed to delete course.");
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("Server error while deleting the course.");
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat._id === categoryId);
    return category ? category.category_name : "Unknown Category";
  };

  const getValidThumbnail = (thumbnail) => {
    if (!thumbnail || typeof thumbnail !== "string" || thumbnail.trim() === "") {
      return defaultImage;
    }
    try {
      new URL(thumbnail);
      return thumbnail;
    } catch (error) {
      return defaultImage;
    }
  };

  return (
    <Container className="mt-4">
      <h2 className="text-center mb-4">Course List</h2>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : courses.length === 0 ? (
        <Alert variant="warning" className="text-center">
          No courses available.
        </Alert>
      ) : (
        <Row>
          {courses.map((course) => (
            <Col key={course._id} md={4} className="mb-3">
              <Card className="shadow-sm">
                <Card.Img
                  variant="top"
                  src={getValidThumbnail(course.thumbnail)}
                  alt={course.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultImage;
                  }}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate("/instructor/mycourses/coursedetails")} // Updated route
                />
                <Card.Body>
                  <Card.Title>{course.title}</Card.Title>
                  <Card.Text>{course.description}</Card.Text>
                  <p>
                    <strong>Category:</strong> {getCategoryName(course.category_id)}
                  </p>
                  <div className="d-flex justify-content-between">
                    <Button variant="primary" onClick={() => handleEditCourse(course)}>
                      <FaEdit /> Edit
                    </Button>
                    <Button variant="danger" onClick={() => handleDeleteCourse(course._id)}>
                      <FaTrash /> Delete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default CourseList;
