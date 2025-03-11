import React, { useState } from "react";
import { Container, Row, Col, Card, Button, ProgressBar } from "react-bootstrap";
import { FaRegHeart, FaHeart } from "react-icons/fa";

// Course images
const courseImages = [
  "https://www.achieversit.com/uploads/course_image/web-dev-img.jpeg",
  "https://www.cdmi.in/courses@2x/data-science.webp",
  "https://pmstudycircle.com/wp-content/uploads/2023/02/cybersecurity-courses.png.webp",
];

// Recommended courses
const recommendedCourses = [
  {
    id: 1,
    title: "Full-Stack Web Development Bootcamp",
    instructor: "Dr. Angela Yu",
    image: courseImages[0],
    mostViewed: true,
    description: "Master front-end and back-end development with HTML, CSS, JavaScript, React, Node.js, and databases.",
  },
  {
    id: 2,
    title: "Data Science & Machine Learning",
    instructor: "Andrew Ng",
    image: courseImages[1],
    mostViewed: true,
    description: "Learn Python, data visualization, statistics, and machine learning to become a data scientist.",
  },
  {
    id: 3,
    title: "Cybersecurity for Beginners",
    instructor: "Kevin Mitnick",
    image: courseImages[2],
    mostViewed: true,
    description: "Understand network security, ethical hacking, penetration testing, and cybersecurity best practices.",
  },
];

// Dummy enrolled course (for "Continue Learning")
const enrolledCourse = {
  title: "Web Design for Web Developers: Build Beautiful Websites!",
  lesson: "1. Welcome To This Course",
  timeLeft: "1m left",
  progress: 75, // Progress in percentage
  image: "https://i.pinimg.com/originals/6c/1e/b8/6c1eb80bed8a03e9090a04333f1ca68c.jpg",
};

const Home = () => {
  const [wishlist, setWishlist] = useState({});

  // Toggle Wishlist Heart Icon
  const toggleWishlist = (id) => {
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Container className="mt-4">
      <Row>
        {/* Left Side: Continue Learning Section */}
        <Col md={6}>
          <h3 className="fw-bold">Let's Start Learning</h3>
          <Card className="mb-3 shadow-sm">
            <Row className="g-0">
              <Col md={4}>
                <img src={enrolledCourse.image} className="img-fluid rounded-start" alt="Course Thumbnail" />
              </Col>
              <Col md={8}>
                <Card.Body>
                  <Card.Title className="fw-bold">{enrolledCourse.title}</Card.Title>
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

      {/* Recommended for You Section */}
      <h3 className="fw-bold mt-4">Recommended for You</h3>
      <Row>
        {recommendedCourses.map((course) => (
          <Col md={4} key={course.id} className="mb-4">
            <Card className="shadow-sm border-0 rounded overflow-hidden position-relative">
              {/* Course Image */}
              <Card.Img variant="top" src={course.image} className="img-fluid" alt="Course Thumbnail" />

              {/* Wishlist Button */}
              <Button
                variant="link"
                className="position-absolute top-0 end-0 m-2 p-2 border-0 text-white"
                onClick={() => toggleWishlist(course.id)}
                style={{ fontSize: "1.5rem", background: "rgba(0,0,0,0.5)", borderRadius: "50%" }}
              >
                {wishlist[course.id] ? <FaHeart color="red" /> : <FaRegHeart />}
              </Button>

              <Card.Body>
                <Card.Title className="fs-6 fw-bold">{course.title}</Card.Title>
                <Card.Text className="text-muted">{course.instructor}</Card.Text>

                {/* Most Viewed Badge */}
                {course.mostViewed && <span className="badge bg-primary">Most Viewed</span>}

                {/* Description on Side */}
                <div className="d-none d-md-block mt-2">
                  <p className="small text-muted">{course.description}</p>
                </div>

                {/* Enroll Button */}
                <Button variant="primary" className="w-100 mt-2">
                  Enroll Now
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Home;
