import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, InputGroup, Form, Accordion, Spinner } from "react-bootstrap";
import { FaSearch, FaFilter, FaTimes, FaStar, FaHeart, FaRegHeart, FaSyncAlt, FaChalkboardTeacher } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import common_API from "../../Api/commonApi";
import Courses_API from "../../Api/courseApi";
import Wishlist_API from "../../Api/wishlistApi";

// Default image if thumbnail is missing
const defaultImage = "https://img.freepik.com/free-vector/hand-drawn-flat-design-stack-books_23-2149334862.jpg";

// Filter options
const durations = [
  { label: "Short (<3 hrs)", min: 0, max: 3 },
  { label: "Medium (3-6 hrs)", min: 3, max: 6 },
  { label: "Long (6+ hrs)", min: 6, max: Infinity },
];
const ratings = [1, 2, 3, 4, 5];

// Star Rating Display
const renderStars = (rating) => (
  <span className="d-inline-flex align-items-center">
    {[...Array(5)].map((_, i) => (
      <FaStar 
        key={i} 
        color={i < rating ? "#ffdd00" : "#e4e5e9"} 
        style={{ marginRight: '2px', filter: i < rating ? "drop-shadow(0 0 2px rgba(255, 221, 0, 0.3))" : "none" }}
      />
    ))}
  </span>
);

// Course Card Skeleton Component
const CourseCardSkeleton = () => (
  <Card className="border-0 shadow-sm h-100 skeleton-card" style={{ borderRadius: "12px", overflow: "hidden" }}>
    <div className="skeleton-pulse" style={{ height: '180px' }}></div>
    <Card.Body className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="skeleton-pulse mb-2" style={{ height: "20px", width: "70%", borderRadius: "4px" }}></div>
        <div className="skeleton-pulse" style={{ height: "20px", width: "20px", borderRadius: "50%" }}></div>
      </div>
      <div className="skeleton-pulse mb-3" style={{ height: "16px", width: "40%", borderRadius: "4px" }}></div>
      <div className="skeleton-pulse mb-3" style={{ height: "16px", width: "90%", borderRadius: "4px" }}></div>
      <div className="skeleton-pulse mb-2" style={{ height: "16px", width: "85%", borderRadius: "4px" }}></div>
      <div className="d-flex align-items-center mb-2">
        <div className="skeleton-pulse me-2" style={{ height: "24px", width: "80px", borderRadius: "6px" }}></div>
        <div className="skeleton-pulse" style={{ height: "24px", width: "80px", borderRadius: "6px" }}></div>
      </div>
      <div className="skeleton-pulse mt-2 mb-2" style={{ height: "16px", width: "60%", borderRadius: "4px" }}></div>
      <div className="mt-auto pt-3">
        <div className="skeleton-pulse" style={{ height: "38px", width: "100%", borderRadius: "8px" }}></div>
      </div>
    </Card.Body>
  </Card>
);

const Courses = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedDurations, setSelectedDurations] = useState([]);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [wishlistedCourses, setWishlistedCourses] = useState({});
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [courseChapters, setCourseChapters] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Add custom CSS styles for animations and skeleton loader
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      /* Animation keyframes */
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes shimmer {
        0% { background-position: -1000px 0; }
        100% { background-position: 1000px 0; }
      }
      
      /* Page animations */
      .courses-container {
        animation: fadeIn 0.5s ease forwards;
      }
      
      .course-card {
        animation: fadeIn 0.5s ease forwards;
        animation-delay: calc(0.05s * var(--animation-order, 0));
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s ease;
        border-radius: 8px;
        overflow: hidden;
        height: 100%;
        box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        cursor: pointer;
      }
      
      .course-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
      }
      
      /* Responsive adjustments for course cards */
      @media (max-width: 768px) {
        .card-title {
          font-size: 1rem !important;
        }
        
        .course-card:hover {
          transform: translateY(-3px);
        }
      }
      
      /* Skeleton loading styles */
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
      
      /* Button and rating spacing */
      .view-course-btn {
        margin-top: 20px;
      }
      
      .rating-container {
        margin-bottom: 15px;
        padding: 8px 0;
        border-top: 1px solid #f0f0f0;
      }
      
      /* Filter animation */
      .filter-sidebar {
        animation: slideIn 0.3s ease forwards;
      }
      
      @keyframes slideIn {
        from { transform: translateX(50px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      /* Header animation */
      .page-title {
        position: relative;
        display: inline-block;
        padding-bottom: 8px;
        color: "#0062E6"; 
      }
      
      .page-title::after {
        content: '';
        position: absolute;
        width: 50%;
        height: 3px;
        bottom: 0;
        left: 25%;
        background: linear-gradient(135deg, #0062E6 0%, #33A1FD 100%);
        transform: scaleX(0);
        transform-origin: center;
        animation: expandWidth 1s ease forwards;
        border-radius: 3px;
      }
      
      @keyframes expandWidth {
        to { transform: scaleX(1); }
      }

      /* Search bar focus effect */
      .search-bar:focus-within {
        border-color: #0062E6 !important;
        box-shadow: 0 0 0 3px rgba(0, 98, 230, 0.25) !important;
      }
      
      /* Add a subtle gradient effect to focused search bar */
      .search-bar:focus-within::after {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        border-radius: 55px;
        background: linear-gradient(135deg, #0062E6 0%, #33A1FD 100%);
        z-index: -1;
        opacity: 0.5;
      }

      /* Course description hover effect */
      .course-description {
        position: relative;
        cursor: pointer;
      }
      
      .course-description:hover .full-description {
        display: block !important;
      }
      
      /* Position the tooltip based on position in viewport */
      .course-card:nth-child(3n) .full-description {
        right: 0;
        left: auto;
      }
      
      .full-description {
        position: absolute;
        top: 0;
        left: 0;
        background-color: white;
        border: 1px solid rgba(0, 98, 230, 0.1);
        z-index: 1000;
      }
      
      /* Fix spacing in course cards */
      .course-card .card-body {
        padding: 0.75rem !important;
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      
      .description-wrapper {
        height: 52px !important;
        margin-bottom: 0.5rem !important;
        margin-top: 0.25rem !important;
      }
      
      .course-card h5.fw-bold {
        margin-bottom: 0 !important;
      }
      
      .course-card .d-flex.align-items-center {
        margin-bottom: 0.25rem !important;
      }

      /* Add custom scrollbar styling */
      .full-description::-webkit-scrollbar {
        width: 0;
        display: none;
      }
      
      .full-description::-webkit-scrollbar-track {
        display: none;
      }
      
      .full-description::-webkit-scrollbar-thumb {
        display: none;
      }
      
      .full-description::-webkit-scrollbar-thumb:hover {
        display: none;
      }
    `;
    document.head.appendChild(styleEl);
    
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Fetch courses, categories and chapter data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Using the common_API pattern as in instructor pages
        const coursesResponse = await common_API.get("/courses");
        
        // Fetch categories for filters
        const categoriesResponse = await Courses_API.get("/category");
        
        if (coursesResponse.data && coursesResponse.data.data) {
          const courseData = coursesResponse.data.data;
          
          // Fetch ratings for each course
          const coursesWithRatings = await Promise.all(
            courseData.map(async (course) => {
              try {
                const ratingResponse = await common_API.get(`/rating/${course._id}`);
                if (ratingResponse.status === 200) {
                  return {
                    ...course,
                    averageRating: ratingResponse.data.averageRating || 0,
                    totalRatings: ratingResponse.data.ratings?.length || 0
                  };
                } else {
                  console.warn(`Failed to fetch rating for course ${course._id}:`, ratingResponse);
                  return {
                    ...course,
                    averageRating: 0,
                    totalRatings: 0
                  };
                }
              } catch (err) {
                console.error(`Error fetching rating for course ${course._id}:`, err);
                return {
                  ...course,
                  averageRating: 0,
                  totalRatings: 0
                };
              }
            })
          );
          
          setCourses(coursesWithRatings);
          
          // Fetch chapters and videos for each course to calculate duration
          const chaptersData = {};
          for (const course of coursesWithRatings) {
            try {
              const chaptersResponse = await Courses_API.get(`/chapter/${course._id}`);
              if (chaptersResponse.data && Array.isArray(chaptersResponse.data)) {
                const chaptersWithVideos = await Promise.all(
                  chaptersResponse.data.map(async (chapter) => {
                    try {
                      const videosResponse = await Courses_API.get(`/video/${chapter._id}`);
                      return {
                        ...chapter,
                        videos: videosResponse.data || []
                      };
                    } catch (err) {
                      console.error(`Error fetching videos for chapter ${chapter._id}:`, err);
                      return {
                        ...chapter,
                        videos: []
                      };
                    }
                  })
                );
                chaptersData[course._id] = chaptersWithVideos;
              }
            } catch (err) {
              console.error(`Error fetching chapters for course ${course._id}:`, err);
              chaptersData[course._id] = [];
            }
          }
          setCourseChapters(chaptersData);
          
          // Fetch user's wishlist after courses are loaded
          fetchWishlist();
        } else {
          console.warn("API response format not as expected:", coursesResponse.data);
          setError("No courses found or invalid data format");
          setCourses([]);
        }
        
        // Handle categories response and extract category names
        if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
          setCategories(categoriesResponse.data);
        } else {
          console.warn("Categories API response format not as expected:", categoriesResponse.data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch courses. Please try again later.");
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch user's wishlist
  const fetchWishlist = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user._id) return;

      const response = await Wishlist_API.get(`/${user._id}`);
      
      if (response.data && response.data.wishlist) {
        // Create a map of course IDs that are in the wishlist
        const wishlistMap = {};
        if (Array.isArray(response.data.wishlist.course_id)) {
          response.data.wishlist.course_id.forEach(course => {
            wishlistMap[course._id] = true;
          });
        } else if (response.data.wishlist.course_id) {
          wishlistMap[response.data.wishlist.course_id._id] = true;
        }
        setWishlistedCourses(wishlistMap);
      }
    } catch (err) {
      console.error("Error fetching wishlist:", err);
    }
  };

  // Toggle wishlist status
  const toggleWishlist = async (courseId, event) => {
    if (event) event.stopPropagation(); // Prevent card click event
    
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user._id) {
        alert("Please login to add courses to wishlist");
        return;
      }

      const response = await Wishlist_API.post("/add", {
        user_id: user._id,
        course_id: courseId
      });

      // Update local state
      setWishlistedCourses(prev => ({
        ...prev,
        [courseId]: !prev[courseId]
      }));
      
      // Show success message
      if (response.data && response.data.message) {
        alert(response.data.message);
      }
    } catch (err) {
      console.error("Error toggling wishlist:", err);
      
      // Handle specific error for inactive courses
      if (err.response && err.response.data && err.response.data.message) {
        alert(err.response.data.message);
      } else {
        alert("Failed to update wishlist");
      }
      
      // If there was an error adding to wishlist, don't update the UI
      // The error might be that the course is inactive
    }
  };

  const toggleSelection = (value, setter, selectedList) => {
    if (typeof value === 'object') {
      // For objects like duration ranges, check if an object with the same label exists
      const exists = selectedList.some(item => item.label === value.label);
      if (exists) {
        setter(selectedList.filter(item => item.label !== value.label));
      } else {
        setter([...selectedList, value]);
      }
    } else {
      // For primitive values like category IDs
      setter(selectedList.includes(value) ? selectedList.filter(item => item !== value) : [...selectedList, value]);
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

  // Function to truncate text to one line with ellipsis
  const truncateDescription = (description) => {
    if (!description) return "";
    
    // Check if description is likely to exceed one line (roughly 50 characters)
    const isLongDescription = description.length > 50;
    
    // For tooltip, limit to 200 characters if very long
    const tooltipText = description.length > 300 
      ? description.substring(0, 300) + "..." 
      : description;
    
    return (
      <div className="course-description" style={{ position: "relative" }}>
        <p 
          style={{ 
            overflow: "hidden", 
            textOverflow: "ellipsis",
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: "3",
            WebkitBoxOrient: "vertical",
            lineHeight: "1.4",
            maxHeight: "4.2em",
            fontSize: "0.9rem"
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
              padding: "15px", 
              borderRadius: "8px", 
              boxShadow: "0 4px 15px rgba(0,0,0,0.15)", 
              zIndex: 1000, 
              display: "none",
              width: "280px",
              maxWidth: "350px",
              overflowY: "visible",
              wordWrap: "break-word",
              whiteSpace: "normal",
              lineHeight: "1.5",
              fontSize: "0.9rem",
              color: "#333",
              border: "1px solid rgba(0, 98, 230, 0.1)"
            }}
          >
            {tooltipText}
          </div>
        )}
      </div>
    );
  };

  // Get category name from category id
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.category_name : "Unknown";
  };

  // Calculate course duration in minutes based on video lengths
  const calculateCourseDuration = (courseId) => {
    const chapters = courseChapters[courseId] || [];
    
    // Calculate total duration in seconds
    const totalSeconds = chapters.reduce((total, chapter) => {
      return total + chapter.videos?.reduce((chapterTotal, video) => {
        return chapterTotal + (video.video_length ? parseInt(video.video_length) : 0);
      }, 0) || 0;
    }, 0);
    
    // Convert to minutes
    return Math.ceil(totalSeconds / 60);
  };

  // Convert minutes to hours for filter comparison
  const getDurationInHours = (minutes) => {
    return minutes / 60;
  };

  // Filter courses based on search query and filters
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = searchQuery === "" || 
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.includes(course.category_id);
    

    // Calculate course duration in minutes
    const durationMinutes = calculateCourseDuration(course._id);
    // Convert to hours for filtering (ensuring courses with less than 60 minutes still show up for "Short" filter)
    const durationHours = durationMinutes / 60;
    
    // When duration filters are applied, log each course's duration for debugging
    if (selectedDurations.length > 0) {
      console.log(`Course: ${course.title}, Duration: ${durationMinutes} min (${durationHours.toFixed(2)} hours)`);
    }
    
    const matchesDuration = selectedDurations.length === 0 || 
      selectedDurations.some(range => {
        const matches = durationHours >= range.min && durationHours <= range.max;
        if (selectedDurations.length > 0) {
          console.log(`  Checking against range ${range.label}: ${matches ? 'MATCH' : 'NO MATCH'}`);
        }
        return matches;
      });

    
    const matchesRating = selectedRatings.length === 0 || 
      selectedRatings.includes(Math.round(course.averageRating || 0));
    
    return matchesSearch && matchesCategory && matchesDuration && matchesRating;
  });

  // Format duration for display
  const formatCourseDuration = (courseId) => {
    const durationMinutes = calculateCourseDuration(courseId);
    
    if (durationMinutes < 60) {
      return `${durationMinutes} min`;
    }
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (minutes === 0) {
      return `${hours} hr`;
    }
    
    return `${hours} hr ${minutes} min`;
  };

  return (
    <div>
      {/* Header Banner */}
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
              <h2 className="fw-bold mb-1">Explore Courses</h2>
              <p className="mb-0 opacity-75">Discover the perfect course to enhance your skills</p>
            </div>
            
            <div className="d-flex align-items-center">
              {/* Header Search Bar */}
              <div className="me-3 d-none d-md-block">
                <InputGroup 
                  className="hero-search"
                  style={{
                    width: "260px",
                    height: "45px",
                    borderRadius: "50px",
                    overflow: "hidden",
                    backgroundColor: "white",
                    boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
                    marginTop: "20px"
                  }}
                >
                  <InputGroup.Text style={{ background: "white", border: "none", paddingLeft: "15px" }}>
                    <FaSearch color="#0062E6" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      height: "45px",
                      border: "none",
                      outline: "none",
                      boxShadow: "none",
                      fontSize: "0.95rem",
                      paddingRight: "15px"
                    }}
                  />
                </InputGroup>
              </div>
              
              <Button 
                variant="light" 
                onClick={() => setShowFilters(true)}
                className="d-none d-md-block"
                style={{
                  background: "rgba(255, 255, 255, 0.9)",
                  color: "#0056b3",
                  fontWeight: "500",
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                  padding: "8px 16px",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 1)";
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.9)";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
                }}
              >
                <FaFilter className="me-2" /> Filters
                {(selectedCategories.length > 0 || selectedDurations.length > 0 || selectedRatings.length > 0) && (
                  <span className="ms-1 badge bg-primary">
                    {selectedCategories.length + selectedDurations.length + selectedRatings.length}
                  </span>
                )}
              </Button>
            </div>
          </motion.div>
        </Container>
      </div>

      <Container className="pb-5">
        {/* Mobile Search & Filters (only visible on small screens) */}
        <div className="mb-4 d-md-none" style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: "75%", paddingRight: "8px" }}>
            <InputGroup
              className="hero-search"
              style={{
                width: "100%",
                height: "45px",
                borderRadius: "50px",
                overflow: "hidden",
                backgroundColor: "white",
                boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
                marginTop: "15px"
              }}
            >
              <InputGroup.Text style={{ background: "white", border: "none", paddingLeft: "15px", marginBottom: "15px" }}>
                <FaSearch color="#0062E6" />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  height: "45px",
                  border: "none",
                  outline: "none",
                  boxShadow: "none",
                  fontSize: "0.95rem"
                }}
              />
            </InputGroup>
          </div>
          <div style={{ width: "25%" }}>
            <Button
              variant="primary"
              className="w-100"
              onClick={() => setShowFilters(true)}
              style={{
                background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)",
                border: "none",
                borderRadius: "8px",
                height: "45px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <FaFilter />
              {(selectedCategories.length > 0 || selectedDurations.length > 0 || selectedRatings.length > 0) && (
                <span className="ms-1 badge bg-light text-primary">
                  {selectedCategories.length + selectedDurations.length + selectedRatings.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        <Row>
          <motion.div initial={{ width: "100%" }} animate={{ width: showFilters ? "75%" : "100%" }} transition={{ duration: 0.3 }}>
            <Row className="courses-container">
              {isLoading ? (
                // Skeleton loading state
                Array.from({ length: 6 }).map((_, index) => (
                  <Col key={index} md={4} className="mb-4">
                    <CourseCardSkeleton />
                  </Col>
                ))
              ) : error ? (
                <Col className="text-center">
                  <div className="alert alert-danger">{error}</div>
                </Col>
              ) : filteredCourses.length > 0 ? (
                filteredCourses.map((course, index) => (
                  <Col key={course._id} md={4} className="mb-4">
                    <Card 
                      className="border-0 shadow-sm h-100 course-card" 
                      style={{ 
                        "--animation-order": index, 
                        borderRadius: "12px",
                        overflow: "hidden"
                      }}
                      onClick={() => navigate(`/courses/courseshow/${course._id}`)}
                    >
                      <div className="position-relative">
                        <Card.Img
                          variant="top"
                          src={getValidThumbnail(course.thumbnail)}
                          alt={course.title}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = defaultImage;
                          }}
                          style={{ height: "180px", objectFit: "cover", objectPosition: "center" }}
                        />
                      </div>
                      <Card.Body className="d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-start mb-0">
                          <h5 className="fw-bold mb-0" style={{ 
                            fontSize: "1.1rem",
                            height: "38px",
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: "2",
                            WebkitBoxOrient: "vertical"
                          }}>{course.title}</h5>
                          <button
                            onClick={(e) => toggleWishlist(course._id, e)}
                            style={{
                              background: "none",
                              border: "none",
                              padding: 0,
                              cursor: "pointer",
                              fontSize: "1.25rem",
                              marginLeft: "10px",
                              minWidth: "20px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: wishlistedCourses[course._id] ? "#dc3545" : "#6c757d"
                            }}
                            title={wishlistedCourses[course._id] ? "Remove from wishlist" : "Add to wishlist"}
                          >
                            {wishlistedCourses[course._id] ? <FaHeart /> : <FaRegHeart />}
                          </button>
                        </div>
                        
                        <div className="d-flex align-items-center mt-0" style={{ height: "18px" }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#6c757d" className="bi bi-person me-2" viewBox="0 0 16 16">
                            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664z"/>
                          </svg>
                          <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                            {course.created_by?.user_name || "Unknown Instructor"}
                          </span>
                        </div>
                        
                        <div className="description-wrapper" style={{ height: "52px", marginBottom: "0.5rem", marginTop: "0.25rem" }}>
                          {truncateDescription(course.description || "No description available for this course.")}
                        </div>
                        
                        <div className="mb-1" style={{ height: "30px" }}>
                          <div className="d-flex align-items-center">
                            <span className="badge me-2" style={{ 
                              background: "rgba(0, 98, 230, 0.1)", 
                              color: "#0062E6", 
                              fontWeight: "500",
                              padding: "5px 8px",
                              borderRadius: "6px"
                            }}>
                              {getCategoryName(course.category_id)}
                            </span>
                            <span className="badge" style={{ 
                              background: "rgba(253, 126, 20, 0.1)", 
                              color: "#fd7e14", 
                              fontWeight: "500",
                              padding: "5px 8px",
                              borderRadius: "6px"
                            }}>
                              {formatCourseDuration(course._id)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="rating-container mb-2" style={{ 
                          borderTop: "1px solid #f0f0f0", 
                          paddingTop: "6px",
                          height: "34px"
                        }}>
                          <div className="d-flex align-items-center">
                            <strong className="me-2">Rating:</strong>
                            <strong style={{ color: "#0062E6", fontSize: "1.1rem" }}>
                              {course.averageRating ? Number(course.averageRating).toFixed(1) : "0.0"}
                            </strong>
                            <div className="ms-2">
                              {renderStars(course.averageRating || 0)}
                            </div>
                            <span className="text-muted ms-2" style={{ fontSize: "0.85rem" }}>
                              ({course.totalRatings || 0})
                            </span>
                          </div>
                        </div>
                        
                        <Button
                          variant="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/courses/courseshow/${course._id}`);
                          }}
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
                            e.target.style.boxShadow = "0 4px 8px rgba(0, 98, 230, 0.3)";
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
                ))
              ) : (
                <Col className="text-center">
                  <div style={{ 
                    maxWidth: "450px", 
                    margin: "0 auto", 
                    padding: "2rem",
                    background: "rgba(0, 98, 230, 0.05)",
                    borderRadius: "12px"
                  }}>
                    <img 
                      src="https://img.freepik.com/free-vector/empty-concept-illustration_114360-1188.jpg" 
                      alt="No results" 
                      className="img-fluid mb-4" 
                      style={{ maxHeight: "180px" }} 
                    />
                    <h4 className="mb-3 fw-bold">No courses match your filters</h4>
                    <p className="text-muted mb-4">Try adjusting your search criteria or remove some filters.</p>
                    <Button 
                      variant="primary" 
                      onClick={() => {
                        setSelectedCategories([]);
                        setSelectedDurations([]);
                        setSelectedRatings([]);
                        setSearchQuery("");
                      }}
                      style={{
                        background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)",
                        border: "none",
                        borderRadius: "8px",
                        padding: "10px 20px",
                        fontWeight: "500",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = "linear-gradient(135deg, #0056CD 0%, #2B8AD9 100%)";
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow = "0 4px 8px rgba(0, 98, 230, 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)";
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      <FaSyncAlt className="me-2" /> Reset All Filters
                    </Button>
                  </div>
                </Col>
              )}
            </Row>
          </motion.div>

          <AnimatePresence mode="wait">
            {showFilters && (
              <motion.div 
                initial={{ x: 200, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }} 
                exit={{ x: 200, opacity: 0 }} 
                transition={{ duration: 0.2, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  right: "15px",
                  top: "220px", // Position below the header
                  background: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
                  zIndex: 10,
                  width: "280px",
                  border: "1px solid rgba(0, 98, 230, 0.1)",
                  willChange: "transform, opacity" // Add willChange to improve performance
                }}
                className="filter-sidebar"
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold mb-0" style={{ color: "#0062E6" }}>Filter Courses</h5>
                  <Button 
                    variant="link" 
                    className="p-0" 
                    onClick={(e) => {
                      e.preventDefault();
                      setShowFilters(false);
                    }}
                    style={{ 
                      color: "#0062E6",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "30px",
                      height: "30px",
                      background: "rgba(0, 98, 230, 0.05)",
                      borderRadius: "50%"
                    }}
                  >
                    <FaTimes size={16} />
                  </Button>
                </div>
                
                <Accordion defaultActiveKey={["0", "1", "2"]} alwaysOpen>
                  <Accordion.Item eventKey="0" className="mb-3" style={{ border: "1px solid rgba(0, 98, 230, 0.1)", borderRadius: "10px" }}>
                    <Accordion.Header className="filter-header">
                      <span style={{ color: "#0062E6", fontWeight: "500" }}>Category</span>
                    </Accordion.Header>
                    <Accordion.Body>
                      {categories.length > 0 ? (
                        categories.map((cat) => (
                          <Form.Check 
                            key={cat._id} 
                            type="checkbox" 
                            id={`category-${cat._id}`}
                            label={cat.category_name} 
                            checked={selectedCategories.includes(cat._id)}
                            onChange={() => toggleSelection(cat._id, setSelectedCategories, selectedCategories)}
                            className="mb-2 custom-checkbox"
                          />
                        ))
                      ) : (
                        <div className="d-flex justify-content-center my-2">
                          <Spinner animation="border" variant="primary" size="sm" />
                        </div>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>
                  
                  <Accordion.Item eventKey="1" className="mb-3" style={{ border: "1px solid rgba(0, 98, 230, 0.1)", borderRadius: "10px" }}>
                    <Accordion.Header className="filter-header">
                      <span style={{ color: "#0062E6", fontWeight: "500" }}>Duration</span>
                    </Accordion.Header>
                    <Accordion.Body>
                      {durations.map((dur) => (
                        <Form.Check 
                          key={dur.label} 
                          type="checkbox" 
                          id={`duration-${dur.label}`}
                          label={dur.label}
                          checked={selectedDurations.some(d => d.label === dur.label)}
                          onChange={() => toggleSelection(dur, setSelectedDurations, selectedDurations)}
                          className="mb-2 custom-checkbox"
                        />
                      ))}
                    </Accordion.Body>
                  </Accordion.Item>
                  
                  <Accordion.Item eventKey="2" className="mb-3" style={{ border: "1px solid rgba(0, 98, 230, 0.1)", borderRadius: "10px" }}>
                    <Accordion.Header className="filter-header">
                      <span style={{ color: "#0062E6", fontWeight: "500" }}>Rating</span>
                    </Accordion.Header>
                    <Accordion.Body>
                      {ratings.map((rate) => (
                        <Form.Check 
                          key={rate} 
                          type="checkbox" 
                          id={`rating-${rate}`}
                          label={renderStars(rate)} 
                          value={rate}
                          checked={selectedRatings.includes(rate)}
                          onChange={() => toggleSelection(rate, setSelectedRatings, selectedRatings)}
                          className="mb-2 custom-checkbox"
                        />
                      ))}
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
                
                <Button
                  variant="primary"
                  className="mt-3 w-100"
                  onClick={() => {
                    setSelectedCategories([]);
                    setSelectedDurations([]);
                    setSelectedRatings([]);
                  }}
                  style={{
                    background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)",
                    border: "none",
                    color: "white",
                    borderRadius: "8px",
                    padding: "10px 0",
                    fontWeight: "500",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "linear-gradient(135deg, #0056CD 0%, #2B8AD9 100%)";
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 4px 8px rgba(0, 98, 230, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)";
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  <FaSyncAlt className="me-2" /> Reset Filters
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </Row>
      </Container>
    </div>
  );
};

export default Courses;