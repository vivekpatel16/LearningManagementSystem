import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Row, Col, Card, Button, ListGroup, Alert, Spinner } from "react-bootstrap";
import { CameraVideo, FileEarmarkText, ChevronDown, ChevronUp } from "react-bootstrap-icons";
import { motion } from "framer-motion";
import common_API from "../../Api/commonApi";
import Courses_API from "../../Api/courseApi";

const CourseShow = () => {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [categories, setCategories] = useState([]);
    const [chapters, setChapters] = useState([]);
    const [enrolled, setEnrolled] = useState(false);
    const [openChapters, setOpenChapters] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Fetch course details, categories, and chapters
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                // Fetch all courses using common_API
                const coursesResponse = await common_API.get("/courses");
                if (coursesResponse.data && coursesResponse.data.data) {
                    const courseData = coursesResponse.data.data.find(c => c._id === courseId);
                    if (courseData) {
                        setCourse(courseData);
                        
                        // Fetch chapters for this course
                        const chaptersResponse = await Courses_API.get(`/chapter/${courseId}`);
                        
                        if (chaptersResponse.data && Array.isArray(chaptersResponse.data)) {
                            // For each chapter, fetch its videos
                            const chaptersWithVideos = await Promise.all(
                                chaptersResponse.data.map(async (chapter) => {
                                    try {
                                        const videosResponse = await Courses_API.get(`/video/${chapter._id}`);
                                        return {
                                            ...chapter,
                                            videos: videosResponse.data || [],
                                            texts: chapter.texts || []
                                        };
                                    } catch (err) {
                                        console.error(`Error fetching videos for chapter ${chapter._id}:`, err);
                                        return {
                                            ...chapter,
                                            videos: [],
                                            texts: chapter.texts || []
                                        };
                                    }
                                })
                            );
                            setChapters(chaptersWithVideos);
                        }
                    } else {
                        setError("Course not found");
                    }
                } else {
                    setError("Failed to fetch course details");
                }
                
                // Fetch categories using Courses_API
                const categoriesResponse = await Courses_API.get("/category");
                if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
                    setCategories(categoriesResponse.data);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to fetch course details. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [courseId]);

    // Format total duration into hours and minutes
    const formatTotalDuration = () => {
        // Calculate total duration in seconds
        const totalSeconds = chapters.reduce((total, chapter) => {
            return total + chapter.videos?.reduce((chapterTotal, video) => {
                return chapterTotal + (video.video_length ? parseInt(video.video_length) : 0);
            }, 0) || 0;
        }, 0);
        
        // Convert to hours and minutes
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        
        // Format the string
        if (hours > 0) {
            return `${hours} hr ${minutes > 0 ? `${minutes} min` : ''}`;
        } else if (minutes > 0) {
            return `${minutes} min`;
        } else {
            return 'Less than 1 min';
        }
    };

    // Get category name from category id
    const getCategoryName = (categoryId) => {
        const category = categories.find(cat => cat._id === categoryId);
        return category ? category.category_name : "Unknown";
    };

    // Enroll Now Handler
    const handleEnroll = () => {
        setEnrolled(true);
    };

    // Toggle Accordion Items
    const toggleChapter = (index) => {
        setOpenChapters((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    // Render stars based on rating
    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <span key={i} style={{ color: i < rating ? "gold" : "gray", fontSize: "1.2rem" }}>★</span>
        ));
    };

    const handleVideoClick = (video) => {
        navigate("/video-player", {
            state: { videoData: video }
        });
    };

    if (isLoading) {
        return (
            <Container className="mt-4">
                <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Loading course details...</p>
                </div>
            </Container>
        );
    }

    if (error || !course) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">{error || "Course not found"}</Alert>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <Row>
                {/* Left Sidebar: Course Details */}
                <Col md={4}>
                    <Card className="shadow-sm border-0 p-3">
                        {/* Course Thumbnail Image */}
                        <Card.Img
                            variant="top"
                            src={course.thumbnail || "https://www.futuretechinfovision.co.uk/wp-content/uploads/2022/06/IT-Courses.jpg"}
                            alt="Course Thumbnail"
                            className="rounded"
                            style={{ height: "200px", objectFit: "cover" }}
                        />
                        <Card.Body>
                            <h4 className="fw-bold">{course.title}</h4>
                            <h6 className="mb-3" style={{ color: "#0056b3" }}>
                                <strong>Instructor:</strong> {course.created_by?.user_name || "Unknown"}
                            </h6>
                            <p className="text-muted">{course.description}</p>
                            <ListGroup variant="flush">
                                <ListGroup.Item><strong>Category:</strong> {getCategoryName(course.category_id)}</ListGroup.Item>
                                <ListGroup.Item><strong>Duration:</strong> {formatTotalDuration()}</ListGroup.Item>
                                <ListGroup.Item><strong>Rating:</strong> {renderStars(course.rating || 0)}</ListGroup.Item>
                            </ListGroup>

                            <Button
                                variant={enrolled ? "dark" : "success"}
                                className="mt-3 w-100 fw-bold"
                                onClick={handleEnroll}
                                disabled={enrolled}
                            >
                                {enrolled ? "Enrolled ✅" : "Enroll Now"}
                            </Button>

                            {enrolled && <Alert variant="success" className="mt-2 text-center">You have successfully enrolled!</Alert>}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Right Side: Chapters List with Animated Accordion */}
                <Col md={8}>
                    <h3 className="fw-bold mb-3" style={{ color: "#000000" }}>Course Chapters</h3>
                    {chapters.length > 0 ? (
                        chapters.map((chapter, index) => {
                            // Format video length to display as minutes:seconds
                            const formatVideoLength = (seconds) => {
                                const minutes = Math.floor(seconds / 60);
                                const remainingSeconds = Math.floor(seconds % 60);
                                return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
                            };
                            
                            // Calculate total video length in minutes
                            const totalVideoLength = chapter.videos?.reduce((acc, video) => {
                                return acc + (video.video_length ? parseInt(video.video_length) / 60 : 0);
                            }, 0).toFixed(0) || 0;

                            return (
                                <Card key={chapter._id || index} className="mb-2 shadow-sm">
                                    <Card.Header
                                        className="fw-bold d-flex justify-content-between align-items-center"
                                        style={{
                                            cursor: "pointer",
                                            backgroundColor: "#0056b3",
                                            color: "white",
                                            fontWeight: "bold",
                                        }}
                                        onClick={() => toggleChapter(index)}
                                    >
                                        <div>{chapter.chapter_title}</div>

                                        {/* Video count & total length next to the dropdown icon */}
                                        <div className="d-flex align-items-center">
                                            <span className="text-white me-2" style={{ fontSize: "0.9rem" }}>
                                                ({chapter.videos?.length || 0} Lectures, {totalVideoLength} min)
                                            </span>
                                            {openChapters[index] ? <ChevronUp /> : <ChevronDown />}
                                        </div>
                                    </Card.Header>

                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={openChapters[index] ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        style={{ overflow: "hidden" }}
                                    >
                                        <Card.Body>
                                            <ListGroup variant="flush">
                                                {chapter.videos?.map((video, vIndex) => (
                                                    <ListGroup.Item
                                                        key={video._id || vIndex}
                                                        className="d-flex justify-content-between"
                                                        style={{ cursor: "pointer", color: "#0056b3" }}
                                                        onClick={() => handleVideoClick(video)}
                                                    >
                                                        <span>
                                                            <CameraVideo className="me-2 text-success" /> 
                                                            {video.video_title}
                                                        </span>
                                                        <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                                                            {formatVideoLength(video.video_length || 0)}
                                                        </span>
                                                    </ListGroup.Item>
                                                ))}
                                                {chapter.texts?.map((text, tIndex) => (
                                                    <ListGroup.Item key={tIndex}>
                                                        <FileEarmarkText className="me-2 text-primary" /> {text}
                                                    </ListGroup.Item>
                                                ))}
                                                {chapter.videos?.length === 0 && (
                                                    <ListGroup.Item className="text-muted">
                                                        No videos available for this chapter.
                                                    </ListGroup.Item>
                                                )}
                                            </ListGroup>
                                        </Card.Body>
                                    </motion.div>
                                </Card>
                            );
                        })
                    ) : (
                        <Alert variant="info">No chapters available for this course yet.</Alert>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default CourseShow;