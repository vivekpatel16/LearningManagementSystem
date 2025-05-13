import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Container, Row, Col, Card, Button, ListGroup, Alert, Spinner, Modal, Nav, Badge, ProgressBar } from "react-bootstrap";
import { CameraVideo, FileEarmarkText, ChevronDown, ChevronUp, Share } from "react-bootstrap-icons";
import { FaBook, FaVideo, FaFileAlt, FaLock, FaUnlock, FaQuestionCircle } from "react-icons/fa";
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
    const [activeChapterIndex, setActiveChapterIndex] = useState(0);
    const [courseProgress, setCourseProgress] = useState(0);
    const [learnerData, setLearnerData] = useState({ completedItems: [], quizAttempts: [] });
    const navigate = useNavigate();

    // Fetch course details, categories, and chapters
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                // First try to load from localStorage (for quicker display)
                const courseStorageKey = `course_${courseId}`;
                const contentStorageKey = `course_content_${courseId}`;
                const progressKey = `learner_progress_${courseId}`;
                
                const storedCourse = localStorage.getItem(courseStorageKey);
                const storedContent = localStorage.getItem(contentStorageKey);
                const storedProgress = localStorage.getItem(progressKey);
                
                let courseLoaded = false;
                
                // Try to load course data from localStorage first
                if (storedCourse) {
                    const parsedCourse = JSON.parse(storedCourse);
                    setCourse(parsedCourse);
                    courseLoaded = true;
                }
                
                // Try to load chapters data
                if (storedContent) {
                    const parsedContent = JSON.parse(storedContent);
                    
                    // Check if the data has the expected structure and normalize it if needed
                    const normalizedContent = parsedContent.map(chapter => {
                        // Ensure chapters have consistent structure
                        return {
                            ...chapter,
                            id: chapter.id || chapter._id,
                            title: chapter.title || chapter.chapter_title || "Untitled Chapter",
                            description: chapter.description || chapter.chapter_description || "",
                            // Ensure items array exists
                            items: Array.isArray(chapter.items) ? chapter.items : []
                        };
                    });
                    
                    console.log("Loaded normalized content:", normalizedContent);
                    setChapters(normalizedContent);
                }
                
                // Try to load learner progress
                if (storedProgress) {
                    const parsedProgress = JSON.parse(storedProgress);
                    setLearnerData(parsedProgress);
                    
                    // Calculate course progress if we have content
                    if (parsedProgress.completedItems && parsedProgress.completedItems.length > 0 && storedContent) {
                        const parsedContent = JSON.parse(storedContent);
                        // Count total content items
                        let totalItems = 0;
                        parsedContent.forEach(chapter => {
                            totalItems += Array.isArray(chapter.items) ? chapter.items.length : 0;
                        });
                        
                        if (totalItems > 0) {
                            // Calculate progress percentage
                            const progressPercentage = Math.round((parsedProgress.completedItems.length / totalItems) * 100);
                            setCourseProgress(progressPercentage);
                        }
                    }
                } else {
                    // Initialize empty progress data
                    const initialProgress = { completedItems: [], quizAttempts: [] };
                    localStorage.setItem(progressKey, JSON.stringify(initialProgress));
                    setLearnerData(initialProgress);
                }
                
                // Now fetch from API as well (to ensure data is up-to-date)
                try {
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
                            courseLoaded = true;
                            
                            // Save to localStorage for next time
                            localStorage.setItem(courseStorageKey, JSON.stringify(courseData));
                            
                            // Fetch chapters for this course
                            try {
                                const chaptersResponse = await Courses_API.get(`/chapter/${courseId}`);
                                
                                if (chaptersResponse.data && Array.isArray(chaptersResponse.data)) {
                                    // For each chapter, fetch its videos
                                    const chaptersWithVideos = await Promise.all(
                                        chaptersResponse.data.map(async (chapter) => {
                                            try {
                                                const videosResponse = await Courses_API.get(`/video/${chapter._id}`);
                                                return {
                                                    id: chapter._id,
                                                    title: chapter.chapter_title,
                                                    description: chapter.chapter_description,
                                                    order: chapter.order,
                                                    items: videosResponse.data ? videosResponse.data.map(video => ({
                                                        id: video._id,
                                                        title: video.video_title,
                                                        type: "video",
                                                        description: video.video_description,
                                                        url: video.video_url,
                                                        thumbnail: video.video_thumbnail,
                                                        duration: video.video_length ? Math.floor(video.video_length / 60) : "Unknown"
                                                    })) : [],
                                                    videos: videosResponse.data || [],
                                                    texts: chapter.texts || []
                                                };
                                            } catch (err) {
                                                console.error(`Error fetching videos for chapter ${chapter._id}:`, err);
                                                return {
                                                    id: chapter._id,
                                                    title: chapter.chapter_title,
                                                    description: chapter.chapter_description,
                                                    order: chapter.order,
                                                    items: [],
                                                    videos: [],
                                                    texts: []
                                                };
                                            }
                                        })
                                    );
                                    console.log("Fetched chapters with videos:", chaptersWithVideos);
                                    setChapters(chaptersWithVideos);
                                    
                                    // Save to localStorage for next time
                                    localStorage.setItem(contentStorageKey, JSON.stringify(chaptersWithVideos));
                                }
                            } catch (chapterError) {
                                console.error("Error fetching chapters:", chapterError);
                                // We still continue because we might already have chapters from localStorage
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
                        } else if (!courseLoaded) {
                            // Only set error if we haven't loaded from localStorage
                            setError("Course not found");
                        }
                    } else if (!courseLoaded) {
                        // Only set error if we haven't loaded from localStorage
                        setError("Failed to fetch course details");
                    }
                    
                    // Fetch categories using Courses_API
                    const categoriesResponse = await Courses_API.get("/category");
                    if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
                        setCategories(categoriesResponse.data);
                    }
                } catch (apiError) {
                    console.error("Error fetching data from API:", apiError);
                    // Only set error if we couldn't load from localStorage
                    if (!courseLoaded) {
                        setError("Failed to fetch course details. Please try again later.");
                    }
                }
            } catch (err) {
                console.error("Error in fetch data function:", err);
                setError("Failed to fetch course details. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        
        // Check enrollment status will be triggered by courseId change
    }, [courseId, navigate]);

    // Second useEffect to check enrollment status when course is loaded
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

    // Toggle all chapters
    const toggleAllChapters = () => {
        if (Object.keys(openChapters).length === chapters.length) {
            setOpenChapters({});
        } else {
            const allOpen = {};
            chapters.forEach((_, index) => {
                allOpen[index] = true;
            });
            setOpenChapters(allOpen);
        }
    };

    // Render stars based on rating
    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <span key={i} style={{ color: i < rating ? "#ffdd00" : "#e4e5e9", fontSize: "1.2rem", filter: i < rating ? "drop-shadow(0 0 2px rgba(255, 221, 0, 0.3))" : "none" }}>★</span>
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

    // Share course link
    const shareLink = () => {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: course.title,
                text: `Check out this course: ${course.title}`,
                url: url
            }).catch(err => {
                navigator.clipboard.writeText(url);
                toast.success('Course link copied to clipboard!');
            });
        } else {
            navigator.clipboard.writeText(url);
            toast.success('Course link copied to clipboard!');
        }
    };

    const handleQuizClick = (quiz) => {
        navigate('/quiz-attempt', { 
            state: { 
                quizData: quiz, 
                courseData: course, 
                chapterData: chapters.find(chapter => 
                    chapter.quizzes && chapter.quizzes.some(q => q.id === quiz.id)
                ) 
            } 
        });
    };

    // Handle item click (video, document, quiz)
    const handleItemClick = (item, chapterId) => {
        if (item.type === "video") {
            navigate(`/learner/video/${item.id}`, {
                state: {
                    videoUrl: item.url,
                    title: item.title,
                    description: item.description,
                    courseId: courseId,
                    chapterId: chapterId,
                    itemId: item.id
                }
            });
        } else if (item.type === "document") {
            navigate(`/learner/document/${item.id}`, {
                state: {
                    documentUrl: item.url,
                    title: item.title,
                    content: item.content,
                    courseId: courseId,
                    chapterId: chapterId,
                    itemId: item.id
                }
            });
        } else if (item.type === "quiz") {
            // Check if quiz has already been attempted maximum times
            const quizAttempts = learnerData.quizAttempts || [];
            const attemptsMade = quizAttempts.filter(a => a.quizId === item.id).length;
            
            if (attemptsMade >= item.attempts) {
                alert(`You have already used all ${item.attempts} attempts for this quiz.`);
                return;
            }
            
            // Navigate to quiz attempt page
            navigate(`/learner/quiz/${item.id}`, {
                state: {
                    quizId: item.id,
                    title: item.title,
                    description: item.description,
                    questions: item.questions,
                    timeLimit: item.timeLimit,
                    passingScore: item.passingScore,
                    attempts: item.attempts,
                    attemptsMade: attemptsMade,
                    courseId: courseId,
                    chapterId: chapterId
                }
            });
        }
    };
    
    // Check if an item is completed
    const isItemCompleted = (itemId) => {
        return learnerData.completedItems && learnerData.completedItems.includes(itemId);
    };
    
    // Get quiz attempt results if quiz was attempted
    const getQuizResults = (quizId) => {
        if (!learnerData.quizAttempts) return null;
        
        const attempts = learnerData.quizAttempts.filter(a => a.quizId === quizId);
        if (attempts.length === 0) return null;
        
        // Return the most recent attempt
        return attempts[attempts.length - 1];
    };
    
    // Render content item (video, document, or quiz)
    const renderContentItem = (item, chapterId) => {
        const isCompleted = isItemCompleted(item.id);
        const quizResult = item.type === "quiz" ? getQuizResults(item.id) : null;
        
        return (
            <ListGroup.Item 
                key={item.id}
                className="d-flex align-items-center cursor-pointer"
                onClick={() => handleItemClick(item, chapterId)}
                style={{ 
                    cursor: "pointer", 
                    backgroundColor: isCompleted ? "#f8f9fa" : "white",
                    borderLeft: isCompleted ? "3px solid #198754" : "3px solid transparent"
                }}
            >
                <div className="me-3">
                    {item.type === "video" && <FaVideo className="text-primary" />}
                    {item.type === "document" && <FaFileAlt className="text-warning" />}
                    {item.type === "quiz" && <FaQuestionCircle className="text-danger" />}
                </div>
                
                <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <p className="mb-0 fw-medium">{item.title}</p>
                            {item.type === "video" && (
                                <small className="text-muted">{item.duration || "Unknown"} minutes</small>
                            )}
                            {item.type === "quiz" && (
                                <small className="text-muted">{item.questions?.length || 0} questions • {item.timeLimit} min • Pass: {item.passingScore}%</small>
                            )}
                        </div>
                        
                        <div className="d-flex align-items-center">
                            {isCompleted && (
                                <Badge bg="success" className="me-2">Completed</Badge>
                            )}
                            
                            {item.type === "quiz" && quizResult && (
                                <Badge bg={quizResult.passed ? "success" : "danger"} className="me-2">
                                    {quizResult.passed ? "Passed" : "Failed"} ({quizResult.score}%)
                                </Badge>
                            )}
                            
                            {item.type === "quiz" && (
                                <Badge bg="info" className="me-2">
                                    {learnerData.quizAttempts?.filter(a => a.quizId === item.id).length || 0}/{item.attempts} attempts
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </ListGroup.Item>
        );
    };

    if (isLoading) {
        return (
            <Container fluid className="py-4 px-md-4 bg-light">
                <Row>
                    {/* Header Skeleton - Updated */}
                    <Col xs={12} className="mb-4">
                        <Card className="shadow-sm border-0 overflow-hidden" style={{
                            background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)"
                        }}>
                            <Row className="align-items-center p-4">
                                <Col md={3} className="text-center text-md-start mb-4 mb-md-0">
                                    <div className="shimmer" style={{ 
                                        width: "220px", 
                                        height: "160px", 
                                        borderRadius: "4px",
                                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                                        display: "inline-block"
                                    }}></div>
                                </Col>
                                <Col md={7}>
                                    <div className="skeleton-text-lg shimmer mb-3" style={{ 
                                        width: "70%", 
                                        height: "32px",
                                        backgroundColor: "rgba(255, 255, 255, 0.2)"
                                    }}></div>
                                    <div className="d-flex flex-wrap">
                                        <div className="skeleton-text shimmer me-4 mb-2" style={{ 
                                            width: "120px", 
                                            height: "16px",
                                            backgroundColor: "rgba(255, 255, 255, 0.2)"
                                        }}></div>
                                        <div className="skeleton-text shimmer me-4 mb-2" style={{ 
                                            width: "140px", 
                                            height: "16px",
                                            backgroundColor: "rgba(255, 255, 255, 0.2)"
                                        }}></div>
                                        <div className="skeleton-text shimmer me-4 mb-2" style={{ 
                                            width: "100px", 
                                            height: "16px",
                                            backgroundColor: "rgba(255, 255, 255, 0.2)"
                                        }}></div>
                                    </div>
                                </Col>
                                <Col md={2}>
                                    <div className="skeleton-button shimmer mb-2" style={{ 
                                        width: "100%", 
                                        height: "38px", 
                                        borderRadius: "4px",
                                        backgroundColor: "rgba(255, 255, 255, 0.2)"
                                    }}></div>
                                    <div className="skeleton-button shimmer" style={{ 
                                        width: "100%", 
                                        height: "38px", 
                                        borderRadius: "4px",
                                        backgroundColor: "rgba(255, 255, 255, 0.2)"
                                    }}></div>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    {/* Content Skeleton */}
                    <Col md={8}>
                        <Card className="shadow-sm border-0 mb-4">
                            <Card.Body className="p-4">
                                <div className="skeleton-text-lg shimmer mb-3" style={{ width: "40%", height: "24px" }}></div>
                                <div className="skeleton-text shimmer mb-2" style={{ width: "100%", height: "16px" }}></div>
                                <div className="skeleton-text shimmer mb-2" style={{ width: "100%", height: "16px" }}></div>
                                <div className="skeleton-text shimmer mb-2" style={{ width: "80%", height: "16px" }}></div>
                            </Card.Body>
                        </Card>

                        <Card className="shadow-sm border-0">
                            <Card.Header className="bg-white p-4 d-flex justify-content-between align-items-center">
                                <div className="skeleton-text-lg shimmer" style={{ width: "30%", height: "24px" }}></div>
                                <div className="skeleton-text shimmer" style={{ width: "80px", height: "16px" }}></div>
                            </Card.Header>
                            <Card.Body className="p-0">
                                {[...Array(3)].map((_, index) => (
                                    <div key={index} className="border-bottom p-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <div className="d-flex align-items-center">
                                                <div className="shimmer me-3" style={{ 
                                                    width: "24px", 
                                                    height: "24px", 
                                                    borderRadius: "50%" 
                                                }}></div>
                                                <div>
                                                    <div className="skeleton-text shimmer mb-1" style={{ width: "180px", height: "18px" }}></div>
                                                    <div className="skeleton-text shimmer" style={{ width: "120px", height: "14px" }}></div>
                                                </div>
                                            </div>
                                            <div className="shimmer" style={{ width: "20px", height: "20px", borderRadius: "50%" }}></div>
                                        </div>
                                        {index === 0 && (
                                            <div className="ps-4 ms-3">
                                                {[...Array(3)].map((_, i) => (
                                                    <div key={i} className="d-flex justify-content-between align-items-center py-3">
                                                        <div className="d-flex align-items-center">
                                                            <div className="shimmer me-3" style={{ width: "16px", height: "16px" }}></div>
                                                            <div className="skeleton-text shimmer" style={{ width: "160px", height: "16px" }}></div>
                                                        </div>
                                                        <div className="skeleton-text shimmer" style={{ width: "40px", height: "14px" }}></div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Sidebar Skeleton */}
                    <Col md={4}>
                        <Card className="shadow-sm border-0">
                            <Card.Body className="p-4">
                                <div className="skeleton-text-lg shimmer mb-3" style={{ width: "50%", height: "20px" }}></div>
                                
                                <div className="mb-4">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="d-flex justify-content-between py-2 border-bottom">
                                            <div className="skeleton-text shimmer" style={{ width: "80px", height: "16px" }}></div>
                                            <div className="skeleton-text shimmer" style={{ width: "60px", height: "16px" }}></div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="skeleton-button shimmer mb-3" style={{ width: "100%", height: "48px", borderRadius: "4px" }}></div>
                                
                                <div className="mt-3 p-3" style={{ backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
                                    <div className="skeleton-text shimmer mb-3" style={{ width: "40%", height: "18px" }}></div>
                                    <div className="d-flex align-items-center">
                                        <div className="shimmer me-3" style={{ 
                                            width: "50px", 
                                            height: "50px", 
                                            borderRadius: "50%" 
                                        }}></div>
                                        <div>
                                            <div className="skeleton-text shimmer mb-1" style={{ width: "120px", height: "16px" }}></div>
                                            <div className="skeleton-text shimmer" style={{ width: "80px", height: "14px" }}></div>
                                        </div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <style jsx="true">{`
                    .shimmer {
                        position: relative;
                        overflow: hidden;
                        background-color: #e0e0e0;
                    }
                    
                    .shimmer::after {
                        position: absolute;
                        top: 0;
                        right: 0;
                        bottom: 0;
                        left: 0;
                        transform: translateX(-100%);
                        background-image: linear-gradient(
                            90deg,
                            rgba(255, 255, 255, 0) 0,
                            rgba(255, 255, 255, 0.2) 20%,
                            rgba(255, 255, 255, 0.5) 60%,
                            rgba(255, 255, 255, 0)
                        );
                        animation: shimmer 2s infinite;
                        content: '';
                    }
                    
                    @keyframes shimmer {
                        100% {
                            transform: translateX(100%);
                        }
                    }
                    
                    .skeleton-text, .skeleton-text-lg, .skeleton-button {
                        border-radius: 4px;
                        background-color: #e0e0e0;
                    }
                `}</style>
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
        <Container fluid className="py-4 px-md-4 bg-light">
            <Row>
                {/* Course Header - With colorful background */}
                <Col xs={12} className="mb-4">
                    <Card className="shadow-sm border-0 overflow-hidden" style={{
                            background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)"
                        }}>
                        <Row className="align-items-center p-4">
                            <Col md={3} className="text-center text-md-start mb-4 mb-md-0">
                                <img 
                                    src={course.thumbnail || "https://www.futuretechinfovision.co.uk/wp-content/uploads/2022/06/IT-Courses.jpg"} 
                                    alt={course.title}
                                    className="img-fluid rounded shadow-sm"
                                    style={{ maxWidth: "220px", objectFit: "cover" }} 
                                />
                            </Col>
                            <Col md={7}>
                                <h1 className="mb-2 text-white">{course.title}</h1>
                                <div className="d-flex align-items-center flex-wrap mb-3">
                                    <span className="me-3 text-white d-flex align-items-center">
                                        {course.created_by?.profile_image ? (
                                            <img 
                                                src={course.created_by.profile_image}
                                                alt="Instructor"
                                                className="me-2 rounded-circle"
                                                style={{ 
                                                    width: "24px", 
                                                    height: "24px", 
                                                    objectFit: "cover",
                                                    border: "1px solid rgba(255,255,255,0.3)",
                                                }}
                                                onError={(e) => {
                                                    // If image fails, show the icon instead
                                                    e.target.style.display = "none";
                                                    e.target.nextElementSibling.style.display = "inline-block";
                                                }}
                                            />
                                        ) : null}
                                        <i className="bi bi-person-fill me-1" style={{ display: course.created_by?.profile_image ? "none" : "inline-block" }}></i> 
                                        {course.created_by?.user_name || "Unknown"}
                                    </span>
                                    <span className="me-3 text-white">
                                        {course.courseCategories?.map((cat, index) => (
                                            <span
                                                key={index}
                                                className="badge rounded-pill me-1 mb-1"
                                                style={{
                                                    background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)",
                                                    padding: "5px 12px",
                                                    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                                                    fontSize: "0.85rem",
                                                    fontWeight: "500",
                                                    border: "none"
                                                }}
                                            >
                                                {cat.category.name}
                                            </span>
                                        ))}
                                    </span>
                                    <span className="me-3 text-white">
                                        <i className="bi bi-clock-fill me-1"></i> 
                                        {formatTotalDuration()}
                                    </span>
                                    <div className="d-flex align-items-center text-white">
                                        {renderStars(averageRating)} <span className="ms-1">({totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})</span>
                                    </div>
                                </div>
                            </Col>
                            <Col md={2} className="d-flex flex-column align-items-end">
                                {!isEnrolled && !isCheckingEnrollment && (
                                    <Button
                                        variant="light"
                                        className="fw-bold px-4 mb-2 w-100"
                                        onClick={handleEnroll}
                                        style={{
                                            background: "white",
                                            color: "#0062E6",
                                            borderColor: "white",
                                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                                            transition: "all 0.3s ease"
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.boxShadow = "0 6px 8px rgba(0, 0, 0, 0.15)";
                                            e.target.style.transform = "translateY(-2px)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
                                            e.target.style.transform = "translateY(0)";
                                        }}
                                    >
                                        <span>Enroll Now</span>
                                    </Button>
                                )}
                                {isCheckingEnrollment && (
                                    <Button
                                        variant="light"
                                        className="fw-bold px-4 mb-2 w-100"
                                        disabled
                                    >
                                        <Spinner animation="border" size="sm" />
                                    </Button>
                                )}
                                <Button 
                                    variant="outline-light" 
                                    className="w-100"
                                    onClick={shareLink}
                                    style={{
                                        borderColor: "rgba(255, 255, 255, 0.6)",
                                        transition: "all 0.3s ease"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = "transparent";
                                    }}
                                >
                                    <Share className="me-1" /> Share
                                </Button>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                {/* Main Content Area */}
                <Col md={8}>
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Body className="p-4">
                            <div className="mb-4">
                                <h4 className="fw-bold mb-3">About This Course</h4>
                                <p>{course.description}</p>
                            </div>
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm border-0">
                        <Card.Header className="bg-white p-4 d-flex justify-content-between align-items-center">
                            <h4 className="mb-0 fw-bold">Course Content</h4>
                            <Button variant="link" className="p-0 text-decoration-none" onClick={toggleAllChapters}>
                                {Object.keys(openChapters).length === chapters.length ? 'Collapse All' : 'Expand All'}
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {chapters.length > 0 ? (
                                <div className="course-chapters">
                                    {chapters.map((chapter, chapterIndex) => {
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
                                        
                                        // Support for both chapter.videos and chapter.items structures
                                        const videoItems = chapter.videos || 
                                                  (chapter.items && chapter.items.filter(item => item.type === 'video')) || 
                                                  [];

                                        return (
                                            <div key={chapter._id || chapter.id || chapterIndex} className="border-bottom">
                                                <div 
                                                    className="p-3 d-flex justify-content-between align-items-center"
                                                    style={{ 
                                                        cursor: "pointer",
                                                        backgroundColor: openChapters[chapterIndex] ? "#f8f9fa" : "white"
                                                    }}
                                                    onClick={() => toggleChapter(chapterIndex)}
                                                >
                                                    <div className="d-flex align-items-center">
                                                        <div className="chapter-number me-3 rounded-circle text-white d-flex align-items-center justify-content-center"
                                                            style={{ 
                                                                width: "24px", 
                                                                height: "24px", 
                                                                fontSize: "12px",
                                                                background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)"
                                                            }}
                                                        >
                                                            {chapterIndex + 1}
                                                        </div>
                                                        <div>
                                                            <h5 className="mb-0 fw-bold">{chapter.title || chapter.chapter_title}</h5>
                                                            <small className="text-muted">
                                                                {videoItems.length} videos • {totalVideoLength} min
                                                            </small>
                                                        </div>
                                                    </div>
                                                    
                                                    {openChapters[chapterIndex] ? <ChevronUp /> : <ChevronDown />}
                                                </div>

                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: openChapters[chapterIndex] ? "auto" : 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    style={{ overflow: "hidden" }}
                                                >
                                                    <ListGroup variant="flush">
                                                        {videoItems.map((video, videoIndex) => (
                                                            <ListGroup.Item 
                                                                key={video._id || video.id}
                                                                action
                                                                onClick={() => handleVideoClick(video, chapterIndex)}
                                                                className="d-flex justify-content-between align-items-center border-0 py-3 px-4"
                                                            >
                                                                <div className="d-flex align-items-center">
                                                                    <div className="me-3" style={{ color: "#0062E6" }}>
                                                                        <CameraVideo />
                                                                    </div>
                                                                    <div>
                                                                        <div>{video.title || video.video_title}</div>
                                                                        <small className="text-muted">
                                                                            {video.video_length ? formatVideoLength(video.video_length) : 
                                                                             video.duration ? `${video.duration} min` : ""}
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                                {!isEnrolled && (
                                                                    <i className="bi bi-lock-fill text-muted"></i>
                                                                )}
                                                            </ListGroup.Item>
                                                        ))}
                                                        
                                                        {chapter.texts?.map((text, tIndex) => (
                                                            <ListGroup.Item 
                                                                key={tIndex}
                                                                className="d-flex justify-content-between align-items-center border-0 py-3 px-4"
                                                            >
                                                                <div className="d-flex align-items-center">
                                                                    <div className="me-3" style={{ color: "#0062E6" }}>
                                                                        <FileEarmarkText />
                                                                    </div>
                                                                    <div>
                                                                        <div>{text}</div>
                                                                        <small className="text-muted">Reading material</small>
                                                                    </div>
                                                                </div>
                                                                {!isEnrolled && (
                                                                    <i className="bi bi-lock-fill text-muted"></i>
                                                                )}
                                                            </ListGroup.Item>
                                                        ))}
                                                        
                                                        {/* Display document and quiz items from the normalized structure */}
                                                        {chapter.items && chapter.items.filter(item => item.type !== 'video').map((item, itemIndex) => (
                                                            <ListGroup.Item 
                                                                key={`item-${item.id || itemIndex}`}
                                                                action={isEnrolled}
                                                                onClick={() => isEnrolled && handleItemClick(item, chapter.id || chapter._id)}
                                                                className="d-flex justify-content-between align-items-center border-0 py-3 px-4"
                                                            >
                                                                <div className="d-flex align-items-center">
                                                                    <div className="me-3" style={{ color: item.type === 'document' ? "#ffc107" : "#dc3545" }}>
                                                                        {item.type === 'document' ? <FaFileAlt /> : <FaQuestionCircle />}
                                                                    </div>
                                                                    <div>
                                                                        <div>{item.title}</div>
                                                                        <small className="text-muted">
                                                                            {item.type === 'document' ? 'Document' : 'Quiz'}
                                                                            {item.type === 'quiz' && ` • ${item.questions?.length || 0} questions`}
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                                {!isEnrolled && (
                                                                    <i className="bi bi-lock-fill text-muted"></i>
                                                                )}
                                                            </ListGroup.Item>
                                                        ))}
                                                        
                                                        {((videoItems.length === 0 && (!chapter.texts || chapter.texts.length === 0)) && 
                                                          (!chapter.items || chapter.items.length === 0)) && (
                                                            <ListGroup.Item className="text-center text-muted py-3">
                                                                No content available for this chapter.
                                                            </ListGroup.Item>
                                                        )}
                                                    </ListGroup>
                                                </motion.div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <Alert variant="info" className="m-3">
                                    No chapters available for this course yet.
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Quizzes section */}
                    {chapters.map((chapter) => 
                        chapter.quizzes && chapter.quizzes.length > 0 && (
                            <div key={`quiz-${chapter.id}`} className="mb-4">
                                <h4 className="mb-3">Quizzes for {chapter.title}</h4>
                                <Row>
                                    {chapter.quizzes.map((quiz) => (
                                        <Col key={quiz.id} md={6} lg={4} className="mb-3">
                                            <Card className="h-100 shadow-sm hover-card">
                                                <Card.Body>
                                                    <div className="d-flex align-items-center mb-3">
                                                        <div 
                                                            className="icon-circle bg-primary text-white me-3"
                                                            style={{
                                                                width: '40px',
                                                                height: '40px',
                                                                borderRadius: '50%',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            <FaQuestionCircle />
                                                        </div>
                                                        <h5 className="card-title mb-0">{quiz.title}</h5>
                                                    </div>
                                                    <div className="text-muted mb-3 small">
                                                        <div><strong>Questions:</strong> {quiz.questions.length}</div>
                                                        <div><strong>Time Limit:</strong> {quiz.timeLimit > 0 ? `${quiz.timeLimit} minutes` : 'No time limit'}</div>
                                                        <div><strong>Passing Score:</strong> {quiz.passingScore}%</div>
                                                    </div>
                                                    <Button 
                                                        variant="outline-primary" 
                                                        className="w-100"
                                                        onClick={() => handleQuizClick(quiz)}
                                                    >
                                                        Start Quiz
                                                    </Button>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        )
                    )}
                </Col>

                {/* Sidebar */}
                <Col md={4}>
                    <Card className="shadow-sm border-0 sticky-top" style={{ top: "20px" }}>
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-3">Course Details</h5>
                            
                            {isEnrolled && (
                                <Alert variant="success" className="mb-3 d-flex align-items-center">
                                    <i className="bi bi-check-circle-fill me-2 fs-5"></i>
                                    <div>You're enrolled in this course</div>
                                </Alert>
                            )}
                            
                            <div className="course-info mb-4">
                                <div className="d-flex justify-content-between py-2 border-bottom">
                                    <span>Content</span>
                                    <span className="fw-bold">
                                        {chapters.reduce((total, chapter) => 
                                            total + (chapter.videos?.length || 0) + (chapter.texts?.length || 0), 0)} lessons
                                    </span>
                                </div>
                                <div className="d-flex justify-content-between py-2 border-bottom">
                                    <span>Duration</span>
                                    <span className="fw-bold">{formatTotalDuration()}</span>
                                </div>
                                <div className="d-flex justify-content-between py-2 border-bottom">
                                    <span>Rating</span>
                                    <span className="fw-bold d-flex align-items-center">
                                        <span className="me-1">{averageRating.toFixed(1)}</span>
                                        <small>{renderStars(averageRating)}</small>
                                    </span>
                                </div>
                                <div className="d-flex justify-content-between py-2">
                                    <span>Category</span>
                                    <span className="fw-bold">{getCategoryName(course.category_id)}</span>
                                </div>
                            </div>
                            
                            {!isEnrolled && !isCheckingEnrollment && (
                                <Button 
                                    variant="success" 
                                    size="lg"
                                    className="w-100 mb-3 fw-bold"
                                    onClick={handleEnroll}
                                    style={{
                                        background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)",
                                        border: "none",
                                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.12)",
                                        transition: "all 0.3s ease"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.opacity = "0.9";
                                        e.target.style.boxShadow = "0 6px 8px rgba(0, 0, 0, 0.2)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.opacity = "1";
                                        e.target.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.12)";
                                    }}
                                >
                                    Enroll in Course
                                </Button>
                            )}
                            
                            {isEnrolled && chapters.length > 0 && chapters[0].videos && chapters[0].videos.length > 0 && (
                                <div className="d-grid">
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        className="mb-3"
                                        onClick={() => handleVideoClick(chapters[0].videos[0], 0)}
                                        style={{
                                            background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)",
                                            border: "none",
                                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.12)",
                                            transition: "all 0.3s ease"
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.opacity = "0.9";
                                            e.target.style.boxShadow = "0 6px 8px rgba(0, 0, 0, 0.2)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.opacity = "1";
                                            e.target.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.12)";
                                        }}
                                    >
                                        <i className="bi bi-play-fill me-2"></i> Continue Learning
                                    </Button>
                                </div>
                            )}
                            
                            <Card className="mt-3 border-0 bg-light">
                                <Card.Body>
                                    <h6 className="fw-bold mb-3">Instructor</h6>
                                    <div className="d-flex align-items-center">
                                        {course.created_by?.profile_image ? (
                                            <img 
                                                src={course.created_by.profile_image}
                                                alt={course.created_by.user_name || "Instructor"}
                                                className="me-3 rounded-circle"
                                                style={{ 
                                                    width: "50px", 
                                                    height: "50px", 
                                                    objectFit: "cover",
                                                    border: "2px solid #fff",
                                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                                                }}
                                                onError={(e) => {
                                                    // If image fails to load, show the first letter fallback
                                                    e.target.style.display = "none";
                                                    e.target.nextElementSibling.style.display = "flex";
                                                }}
                                            />
                                        ) : null}
                                        <div 
                                            className="me-3 rounded-circle text-white d-flex align-items-center justify-content-center"
                                            style={{ 
                                                width: "50px", 
                                                height: "50px", 
                                                fontSize: "20px",
                                                background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)",
                                                display: course.created_by?.profile_image ? "none" : "flex"
                                            }}
                                        >
                                            {course.created_by?.user_name?.charAt(0) || "?"}
                                        </div>
                                        <div>
                                            <h6 className="mb-0">{course.created_by?.user_name || "Unknown"}</h6>
                                            <small className="text-muted">Instructor</small>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Enroll Modal */}
            <Modal show={showEnrollModal} onHide={() => setShowEnrollModal(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title>Enroll in Course</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center py-4">
                    <i className="bi bi-lock-fill text-warning mb-3" style={{ fontSize: "2rem" }}></i>
                    <h5>This content is locked</h5>
                    <p className="mb-0">Enroll now to access this and all course content.</p>
                </Modal.Body>
                <Modal.Footer className="border-0 justify-content-center">
                    <Button 
                        variant="secondary" 
                        onClick={() => setShowEnrollModal(false)}
                        style={{
                            backgroundColor: "#f8f9fa",
                            border: "none",
                            color: "#6c757d"
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="success" 
                        onClick={handleEnrollAndWatch}
                        style={{
                            background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)",
                            border: "none",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.12)",
                            transition: "all 0.3s ease"
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.opacity = "0.9";
                            e.target.style.boxShadow = "0 6px 8px rgba(0, 0, 0, 0.2)";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.opacity = "1";
                            e.target.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.12)";
                        }}
                    >
                        Enroll Now
                    </Button>
                </Modal.Footer>
            </Modal>

            <style jsx="true">{`
                .shimmer {
                    position: relative;
                    overflow: hidden;
                    background-color: #e0e0e0;
                }
                
                .shimmer::after {
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    transform: translateX(-100%);
                    background-image: linear-gradient(
                        90deg,
                        rgba(255, 255, 255, 0) 0,
                        rgba(255, 255, 255, 0.2) 20%,
                        rgba(255, 255, 255, 0.5) 60%,
                        rgba(255, 255, 255, 0)
                    );
                    animation: shimmer 2s infinite;
                    content: '';
                }
                
                @keyframes shimmer {
                    100% {
                        transform: translateX(100%);
                    }
                }
                
                .skeleton-text, .skeleton-text-lg, .skeleton-button {
                    border-radius: 4px;
                    background-color: #e0e0e0;
                }
                
                .course-info span {
                    color: #555;
                }
                .list-group-item-action:hover {
                    background-color: #f8f9fa;
                    transition: all 0.2s ease;
                }
                .sticky-top {
                    z-index: 100;
                }
                
                /* Add smooth transitions to buttons and interactive elements */
                button, .btn {
                    transition: all 0.3s ease;
                }
                
                /* Add subtle hover effects to cards */
                .card {
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                
                .card:hover:not(.bg-primary):not(.overflow-hidden) {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 20px rgba(0, 98, 230, 0.15);
                }
            `}</style>
        </Container>
    );
};

export default CourseShow;