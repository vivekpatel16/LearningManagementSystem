import React, { useState, useRef } from "react";
import { Form, Modal } from "react-bootstrap";
import Card from "react-bootstrap/Card";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { LuSendHorizontal } from "react-icons/lu";
import { CameraVideo } from "react-bootstrap-icons";
import { FaChevronDown, FaChevronUp, FaTimes, FaChevronRight, FaCheck, FaStar } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";



// Sample Course Data
const course = {
    title: "Web Design for Web Developers: Build Beautiful Websites!",
    chapters: [
        {
            title: "Using Colors Like A Pro",
            lessons: [
                {
                    title: "Introduction",
                    url: {
                        "360p": "https://www.w3schools.com/html/mov_bbb.mp4",
                        "720p": "https://www.w3schools.com/html/mov_bbb.mp4",
                        "1080p": "https://www.w3schools.com/html/mov_bbb.mp4"
                    },
                    duration: "7 min",
                    description: "Color is one of the most powerful tools in web design. It impacts user experience, emotions, and even decision-making. A well-chosen color scheme can make a website visually appealing, improve readability, and strengthen branding. However, poor color choices can make a site look unprofessional and difficult to navigate. In this guide, we'll explore how to use colors effectively in web design to create engaging and user-friendly experiences."
                }
            ]
        },
        {
            title: "Working With Images",
            lessons: [
                {
                    title: "Understanding Image Formats",
                    url: "https://www.w3schools.com/html/mov_bbb.mp4",
                    duration: "5 min",
                    description: "Learn about different image formats and their uses."
                },
                {
                    title: "Use CSS to Work with Images",
                    url: "https://www.w3schools.com/html/mov_bbb.mp4",
                    duration: "3 min",
                    description: "How to manipulate images using CSS."
                }
            ]
        },
        {
            title: "Introduction to User Experience",
            lessons: [
                {
                    title: "What is UX?",
                    url: "https://www.w3schools.com/html/mov_bbb.mp4",
                    duration: "3 min",
                    description: "Introduction to User Experience (UX) principles."
                }
            ]
        }
    ]
};

const VideoPlayer = () => {
    const [progress, setProgress] = useState(0);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [videoQuality, setVideoQuality] = useState("720p"); // Default Quality
    const [isCourseContentVisible, setIsCourseContentVisible] = useState(true);
    const [currentLesson, setCurrentLesson] = useState(course.chapters[0].lessons[0]);
    const [newComment, setNewComment] = useState("");
    const [comments, setComments] = useState([]);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const videoRef = useRef(null);
    const [openChapters, setOpenChapters] = useState(new Set());
    const [completedLessons, setCompletedLessons] = useState(new Set());
    const commentBoxRef = useRef(null);
    // Handle rating selection
    const handleRating = (value) => {
        setRating(value);
        setShowRatingModal(false);
        console.log("Rated:", value); // API Call to save rating can be added here
    };



    // Toggle chapter visibility
    const toggleChapter = (index) => {
        setOpenChapters((prev) => {
            const newSet = new Set(prev);
            newSet.has(index) ? newSet.delete(index) : newSet.add(index);
            return newSet;
        });
    };

    const handleQualityChange = (event) => {
        setVideoQuality(event.target.value);
        if (videoRef.current) {
            const currentTime = videoRef.current.currentTime;
            videoRef.current.src = currentLesson.url[event.target.value];
            videoRef.current.currentTime = currentTime; // Keep the current playback position
            videoRef.current.play();
        }
    };

    // Update progress on video time update
    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(percent);

            // Mark video as completed if fully watched
            if (percent >= 95) {
                setCompletedLessons((prev) => new Set([...prev, currentLesson.title]));
            }
        }
    };

    // Handle adding a new comment
    const handleAddComment = () => {
        if (newComment.trim() !== "") {
            const newEntry = {
                user: "John Doe", // Replace with dynamic user data
                text: newComment,
                timestamp: new Date(),
                expanded: false, // For "Show More"
            };
            setComments([...comments, newEntry]);
            setNewComment("");

            // Auto-scroll to the latest comment
            setTimeout(() => {
                if (commentBoxRef.current) {
                    commentBoxRef.current.scrollTop = commentBoxRef.current.scrollHeight;
                }
            }, 100);
        }
    };

    const toggleShowMore = (index) => {
        const updatedComments = [...comments];
        updatedComments[index].expanded = !updatedComments[index].expanded;
        setComments(updatedComments);
    };

    const getTimeAgo = (timestamp) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now - new Date(timestamp)) / 1000);
        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return new Date(timestamp).toLocaleDateString(); // Show full date if older
    };

    // Animation Variants
    const listVariants = {
        hidden: { opacity: 0, height: 0, overflow: "hidden" },
        visible: { opacity: 1, height: "auto", transition: { duration: 0.3, ease: "easeInOut" } },
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", backgroundColor: "white", color: "white", minHeight: "100vh" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 20px", backgroundColor: "black", color: "black" }}>
                <h5 style={{ color: "white", margin: 0 }}>{course.title}</h5>

                {/* Progress Circle & Leave Rating */}
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <button
                        style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}
                        onClick={() => setShowRatingModal(true)}
                    >
                        ★ Leave a Rating
                    </button>

                    <div style={{ width: 40, height: 40 }}>
                        <CircularProgressbar
                            value={progress}
                            text={`${Math.round(progress)}%`}
                            styles={buildStyles({ textSize: "30px", pathColor: "black", textColor: "white" })}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content (Video + Course Content) */}
            <div style={{ display: "flex", flex: 1, padding: "20px", gap: "20px" }}>

                {/* Left: Video Player */}
                <div style={{ flex: "7", backgroundColor: "white", borderRadius: "10px", padding: "10px" }}>
                    <div style={{ flex: "7", backgroundColor: "#000", borderRadius: "10px", padding: "10px", position: "relative" }}>



                        {/* Video Player */}
                        <video
                            ref={videoRef}
                            controls
                            width="100%"
                            style={{ borderRadius: "10px" }}
                            onTimeUpdate={handleTimeUpdate} // ✅ Call handleTimeUpdate
                            onWaiting={() => setLoading(true)}  // ✅ Show loader when buffering
                            onCanPlay={() => setLoading(false)} // ✅ Hide loader when video is ready
                        >
                            <source src={currentLesson.url?.[videoQuality] || currentLesson.url?.["360p"]} type="video/mp4" />
                        </video>

                        {/* Video Quality Selector */}
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                            <label style={{ color: "white", marginRight: "10px" }}>Quality:</label>
                            <select
                                value={videoQuality}
                                onChange={handleQualityChange}
                                style={{
                                    padding: "5px",
                                    backgroundColor: "#222",
                                    color: "white",
                                    border: "1px solid #444",
                                    borderRadius: "5px"
                                }}
                            >
                                <option value="360p">360p</option>
                                <option value="720p">720p</option>
                                <option value="1080p">1080p</option>
                            </select>
                        </div>

                        {/* Previous Button */}
                        {(() => {
                            let prevLesson = null;
                            for (let i = 0; i < course.chapters.length; i++) {
                                const lessons = course.chapters[i].lessons;
                                for (let j = 0; j < lessons.length; j++) {
                                    if (lessons[j].title === currentLesson.title) {
                                        if (j > 0) {
                                            prevLesson = lessons[j - 1];
                                        } else if (i > 0) {
                                            prevLesson = course.chapters[i - 1].lessons[course.chapters[i - 1].lessons.length - 1];
                                        }
                                        break;
                                    }
                                }
                            }
                            return prevLesson ? (
                                <button
                                    onClick={() => setCurrentLesson(prevLesson)}
                                    style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "10px",
                                        transform: "translateY(-50%)",
                                        background: "rgba(0, 0, 0, 0.5)",
                                        color: "white",
                                        border: "none",
                                        padding: "10px 15px",
                                        fontSize: "20px",
                                        cursor: "pointer",
                                        borderRadius: "50%",
                                    }}
                                >
                                    ❮
                                </button>
                            ) : null;
                        })()}

                        {/* Next Button */}
                        {(() => {
                            let nextLesson = null;
                            for (let i = 0; i < course.chapters.length; i++) {
                                const lessons = course.chapters[i].lessons;
                                for (let j = 0; j < lessons.length; j++) {
                                    if (lessons[j].title === currentLesson.title) {
                                        if (j < lessons.length - 1) {
                                            nextLesson = lessons[j + 1];
                                        } else if (i < course.chapters.length - 1) {
                                            nextLesson = course.chapters[i + 1].lessons[0];
                                        }
                                        break;
                                    }
                                }
                            }
                            return nextLesson ? (
                                <button
                                    onClick={() => setCurrentLesson(nextLesson)}
                                    style={{
                                        position: "absolute",
                                        top: "50%",
                                        right: "10px",
                                        transform: "translateY(-50%)",
                                        background: "rgba(0, 0, 0, 0.5)",
                                        color: "white",
                                        border: "none",
                                        padding: "10px 15px",
                                        fontSize: "20px",
                                        cursor: "pointer",
                                        borderRadius: "50%",
                                    }}
                                >
                                    ❯
                                </button>
                            ) : null;
                        })()}
                    </div>

                    {/* Video Name & Description */}
                    <div className="mt-3">
                        <h4 style={{ color: "black" }}>{currentLesson.title} </h4>
                        <p style={{ color: "black" }}>
                            {showFullDescription || currentLesson.description.length <= 100
                                ? currentLesson.description
                                : `${currentLesson.description.slice(0, 100)}... `}
                            {currentLesson.description.length > 100 && (
                                <span
                                    style={{ color: "black", cursor: "pointer" }}
                                    onClick={() => setShowFullDescription(!showFullDescription)}
                                >
                                    {showFullDescription ? " Show less" : " More..."}
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Comment Section */}
                    <div className="mt-4">
                        {/* Comment Input Field */}
                        <Form.Group className="mt-2" style={{ position: "relative" }}>
                            <>
                                <style>
                                    {`
                            .custom-placeholder::placeholder {
                                color: black !important;
                                opacity: 0.6;
                            }
                        `}
                                </style>

                                <Form.Control
                                    type="text"
                                    placeholder="Add a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    style={{
                                        backgroundColor: "white",
                                        color: "black",
                                        borderColor: "#444",
                                        paddingRight: "40px",
                                    }}
                                    className="custom-placeholder"
                                />
                            </>
                            <LuSendHorizontal
                                size={18}
                                style={{
                                    position: "absolute",
                                    right: "10px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    cursor: "pointer",
                                    color: newComment.trim() !== "" ? "#0d6efd" : "#888",
                                }}
                                onClick={handleAddComment}
                            />
                        </Form.Group>

                        {/* Display Comments Section */}
                        <div
                            ref={commentBoxRef}
                            className="mt-3"
                            style={{
                                maxHeight: "200px",
                                overflowY: "auto",
                                backgroundColor: "white",
                                padding: "10px",
                                borderRadius: "5px",
                            }}
                        >
                            {comments.length > 0 ? (
                                comments.map((comment, index) => (
                                    <div key={index} style={{
                                        padding: "5px 0", borderBottom: index !== comments.length - 1 ? "1px solid #444" : "none"
                                    }}>
                                        <strong style={{ color: "black" }}>{comment.user}</strong>{" "}
                                        <span style={{ fontSize: "12px", color: "black" }}>{getTimeAgo(comment.timestamp)}</span>
                                        <p style={{ color: "black", margin: "5px 0" }}>
                                            {comment.expanded || comment.text.length <= 100
                                                ? comment.text
                                                : `${comment.text.slice(0, 100)}... `}
                                            {comment.text.length > 100 && (
                                                <span
                                                    style={{ color: "black", cursor: "pointer" }}
                                                    onClick={() => toggleShowMore(index)}
                                                >
                                                    {comment.expanded ? " Show less" : " More..."}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: "black" }}>No comments yet. Be the first to comment!</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Course Content */}
                <div style={{
                    flex: "3",
                    backgroundColor: "white",
                    borderRadius: "10px",
                    padding: "15px",
                    color: "black",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" // Added subtle shadow for better look
                }}>
                    <h5 style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: "2px solid #ddd",
                        paddingBottom: "8px"
                    }}>
                        Course Chapter
                        <button
                            style={{
                                background: "none",
                                border: "none",
                                color: "black",
                                cursor: "pointer",
                                fontSize: "1.1rem"
                            }}
                            onClick={() => setIsCourseContentVisible(false)} // Close the chapter list
                        >
                            <FaTimes /> {/* Close Icon */}
                        </button>
                    </h5>

                    <AnimatePresence>
                        {isCourseContentVisible && (
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                variants={listVariants}
                            >
                                {course.chapters.map((chapter, chapterIndex) => (
                                    <Card key={chapterIndex} className="mb-2 shadow-sm">
                                        {/* Chapter Header */}
                                        <Card.Header
                                            className="fw-bold d-flex justify-content-between align-items-center"
                                            style={{
                                                cursor: "pointer",
                                                backgroundColor: "#0056b3",
                                                color: "white",
                                                padding: "10px"
                                            }}
                                            onClick={() => toggleChapter(chapterIndex)}
                                        >
                                            <div>{chapter.title}</div>
                                            <div className="d-flex align-items-center">
                                                <span className="text-white me-2" style={{ fontSize: "0.9rem" }}>
                                                    ({chapter.lessons.length} Lectures)
                                                </span>
                                                {openChapters.has(chapterIndex) ? <FaChevronUp /> : <FaChevronDown />}
                                            </div>
                                        </Card.Header>

                                        {/* Animated Chapter Content */}
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={openChapters.has(chapterIndex) ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.5, ease: "easeInOut" }}
                                            style={{ overflow: "hidden" }}
                                        >
                                            <Card.Body style={{ padding: "10px" }}>
                                                {chapter.lessons.map((lesson, lessonIndex) => (
                                                    <div
                                                        key={lessonIndex}
                                                        onClick={() => setCurrentLesson(lesson)}
                                                        style={{
                                                            cursor: "pointer",
                                                            padding: "8px 10px",
                                                            borderRadius: "5px",
                                                            backgroundColor: lesson.title === currentLesson.title ? "#616161" : "transparent",
                                                            color: lesson.title === currentLesson.title ? "white" : "#333",
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "center",
                                                            marginTop: "5px",
                                                            transition: "background 0.3s ease"
                                                        }}
                                                    >
                                                        <span><CameraVideo
                                                            className="me-2"
                                                            style={{ color: lesson.title === currentLesson?.title ? "white" : "blue" }}
                                                        />{lesson.title}</span>
                                                        {completedLessons.has(lesson.title) && <FaCheck color="#0d6efd" />}
                                                    </div>
                                                ))}
                                            </Card.Body>
                                        </motion.div>
                                    </Card>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>

            {/* Rating Modal */}
            <Modal show={showRatingModal} onHide={() => setShowRatingModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Rate this Course</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                            key={star}
                            size={30}
                            style={{ cursor: "pointer", color: star <= rating ? "#fcbf49" : "#ccc" }}
                            onClick={() => handleRating(star)}
                        />
                    ))}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default VideoPlayer;
