import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Row, Col, Card, Button, ListGroup, Alert, Spinner, Modal } from "react-bootstrap";
import { CameraVideo, FileEarmarkText, ChevronDown, ChevronUp } from "react-bootstrap-icons";
import { motion } from "framer-motion";
import common_API from "../../Api/commonApi";
import Courses_API from "../../Api/courseApi";
import axiosInstance from '../../Api/axiosInstance';
import { toast } from "react-hot-toast";

const CourseShow = () => {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [categories, setCategories] = useState([]);
    const [chapters, setChapters] = useState([]);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [openChapters, setOpenChapters] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [averageRating, setAverageRating] = useState(0);
    const [totalRatings, setTotalRatings] = useState(0);
    const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(true);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
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
                        // Check if course is active, if not redirect to home page (except for admin)
                        if (!courseData.status) {
                            const user = JSON.parse(localStorage.getItem('user'));
                            if (!user || user.role !== 'admin') {
                                toast.error('This course is not available.');
                                navigate('/');
                                return;
                            }
                        }
                        
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

                        // Fetch course rating using common_API
                        try {
                            const ratingResponse = await common_API.get(`/rating/${courseId}`);
                            if (ratingResponse.status === 200) {
                                setAverageRating(ratingResponse.data.averageRating || 0);
                                setTotalRatings(ratingResponse.data.ratings?.length || 0);
                            }
                        } catch (ratingError) {
                            console.log("No ratings for this course yet:", ratingError.message);
                            // Set default values instead of letting the error propagate
                            setAverageRating(0);
                            setTotalRatings(0);
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

    // Add useEffect to check enrollment status
    useEffect(() => {
        const checkEnrollmentStatus = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setIsCheckingEnrollment(false);
                    return;
                }

                const response = await axiosInstance.get(
                    `/courses/enrollment/${course._id}`,
                    {

                        headers: {Authorization:`Bearer ${token}`}


                    }
                );

                if (response.status === 200) {
                    setIsEnrolled(true);
                }
            } catch (error) {
                console.error('Error checking enrollment:', error);
                setIsEnrolled(false);
            } finally {
                setIsCheckingEnrollment(false);
            }
        };

        if (course?._id) {
            checkEnrollmentStatus();
        }
    }, [course?._id]);

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
        const minutes = Math.ceil((totalSeconds % 3600) / 60);
        
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
    const handleEnroll = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Please login to enroll in the course');
                return;
            }

            const response = await axiosInstance.post(
                `/courses/${course._id}/enroll`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.status === 201) {
                setIsEnrolled(true);
                toast.success('Successfully enrolled in the course!');
                
                // Navigate to the first video
                if (chapters && chapters.length > 0 && chapters[0].videos && chapters[0].videos.length > 0) {
                    const firstVideo = chapters[0].videos[0];
                    navigate("/video-player", {
                        state: { 
                            videoData: firstVideo,
                            courseData: course,
                            currentChapterIndex: 0
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error enrolling in course:', error);
            if (error.response?.status === 400) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to enroll in course. Please try again.');
            }
        }
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

    // Update handleVideoClick function
    const handleVideoClick = (video, chapterIndex) => {
        if (!isEnrolled) {
            setSelectedVideo({ video, chapterIndex });
            setShowEnrollModal(true);
            return;
        }

        // Check if the video has any saved progress
        const fetchAndNavigate = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    // If no token, just navigate without progress info
                    navigateToVideo(video, chapterIndex);
                    return;
                }

                const tokenPayload = JSON.parse(atob(token.split('.')[1]));
                const userId = tokenPayload.id;

                // First get overall course progress
                let courseProgressData = null;
                try {
                    const coursesResponse = await axiosInstance.get(
                        '/courses/enrolled',
                        {
                            headers: { Authorization: `Bearer ${token}` }
                        }
                    );
                    
                    if (coursesResponse.data && coursesResponse.data.success) {
                        const thisCourse = coursesResponse.data.data.find(
                            c => c._id === course._id
                        );
                        
                        if (thisCourse && typeof thisCourse.progress === 'number') {
                            courseProgressData = thisCourse.progress;
                        }
                    }
                } catch (courseErr) {
                    console.error("Error fetching course progress:", courseErr);
                }

                // Try to fetch progress for this video
                const progressResponse = await axiosInstance.get(
                    `/courses/video/progress/${userId}/${course._id}/${video._id}`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                if (progressResponse.data && progressResponse.data.success) {
                    console.log("Found progress for video:", progressResponse.data.data);
                    
                    // Add the course progress to the video progress data
                    const enhancedProgressData = {
                        ...progressResponse.data.data,
                        course_progress: courseProgressData
                    };
                    
                    // Navigate with the progress data
                    navigateToVideo(video, chapterIndex, enhancedProgressData);
                } else {
                    // Navigate with just course progress data if we have it
                    if (courseProgressData !== null) {
                        navigateToVideo(video, chapterIndex, { course_progress: courseProgressData });
                    } else {
                        // Navigate without progress data
                        navigateToVideo(video, chapterIndex);
                    }
                }
            } catch (error) {
                console.error("Error fetching video progress:", error);
                // On error, just navigate without progress data
                navigateToVideo(video, chapterIndex);
            }
        };

        // Helper function to navigate with or without progress data
        const navigateToVideo = (video, chapterIndex, progressData = null) => {
            navigate("/video-player", {
                state: { 
                    videoData: video,
                    courseData: course,
                    currentChapterIndex: chapterIndex,
                    progressData: progressData // This will be null if no progress was found
                }
            });
        };

        // Execute the fetch and navigate
        fetchAndNavigate();
    };

    // Add handleEnrollAndWatch function
    const handleEnrollAndWatch = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Please login to enroll in the course');
                return;
            }

            const response = await axiosInstance.post(
                `/courses/${course._id}/enroll`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.status === 201) {
                setIsEnrolled(true);
                toast.success('Successfully enrolled in the course!');
                setShowEnrollModal(false);
                
                // Navigate to the selected video after enrollment
                if (selectedVideo) {
                    navigate("/video-player", {
                        state: { 
                            videoData: selectedVideo.video,
                            courseData: course,
                            currentChapterIndex: selectedVideo.chapterIndex
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error enrolling in course:', error);
            if (error.response?.status === 400) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to enroll in course. Please try again.');
            }
        }
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
                                <ListGroup.Item><strong>Rating:</strong> <strong>{averageRating}</strong> {renderStars(averageRating)} ({totalRatings} ratings)</ListGroup.Item>
                            </ListGroup>

                            <Button
                                variant={isEnrolled ? "dark" : "success"}
                                className="mt-3 w-100 fw-bold"
                                onClick={handleEnroll}
                                disabled={isEnrolled || isCheckingEnrollment}
                            >
                                {isCheckingEnrollment ? (
                                    <Spinner animation="border" size="sm" />
                                ) : isEnrolled ? (
                                    "Enrolled ✅"
                                ) : (
                                    "Enroll Now"
                                )}
                            </Button>

                            {isEnrolled && <Alert variant="success" className="mt-2 text-center">You have successfully enrolled!</Alert>}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Right Side: Chapters List with Animated Accordion */}
                <Col md={8}>
                    <h3 className="fw-bold mb-3" style={{ color: "#000000" }}>Course Chapters</h3>
                    {chapters.length > 0 ? (
                        chapters.map((chapter, chapterIndex) => {
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
                                <Card key={chapter._id || chapterIndex} className="mb-2 shadow-sm">
                                    <Card.Header
                                        className="fw-bold d-flex justify-content-between align-items-center"
                                        style={{
                                            cursor: "pointer",
                                            backgroundColor: "#0056b3",
                                            color: "white",
                                            fontWeight: "bold",
                                        }}
                                        onClick={() => toggleChapter(chapterIndex)}
                                    >
                                        <div>{chapter.chapter_title}</div>

                                        {/* Video count & total length next to the dropdown icon */}
                                        <div className="d-flex align-items-center">
                                            <span className="text-white me-2" style={{ fontSize: "0.9rem" }}>
                                                ({chapter.videos?.length || 0} Lectures, {totalVideoLength} min)
                                            </span>
                                            {openChapters[chapterIndex] ? <ChevronUp /> : <ChevronDown />}
                                        </div>
                                    </Card.Header>

                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={openChapters[chapterIndex] ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        style={{ overflow: "hidden" }}
                                    >
                                        <Card.Body>
                                            <ListGroup variant="flush">
                                                {chapter.videos?.map((video) => (
                                                    <ListGroup.Item
                                                        key={video._id}
                                                        className="d-flex justify-content-between align-items-center border-0 py-2"
                                                        style={{ cursor: "pointer" }}
                                                        onClick={() => handleVideoClick(video, chapterIndex)}
                                                    >
                                                        <div className="d-flex align-items-center">
                                                            <CameraVideo className="me-2 text-primary" />
                                                            <span>{video.video_title}</span>
                                                        </div>
                                                        <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                                                            {video.video_length ? formatVideoLength(video.video_length) : ""}
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

            {/* Add Enroll Modal */}
            <Modal show={showEnrollModal} onHide={() => setShowEnrollModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Enroll in Course</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Please enroll in this course to watch the videos. Would you like to enroll now?</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEnrollModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleEnrollAndWatch}>
                        Enroll and Watch
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default CourseShow;