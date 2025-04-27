import React, { useEffect, useState } from "react";
import { Container, Table, Button, Badge, Card, Form, InputGroup, Spinner, Alert, Placeholder } from "react-bootstrap";
import { FaToggleOn, FaToggleOff, FaSearch, FaBook } from "react-icons/fa";
import common_API from "../../Api/commonApi";
import Admin_API from "../../Api/adminApi";

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // Admin should see all courses, including inactive ones
      const response = await common_API.get("/courses", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setCourses(response.data.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setError("Failed to fetch courses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredCourses = courses.filter((course) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      course.title.toLowerCase().includes(searchLower) ||
      (course.created_by?.user_name || "").toLowerCase().includes(searchLower) ||
      (course.status ? "active" : "inactive").includes(searchLower) ||
      course.description?.toLowerCase().includes(searchLower) ||
      course.category?.toLowerCase().includes(searchLower)
    );
  });
  
  const toggleStatus = async (_id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const response = await Admin_API.patch(`/course-status/${_id}`,
        { status: newStatus },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
  
      if (response.data.success) {
        setCourses((prevCourses) =>
          prevCourses.map((course) =>
            course._id === _id ? { ...course, status: newStatus } : course
          )
        );
      } else {
        console.error("Failed to update course status");
      }
    } catch (error) {
      console.error("Error updating course status:", error);
    }
  };
  
  if (loading) {
  return (
      <>
        {/* Full width header section - always show this */}
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
                <h1 className="fw-bold mb-0">Course Management</h1>
                <p className="mb-0 opacity-75">Manage course status and visibility</p>
              </div>
              {/* Desktop search - hidden on mobile - disabled during loading */}
              <div className="d-none d-md-flex position-relative">
                <div className="position-relative">
                  <Form.Control
                    disabled
                    className="search-placeholder"
                    placeholder="Search by title, instructor..."
                    style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      border: 'none',
                      borderRadius: '50px',
                      padding: '10px 20px',
                      paddingLeft: '45px',
                      width: '280px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    left: '16px',
                    top: '0',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FaSearch color="#0062E6" fontSize="14px" opacity="0.5" />
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </div>

        {/* Mobile search - only visible on mobile */}
        <Container className="d-md-none mb-4">
          <div className="position-relative">
            <Form.Control
              className="search-placeholder"
              placeholder="Search by title, instructor..."
              value={searchTerm}
              onChange={handleSearch}
              style={{
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '50px',
                padding: '10px 20px',
                paddingLeft: '45px',
                height: '48px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}
            />
            <div style={{
              position: 'absolute',
              left: '16px',
              top: '0',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FaSearch color="#0062E6" fontSize="14px" />
            </div>
          </div>
        </Container>

        {/* Skeleton for course table */}
        <Container className="mb-4">
          <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead style={{ 
                  background: 'linear-gradient(to right, rgba(0, 98, 230, 0.08), rgba(51, 161, 253, 0.08))',
                  borderBottom: '2px solid rgba(0, 98, 230, 0.1)'
                }}>
                  <tr>
                    <th style={{ 
                      padding: '18px 25px', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Index</th>
                    <th style={{ 
                      padding: '18px 25px', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Course Name</th>
                    <th style={{ 
                      padding: '18px 25px', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Instructor</th>
                    <th style={{ 
                      padding: '18px 25px', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px',
                      textAlign: 'center'
                    }}>Status</th>
                    <th style={{ 
                      width: '180px', 
                      padding: '18px 25px', 
                      textAlign: 'center', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array(5).fill().map((_, index) => (
                    <tr key={index} style={{ 
                      backgroundColor: index % 2 === 0 ? 'white' : 'rgba(0, 98, 230, 0.01)'
                    }}>
                      <td style={{ padding: '18px 25px' }}>
                        <Placeholder animation="glow">
                          <Placeholder xs={1} bg="light" />
                        </Placeholder>
                      </td>
                      <td style={{ padding: '18px 25px' }}>
                        <div className="d-flex align-items-center">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(0, 98, 230, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '10px'
                          }}>
                            <div style={{ width: 14, height: 14, borderRadius: '2px', background: 'rgba(0, 98, 230, 0.2)' }}></div>
                          </div>
                          <Placeholder animation="glow" className="mb-0 flex-grow-1">
                            <Placeholder xs={8} bg="light" />
                          </Placeholder>
                        </div>
                      </td>
                      <td style={{ padding: '18px 25px' }}>
                        <Placeholder animation="glow">
                          <Placeholder xs={6} bg="light" />
                        </Placeholder>
                      </td>
                      <td style={{ padding: '18px 25px', textAlign: 'center' }}>
                        <div className="d-flex justify-content-center">
                          <div style={{
                            width: '70px', 
                            height: '24px', 
                            borderRadius: '30px', 
                            background: 'rgba(0, 0, 0, 0.05)'
                          }}></div>
                        </div>
                      </td>
                      <td style={{ padding: '18px 25px' }}>
                        <div className="d-flex justify-content-center">
                          <div style={{
                            width: '100px', 
                            height: '30px', 
                            borderRadius: '6px', 
                            background: 'rgba(0, 0, 0, 0.05)'
                          }}></div>
                        </div>
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
  }
  
  return (
    <>
      <style>
        {`
          .btn-hover-effect:hover {
            background: linear-gradient(135deg, #0056CD 0%, #2B8AD9 100%) !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 10px rgba(0, 98, 230, 0.2);
          }
          
          .activate-btn-hover:hover {
            background: rgba(40, 167, 69, 0.15) !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 10px rgba(40, 167, 69, 0.1);
          }
          
          .deactivate-btn-hover:hover {
            background: rgba(220, 53, 69, 0.15) !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 10px rgba(220, 53, 69, 0.1);
          }
          
          tbody tr:hover {
            background-color: rgba(0, 98, 230, 0.03) !important;
          }
        `}
      </style>
      
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
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
            <div className="mb-3 mb-md-0">
              <h1 className="fw-bold mb-0">Course Management</h1>
              <p className="mb-0 opacity-75">Manage course status and visibility</p>
            </div>
            {/* Desktop search - hidden on mobile */}
            <div className="d-none d-md-flex position-relative">
              <div className="position-relative">
                <Form.Control
                  className="search-placeholder"
                  placeholder="Search by title, instructor..."
                  value={searchTerm}
                  onChange={handleSearch}
                  style={{
                    background: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '10px 20px',
                    paddingLeft: '45px',
                    width: '280px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  left: '16px',
                  top: '0',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaSearch color="#0062E6" fontSize="14px" />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Mobile search - only visible on mobile */}
      <Container className="d-md-none mb-4">
        <div className="position-relative">
          <Form.Control
            className="search-placeholder"
            placeholder="Search by title, instructor..."
            value={searchTerm}
            onChange={handleSearch}
            style={{
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '50px',
              padding: '10px 20px',
              paddingLeft: '45px',
              height: '48px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}
          />
          <div style={{
            position: 'absolute',
            left: '16px',
            top: '0',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FaSearch color="#0062E6" fontSize="14px" />
          </div>
        </div>
      </Container>

      {/* Table section */}
      <Container className="mb-4">
        {error ? (
          <Alert variant="danger" className="m-4" style={{ borderRadius: '10px', border: 'none' }}>
            {error}
          </Alert>
        ) : (
          <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead style={{ 
                  background: 'linear-gradient(to right, rgba(0, 98, 230, 0.08), rgba(51, 161, 253, 0.08))',
                  borderBottom: '2px solid rgba(0, 98, 230, 0.1)'
                }}>
                  <tr>
                    <th style={{ 
                      padding: '18px 25px', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Index</th>
                    <th style={{ 
                      padding: '18px 25px', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Course Name</th>
                    <th style={{ 
                      padding: '18px 25px', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Instructor</th>
                    <th style={{ 
                      padding: '18px 25px', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px',
                      textAlign: 'center'
                    }}>Status</th>
                    <th style={{ 
                      width: '180px', 
                      padding: '18px 25px', 
                      textAlign: 'center', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course, index) => (
                      <tr key={course._id} style={{
                        backgroundColor: index % 2 === 0 ? 'white' : 'rgba(0, 98, 230, 0.01)',
                        transition: 'all 0.2s'
                      }}>
                        <td style={{ 
                          padding: '18px 25px',
                          fontSize: '15px',
                          color: '#495057',
                          fontWeight: '500'
                        }}>{index + 1}</td>
                        <td style={{ 
                          padding: '18px 25px',
                          fontSize: '15px',
                          color: '#495057',
                          fontWeight: '500'
                        }}>
                          <div className="d-flex align-items-center">
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'rgba(0, 98, 230, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '10px'
                            }}>
                              <FaBook size={14} color="#0062E6" />
                            </div>
                            {course.title}
                          </div>
                        </td>
                        <td style={{ 
                          padding: '18px 25px',
                          fontSize: '15px',
                          color: '#495057',
                          fontWeight: '500'
                        }}>{course.created_by?.user_name || "Unknown"}</td>
                        <td style={{ 
                          padding: '18px 25px',
                          fontSize: '15px',
                          color: '#495057',
                          fontWeight: '500',
                          textAlign: 'center'
                        }}>
                          <div className="d-flex justify-content-center align-items-center">
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: course.status 
                                ? 'rgba(40, 167, 69, 0.07)'
                                : 'rgba(220, 53, 69, 0.07)',
                              padding: '5px 12px',
                              borderRadius: '30px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                              <div style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: course.status ? '#28a745' : '#dc3545',
                                boxShadow: course.status 
                                  ? '0 0 5px rgba(40, 167, 69, 0.5)'
                                  : '0 0 5px rgba(220, 53, 69, 0.5)'
                              }} />
                              <span style={{
                                fontWeight: '500',
                                color: course.status ? '#28a745' : '#dc3545',
                                fontSize: '13px'
                              }}>
                      {course.status ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>
                  </td>
                        <td style={{ padding: '18px 25px' }}>
                          <div className="d-flex justify-content-center">
                    <Button
                              onClick={() => toggleStatus(course._id, course.status)}
                      size="sm"
                              style={{
                                background: course.status 
                                  ? 'rgba(220, 53, 69, 0.1)' 
                                  : 'rgba(40, 167, 69, 0.1)',
                                color: course.status ? '#dc3545' : '#28a745',
                                border: 'none',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '6px 15px',
                                fontWeight: '500',
                                transition: 'all 0.3s ease'
                              }}
                              className={course.status ? "deactivate-btn-hover" : "activate-btn-hover"}
                    >
                      {course.status ? <FaToggleOff /> : <FaToggleOn />}{" "}
                      {course.status ? "Deactivate" : "Activate"}
                    </Button>
                          </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                      <td colSpan="5" className="text-center py-5">
                        <div className="d-flex flex-column align-items-center">
                          <div style={{
                            background: 'rgba(0, 98, 230, 0.05)',
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '15px'
                          }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 15H13V17H11V15ZM11 7H13V13H11V7Z" fill="#0062E6" opacity="0.5"/>
                            </svg>
                          </div>
                          <p className="mt-2 mb-0 fw-medium" style={{ color: '#495057' }}>No courses found</p>
                          {searchTerm && (
                            <p className="small text-muted mt-1">Try a different search term</p>
                          )}
                        </div>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
            </Card.Body>
      </Card>
        )}
    </Container>
    </>
  );
};

export default CourseManagement;