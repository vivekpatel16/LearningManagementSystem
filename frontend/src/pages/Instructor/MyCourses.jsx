import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import common_API from "../../Api/commonApi";
import Courses_API from "../../Api/courseApi";
import defaultImage from "../../assets/default-course.png";
import { Container, Row, Col, Card, Button, Spinner, Alert, Tooltip, OverlayTrigger } from "react-bootstrap";

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
        setCourses(response.data.data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await Courses_API.get("/category");
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
        setCourses((prevCourses) => prevCourses.filter((course) => course._id !== courseId));
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

  const truncateDescription = (description, maxLength = 100) => {
    if (!description) return "";

    if (description.length <= maxLength) {
      return description;
    }

    return (
      <>
        

<OverlayTrigger
  placement="top"
  overlay={<Tooltip>{description}</Tooltip>}
>
  <span style={{ color: "black", cursor: "pointer" }}>
    {`${description.substring(0, maxLength)}...`}
  </span>
</OverlayTrigger>

      </>
    );
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
        <Row className="g-4">
          {courses.map((course) => (
            <Col key={course._id} md={4} className="d-flex">
              <Card className="shadow-sm w-100">
                <div
                  style={{ height: "200px", overflow: "hidden", position: "relative" }}
                  onMouseEnter={(e) => (e.currentTarget.firstChild.style.transform = "scale(1.05)")}
                  onMouseLeave={(e) => (e.currentTarget.firstChild.style.transform = "scale(1)")}
                >
                  <Card.Img
                    variant="top"
                    src={getValidThumbnail(course.thumbnail)}
                    alt={course.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultImage;
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      cursor: "pointer",
                      transition: "transform 0.3s ease",
                    }}
                    onClick={() => navigate("/instructor/mycourses/coursedetails", { state: { course } })}
                  />
                </div>
                <Card.Body className="d-flex flex-column">
                  <Card.Title
                    style={{ fontSize: "1.25rem", cursor: "pointer", color: "#333", overflow: "hidden", textOverflow: "ellipsis", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", display: "-webkit-box" }}
                    onClick={() => navigate("/instructor/mycourses/coursedetails", { state: { course } })}
                  >
                    {course.title}
                  </Card.Title>
                  <Card.Text style={{ color: "#666", marginBottom: "1rem", lineHeight: "1.5" }}>
                    {truncateDescription(course.description, 100)}
                  </Card.Text>
                  <p className="mt-auto mb-2">
                    <strong>Category:</strong> {getCategoryName(course.category_id)}
                  </p>
                  <div className="d-flex justify-content-between">
                    <Button variant="primary" onClick={() => handleEditCourse(course)}>
                      <FaEdit className="me-1" /> Edit
                    </Button>
                    <Button variant="danger" onClick={() => handleDeleteCourse(course._id)}>
                      <FaTrash className="me-1" /> Delete
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
