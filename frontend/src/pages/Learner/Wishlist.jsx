import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Spinner, Alert } from "react-bootstrap";
import { FaHeart, FaChalkboardTeacher } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Wishlist_API from "../../Api/wishlistApi";
import common_API from "../../Api/commonApi";

const defaultImage = "https://www.futuretechinfovision.co.uk/wp-content/uploads/2022/06/IT-Courses.jpg";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

  const navigate = useNavigate();

  // Fetch wishlist data when component mounts
  useEffect(() => {
    fetchWishlist();
  }, []);

  // Function to fetch user's wishlist
  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      setInfoMessage(null);
      
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user._id) {
        setError("Please log in to view your wishlist");
        setLoading(false);
        return;
      }

      const response = await Wishlist_API.get(`/${user._id}`);
      
      if (response.data && response.data.wishlist) {
        // Process the wishlist data
        let wishlistCourses = [];
        
        if (Array.isArray(response.data.wishlist.course_id)) {
          wishlistCourses = response.data.wishlist.course_id.map(course => ({
            id: course._id,
            title: course.title,
            description: course.description,
            image: course.thumbnail || defaultImage
          }));
          
          // Check if any courses were filtered out due to inactive status
          // We can determine this by checking if the original count is different
          // from the returned count in the header
          if (response.headers['x-total-courses'] && 
              parseInt(response.headers['x-total-courses']) > wishlistCourses.length) {
            setInfoMessage("Some courses in your wishlist are not available because they have been deactivated.");
          }
        } else if (response.data.wishlist.course_id) {
          const course = response.data.wishlist.course_id;
          wishlistCourses = [{
            id: course._id,
            title: course.title,
            description: course.description,
            image: course.thumbnail || defaultImage
          }];
        }
        
        setWishlist(wishlistCourses);
      } else {
        setWishlist([]);
      }
    } catch (err) {
      console.error("Error fetching wishlist:", err);
      setError("Failed to load wishlist. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Function to remove course from wishlist
  const removeFromWishlist = async (courseId) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user._id) {
        setError("Please log in to modify your wishlist");
        return;
      }

      await Wishlist_API.post("/add", {
        user_id: user._id,
        course_id: courseId
      });

      // Update local state by removing the course
      setWishlist((prevWishlist) => prevWishlist.filter((course) => course.id !== courseId));
    } catch (err) {
      console.error("Error removing from wishlist:", err);
      setError("Failed to remove course from wishlist. Please try again.");
    }
  };

  // Function to get valid thumbnail URL
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

  // Function to truncate text to two lines with ellipsis
  const truncateDescription = (description) => {
    if (!description) return "";
    
    // Check if description is likely to exceed two lines (roughly 100 characters)
    const isLongDescription = description.length > 100;
    
    return (
      <div className="course-description" style={{ position: "relative" }}>
        <p 
          style={{ 
            display: "-webkit-box", 
            WebkitLineClamp: "2", 
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: isLongDescription ? "ellipsis" : "clip",
            margin: 0,
            lineHeight: "1.3"
          }}
        >
          {description}
        </p>
        {isLongDescription && (
          <div 
            className="full-description" 
            style={{ 
              position: "absolute", 
              top: "-10px", 
              left: "0", 
              backgroundColor: "white", 
              padding: "10px", 
              borderRadius: "5px", 
              boxShadow: "0 3px 10px rgba(0,0,0,0.2)", 
              zIndex: 100, 
              display: "none",
              width: "100%",
              minWidth: "200px",
              maxWidth: "300px"
            }}
          >
            {description}
          </div>
        )}
      </div>
    );
  };

  return (
    <Container className="mt-4">
      <h2 className="text-center fw-bold mb-4" style={{ color: "#000000" }}>My Wishlist</h2>
      
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading your wishlist...</p>
        </div>
      ) : error ? (
        <Alert variant="danger" className="text-center my-4">{error}</Alert>
      ) : (
        <>
          {infoMessage && (
            <Alert variant="info" className="mb-4">
              {infoMessage}
            </Alert>
          )}
          
          {wishlist.length === 0 ? (
            <div className="text-center my-5">
              <h5 className="text-muted">No courses in your wishlist.</h5>
              <Button 
                variant="primary" 
                className="mt-3"
                onClick={() => navigate("/courses")}
              >
                Browse Courses
              </Button>
            </div>
          ) : (
            <Row className="justify-content-start g-4">
              {wishlist.map((course) => (
                <Col md={4} key={course.id} className="d-flex">
                  <Card className="shadow h-100 w-100">
                    <Card.Img
                      variant="top"
                      src={getValidThumbnail(course.image)}
                      alt={course.title}
                      style={{ height: "180px", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = defaultImage;
                      }}
                    />
                    <Card.Body className="d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <Card.Title className="fs-5 mb-0">{course.title}</Card.Title>
                        <FaHeart
                          className="fs-5 text-danger"
                          style={{ cursor: "pointer" }}
                          onClick={() => removeFromWishlist(course.id)}
                        />
                      </div>
                      <div 
                        className="description-wrapper flex-grow-1" 
                        style={{ marginBottom: "10px" }}
                        onMouseEnter={(e) => {
                          const fullDesc = e.currentTarget.querySelector('.full-description');
                          if (fullDesc) fullDesc.style.display = "block";
                        }}
                        onMouseLeave={(e) => {
                          const fullDesc = e.currentTarget.querySelector('.full-description');
                          if (fullDesc) fullDesc.style.display = "none";
                        }}
                      >
                        {truncateDescription(course.description)}
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-100 mt-auto"
                        onClick={() => navigate(`/courses/courseShow/${course.id}`)}
                      >
                        <FaChalkboardTeacher className="me-1" /> View Course
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </>
      )}
    </Container>
  );
};

export default Wishlist;