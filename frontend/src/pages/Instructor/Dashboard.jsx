import React, { useState, useEffect, useCallback } from "react"; 
import { Card, Container, Row, Col, Modal, Table, Button, Badge, ProgressBar, Form, Placeholder } from "react-bootstrap";
import { FaChalkboardTeacher, FaBook, FaUserGraduate, FaChartLine, FaPlus, FaSearch, FaEye, FaCalendarAlt, FaLaptop } from "react-icons/fa";
import { 
  FaCode, 
  FaPaintBrush, 
  FaChartBar, 
  FaCalculator, 
  FaLanguage, 
  FaMusic, 
  FaCamera, 
  FaDumbbell, 
  FaBriefcase, 
  FaGraduationCap
} from 'react-icons/fa';
import common_API from "../../Api/commonApi";
import Courses_API from "../../Api/courseApi";

const Dashboard = () => {
  const [showCourses, setShowCourses] = useState(false);
  const [courses, setCourses] = useState([]);
  const [totalEnrolled, setTotalEnrolled] = useState(0);
  const [instructorCoursesCount, setInstructorCoursesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastMonthEnrollments, setLastMonthEnrollments] = useState(0);
  const [courseEnrollments, setCourseEnrollments] = useState({});
  const [courseStatus, setCourseStatus] = useState({});
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch courses data
        const coursesResponse = await common_API.get("/courses"); 
        if (coursesResponse.status === 200 || coursesResponse.status === 202) {
          const coursesResult = coursesResponse.data;
          
          // Add sample categories to courses for testing if they don't have categories
          const coursesWithCategories = (coursesResult.data || []).map((course, index) => {
            // Only add a sample category if the course doesn't have one
            if (!course.category) {
              return {...course, category: getSampleCategory(index)};
            }
            return course;
          });
          
          setCourses(coursesWithCategories);
          setInstructorCoursesCount(coursesResult.instructorCoursesCount || 0); 
          
          // Check if we have stored data in localStorage
          const storedEnrollments = localStorage.getItem('courseEnrollments');
          const storedStatuses = localStorage.getItem('courseStatuses');
          
          if (storedEnrollments && storedStatuses) {
            // Use stored data if available
            const enrollmentData = JSON.parse(storedEnrollments);
            const statusData = JSON.parse(storedStatuses);
            
            // Make sure we have data for all current courses
            let needsUpdate = false;
            
            (coursesWithCategories || []).forEach(course => {
              if (!enrollmentData[course._id]) {
                // If we don't have data for this course, generate it
                enrollmentData[course._id] = Math.floor(Math.random() * 30) + 1;
                needsUpdate = true;
              }
              
              if (!statusData[course._id]) {
                // If we don't have status for this course, generate it
                statusData[course._id] = Math.random() > 0.3 ? 'active' : 'inactive';
                needsUpdate = true;
              }
            });
            
            setCourseEnrollments(enrollmentData);
            setCourseStatus(statusData);
            
            // Save updated data if needed
            if (needsUpdate) {
              localStorage.setItem('courseEnrollments', JSON.stringify(enrollmentData));
              localStorage.setItem('courseStatuses', JSON.stringify(statusData));
            }
          } else {
            // Generate new data if no stored data
            const enrollmentData = {};
            const statusData = {};
            
            (coursesWithCategories || []).forEach(course => {
              // Mock data - in production, this would come from your API
              enrollmentData[course._id] = Math.floor(Math.random() * 30) + 1;
              statusData[course._id] = Math.random() > 0.3 ? 'active' : 'inactive';
            });
            
            setCourseEnrollments(enrollmentData);
            setCourseStatus(statusData);
            
            // Store in localStorage for persistence
            localStorage.setItem('courseEnrollments', JSON.stringify(enrollmentData));
            localStorage.setItem('courseStatuses', JSON.stringify(statusData));
          }
        }

        // Fetch enrolled learners count
        try {
          const learnersResponse = await Courses_API.get("/instructor/enrolled-learners");
          if (learnersResponse.status === 200 && learnersResponse.data.success) {
            setTotalEnrolled(learnersResponse.data.data.totalEnrolledLearners || 0);
            
            // Use persisted value for last month enrollments if available
            const storedLastMonth = localStorage.getItem('lastMonthEnrollments');
            
            if (storedLastMonth) {
              setLastMonthEnrollments(parseInt(storedLastMonth));
            } else {
              // Simulated last month enrollments (would come from API in a real app)
              const newLastMonth = Math.floor(learnersResponse.data.data.totalEnrolledLearners * 0.4);
              setLastMonthEnrollments(newLastMonth);
              localStorage.setItem('lastMonthEnrollments', newLastMonth.toString());
            }
        } else {
            console.error("Invalid response format for enrolled learners:", learnersResponse.data);
            setError("Failed to load enrolled learners count");
          }
        } catch (enrollError) {
          console.error("Error fetching enrolled learners:", enrollError);
          setError("Failed to load enrolled learners count");
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredCourses = courses.filter(course => 
    course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle expanded course
  const toggleCourseExpand = useCallback((courseId) => {
    setExpandedCourseId(prevId => prevId === courseId ? null : courseId);
  }, []);

  // Update the course status change handler to persist to localStorage
  const handleStatusChange = useCallback((e, courseId) => {
    e.stopPropagation();
    setCourseStatus(prevStatus => {
      const newStatus = {...prevStatus};
      newStatus[courseId] = prevStatus[courseId] === 'active' ? 'inactive' : 'active';
      
      // Save to localStorage
      localStorage.setItem('courseStatuses', JSON.stringify(newStatus));
      
      return newStatus;
    });
  }, []);

  const getCategoryIcon = (categoryName) => {
    if (!categoryName) return <FaGraduationCap />;
    
    const category = categoryName.toLowerCase();
    
    // Specific category mapping
    switch(category) {
      case 'software development':
      case 'web development':
      case 'mobile development':
      case 'programming':
        return <FaCode />;
      case 'design':
      case 'ui/ux design':
      case 'graphic design':
        return <FaPaintBrush />;
      case 'business':
      case 'marketing':
      case 'entrepreneurship':
        return <FaBriefcase />;
      case 'data science':
      case 'data analytics':
      case 'machine learning':
        return <FaChartBar />;
      case 'mathematics':
      case 'statistics':
      case 'physics':
        return <FaCalculator />;
      case 'english':
      case 'spanish':
      case 'french':
      case 'language learning':
        return <FaLanguage />;
      case 'music production':
      case 'music theory':
      case 'audio engineering':
        return <FaMusic />;
      case 'photography':
      case 'videography':
      case 'film making':
        return <FaCamera />;
      case 'fitness':
      case 'nutrition':
      case 'health':
        return <FaDumbbell />;
      default:
        // More general category detection if not matched exactly
        if (category.includes('develop') || category.includes('code') || category.includes('programming'))
          return <FaCode />;
        if (category.includes('design') || category.includes('art') || category.includes('creative'))
          return <FaPaintBrush />;
        if (category.includes('business') || category.includes('marketing') || category.includes('management'))
          return <FaBriefcase />;
        if (category.includes('data') || category.includes('analytics') || category.includes('statistics'))
          return <FaChartBar />;
        if (category.includes('math') || category.includes('science') || category.includes('physics'))
          return <FaCalculator />;
        if (category.includes('language') || category.includes('english') || category.includes('spanish'))
          return <FaLanguage />;
        if (category.includes('music') || category.includes('audio') || category.includes('sound'))
          return <FaMusic />;
        if (category.includes('photo') || category.includes('video') || category.includes('film'))
          return <FaCamera />;
        if (category.includes('health') || category.includes('fitness') || category.includes('workout'))
          return <FaDumbbell />;
        
        return <FaGraduationCap />;
    }
  };

  const getCategoryColor = (categoryName) => {
    if (!categoryName) return '#f8f9fa';
    
    const category = categoryName.toLowerCase();
    
    // Specific category mapping
    switch(category) {
      case 'software development':
      case 'web development':
      case 'mobile development':
      case 'programming':
        return 'rgba(25, 135, 84, 0.1)'; // Green
      case 'design':
      case 'ui/ux design':
      case 'graphic design':
        return 'rgba(111, 66, 193, 0.1)'; // Purple
      case 'business':
      case 'marketing':
      case 'entrepreneurship':
        return 'rgba(13, 202, 240, 0.1)'; // Cyan
      case 'data science':
      case 'data analytics':
      case 'machine learning':
        return 'rgba(255, 193, 7, 0.1)'; // Yellow
      case 'mathematics':
      case 'statistics':
      case 'physics':
        return 'rgba(220, 53, 69, 0.1)'; // Red
      case 'english':
      case 'spanish':
      case 'french':
      case 'language learning':
        return 'rgba(13, 110, 253, 0.1)'; // Blue
      case 'music production':
      case 'music theory':
      case 'audio engineering':
        return 'rgba(108, 117, 125, 0.1)'; // Gray
      case 'photography':
      case 'videography':
      case 'film making':
        return 'rgba(25, 135, 84, 0.1)'; // Green
      case 'fitness':
      case 'nutrition':
      case 'health':
        return 'rgba(255, 193, 7, 0.1)'; // Yellow
      default:
        // More general category detection if not matched exactly
        if (category.includes('develop') || category.includes('code') || category.includes('programming'))
          return 'rgba(25, 135, 84, 0.1)'; // Green
        if (category.includes('design') || category.includes('art') || category.includes('creative'))
          return 'rgba(111, 66, 193, 0.1)'; // Purple
        if (category.includes('business') || category.includes('marketing') || category.includes('management'))
          return 'rgba(13, 202, 240, 0.1)'; // Cyan
        if (category.includes('data') || category.includes('analytics') || category.includes('statistics'))
          return 'rgba(255, 193, 7, 0.1)'; // Yellow
        if (category.includes('math') || category.includes('science') || category.includes('physics'))
          return 'rgba(220, 53, 69, 0.1)'; // Red
        if (category.includes('language') || category.includes('english') || category.includes('spanish'))
          return 'rgba(13, 110, 253, 0.1)'; // Blue
        if (category.includes('music') || category.includes('audio') || category.includes('sound'))
          return 'rgba(108, 117, 125, 0.1)'; // Gray
        if (category.includes('photo') || category.includes('video') || category.includes('film'))
          return 'rgba(25, 135, 84, 0.1)'; // Green
        if (category.includes('health') || category.includes('fitness') || category.includes('workout'))
          return 'rgba(255, 193, 7, 0.1)'; // Yellow
        
        return 'rgba(13, 110, 253, 0.05)'; // Light blue default
    }
  };

  // Add this function to generate a realistic sample category
  const getSampleCategory = (index) => {
    const categories = [
      'Software Development',
      'Web Development',
      'Business',
      'Marketing',
      'Data Science',
      'Design',
      'Language Learning',
      'Music Production',
      'Photography',
      'Health & Fitness'
    ];
    return categories[index % categories.length];
  };

  const renderSkeletonDashboard = () => (
    <>
      {/* Header Skeleton */}
      <div className="w-100" style={{ 
        background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
        padding: '30px 0',
        color: 'white',
        borderBottomLeftRadius: '30px',
        borderBottomRightRadius: '30px',
        marginBottom: '25px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)'
      }}>
        <Container>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
            <div className="mb-3 mb-md-0">
              <h1 className="fw-bold mb-0">Instructor Dashboard</h1>
              <p className="mb-0 opacity-75">Track your courses and learner engagement</p>
            </div>
          </div>
        </Container>
      </div>

      {/* Stats Cards Skeleton */}
      <Container>
        <Row className="g-4 mb-4">
          {[1, 2, 3, 4].map((_, index) => (
            <Col lg={3} md={6} sm={6} key={index}>
              <Card className="border-0 shadow-sm h-100 rounded-4">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div style={{ 
                      width: '45px', 
                      height: '45px', 
                      borderRadius: '12px', 
                      background: 'rgba(0, 98, 230, 0.1)',
                    }} className="d-flex justify-content-center align-items-center me-3">
                    </div>
                    <div>
                      <Placeholder animation="glow">
                        <Placeholder xs={5} bg="light" />
                      </Placeholder>
                    </div>
                  </div>
                  <Placeholder animation="glow" className="mt-2">
                    <Placeholder xs={3} size="lg" bg="light" />
                  </Placeholder>
                  <Placeholder animation="glow" className="mt-2">
                    <Placeholder xs={8} size="sm" bg="light" />
                  </Placeholder>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Recent Courses Skeleton */}
        <Card className="border-0 shadow-sm rounded-4 mb-4">
          <Card.Header className="bg-transparent border-0 pt-4 pb-0 px-4">
            <div className="d-flex justify-content-between align-items-center">
              <Placeholder animation="glow">
                <Placeholder xs={3} bg="light" />
              </Placeholder>
            </div>
          </Card.Header>
          <Card.Body className="px-4">
            <Table responsive className="table align-middle">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <Placeholder animation="glow">
                      <Placeholder xs={1} bg="light" />
                    </Placeholder>
                  </th>
                  <th>
                    <Placeholder animation="glow">
                      <Placeholder xs={3} bg="light" />
                    </Placeholder>
                  </th>
                  <th>
                    <Placeholder animation="glow" className="d-flex align-items-center">
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        backgroundColor: 'rgba(0, 98, 230, 0.05)', 
                        borderRadius: '50%',
                        marginRight: '10px'
                      }}></div>
                      <Placeholder xs={1} bg="light" />
                    </Placeholder>
                  </th>
                  <th>
                    <Placeholder animation="glow" className="d-flex align-items-center">
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        backgroundColor: 'rgba(0, 98, 230, 0.05)', 
                        borderRadius: '50%',
                        marginRight: '10px'
                      }}></div>
                      <Placeholder xs={1} bg="light" />
                    </Placeholder>
                  </th>
                  <th>
                    <Placeholder animation="glow" className="d-flex align-items-center">
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        backgroundColor: 'rgba(25, 135, 84, 0.05)', 
                        borderRadius: '50%',
                        marginRight: '10px'
                      }}></div>
                      <Placeholder xs={1} bg="light" />
                    </Placeholder>
                  </th>
                  <th className="text-end">
                    <Placeholder animation="glow">
                      <Placeholder xs={2} bg="light" />
                    </Placeholder>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((_, index) => (
                  <tr key={index}>
                    <td>
                      <Placeholder animation="glow">
                        <Placeholder xs={1} bg="light" />
                      </Placeholder>
                    </td>
                    <td>
                      <Placeholder animation="glow">
                        <Placeholder xs={7} bg="light" />
                      </Placeholder>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div 
                          style={{ 
                            width: '28px', 
                            height: '28px', 
                            backgroundColor: 'rgba(0, 98, 230, 0.05)', 
                            borderRadius: '6px',
                            marginRight: '10px'
                          }}
                        ></div>
                        <Placeholder animation="glow">
                          <Placeholder xs={4} bg="light" />
                        </Placeholder>
                      </div>
                    </td>
                    <td>
                      <Placeholder animation="glow" className="d-flex align-items-center">
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          backgroundColor: 'rgba(0, 98, 230, 0.05)', 
                          borderRadius: '50%',
                          marginRight: '10px'
                        }}></div>
                        <Placeholder xs={1} bg="light" />
                      </Placeholder>
                    </td>
                    <td>
                      <Placeholder animation="glow" className="d-flex align-items-center">
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          backgroundColor: 'rgba(25, 135, 84, 0.05)', 
                          borderRadius: '50%',
                          marginRight: '10px'
                        }}></div>
                        <Placeholder xs={1} bg="light" />
                      </Placeholder>
                    </td>
                    <td className="text-end">
                      <Placeholder animation="glow">
                        <Placeholder xs={2} bg="light" />
                      </Placeholder>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Container>
    </>
  );

  if (loading) {
    return renderSkeletonDashboard();
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
        marginBottom: '25px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)'
      }}>
        <Container>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
            <div className="mb-3 mb-md-0">
              <h1 className="fw-bold mb-0">Instructor Dashboard</h1>
              <p className="mb-0 opacity-75">Track your courses and learner engagement</p>
            </div>
            <Button 
              variant="light" 
              className="d-flex align-items-center gap-2" 
              style={{
                color: '#0062E6',
                fontWeight: '600',
                borderRadius: '50px',
                padding: '10px 20px',
                border: 'none',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
              }}
              href="/instructor/courses"
            >
              <FaPlus /> Create New Course
            </Button>
          </div>
        </Container>
      </div>

      {error ? (
        <Container>
          <div className="alert alert-danger">{error}</div>
        </Container>
      ) : (
        <Container>
          {/* Stats Cards */}
          <Row className="g-4 mb-4">
            <Col lg={4} md={6} sm={6}>
              <Card className="border-0 shadow-sm h-100 rounded-4">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div style={{ 
                      width: '45px', 
                      height: '45px', 
                      borderRadius: '12px', 
                      background: 'linear-gradient(135deg, rgba(0, 98, 230, 0.1) 0%, rgba(51, 161, 253, 0.1) 100%)',
                    }} className="d-flex justify-content-center align-items-center me-3">
                      <FaBook className="text-primary" size={20} />
                    </div>
                    <div>
                      <p className="text-muted mb-0" style={{ fontSize: '14px' }}>Total Courses</p>
                    </div>
                  </div>
                  <h3 className="fw-bold mb-1">{instructorCoursesCount}</h3>
                  <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                    {instructorCoursesCount === 0 ? 'No courses yet' : instructorCoursesCount === 1 ? '1 course published' : `${instructorCoursesCount} courses published`}
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6} sm={6}>
              <Card className="border-0 shadow-sm h-100 rounded-4">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div style={{ 
                      width: '45px', 
                      height: '45px', 
                      borderRadius: '12px', 
                      background: 'linear-gradient(135deg, rgba(25, 135, 84, 0.1) 0%, rgba(66, 183, 131, 0.1) 100%)',
                    }} className="d-flex justify-content-center align-items-center me-3">
                      <FaUserGraduate className="text-success" size={20} />
                    </div>
                <div>
                      <p className="text-muted mb-0" style={{ fontSize: '14px' }}>Total Enrollments</p>
                    </div>
                </div>
                  <h3 className="fw-bold mb-1">{totalEnrolled}</h3>
                  <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                    {totalEnrolled > 0 ? 'Across all your courses' : 'No learners enrolled yet'}
                  </p>
              </Card.Body>
            </Card>
          </Col>
            <Col lg={4} md={6} sm={6}>
              <Card className="border-0 shadow-sm h-100 rounded-4">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div style={{ 
                      width: '45px', 
                      height: '45px', 
                      borderRadius: '12px', 
                      background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 213, 79, 0.1) 100%)',
                    }} className="d-flex justify-content-center align-items-center me-3">
                      <FaChartLine className="text-warning" size={20} />
                    </div>
                <div>
                      <p className="text-muted mb-0" style={{ fontSize: '14px' }}>New Enrollments</p>
                    </div>
                </div>
                  <h3 className="fw-bold mb-1">{lastMonthEnrollments}</h3>
                  <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                    Last 30 days
                  </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

          {/* Recent Courses */}
          <Card className="border-0 shadow-sm rounded-4 mb-4">
            <Card.Header className="bg-transparent border-0 pt-4 pb-0 px-4">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">Your Courses</h5>
                <div className="d-flex gap-2">
                  <div className="position-relative">
                    <Form.Control
                      className="rounded-pill pe-5"
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        fontSize: '14px',
                        border: '1px solid #e0e0e0',
                        paddingLeft: '15px',
                        paddingRight: '40px',
                        boxShadow: 'none'
                      }}
                    />
                    <FaSearch style={{ 
                      position: 'absolute', 
                      right: '15px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: '#0062E6',
                      fontSize: '14px',
                      opacity: '0.5'
                    }} />
                  </div>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="px-4">
              {courses.length > 0 ? (
                <Table responsive className="table align-middle">
            <thead>
              <tr>
                      <th style={{ width: '40px' }}>#</th>
                <th>Course Name</th>
                <th>Category</th>
                      <th>Enrollments</th>
                      <th>Completed</th>
                      <th className="text-end">Status</th>
              </tr>
            </thead>
            <tbody>
                    {filteredCourses.slice(0, 5).map((course, index) => (
                      <React.Fragment key={course._id || index}>
                        <tr 
                          onClick={() => toggleCourseExpand(course._id || index)}
                          style={{ cursor: 'pointer' }}
                        >
                    <td>{index + 1}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div 
                                className="rounded" 
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  background: `linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)`,
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: '600',
                                  marginRight: '12px'
                                }}
                              >
                                {course.title?.charAt(0).toUpperCase() || 'C'}
                              </div>
                              <div>
                                <p className="mb-0 fw-medium">{course.title}</p>
                                <small className="text-muted" style={{ fontSize: '12px' }}>
                                  <FaCalendarAlt className="me-1" style={{ fontSize: '10px' }} />
                                  Added {new Date().toLocaleDateString()}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div 
                                style={{ 
                                  width: '28px', 
                                  height: '28px', 
                                  backgroundColor: getCategoryColor(course.category), 
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginRight: '10px',
                                  color: '#0062E6'
                                }}
                              >
                                {getCategoryIcon(course.category)}
                              </div>
                              <span className="fw-medium" style={{ fontSize: '14px' }}>
                                {course.category || 'General'}
                                {!course.category && console.log('Missing category for course:', course)}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="d-flex align-items-center">
                                <div className="d-flex align-items-center justify-content-center" 
                                  style={{ 
                                    width: '32px', 
                                    height: '32px', 
                                    backgroundColor: 'rgba(0, 98, 230, 0.1)', 
                                    borderRadius: '50%',
                                    marginRight: '10px'
                                  }}
                                >
                                  <FaUserGraduate size={14} color="#0062E6" />
                                </div>
                                <p className="mb-0 fw-medium" style={{ fontSize: '15px' }}>
                                  {courseEnrollments[course._id] || 0}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="d-flex align-items-center justify-content-center" 
                                style={{ 
                                  width: '32px', 
                                  height: '32px', 
                                  backgroundColor: 'rgba(25, 135, 84, 0.1)', 
                                  borderRadius: '50%',
                                  marginRight: '10px'
                                }}
                              >
                                <FaGraduationCap size={14} color="#198754" />
                              </div>
                              <p className="mb-0 fw-medium" style={{ fontSize: '15px' }}>
                                {Math.floor(courseEnrollments[course._id] * 0.7) || 0}
                              </p>
                            </div>
                          </td>
                          <td className="text-end">
                            <Badge 
                              bg={courseStatus[course._id] === 'active' ? "success" : "danger"} 
                              style={{ 
                                fontWeight: '500', 
                                fontSize: '12px', 
                                padding: '5px 10px' 
                              }}
                            >
                              {courseStatus[course._id] === 'active' ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                  </tr>
                        {expandedCourseId === (course._id || index) && (
                          <tr>
                            <td colSpan="5" style={{ backgroundColor: 'rgba(0, 98, 230, 0.03)' }}>
                              <div className="p-3">
                                <h6 className="mb-2 text-primary">Course Details</h6>
                                <Row>
                                  <Col md={8}>
                                    <p className="mb-2"><strong>Description:</strong> {course.description || 'No description available'}</p>
                                    <p className="mb-0"><strong>Duration:</strong> {course.duration || '8 weeks'}</p>
                                    <p className="mb-2">
                                      <strong>Category:</strong>{' '}
                                      <Badge 
                                        className="d-flex align-items-center gap-1 ms-1"
                                        style={{ 
                                          backgroundColor: getCategoryColor(course.category),
                                          color: '#495057',
                                          fontWeight: '500', 
                                          fontSize: '12px', 
                                          padding: '5px 10px',
                                          border: 'none',
                                          display: 'inline-flex'
                                        }}
                                      >
                                        <span style={{ fontSize: '10px' }}>{getCategoryIcon(course.category)}</span>
                                        {course.category || 'General'}
                                      </Badge>
                                    </p>
                                  </Col>
                                  <Col md={4} className="text-md-end mt-3 mt-md-0">
                                    <Button 
                                      variant="outline-primary" 
                                      size="sm" 
                                      className="me-2"
                                      href={`/edit-course/${course._id}`}
                                    >
                                      Edit Course
                                    </Button>
                                    <Button 
                                      variant={courseStatus[course._id] === 'active' ? "outline-danger" : "outline-success"} 
                                      size="sm"
                                      onClick={(e) => handleStatusChange(e, course._id)}
                                    >
                                      {courseStatus[course._id] === 'active' ? "Deactivate" : "Activate"}
                                    </Button>
                                  </Col>
                                </Row>
                                <hr className="my-3" />
                                <div className="d-flex justify-content-between align-items-center">
                                  <h6 className="mb-0 text-primary">Enrolled Learners ({courseEnrollments[course._id] || 0})</h6>
                                  <Button 
                                    variant="link" 
                                    className="p-0 text-decoration-none"
                                    href={`/course-analytics/${course._id}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    View All Stats
                                  </Button>
                                </div>
                                {courseEnrollments[course._id] > 0 ? (
                                  <div className="mt-3">
                                    <div className="d-flex gap-1 mb-2">
                                      {Array(Math.min(5, courseEnrollments[course._id])).fill().map((_, i) => (
                                        <div 
                                          key={i}
                                          className="rounded-circle"
                                          style={{
                                            width: '32px',
                                            height: '32px',
                                            background: `hsl(${(i * 60) % 360}, 70%, 60%)`,
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: '600',
                                            fontSize: '12px'
                                          }}
                                        >
                                          {String.fromCharCode(65 + i)}
                                        </div>
                                      ))}
                                      {courseEnrollments[course._id] > 5 && (
                                        <div 
                                          className="rounded-circle"
                                          style={{
                                            width: '32px',
                                            height: '32px',
                                            background: '#f0f0f0',
                                            color: '#666',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: '600',
                                            fontSize: '12px'
                                          }}
                                        >
                                          +{courseEnrollments[course._id] - 5}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-muted mt-2 mb-0">No learners enrolled in this course yet.</p>
                                )}
                              </div>
                  </td>
                </tr>
              )}
                      </React.Fragment>
                    ))}
            </tbody>
          </Table>
              ) : (
                <div className="text-center py-5">
                  <div 
                    className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: '70px',
                      height: '70px',
                      background: 'rgba(0, 98, 230, 0.1)'
                    }}
                  >
                    <FaBook size={24} color="#0062E6" />
                  </div>
                  <h5>No courses added yet</h5>
                  <p className="text-muted">Create your first course to start teaching</p>
                  <Button 
                    variant="primary" 
                    className="rounded-pill" 
                    style={{ 
                      background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
                      border: 'none',
                      padding: '10px 20px'
                    }}
                    href="/instructor/courses"
                  >
                    <FaPlus className="me-2" /> Create New Course
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
    </Container>
      )}

      {/* Custom CSS for hover effects */}
      <style>
        {`
          tbody tr:hover {
            background-color: rgba(0, 98, 230, 0.03) !important;
          }
        `}
      </style>
    </>
  );
};

export default Dashboard;