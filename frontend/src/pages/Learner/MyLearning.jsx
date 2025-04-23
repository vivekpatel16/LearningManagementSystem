import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, ProgressBar, Button, Badge, Form, InputGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Courses_API from "../../Api/courseApi";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch } from "react-icons/fa";

const MyLearning = () => {
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userName, setUserName] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEnrolledCourses = async () => {
            try {
                setLoading(true);
                setError(null);

                // Check if user is logged in
                const token = localStorage.getItem('token');
                if (!token) {
                    setError("Please log in to view your enrolled courses");
                    setLoading(false);
                    return;
                }

                // Check if token is valid and extract user info
                try {
                    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
                    if (!tokenPayload.id) {
                        setError("Invalid token. Please log in again.");
                        localStorage.removeItem('token');
                        setLoading(false);
                        return;
                    }
                    
                    // Extract user name from token if available
                    if (tokenPayload.name) {
                        setUserName(tokenPayload.name);
                    }
                } catch (tokenError) {
                    console.error("Token validation error:", tokenError);
                    setError("Invalid token. Please log in again.");
                    localStorage.removeItem('token');
                    setLoading(false);
                    return;
                }

                // Fetch enrolled courses directly
                console.log("Fetching enrolled courses...");
                const response = await Courses_API.get("/enrolled");
                console.log("Enrolled courses response:", response.data);

                if (response.data && response.data.success) {
                    setEnrolledCourses(response.data.data);
                    setFilteredCourses(response.data.data);
                } else {
                    setError(response.data?.message || "Failed to fetch enrolled courses");
                }

            } catch (error) {
                console.error("Error fetching enrolled courses:", error);
                console.error("Error details:", error.response?.data);
                
                if (error.response?.status === 401) {
                    setError("Your session has expired. Please log in again.");
                    localStorage.removeItem('token');
                    navigate('/login');
                } else if (error.response?.status === 500) {
                    setError(error.response?.data?.message || "Server error. Please try again later.");
                } else {
                    setError("Failed to fetch enrolled courses. Please try again later.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchEnrolledCourses();
    }, [navigate]);

    // Filter courses based on search term
    useEffect(() => {
        if (enrolledCourses.length > 0) {
            if (searchTerm.trim() === "") {
                setFilteredCourses(enrolledCourses);
            } else {
                const filtered = enrolledCourses.filter(course => 
                    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (course.created_by?.user_name && course.created_by.user_name.toLowerCase().includes(searchTerm.toLowerCase()))
                );
                setFilteredCourses(filtered);
            }
        }
    }, [searchTerm, enrolledCourses]);

    const handleContinueLearning = (course) => {
        // Navigate to course show page
        navigate(`/courses/courseShow/${course._id}`);
    };

    // Animation variants for staggered loading
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

    // Calculate course status based on progress
    const getCourseStatus = (progress) => {
        if (progress === 100) return "Completed";
        if (progress > 70) return "Almost Done";
        if (progress > 30) return "In Progress";
        return "Just Started";
    };

    // Get status color based on progress
    const getStatusColor = (progress) => {
        if (progress === 100) return "#28a745"; // Success
        if (progress > 70) return "#fd7e14"; // Orange
        if (progress > 30) return "#0077cc"; // Blue
        return "#6c757d"; // Gray
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
                                <h2 className="fw-bold mb-1">My Learning</h2>
                                <p className="mb-0 opacity-75">Track your progress and continue where you left off</p>
                            </div>
                            
                            <div className="d-flex align-items-center">
                                {/* Actual Search Bar */}
                                <div className="me-3 d-none d-md-block">
                                    <InputGroup 
                                        className="hero-search"
                                        style={{
                                            width: "260px",
                                            height: "45px",
                                            borderRadius: "50px",
                                            overflow: "hidden",
                                            backgroundColor: "white",
                                            boxShadow: "0 3px 10px rgba(0,0,0,0.1)"
                                        }}
                                    >
                                        <InputGroup.Text style={{ background: "white", border: "none", paddingLeft: "15px" }}>
                                            <FaSearch color="#0062E6" />
                                        </InputGroup.Text>
                                        <Form.Control
                                            type="text"
                                            placeholder="Search courses..."
                                            disabled={loading}
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
                                </div>
                                
                                {/* Actual Button */}
                                <Button 
                                    variant="light" 
                                    onClick={() => navigate("/courses")}
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
                                >
                                    Browse More Courses
                                </Button>
                            </div>
                        </motion.div>
                    </Container>
                </div>

                <Container className="pb-5">
                    <div className="mb-4">
                        <Row className="g-3 mb-4">
                            {[...Array(3)].map((_, i) => (
                                <Col md={4} key={i}>
                                    <Card className="border-0 shadow-sm h-100 skeleton-card" style={{ borderRadius: "12px" }}>
                                        <Card.Body className="d-flex align-items-center p-3">
                                            <div className="skeleton-pulse me-3" style={{ width: "50px", height: "50px", borderRadius: "12px" }}></div>
                                            <div style={{ width: "100%" }}>
                                                <div className="skeleton-pulse mb-2" style={{ height: "16px", width: "60%", borderRadius: "4px" }}></div>
                                                <div className="skeleton-pulse" style={{ height: "28px", width: "40%", borderRadius: "6px" }}></div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>

                    <div className="skeleton-pulse mb-4" style={{ height: "28px", width: "150px", borderRadius: "6px" }}></div>
                    
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {[...Array(6)].map((_, i) => (
                            <Col key={i}>
                                <Card className="h-100 border-0 shadow-sm skeleton-card" style={{ borderRadius: "12px", overflow: "hidden" }}>
                                    <div className="skeleton-pulse" style={{ height: '180px' }}></div>
                                    <Card.Body className="p-4">
                                        <div className="skeleton-pulse mb-2" style={{ height: "20px", width: "80%", borderRadius: "4px" }}></div>
                                        <div className="d-flex align-items-center mb-3">
                                            <div className="skeleton-pulse me-2" style={{ height: "16px", width: "16px", borderRadius: "50%" }}></div>
                                            <div className="skeleton-pulse" style={{ height: "16px", width: "50%", borderRadius: "4px" }}></div>
                                        </div>
                                        <div className="mt-auto">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <div className="skeleton-pulse" style={{ height: "14px", width: "30%", borderRadius: "4px" }}></div>
                                                <div className="skeleton-pulse" style={{ height: "14px", width: "25%", borderRadius: "4px" }}></div>
                                            </div>
                                            <div className="skeleton-pulse mb-3" style={{ height: "8px", width: "100%", borderRadius: "4px" }}></div>
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
                            <h2 className="text-white fw-bold mb-1">My Learning</h2>
                            <p className="text-white opacity-75 mb-0">Track your progress and continue where you left off</p>
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
            {/* Welcome Banner */}
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
                            <h2 className="fw-bold mb-1">
                                {userName ? `Welcome back, ${userName.split(' ')[0]}!` : "My Learning"}
                            </h2>
                            <p className="mb-0 opacity-75">Track your progress and continue where you left off</p>
                        </div>
                        
                        <div className="d-flex align-items-center">
                            {/* Header Search Bar - Styled like Home page */}
                            <div className="me-3 d-none d-md-block">
                                <InputGroup 
                                    className="hero-search"
                                    style={{
                                        width: "260px",
                                        height: "45px",
                                        borderRadius: "50px",
                                        overflow: "hidden",
                                        backgroundColor: "white",
                                        boxShadow: "0 3px 10px rgba(0,0,0,0.1)"
                                    }}
                                >
                                    <InputGroup.Text style={{ background: "white", border: "none", paddingLeft: "15px" }}>
                                        <FaSearch color="#0062E6" />
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search courses..."
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
                            </div>
                            
                            <Button 
                                variant="light" 
                                onClick={() => navigate("/courses")}
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
                                Browse More Courses
                            </Button>
                        </div>
                    </motion.div>
                </Container>
            </div>

            <Container className="pb-5">
                {/* Summary Stats */}
                {enrolledCourses.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="mb-4"
                    >
                        <Row className="g-3 mb-4">
                            <Col md={4}>
                                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: "12px" }}>
                                    <Card.Body className="d-flex align-items-center">
                                        <div className="me-3 d-flex align-items-center justify-content-center" style={{
                                            width: "50px",
                                            height: "50px",
                                            borderRadius: "12px",
                                            background: "rgba(0, 119, 204, 0.1)",
                                            color: "#0077cc"
                                        }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-collection-play" viewBox="0 0 16 16">
                                                <path d="M2 3a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 0-1h-11A.5.5 0 0 0 2 3m2-2a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 0-1h-7A.5.5 0 0 0 4 1m2.765 5.576A.5.5 0 0 0 6 7v5a.5.5 0 0 0 .765.424l4-2.5a.5.5 0 0 0 0-.848l-4-2.5Z"/>
                                                <path d="M1.5 14.5A1.5 1.5 0 0 1 0 13V6a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 16 6v7a1.5 1.5 0 0 1-1.5 1.5h-13ZM1 6v7a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5V6a.5.5 0 0 0-.5-.5h-13A.5.5 0 0 0 1 6Z"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <h6 className="mb-0 text-muted">Total Courses</h6>
                                            <h3 className="mb-0 fw-bold">{enrolledCourses.length}</h3>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: "12px" }}>
                                    <Card.Body className="d-flex align-items-center">
                                        <div className="me-3 d-flex align-items-center justify-content-center" style={{
                                            width: "50px",
                                            height: "50px",
                                            borderRadius: "12px",
                                            background: "rgba(40, 167, 69, 0.1)",
                                            color: "#28a745"
                                        }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-check-circle" viewBox="0 0 16 16">
                                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                                                <path d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <h6 className="mb-0 text-muted">Completed</h6>
                                            <h3 className="mb-0 fw-bold">
                                                {enrolledCourses.filter(course => course.progress === 100).length}
                                            </h3>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: "12px" }}>
                                    <Card.Body className="d-flex align-items-center">
                                        <div className="me-3 d-flex align-items-center justify-content-center" style={{
                                            width: "50px",
                                            height: "50px",
                                            borderRadius: "12px",
                                            background: "rgba(253, 126, 20, 0.1)",
                                            color: "#fd7e14"
                                        }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-lightning" viewBox="0 0 16 16">
                                                <path d="M5.52.359A.5.5 0 0 1 6 0h4a.5.5 0 0 1 .474.658L8.694 6H12.5a.5.5 0 0 1 .395.807l-7 9a.5.5 0 0 1-.873-.454L6.823 9.5H3.5a.5.5 0 0 1-.48-.641z"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <h6 className="mb-0 text-muted">In Progress</h6>
                                            <h3 className="mb-0 fw-bold">
                                                {enrolledCourses.filter(course => course.progress < 100).length}
                                            </h3>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </motion.div>
                )}

                {/* Course Cards Section */}
                {enrolledCourses.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-center py-5 my-5"
                    >
                        <div style={{ maxWidth: "450px", margin: "0 auto" }}>
                            <img 
                                src="https://img.freepik.com/free-vector/empty-concept-illustration_114360-1188.jpg" 
                                alt="No courses" 
                                className="img-fluid mb-4" 
                                style={{ maxHeight: "200px" }} 
                            />
                            <h3 className="mb-3 fw-bold">No courses yet</h3>
                            <p className="text-muted mb-4">You haven't enrolled in any courses yet. Start your learning journey by exploring our course catalog.</p>
                            <Button 
                                variant="primary" 
                                onClick={() => navigate("/courses")}
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
                                    e.target.style.boxShadow = "0 6px 10px rgba(0, 98, 230, 0.3)";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)";
                                    e.target.style.transform = "translateY(0)";
                                    e.target.style.boxShadow = "0 4px 6px rgba(0, 98, 230, 0.2)";
                                }}
                            >
                            Browse Courses
                        </Button>
                    </div>
                    </motion.div>
                ) : (
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="fw-bold mb-0">Your Courses</h4>
                            <Button 
                                variant="outline-primary" 
                                onClick={() => navigate("/courses")}
                                className="d-md-none"
                                style={{
                                    borderRadius: "8px",
                                    fontWeight: "500"
                                }}
                            >
                                Browse More
                            </Button>
                        </div>
                        
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <Row xs={1} md={2} lg={3} className="g-4">
                                {filteredCourses.map((course) => (
                                    <motion.div key={course._id} variants={itemVariants}>
                                        <Col>
                                            <Card className="h-100 border-0 shadow-sm course-card" style={{ 
                                                borderRadius: "12px",
                                                overflow: "hidden",
                                                transition: "all 0.3s ease"
                                            }}>
                                                <div className="position-relative">
                                    <Card.Img
                                        variant="top"
                                                        src={course.thumbnail || "https://img.freepik.com/free-vector/hand-drawn-flat-design-stack-books_23-2149334862.jpg"}
                                        alt={course.title}
                                                        style={{ 
                                                            height: '180px', 
                                                            objectFit: 'cover',
                                                            objectPosition: 'center'
                                                        }}
                                                    />
                                                    <Badge 
                                                        bg="light" 
                                                        className="position-absolute" 
                                                        style={{ 
                                                            top: "12px", 
                                                            right: "12px",
                                                            color: getStatusColor(course.progress),
                                                            fontWeight: "500",
                                                            padding: "6px 10px",
                                                            borderRadius: "6px",
                                                            boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
                                                        }}
                                                    >
                                                        {getCourseStatus(course.progress)}
                                                    </Badge>
                                                </div>
                                                <Card.Body className="d-flex flex-column p-4">
                                                    <Card.Title className="fw-bold mb-1" style={{ fontSize: "1.1rem" }}>
                                                        {course.title}
                                                    </Card.Title>
                                                    <div className="d-flex align-items-center mb-3">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#6c757d" className="bi bi-person me-2" viewBox="0 0 16 16">
                                                            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664z"/>
                                                        </svg>
                                                        <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                                            {course.created_by?.user_name || 'Unknown Instructor'}
                                                        </span>
                                                    </div>
                                                    
                                        <div className="mt-auto">
                                                        <div className="mb-1">
                                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                                <span style={{ 
                                                                    fontSize: "0.9rem",
                                                                    fontWeight: "500",
                                                                    color: getStatusColor(course.progress)
                                                                }}>
                                                                    {course.progress}% complete
                                                                </span>
                                                                <span className="text-muted" style={{ fontSize: "0.85rem" }}>
                                                                    {course.completedVideos}/{course.totalVideos} videos
                                                                </span>
                                            </div>
                                            <ProgressBar
                                                now={course.progress}
                                                                style={{ 
                                                                    height: "8px",
                                                                    borderRadius: "4px",
                                                                    backgroundColor: "#e9ecef"
                                                                }}
                                                                variant={
                                                                    course.progress === 100 ? "success" : 
                                                                    course.progress > 70 ? "warning" : "primary"
                                                                }
                                                className="mb-3"
                                            />
                                                        </div>
                                            <Button
                                                            variant={course.progress === 100 ? "outline-success" : "primary"}
                                                onClick={() => handleContinueLearning(course)}
                                                className="w-100"
                                                            style={{
                                                                background: course.progress === 100 ? "transparent" : "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)",
                                                                border: course.progress === 100 ? "1px solid #28a745" : "none",
                                                                color: course.progress === 100 ? "#28a745" : "white",
                                                                borderRadius: "8px",
                                                                padding: "8px 0",
                                                                fontWeight: "500",
                                                                transition: "all 0.2s ease"
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (course.progress === 100) {
                                                                    e.target.style.background = "rgba(40, 167, 69, 0.1)";
                                                                    e.target.style.transform = "translateY(-2px)";
                                                                } else {
                                                                    e.target.style.background = "linear-gradient(135deg, #0056CD 0%, #2B8AD9 100%)";
                                                                    e.target.style.transform = "translateY(-2px)";
                                                                    e.target.style.boxShadow = "0 4px 8px rgba(0, 98, 230, 0.3)";
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (course.progress === 100) {
                                                                    e.target.style.background = "transparent";
                                                                    e.target.style.transform = "translateY(0)";
                                                                } else {
                                                                    e.target.style.background = "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)";
                                                                    e.target.style.transform = "translateY(0)";
                                                                    e.target.style.boxShadow = "none";
                                                                }
                                                            }}
                                                        >
                                                            {course.progress === 100 ? "Watch Again" : "Continue Learning"}
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                                    </motion.div>
                                ))}
                            </Row>
                            
                            {/* Show message when no search results */}
                            {searchTerm && filteredCourses.length === 0 && (
                                <div className="text-center py-5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="#6c757d" className="bi bi-search mb-3" viewBox="0 0 16 16">
                                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                                    </svg>
                                    <h5 className="text-muted">No courses found matching "{searchTerm}"</h5>
                                    <Button 
                                        variant="link" 
                                        onClick={() => setSearchTerm("")}
                                        className="mt-2"
                                        style={{ color: "#0077cc" }}
                                    >
                                        Clear search
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </Container>

            <style jsx="true">{`
                .course-card {
                    transition: all 0.3s ease;
                }
                
                .course-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0, 119, 204, 0.1) !important;
                }
                
                /* Custom progress bar colors */
                .progress-bar.bg-primary {
                    background: linear-gradient(135deg, #0062E6 0%, #33A1FD 100%) !important;
                }
                
                .progress-bar.bg-warning {
                    background: linear-gradient(90deg, #fd7e14 0%, #ffb74d 100%) !important;
                }
                
                .progress-bar.bg-success {
                    background: linear-gradient(90deg, #28a745 0%, #5cb85c 100%) !important;
                }
                
                /* Make the progress bar more visually appealing */
                .progress {
                    height: 8px;
                    border-radius: 4px;
                    background-color: #e9ecef;
                    overflow: hidden;
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

export default MyLearning;