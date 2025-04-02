import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, ProgressBar, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Header";
import Courses_API from "../../Api/courseApi";

const MyLearning = () => {
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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

                // Check if token is valid
                try {
                    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
                    if (!tokenPayload.id) {
                        setError("Invalid token. Please log in again.");
                        localStorage.removeItem('token');
                        setLoading(false);
                        return;
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

    
    const handleContinueLearning = (course) => {
        // Navigate to course show page
        navigate(`/courses/courseShow/${course._id}`);
    };

    if (loading) {
        return (
            <div>
                <Header />
                <Container className="mt-5">
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </Container>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <Header />
                <Container className="mt-5">
                    <div className="alert alert-danger" role="alert">
                        {error}
                        {error.includes("log in") && (
                            <div className="mt-3">
                                <Button variant="primary" onClick={() => navigate('/login')}>
                                    Go to Login
                                </Button>
                            </div>
                        )}
                    </div>
                </Container>
            </div>
        );
    }

    return (
        <div>
            <Header />
            <Container className="mt">
                <h2 className="mb-4">My Learning</h2>
                {enrolledCourses.length === 0 ? (
                    <div className="text-center">
                        <p>You haven't enrolled in any courses yet.</p>
                        <Button variant="primary" onClick={() => navigate("/courses")}>
                            Browse Courses
                        </Button>
                    </div>
                ) : (
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {enrolledCourses.map((course) => (
                            <Col key={course._id}>
                                <Card className="h-100 shadow-sm">
                                    <Card.Img
                                        variant="top"
                                        src={course.thumbnail}
                                        alt={course.title}
                                        style={{ height: '200px', objectFit: 'cover' }}
                                    />
                                    <Card.Body className="d-flex flex-column">
                                        <Card.Title>{course.title}</Card.Title>
                                        <Card.Text className="text-muted mb-2">
                                            {course.created_by?.user_name || 'Unknown Instructor'}
                                        </Card.Text>
                                        <div className="mt-auto">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <small>{course.progress}% complete</small>
                                                <small>{course.completedVideos}/{course.totalVideos} videos</small>
                                            </div>
                                            <ProgressBar
                                                now={course.progress}
                                                variant={course.progress === 100 ? "success" : "primary"}
                                                className="mb-3"
                                            />
                                            <Button
                                                variant="primary"
                                                onClick={() => handleContinueLearning(course)}
                                                className="w-100"
                                            >
                                                Continue Learning
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </Container>
        </div>
    );
};

export default MyLearning;