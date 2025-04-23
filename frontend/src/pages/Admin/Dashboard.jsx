import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Spinner, Alert, Placeholder } from "react-bootstrap";
import { FaUsers, FaBook, FaUserGraduate, FaChalkboardTeacher, FaChartBar, FaEllipsisH, FaUserCog, FaList, FaFileAlt } from "react-icons/fa";
import common_API from "../../Api/commonApi";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalInstructors, setTotalInstructors] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [activeLearners, setActiveLearners] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found. Please log in.");
          setError("Authentication error. Please log in again.");
          return;
        }

        const response = await common_API.get("/courses");

        if (response.data) {
          setTotalUsers(response.data.totalUser || 0);
          setTotalInstructors(response.data.totalInstructor || 0);
          setTotalCourses(response.data.allCourses || 0);
          setActiveLearners(response.data.activeLearnersCount || 0);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error.response?.data || error.message);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate percentages for visualization
  const activeUserPercentage = totalUsers > 0 ? Math.round((activeLearners / totalUsers) * 100) : 0;
  const instructorPercentage = totalUsers > 0 ? Math.round((totalInstructors / totalUsers) * 100) : 0;
  const learnerPercentage = 100 - instructorPercentage; // Calculate learner percentage explicitly

  // Quick access links
  const quickLinks = [
    { title: "User Management", icon: <FaUserCog />, path: "/admin/users", color: "#0062E6" },
    { title: "Course Management", icon: <FaList />, path: "/admin/courses", color: "#6f42c1" },
    { title: "Categories", icon: <FaBook />, path: "/admin/categories", color: "#28a745" },
    { title: "Reports", icon: <FaFileAlt />, path: "/admin/reports", color: "#ff8b00" }
  ];

  return (
    <>
      {/* Full width header section */}
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
          <div className="d-flex flex-column">
            <h1 className="fw-bold mb-1">Admin Dashboard</h1>
            <p className="mb-0 opacity-75">Welcome back! Here's a summary of your platform stats</p>
          </div>
        </Container>
      </div>

      <Container className="pb-5">
        {loading ? (
          <>
            {/* Skeleton loading for main stats section */}
            <Row className="mb-4 g-3">
              {Array(4).fill().map((_, index) => (
                <Col key={index} lg={3} md={6}>
                  <Card className="border-0 shadow-sm h-100 rounded-4 position-relative overflow-hidden">
                    <div className="position-absolute" style={{
                      background: 'rgba(0, 98, 230, 0.05)',
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      top: '-20px',
                      right: '-20px'
                    }}></div>
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div style={{
                          background: 'rgba(0, 98, 230, 0.1)',
                          width: '50px',
                          height: '50px',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <div style={{ width: 22, height: 22, background: 'rgba(0, 98, 230, 0.2)', borderRadius: '4px' }}></div>
                        </div>
                      </div>
                      <Placeholder as="h2" animation="glow" className="mb-0">
                        <Placeholder xs={6} bg="light" />
                      </Placeholder>
                      <Placeholder animation="glow" className="mb-0 mt-1">
                        <Placeholder xs={8} bg="light" />
                      </Placeholder>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
            
            {/* Skeleton loading for quick access section */}
            <Row className="g-4 mb-4">
              <Col>
                <Card className="border-0 shadow-sm rounded-4 h-100">
                  <Card.Header className="bg-transparent border-0 pt-4 pb-0 px-4">
                    <h5 className="fw-bold mb-0">Quick Access</h5>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <Row className="g-3">
                      {Array(4).fill().map((_, index) => (
                        <Col key={index} md={6} lg={3}>
                          <Card 
                            className="border-0 shadow-sm mb-0 h-100"
                            style={{ borderRadius: '12px', opacity: 0.7 }}
                          >
                            <Card.Body className="p-3">
                              <div className="d-flex align-items-center">
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '10px',
                                  background: 'rgba(0, 0, 0, 0.07)',
                                  marginRight: '12px'
                                }}></div>
                                <Placeholder animation="glow" className="mb-0 flex-grow-1">
                                  <Placeholder xs={8} bg="light" />
                                </Placeholder>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            {/* Skeleton loading for platform summary card */}
            <Card className="border-0 shadow-sm rounded-4 mt-4 overflow-hidden">
              <div className="p-4" style={{
                background: 'linear-gradient(135deg, rgba(0, 98, 230, 0.05) 0%, rgba(51, 161, 253, 0.05) 100%)'
              }}>
                <Row className="align-items-center">
                  <Col md={8}>
                    <Placeholder animation="glow">
                      <Placeholder xs={6} bg="light" className="mb-2" />
                      <Placeholder xs={8} bg="light" />
                    </Placeholder>
                  </Col>
                  <Col md={4} className="text-md-end">
                    <Placeholder.Button animation="glow" variant="light" style={{ width: '150px', borderRadius: '50px' }} />
                  </Col>
                </Row>
              </div>
            </Card>
          </>
        ) : error ? (
          <Alert variant="danger" className="m-4 rounded-3 shadow-sm border-0">
            {error}
          </Alert>
        ) : (
          <>
            {/* Main stats section */}
            <Row className="mb-4 g-3">
              <Col lg={3} md={6}>
                <Card className="border-0 shadow-sm h-100 rounded-4 position-relative overflow-hidden">
                  <div className="position-absolute" style={{
                    background: 'rgba(0, 98, 230, 0.05)',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    top: '-20px',
                    right: '-20px'
                  }}></div>
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div style={{
                        background: 'rgba(0, 98, 230, 0.1)',
                        width: '50px',
                        height: '50px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FaUsers size={22} color="#0062E6" />
                      </div>
                    </div>
                    <h2 className="fw-bold mb-0">{totalUsers}</h2>
                    <p className="text-muted mb-0">Total Users</p>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={3} md={6}>
                <Card className="border-0 shadow-sm h-100 rounded-4 position-relative overflow-hidden">
                  <div className="position-absolute" style={{
                    background: 'rgba(111, 66, 193, 0.05)',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    top: '-20px',
                    right: '-20px'
                  }}></div>
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div style={{
                        background: 'rgba(111, 66, 193, 0.1)',
                        width: '50px',
                        height: '50px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FaChalkboardTeacher size={22} color="#6f42c1" />
                      </div>
                    </div>
                    <h2 className="fw-bold mb-0">{totalInstructors}</h2>
                    <p className="text-muted mb-0">Total Instructors</p>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={3} md={6}>
                <Card className="border-0 shadow-sm h-100 rounded-4 position-relative overflow-hidden">
                  <div className="position-absolute" style={{
                    background: 'rgba(40, 167, 69, 0.05)',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    top: '-20px',
                    right: '-20px'
                  }}></div>
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div style={{
                        background: 'rgba(40, 167, 69, 0.1)',
                        width: '50px',
                        height: '50px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FaBook size={22} color="#28a745" />
                      </div>
                    </div>
                    <h2 className="fw-bold mb-0">{totalCourses}</h2>
                    <p className="text-muted mb-0">Total Courses</p>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={3} md={6}>
                <Card className="border-0 shadow-sm h-100 rounded-4 position-relative overflow-hidden">
                  <div className="position-absolute" style={{
                    background: 'rgba(255, 139, 0, 0.05)',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    top: '-20px',
                    right: '-20px'
                  }}></div>
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div style={{
                        background: 'rgba(255, 139, 0, 0.1)',
                        width: '50px',
                        height: '50px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FaUserGraduate size={22} color="#ff8b00" />
                      </div>
                    </div>
                    <h2 className="fw-bold mb-0">{activeLearners}</h2>
                    <p className="text-muted mb-0">Active Learners</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Quick Links & Charts */}
            <Row className="g-4 mb-4">
              <Col>
                <Card className="border-0 shadow-sm rounded-4 h-100">
                  <Card.Header className="bg-transparent border-0 pt-4 pb-0 px-4">
                    <h5 className="fw-bold mb-0">Quick Access</h5>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <Row className="g-3">
                      {quickLinks.map((link, index) => (
                        <Col key={index} md={6} lg={3}>
                          <Link 
                            to={link.path}
                            className="text-decoration-none"
                          >
                            <Card 
                              className="border-0 shadow-sm mb-0 h-100 quick-access-card"
                              style={{ borderRadius: '12px' }}
                            >
                              <Card.Body className="p-3">
                                <div className="d-flex align-items-center">
                                  <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: `rgba(${link.color === '#0062E6' ? '0, 98, 230' : 
                                                 link.color === '#6f42c1' ? '111, 66, 193' : 
                                                 link.color === '#28a745' ? '40, 167, 69' : 
                                                 '255, 139, 0'}, 0.1)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: link.color,
                                    marginRight: '12px'
                                  }}>
                                    {link.icon}
                                  </div>
                                  <div>
                                    <h6 className="mb-0" style={{ color: '#495057' }}>{link.title}</h6>
                                  </div>
                                  <div className="ms-auto">
                                    <FaEllipsisH className="text-muted" />
                                  </div>
                                </div>
                              </Card.Body>
                            </Card>
                          </Link>
                        </Col>
                      ))}
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Platform Summary Card */}
            <Card className="border-0 shadow-sm rounded-4 mt-4 overflow-hidden">
              <div className="p-4" style={{
                background: 'linear-gradient(135deg, rgba(0, 98, 230, 0.05) 0%, rgba(51, 161, 253, 0.05) 100%)'
              }}>
                <Row className="align-items-center">
                  <Col md={8}>
                    <h5 className="mb-1">Need to generate a detailed report?</h5>
                    <p className="mb-md-0 text-muted">Create comprehensive reports on platform activity and user engagement</p>
                  </Col>
                  <Col md={4} className="text-md-end">
                    <Link to="/admin/reports">
                      <Button 
                        className="rounded-pill px-4 py-2" 
                        style={{
                          background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
                          border: 'none',
                          boxShadow: '0 4px 10px rgba(0, 98, 230, 0.2)'
                        }}
                      >
                        Generate Reports
                      </Button>
                    </Link>
                  </Col>
                </Row>
              </div>
            </Card>
          </>
        )}
      </Container>

      <style>
        {`
          .quick-access-card {
            transition: all 0.3s ease;
          }
          .quick-access-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
          }
        `}
      </style>
    </>
  );
};

export default Dashboard;