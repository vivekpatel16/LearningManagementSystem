import React, { useState, useEffect } from "react";
import { Form, Button, Container, Card, Row, Col, Spinner } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUpload, FaBook, FaInfoCircle, FaArrowLeft } from "react-icons/fa";
import Courses_API from "../../Api/courseApi";

const CourseManagement = ({ onUpdateCourses }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const existingCourse = location.state?.course || null;

  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    category_id: "",
    thumbnail: "",
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    setLoading(true);
    Courses_API.get("/category")
      .then((response) => {
        if (response.data && Array.isArray(response.data)) {
          setCategories(response.data);
        } else {
          setCategories([]);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
        setCategories([]);
        setLoading(false);
      });

    if (existingCourse) {
      setNewCourse({
        title: existingCourse.title || "",
        description: existingCourse.description || "",
        category_id: existingCourse.category_id || "",
        thumbnail: existingCourse.thumbnail || "",
      });
      
      if (existingCourse.thumbnail) {
        setImagePreview(existingCourse.thumbnail);
      }
    } else {
      setNewCourse({
        title: "",
        description: "",
        category_id: "",
        thumbnail: "",
      });
      setImagePreview(null);
    }
  }, [location.state]);

  const handleInputChange = (e, field) => {
    setNewCourse({ ...newCourse, [field]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setNewCourse({ ...newCourse, thumbnail: reader.result });
        setImagePreview(reader.result);
      };
    }
  };

  const handleSubmit = async () => {
    if (!newCourse.title || !newCourse.description || !newCourse.category_id || !newCourse.thumbnail) {
      alert("All fields including thumbnail are required.");
      return;
    }

    setSubmitting(true);

    const courseData = {
      title: newCourse.title,
      description: newCourse.description,
      category_id: newCourse.category_id,
      thumbnail: newCourse.thumbnail,
    };

    try {
      let response;
      if (existingCourse) {
        response = await Courses_API.patch(`/${existingCourse._id}`, courseData, {
          headers: { "Content-Type": "application/json" },
        });
      } else {
        response = await Courses_API.post("/", courseData, {
          headers: { "Content-Type": "application/json" },
        });
      }

      if (response.data.data && response.data.data._id) {
        console.log("Course saved successfully:", response.data);
        if (onUpdateCourses) {
          onUpdateCourses(response.data.data);
        }
        
        // Set loading flag in localStorage to trigger skeleton on CourseDetails page
        localStorage.setItem('course_transition_loading', 'true');
        
        // Redirect to CourseDetails after saving the course
        navigate("/instructor/mycourses/coursedetails", { 
          state: { 
            course: response.data.data,
            isNewlyCreated: true // Flag to indicate this is a newly created course
          } 
        });
      } else {
        alert("Course ID not generated. Please try again.");
        setSubmitting(false);
      }
    } catch (error) {
      console.error("Error saving course:", error.response?.data || error.message);
      alert(`Failed to save course: ${error.response?.data?.message || "Unknown error"}`);
      setSubmitting(false); // Reset submitting state if there's an error
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        {/* Skeleton for Header */}
        <div className="w-100 mb-4" style={{ 
          background: 'linear-gradient(135deg, #e9ecef 0%, #f8f9fa 100%)',
          padding: '30px 0',
          borderBottomLeftRadius: '30px',
          borderBottomRightRadius: '30px',
          animation: 'pulse 1.5s infinite ease-in-out'
        }}>
          <Container>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
              <div>
                <div className="skeleton mb-2" style={{ width: '200px', height: '32px', backgroundColor: '#e9ecef', borderRadius: '4px' }}></div>
                <div className="skeleton" style={{ width: '300px', height: '20px', backgroundColor: '#e9ecef', borderRadius: '4px' }}></div>
              </div>
            </div>
          </Container>
        </div>

        <Row>
          <Col lg={8}>
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-header bg-transparent border-0 pt-4 pb-0 px-4">
                <div className="skeleton" style={{ width: '180px', height: '24px', backgroundColor: '#e9ecef', borderRadius: '4px' }}></div>
              </div>
              <div className="card-body p-4">
                {/* Title field skeleton */}
                <div className="mb-4">
                  <div className="skeleton mb-2" style={{ width: '120px', height: '20px', backgroundColor: '#e9ecef', borderRadius: '4px' }}></div>
                  <div className="skeleton" style={{ width: '100%', height: '48px', backgroundColor: '#e9ecef', borderRadius: '10px' }}></div>
                </div>
                
                {/* Description field skeleton */}
                <div className="mb-4">
                  <div className="skeleton mb-2" style={{ width: '100px', height: '20px', backgroundColor: '#e9ecef', borderRadius: '4px' }}></div>
                  <div className="skeleton" style={{ width: '100%', height: '120px', backgroundColor: '#e9ecef', borderRadius: '10px' }}></div>
                </div>
                
                {/* Category field skeleton */}
                <div className="mb-4">
                  <div className="skeleton mb-2" style={{ width: '80px', height: '20px', backgroundColor: '#e9ecef', borderRadius: '4px' }}></div>
                  <div className="skeleton" style={{ width: '100%', height: '48px', backgroundColor: '#e9ecef', borderRadius: '10px' }}></div>
                </div>
              </div>
            </div>
          </Col>
          
          <Col lg={4}>
            {/* Thumbnail skeleton */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-header bg-transparent border-0 pt-4 pb-0 px-4">
                <div className="skeleton" style={{ width: '150px', height: '24px', backgroundColor: '#e9ecef', borderRadius: '4px' }}></div>
              </div>
              <div className="card-body p-4">
                <div className="mb-3 d-flex justify-content-center align-items-center"
                  style={{
                    height: '200px',
                    backgroundColor: '#e9ecef',
                    borderRadius: '10px',
                    animation: 'pulse 1.5s infinite ease-in-out'
                  }}
                ></div>
                
                <div className="d-grid">
                  <div className="skeleton" style={{ width: '100%', height: '45px', backgroundColor: '#e9ecef', borderRadius: '10px' }}></div>
                </div>
              </div>
            </div>

            {/* Action buttons skeleton */}
            <div className="card border-0 shadow-sm rounded-4 mb-4 bg-light">
              <div className="card-body p-4">
                <div className="d-flex align-items-start mb-3">
                  <div className="skeleton me-2" style={{ width: '20px', height: '20px', backgroundColor: '#e9ecef', borderRadius: '50%' }}></div>
                  <div className="skeleton" style={{ width: '90%', height: '40px', backgroundColor: '#e9ecef', borderRadius: '4px' }}></div>
                </div>

                <div className="d-grid mt-4">
                  <div className="skeleton" style={{ width: '100%', height: '48px', backgroundColor: '#e9ecef', borderRadius: '10px' }}></div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
        
        {/* Animation styles */}
        <style jsx="true">{`
          @keyframes pulse {
            0% {
              opacity: 0.6;
            }
            50% {
              opacity: 1;
            }
            100% {
              opacity: 0.6;
            }
          }
          .skeleton {
            animation: pulse 1.5s infinite ease-in-out;
          }
        `}</style>
      </Container>
    );
  }

  return (
    <>
      {/* Header Section */}
      <div className="w-100" style={{ 
        background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
        padding: '30px 0',
        color: 'white',
        borderBottomLeftRadius: '30px',
        borderBottomRightRadius: '30px',
      }}>
        <Container>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
            <div>
              <h2 className="fw-bold mb-0">{existingCourse ? "Edit Course" : "Create New Course"}</h2>
              <p className="text-white-50 mb-0">{existingCourse ? "Update your course details" : "Fill in the details to create your course"}</p>
            </div>
            <Button 
              variant="light" 
              className="d-flex align-items-center mt-3 mt-md-0"
              onClick={() => navigate(-1)}
              style={{ 
                color: '#0062E6', 
                fontWeight: '500', 
                borderRadius: '50px', 
                padding: '8px 16px', 
                border: 'none',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
              }}
            >
              <FaArrowLeft className="me-2" /> Back
            </Button>
          </div>
        </Container>
      </div>

      <Container className="mb-5">
        <Row>
          <Col lg={8}>
            <Card className="border-0 shadow-sm rounded-4 mb-4">
              <Card.Header className="bg-transparent border-0 pt-4 pb-0 px-4">
                <h5 className="mb-0 fw-bold d-flex align-items-center">
                  <FaBook className="text-primary me-2" /> Course Information
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                <Form>
                  <Form.Group className="mb-4">
                    <Form.Label style={{ fontWeight: '500' }}>Course Title</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter an engaging course title"
                      value={newCourse.title}
                      onChange={(e) => handleInputChange(e, "title")}
                      style={{
                        border: '1px solid #e0e0e0',
                        borderRadius: '10px',
                        padding: '12px 15px',
                        boxShadow: 'none'
                      }}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-4">
                    <Form.Label style={{ fontWeight: '500' }}>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      placeholder="Describe what learners will gain from your course"
                      value={newCourse.description}
                      onChange={(e) => handleInputChange(e, "description")}
                      style={{
                        border: '1px solid #e0e0e0',
                        borderRadius: '10px',
                        padding: '12px 15px',
                        boxShadow: 'none'
                      }}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-4">
                    <Form.Label style={{ fontWeight: '500' }}>Category</Form.Label>
                    <Form.Select 
                      value={newCourse.category_id} 
                      onChange={(e) => handleInputChange(e, "category_id")}
                      style={{
                        border: '1px solid #e0e0e0',
                        borderRadius: '10px',
                        padding: '12px 15px',
                        boxShadow: 'none'
                      }}
                    >
                      <option value="">Select a category</option>
                      {categories.length > 0 ? (
                        categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.category_name}
                          </option>
                        ))
                      ) : (
                        <option disabled>No categories available</option>
                      )}
                    </Form.Select>
                  </Form.Group>
                </Form>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={4}>
            <Card className="border-0 shadow-sm rounded-4 mb-4">
              <Card.Header className="bg-transparent border-0 pt-4 pb-0 px-4">
                <h5 className="mb-0 fw-bold d-flex align-items-center">
                  <FaUpload className="text-primary me-2" /> Course Thumbnail
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                <div 
                  className="mb-3 d-flex justify-content-center align-items-center"
                  style={{
                    height: '200px',
                    background: imagePreview ? 'transparent' : 'rgba(0, 98, 230, 0.05)',
                    borderRadius: '10px',
                    border: '1px dashed #0062E6',
                    overflow: 'hidden'
                  }}
                >
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Course thumbnail" 
                      style={{ 
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '10px'
                      }} 
                    />
                  ) : (
                    <div className="text-center p-4">
                      <FaUpload size={30} className="text-primary mb-2" />
                      <p className="mb-0 text-muted">Upload a thumbnail image</p>
                      <small className="text-muted">Recommended size: 1280x720px</small>
                    </div>
                  )}
                </div>
                
                <Form.Group>
                  <div className="d-grid">
                    <label 
                      className="btn"
                      style={{
                        background: 'linear-gradient(135deg, rgba(0, 98, 230, 0.1) 0%, rgba(51, 161, 253, 0.1) 100%)',
                        color: '#0062E6',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                      <FaUpload className="me-2" /> {imagePreview ? 'Change Image' : 'Upload Image'}
                    </label>
                  </div>
                </Form.Group>
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm rounded-4 mb-4 bg-light">
              <Card.Body className="p-4">
                <div className="d-flex align-items-start mb-3">
                  <FaInfoCircle className="text-primary mt-1 me-2" />
                  <p className="mb-0 small" style={{ color: '#5d5d5d' }}>
                    All fields including the thumbnail image are required to create a course.
                  </p>
                </div>

                <div className="d-grid mt-4">
                  {submitting ? (
                    <div className="skeleton-button" style={{
                      height: '48px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #e9ecef 0%, #f8f9fa 100%)',
                      animation: 'pulse 1.5s infinite ease-in-out'
                    }}>
                      <div className="d-flex justify-content-center align-items-center h-100">
                        <div className="skeleton-text" style={{ 
                          width: '180px', 
                          height: '24px', 
                          backgroundColor: '#dee2e6',
                          borderRadius: '4px' 
                        }}></div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      style={{
                        background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px',
                        fontWeight: '600',
                        boxShadow: '0 4px 10px rgba(0, 98, 230, 0.2)',
                        transition: 'all 0.3s ease'
                      }}
                      className="btn-hover-effect"
                      disabled={!newCourse.title || !newCourse.description || !newCourse.category_id || !newCourse.thumbnail}
                    >
                      {existingCourse ? "Update Course" : "Create Course"}
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Custom CSS for hover effects */}
      <style>
        {`
          .btn-hover-effect:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(0, 98, 230, 0.3) !important;
          }
          
          .btn-hover-effect:disabled {
            opacity: 0.7;
            background: linear-gradient(135deg, #94bfef 0%, #b3d5f8 100%) !important;
          }
        `}
      </style>
    </>
  );
};

export default CourseManagement;