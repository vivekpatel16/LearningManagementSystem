import React, { useState } from "react";
import { Container, Row, Col, Card, Button, InputGroup, Form, Accordion } from "react-bootstrap";
import { FaSearch, FaFilter, FaTimes, FaStar, FaHeart, FaRegHeart, FaSyncAlt, FaChalkboardTeacher } from "react-icons/fa";
import { useNavigate, } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const defaultImage = "https://www.futuretechinfovision.co.uk/wp-content/uploads/2022/06/IT-Courses.jpg";

// Sample Course Data
const courses = [
  { _id: 1, title: "React Basics", description: "Learn React from scratch", Category: "Frontend", duration: 2.5, rating: 5, instructor: "John Doe", price: "$49", language: "English" },
  { _id: 2, title: "Node.js API", description: "Backend with Node.js", Category: "Backend", duration: 5, rating: 4, instructor: "Jane Smith", price: "$59", language: "English" },
  { _id: 3, title: "Full Stack Development", description: "Master MERN stack", Category: "Full Stack", duration: 8, rating: 3, instructor: "Michael Lee", price: "$99", language: "English" },
  { _id: 4, title: "Advanced React", description: "Dive into Hooks & Context API", Category: "Frontend", duration: 6, rating: 4, instructor: "Emily Davis", price: "$69", language: "English" },
  { _id: 5, title: "Python for Beginners", description: "Learn Python fundamentals", Category: "Backend", duration: 1.5, rating: 5, instructor: "Robert Brown", price: "$39", language: "English" },
  { _id: 6, title: "Django with Python", description: "Build powerful web apps", Category: "Backend", duration: 7, rating: 4, instructor: "Sophia Wilson", price: "$79", language: "English" },
  { _id: 7, title: "Vue.js Essentials", description: "Start with Vue.js", Category: "Frontend", duration: 3, rating: 3, instructor: "David Martinez", price: "$45", language: "English" },
  { _id: 8, title: "Express.js & MongoDB", description: "Backend with Express", Category: "Backend", duration: 4.5, rating: 5, instructor: "Emma Thompson", price: "$55", language: "English" },
  { _id: 9, title: "CSS Animations", description: "Create stunning animations", Category: "Frontend", duration: 2, rating: 4, instructor: "William Johnson", price: "$35", language: "English" },
  { _id: 10, title: "JavaScript Mastery", description: "Deep dive into JS", Category: "Frontend", duration: 5.5, rating: 5, instructor: "Olivia Harris", price: "$59", language: "English" },
  { _id: 11, title: "Machine Learning", description: "Learn ML concepts and algorithms", Category: "AI & ML", duration: 10, rating: 5, instructor: "Ethan Carter", price: "$120", language: "English" },
  { _id: 12, title: "Data Structures & Algorithms", description: "Master DSA for coding interviews", Category: "Programming", duration: 6, rating: 4, instructor: "Ava Scott", price: "$89", language: "English" },
  { _id: 13, title: "Cyber Security Fundamentals", description: "Introduction to Cyber Security", Category: "Security", duration: 4, rating: 4, instructor: "Liam Adams", price: "$75", language: "English" },
  { _id: 14, title: "Blockchain Development", description: "Learn Blockchain from scratch", Category: "Blockchain", duration: 9, rating: 5, instructor: "Noah Carter", price: "$110", language: "English" },
  { _id: 15, title: "Cloud Computing", description: "AWS, Azure, and Google Cloud", Category: "Cloud", duration: 7, rating: 4, instructor: "Mia Wright", price: "$95", language: "English" },
];

// Filter options
const subcategories = ["Frontend", "Backend", "Full Stack"];
const durations = [
  { label: "Short (1-3 hrs)", min: 1, max: 3 },
  { label: "Medium (3-6 hrs)", min: 3, max: 6 },
  { label: "Long (6+ hrs)", min: 6, max: Infinity },
];
const ratings = [1, 2, 3, 4, 5];

// Star Rating Display
const renderStars = (rating) => (
  <span>
    {[...Array(5)].map((_, i) => (
      <FaStar key={i} color={i < rating ? "#ffc107" : "#e4e5e9"} />
    ))}
  </span>
);

const Courses = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedDurations, setSelectedDurations] = useState([]);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [likedCourses, setLikedCourses] = useState({});


  const navigate = useNavigate();
  const toggleLike = (courseId) => {
    setLikedCourses((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  const toggleSelection = (value, setter, selectedList) => {
    setter(selectedList.includes(value) ? selectedList.filter((item) => item !== value) : [...selectedList, value]);
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = searchQuery
      ? course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesCategory = selectedCategories.length
      ? selectedCategories.includes(course.Category)
      : true;

    let matchesDuration = selectedDurations.length ? false : true;
    if (selectedDurations.length) {
      selectedDurations.forEach((durationLabel) => {
        const durationRange = durations.find((d) => d.label === durationLabel);
        if (durationRange && course.duration >= durationRange.min && course.duration <= durationRange.max) {
          matchesDuration = true;
        }
      });
    }

    const matchesRating = selectedRatings.length ? selectedRatings.includes(course.rating) : true;

    return matchesSearch && matchesCategory && matchesDuration && matchesRating;
  });

  return (
    <Container className="mt-4">
      <h2 className="text-center fw-bold mb-4" style={{ color: "#000000" }}>All Courses</h2>

      <Row className="mb-4 align-items-center">
        <Col md={showFilters ? 6 : 10}>
          <InputGroup
            style={{
              width: "100%",
              height: "50px",
              borderRadius: "50px",
              overflow: "hidden",
              border: "2px solid #ccc",  // Default border color
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
                boxShadow: "none",  // Removes unwanted Bootstrap outline
              }}
            />
          </InputGroup>
        </Col>


        {!showFilters && (
          <Col md={2} className="d-flex justify-content-end">
            <Button
              variant="success"
              className="w-100"
              onClick={() => setShowFilters(true)}
              style={{
                borderColor: '#198754',
                color: '#198754',
                backgroundColor: 'white',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#198754'; // Keep primary border color
                e.target.style.color = 'white'; // Change text color to white
                e.target.style.backgroundColor = '#198754'; // Change background to primary color
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#198754'; // Keep primary border color
                e.target.style.color = '#198754'; // Change text color back to primary
                e.target.style.backgroundColor = 'white'; // Change background back to white
              }}
            >
              <FaFilter /> Filters
            </Button>

          </Col>
        )}
      </Row>

      <Row>
        <motion.div initial={{ width: "100%" }} animate={{ width: showFilters ? "75%" : "100%" }} transition={{ duration: 0.3 }}>
          <Row>
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <Col key={course._id} md={4} className="mb-4">
                  <Card>
                    <Card.Img
                      variant="top"
                      src={defaultImage}
                      alt={course.title}
                      style={{ height: "200px", objectFit: "cover" }}
                    />
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <Card.Title>{course.title}</Card.Title>
                        <Button variant="link" className="p-0" onClick={() => toggleLike(course._id)}>
                          {likedCourses[course._id] ? <FaHeart color="red" /> : <FaRegHeart color="gray" />}
                        </Button>
                      </div>
                      <Card.Text>{course.description}</Card.Text>
                      <p><strong>Category:</strong> {course.Category}</p>
                      <p><strong>Duration:</strong> {course.duration} Hours</p>
                      <p><strong>Rating:</strong> {renderStars(course.rating)}</p>
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
            ) : (
              <Col className="text-center">
                <h5>No courses match your filters.</h5>
              </Col>
            )}
          </Row>
        </motion.div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ x: 200, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 200, opacity: 0 }} transition={{ duration: 0.3 }}
              style={{
                position: "absolute",
                right: "15px",
                top: "100px",
                background: "#fff",
                padding: "15px",
                borderRadius: "8px",
                boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                zIndex: 10,
                width: "250px"
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5>Filters</h5>
                <Button variant="link" className="p-0 text-danger" onClick={() => setShowFilters(false)}>
                  <FaTimes size={20} />
                </Button>
              </div>
              <Accordion alwaysOpen>
                <Accordion.Item eventKey="0">
                  <Accordion.Header>Category</Accordion.Header>
                  <Accordion.Body>
                    {subcategories.map((cat) => (
                      <Form.Check key={cat} type="checkbox" label={cat} value={cat}
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleSelection(cat, setSelectedCategories, selectedCategories)}
                      />
                    ))}
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="1">
                  <Accordion.Header>Video Duration</Accordion.Header>
                  <Accordion.Body>
                    {durations.map((dur) => (
                      <Form.Check key={dur.label} type="checkbox" label={dur.label} value={dur.label}
                        checked={selectedDurations.includes(dur.label)}
                        onChange={() => toggleSelection(dur.label, setSelectedDurations, selectedDurations)}
                      />
                    ))}
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="2">
                  <Accordion.Header>Ratings</Accordion.Header>
                  <Accordion.Body>
                    {ratings.map((rate) => (
                      <Form.Check key={rate} type="checkbox" label={renderStars(rate)} value={rate}
                        checked={selectedRatings.includes(rate)}
                        onChange={() => toggleSelection(rate, setSelectedRatings, selectedRatings)}
                      />
                    ))}
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
              <Button
                variant="secondary"
                className="mt-3 w-100"
                onClick={() => {
                  setSelectedCategories([]);
                  setSelectedDurations([]);
                  setSelectedRatings([]);
                }}
                style={{
                  borderColor: "#6c757d", // Secondary border color (gray)
                  color: "#6c757d", // Secondary text color (gray)
                  backgroundColor: "white", // White background
                  transition: "all 0.3s ease", // Smooth transition effect
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = "#6c757d"; // Keep border color on hover
                  e.target.style.color = "white"; // Change text color to white
                  e.target.style.backgroundColor = "#6c757d"; // Change background to secondary color
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = "#6c757d"; // Keep border color on mouse leave
                  e.target.style.color = "#6c757d"; // Change text color back to secondary color
                  e.target.style.backgroundColor = "white"; // Change background back to white
                }}
              >
                <FaSyncAlt /> Reset Filters
              </Button>


            </motion.div>
          )}
        </AnimatePresence>
      </Row>
    </Container>
  );
};

export default Courses;
