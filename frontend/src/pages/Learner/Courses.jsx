import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, InputGroup, Form, Accordion, Spinner } from "react-bootstrap";
import { FaSearch, FaFilter, FaTimes, FaStar, FaHeart, FaRegHeart, FaSyncAlt, FaChalkboardTeacher } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import common_API from "../../Api/commonApi";
import Courses_API from "../../Api/courseApi";
import Wishlist_API from "../../Api/wishlistApi";

const defaultImage = "https://www.futuretechinfovision.co.uk/wp-content/uploads/2022/06/IT-Courses.jpg";

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
        color={i < rating ? "#ffc107" : "#e4e5e9"} 
        style={{ marginRight: '2px' }}
      />
    ))}
  </span>
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
    
    return (
      <div className="course-description" style={{ position: "relative" }}>
        <p 
          style={{ 
            whiteSpace: "nowrap", 
            overflow: "hidden", 
            textOverflow: "ellipsis",
            margin: 0
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
              {(selectedCategories.length > 0 || selectedDurations.length > 0 || selectedRatings.length > 0) && (
                <span className="ms-1 badge bg-danger">
                  {selectedCategories.length + selectedDurations.length + selectedRatings.length}
                </span>
              )}
            </Button>
          </Col>
        )}
      </Row>
      
      {/* Show how many courses match the current filters */}
      {!isLoading && (
        <Row className="mb-3">
          <Col>
            <p className="text-muted">
              Showing {filteredCourses.length} of {courses.length} courses
              {(selectedCategories.length > 0 || selectedDurations.length > 0 || selectedRatings.length > 0 || searchQuery) && " (filtered)"}
            </p>
          </Col>
        </Row>
      )}

      <Row>
        <motion.div initial={{ width: "100%" }} animate={{ width: showFilters ? "75%" : "100%" }} transition={{ duration: 0.3 }}>
          <Row>
            {isLoading ? (
              <Col className="text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Loading courses...</p>
              </Col>
            ) : error ? (
              <Col className="text-center">
                <div className="alert alert-danger">{error}</div>
              </Col>
            ) : filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <Col key={course._id} md={4} className="mb-4">
                  <Card className="shadow-sm h-100">
                    <Card.Img
                      variant="top"
                      src={getValidThumbnail(course.thumbnail)}
                      alt={course.title}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = defaultImage;
                      }}
                      style={{ height: "200px", objectFit: "cover" }}
                    />
                    <Card.Body className="d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h5 className="mb-0">{course.title}</h5>
                        {wishlistedCourses[course._id] ? (
                          <FaHeart
                            className="text-danger"
                            style={{ cursor: "pointer" }}
                            onClick={(e) => toggleWishlist(course._id, e)}
                          />
                        ) : (
                          <FaRegHeart
                            style={{ cursor: "pointer" }}
                            onClick={(e) => toggleWishlist(course._id, e)}
                          />
                        )}
                      </div>
                      <div 
                        className="description-wrapper" 
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
                      <p><strong>Category:</strong> {getCategoryName(course.category_id)}</p>
                      <p><strong>Duration:</strong> {formatCourseDuration(course._id)}</p>
                      <p><strong>Instructor:</strong> {course.created_by?.user_name || "Unknown"}</p>
                      <p className="mb-0">
                        <strong>Rating:</strong> {' '}
                        <strong style={{ color: "#0056b3", fontSize: "1.1rem" }}>
                          {course.averageRating ? Number(course.averageRating).toFixed(1) : "0.0"}
                        </strong> {' '}
                        {renderStars(course.averageRating || 0)} {' '}
                        <span className="text-muted">({course.totalRatings || 0})</span>
                      </p>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="w-100 mt-auto"
                        onClick={() => navigate(`/courses/courseshow/${course._id}`)}
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
                <div className="alert alert-warning">No courses match your filters. Try adjusting your criteria.</div>
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
                <Button variant="link" className="p-0 text-secondary-emphasis" onClick={() => setShowFilters(false)}>
                  <FaTimes size={20} />
                </Button>
              </div>
              <Accordion alwaysOpen>
                <Accordion.Item eventKey="0">
                  <Accordion.Header>Category</Accordion.Header>
                  <Accordion.Body>
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                        <Form.Check 
                          key={cat._id} 
                          type="checkbox" 
                          label={cat.category_name} 
                          checked={selectedCategories.includes(cat._id)}
                          onChange={() => toggleSelection(cat._id, setSelectedCategories, selectedCategories)}
                        />
                      ))
                    ) : (
                      <p className="text-muted">Loading categories...</p>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="1">
                  <Accordion.Header>Course Duration</Accordion.Header>
                  <Accordion.Body>
                    {durations.map((dur) => (
                      <Form.Check 
                        key={dur.label} 
                        type="checkbox" 
                        label={dur.label}
                        checked={selectedDurations.some(d => d.label === dur.label)}
                        onChange={() => {
                          console.log("Toggling duration:", dur);
                          toggleSelection(dur, setSelectedDurations, selectedDurations);
                        }}
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
                  console.log("Selected durations before reset:", selectedDurations);
                  setSelectedCategories([]);
                  setSelectedDurations([]);
                  setSelectedRatings([]);
                  console.log("Duration filters reset");
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