import React from "react";
import { Container, Row, Col, Card, Button, ProgressBar } from "react-bootstrap";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { FaPlayCircle } from "react-icons/fa";


const courses = [
  {
    id: 1,
    title: "React for Beginners",
    instructor: "John Doe",
    lessons: 24,
    progress: 60,
    image: "https://a.storyblok.com/f/172362/1920x1080/a5e68043d9/react-logo-with-react-for-beginners-text.jpg",
  },
  {
    id: 2,
    title: "Mastering JavaScript",
    instructor: "Jane Smith",
    lessons: 30,
    progress: 80,
    image: "https://i.pinimg.com/originals/6c/1e/b8/6c1eb80bed8a03e90 learning90a04333f1ca68c.jpg",
  },
];

const MyLearning = () => {
  const navigate = useNavigate(); // Initialize navigation function

  const handleContinueLearning = () => {
    navigate("/courses/courseshow"); // Navigate to /courses/courseshow
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4 text-center fw-bold" style={{ color: "#000000" }}>My Learning</h2>
      <Row>
        {courses.map((course) => (
          <Col md={6} lg={4} key={course.id}>
            <Card className="mb-4 shadow">
              <Card.Img
                variant="top"
                src={course.image}
                alt={course.title}
                style={{ height: "180px", objectFit: "cover" }}
              />
              <Card.Body>
                <Card.Title>{course.title}</Card.Title>
                <Card.Text>
                  Instructor: <strong>{course.instructor}</strong>
                  <br />
                  Lessons: {course.lessons}
                </Card.Text>
                <ProgressBar now={course.progress} label={`${course.progress}%`} className="mb-2" />
                <Button
                  variant="success"
                  className="w-100 d-flex justify-content-center align-items-center gap-2"
                  onClick={handleContinueLearning}
                >
                  <FaPlayCircle /> Continue Learning
                </Button>

              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default MyLearning;
