import React, { useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { FaHeart, FaChalkboardTeacher } from "react-icons/fa";
import { useNavigate, } from "react-router-dom";


const initialWishlist = [
  {
    id: 1,
    title: "React for Beginners",
    description: "Learn the basics of React.js and build interactive UIs.",
    image: "https://www.wikitechy.com/videos/wp-content/uploads/2023/04/ReactJS-Full-Course.jpg",
  },
  {
    id: 2,
    title: "Full-Stack Web Development",
    description: "Master front-end and back-end development with MERN stack.",
    image: "https://www.spec-india.com/wp-content/uploads/2020/06/Full_Stack.png",
  },
  {
    id: 3,
    title: "Advanced JavaScript",
    description: "Deep dive into ES6+, closures, and modern JavaScript concepts.",
    image: "https://i.morioh.com/2023/06/24/d848d190.webp",
  },
];

const Wishlist = () => {
  const [wishlist, setWishlist] = useState(initialWishlist);

  const navigate = useNavigate();

  const toggleWishlist = (id) => {
    setWishlist((prevWishlist) => prevWishlist.filter((course) => course.id !== id));
  };

  return (
    <Container className="mt-2 m-1">
      <h2 className="text-center fw-bold " style={{ color: "#000000" }}>My Wishlist</h2>
      <Row className="justify-content-center m-5 mt-4">
        {wishlist.length === 0 ? (
          <Col className="text-center">
            <h5 className="text-muted">No courses in your wishlist.</h5>
          </Col>
        ) : (
          wishlist.map((course) => (
            <Col md={4} key={course.id} className="d-flex justify-content-center">
              <Card className="shadow h-100" style={{ width: "340px" }}>
                <Card.Img
                  variant="top"
                  src={course.image}
                  alt={course.title}
                  style={{ width: "100%", height: "180px", objectFit: "cover" }}
                />
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center">
                    <Card.Title className="fs-6">{course.title}</Card.Title>
                    <FaHeart
                      className="fs-5 text-danger"
                      style={{ cursor: "pointer" }}
                      onClick={() => toggleWishlist(course.id)}
                    />
                  </div>
                  <Card.Text className="text-muted flex-grow-1" style={{ fontSize: "14px" }}>
                    {course.description}
                  </Card.Text>
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
            </Col>
          ))
        )}
      </Row>
    </Container>
  );
};

export default Wishlist;
