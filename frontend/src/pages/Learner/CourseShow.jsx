import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { Container, Row, Col, Card, Button, ListGroup, Alert } from "react-bootstrap";
import { CameraVideo, FileEarmarkText, ChevronDown, ChevronUp } from "react-bootstrap-icons";
import { motion } from "framer-motion"; // Import Framer Motion

const CourseShow = () => {
    // Static Course Data
    const course = {
        title: "Full-Stack Web Development",
        instructor: "John Doe",
        description: "Learn how to build web applications using the MERN Stack.",
        category: "Web Development",
        duration: "12 Hours",
        rating: 4.5,
        image: "https://www.futuretechinfovision.co.uk/wp-content/uploads/2022/06/IT-Courses.jpg", // Course Thumbnail
        chapters: [
            {
                title: "Introduction to Web Development",
                videos: [
                    { title: "Intro to HTML", length: "10:45", url: "https://www.w3schools.com/html/mov_bbb.mp4" },
                    { title: "CSS Basics", length: "12:30", url: "https://www.w3schools.com/html/mov_bbb.mp4" },
                ],
                texts: ["What is Web Development?", "Understanding the Web"],
            },
            {
                title: "JavaScript Fundamentals",
                videos: [
                    { title: "Variables & Data Types", length: "15:20", url: "https://www.w3schools.com/html/mov_bbb.mp4" },
                    { title: "Functions & Loops", length: "18:10", url: "https://www.w3schools.com/html/mov_bbb.mp4" },
                ],
                texts: ["JS Basics", "Scope & Closures"],
            },
            {
                title: "React Basics",
                videos: [
                    { title: "JSX & Components", length: "20:00", url: "https://www.w3schools.com/html/mov_bbb.mp4" },
                    { title: "State & Props", length: "22:30", url: "https://www.w3schools.com/html/mov_bbb.mp4" },
                ],
                texts: ["Understanding Components", "React Lifecycle"],
            },
        ],
    };

    const [enrolled, setEnrolled] = useState(false);
    const [openChapters, setOpenChapters] = useState({});
    const navigate = useNavigate();

    // Enroll Now Handler
    const handleEnroll = () => {
        setEnrolled(true);
    };

    // Toggle Accordion Items
    const toggleChapter = (index) => {
        setOpenChapters((prev) => ({
            ...prev,
            [index]: !prev[index], // Toggle open state
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
            state: { videoData: video },
        });
    };

    return (
        <Container className="mt-4">
            <Row>
                {/* Left Sidebar: Course Details */}
                <Col md={4}>
                    <Card className="shadow-sm border-0 p-3">
                        {/* Course Thumbnail Image */}
                        <Card.Img
                            variant="top"
                            src={course.image}
                            alt="Course Thumbnail"
                            className="rounded"
                            style={{ height: "200px", objectFit: "cover" }}
                        />
                        <Card.Body>
                            <h4 className="fw-bold">{course.title}</h4>
                            <h6 className="mb-3" style={{ color: "#0056b3" }}>
                                <strong>Instructor:</strong> {course.instructor}
                            </h6>
                            <p className="text-muted">{course.description}</p>
                            <ListGroup variant="flush">
                                <ListGroup.Item><strong>Category:</strong> {course.category}</ListGroup.Item>
                                <ListGroup.Item><strong>Duration:</strong> {course.duration}</ListGroup.Item>
                                <ListGroup.Item><strong>Rating:</strong> {renderStars(course.rating)}</ListGroup.Item>
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
                    {course.chapters.map((chapter, index) => {
                        // Calculate total video length in minutes
                        const totalVideoLength = chapter.videos
                            .map((video) => {
                                const [minutes, seconds] = video.length.split(":").map(Number);
                                return minutes + seconds / 60;
                            })
                            .reduce((acc, curr) => acc + curr, 0)
                            .toFixed(0); // Round to whole number

                        return (
                            <Card key={index} className="mb-2 shadow-sm">
                                <Card.Header
                                    className="fw-bold d-flex justify-content-between align-items-center"
                                    style={{
                                        cursor: "pointer",
                                        backgroundColor: "#0056b3", // Red Background
                                        color: "white", // White Text
                                        fontWeight: "bold",
                                    }}
                                    onClick={() => toggleChapter(index)}
                                >
                                    <div>{chapter.title}</div>

                                    {/* Video count & total length next to the dropdown icon */}
                                    <div className="d-flex align-items-center">
                                        <span className="text-white me-2" style={{ fontSize: "0.9rem" }}>
                                            ({chapter.videos.length} Lectures, {totalVideoLength} min)
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
                                            {chapter.videos.map((video, vIndex) => (
                                                <ListGroup.Item
                                                    key={vIndex}
                                                    className="d-flex justify-content-between"
                                                    style={{ cursor: "pointer", color: "#0056b3" }}
                                                    onClick={() => handleVideoClick(video)}
                                                >                                                    <span><CameraVideo className="me-2 text-success" /> {video.title}</span>
                                                    <span className="text-muted" style={{ fontSize: "0.9rem" }}>{video.length}</span>
                                                </ListGroup.Item>
                                            ))}
                                            {chapter.texts.map((text, tIndex) => (
                                                <ListGroup.Item key={tIndex}>
                                                    <FileEarmarkText className="me-2 text-primary" /> {text}
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    </Card.Body>
                                </motion.div>
                            </Card>
                        );
                    })}
                </Col>
            </Row>
        </Container>
    );
};

export default CourseShow;
