import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaPlus, FaSearch } from "react-icons/fa";
import common_API from "../../Api/commonApi";
import Courses_API from "../../Api/courseApi";
import defaultImage from "../../assets/default-course.png";
import { Container, Row, Col, Card, Button, Spinner, Alert, Tooltip, OverlayTrigger, Form, InputGroup, Placeholder } from "react-bootstrap";

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await common_API.get("/courses");
        setCourses(response.data.data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await Courses_API.get("/category");
        setCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCourses();
    fetchCategories();
  }, []);

  const handleEditCourse = (course) => {
    navigate("/instructor/courses", { state: { course } });
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    try {
      const response = await Courses_API.delete(`/${courseId}`);
      if (response.status === 200) {
        alert("Course deleted successfully.");
        setCourses((prevCourses) => prevCourses.filter((course) => course._id !== courseId));
      } else {
        alert("Failed to delete course.");
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("Server error while deleting the course.");
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat._id === categoryId);
    return category ? category.category_name : "Unknown Category";
  };

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

  const truncateDescription = (description, maxLength = 100) => {
    if (!description) return "";

    if (description.length <= maxLength) {
      return description;
    }

    return (
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip>{description}</Tooltip>}
      >
        <span style={{ color: "#666", cursor: "pointer" }}>
          {`${description.substring(0, maxLength)}...`}
        </span>
      </OverlayTrigger>
    );
  };

  // Filter courses based on search term
  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Container fluid className="p-0">
      {/* Header Section */}
      <div className="w-100 mb-4" style={{ 
        background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
        padding: '30px 0',
        color: 'white',
        borderBottomLeftRadius: '30px',
        borderBottomRightRadius: '30px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)'
      }}>
        <Container>
          {/* Title section */}
          <Row className="align-items-center">
            <Col xs={12} md={6}>
              <h1 className="fw-bold mb-0">My Courses</h1>
              <p className="mb-0 opacity-75">Manage and track all your created courses</p>
            </Col>
            
            {/* Search and button in a single row */}
            <Col xs={12} md={6} className="mt-3 mt-md-0">
              <div className="d-flex align-items-center gap-3 justify-content-md-end flex-wrap flex-md-nowrap">
                <InputGroup 
                  className="hero-search"
                  style={{
                    width: "280px",
                    height: "45px",
                    borderRadius: "50px",
                    overflow: "hidden",
                    backgroundColor: "white",
                    marginTop: "20px",
                    boxShadow: "0 3px 10px rgba(0,0,0,0.1)"
                  }}
                >
                  <InputGroup.Text style={{ background: "white", border: "none", paddingLeft: "15px" }}>
                    <FaSearch color="#0062E6" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Find your courses here..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      height: "45px",
                      border: "none",
                      outline: "none",
                      boxShadow: "none",
                      fontSize: "0.95rem",
                      paddingRight: "15px"
                    }}
                    aria-label="Search courses"
                  />
                </InputGroup>
                
                <Button 
                  variant="light" 
                  onClick={() => navigate("/instructor/courses")}
                  className="d-flex align-items-center"
                  style={{ 
                    color: '#0062E6',
                    fontWeight: '600',
                    borderRadius: '50px',
                    padding: '10px 20px',
                    border: 'none',
                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <FaPlus className="me-2" /> Create New Course
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container>
        {loading ? (
          <Row className="g-4">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <Col key={index} md={6} lg={4} className="mb-4">
                <Card className="h-100 shadow-sm border-0" style={{ 
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}>
                  <div style={{ height: "200px", background: '#f0f0f0' }}>
                    <Placeholder as="div" animation="glow" style={{ height: '100%', width: '100%' }}>
                      <Placeholder xs={12} style={{ height: '100%' }} />
                    </Placeholder>
                  </div>
                  <Card.Body className="d-flex flex-column p-4">
                    <Placeholder as={Card.Title} animation="glow">
                      <Placeholder xs={8} />
                      <Placeholder xs={4} />
                    </Placeholder>
                    
                    <Placeholder animation="glow" className="mb-2">
                      <Placeholder xs={4} style={{ 
                        borderRadius: '30px',
                        height: '28px' 
                      }} />
                    </Placeholder>
                    
                    <Placeholder as={Card.Text} animation="glow">
                      <Placeholder xs={12} />
                      <Placeholder xs={10} />
                      <Placeholder xs={8} />
                    </Placeholder>
                    
                    <div className="d-flex justify-content-between mt-auto">
                      <Placeholder.Button 
                        variant="secondary" 
                        xs={5} 
                        style={{ 
                          borderRadius: '50px',
                          height: '38px',
                          opacity: '0.6'
                        }} 
                      />
                      <Placeholder.Button 
                        variant="secondary" 
                        xs={5} 
                        style={{ 
                          borderRadius: '50px',
                          height: '38px',
                          opacity: '0.6'
                        }} 
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : filteredCourses.length === 0 ? (
          <Alert variant="info" className="text-center p-5 border-0 rounded-4 shadow-sm">
            {searchTerm ? (
              <>
                <h4>No courses match your search</h4>
                <p className="mb-0">Try different search terms or clear your search</p>
                <Button 
                  variant="outline-primary" 
                  className="mt-3"
                  onClick={() => setSearchTerm("")}
                  style={{ borderRadius: '50px', padding: '8px 20px' }}
                >
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <h4>No courses available</h4>
                <p className="mb-0">Get started by creating your first course</p>
              </>
            )}
          </Alert>
        ) : (
          <Row className="g-4">
            {filteredCourses.map((course) => (
              <Col key={course._id} md={6} lg={4} className="mb-4">
                <Card className="h-100 shadow-sm border-0" style={{ 
                  borderRadius: '12px', 
                  overflow: 'hidden',
                  transition: 'transform 0.3s, box-shadow 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                }}>
                  <div style={{ height: "200px", overflow: "hidden", position: "relative" }}>
                    <Card.Img
                      variant="top"
                      src={getValidThumbnail(course.thumbnail)}
                      alt={course.title}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = defaultImage;
                      }}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        cursor: "pointer",
                        transition: "transform 0.5s ease"
                      }}
                      onClick={() => navigate("/instructor/mycourses/coursedetails", { state: { course } })}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "scale(1)";
                      }}
                    />
                    <div 
                      style={{ 
                        position: 'absolute', 
                        top: '10px', 
                        right: '10px', 
                        background: course.status ? 'rgba(40, 167, 69, 0.8)' : 'rgba(255, 193, 7, 0.8)', 
                        color: course.status ? 'white' : 'black',
                        borderRadius: '30px',
                        padding: '5px 12px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}
                    >
                      {course.status ? "Active" : "Inactive"}
                    </div>
                  </div>
                  <Card.Body className="d-flex flex-column p-4">
                    <Card.Title
                      style={{ 
                        fontSize: "1.25rem", 
                        cursor: "pointer", 
                        color: "#333", 
                        fontWeight: '600',
                        overflow: "hidden", 
                        textOverflow: "ellipsis", 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: "vertical", 
                        display: "-webkit-box",
                        marginBottom: '12px'
                      }}
                      onClick={() => navigate("/instructor/mycourses/coursedetails", { state: { course } })}
                    >
                      {course.title}
                    </Card.Title>
                    <div className="mb-2" style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '30px',
                      fontSize: '0.8rem',
                      background: 'rgba(0, 98, 230, 0.1)',
                      color: '#0062E6'
                    }}>
                      {getCategoryName(course.category_id)}
                    </div>
                    <Card.Text style={{ color: "#666", marginBottom: "1rem", lineHeight: "1.5" }}>
                      {truncateDescription(course.description, 100)}
                    </Card.Text>
                    <div className="d-flex justify-content-between mt-auto">
                      <Button 
                        variant="outline-primary" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCourse(course);
                        }}
                        style={{ 
                          borderRadius: '50px', 
                          width: '48%',
                          padding: '8px 0',
                          fontWeight: '500',
                          borderColor: '#dee2e6',
                          transition: 'all 0.2s ease'
                        }}
                        className="d-flex align-items-center justify-content-center"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f0f7ff';
                          e.currentTarget.style.borderColor = '#0062E6';
                          e.currentTarget.style.color = '#0062E6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '';
                          e.currentTarget.style.borderColor = '#dee2e6';
                          e.currentTarget.style.color = '#0062E6';
                        }}
                      >
                        <FaEdit className="me-2" /> Edit
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCourse(course._id);
                        }}
                        style={{ 
                          borderRadius: '50px', 
                          width: '48%',
                          padding: '8px 0',
                          fontWeight: '500',
                          borderColor: '#dee2e6',
                          transition: 'all 0.2s ease'
                        }}
                        className="d-flex align-items-center justify-content-center"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fff5f5';
                          e.currentTarget.style.borderColor = '#dc3545';
                          e.currentTarget.style.color = '#dc3545';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '';
                          e.currentTarget.style.borderColor = '#dee2e6';
                          e.currentTarget.style.color = '#dc3545';
                        }}
                      >
                        <FaTrash className="me-2" /> Delete
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>

      {/* Add CSS for placeholder styling */}
      <style jsx="true">{`
        input::placeholder {
          color: #888 !important;
        }
      `}</style>
    </Container>
  );
};

export default CourseList;
