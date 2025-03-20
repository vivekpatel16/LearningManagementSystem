import React, { useState, useRef } from "react";
import { Container, Row, Col, Card, Button, ProgressBar, Form, InputGroup } from "react-bootstrap";
import { FaSearch, FaChevronLeft, FaChevronRight, FaChalkboardTeacher } from "react-icons/fa";
import { useNavigate, } from "react-router-dom";

const defaultImage = "https://www.futuretechinfovision.co.uk/wp-content/uploads/2022/06/IT-Courses.jpg";

const enrolledCourse = {
  title: "Web Design for Web Developers: Build Beautiful Websites!",
  lesson: "1. Welcome To This Course",
  timeLeft: "1m left",
  progress: 75,
  image: defaultImage,
};

const recommendedCourses = {
  "Web Development": [
    { title: "Full-Stack Web Development", instructor: "John Doe", image: "" },
    { title: "React JS for Beginners", instructor: "Jane Smith", image: "" },
    { title: "JavaScript Advanced Concepts", instructor: "Mike Lee", image: "" },
    { title: "Node.js & Express for Backend", instructor: "Sophia Davis", image: "" },
    { title: "CSS & SASS Masterclass", instructor: "Emily Wilson", image: "" },
    { title: "Vue.js Essentials", instructor: "Chris Brown", image: "" },
    { title: "Bootstrap & Tailwind CSS", instructor: "Anna Roberts", image: "" },
    { title: "Python for Data Science", instructor: "David Miller", image: "" },
    { title: "Machine Learning A-Z", instructor: "Sarah Johnson", image: "" },
    { title: "Deep Learning with TensorFlow", instructor: "Kevin Brown", image: "" },
    { title: "Data Analysis with Pandas", instructor: "Emma Clark", image: "" },
    { title: "Statistics for Data Science", instructor: "Michael White", image: "" },
    { title: "AI & Neural Networks", instructor: "Jessica Lewis", image: "" },
    { title: "Big Data & Hadoop", instructor: "Daniel Adams", image: "" },
  ],
  "Data Science": [
    { title: "Python for Data Science", instructor: "David Miller", image: "" },
    { title: "Machine Learning A-Z", instructor: "Sarah Johnson", image: "" },
    { title: "Deep Learning with TensorFlow", instructor: "Kevin Brown", image: "" },
    { title: "Data Analysis with Pandas", instructor: "Emma Clark", image: "" },
    { title: "Statistics for Data Science", instructor: "Michael White", image: "" },
    { title: "AI & Neural Networks", instructor: "Jessica Lewis", image: "" },
    { title: "Big Data & Hadoop", instructor: "Daniel Adams", image: "" },
  ],
  "Graphic Design": [
    { title: "Adobe Photoshop Mastery", instructor: "Oliver Green", image: "" },
    { title: "Illustrator Essentials", instructor: "Sophia Thompson", image: "" },
    { title: "UI/UX Design for Beginners", instructor: "Lucas Martin", image: "" },
    { title: "Logo Design Principles", instructor: "Grace Hall", image: "" },
    { title: "Canva for Social Media", instructor: "Henry Brown", image: "" },
    { title: "Typography & Color Theory", instructor: "Liam Scott", image: "" },
    { title: "3D Modeling with Blender", instructor: "Ava Garcia", image: "" },
  ]
};

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRefs = useRef({});
  const cardWidth = 260; // Fixed card width
  const gap = 15; // Space between cards
  const visibleCount = 4; // Number of visible courses
  const navigate = useNavigate();

  const filteredCourses = Object.entries(recommendedCourses).reduce((acc, [category, courses]) => {
    const filtered = courses.filter(course =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleNavigation = () => {
    navigate("/courses/courseshow"); // Navigate to course details page
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

      {/* Enrolled Course Section */}
      <Row className="mb-4">
        <Col md={6}>
          <h3 className="fw-bold" style={{ color: "#000000" }}>Let's Start Learning</h3>
          <Card className="mb-3 shadow-sm border-0">
            <Row className="g-0">
              <Col md={4} onClick={handleNavigation} style={{ cursor: "pointer" }}>
                <img
                  src={enrolledCourse.image}
                  className="img-fluid rounded-start"
                  alt="Course Thumbnail"
                  style={{ height: "120px", objectFit: "cover" }}
                />
              </Col>
              <Col md={8}>
                <Card.Body>
                  <Card.Title
                    className="fw-bold"
                    onClick={handleNavigation}
                    style={{ cursor: "pointer", color: "black" }}
                  >
                    {enrolledCourse.title}
                  </Card.Title>
                  <Card.Text>
                    <strong>{enrolledCourse.lesson}</strong>
                    <br />
                    <span className="text-muted">Lecture • {enrolledCourse.timeLeft}</span>
                  </Card.Text>
                  <ProgressBar now={enrolledCourse.progress} variant="primary" />
                </Card.Body>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Recommended Courses (Filtered) */}
      <h3 className="fw-bold" style={{ color: "#000000" }}>Recommended Courses</h3>
      {Object.keys(filteredCourses).length === 0 ? (
        <p className="text-muted">No courses found for "{searchQuery}"</p>
      ) : (
        Object.entries(filteredCourses).map(([category, courses]) => (
          <div key={category} className="mb-4">
            <h4 className="fw-bold mb-3" style={{ color: "#0056b3" }}>{category}</h4>

            <div className="d-flex align-items-center position-relative">
              {/* Scroll Left Button */}
              <Button
                variant="light"
                className="me-2 px-3 py-2"
                style={{ minWidth: "40px", minHeight: "40px" }}
                onClick={() => scrollLeft(category)}
              >
                <FaChevronLeft />
              </Button>

              {/* Course Cards Wrapper */}
              <div className="overflow-hidden" style={{ width: `${visibleCount * (cardWidth + gap)}px` }}>
                <div
                  ref={(el) => (scrollRefs.current[category] = el)}
                  className="d-flex overflow-auto"
                  style={{
                    gap: `${gap}px`,
                    scrollbarWidth: "none",
                    scrollSnapType: "x mandatory",
                    scrollBehavior: "smooth",
                  }}
                >
                  {courses.map((course, idx) => (
                    <Card key={idx} className="shadow-sm border-0 d-flex flex-column" style={{ minWidth: `${cardWidth}px` }}>
                      <Card.Img
                        variant="top"
                        src={course.image || defaultImage}
                        alt={course.title}
                        style={{ height: "150px", objectFit: "cover" }}
                      />
                      <Card.Body className="d-flex flex-column justify-content-between">
                        <div>
                          <h6 className="fw-bold">{course.title}</h6>
                          <p className="text-muted mb-2">Instructor: {course.instructor}</p>
                        </div>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="w-100 mt-auto"
                          onClick={() => navigate("/courses/courseshow")}
                          style={{
                            borderColor: "#0056b3", // Dark blue border
                            color: "#ffffff", // White text
                            backgroundColor: "#0056b3", // Dark blue background
                            transition: "all 0.3s ease", // Smooth transition effect
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.borderColor = "#003f7f"; // Darker blue border on hover
                            e.target.style.color = "#ffffff"; // Keep text white
                            e.target.style.backgroundColor = "#003f7f"; // Darker blue background
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.borderColor = "#0056b3"; // Restore original border color
                            e.target.style.color = "#ffffff"; // Restore text color
                            e.target.style.backgroundColor = "#0056b3"; // Restore background color
                          }}
                        >
                          <FaChalkboardTeacher /> View Course
                        </Button>

                      </Card.Body>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Scroll Right Button */}
              <Button
                variant="light"
                className="ms-2 px-3 py-2"
                style={{ minWidth: "40px", minHeight: "40px" }}
                onClick={() => scrollRight(category)}
              >
                <FaChevronRight />
              </Button>
            </div>
          </div>
        ))
      )}
    </Container>
  );
};

export default Home;
