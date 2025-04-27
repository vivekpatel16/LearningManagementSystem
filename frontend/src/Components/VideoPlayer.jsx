import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Form, Modal, Spinner, Alert, Dropdown, Placeholder } from "react-bootstrap";
import { FaStar, FaPlay, FaPause, FaExpand, FaVolumeMute, FaVolumeUp, FaChevronDown, FaChevronUp, FaTimes, FaEllipsisV, FaEdit, FaTrash, FaChevronLeft, FaList } from "react-icons/fa";
import { CameraVideo } from "react-bootstrap-icons";
import { LuSendHorizontal } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import axiosInstance from '../Api/axiosInstance';
import { toast } from "react-hot-toast";
import common_API from "../Api/commonApi";

// Add the formatDuration function
const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (minutes < 60) {
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
};

const VideoPlayer = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [courseData, setCourseData] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [selectedRating, setSelectedRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [isCourseContentVisible, setIsCourseContentVisible] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [comments, setComments] = useState([]);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [completedLessons, setCompletedLessons] = useState(new Set());
    const [openChapters, setOpenChapters] = useState(new Set([0])); // First chapter open by default
    const [averageRating, setAverageRating] = useState(0);
    const [totalRatings, setTotalRatings] = useState(0);
    const [userRating, setUserRating] = useState(0);
    const [hasRated, setHasRated] = useState(false);
    const [videoLoading, setVideoLoading] = useState(true);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [editingComment, setEditingComment] = useState(null);
    const [editCommentText, setEditCommentText] = useState("");
    const [showEditModal, setShowEditModal] = useState(false);
    const [courseProgress, setCourseProgress] = useState(0);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(true);
    const [videoError, setVideoError] = useState(null);
    
    const videoRef = useRef(null);
    const commentBoxRef = useRef(null);

    // Add state for tracking video progress map
    const [videoProgressMap, setVideoProgressMap] = useState(new Map());

    // Add state for video duration
    const [videoDuration, setVideoDuration] = useState(0);

    // Near the top with other state declarations, add a ref to track initial progress loading
    const initialProgressLoaded = useRef(false);

    // Add state to detect if we're on mobile
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    
    // Add state for active tab on mobile
    const [activeTab, setActiveTab] = useState('overview');
    
    // Add responsive styles for mobile
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        window.addEventListener('resize', handleResize);
        
        // Add mobile-only CSS
        const styleTag = document.createElement('style');
        styleTag.innerHTML = `
            @media (max-width: 768px) {
                /* Main container adjustments */
                .video-player-mobile-container {
                    flex-direction: column !important;
                    overflow: auto !important;
                    height: auto !important;
                }
                
                /* Video player adjustments */
                .video-player-area {
                    margin: 12px 12px 0 12px !important;
                    width: calc(100% - 24px) !important;
                    height: auto !important;
                    max-height: none !important;
                    flex: none !important;
                    border-radius: 8px 8px 0 0 !important;
                    overflow: hidden !important;
                }
                
                /* Mobile tabs navigation */
                .mobile-tabs {
                    display: flex !important;
                    background-color: white !important;
                    border-bottom: 1px solid #dee2e6 !important;
                    width: calc(100% - 24px) !important;
                    margin: 0 12px !important;
                    border-radius: 0 !important;
                }
                
                .mobile-tab {
                    flex: 1 !important;
                    padding: 12px !important;
                    text-align: center !important;
                    font-weight: 500 !important;
                    color: #6c757d !important;
                    border-bottom: 3px solid transparent !important;
                    transition: all 0.2s !important;
                    cursor: pointer !important;
                }
                
                .mobile-tab.active {
                    color: #0062E6 !important;
                    border-bottom: 3px solid #0062E6 !important;
                }
                
                /* Tab content container */
                .mobile-content-area {
                    background: white !important;
                    width: calc(100% - 24px) !important;
                    margin: 0 12px 12px 12px !important;
                    border-radius: 0 0 8px 8px !important;
                    overflow: hidden !important;
                }
                
                /* Mobile tab content */
                .mobile-tab-content {
                    padding: 15px !important;
                    color: #333 !important;
                }
                
                /* Video info in overview */
                .mobile-video-info {
                    margin-bottom: 15px !important;
                }
                
                /* Course content scrollable */
                .mobile-course-content {
                    max-height: 500px !important;
                    overflow-y: auto !important;
                }
                
                /* Hide desktop elements on mobile */
                .desktop-only {
                    display: none !important;
                }
            }
        `;
        document.head.appendChild(styleTag);
        
        return () => {
            window.removeEventListener('resize', handleResize);
            document.head.removeChild(styleTag);
        };
    }, []);

    // Move fetchCourseData outside of useEffect
    const fetchCourseData = async () => {
        try {
            setIsLoading(true);
            
            const token = localStorage.getItem('token');
            if (!token) {
                setError("Please login to view course content");
                return;
            }

            const courseId = location.state?.courseData?._id;
            if (!courseId) {
                setError("No course data available");
                return;
            }

            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            const userId = tokenPayload.id;

            // Use course data from location state
            const course = location.state?.courseData;
            setCourseData(course);

            // Fetch chapters for the course
            const chaptersResponse = await axiosInstance.get(
                `/courses/chapter/${courseId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            
            if (chaptersResponse.status === 200) {
                const chaptersData = chaptersResponse.data || [];
                
                // Fetch videos for each chapter
                const chaptersWithVideos = await Promise.all(
                    chaptersData.map(async (chapter) => {
                        try {
                            const videosResponse = await axiosInstance.get(
                                `/courses/video/${chapter._id}`,
                                {
                                    headers: { Authorization: `Bearer ${token}` }
                                }
                            );
                            
                            return {
                                ...chapter,
                                videos: videosResponse.data || []
                            };
                        } catch (err) {
                            console.error(`Error fetching videos for chapter ${chapter._id}:`, err);
                            return {
                                ...chapter,
                                videos: []
                            };
                        }
                    })
                );
                
                setChapters(chaptersWithVideos);
                
                // Set initial video
                let initialVideo = null;
                if (location.state?.videoData) {
                    initialVideo = location.state.videoData;
                } else {
                    // Find the first chapter with videos
                    for (const chapter of chaptersWithVideos) {
                        if (chapter.videos && chapter.videos.length > 0) {
                            initialVideo = chapter.videos[0];
                            break;
                        }
                    }
                }
                
                if (initialVideo) {
                    const normalizedVideo = {
                        _id: initialVideo._id,
                        title: initialVideo.title || initialVideo.video_title,
                        description: initialVideo.description || initialVideo.video_description,
                        videoUrl: initialVideo.videoUrl || initialVideo.video_url,
                        video_length: initialVideo.video_length,
                        ...initialVideo
                    };
                    
                    setCurrentLesson(normalizedVideo);
                    
                    // Load video progress immediately after setting the current lesson
                    console.log("Loading initial video progress for:", normalizedVideo._id);
                    
                    // We need to set this with a slight delay to ensure state is updated
                    setTimeout(() => {
                        loadVideoProgress(normalizedVideo._id);
                    }, 100);
                }

                // Fetch and initialize progress data for all videos in the course
                const initializeVideoProgress = async () => {
                    // Get a list of all video IDs from all chapters
                    const allVideoIds = [];
                    const videoDetailsMap = new Map();
                    
                    chaptersWithVideos.forEach(chapter => {
                        chapter.videos.forEach(video => {
                            allVideoIds.push(video._id);
                            videoDetailsMap.set(video._id, video);
                        });
                    });
                    
                    // Fetch progress data for all videos in the course
                    try {
                        const allProgressResponse = await axiosInstance.get(
                            `/courses/enrolled`,
                            {
                                headers: { Authorization: `Bearer ${token}` }
                            }
                        );
                        
                        if (allProgressResponse.data && allProgressResponse.data.success) {
                            // Find this course's progress data
                            const thisCourse = allProgressResponse.data.data.find(
                                course => course._id === courseId
                            );
                            
                            if (thisCourse) {
                                // If server provided an overall course progress, use it
                                if (typeof thisCourse.progress === 'number') {
                                    setCourseProgress(thisCourse.progress);
                                    initialProgressLoaded.current = true;
                                }
                                
                                // We need to fetch individual video progress data
                                for (const videoId of allVideoIds) {
                                    try {
                                        const videoProgressResponse = await axiosInstance.get(
                                            `/courses/video/progress/${userId}/${courseId}/${videoId}`,
                                            {
                                                headers: { Authorization: `Bearer ${token}` }
                                            }
                                        );
                                        
                                        if (videoProgressResponse.data && videoProgressResponse.data.success) {
                                            const { current_time, completed, progress_percent } = videoProgressResponse.data.data;
                                            
                                            // If this video is completed, add it to completedLessons
                                            if (completed) {
                                                setCompletedLessons(prev => new Set([...prev, videoId]));
                                            }
                                            
                                            // Store progress data in the map
                                            const videoDetails = videoDetailsMap.get(videoId);
                                            setVideoProgressMap(prev => {
                                                const newMap = new Map(prev);
                                                newMap.set(videoId, {
                                                    watchedTime: current_time || 0,
                                                    duration: videoDetails?.video_length || 0,
                                                    percent: progress_percent || 0
                                                });
                                                return newMap;
                                            });
                                        }
                                    } catch (err) {
                                        console.error(`Error fetching progress for video ${videoId}:`, err);
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        console.error("Error initializing all video progress:", err);
                    }
                };
                
                // Only initialize progress data for all videos if needed
                if (!initialProgressLoaded.current) {
                    initializeVideoProgress();
                }

                // Fetch course rating
                const avgResponse = await common_API.get(`/rating/${courseId}`);
                if (avgResponse.status === 200) {
                    setAverageRating(avgResponse.data.averageRating || 0);
                    setTotalRatings(avgResponse.data.ratings?.length || 0);
                }

                // Check if user has already rated this course
                try {
                    const userRatings = avgResponse.data.ratings || [];
                    const userRating = userRatings.find(r => r.user_id?._id === userId);
                    
                    if (userRating) {
                        setUserRating(userRating.rating);
                        setHasRated(true);
                        setSelectedRating(userRating.rating);
                    } else {
                        setHasRated(false);
                        setUserRating(0);
                        setSelectedRating(0);
                    }
                } catch (ratingError) {
                    console.error("Error checking user rating:", ratingError);
                }
            }
        } catch (error) {
            console.error('Error fetching course data:', error);
            setError(error.response?.data?.message || 'Failed to load course data');
        } finally {
            setIsLoading(false);
        }
    };

    // Update the checkEnrollment useEffect
    useEffect(() => {
        const checkEnrollment = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError("Please login to view course content");
                    return;
                }

                const courseId = location.state?.courseData?._id;
                if (!courseId) {
                    setError("No course data available");
                    return;
                }

                // Get user ID from token
                const tokenPayload = JSON.parse(atob(token.split('.')[1]));
                const userId = tokenPayload.id;

                // Check if user is enrolled
                const enrollmentResponse = await axiosInstance.get(
                    `/courses/enrollment/${courseId}`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                if (enrollmentResponse.status === 200) {
                    setIsEnrolled(true);
                    
                    // Fetch course progress data first to set it immediately
                    try {
                        const allProgressResponse = await axiosInstance.get(
                            `/courses/enrolled`,
                            {
                                headers: { Authorization: `Bearer ${token}` }
                            }
                        );
                        
                        if (allProgressResponse.data && allProgressResponse.data.success) {
                            const thisCourse = allProgressResponse.data.data.find(
                                course => course._id === courseId
                            );
                            
                            if (thisCourse && typeof thisCourse.progress === 'number') {
                                // Set the course progress directly from the server
                                setCourseProgress(thisCourse.progress);
                                initialProgressLoaded.current = true;
                            }
                        }
                    } catch (err) {
                        console.error('Error fetching course progress:', err);
                    }
                    
                    // Check if we have progress data passed directly via location state
                    if (location.state?.progressData) {
                        console.log("Using progress data passed from course page:", location.state.progressData);
                        const { current_time, completed, progress_percent, course_progress } = location.state.progressData;
                        
                        // If server returned a course progress value, use it
                        if (course_progress !== undefined) {
                            setCourseProgress(course_progress);
                            initialProgressLoaded.current = true;
                        }
                        
                        // Store this progress data in our map
                        if (location.state?.videoData?._id) {
                            setVideoProgressMap(prev => {
                                const newMap = new Map(prev);
                                newMap.set(location.state.videoData._id, {
                                    watchedTime: current_time,
                                    duration: location.state.videoData.video_length || 0,
                                    percent: progress_percent || 0
                                });
                                return newMap;
                            });
                            
                            // If it's completed, add to completed lessons
                            if (completed) {
                                setCompletedLessons(prev => new Set([...prev, location.state.videoData._id]));
                            }
                        }
                    }
                    
                    // Fetch course data after confirming enrollment
                    await fetchCourseData();
                } else {
                    // User is not enrolled, redirect to course page
                    toast.error("Please enroll in the course to watch videos");
                    navigate(`/course/${courseId}`);
                }
            } catch (error) {
                console.error('Error checking enrollment:', error);
                if (error.response?.status === 404) {
                    // User is not enrolled, redirect to course page
                    toast.error("Please enroll in the course to watch videos");
                    navigate(`/course/${location.state?.courseData?._id}`);
                } else {
                    setError("Failed to check enrollment status");
                }
            } finally {
                setIsCheckingEnrollment(false);
            }
        };

        checkEnrollment();
    }, [location.state, navigate]);

    // Modify the useEffect that updates course progress when completedLessons changes
    useEffect(() => {
        // Only update course progress if the initial progress hasn't been loaded yet
        // or if completedLessons or videoProgressMap has changed after initial load
        if (!initialProgressLoaded.current && chapters.length > 0) {
            setCourseProgress(calculateCourseProgress());
        }
    }, [completedLessons, videoProgressMap, chapters]);

    // Make sure to call calculateCourseProgress after fetching the initial data
    useEffect(() => {
        if (!isLoading && chapters.length > 0 && !initialProgressLoaded.current) {
            // Calculate initial course progress only if it wasn't already set from server
            setCourseProgress(calculateCourseProgress());
        }
    }, [isLoading, chapters]);

    // Update progress on video time update
    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        
        const currentTime = videoRef.current.currentTime;
        const duration = videoRef.current.duration;
        
        // Don't proceed if duration is not available yet
        if (!duration || isNaN(duration)) return;
        
        const percent = (currentTime / duration) * 100;
        
        // Update individual video progress
        setProgress(percent);
        setVideoDuration(duration);

        // Update progress map for current video
        if (currentLesson?._id) {
            setVideoProgressMap(prev => {
                const newMap = new Map(prev);
                newMap.set(currentLesson._id, {
                    watchedTime: currentTime,
                    duration: duration,
                    percent: percent,
                    video_length: currentLesson.video_length || duration // Store both the original video_length and current duration
                });
                return newMap;
            });
        }

        // Save video progress to backend
        if (currentLesson?._id && courseData?._id && percent > 0) {
            // Save progress every 5 seconds or when reaching important thresholds
            if (Math.floor(currentTime) % 5 === 0 || percent >= 95) {
                const isCompleted = percent >= 95;
                saveVideoProgress(currentTime, isCompleted);
                
                // Mark video as completed if watched more than 95%
                if (isCompleted && !completedLessons.has(currentLesson._id)) {
                    setCompletedLessons(prev => new Set([...prev, currentLesson._id]));
                }
            }
        }
    };

    // Function to save video progress to the backend
    const saveVideoProgress = async (currentTime, completed) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            const userId = tokenPayload.id;
            
            if (!courseData?._id || !currentLesson?._id) {
                console.error("Missing courseData or currentLesson data");
                return;
            }
            
            // Calculate video progress percentage
            let progressPercent = 0;
            if (videoRef.current && videoRef.current.duration) {
                progressPercent = (currentTime / videoRef.current.duration) * 100;
            }
            
            console.log("Saving video progress:", {
                user_id: userId,
                course_id: courseData._id,
                video_id: currentLesson._id,
                current_time: currentTime,
                progress_percent: progressPercent,
                completed: completed
            });

            // Call the backend API to update video progress
            const response = await axiosInstance.post(
                '/courses/video/progress',
                {
                    user_id: userId,
                    course_id: courseData._id,
                    video_id: currentLesson._id,
                    current_time: currentTime,
                    progress_percent: progressPercent,
                    completed: completed
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data && response.data.success) {
                console.log("Video progress saved successfully:", response.data);
                
                // Update completedLessons based on server response for consistency
                if (response.data.data && response.data.data.completed) {
                    // Add to completed lessons if it's not already there
                    if (!completedLessons.has(currentLesson._id)) {
                        setCompletedLessons(prev => new Set([...prev, currentLesson._id]));
                    }
                } else if (response.data.data && !response.data.data.completed) {
                    // Remove from completed lessons if it's there
                    if (completedLessons.has(currentLesson._id)) {
                        setCompletedLessons(prev => {
                            const newSet = new Set([...prev]);
                            newSet.delete(currentLesson._id);
                            return newSet;
                        });
                    }
                }
                
                // Update progress map with saved progress
                setVideoProgressMap(prev => {
                    const newMap = new Map(prev);
                    newMap.set(currentLesson._id, {
                        watchedTime: currentTime,
                        duration: videoRef.current?.duration || 0,
                        percent: progressPercent
                    });
                    return newMap;
                });
                
                // Use the course_progress from the server response if available
                if (response.data.data.course_progress !== undefined) {
                    setCourseProgress(response.data.data.course_progress);
                } else {
                    // Fallback to local calculation if server doesn't provide course progress
                    setCourseProgress(calculateCourseProgress());
                }
            }
        } catch (error) {
            console.error("Error saving video progress:", error);
        }
    };

    // Toggle chapter visibility
    const toggleChapter = (index) => {
        setOpenChapters(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    // Fetch comments for the current video
    const fetchComments = async (videoId) => {
        if (!videoId) return;
        
        try {
            setIsLoadingComments(true);
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.error("No authentication token found");
                return;
            }
            
            // Update the API endpoint to match backend routes
            const response = await axiosInstance.get(
                `/courses/comment/${videoId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            
            if (response.status === 200) {
                console.log("Comments fetched successfully:", response.data);
                // Transform the API comments to match our UI format
                const formattedComments = response.data.comments.map(comment => ({
                    id: comment._id,
                    user: comment.user_id.user_name || "Anonymous",
                    text: comment.comment,
                    userId: comment.user_id._id,
                    timestamp: new Date(comment.createdAt),
                    expanded: false
                }));
                setComments(formattedComments);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
            if (error.response?.status === 404) {
                // No comments yet, set empty array
                setComments([]);
            } else {
                toast.error("Failed to load comments");
            }
        } finally {
            setIsLoadingComments(false);
        }
    };
    
    // Add a new comment
    const handleAddComment = async () => {
        if (!newComment.trim() || !currentLesson?._id) return;
        
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                toast.error('Please login to add a comment');
                return;
            }
            
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            const userId = tokenPayload.id;
            const userName = tokenPayload.name || "You";
            
            // Optimistically update UI
            const tempComment = {
                id: `temp-${Date.now()}`,
                user: userName,
                text: newComment,
                userId: userId,
                timestamp: new Date(),
                expanded: false,
                isSending: true
            };
            
            setComments(prev => [tempComment, ...prev]);
            setNewComment("");
            
            // Update API endpoint to match backend routes
            const response = await axiosInstance.post(
                '/courses/comment',
                {
                    user_id: userId,
                    video_id: currentLesson._id,
                    comment_text: newComment
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            
            if (response.status === 200) {
                console.log("Comment added successfully:", response.data);
                // Replace temp comment with actual server response
                fetchComments(currentLesson._id);

            // Auto-scroll to the latest comment
            setTimeout(() => {
                if (commentBoxRef.current) {
                        commentBoxRef.current.scrollTop = 0; // Scroll to top since newest comments are at the top
                }
            }, 100);
            }
        } catch (error) {
            console.error("Error adding comment:", error);
            toast.error("Failed to add comment. Please try again.");
            // Remove the optimistic comment
            setComments(prev => prev.filter(c => !c.isSending));
        }
    };
    
    // Delete a comment
    const handleDeleteComment = async (commentId) => {
        if (!commentId) return;
        
        if (!window.confirm("Are you sure you want to delete this comment?")) {
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                toast.error('Please login to delete a comment');
                return;
            }
            
            // Optimistically update UI
            const commentsCopy = [...comments];
            setComments(prev => prev.filter(c => c.id !== commentId));
            
            // Update API endpoint to match backend routes
            const response = await axiosInstance.delete(
                `/courses/comment/${commentId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            
            if (response.status === 200) {
                console.log("Comment deleted successfully:", response.data);
                toast.success("Comment deleted");
            }
        } catch (error) {
            console.error("Error deleting comment:", error);
            toast.error("Failed to delete comment");
            // Restore comments if failed
            setComments(commentsCopy);
        }
    };
    
    // Edit a comment
    const handleEditComment = async () => {
        if (!editingComment || !editCommentText.trim()) return;
        
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                toast.error('Please login to edit a comment');
                return;
            }
            
            // Optimistically update UI
            const updatedComments = comments.map(c => 
                c.id === editingComment.id 
                    ? {...c, text: editCommentText, isEditing: true} 
                    : c
            );
            setComments(updatedComments);
            
            // Update API endpoint to match backend routes
            const response = await axiosInstance.patch(
                `/courses/comment/${editingComment.id}`,
                {
                    comment_text: editCommentText
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            
            if (response.status === 200) {
                console.log("Comment edited successfully:", response.data);
                // Update with server response
                fetchComments(currentLesson._id);
                toast.success("Comment updated");
            }
            
            // Close modal and reset state
            setShowEditModal(false);
            setEditingComment(null);
            setEditCommentText("");
            
        } catch (error) {
            console.error("Error editing comment:", error);
            toast.error("Failed to update comment");
            // Refresh comments to revert changes
            fetchComments(currentLesson._id);
        }
    };
    
    // Check if the current user is the comment author
    const isCommentAuthor = (comment) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return false;
            
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            const userId = tokenPayload.id;
            
            return comment.userId === userId;
        } catch (error) {
            console.error("Error checking comment author:", error);
            return false;
        }
    };
    
    // Open edit modal for a comment
    const openEditModal = (comment) => {
        setEditingComment(comment);
        setEditCommentText(comment.text);
        setShowEditModal(true);
    };

    // Update current lesson and fetch comments
    useEffect(() => {
        if (currentLesson?._id) {
            fetchComments(currentLesson._id);
        }
    }, [currentLesson?._id]);

    // Toggle comment expansion
    const toggleShowMore = (index) => {
        const updatedComments = [...comments];
        updatedComments[index].expanded = !updatedComments[index].expanded;
        setComments(updatedComments);
    };

    // Format time for comment display
    const getTimeAgo = (timestamp) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now - new Date(timestamp)) / 1000);
        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    // Render stars for ratings
    const renderStars = (rating, interactive = false) => {
        return [...Array(5)].map((_, i) => (
            <FaStar
                key={i}
                style={{
                    color: i < (interactive ? hoveredRating || selectedRating : rating) ? "#ffdd00" : "#e4e5e9",
                    fontSize: "1rem",
                    cursor: interactive ? "pointer" : "default",
                    marginRight: "3px",
                    filter: i < (interactive ? hoveredRating || selectedRating : rating) ? "drop-shadow(0 0 2px rgba(255, 221, 0, 0.3))" : "none"
                }}
                onClick={() => interactive && setSelectedRating(i + 1)}
                onMouseEnter={() => interactive && setHoveredRating(i + 1)}
                onMouseLeave={() => interactive && setHoveredRating(0)}
            />
        ));
    };

    // Find previous and next lessons
    const findPrevNextLessons = () => {
        if (!currentLesson || !chapters.length) return { prev: null, next: null };
        
        let prevLesson = null;
        let nextLesson = null;
        let currentChapterIndex = -1;
        let currentVideoIndex = -1;
        
        // Find current video in chapters
        chapters.forEach((chapter, chapterIndex) => {
            const videoIndex = chapter.videos.findIndex(video => video._id === currentLesson._id);
            if (videoIndex !== -1) {
                currentChapterIndex = chapterIndex;
                currentVideoIndex = videoIndex;
            }
        });
        
        if (currentChapterIndex === -1) return { prev: null, next: null };
        
        // Find previous video
        if (currentVideoIndex > 0) {
            // Previous video in same chapter
            prevLesson = chapters[currentChapterIndex].videos[currentVideoIndex - 1];
        } else if (currentChapterIndex > 0) {
            // Last video of previous chapter
            const prevChapter = chapters[currentChapterIndex - 1];
            if (prevChapter.videos.length > 0) {
                prevLesson = prevChapter.videos[prevChapter.videos.length - 1];
            }
        }
        
        // Find next video
        if (currentVideoIndex < chapters[currentChapterIndex].videos.length - 1) {
            // Next video in same chapter
            nextLesson = chapters[currentChapterIndex].videos[currentVideoIndex + 1];
        } else if (currentChapterIndex < chapters.length - 1) {
            // First video of next chapter
            const nextChapter = chapters[currentChapterIndex + 1];
            if (nextChapter.videos.length > 0) {
                nextLesson = nextChapter.videos[0];
            }
        }
        
        return { 
            prev: prevLesson ? { ...prevLesson, chapterTitle: chapters[currentChapterIndex].chapter_title } : null,
            next: nextLesson ? { 
                ...nextLesson, 
                chapterTitle: currentVideoIndex < chapters[currentChapterIndex].videos.length - 1 
                    ? chapters[currentChapterIndex].chapter_title 
                    : chapters[currentChapterIndex + 1].chapter_title 
            } : null
        };
    };

    // Animation variants
    const listVariants = {
        hidden: { opacity: 0, height: 0, overflow: "hidden" },
        visible: { opacity: 1, height: "auto", transition: { duration: 0.3, ease: "easeInOut" } },
    };

    // Add a helper function to properly format the video URL
    const formatVideoUrl = (videoPath) => {
        if (!videoPath) return null;
        if (videoPath.startsWith('http')) return videoPath;
        return `http://localhost:5000/${videoPath.replace(/^\//, '')}`;
    };

    // Add the loadVideoProgress function to fetch progress when switching videos
    const loadVideoProgress = async (videoId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token || !courseData?._id) return;

            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            const userId = tokenPayload.id;

            const response = await axiosInstance.get(
                `/courses/video/progress/${userId}/${courseData._id}/${videoId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success && response.data.data) {
                const { current_time, completed, progress_percent, course_progress } = response.data.data;
                
                console.log("Setting video time to:", current_time);
                
                // Get the current video's duration from the video element or progress map
                const currentDuration = videoRef.current?.duration || 
                    videoProgressMap.get(videoId)?.duration || 
                    currentLesson?.video_length || 0;
                
                // Store the progress data in the map
                setVideoProgressMap(prev => {
                    const newMap = new Map(prev);
                    newMap.set(videoId, {
                        watchedTime: current_time,
                        duration: currentDuration,
                        percent: progress_percent || 0,
                        video_length: currentLesson?.video_length || currentDuration
                    });
                    return newMap;
                });
                
                // Set progress directly if available
                if (progress_percent) {
                    setProgress(progress_percent);
                }
                
                // Mark video as completed if needed
                if (completed) {
                    setCompletedLessons(prev => {
                        if (!prev.has(videoId)) {
                            return new Set([...prev, videoId]);
                        }
                        return prev;
                    });
                } else {
                    setCompletedLessons(prev => {
                        if (prev.has(videoId)) {
                            const newSet = new Set([...prev]);
                            newSet.delete(videoId);
                            return newSet;
                        }
                        return prev;
                    });
                }
                
                // Set video time if possible
                if (current_time > 0 && videoRef.current && videoRef.current.readyState >= 2) {
                        console.log("Video already loaded, setting time immediately");
                        videoRef.current.currentTime = current_time;
                }
                
                // Update course progress from server response if available
                if (course_progress !== undefined) {
                    setCourseProgress(course_progress);
                    initialProgressLoaded.current = true;
                }
            }
        } catch (error) {
            console.error("Error loading video progress:", error);
        }
    };

    // Update video navigation handler
    const handleVideoNavigation = (video) => {
        if (!video) {
            console.error("No video data provided");
            return;
        }
        
        console.log("Navigating to video:", video);
        
        // Save progress for current video before changing
        if (videoRef.current && currentLesson?._id) {
            const currentTime = videoRef.current.currentTime;
            const videoDuration = videoRef.current.duration;
            const completed = (currentTime / videoDuration) * 100 >= 95;
            saveVideoProgress(currentTime, completed);
        }
        
        // Normalize the video data
        const normalizedVideo = {
            _id: video._id,
            title: video.title || video.video_title,
            description: video.description || video.video_description,
            videoUrl: video.videoUrl || video.video_url,
            video_length: video.video_length,
            chapterTitle: video.chapterTitle,
            ...video
        };

        // Validate video URL
        const formattedUrl = formatVideoUrl(normalizedVideo.videoUrl);
        if (!formattedUrl) {
            console.error("Invalid video URL:", normalizedVideo.videoUrl);
            setVideoError("Invalid video URL. Please try another video.");
            toast.error("Failed to load video");
            return;
        }
        
        // Update video URL and reset states
        normalizedVideo.videoUrl = formattedUrl;
        setCurrentLesson(normalizedVideo);
        setVideoLoading(true);
        setVideoError(null);
        setProgress(0);
        setComments([]);
        
        // Reset video player first to ensure clean state
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.removeAttribute('src');
            videoRef.current.load();
        }
        
        // Load video progress - do this with a slight delay to ensure state updates
        setTimeout(() => {
            loadVideoProgress(normalizedVideo._id);
        }, 100);
        
        // Open the chapter containing this video in the sidebar
        const chapterIndex = chapters.findIndex(chapter => 
            chapter.videos.some(v => v._id === video._id)
        );
        if (chapterIndex !== -1) {
            setOpenChapters(prev => new Set([...prev, chapterIndex]));
        }
        
        // Fetch comments for the new video
        fetchComments(normalizedVideo._id);
    };

    // Handle rating submission
    const handleRating = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Please login to rate the course');
                return;
            }

            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            const userId = tokenPayload.id;
            
            if (!courseData || !courseData._id) {
                toast.error('Course information is missing');
                return;
            }

            // Determine if this is a new rating or an update to an existing rating
            if (hasRated) {
                // Update existing rating
                console.log("Updating existing rating to:", selectedRating);
                
                // Include user_id explicitly in the request body
                const response = await axiosInstance.patch(
                    `/courses/rating/${courseData._id}`,
                    {
                        user_id: userId,
                        rating: selectedRating
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                if (response.status === 200) {
                    // Update the UI immediately with the new rating
                    setUserRating(selectedRating);
                    setShowRatingModal(false);
                    setHoveredRating(0);
                    
                    // Fetch updated average rating
                    await refreshRatingData(courseData._id, userId, token);
                    
                    toast.success('Rating updated successfully!');
                }
            } else {
                // Submit new rating
                console.log("Submitting new rating:", selectedRating);
                const response = await axiosInstance.post(
                    '/courses/rating',
                    {
                        user_id: userId,
                        course_id: courseData._id,
                        rating: selectedRating
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                if (response.status === 200 || response.status === 201) {
                    // Update local state
                    setUserRating(selectedRating);
                    setHasRated(true);
                    setShowRatingModal(false);
                    setHoveredRating(0);

                    // Fetch updated average rating
                    await refreshRatingData(courseData._id, userId, token);

                    toast.success('Rating submitted successfully!');
                }
            }
        } catch (error) {
            console.error('Error handling rating:', error);
            if (error.response?.status === 400 && error.response?.data?.message === "user has already rated the course") {
                // User has already rated - show helpful message and set hasRated to true to enable editing
                toast.error('You have already rated this course. Please use the edit option instead.');
                setHasRated(true);
                setShowRatingModal(false);
            } else if (error.response?.status === 404 && error.response?.data?.message === "rating not found") {
                toast.error('Your previous rating could not be found. Please try submitting a new rating.');
                setHasRated(false);
            } else {
                toast.error(error.response?.data?.message || 'Failed to process rating');
            }
        }
    };

    // Helper function to refresh rating data from the server
    const refreshRatingData = async (courseId, userId, token) => {
        try {
            // Fetch updated average rating
            const avgResponse = await axiosInstance.get(
                `/common/rating/${courseId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            
            if (avgResponse.status === 200) {
                const ratingData = avgResponse.data;
                setAverageRating(ratingData.averageRating || 0);
                setTotalRatings(ratingData.ratings?.length || 0);
                
                // Find and update the user's rating in the local state
                const userRating = ratingData.ratings.find(r => r.user_id?._id === userId);
                if (userRating) {
                    console.log("Updated user rating found:", userRating);
                    setUserRating(userRating.rating);
                    setSelectedRating(userRating.rating);
                    setHasRated(true);
                } else {
                    // If no user rating found in the ratings array, reset the user rating
                    console.log("No user rating found in ratings array");
                    setUserRating(0);
                    setSelectedRating(0);
                    setHasRated(false);
                }
            }
        } catch (error) {
            console.error("Error refreshing rating data:", error);
            
            // Try common_API as fallback (this is needed because the backend uses different routes)
            try {
                console.log("Trying fallback rating endpoint");
                const response = await common_API.get(`/rating/${courseId}`);
                if (response.status === 200) {
                    const ratingData = response.data;
                    setAverageRating(ratingData.averageRating || 0);
                    setTotalRatings(ratingData.ratings?.length || 0);
                    
                    // Find and update the user's rating
                    const userRating = ratingData.ratings.find(r => r.user_id?._id === userId);
                    if (userRating) {
                        console.log("Updated user rating found (fallback):", userRating);
                        setUserRating(userRating.rating);
                        setSelectedRating(userRating.rating);
                        setHasRated(true);
                    } else {
                        // If no user rating found in the ratings array, reset the user rating
                        console.log("No user rating found in ratings array (fallback)");
                        setUserRating(0);
                        setSelectedRating(0);
                        setHasRated(false);
                    }
                }
            } catch (fallbackError) {
                console.error("Error with fallback rating refresh:", fallbackError);
                
                // As a final fallback, set default values if both API calls fail
                setAverageRating(0);
                setTotalRatings(0);
                setUserRating(0);
                setSelectedRating(0);
                setHasRated(false);
            }
        }
    };

    // Update the calculateCourseProgress function to be more consistent
    const calculateCourseProgress = () => {
        if (!chapters || chapters.length === 0) return 0;
        
        // Count total videos across all chapters
        const totalVideos = chapters.reduce((total, chapter) => 
            total + (chapter.videos?.length || 0), 0);
        
        if (totalVideos === 0) return 0;
        
        // Get list of all video IDs for the course
        const allVideoIds = new Set();
        chapters.forEach(chapter => {
            chapter.videos?.forEach(video => {
                allVideoIds.add(video._id);
            });
        });
        
        // Count completed videos
        let completedCount = 0;
        allVideoIds.forEach(videoId => {
            if (completedLessons.has(videoId)) {
                completedCount++;
            }
        });
        
        // Calculate partial progress for videos in progress but not completed
        let totalPartialProgress = 0;
        allVideoIds.forEach(videoId => {
            if (!completedLessons.has(videoId)) {
                const progress = videoProgressMap.get(videoId);
                if (progress && progress.percent > 0) {
                    totalPartialProgress += progress.percent / 100;
                }
            }
        });
        
        // Calculate total progress percentage
        const progressPercent = Math.min(
            100, 
            Math.round(((completedCount + totalPartialProgress) / totalVideos) * 100)
        );
        
        console.log("Course progress calculation:", { 
            totalVideos, 
            completedCount, 
            totalPartialProgress,
            progressPercent
        });
        
        return progressPercent;
    };

    if (isLoading) {
    return (
            <div className="p-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
                {/* Enhanced skeleton for header */}
                <div className="d-flex justify-content-between align-items-center mb-4" style={{ 
                    background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)",
                    height: "60px", 
                    borderRadius: "8px",
                    padding: "0 20px"
                }}>
                    <div className="d-flex align-items-center gap-3">
                        <Placeholder as="div" animation="glow" className="m-0">
                            <Placeholder xs={1} style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        </Placeholder>
                        <Placeholder as="div" animation="glow" className="m-0">
                            <Placeholder xs={6} style={{ width: "180px", height: "20px", borderRadius: "4px" }} />
                        </Placeholder>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <Placeholder as="div" animation="glow" className="m-0">
                            <Placeholder xs={4} style={{ width: "100px", height: "24px", borderRadius: "20px" }} />
                        </Placeholder>
                        <Placeholder as="div" animation="glow" className="m-0">
                            <Placeholder xs={1} style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
                        </Placeholder>
                    </div>
                </div>
                
                <div className="row g-4">
                    <div className="col-md-8">
                        {/* Enhanced skeleton for video player */}
                        <div className="mb-4" style={{ 
                            backgroundColor: "#000", 
                            height: "450px", 
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden"
                        }}>
                            <Spinner animation="border" variant="light" style={{ opacity: 0.5 }} />
                        </div>
                        
                        {/* Enhanced skeleton for video title and description */}
                        <div className="p-4 bg-white rounded-3 shadow-sm mb-4">
                            <Placeholder as="div" animation="glow" className="mb-3">
                                <Placeholder xs={7} size="lg" style={{ height: "28px" }} className="mb-3" />
                                <Placeholder xs={12} style={{ height: "16px" }} className="mb-2" />
                                <Placeholder xs={12} style={{ height: "16px" }} className="mb-2" />
                                <Placeholder xs={8} style={{ height: "16px" }} className="mb-2" />
                                <Placeholder xs={4} style={{ height: "16px" }} />
                            </Placeholder>
                            
                            {/* Divider */}
                            <div className="my-4" style={{ height: "1px", backgroundColor: "#eee" }}></div>
                            
                            {/* Enhanced skeleton for comments section */}
                            <Placeholder as="div" animation="glow" className="mb-3">
                                <div className="d-flex justify-content-between">
                                    <Placeholder xs={3} style={{ height: "24px" }} className="mb-3" />
                                    <Placeholder xs={2} style={{ height: "24px", borderRadius: "20px" }} />
                                </div>
                            </Placeholder>
                            
                            <Placeholder as="div" animation="glow" className="mb-4">
                                <Placeholder xs={12} style={{ height: "50px", borderRadius: "30px" }} />
                            </Placeholder>
                            
                            {/* Enhanced skeleton for comments list */}
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="d-flex mb-4 pb-3" style={{ borderBottom: i !== 2 ? "1px solid #f0f0f0" : "none" }}>
                                    <Placeholder as="div" animation="glow" style={{ flex: "0 0 40px" }}>
                                        <Placeholder xs={12} style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
                                    </Placeholder>
                                    <div className="ms-3 flex-grow-1">
                                        <div className="d-flex justify-content-between">
                                            <Placeholder as="div" animation="glow" style={{ width: "130px" }}>
                                                <Placeholder xs={12} style={{ height: "18px" }} />
                                            </Placeholder>
                                            <Placeholder as="div" animation="glow" style={{ width: "20px" }}>
                                                <Placeholder xs={12} style={{ height: "20px", borderRadius: "4px" }} />
                                            </Placeholder>
                                        </div>
                                        <Placeholder as="div" animation="glow" className="mt-2">
                                            <Placeholder xs={12} style={{ height: "14px" }} className="mb-1" />
                                            <Placeholder xs={10} style={{ height: "14px" }} className="mb-1" />
                                            <Placeholder xs={8} style={{ height: "14px" }} />
                                        </Placeholder>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="col-md-4">
                        {/* Enhanced skeleton for course content sidebar */}
                        <div className="bg-white rounded-3 shadow-sm overflow-hidden">
                            <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
                                <Placeholder as="div" animation="glow" className="m-0">
                                    <Placeholder xs={5} style={{ height: "24px" }} />
                                </Placeholder>
                                <Placeholder as="div" animation="glow" className="m-0">
                                    <Placeholder xs={1} style={{ width: "24px", height: "24px", borderRadius: "4px" }} />
                                </Placeholder>
                            </div>
                            
                            <div className="p-3">
                                {[1, 2, 3].map((_, i) => (
                                    <div key={i} className="mb-3">
                                        <Placeholder as="div" animation="glow" className="mb-2">
                                            <Placeholder xs={12} style={{ 
                                                height: "40px", 
                                                borderRadius: "8px",
                                                background: i === 0 ? "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)" : "#e9ecef"
                                            }} />
                                        </Placeholder>
                                        
                                        {i === 0 && (
                                            <>
                                                {[1, 2, 3].map((_, j) => (
                                                    <Placeholder key={j} as="div" animation="glow" className="mb-2 ms-2">
                                                        <div className="d-flex align-items-center">
                                                            <Placeholder xs={1} style={{ width: "20px", height: "20px", borderRadius: "50%", marginRight: "10px" }} />
                                                            <Placeholder xs={j === 0 ? 9 : j === 1 ? 7 : 8} style={{ height: "16px" }} />
                                                        </div>
                                                        {j === 0 && (
                                                            <Placeholder xs={12} style={{ height: "4px", marginTop: "6px", marginLeft: "30px" }} />
                                                        )}
                                                    </Placeholder>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="danger" className="m-4">
                {error}
            </Alert>
        );
    }

    const { prev, next } = findPrevNextLessons();

    return (
        <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            backgroundColor: "#f8f9fa", 
            color: "white", 
            minHeight: "100vh",
            height: "100vh",
            overflow: "hidden"
        }}>
            {/* Enhanced Header */}
            <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between", 
                padding: "15px 20px",
                background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                zIndex: 10
            }}>
                {/* Left side with back button and course title - Adaptive for both mobile and desktop */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button 
                        onClick={() => navigate(-1)} 
                        style={{ 
                            background: "rgba(255,255,255,0.1)", 
                            border: "none", 
                            color: "white", 
                            fontSize: "18px", 
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            transition: "background 0.2s"
                        }}
                        title="Go back"
                    >
                        <FaChevronLeft />
                    </button>
                    <h5 style={{ 
                        color: "white", 
                        margin: 0, 
                        fontWeight: "600",
                        maxWidth: isMobile ? "180px" : "400px",
                        whiteSpace: isMobile ? "nowrap" : "normal",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                    }}>
                        {courseData?.title || 'Course Video'}
                    </h5>
                </div>

                {/* Right side of header - Desktop version */}
                {!isMobile && (
                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    {/* Rating Display - Shows current rating or button to rate */}
                    <div style={{ display: "flex", alignItems: "center" }}>
                        {hasRated ? (
                                <div style={{ 
                                    display: "flex", 
                                    alignItems: "center", 
                                    background: "rgba(255,255,255,0.15)", 
                                    padding: "8px 14px", 
                                    borderRadius: "30px",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                                }}>
                                    <span style={{ marginRight: "10px", fontSize: "0.95rem", fontWeight: "500", color: "white" }}>Your Rating:</span>
                                {[...Array(5)].map((_, i) => (
                                    <FaStar
                                        key={i}
                                        style={{
                                                color: i < userRating ? "#ffdd00" : "rgba(255,255,255,0.4)",
                                                fontSize: "1.1rem",
                                                marginRight: "4px",
                                                filter: i < userRating ? "drop-shadow(0 0 2px rgba(255, 221, 0, 0.5))" : "none"
                                        }}
                                    />
                                ))}
                    <button
                                    style={{ 
                                        background: "none", 
                                        border: "none", 
                                            color: "white", 
                                        cursor: "pointer",
                                            fontSize: "0.85rem",
                                            marginLeft: "10px",
                                            textDecoration: "none",
                                            fontWeight: "500",
                                            opacity: "0.9"
                                    }}
                                    onClick={() => setShowRatingModal(true)}
                                >
                                        Update
                                </button>
                            </div>
                        ) : (
                    <button
                                style={{ 
                                        background: "rgba(255,255,255,0.15)", 
                                        border: "1px solid rgba(255,255,255,0.3)", 
                                        borderRadius: "50px",
                                        padding: "8px 16px",
                                    color: "white", 
                                        cursor: "pointer",
                                        fontSize: "0.95rem",
                                        fontWeight: "500",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        transition: "all 0.2s ease",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                                }}
                        onClick={() => setShowRatingModal(true)}
                    >
                                    <FaStar size={16} style={{ color: "#ffdd00" }} />
                                    Rate Course
                    </button>
                        )}
                    </div>

                        {/* Course Progress Circle with improved styling */}
                        <div style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "12px",
                            background: "rgba(255,255,255,0.15)",
                            padding: "8px 16px",
                            borderRadius: "50px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                        }}>
                            <div style={{ width: 46, height: 46 }}>
                        {isLoading ? (
                            <Spinner animation="border" variant="light" size="sm" />
                        ) : (
                        <CircularProgressbar
                                value={courseProgress || 0}
                                text={`${Math.round(courseProgress || 0)}%`}
                                styles={buildStyles({ 
                                            textSize: "28px", 
                                            pathColor: "#ffffff", 
                                    textColor: "white",
                                            trailColor: "rgba(255,255,255,0.3)",
                                            strokeLinecap: "round"
                                })}
                            />
                        )}
                    </div>
                            <div style={{ color: "white", fontSize: "0.95rem", fontWeight: "500" }}>
                                Course<br/>Progress
                    </div>
                </div>
            </div>
                )}
                
                {/* Right side of header - Mobile version */}
                {isMobile && (
                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                        {/* Simple Rating Button */}
                        <button
                            style={{ 
                                background: "rgba(255,255,255,0.1)", 
                                border: "none", 
                                borderRadius: "50%",
                                width: "40px",
                                height: "40px",
                                color: "white", 
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "16px",
                                transition: "all 0.2s ease"
                            }}
                            onClick={() => setShowRatingModal(true)}
                            title={hasRated ? `Your rating: ${userRating}/5` : "Rate course"}
                        >
                            <FaStar style={{ color: hasRated ? "#ffdd00" : "white" }} />
                        </button>
                        
                        {/* Course Progress Circle */}
                        <div 
                            style={{ 
                                width: "40px", 
                                height: "40px", 
                                position: "relative",
                                cursor: "pointer" 
                            }}
                            title={`Course Progress: ${Math.round(courseProgress || 0)}%`}
                        >
                            <CircularProgressbar
                                value={courseProgress || 0}
                                text={`${Math.round(courseProgress || 0)}%`}
                                styles={buildStyles({ 
                                    textSize: "28px", 
                                    pathColor: "#ffffff", 
                                    textColor: "white",
                                    trailColor: "rgba(255,255,255,0.3)",
                                    strokeLinecap: "round"
                                })}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content (Video + Course Content) - Enhanced layout */}
            <div 
                style={{ 
                    display: "flex", 
                    flex: 1, 
                    position: "relative",
                    height: "calc(100vh - 60px)",
                    overflow: "hidden"
                }}
                className="video-player-mobile-container"
            >
                {/* Video Player */}
                <div 
                    style={{ 
                        flex: isCourseContentVisible ? "7" : "1", 
                        backgroundColor: "white", 
                        borderRadius: "12px",
                        padding: "0",
                        margin: "24px 0 24px 24px",
                        overflow: "auto",
                        height: "calc(100vh - 108px)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                        position: "relative"
                    }}
                    className="video-player-area"
                >
                    {/* Video Player Container */}
                    <div style={{ 
                        backgroundColor: "#000", 
                        position: "relative",
                        overflow: "hidden" 
                    }}>
                        {/* Video Player */}
                        {isCheckingEnrollment ? (
                            <div style={{ 
                                height: "450px",
                                backgroundColor: "#1a1a1a",
                                display: "flex", 
                                flexDirection: "column",
                                justifyContent: "center", 
                                alignItems: "center", 
                                overflow: "hidden"
                            }}>
                                <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                                    <div style={{ width: "80%" }}>
                                        <Placeholder as="div" animation="glow" className="w-100">
                                            <Placeholder xs={12} style={{ height: "200px", borderRadius: "8px" }} />
                                        </Placeholder>
                                        <Placeholder as="div" animation="glow" className="mt-3">
                                            <Placeholder xs={8} className="mb-3" />
                                            <Placeholder xs={6} />
                                        </Placeholder>
                                    </div>
                                </div>
                            </div>
                        ) : currentLesson && isEnrolled ? (
                            <div style={{ position: "relative" }}>
                                {videoLoading && (
                                    <div style={{ 
                                        position: "absolute", 
                                        top: "50%", 
                                        left: "50%", 
                                        transform: "translate(-50%, -50%)",
                                        zIndex: 1,
                                        background: "rgba(0,0,0,0.5)",
                                        borderRadius: "50%",
                                        width: "60px",
                                        height: "60px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}>
                                        <Spinner animation="border" variant="light" />
                                    </div>
                                )}
                                
                                {videoError && (
                                    <div style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "50%",
                                        transform: "translate(-50%, -50%)",
                                        zIndex: 1,
                                        backgroundColor: "rgba(0,0,0,0.8)",
                                        padding: "20px 30px",
                                        borderRadius: "8px",
                                        color: "white",
                                        textAlign: "center",
                                        backdropFilter: "blur(4px)",
                                        boxShadow: "0 4px 30px rgba(0,0,0,0.2)"
                                    }}>
                                        <p style={{ marginBottom: "15px" }}>{videoError}</p>
                                        <Button 
                                            variant="outline-light" 
                                            size="sm"
                                            onClick={() => {
                                                setVideoError(null);
                                                if (videoRef.current) {
                                                    videoRef.current.load();
                                                }
                                            }}
                                        >
                                            Try Again
                                        </Button>
                                    </div>
                                )}
                                
                                {currentLesson?.videoUrl || currentLesson?.video_url ? (
                        <video
                            ref={videoRef}
                            controls
                            width="100%"
                                        style={{ 
                                            maxHeight: "70vh",
                                            background: "#000"
                                        }}
                                        onTimeUpdate={handleTimeUpdate}
                                        onWaiting={() => setVideoLoading(true)}
                                        onCanPlay={() => {
                                            setVideoLoading(false);
                                            setVideoError(null);
                                        }}
                                        onLoadStart={() => {
                                            setVideoLoading(true);
                                            console.log("Video loading started");
                                        }}
                                        onLoadedMetadata={(e) => {
                                            console.log("Video metadata loaded, duration:", e.target.duration);
                                            const duration = e.target.duration;
                                            setVideoDuration(duration);
                                            
                                            // Update the video length in the progress map
                                            if (currentLesson?._id) {
                                                setVideoProgressMap(prev => {
                                                    const newMap = new Map(prev);
                                                    const existingProgress = newMap.get(currentLesson._id) || {};
                                                    newMap.set(currentLesson._id, {
                                                        ...existingProgress,
                                                        duration: duration,
                                                        video_length: currentLesson.video_length || duration
                                                    });
                                                    return newMap;
                                                });
                                            }
                                            
                                            // Always try to load progress when video metadata is loaded
                                            if (currentLesson?._id) {
                                                // Check if we have saved progress to restore
                                                const savedProgress = videoProgressMap.get(currentLesson._id);
                                                if (savedProgress && savedProgress.watchedTime > 0) {
                                                    console.log("Restoring saved progress:", savedProgress.watchedTime);
                                                    e.target.currentTime = savedProgress.watchedTime;
                                                } else {
                                                    // If no progress in map, try to fetch it directly
                                                    const token = localStorage.getItem('token');
                                                    if (token && courseData?._id) {
                                                        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
                                                        const userId = tokenPayload.id;
                                                        
                                                        axiosInstance.get(
                                                            `/courses/video/progress/${userId}/${courseData._id}/${currentLesson._id}`,
                                                            { headers: { Authorization: `Bearer ${token}` } }
                                                        )
                                                        .then(response => {
                                                            if (response.data.success && response.data.data && response.data.data.current_time > 0) {
                                                                console.log("Found saved time from direct API call:", response.data.data.current_time);
                                                                e.target.currentTime = response.data.data.current_time;
                                                            }
                                                        })
                                                        .catch(err => console.error("Error fetching progress:", err));
                                                    }
                                                }
                                            }
                                        }}
                                        onLoadedData={() => {
                                            console.log("Video data loaded");
                                            setVideoLoading(false);
                                        }}
                                        onError={(e) => {
                                            console.error("Video error:", e);
                                            setVideoError("Failed to load video. Please try again.");
                                            setVideoLoading(false);
                                        }}
                                    >
                                        <source 
                                            src={formatVideoUrl(currentLesson.videoUrl || currentLesson.video_url)}
                                            type="video/mp4"
                                        />
                                        Your browser does not support the video tag.
                        </video>
                                ) : (
                                    <div style={{
                                        height: "450px",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        backgroundColor: "#1a1a1a",
                                    color: "white",
                                        flexDirection: "column",
                                        gap: "15px"
                                    }}>
                                        <FaPlay size={40} style={{ opacity: 0.5 }} />
                                        <p>No video source available</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ 
                                display: "flex", 
                                flexDirection: "column",
                                justifyContent: "center", 
                                alignItems: "center", 
                                height: "450px",
                                color: "white",
                                textAlign: "center",
                                padding: "20px",
                                backgroundColor: "#1a1a1a"
                            }}>
                                {!isEnrolled ? (
                                    <>
                                        <h4>Please Enroll in the Course</h4>
                                        <p className="mt-2 mb-4">You need to enroll in this course to watch the videos.</p>
                                        <Button 
                                            variant="primary"
                                            size="lg"
                                            className="px-4 py-2"
                                            onClick={() => navigate(`/course/${location.state?.courseData?._id}`)}
                                        >
                                            Go to Course Page
                                        </Button>
                                    </>
                                ) : (
                                    "No video available for this lesson"
                                )}
                        </div>
                        )}

                        {/* Improved navigation buttons */}
                        {prev && (
                                <button
                                onClick={() => handleVideoNavigation(prev)}
                                    style={{
                                        position: "absolute",
                                        top: "50%",
                                    left: "15px",
                                        transform: "translateY(-50%)",
                                    background: "rgba(0, 98, 230, 0.8)",
                                        color: "white",
                                        border: "none",
                                    width: "48px",
                                    height: "48px",
                                        fontSize: "20px",
                                        cursor: "pointer",
                                        borderRadius: "50%",
                                    zIndex: 10,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s ease",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0, 98, 230, 1)"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0, 98, 230, 0.8)"}
                                title={"Previous: " + (prev.title || prev.video_title)}
                                >
                                    ❮
                                </button>
                        )}

                        {/* Next Button */}
                        {next && (
                                <button
                                onClick={() => handleVideoNavigation(next)}
                                    style={{
                                        position: "absolute",
                                        top: "50%",
                                    right: "15px",
                                        transform: "translateY(-50%)",
                                    background: "rgba(0, 98, 230, 0.8)",
                                        color: "white",
                                        border: "none",
                                    width: "48px",
                                    height: "48px",
                                        fontSize: "20px",
                                        cursor: "pointer",
                                        borderRadius: "50%",
                                    zIndex: 10,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s ease",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0, 98, 230, 1)"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0, 98, 230, 0.8)"}
                                title={"Next: " + (next.title || next.video_title)}
                                >
                                    ❯
                                </button>
                        )}
                        
                        {/* Course Content Toggle Button - Placed directly on video container */}
                        {!isCourseContentVisible && (
                            <button
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 50, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                style={{
                                    position: "absolute",
                                    right: "15px",
                                    top: "70px",
                                    backgroundColor: "#0062E6",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    width: "40px",
                                    height: "40px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                                    zIndex: 1000,
                                    transition: "all 0.2s"
                                }}
                                onClick={() => setIsCourseContentVisible(true)}
                                title="Show course content"
                                className="content-show-btn"
                                onMouseEnter={(e) => e.currentTarget.style.background = "#0051C2"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "#0062E6"}
                            >
                                <FaChevronLeft />
                                </button>
                        )}
                    </div>

                    {/* Desktop-only video info section */}
                    {!isMobile && (
                        <div className="p-4 video-info-section desktop-only">
                            {/* Title & Description - Improved typography */}
                            <div>
                                <h4 style={{ 
                                    color: "#333", 
                                    fontWeight: "600",
                                    marginBottom: "10px" 
                                }}>
                                    {currentLesson?.title || currentLesson?.video_title || 'No video selected'}
                                </h4>
                                
                                <p style={{ 
                                    color: "#555", 
                                    fontSize: "0.95rem",
                                    lineHeight: "1.6",
                                    marginBottom: "24px",
                                    borderBottom: "1px solid #eee",
                                    paddingBottom: "20px" 
                                }}>
                            {(currentLesson?.description || currentLesson?.video_description) ? (
                                <>
                                            {showFullDescription 
                                        ? (currentLesson.description || currentLesson.video_description)
                                                : ((currentLesson.description || currentLesson.video_description).length <= 100 
                                                    ? (currentLesson.description || currentLesson.video_description) 
                                                    : `${(currentLesson.description || currentLesson.video_description).slice(0, 100)}...`)}
                                    
                                            {(currentLesson.description || currentLesson.video_description) && 
                                             (currentLesson.description?.length || currentLesson.video_description?.length) > 100 && (
                                <span
                                                    style={{ color: "#0d6efd", cursor: "pointer", fontWeight: "500" }}
                                    onClick={() => setShowFullDescription(!showFullDescription)}
                                >
                                                    {showFullDescription ? "" : " Show more"}
                                </span>
                            )}
                                </>
                            ) : 'No description available'}
                        </p>
                    </div>

                            {/* Comment Section - Improved styling */}
                            <div>
                                <h5 style={{ 
                                    color: "#333", 
                                    fontWeight: "600",
                                    marginBottom: "16px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px" 
                                }}>
                                    <span>Comments</span>
                                    {comments.length > 0 && (
                                        <span style={{ 
                                            fontSize: "0.85rem",
                                            background: "#f0f0f0",
                                            padding: "2px 8px",
                                            borderRadius: "20px",
                                            color: "#666"
                                        }}>
                                            {comments.length}
                                        </span>
                                    )}
                                </h5>
                                
                                {/* Comment Input Field - Improved design */}
                                <Form.Group className="mb-3" style={{ position: "relative" }}>
                                <Form.Control
                                    type="text"
                                        placeholder="Add to the comments..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    style={{
                                        backgroundColor: "white",
                                            color: "#333",
                                            borderColor: "#e0e0e0",
                                            padding: "12px 45px 12px 15px",
                                            borderRadius: "30px",
                                            fontSize: "0.95rem",
                                            boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                                    }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && newComment.trim() !== "") {
                                        e.preventDefault();
                                        handleAddComment();
                                    }
                                    }}
                                    className="custom-placeholder"
                                />
                                    <Button
                                style={{
                                    position: "absolute",
                                            right: "5px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    cursor: newComment.trim() !== "" ? "pointer" : "default",
                                            background: newComment.trim() !== "" ? "#0062E6" : "#e0e0e0",
                                            border: "none",
                                            borderRadius: "50%",
                                            width: "35px",
                                            height: "35px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            padding: 0
                                }}
                                onClick={handleAddComment}
                                        disabled={!newComment.trim()}
                                    >
                                        <LuSendHorizontal size={16} />
                                    </Button>
                        </Form.Group>

                                {/* Display Comments Section - Improved styling */}
                        <div
                            ref={commentBoxRef}
                            style={{
                                        padding: "5px 0"
                                    }}
                                    className="comments-section"
                        >
                            {isLoadingComments ? (
                                        <div className="p-3">
                                            {[1, 2, 3].map((_, i) => (
                                                <div key={i} className="mb-3">
                                                    <Placeholder as="div" animation="glow" className="d-flex align-items-start">
                                                        <Placeholder.Button xs={1} style={{ width: "35px", height: "35px", borderRadius: "50%" }} />
                                                        <div className="ms-2 flex-grow-1">
                                                            <Placeholder xs={3} size="sm" className="mb-2" />
                                                            <Placeholder xs={12} size="xs" />
                                                            <Placeholder xs={8} size="xs" />
                                                        </div>
                                                    </Placeholder>
                                                </div>
                                            ))}
                                </div>
                            ) : comments.length > 0 ? (
                                comments.map((comment, index) => (
                                    <div 
                                        key={comment.id || index} 
                                        style={{
                                                    padding: "12px 0", 
                                                    borderBottom: "1px solid #f0f0f0",
                                                    opacity: comment.isSending ? 0.7 : 1,
                                                    transition: "all 0.2s"
                                                }}
                                                className={comment.isSending ? "comment-sending" : ""}
                                    >
                                        <div className="d-flex justify-content-between align-items-start">
                                                    <div className="d-flex align-items-center">
                                                        <div style={{
                                                            width: "38px",
                                                            height: "38px",
                                                            borderRadius: "50%",
                                                            background: "#e9ecef",
                                                            color: "#495057",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontWeight: "600",
                                                            marginRight: "12px",
                                                            fontSize: "1rem"
                                                        }}>
                                                            {comment.user.charAt(0).toUpperCase()}
                                                        </div>
                                            <div>
                                                            <strong style={{ color: "#333", fontSize: "0.95rem" }}>{comment.user}</strong>{" "}
                                                            <span style={{ fontSize: "0.8rem", color: "#777" }}>
                                                    {comment.isSending ? "Sending..." : getTimeAgo(comment.timestamp)}
                                                </span>
                                                        </div>
                                            </div>
                                            
                                            {isCommentAuthor(comment) && !comment.isSending && (
                                                <Dropdown>
                                                            <Dropdown.Toggle 
                                                                as="div" 
                                                                style={{ 
                                                                    cursor: "pointer", 
                                                                    width: "30px",
                                                                    height: "30px",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    borderRadius: "50%"
                                                                }}
                                                                className="comment-action-btn"
                                                            >
                                                        <FaEllipsisV size={14} color="#666" />
                                                    </Dropdown.Toggle>
                                                    <Dropdown.Menu align="end">
                                                        <Dropdown.Item onClick={() => openEditModal(comment)}>
                                                            <FaEdit className="me-2" /> Edit
                                                        </Dropdown.Item>
                                                        <Dropdown.Item onClick={() => handleDeleteComment(comment.id)}>
                                                            <FaTrash className="me-2" /> Delete
                                                        </Dropdown.Item>
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            )}
                                        </div>
                                        
                                                <p style={{ 
                                                    color: "#333", 
                                                    margin: "10px 0 0 50px",
                                                    fontSize: "0.95rem",
                                                    lineHeight: "1.5"
                                                }}>
                                            {comment.expanded || comment.text.length <= 100
                                                ? comment.text
                                                : `${comment.text.slice(0, 100)}... `}
                                            {comment.text.length > 100 && (
                                                <span
                                                            style={{ color: "#0d6efd", cursor: "pointer", fontWeight: "500" }}
                                                    onClick={() => toggleShowMore(index)}
                                                >
                                                    {comment.expanded ? " Show less" : " More..."}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                        <div style={{ 
                                            textAlign: "center", 
                                            padding: "30px 0",
                                            color: "#777",
                                            borderRadius: "8px",
                                            background: "#f9f9f9",
                                            marginTop: "10px" 
                                        }}>
                                            <p className="mb-2">No comments yet.</p>
                                            <p style={{ fontSize: "0.9rem" }}>Be the first to start the discussion!</p>
                                        </div>
                            )}
                        </div>
                    </div>
                        </div>
                    )}
                </div>

                {/* Desktop-only Course Content Sidebar */}
                {!isMobile && (
                    <div 
                        className="course-content-area desktop-only"
                        style={{
                    flex: "3",
                    backgroundColor: "white",
                            borderRadius: "12px",
                            overflow: "hidden",
                    color: "black",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                            display: isCourseContentVisible ? "flex" : "none",
                            flexDirection: "column",
                            margin: "24px 24px 24px 24px",
                            height: "calc(100vh - 108px)",
                            position: "sticky",
                            top: "24px"
                        }}
                    >
                        <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                            borderBottom: "1px solid #eee",
                            padding: "16px 20px",
                            background: "#f8f9fa"
                        }}>
                            <h5 style={{ 
                                margin: 0, 
                                fontWeight: "600",
                                color: "#333",
                                fontSize: "1.1rem"
                            }}>
                                Course Content
                            </h5>
                        <button
                            style={{
                                background: "none",
                                border: "none",
                                    color: "#555",
                                cursor: "pointer",
                                    width: "30px",
                                    height: "30px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "50%",
                                    transition: "all 0.2s"
                            }}
                            onClick={() => setIsCourseContentVisible(false)}
                                className="content-close-btn"
                                title="Hide content"
                        >
                            <FaTimes />
                        </button>
                        </div>
                        
                        {/* Chapters List - Desktop version */}
                        <div style={{ 
                            flex: 1,
                            overflowY: "auto",
                            padding: "12px",
                            height: "calc(100vh - 168px)"
                        }} className="custom-scrollbar course-content-scrollable">
                    <AnimatePresence>
                        {chapters.length > 0 ? (
                            chapters.map((chapter, chapterIndex) => (
                                        <Card key={chapter._id || chapterIndex} className="mb-3 border-0 shadow-sm">
                                            {/* Chapter Header - Improved design */}
                                        <Card.Header
                                            className="fw-bold d-flex justify-content-between align-items-center"
                                            style={{
                                                cursor: "pointer",
                                                    background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)",
                                                color: "white",
                                                    padding: "12px 16px",
                                                    borderRadius: "8px 8px 0 0"
                                            }}
                                            onClick={() => toggleChapter(chapterIndex)}
                                        >
                                                <div style={{ fontSize: "0.95rem" }}>
                                                    {chapter.chapter_title || `Chapter ${chapterIndex + 1}`}
                                                </div>
                                            <div className="d-flex align-items-center">
                                                    <span className="me-2" style={{ fontSize: "0.85rem" }}>
                                                        ({chapter.videos?.length || 0} {chapter.videos?.length === 1 ? 'Video' : 'Videos'})
                                                </span>
                                                    <div style={{
                                                        width: "24px",
                                                        height: "24px",
                                                        borderRadius: "50%",
                                                        background: "rgba(255,255,255,0.2)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        transition: "transform 0.3s ease"
                                                    }}>
                                                        {openChapters.has(chapterIndex) ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                                                    </div>
                                            </div>
                                        </Card.Header>

                                            {/* Animated Chapter Content - Improved animation and styling */}
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={openChapters.has(chapterIndex) ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                                            exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                            style={{ overflow: "hidden" }}
                                        >
                                                <Card.Body style={{ padding: "8px 0" }}>
                                            {chapter.videos && chapter.videos.length > 0 ? (
                                                chapter.videos.map((video, videoIndex) => {
                                                    const videoProgress = videoProgressMap.get(video._id);
                                                    const progressPercent = videoProgress ? videoProgress.percent : 0;
                                                            const isCompleted = completedLessons.has(video._id);
                                                            const isActive = currentLesson?._id === video._id;
                                                    
                                                    return (
                                                        <div
                                                            key={video._id || videoIndex}
                                                            onClick={() => handleVideoNavigation(video)}
                                                        style={{
                                                                        backgroundColor: isActive ? "#e9f0ff" : "transparent",
                                                                        borderLeft: isActive ? "3px solid #0d6efd" : "none",
                                                                        marginBottom: "4px",
                                                                        padding: "10px 16px",
                                                                cursor: "pointer",
                                                                        borderRadius: isActive ? "0 4px 4px 0" : "4px",
                                                            display: "flex",
                                                                flexDirection: "column",
                                                                        transition: "all 0.2s ease"
                                                                    }}
                                                                    className="video-list-item"
                                                                >
                                                                    <div style={{ 
                                                                        display: "flex", 
                                                                        justifyContent: "space-between", 
                                                                        alignItems: "center",
                                                                        gap: "10px"
                                                                    }}>
                                                                        <div style={{
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            gap: "10px",
                                                                            flex: 1,
                                                                            overflow: "hidden"
                                                                        }}>
                                                                            <div style={{
                                                                                width: "26px",
                                                                                height: "26px",
                                                                                borderRadius: "50%",
                                                                                background: isCompleted ? "#28a745" : isActive ? "#e0eaff" : "#f1f1f1",
                                                                                color: isCompleted ? "white" : isActive ? "#0d6efd" : "#666",
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                justifyContent: "center",
                                                                                flexShrink: 0
                                                                            }}>
                                                                                {isCompleted ? (
                                                                                    "✓"
                                                                                ) : (
                                                                                    <CameraVideo size={14} />
                                                                                )}
                                                                            </div>
                                                                            <span style={{
                                                                                fontSize: "0.9rem",
                                                                                color: isActive ? "#0d6efd" : "#333",
                                                                                fontWeight: isActive ? "500" : "normal",
                                                                                textOverflow: "ellipsis",
                                                                                overflow: "hidden",
                                                                                whiteSpace: "nowrap"
                                                                            }}>
                                                                                {video.title || video.video_title || `Video ${videoIndex + 1}`}
                                                                            </span>
                                                                        </div>
                                                                        
                                                                        {/* Duration/Progress indicator */}
                                                                        <div style={{
                                                                            fontSize: "0.75rem",
                                                                            color: "#777",
                                                                            flexShrink: 0
                                                                        }}>
                                                                            {progressPercent > 0 ? `${Math.round(progressPercent)}%` : ''}
                                                                        </div>
                                                                    </div>

                                                                    {/* Progress bar for each video - Enhanced design */}
                                                                    {progressPercent > 0 && (
                                                                        <div style={{ 
                                                                            width: "100%", 
                                                                            height: "4px", 
                                                                            backgroundColor: "#e0e0e0",
                                                                            marginTop: "6px",
                                                                            borderRadius: "2px",
                                                                            overflow: "hidden"
                                                                        }}>
                                                                            <div style={{
                                                                                width: `${progressPercent}%`,
                                                                                height: "100%",
                                                                                backgroundColor: isCompleted ? "#28a745" : "#0d6efd",
                                                                                transition: "width 0.3s ease"
                                                                            }} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <p className="text-muted small text-center py-3">No videos in this chapter yet</p>
                                                    )}
                                                </Card.Body>
                                            </motion.div>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center p-4">
                                        <p>No chapters available for this course</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
                
                {/* Mobile-only Tabs + Content Area */}
                {isMobile && (
                    <>
                        {/* Mobile Tabs - directly below video */}
                        <div className="mobile-tabs">
                            <div 
                                className={`mobile-tab ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                Overview
                            </div>
                            <div 
                                className={`mobile-tab ${activeTab === 'content' ? 'active' : ''}`}
                                onClick={() => setActiveTab('content')}
                            >
                                Course Content
                            </div>
                            <div 
                                className={`mobile-tab ${activeTab === 'comments' ? 'active' : ''}`}
                                onClick={() => setActiveTab('comments')}
                            >
                                Comments {comments.length > 0 && `(${comments.length})`}
                            </div>
                        </div>
                        
                        {/* Mobile Content Area */}
                        <div className="mobile-content-area">
                            <div className="mobile-tab-content">
                                {/* Overview Tab - Video info always visible at top */}
                                {activeTab === 'overview' && (
                                    <div>
                                        {/* Video Title & Description */}
                                        <div className="mobile-video-info">
                                            <h4 style={{ 
                                                color: "#333", 
                                                fontWeight: "600",
                                                marginBottom: "10px" 
                                            }}>
                                                {currentLesson?.title || currentLesson?.video_title || 'No video selected'}
                                            </h4>
                                            
                                            <p style={{ 
                                                color: "#555", 
                                                fontSize: "0.95rem",
                                                lineHeight: "1.6"
                                            }}>
                                                {(currentLesson?.description || currentLesson?.video_description) ? (
                                                    <>
                                                        {showFullDescription 
                                                            ? (currentLesson.description || currentLesson.video_description)
                                                            : ((currentLesson.description || currentLesson.video_description).length <= 100 
                                                                ? (currentLesson.description || currentLesson.video_description) 
                                                                : `${(currentLesson.description || currentLesson.video_description).slice(0, 100)}...`)}
                                                        
                                                        {(currentLesson.description || currentLesson.video_description) && 
                                                        (currentLesson.description?.length || currentLesson.video_description?.length) > 100 && (
                                                            <span
                                                                style={{ color: "#0d6efd", cursor: "pointer", fontWeight: "500" }}
                                                                onClick={() => setShowFullDescription(!showFullDescription)}
                                                            >
                                                                {showFullDescription ? " Show less" : " Show more"}
                                                                </span>
                                                        )}
                                                    </>
                                                ) : 'No description available'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Course Content Tab */}
                                {activeTab === 'content' && (
                                    <div className="mobile-course-content custom-scrollbar">
                                        {chapters.map((chapter, chapterIndex) => (
                                            <Card key={chapter._id || chapterIndex} className="mb-3 border-0 shadow-sm">
                                                <Card.Header
                                                    className="fw-bold d-flex justify-content-between align-items-center"
                                                    style={{
                                                        cursor: "pointer",
                                                        background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)",
                                                        color: "white",
                                                        padding: "12px 16px",
                                                        borderRadius: "8px 8px 0 0"
                                                    }}
                                                    onClick={() => toggleChapter(chapterIndex)}
                                                >
                                                    <div style={{ fontSize: "0.95rem" }}>
                                                        {chapter.chapter_name || chapter.title || `Chapter ${chapterIndex + 1}`}
                                                    </div>
                                                    <div className="d-flex align-items-center">
                                                        <span className="me-2" style={{ fontSize: "0.85rem" }}>
                                                            ({chapter.videos?.length || 0} {chapter.videos?.length === 1 ? 'Video' : 'Videos'})
                                                        </span>
                                                        <div style={{
                                                            width: "24px",
                                                            height: "24px",
                                                            borderRadius: "50%",
                                                            background: "rgba(255,255,255,0.2)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            transition: "transform 0.3s ease"
                                                        }}>
                                                            {openChapters.has(chapterIndex) ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                                                        </div>
                                                    </div>
                                                </Card.Header>
                                                
                                                {openChapters.has(chapterIndex) && (
                                                    <Card.Body style={{ padding: "8px 0" }}>
                                                        {chapter.videos && chapter.videos.length > 0 ? (
                                                            chapter.videos.map((video, videoIndex) => {
                                                                const videoProgress = videoProgressMap.get(video._id);
                                                                const progressPercent = videoProgress ? 
                                                                    Math.round((videoProgress.watchedTime / videoProgress.duration) * 100) : 0;
                                                                const isCompleted = completedLessons.has(video._id);
                                                                const isActive = currentLesson?._id === video._id;
                                                                
                                                                return (
                                                                    <div
                                                                        key={video._id || videoIndex}
                                                                        onClick={() => handleVideoNavigation(video)}
                                                                        style={{
                                                                            backgroundColor: isActive ? "#e9f0ff" : "transparent",
                                                                            borderLeft: isActive ? "3px solid #0d6efd" : "none",
                                                                            marginBottom: "4px",
                                                                            padding: "10px 16px",
                                                                            cursor: "pointer",
                                                                            borderRadius: isActive ? "0 4px 4px 0" : "4px",
                                                                            display: "flex",
                                                                            flexDirection: "column",
                                                                            transition: "all 0.2s ease"
                                                                        }}
                                                                        className="video-list-item"
                                                                    >
                                                                        <div style={{ 
                                                                            display: "flex", 
                                                                            justifyContent: "space-between", 
                                                                            alignItems: "center",
                                                                            gap: "10px"
                                                                        }}>
                                                                            <div style={{
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                gap: "10px",
                                                                                flex: 1,
                                                                                overflow: "hidden"
                                                                            }}>
                                                                                <div style={{
                                                                                    width: "26px",
                                                                                    height: "26px",
                                                                                    borderRadius: "50%",
                                                                                    background: isCompleted ? "#28a745" : isActive ? "#e0eaff" : "#f1f1f1",
                                                                                    color: isCompleted ? "white" : isActive ? "#0d6efd" : "#666",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    flexShrink: 0
                                                                                }}>
                                                                                    {isCompleted ? (
                                                                                        "✓"
                                                                                    ) : (
                                                                                        <CameraVideo size={14} />
                                                                                    )}
                                                                                </div>
                                                                                <span style={{
                                                                                    fontSize: "0.9rem",
                                                                                    color: isActive ? "#0d6efd" : "#333",
                                                                                    fontWeight: isActive ? "500" : "normal",
                                                                                    textOverflow: "ellipsis",
                                                                                    overflow: "hidden",
                                                                                    whiteSpace: "nowrap"
                                                                                }}>
                                                                                    {video.video_title || video.title || `Video ${videoIndex + 1}`}
                                                                                </span>
                                                                            </div>
                                                                            
                                                                            {/* Duration/Progress indicator */}
                                                                            <div style={{
                                                                                fontSize: "0.75rem",
                                                                                color: "#777",
                                                                                flexShrink: 0
                                                                            }}>
                                                                                {formatDuration(video.video_length || 0)}
                                                                            </div>
                                                                        </div>

                                                            {/* Progress bar for each video */}
                                                            {progressPercent > 0 && (
                                                                <div style={{ 
                                                                    width: "100%", 
                                                                                height: "4px", 
                                                                    backgroundColor: "#e0e0e0",
                                                                                marginTop: "6px",
                                                                    borderRadius: "2px",
                                                                    overflow: "hidden"
                                                                }}>
                                                                    <div style={{
                                                                        width: `${progressPercent}%`,
                                                                        height: "100%",
                                                                                    backgroundColor: isCompleted ? "#28a745" : "#0d6efd",
                                                                        transition: "width 0.3s ease"
                                                                    }} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                            <p className="text-muted small text-center py-3">No videos in this chapter yet</p>
                                            )}
                                            </Card.Body>
                                                )}
                                    </Card>
                                        ))}
                                    </div>
                                )}
                                
                                {/* Comments Tab */}
                                {activeTab === 'comments' && (
                                    <div>
                                        {/* Comment Input Field */}
                                        <Form.Group className="mb-3" style={{ position: "relative" }}>
                                            <Form.Control
                                                type="text"
                                                placeholder="Add to the comments..."
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                style={{
                                                    backgroundColor: "white",
                                                    color: "#333",
                                                    borderColor: "#e0e0e0",
                                                    padding: "12px 45px 12px 15px",
                                                    borderRadius: "30px",
                                                    fontSize: "0.95rem",
                                                    boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                                                }}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && newComment.trim() !== "") {
                                                        e.preventDefault();
                                                        handleAddComment();
                                                    }
                                                }}
                                                className="custom-placeholder"
                                            />
                                            <Button
                                                style={{
                                                    position: "absolute",
                                                    right: "5px",
                                                    top: "50%",
                                                    transform: "translateY(-50%)",
                                                    cursor: newComment.trim() !== "" ? "pointer" : "default",
                                                    background: newComment.trim() !== "" ? "#0062E6" : "#e0e0e0",
                                                    border: "none",
                                                    borderRadius: "50%",
                                                    width: "35px",
                                                    height: "35px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    padding: 0
                                                }}
                                                onClick={handleAddComment}
                                                disabled={!newComment.trim()}
                                            >
                                                <LuSendHorizontal size={16} />
                                            </Button>
                                        </Form.Group>
                                        
                                        {/* Comments List */}
                                        <div
                                            ref={commentBoxRef}
                                            style={{ padding: "5px 0" }}
                                            className="comments-section"
                                        >
                                            {isLoadingComments ? (
                                                <div className="p-3">
                                                    {[1, 2, 3].map((_, i) => (
                                                        <div key={i} className="mb-3">
                                                            <Placeholder as="div" animation="glow" className="d-flex align-items-start">
                                                                <Placeholder.Button xs={1} style={{ width: "35px", height: "35px", borderRadius: "50%" }} />
                                                                <div className="ms-2 flex-grow-1">
                                                                    <Placeholder xs={3} size="sm" className="mb-2" />
                                                                    <Placeholder xs={12} size="xs" />
                                                                    <Placeholder xs={8} size="xs" />
                                                                </div>
                                                            </Placeholder>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : comments.length > 0 ? (
                                                comments.map((comment, index) => (
                                                    <div 
                                                        key={comment.id || index} 
                                                        style={{
                                                            padding: "12px 0", 
                                                            borderBottom: "1px solid #f0f0f0",
                                                            opacity: comment.isSending ? 0.7 : 1,
                                                            transition: "all 0.2s"
                                                        }}
                                                        className={comment.isSending ? "comment-sending" : ""}
                                                    >
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div className="d-flex align-items-center">
                                                                <div style={{
                                                                    width: "38px",
                                                                    height: "38px",
                                                                    borderRadius: "50%",
                                                                    background: "#e9ecef",
                                                                    color: "#495057",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    fontWeight: "600",
                                                                    marginRight: "12px",
                                                                    fontSize: "1rem"
                                                                }}>
                                                                    {comment.user.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <strong style={{ color: "#333", fontSize: "0.95rem" }}>{comment.user}</strong>{" "}
                                                                    <span style={{ fontSize: "0.8rem", color: "#777" }}>
                                                                        {comment.isSending ? "Sending..." : getTimeAgo(comment.timestamp)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            
                                                            {isCommentAuthor(comment) && !comment.isSending && (
                                                                <Dropdown>
                                                                    <Dropdown.Toggle 
                                                                        as="div" 
                                                                        style={{ 
                                                                            cursor: "pointer", 
                                                                            width: "30px",
                                                                            height: "30px",
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            justifyContent: "center",
                                                                            borderRadius: "50%"
                                                                        }}
                                                                        className="comment-action-btn"
                                                                    >
                                                                        <FaEllipsisV size={14} color="#666" />
                                                                    </Dropdown.Toggle>
                                                                    <Dropdown.Menu align="end">
                                                                        <Dropdown.Item onClick={() => openEditModal(comment)}>
                                                                            <FaEdit className="me-2" /> Edit
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Item onClick={() => handleDeleteComment(comment.id)}>
                                                                            <FaTrash className="me-2" /> Delete
                                                                        </Dropdown.Item>
                                                                    </Dropdown.Menu>
                                                                </Dropdown>
                                                            )}
                                                        </div>
                                                        
                                                        <p style={{ 
                                                            color: "#333", 
                                                            margin: "10px 0 0 50px",
                                                            fontSize: "0.95rem",
                                                            lineHeight: "1.5"
                                                        }}>
                                                            {comment.expanded || comment.text.length <= 100
                                                                ? comment.text
                                                                : `${comment.text.slice(0, 100)}... `}
                                                            {comment.text.length > 100 && (
                                                                <span
                                                                    style={{ color: "#0d6efd", cursor: "pointer", fontWeight: "500" }}
                                                                    onClick={() => toggleShowMore(index)}
                                                                >
                                                                    {comment.expanded ? " Show less" : " More..."}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                            ))
                        ) : (
                                                <div style={{ 
                                                    textAlign: "center", 
                                                    padding: "30px 0",
                                                    color: "#777",
                                                    borderRadius: "8px",
                                                    background: "#f9f9f9",
                                                    marginTop: "10px" 
                                                }}>
                                                    <p className="mb-2">No comments yet.</p>
                                                    <p style={{ fontSize: "0.9rem" }}>Be the first to start the discussion!</p>
                                                </div>
                                            )}
                </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Mobile Toggle Button - only shown on mobile when content is not visible */}
            {isMobile && !isCourseContentVisible && (
                <div style={{
                    position: "fixed",
                    bottom: "20px",
                    right: "20px",
                    zIndex: 1000
                }}>
                    <button
                        style={{
                            width: "50px",
                            height: "50px",
                            borderRadius: "50%",
                            backgroundColor: "#0062E6",
                            color: "white",
                            border: "none",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.2rem"
                        }}
                        onClick={() => setIsCourseContentVisible(true)}
                    >
                        <FaList />
                    </button>
                </div>
            )}
            
            {/* Rating Modal - Enhanced design */}
            <Modal 
                show={showRatingModal} 
                onHide={() => {
                setShowRatingModal(false);
                setHoveredRating(0);
                }}
                centered
            >
                <Modal.Header closeButton style={{ borderBottom: "1px solid #eee" }}>
                    <Modal.Title style={{ fontSize: "1.25rem", fontWeight: "600" }}>
                        {hasRated ? 'Update Your Rating' : 'Rate this Course'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center py-4">
                    <p className="mb-4" style={{ color: "#666" }}>
                        {hasRated 
                            ? 'How would you rate this course now?' 
                            : 'How would you rate your experience with this course?'}
                    </p>
                    <div className="d-flex justify-content-center mb-3" style={{ fontSize: "2.5rem" }}>
                            {[...Array(5)].map((_, i) => (
                        <FaStar
                                    key={i}
                                    style={{
                                    color: i < (hoveredRating || selectedRating) ? "#ffdd00" : "#e4e5e9",
                                        cursor: "pointer",
                                    margin: "0 8px",
                                    transition: "transform 0.2s ease, color 0.2s ease",
                                    filter: i < (hoveredRating || selectedRating) ? "drop-shadow(0 0 2px rgba(255, 221, 0, 0.3))" : "none"
                                    }}
                                className="rating-star"
                                    onClick={() => setSelectedRating(i + 1)}
                                    onMouseEnter={() => setHoveredRating(i + 1)}
                                    onMouseLeave={() => setHoveredRating(0)}
                        />
                    ))}
                        </div>
                    <div className="mt-3" style={{ 
                        fontSize: "1.1rem", 
                        fontWeight: "500",
                        color: selectedRating > 0 ? "#333" : "#999",
                        minHeight: "28px" 
                    }}>
                            {selectedRating === 0 ? "Select a rating" :
                            selectedRating === 1 ? "Poor" :
                            selectedRating === 2 ? "Fair" :
                            selectedRating === 3 ? "Good" :
                            selectedRating === 4 ? "Very Good" :
                            "Excellent"}
                    </div>
                </Modal.Body>
                <Modal.Footer style={{ borderTop: "1px solid #eee" }}>
                    <Button 
                        variant="outline-secondary" 
                        onClick={() => {
                            setShowRatingModal(false);
                            setHoveredRating(0);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleRating}
                        disabled={selectedRating === 0}
                    >
                        {hasRated ? 'Update Rating' : 'Submit Rating'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Comment Modal - Enhanced UI */}
            <Modal 
                show={showEditModal} 
                onHide={() => {
                setShowEditModal(false);
                setEditingComment(null);
                setEditCommentText("");
                }}
                centered
            >
                <Modal.Header closeButton style={{ borderBottom: "1px solid #eee" }}>
                    <Modal.Title style={{ fontSize: "1.25rem", fontWeight: "600" }}>Edit Comment</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            placeholder="Edit your comment..."
                            style={{
                                resize: "none",
                                padding: "12px",
                                fontSize: "0.95rem",
                                borderColor: "#e0e0e0"
                            }}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer style={{ borderTop: "1px solid #eee" }}>
                    <Button 
                        variant="outline-secondary" 
                        onClick={() => {
                            setShowEditModal(false);
                            setEditingComment(null);
                            setEditCommentText("");
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleEditComment}
                        disabled={!editCommentText.trim()}
                    >
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* Add custom CSS for interactive elements */}
            <style jsx="true">{`
                /* Main container scrollbar (for video and comments together) */
                ::-webkit-scrollbar {
                    width: 8px;
                }
                
                ::-webkit-scrollbar-thumb {
                    background-color: #c1c1c1;
                    border-radius: 10px;
                }
                
                ::-webkit-scrollbar-track {
                    background-color: #f1f1f1;
                }
                
                /* Video info section no longer needs its own scrollbar */
                .video-info-section, .video-info-scrollable {
                    height: auto;
                    overflow: visible;
                }
                
                /* Comments section no longer needs its own scrollbar */
                .comments-section, .comments-scrollable {
                    height: auto;
                    overflow: visible;
                }
                
                /* Course content sidebar gets its own scrollbar */
                .course-content-scrollable {
                    max-height: calc(100vh - 150px);
                    overflow-y: auto;
                    scrollbar-width: thin;
                }
                
                .course-content-scrollable::-webkit-scrollbar {
                    width: 6px;
                    display: block;
                }
                
                .course-content-scrollable::-webkit-scrollbar-thumb {
                    background-color: #c1c1c1;
                    border-radius: 10px;
                }
                
                .course-content-scrollable::-webkit-scrollbar-track {
                    background-color: #f1f1f1;
                }
                
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #ddd;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background-color: transparent;
                }
                
                .video-info-scrollable {
                    max-height: calc(100vh - 550px);
                    overflow-y: auto;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                
                .video-info-scrollable::-webkit-scrollbar {
                    display: none;
                }
                
                .comments-scrollable::-webkit-scrollbar {
                    display: none;
                }
                
                .comments-scrollable {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                
                .content-close-btn:hover {
                    background-color: #f0f0f0;
                }
                
                .content-show-btn {
                    animation: fadeInFromRight 0.3s ease-out forwards;
                }
                
                .content-show-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 6px 18px rgba(0, 98, 230, 0.5);
                    background-color: #0051C2 !important;
                }
                
                @keyframes fadeInFromRight {
                    0% {
                        opacity: 0;
                        transform: translateX(30px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                .video-list-item:hover {
                    background-color: #f8f9fa;
                }
                
                .comment-action-btn:hover {
                    background-color: #f0f0f0;
                }
                
                .rating-star:hover {
                    transform: scale(1.1);
                }
                
                .comment-sending {
                    animation: pulse 1.5s infinite;
                }
                
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 0.9; }
                    100% { opacity: 0.6; }
                }

                /* Simple animations for course content panel opening and closing */
                .content-panel-visible {
                    animation: slideInRight 0.3s ease forwards;
                }
                
                .content-panel-hidden {
                    animation: slideOutRight 0.3s ease forwards;
                }
                
                @keyframes slideInRight {
                    0% {
                        transform: translateX(30px);
                        opacity: 0;
                    }
                    100% {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOutRight {
                    0% {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    100% {
                        transform: translateX(30px);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
};

export default VideoPlayer;

