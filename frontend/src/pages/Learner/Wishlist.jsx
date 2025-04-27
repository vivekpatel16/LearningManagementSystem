import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge } from "react-bootstrap";
import { FaHeart, FaChalkboardTeacher, FaRegHeart, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Wishlist_API from "../../Api/wishlistApi";
import common_API from "../../Api/commonApi";
import { motion, AnimatePresence } from "framer-motion";

const defaultImage = "https://img.freepik.com/free-vector/hand-drawn-flat-design-stack-books_23-2149334862.jpg";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredWishlist, setFilteredWishlist] = useState([]);

  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  // Fetch wishlist data when component mounts
  useEffect(() => {
    fetchWishlist();
  }, []);

  // Filter wishlist based on search query
  useEffect(() => {
    if (wishlist.length > 0) {
      if (searchQuery.trim() === "") {
        setFilteredWishlist(wishlist);
      } else {
        const filtered = wishlist.filter(course => 
          course.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredWishlist(filtered);
      }
    }
  }, [searchQuery, wishlist]);

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
            image: course.thumbnail || defaultImage,
            instructor: course.created_by?.user_name || "Unknown Instructor"
          }));
          
          // Check if any courses were filtered out due to inactive status
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
            image: course.thumbnail || defaultImage,
            instructor: course.created_by?.user_name || "Unknown Instructor"
          }];
        }
        
        setWishlist(wishlistCourses);
        setFilteredWishlist(wishlistCourses);
      } else {
        setWishlist([]);
        setFilteredWishlist([]);
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
      setFilteredWishlist((prevWishlist) => prevWishlist.filter((course) => course.id !== courseId));
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

  if (loading) {
    return (
      <div>
        {/* Animated Header Banner (No Skeleton) */}
        <div className="py-4 mt-3" style={{ 
          background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)",
          marginBottom: "2rem",
          borderRadius: "0 0 25px 25px"
        }}>
          <Container>
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="d-flex justify-content-between align-items-center"
            >
              <div className="text-white">
                <h2 className="fw-bold mb-1">My Wishlist</h2>
                <p className="mb-0 opacity-75">Save your favorite courses for later</p>
              </div>
              
              {/* Search Bar */}
              <div className="d-none d-md-block">
                <div className="search-bar">
                  <div className="position-relative">
                    <input
                      type="text"
                      placeholder="Search wishlist..."
                      disabled={loading}
                      style={{
                        height: "45px",
                        width: "260px",
                        borderRadius: "50px",
                        border: "none",
                        paddingLeft: "45px",
                        paddingRight: "15px",
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        boxShadow: "0 3px 10px rgba(0,0,0,0.1)"
                      }}
                    />
                    <FaSearch 
                      style={{
                        position: "absolute",
                        left: "15px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#0062E6"
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </Container>
        </div>

        <Container className="pb-5">
          <div className="skeleton-pulse mb-4" style={{ height: "28px", width: "150px", borderRadius: "6px" }}></div>
          
          <Row xs={1} md={2} lg={3} className="g-4">
            {[...Array(6)].map((_, i) => (
              <Col key={i}>
                <Card className="h-100 border-0 shadow-sm skeleton-card" style={{ borderRadius: "12px", overflow: "hidden" }}>
                  <div className="skeleton-pulse" style={{ height: '180px' }}></div>
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="skeleton-pulse mb-2" style={{ height: "20px", width: "70%", borderRadius: "4px" }}></div>
                      <div className="skeleton-pulse" style={{ height: "20px", width: "20px", borderRadius: "50%" }}></div>
                    </div>
                    <div className="skeleton-pulse mb-3" style={{ height: "16px", width: "40%", borderRadius: "4px" }}></div>
                    <div className="skeleton-pulse mb-3" style={{ height: "16px", width: "90%", borderRadius: "4px" }}></div>
                    <div className="skeleton-pulse mb-2" style={{ height: "16px", width: "85%", borderRadius: "4px" }}></div>
                    <div className="mt-auto pt-3">
                      <div className="skeleton-pulse" style={{ height: "38px", width: "100%", borderRadius: "8px" }}></div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>

        {/* Add keyframes for skeleton animation */}
        <style jsx="true">{`
          .skeleton-pulse {
            background: linear-gradient(90deg, #f0f8ff 25%, #e6f2ff 50%, #f0f8ff 75%);
            background-size: 200% 100%;
            animation: pulse 1.5s ease-in-out infinite;
          }
          
          @keyframes pulse {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }
          
          .skeleton-card {
            opacity: 0.9;
            box-shadow: 0 4px 12px rgba(0, 98, 230, 0.05);
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="py-4 mt-3" style={{ 
          background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)",
          marginBottom: "2rem",
          borderRadius: "0 0 25px 25px"
        }}>
          <Container>
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-white fw-bold mb-1">My Wishlist</h2>
              <p className="text-white opacity-75 mb-0">Save your favorite courses for later</p>
            </motion.div>
          </Container>
        </div>

        <Container className="py-5">
          <div className="text-center py-5 my-5">
            <div style={{ 
              background: "rgba(220, 53, 69, 0.1)", 
              borderRadius: "12px", 
              padding: "2rem",
              maxWidth: "600px",
              margin: "0 auto"
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" fill="#dc3545" className="bi bi-exclamation-circle mb-3" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
              </svg>
              <h4 className="mb-3" style={{ color: "#dc3545" }}>Oops! Something went wrong</h4>
              <p className="mb-4">{error}</p>
              {error.includes("log in") && (
                <Button 
                  variant="danger" 
                  onClick={() => navigate('/login')}
                  style={{
                    borderRadius: "8px",
                    padding: "10px 20px",
                    fontWeight: "500"
                  }}
                >
                  Go to Login
                </Button>
              )}
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div>
      {/* Banner Section */}
      <div className="py-4 mt-3" style={{ 
        background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)",
        marginBottom: "2rem",
        borderRadius: "0 0 25px 25px"
      }}>
        <Container>
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="d-flex justify-content-between align-items-center"
          >
            <div className="text-white">
              <h2 className="fw-bold mb-1">My Wishlist</h2>
              <p className="mb-0 opacity-75">Save your favorite courses for later</p>
            </div>
            
            {/* Search Bar */}
            <div className="d-none d-md-block">
              <div className="search-bar">
                <div className="position-relative">
                  <input
                    type="text"
                    placeholder="Search wishlist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      height: "45px",
                      width: "260px",
                      borderRadius: "50px",
                      border: "none",
                      paddingLeft: "45px",
                      paddingRight: "15px",
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      boxShadow: "0 3px 10px rgba(0,0,0,0.1)"
                    }}
                  />
                  <FaSearch 
                    style={{
                      position: "absolute",
                      left: "15px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#0062E6"
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      style={{
                        position: "absolute",
                        right: "15px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "#6c757d",
                        cursor: "pointer",
                        padding: 0
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </Container>
      </div>

      <Container className="pb-5">
        {infoMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <Alert 
              variant="info"
              className="border-0 shadow-sm"
              style={{ borderRadius: "12px" }}
            >
              <div className="d-flex align-items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#0062E6" className="bi bi-info-circle me-2" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                </svg>
                {infoMessage}
              </div>
            </Alert>
          </motion.div>
        )}
          
        {/* Wishlist Content */}
        {filteredWishlist.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-5 my-5"
          >
            <div style={{ maxWidth: "450px", margin: "0 auto" }}>
              <img 
                src="https://img.freepik.com/free-vector/empty-concept-illustration_114360-1188.jpg" 
                alt="Empty wishlist" 
                className="img-fluid mb-4" 
                style={{ maxHeight: "200px" }} 
              />
              <h3 className="mb-3 fw-bold">Your wishlist is empty</h3>
              <p className="text-muted mb-4">
                {searchQuery 
                  ? `No courses found matching "${searchQuery}"`
                  : "Add courses to your wishlist to save them for later."
                }
              </p>
              <Button 
                variant="primary" 
                onClick={() => {
                  if (searchQuery) {
                    setSearchQuery('');
                  } else {
                    navigate("/courses");
                  }
                }}
                style={{
                  background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 24px",
                  boxShadow: "0 4px 6px rgba(0, 98, 230, 0.2)",
                  fontWeight: "500",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "linear-gradient(135deg, #0056CD 0%, #2B8AD9 100%)";
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 10px rgba(0, 86, 179, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 6px rgba(0, 98, 230, 0.2)";
                }}
              >
                {searchQuery ? "Clear Search" : "Browse Courses"}
              </Button>
            </div>
          </motion.div>
        ) : (
          <>
            <motion.h4 
              className="fw-bold mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {searchQuery 
                ? `Search Results (${filteredWishlist.length})` 
                : `Saved Courses (${filteredWishlist.length})`
              }
            </motion.h4>
            
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Row xs={1} md={2} lg={3} className="g-4">
                {filteredWishlist.map((course) => (
                  <motion.div key={course.id} variants={itemVariants}>
                    <Col className="h-100">
                      <Card 
                        className="h-100 border-0 shadow-sm course-card" 
                        style={{ 
                          borderRadius: "12px",
                          overflow: "hidden",
                          transition: "all 0.3s ease"
                        }}
                      >
                        <div className="position-relative">
                          <Card.Img
                            variant="top"
                            src={getValidThumbnail(course.image)}
                            alt={course.title}
                            style={{ 
                              height: '180px', 
                              objectFit: 'cover',
                              objectPosition: 'center'
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = defaultImage;
                            }}
                          />
                        </div>
                        <Card.Body className="d-flex flex-column p-4">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <Card.Title className="fw-bold mb-1" style={{ fontSize: "1.1rem" }}>
                              {course.title}
                            </Card.Title>
                            <button
                              onClick={() => removeFromWishlist(course.id)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#dc3545",
                                padding: 0,
                                cursor: "pointer",
                                fontSize: "1.25rem",
                                marginLeft: "10px",
                                minWidth: "20px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                              title="Remove from wishlist"
                            >
                              <FaHeart />
                            </button>
                          </div>
                          
                          <div className="d-flex align-items-center mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#6c757d" className="bi bi-person me-2" viewBox="0 0 16 16">
                              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664z"/>
                            </svg>
                            <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                              {course.instructor}
                            </span>
                          </div>
                          
                          <div className="description-wrapper flex-grow-1 mb-3">
                            <p className="text-muted" style={{ 
                              fontSize: "0.9rem", 
                              display: "-webkit-box", 
                              WebkitLineClamp: 3, 
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              lineHeight: "1.5"
                            }}>
                              {course.description || "No description available for this course."}
                            </p>
                          </div>
                          
                          <Button
                            variant="primary"
                            onClick={() => navigate(`/courses/courseShow/${course.id}`)}
                            className="w-100 mt-auto"
                            style={{
                              background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)",
                              border: "none",
                              borderRadius: "8px",
                              padding: "8px 0",
                              fontWeight: "500",
                              transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = "linear-gradient(135deg, #0056CD 0%, #2B8AD9 100%)";
                              e.target.style.transform = "translateY(-2px)";
                              e.target.style.boxShadow = "0 4px 8px rgba(0, 86, 179, 0.3)";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)";
                              e.target.style.transform = "translateY(0)";
                              e.target.style.boxShadow = "none";
                            }}
                          >
                            <FaChalkboardTeacher className="me-2" /> View Course
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  </motion.div>
                ))}
              </Row>
            </motion.div>
          </>
        )}
      </Container>

      <style jsx="true">{`
        .course-card {
          transition: all 0.3s ease;
        }
        
        .course-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 98, 230, 0.1) !important;
        }
        
        /* Custom progress bar colors */
        .progress-bar.bg-primary {
          background: linear-gradient(135deg, #0062E6 0%, #33A1FD 100%) !important;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .card-title {
            font-size: 1rem !important;
          }
          
          .course-card:hover {
            transform: translateY(-3px);
          }
        }
      `}</style>
    </div>
  );
};

export default Wishlist;