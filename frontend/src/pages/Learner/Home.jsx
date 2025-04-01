import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Card, Button, Form, InputGroup, Spinner, Alert } from "react-bootstrap";
import { FaSearch, FaChevronLeft, FaChevronRight, FaChalkboardTeacher } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Import Axios

const defaultImage = "https://www.futuretechinfovision.co.uk/wp-content/uploads/2022/06/IT-Courses.jpg";

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([]); // Store category names from API
  const [courses, setCourses] = useState([]); // Store fetched courses
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const scrollRefs = useRef({});
  const cardWidth = 260;
  const gap = 15;
  const visibleCount = 4;
  const navigate = useNavigate();

  // ✅ Fetch Categories & Courses from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token"); // Get token
        const headers = token ? { Authorization: `Bearer ${token}` } : {}; // Include token in headers

        // ✅ Fetch categories
        const categoryResponse = await axios.get("http://localhost:5000/api/courses/category", { headers });
        console.log("Fetched Categories:", categoryResponse.data);
        setCategories(categoryResponse.data); // Store category names

        // ✅ Fetch courses
        const courseResponse = await axios.get("http://localhost:5000/api/users/courses", { headers });
        console.log("Fetched Courses:", courseResponse.data);

        // ✅ Store only necessary fields
        const filteredCourses = courseResponse.data.data.map(course => ({
          id: course._id,
          title: course.title,
          category_id: course.category_id, // Link to category
          thumbnail: course.thumbnail || defaultImage,
          created_by: course.created_by?.user_name || "Unknown",
        }));

        setCourses(filteredCourses);
      } catch (err) {
        setError("Failed to load courses. Please try again.");
        console.error("API Fetch Error:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ Group courses by category
  const groupedCourses = categories.reduce((acc, category) => {
    const filteredCourses = courses.filter(course => course.category_id === category._id); // Match category_id with _id

    if (filteredCourses.length > 0) {
      acc[category.category_name] = filteredCourses; // Use category_name from API
    }
    return acc;
  }, {});

  // ✅ Search Filter
  const filteredCourses = Object.entries(groupedCourses).reduce((acc, [category, courses]) => {
    const filtered = courses.filter(course =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {});

  const scrollLeft = (category) => {
    if (scrollRefs.current[category]) {
      scrollRefs.current[category].scrollBy({ left: -(cardWidth + gap) * visibleCount, behavior: "smooth" });
    }
  };

  const scrollRight = (category) => {
    if (scrollRefs.current[category]) {
      scrollRefs.current[category].scrollBy({ left: (cardWidth + gap) * visibleCount, behavior: "smooth" });
    }
  };

  return (
    <Container className="mt-4">
      {/* Search Input */}
      <Row className="mb-4 align-items-center">
        <Col md={12}>
          <InputGroup
            style={{
              width: "100%",
              height: "50px",
              borderRadius: "50px",
              overflow: "hidden",
              border: "2px solid #ccc",
              transition: "0.3s ease-in-out",
            }}
            className="search-bar"
          >
            <InputGroup.Text style={{ background: "white", border: "none" }}>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search for a course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                height: "50px",
                borderRadius: "50px",
                border: "none",
                outline: "none",
                boxShadow: "none",
              }}
            />
          </InputGroup>
        </Col>
      </Row>


      {/* Loading & Error Handling */}
      {loading && (
        <div className="text-center">
          <Spinner animation="border" />
          <p>Loading courses...</p>
        </div>
      )}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Recommended Courses */}
      {!loading && !error && (
        <>
          <h3 className="fw-bold" style={{ color: "#000000" }}>Recommended Courses</h3>
          {Object.keys(filteredCourses).length === 0 ? (
            <p className="text-muted">No courses found for "{searchQuery}"</p>
          ) : (
            Object.entries(filteredCourses).map(([category, courses]) => (
              <div key={category} className="mb-4">
                <h4 className="fw-bold mb-3" style={{ color: "#0056b3" }}>{category}</h4>

                <div className="d-flex align-items-center position-relative">
                  {/* Scroll Left Button */}
                  <Button variant="light" className="me-2 px-3 py-2" onClick={() => scrollLeft(category)}>
                    <FaChevronLeft />
                  </Button>

                  {/* Course Cards Wrapper */}
                  <div className="overflow-hidden" style={{ width: `${visibleCount * (cardWidth + gap)}px` }}>
                    <div
                      ref={(el) => (scrollRefs.current[category] = el)}
                      className="d-flex overflow-auto"
                      style={{ gap: `${gap}px`, scrollbarWidth: "none", scrollSnapType: "x mandatory" }}
                    >
                      {courses.map((course, idx) => (
                        <Card key={idx} className="shadow-sm border-0" style={{ minWidth: `${cardWidth}px` }}>
                          <Card.Img
                            variant="top"
                            src={course.thumbnail}
                            alt={course.title}
                            style={{ height: "150px", objectFit: "cover" }}
                          />
                          <Card.Body>
                            <h6 className="fw-bold">{course.title}</h6>
                            <p className="text-muted mb-2">Instructor: {course.created_by}</p>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="w-100"
                              onClick={() => navigate(`/courses/courseShow/${course.id}`)}
                            >
                              <FaChalkboardTeacher /> View Course
                            </Button>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Scroll Right Button */}
                  <Button variant="light" className="ms-2 px-3 py-2" onClick={() => scrollRight(category)}>
                    <FaChevronRight />
                  </Button>
                </div>
              </div>
            ))
          )}
        </>
      )}
    </Container>
  );
};

export default Home;

