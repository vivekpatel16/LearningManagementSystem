import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Card, Button, Form, InputGroup, Spinner, Alert, Badge, ProgressBar } from "react-bootstrap";
import { FaSearch, FaChevronLeft, FaChevronRight, FaChalkboardTeacher, FaStar, FaGraduationCap, FaBookOpen, FaClock, FaLaptop } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axiosInstance from '../../Api/axiosInstance';
import { motion } from "framer-motion";
import axios from "axios";

const defaultImage = "https://www.futuretechinfovision.co.uk/wp-content/uploads/2022/06/IT-Courses.jpg";
// CTA banner image preloading
const ctaImage = "https://img.freepik.com/free-vector/online-tutorials-concept_52683-37480.jpg";

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [lastCourse, setLastCourse] = useState(null);
  const [lastCourseProgress, setLastCourseProgress] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [filteredResults, setFilteredResults] = useState(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const scrollRefs = useRef({});
  const cardWidth = 280;
  const gap = 20;
  const visibleCount = 4;
  const navigate = useNavigate();

  // Add a ref to track API call status
  const fetchedRef = useRef(false);

  // Fetch Categories & Courses from API
  useEffect(() => {
    const fetchData = async () => {
      // Prevent duplicate API calls
      if (fetchedRef.current) return;
      
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        if (!token) {
          console.warn("No auth token found, user might be logged out");
          setLoading(false);
          return;
        }
        
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch categories
        const categoryResponse = await axiosInstance.get("/courses/category", { headers });
        // const categoryResponse = await axios .get("/courses/category", { headers });
        console.log("Fetched Categories:", categoryResponse.data);
        setCategories(categoryResponse.data);

        // Fetch courses
        const courseResponse = await axiosInstance.get("/users/courses", { headers });
        console.log("Fetched Courses:", courseResponse.data);

        // Store courses with additional data
        const filteredCourses = courseResponse.data.data.map(course => ({
          id: course._id,
          title: course.title,
          category_id: course.category_id,
          thumbnail: course.thumbnail || defaultImage,
          created_by: course.created_by?.user_name || "Unknown",
          rating: (Math.random() * 2 + 3).toFixed(1), // Random rating between 3-5
          students: Math.floor(Math.random() * 1000) + 50, // Random student count
          lessons: Math.floor(Math.random() * 20) + 5, // Random lesson count
        }));

        setCourses(filteredCourses);

        // Fetch user's course progress data to find the last continued course
        try {
          const progressResponse = await axiosInstance.get("/courses/enrolled", { headers });
          console.log("User progress data:", progressResponse.data);
          
          if (progressResponse.data && progressResponse.data.success && progressResponse.data.data) {
            // Find the course with the latest activity
            const enrolledCourses = progressResponse.data.data;
            if (enrolledCourses.length > 0) {
              // Sort by last activity or progress (assuming we have a lastAccessed field)
              // If no lastAccessed field, just take the first course with progress
              
              // Find a course that has progress but is not complete (< 100%)
              let inProgressCourse = null;
              let courseProgress = 0;
              
              for (const enrolledCourse of enrolledCourses) {
                if (enrolledCourse.progress > 0 && enrolledCourse.progress < 100) {
                  // Find the full course details from our courses list
                  const matchingCourse = filteredCourses.find(c => c.id === enrolledCourse._id);
                  if (matchingCourse) {
                    inProgressCourse = matchingCourse;
                    courseProgress = enrolledCourse.progress;
                    break; // Found an in-progress course, stop searching
                  }
                }
              }
              
              if (inProgressCourse) {
                setLastCourse(inProgressCourse);
                setLastCourseProgress(courseProgress);
              } else {
                // No in-progress courses (all completed or none started)
                setLastCourse(null);
                setLastCourseProgress(0);
              }
            }
          }
        } catch (progressError) {
          console.error("Error fetching user progress:", progressError);
          // Don't set an error, just continue without last course data
        }

        // Mark as fetched to prevent duplicate calls
        fetchedRef.current = true;

      } catch (err) {
        setError("Failed to load courses. Please try again.");
        console.error("API Fetch Error:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group courses by category
  const groupedCourses = categories.reduce((acc, category) => {
    const filteredCourses = courses.filter(course => course.category_id === category._id);

    if (filteredCourses.length > 0) {
      acc[category.category_name] = filteredCourses;
    }
    return acc;
  }, {});

  // Filter out "All Courses" since there's a dedicated page for that
  const allCoursesGrouped = { ...groupedCourses };

  // Filter courses by search query and active category
  const filteredCourses = Object.entries(allCoursesGrouped).reduce((acc, [category, courses]) => {
    // Filter by search query
    const filtered = courses.filter(course =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter by active category
    if (activeCategory === "all" || activeCategory === category.toLowerCase()) {
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    }
    
    return acc;
  }, {});

  // Handle search input change
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Show normal content if search is empty
    if (!value.trim()) {
      // Immediately clear search results, search focus, and return to normal view
      console.log("Search cleared, returning to normal view");
      // Force reset all search-related states
      setFilteredResults(null);
      setIsSearchFocused(false);
      setIsSearching(false);
      return; // Exit early to avoid the search when empty
    } else {
      setIsSearchFocused(true);
      
      // Live search functionality - filter courses as user types
      performLiveSearch(value);
    }
  };
  
  // Function to perform live search
  const performLiveSearch = (query) => {
    if (!query.trim()) {
      // Clear search and show main content
      setFilteredResults(null);
      setIsSearchFocused(false);
      return;
    }
    
    // Set temporary loading state for better UX
    setIsSearching(true);
    
    // Filter courses based on search query
    const results = Object.entries(allCoursesGrouped).reduce((acc, [category, courses]) => {
      // Filter by search query (case insensitive partial match)
      const filtered = courses.filter(course =>
        course.title.toLowerCase().includes(query.toLowerCase())
      );
  
      // Filter by active category
      if (activeCategory === "all" || activeCategory === category.toLowerCase()) {
        if (filtered.length > 0) {
          acc[category] = filtered;
        }
      }
      
      return acc;
    }, {});
    
    // Short delay to prevent UI flicker with fast typing
    setTimeout(() => {
      setFilteredResults(results);
      setIsSearching(false);
    }, 300);
  };

  // Handle search with Enter key
  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchQuery.trim()) {
        performLiveSearch(searchQuery);
      }
    } else if (e.key === 'Escape') {
      // Clear search when Escape key is pressed
      setSearchQuery('');
      setFilteredResults(null);
      setIsSearchFocused(false);
      e.target.blur(); // Remove focus from search input
    }
  };

  // Handle search focus/blur
  const handleSearchFocus = () => {
    // Only set search focused if there's actually content in the search box
    if (searchQuery.trim()) {
      setIsSearchFocused(true);
    }
  };

  const handleSearchBlur = () => {
    // If search is empty on blur, reset to normal view
    if (!searchQuery.trim()) {
      setIsSearchFocused(false);
      setFilteredResults(null);
    }
  };

  const scrollLeft = (category) => {
    if (scrollRefs.current[category]) {
      scrollRefs.current[category].scrollBy({ left: -(cardWidth + gap) * 2, behavior: "smooth" });
    }
  };

  const scrollRight = (category) => {
    if (scrollRefs.current[category]) {
      scrollRefs.current[category].scrollBy({ left: (cardWidth + gap) * 2, behavior: "smooth" });
    }
  };

  // Set up animation variants for motion components
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
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="hero-section" style={{
        background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)",
        padding: "60px 0 80px",
        color: "white",
        marginBottom: "30px",
        borderRadius: "0 0 25px 25px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
      }}>
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-4 mb-lg-0">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="display-4 fw-bold mb-4">Expand Your Skills, <br/>Achieve Your Goals</h1>
                <p className="lead mb-4">Discover top-rated courses in programming, business, design, and more. Start your learning journey today!</p>
                
                <InputGroup 
                  className="mb-3 hero-search"
                  style={{
                    maxWidth: "500px",
                    height: "55px",
                    borderRadius: "50px",
                    overflow: "hidden",
                    backgroundColor: "white",
                    boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
                  }}
                >
                  <InputGroup.Text style={{ background: "white", border: "none", paddingLeft: "20px" }}>
                    <FaSearch color="#0062E6" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search for any skill or course... "
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onKeyDown={handleSearch}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    style={{
                      height: "55px",
                      border: "none",
                      outline: "none",
                      boxShadow: "none",
                      fontSize: "1.1rem",
                      paddingRight: "20px"
                    }}
                  />
                </InputGroup>
              </motion.div>
            </Col>
            <Col lg={6}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="text-center text-lg-end"
              >
                <img 
                  src="https://img.freepik.com/free-vector/online-learning-isometric-concept_1284-17947.jpg" 
                  alt="Learning Illustration" 
                  className="img-fluid rounded-3"
                  style={{ maxHeight: "350px", boxShadow: "0 15px 30px rgba(0,0,0,0.15)" }}
                />
              </motion.div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container>
        {/* Continue Learning Section - Shows only if there's a course in progress */}
        {(() => {
          const shouldShowContinueLearning = !loading && !error && lastCourse && 
                                  lastCourseProgress > 0 && lastCourseProgress < 100 &&
                                  (!filteredResults || !isSearchFocused) && 
                                  !isSearching;
          console.log('Should show Continue Learning:', shouldShowContinueLearning, {
            loading, error, lastCourse, lastCourseProgress, filteredResults, isSearchFocused, isSearching
          });
          return shouldShowContinueLearning && (
            <motion.div 
              className="continue-learning-section mb-5 mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="fw-bold mb-4">Continue Learning</h3>
              <Row>
                <Col md={12} lg={8} xl={6}>
                  <Card 
                    className="border-0 course-card overflow-hidden" 
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/courses/courseShow/${lastCourse.id}`)}
                  >
                    <div className="d-flex flex-column flex-md-row">
                      <div style={{ 
                        minWidth: "200px", 
                        maxWidth: "200px",
                        minHeight: "150px", 
                        maxHeight: "150px",
                        overflow: "hidden"
                      }}>
                        <Card.Img 
                          src={lastCourse.thumbnail} 
                          alt={lastCourse.title}
                          style={{ 
                            width: "100%",
                            height: "100%", 
                            objectFit: "cover" 
                          }}
                        />
                      </div>
                      <Card.Body className="p-4">
                        <div className="d-flex align-items-center mb-2">
                          <Badge 
                            bg="primary" 
                            className="me-2"
                            style={{ fontWeight: "normal", fontSize: "0.75rem" }}
                          >
                            IN PROGRESS
                          </Badge>
                          <span className="text-muted small">
                            Last accessed: {new Date().toLocaleDateString()}
                          </span>
                        </div>
                        <Card.Title className="mb-2 h5">{lastCourse.title}</Card.Title>
                        <p className="text-muted small mb-3">Instructor: {lastCourse.created_by}</p>
                        <div style={{ fontSize: "0.85rem" }}>
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted">Your progress</span>
                            <span className="fw-bold">{lastCourseProgress}%</span>
                          </div>
                          <div className="progress mb-3" style={{ height: "8px" }}>
                            <div 
                              className="progress-bar" 
                              role="progressbar"
                              style={{ width: `${lastCourseProgress}%` }}
                              aria-valuenow={lastCourseProgress}
                              aria-valuemin="0" 
                              aria-valuemax="100"
                            ></div>
                          </div>
                        </div>
                        <Button 
                          variant="primary" 
                          className="w-100 mt-1"
                        >
                          Continue Learning
                        </Button>
                      </Card.Body>
                    </div>
                  </Card>
                </Col>
              </Row>
            </motion.div>
          );
        })()}

        {/* Categories Navigation */}
        <motion.div 
          className="categories-nav mb-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Only show "Browse Categories" heading when not loading or searching */}
          {(() => {
            const shouldShowCategories = !loading && (!filteredResults || !isSearchFocused) && !isSearching;
            console.log('Should show Categories:', shouldShowCategories, {
              loading, filteredResults, isSearchFocused, isSearching
            });
            return shouldShowCategories && <h5 className="fw-bold mb-3">Browse Categories</h5>;
          })()}
          <div className="d-flex flex-wrap gap-2">
            {/* Only show category buttons when not loading or searching */}
            {(() => {
              const shouldShowCategoryButtons = !loading && (!filteredResults || !isSearchFocused) && !isSearching;
              return shouldShowCategoryButtons && (
                <>
                  <Button
                    variant={activeCategory === "all" ? "primary" : "outline-primary"}
                    className="rounded-pill px-4 py-2"
                    onClick={() => setActiveCategory("all")}
                  >
                    All Courses
                  </Button>
                  
                  {categories.map((category, index) => (
                    <Button
                      key={index}
                      variant={activeCategory === category.category_name.toLowerCase() ? "primary" : "outline-primary"}
                      className="rounded-pill px-4 py-2"
                      onClick={() => setActiveCategory(category.category_name.toLowerCase())}
                    >
                      {category.category_name}
                    </Button>
                  ))}
                </>
              );
            })()}
          </div>
        </motion.div>

      {/* Loading & Error Handling */}
      {(loading || isSearching) && (
        <div className="py-4">
          {/* SECTION: Continue Learning Skeleton (only shown during initial loading if there's a course in progress) */}
          {loading && !searchQuery.trim() && (
          <>
          <div 
            style={{ 
              height: "28px", 
              width: "180px", 
              background: "#f0f0f0",
              borderRadius: "4px",
              marginBottom: "20px"
            }} 
          />
          
          <div style={{ marginBottom: "40px" }}>
            <div 
              style={{ 
                height: "180px",
                maxWidth: "700px",
                borderRadius: "15px",
                background: "white",
                boxShadow: "0 5px 15px rgba(0,0,0,0.04)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "row"
              }}
            >
              <div 
                style={{ 
                  width: "200px", 
                  minWidth: "200px",
                  height: "180px", 
                  background: "#f0f0f0"
                }} 
              />
              <div style={{ padding: "20px", flexGrow: 1 }}>
                <div 
                  style={{ 
                    height: "20px", 
                    width: "80px", 
                    background: "#f0f0f0",
                    borderRadius: "20px",
                    marginBottom: "15px"
                  }} 
                />
                <div 
                  style={{ 
                    height: "28px", 
                    width: "70%", 
                    background: "#f0f0f0",
                    borderRadius: "4px",
                    marginBottom: "10px"
                  }} 
                />
                <div 
                  style={{ 
                    height: "16px", 
                    width: "45%", 
                    background: "#f0f0f0",
                    borderRadius: "4px",
                    marginBottom: "15px"
                  }} 
                />
                <div 
                  style={{ 
                    height: "8px", 
                    width: "100%", 
                    background: "#f0f0f0",
                    borderRadius: "4px",
                    marginBottom: "20px"
                  }} 
                />
                <div 
                  style={{ 
                    height: "38px", 
                    width: "100%", 
                    background: "#f0f0f0",
                    borderRadius: "4px"
                  }} 
                />
              </div>
            </div>
          </div>
          </>
          )}
          
          {/* SECTION: Browse Categories Skeleton (only shown during initial loading) */}
          {loading && (
          <>
          {/* Adding back the skeleton placeholder for the Browse Categories heading */}
          <div 
            style={{ 
              height: "28px", 
              width: "160px", 
              background: "#f0f0f0",
              borderRadius: "4px",
              marginBottom: "15px"
            }} 
          />
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "40px" }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div 
                key={i}
                style={{ 
                  height: "38px", 
                  width: i === 1 ? "120px" : `${80 + Math.random() * 40}px`, 
                  background: "#f0f0f0",
                  borderRadius: "50px"
                }} 
              />
            ))}
          </div>
          </>
          )}
          
          {/* Display search skeleton loader */}
          {searchQuery.trim() && isSearching && (
            <div className="my-5">
              <div 
                className="mb-4 mx-auto"
                style={{ 
                  height: "32px", 
                  width: "60%", 
                  maxWidth: "400px",
                  background: "#f0f0f0",
                  borderRadius: "4px",
                  backgroundSize: "200% 100%",
                  margin: "0 auto"
                }} 
              />

              {/* Search Results Skeleton */}
              <div className="d-flex gap-3 mb-5 overflow-hidden justify-content-center flex-wrap">
                {[1, 2, 3, 4].map(i => (
                  <div 
                    key={i}
                    style={{ 
                      width: "280px",
                      height: "320px",
                      borderRadius: "15px",
                      background: "white",
                      boxShadow: "0 5px 15px rgba(0,0,0,0.04)",
                      overflow: "hidden"
                    }}
                  >
                    <div 
                      style={{ 
                        height: "160px", 
                        background: "#f0f0f0"
                      }} 
                    />
                    <div style={{ padding: "15px" }}>
                      <div 
                        style={{ 
                          height: "24px", 
                          width: "90%", 
                          background: "#f0f0f0",
                          borderRadius: "4px",
                          marginBottom: "12px"
                        }} 
                      />
                      <div 
                        style={{ 
                          height: "16px", 
                          width: "60%", 
                          background: "#f0f0f0",
                          borderRadius: "4px",
                          marginBottom: "40px"
                        }} 
                      />
                      <div style={{ height: "1px", background: "#eee", margin: "15px 0" }} />
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div
                          style={{ 
                            height: "16px", 
                            width: "40%", 
                            background: "#f0f0f0",
                            borderRadius: "4px"
                          }}
                        />
                        <div
                          style={{ 
                            height: "16px", 
                            width: "40%", 
                            background: "#f0f0f0",
                            borderRadius: "4px"
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Course categories skeleton - show instead of CTA */}
          {loading && (
            <div className="mb-5">
              {[1, 2, 3].map(category => (
                <div key={category} className="mb-5">
                  <div 
                    style={{ 
                      height: "28px", 
                      width: `${180 + Math.random() * 100}px`, 
                      background: "#f0f0f0",
                      borderRadius: "4px",
                      marginBottom: "20px"
                    }}
                  />
                  
                  <div className="d-flex overflow-hidden" style={{ gap: "20px" }}>
                    {[1, 2, 3, 4].map(i => (
                      <div 
                        key={i}
                        style={{ 
                          width: "280px",
                          height: "320px",
                          borderRadius: "15px",
                          background: "white",
                          boxShadow: "0 5px 15px rgba(0,0,0,0.04)",
                          overflow: "hidden",
                          flex: "0 0 auto"
                        }}
                      >
                        <div 
                          style={{ 
                            height: "160px", 
                            background: "#f0f0f0"
                          }} 
                        />
                        <div style={{ padding: "15px" }}>
                          <div 
                            style={{ 
                              height: "24px", 
                              width: "90%", 
                              background: "#f0f0f0",
                              borderRadius: "4px",
                              marginBottom: "12px"
                            }} 
                          />
                          <div 
                            style={{ 
                              height: "16px", 
                              width: "60%", 
                              background: "#f0f0f0",
                              borderRadius: "4px",
                              marginBottom: "40px"
                            }} 
                          />
                          <div style={{ height: "1px", background: "#eee", margin: "15px 0" }} />
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div
                              style={{ 
                                height: "16px", 
                                width: "40%", 
                                background: "#f0f0f0",
                                borderRadius: "4px"
                              }}
                            />
                            <div
                              style={{ 
                                height: "16px", 
                                width: "40%", 
                                background: "#f0f0f0",
                                borderRadius: "4px"
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {error && (
        <Alert variant="danger" className="rounded-3 shadow-sm">
          <div className="d-flex align-items-center">
            <div className="me-3">⚠️</div>
            <div>{error}</div>
          </div>
        </Alert>
      )}

      {/* No need for search prompt anymore, search results are shown live as user types */}

      {/* Course Sections */}
      {!loading && !error && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
          {/* Only show search results when filterResults exists and search is focused */}
          {filteredResults && isSearchFocused ? (
            // Display search results
            Object.keys(filteredResults).length === 0 ? (
              <div className="text-center py-5">
                <div style={{ fontSize: "50px", marginBottom: "20px" }}>🔍</div>
                <h3>No courses found for "{searchQuery}"</h3>
                <p className="text-muted">Try adjusting your search terms</p>
              </div>
            ) : (
              // Map through search results
              Object.entries(filteredResults).map(([category, courses]) => (
                <motion.div key={category} className="mb-5" variants={itemVariants}>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="fw-bold" style={{ color: "#0056b3" }}>
                      {category}
                      <Badge bg="primary" pill className="ms-2" style={{ fontSize: "0.5em", verticalAlign: "middle" }}>
                        {courses.length}
                      </Badge>
                    </h3>
                  </div>

                  <div className="d-flex flex-wrap gap-3">
                    {courses.map((course, idx) => (
                      <Card 
                        key={idx} 
                        className="course-card border-0" 
                        style={{ 
                          width: `${cardWidth}px`,
                          borderRadius: "15px",
                          overflow: "hidden",
                          transition: "all 0.3s ease",
                          cursor: "pointer",
                          marginBottom: "20px"
                        }}
                        onClick={() => navigate(`/courses/courseShow/${course.id}`)}
                      >
                        <div className="position-relative">
                          <Card.Img
                            variant="top"
                            src={course.thumbnail}
                            alt={course.title}
                            style={{ height: "160px", objectFit: "cover" }}
                          />
                          <div 
                            className="position-absolute bottom-0 start-0 w-100 p-2"
                            style={{ 
                              background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                              color: "white"
                            }}
                          >
                            <div className="d-flex align-items-center">
                              <div 
                                className="d-flex align-items-center bg-warning rounded-pill px-2 py-1"
                                style={{ fontSize: "0.8rem" }}
                              >
                                <FaStar className="me-1" />
                                <span className="fw-bold">{course.rating}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Card.Body className="d-flex flex-column">
                          <h5 className="fw-bold mb-2" style={{ fontSize: "1.1rem" }}>{course.title}</h5>
                          
                          <div className="text-muted mb-2 d-flex align-items-center">
                            <img 
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(course.created_by)}&background=random`} 
                              alt={course.created_by}
                              className="rounded-circle me-2"
                              width="20"
                              height="20"
                            />
                            <span>{course.created_by}</span>
                          </div>
                          
                          <div className="mt-auto pt-3 d-flex justify-content-between border-top">
                            <div className="course-stat d-flex align-items-center">
                              <FaGraduationCap className="me-1 text-primary" />
                              <span style={{ fontSize: "0.85rem" }}>{course.students}</span>
                            </div>
                            <div className="course-stat d-flex align-items-center">
                              <FaBookOpen className="me-1 text-primary" />
                              <span style={{ fontSize: "0.85rem" }}>{course.lessons} lessons</span>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              ))
            )
          ) : (
            // Show normal course sections when not searching or search is cleared
            Object.entries(filteredCourses).map(([category, courses]) => (
              <motion.div key={category} className="mb-5" variants={itemVariants}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="fw-bold" style={{ color: "#0056b3" }}>
                    {category}
                    <Badge bg="primary" pill className="ms-2" style={{ fontSize: "0.5em", verticalAlign: "middle" }}>
                      {courses.length}
                    </Badge>
                  </h3>
                  
                  <Button 
                    variant="link" 
                    className="text-decoration-none fw-bold"
                    onClick={() => navigate('/courses')}
                  >
                    View All
                  </Button>
                </div>

                <div className="position-relative course-carousel">
                {/* Scroll Left Button */}
                  <Button 
                    variant="light" 
                    className="scroll-btn scroll-left rounded-circle shadow-sm"
                    onClick={() => scrollLeft(category)}
                    style={{
                      position: "absolute",
                      left: "-20px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 10,
                      width: "40px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                  <FaChevronLeft />
                </Button>

                {/* Course Cards Wrapper */}
                  <div 
                    className="overflow-auto" 
                    style={{ 
                      width: "100%",
                      paddingLeft: "10px",
                      paddingRight: "10px"
                    }}
                  >
                    <div
                      ref={(el) => (scrollRefs.current[category] = el)}
                      className="d-flex overflow-auto pb-3"
                      style={{ 
                        gap: `${gap}px`, 
                        scrollbarWidth: "none", 
                        msOverflowStyle: "none",
                        scrollSnapType: "x mandatory" 
                      }}
                  >
                    {courses.map((course, idx) => (
                        <Card 
                          key={idx} 
                          className="course-card border-0" 
                          style={{ 
                            minWidth: `${cardWidth}px`,
                            borderRadius: "15px",
                            overflow: "hidden",
                            transition: "all 0.3s ease",
                            cursor: "pointer"
                          }}
                          onClick={() => navigate(`/courses/courseShow/${course.id}`)}
                        >
                          <div className="position-relative">
                        <Card.Img
                          variant="top"
                          src={course.thumbnail}
                          alt={course.title}
                              style={{ height: "160px", objectFit: "cover" }}
                            />
                            <div 
                              className="position-absolute bottom-0 start-0 w-100 p-2"
                              style={{ 
                                background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                                color: "white"
                              }}
                            >
                              <div className="d-flex align-items-center">
                                <div 
                                  className="d-flex align-items-center bg-warning rounded-pill px-2 py-1"
                                  style={{ fontSize: "0.8rem" }}
                                >
                                  <FaStar className="me-1" />
                                  <span className="fw-bold">{course.rating}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <Card.Body className="d-flex flex-column">
                            <h5 className="fw-bold mb-2" style={{ fontSize: "1.1rem" }}>{course.title}</h5>
                            
                            <div className="text-muted mb-2 d-flex align-items-center">
                              <img 
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(course.created_by)}&background=random`} 
                                alt={course.created_by}
                                className="rounded-circle me-2"
                                width="20"
                                height="20"
                              />
                              <span>{course.created_by}</span>
                            </div>
                            
                            <div className="mt-auto pt-3 d-flex justify-content-between border-top">
                              <div className="course-stat d-flex align-items-center">
                                <FaGraduationCap className="me-1 text-primary" />
                                <span style={{ fontSize: "0.85rem" }}>{course.students}</span>
                              </div>
                              <div className="course-stat d-flex align-items-center">
                                <FaBookOpen className="me-1 text-primary" />
                                <span style={{ fontSize: "0.85rem" }}>{course.lessons} lessons</span>
                              </div>
                            </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Scroll Right Button */}
                  <Button 
                    variant="light" 
                    className="scroll-btn scroll-right rounded-circle shadow-sm"
                    onClick={() => scrollRight(category)}
                    style={{
                      position: "absolute",
                      right: "-20px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 10,
                      width: "40px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                  <FaChevronRight />
                </Button>
              </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

        {/* Modern CTA banner at the bottom */}
        {!loading && !error && (
          <motion.div 
            className="bottom-cta-section mb-5 mt-5 rounded-4 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            style={{ 
              background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)" 
            }}
          >
            <Row className="g-0 align-items-center">
              <Col md={7} className="p-5 text-white">
                <h3 className="fw-bold mb-3">Ready to Advance Your Skills?</h3>
                <p className="mb-4 lead">
                  Explore our comprehensive course library and start learning today. 
                  Your next career opportunity is just a course away.
                </p>
                <Button 
                  variant="light" 
                  size="lg"
                  className="fw-semibold text-primary px-4"
                  onClick={() => navigate('/courses')}
                >
                  Explore All Courses
                </Button>
              </Col>
              <Col md={5} className="position-relative d-none d-md-block" style={{ minHeight: "260px" }}>
                <img 
                  src={ctaImage} 
                  alt="Online learning" 
                  style={{ 
                    position: "absolute",
                    right: 0,
                    height: "100%",
                    width: "100%",
                    objectFit: "cover",
                    objectPosition: "center"
                  }}
                />
              </Col>
            </Row>
          </motion.div>
      )}
    </Container>

      {/* Add custom styling */}
      <style jsx="true">{`
        .home-page {
          overflow-x: hidden;
        }
        
        .categories-nav .btn {
          transition: all 0.3s ease;
        }
        
        .course-card {
          box-shadow: 0 5px 15px rgba(0,0,0,0.08);
          transition: all 0.3s ease;
        }
        
        .course-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }
        
        .scroll-btn {
          opacity: 0.9;
          transition: all 0.2s ease;
        }
        
        .scroll-btn:hover {
          opacity: 1;
          transform: translateY(-50%) scale(1.1);
        }
        
        .overflow-auto::-webkit-scrollbar {
          display: none;
        }
        
        @keyframes shine {
          to {
            background-position-x: -200%;
          }
        }
        
        @keyframes pulse {
          0% {
            opacity: 0.7;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Home;

