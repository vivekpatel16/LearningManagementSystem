import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Form, Modal, Spinner, Alert, Dropdown } from "react-bootstrap";
import { FaStar, FaPlay, FaPause, FaExpand, FaVolumeMute, FaVolumeUp, FaChevronDown, FaChevronUp, FaTimes, FaEllipsisV, FaEdit, FaTrash } from "react-icons/fa";
import { CameraVideo } from "react-bootstrap-icons";
import { LuSendHorizontal } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import axios from "axios";
import { toast } from "react-hot-toast";
import common_API from "../Api/commonApi";

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
            const chaptersResponse = await axios.get(
                `http://localhost:5000/api/courses/chapter/${courseId}`,
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
                            const videosResponse = await axios.get(
                                `http://localhost:5000/api/courses/video/${chapter._id}`,
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
                        const allProgressResponse = await axios.get(
                            `http://localhost:5000/api/courses/enrolled`,
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
                                        const videoProgressResponse = await axios.get(
                                            `http://localhost:5000/api/courses/video/progress/${userId}/${courseId}/${videoId}`,
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
                const enrollmentResponse = await axios.get(
                    `http://localhost:5000/api/courses/enrollment/${courseId}`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                if (enrollmentResponse.status === 200) {
                    setIsEnrolled(true);
                    
                    // Fetch course progress data first to set it immediately
                    try {
                        const allProgressResponse = await axios.get(
                            `http://localhost:5000/api/courses/enrolled`,
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
                    percent: percent
                });
                return newMap;
            });
        }

        // Don't update course progress immediately while watching
        // It will be updated when saveVideoProgress is called

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
            const response = await axios.post(
                'http://localhost:5000/api/courses/video/progress',
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
            const response = await axios.get(
                `http://localhost:5000/api/courses/comment/${videoId}`,
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
            const response = await axios.post(
                'http://localhost:5000/api/courses/comment',
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
            const response = await axios.delete(
                `http://localhost:5000/api/courses/comment/${commentId}`,
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
            const response = await axios.patch(
                `http://localhost:5000/api/courses/comment/${editingComment.id}`,
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
                    color: i < (interactive ? hoveredRating || selectedRating : rating) ? "#ffc107" : "#e4e5e9",
                    fontSize: "1rem",
                    cursor: interactive ? "pointer" : "default",
                    marginRight: "3px"
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
            if (!videoId) {
                console.error("Invalid videoId provided to loadVideoProgress");
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) return;

            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            const userId = tokenPayload.id;
            const courseId = courseData?._id;

            if (!userId || !courseId) return;

            console.log("Fetching video progress for: ", { userId, courseId, videoId });

            const response = await axios.get(
                `http://localhost:5000/api/courses/video/progress/${userId}/${courseId}/${videoId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            console.log("Video progress response:", response.data);

            if (response.data.success && response.data.data) {
                const { current_time, completed, progress_percent, course_progress } = response.data.data;
                
                console.log("Setting video time to:", current_time);
                
                // Store the progress data in the map
                setVideoProgressMap(prev => {
                    const newMap = new Map(prev);
                    newMap.set(videoId, {
                        watchedTime: current_time,
                        duration: videoRef.current?.duration || 0,
                        percent: progress_percent || 0
                    });
                    return newMap;
                });
                
                // Set progress directly if available
                if (progress_percent) {
                    setProgress(progress_percent);
                }
                
                // Mark video as completed if needed - IMPORTANT: use the completed flag from server
                if (completed) {
                    setCompletedLessons(prev => {
                        if (!prev.has(videoId)) {
                            return new Set([...prev, videoId]);
                        }
                        return prev;
                    });
                } else {
                    // If server says it's not completed, make sure to remove it from completedLessons
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
                if (current_time > 0) {
                    // If video element is already loaded, set time directly
                    if (videoRef.current && videoRef.current.readyState >= 2) {
                        console.log("Video already loaded, setting time immediately");
                        videoRef.current.currentTime = current_time;
                    }
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
                const response = await axios.patch(
                    `http://localhost:5000/api/courses/rating/${courseData._id}`,
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
                const response = await axios.post(
                    'http://localhost:5000/api/courses/rating',
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
            const avgResponse = await axios.get(
                `http://localhost:5000/api/common/rating/${courseId}`,
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
            <div className="text-center p-5">
                <Spinner animation="border" />
                <p>Loading course content...</p>
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
        <div style={{ display: "flex", flexDirection: "column", backgroundColor: "white", color: "white", minHeight: "100vh" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 20px", backgroundColor: "black" }}>
                <h5 style={{ color: "white", margin: 0 }}>{courseData?.title || 'Course Video'}</h5>

                {/* Progress Circle & Rating Display */}
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    {/* Rating Display - Shows current rating or button to rate */}
                    <div style={{ display: "flex", alignItems: "center" }}>
                        {hasRated ? (
                            <div style={{ display: "flex", alignItems: "center", color: "white" }}>
                                <span style={{ marginRight: "8px" }}>Your Rating:</span>
                                {[...Array(5)].map((_, i) => (
                                    <FaStar
                                        key={i}
                                        style={{
                                            color: i < userRating ? "#ffc107" : "#e4e5e9",
                                            fontSize: "1rem",
                                            marginRight: "3px"
                                        }}
                                    />
                                ))}
                    <button
                                    style={{ 
                                        background: "none", 
                                        border: "none", 
                                        color: "#0d6efd", 
                                        cursor: "pointer",
                                        fontSize: "0.8rem",
                                        marginLeft: "8px",
                                        textDecoration: "underline"
                                    }}
                                    onClick={() => setShowRatingModal(true)}
                                >
                                    Update Rating
                                </button>
                            </div>
                        ) : (
                    <button
                                style={{ 
                                    background: "none", 
                                    border: "1px solid #0d6efd", 
                                    borderRadius: "4px",
                                    padding: "5px 10px",
                                    color: "white", 
                                    cursor: "pointer" 
                                }}
                        onClick={() => setShowRatingModal(true)}
                    >
                        ★ Leave a Rating
                    </button>
                        )}
                    </div>

                    {/* Course Progress Circle */}
                    <div style={{ width: 40, height: 40 }}>
                        {isLoading ? (
                            <Spinner animation="border" variant="light" size="sm" />
                        ) : (

                        <CircularProgressbar


                                value={courseProgress || 0}
                                text={`${Math.round(courseProgress || 0)}%`}
                                styles={buildStyles({ 
                                    textSize: "30px", 
                                    pathColor: "#0d6efd", 
                                    textColor: "white",
                                    trailColor: "rgba(255,255,255,0.3)" 
                                })}
                            />
                        )}
                    </div>
                    <div style={{ color: "white", fontSize: "0.8rem" }}>
                        Course Progress
                    </div>
                </div>
            </div>

            {/* Main Content (Video + Course Content) */}
            <div style={{ display: "flex", flex: 1, padding: "20px", gap: "20px" }}>
                {/* Left: Video Player */}
                <div style={{ flex: "7", backgroundColor: "white", borderRadius: "10px", padding: "10px" }}>
                    <div style={{ flex: "7", backgroundColor: "#000", borderRadius: "10px", padding: "10px", position: "relative" }}>
                        {/* Video Player */}
                        {isCheckingEnrollment ? (
                            <div style={{ 
                                display: "flex", 
                                justifyContent: "center", 
                                alignItems: "center", 
                                height: "300px",
                                color: "white"
                            }}>
                                <Spinner animation="border" variant="light" />
                            </div>
                        ) : currentLesson && isEnrolled ? (
                            <div style={{ position: "relative" }}>
                                {videoLoading && (
                                    <div style={{ 
                                        position: "absolute", 
                                        top: "50%", 
                                        left: "50%", 
                                        transform: "translate(-50%, -50%)",
                                        zIndex: 1
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
                                        backgroundColor: "rgba(0,0,0,0.7)",
                                        padding: "20px",
                                        borderRadius: "8px",
                                        color: "white",
                                        textAlign: "center"
                                    }}>
                                        <p>{videoError}</p>
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
                            style={{ borderRadius: "10px" }}

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
                                            setVideoDuration(e.target.duration);
                                            
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
                                                        
                                                        axios.get(
                                                            `http://localhost:5000/api/courses/video/progress/${userId}/${courseData._id}/${currentLesson._id}`,
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
                                        height: "300px",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        backgroundColor: "#000",

                                    color: "white",


                                        borderRadius: "10px"
                                    }}>
                                        No video source available
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ 
                                display: "flex", 
                                flexDirection: "column",
                                justifyContent: "center", 
                                alignItems: "center", 
                                height: "300px",
                                color: "white",
                                textAlign: "center",
                                padding: "20px"
                            }}>
                                {!isEnrolled ? (
                                    <>
                                        <h4>Please Enroll in the Course</h4>
                                        <p>You need to enroll in this course to watch the videos.</p>
                                        <Button 
                                            variant="primary"
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

                        {/* Previous Button */}
                        {prev && (
                                <button
                                onClick={() => handleVideoNavigation(prev)}
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
                                    zIndex: 10
                                    }}
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
                                        right: "10px",
                                        transform: "translateY(-50%)",
                                        background: "rgba(0, 0, 0, 0.5)",
                                        color: "white",
                                        border: "none",
                                        padding: "10px 15px",
                                        fontSize: "20px",
                                        cursor: "pointer",
                                        borderRadius: "50%",
                                    zIndex: 10
                                    }}
                                >
                                    ❯
                                </button>
                        )}
                    </div>

                    {/* Video Name & Description */}
                    <div className="mt-3">
                        <h4 style={{ color: "black" }}>{currentLesson?.title || currentLesson?.video_title || 'No video selected'}</h4>
                        <p style={{ color: "black" }}>
                            {(currentLesson?.description || currentLesson?.video_description) ? (
                                <>
                                    {showFullDescription || ((currentLesson.description || currentLesson.video_description) && (currentLesson.description?.length || currentLesson.video_description?.length) <= 100)
                                        ? (currentLesson.description || currentLesson.video_description)
                                        : `${(currentLesson.description || currentLesson.video_description)?.slice(0, 100)}... `}
                                    
                                    {(currentLesson.description || currentLesson.video_description) && (currentLesson.description?.length || currentLesson.video_description?.length) > 100 && (
                                <span
                                            style={{ color: "#0d6efd", cursor: "pointer" }}
                                    onClick={() => setShowFullDescription(!showFullDescription)}
                                >
                                    {showFullDescription ? " Show less" : " More..."}
                                </span>
                            )}
                                </>
                            ) : 'No description available'}
                        </p>
                    </div>

                    {/* Comment Section */}
                    <div className="mt-4">
                        <h5 style={{ color: "black" }}>Comments</h5>
                        {/* Comment Input Field */}
                        <Form.Group className="mt-2" style={{ position: "relative" }}>
                                <Form.Control
                                    type="text"
                                    placeholder="Add a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    style={{
                                        backgroundColor: "white",
                                        color: "black",
                                    borderColor: "#ccc",
                                        paddingRight: "40px",
                                    }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && newComment.trim() !== "") {
                                        e.preventDefault();
                                        handleAddComment();
                                    }
                                    }}
                                    className="custom-placeholder"
                                />
                            <LuSendHorizontal
                                size={18}
                                style={{
                                    position: "absolute",
                                    right: "10px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    cursor: newComment.trim() !== "" ? "pointer" : "default",
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
                                maxHeight: "300px",
                                overflowY: "auto",
                                backgroundColor: "white",
                                padding: "10px",
                                borderRadius: "5px",
                            }}
                        >
                            {isLoadingComments ? (
                                <div className="text-center p-3">
                                    <Spinner animation="border" variant="primary" size="sm" />
                                    <p className="text-muted mt-2">Loading comments...</p>
                                </div>
                            ) : comments.length > 0 ? (
                                comments.map((comment, index) => (
                                    <div 
                                        key={comment.id || index} 
                                        style={{
                                            padding: "10px 0", 
                                            borderBottom: index !== comments.length - 1 ? "1px solid #eee" : "none",
                                            opacity: comment.isSending ? 0.7 : 1
                                        }}
                                    >
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div>
                                        <strong style={{ color: "black" }}>{comment.user}</strong>{" "}
                                                <span style={{ fontSize: "12px", color: "#777" }}>
                                                    {comment.isSending ? "Sending..." : getTimeAgo(comment.timestamp)}
                                                </span>
                                            </div>
                                            
                                            {isCommentAuthor(comment) && !comment.isSending && (
                                                <Dropdown>
                                                    <Dropdown.Toggle as="div" style={{ cursor: "pointer" }}>
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
                                        
                                        <p style={{ color: "black", margin: "5px 0" }}>
                                            {comment.expanded || comment.text.length <= 100
                                                ? comment.text
                                                : `${comment.text.slice(0, 100)}... `}
                                            {comment.text.length > 100 && (
                                                <span
                                                    style={{ color: "#0d6efd", cursor: "pointer" }}
                                                    onClick={() => toggleShowMore(index)}
                                                >
                                                    {comment.expanded ? " Show less" : " More..."}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: "black", textAlign: "center", marginTop: "20px" }}>
                                    No comments yet. Be the first to comment!
                                </p>
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
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                    display: isCourseContentVisible ? "block" : "none"
                }}>
                    <h5 style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: "2px solid #ddd",
                        paddingBottom: "8px"
                    }}>
                        Course Chapters
                        <button
                            style={{
                                background: "none",
                                border: "none",
                                color: "black",
                                cursor: "pointer",
                                fontSize: "1.1rem"
                            }}
                            onClick={() => setIsCourseContentVisible(false)}
                        >
                            <FaTimes />
                        </button>
                    </h5>

                    {/* Chapters List */}
                    <AnimatePresence>
                        {chapters.length > 0 ? (
                            chapters.map((chapter, chapterIndex) => (
                                <Card key={chapter._id || chapterIndex} className="mb-2 shadow-sm">
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
                                        <div>{chapter.chapter_title || `Chapter ${chapterIndex + 1}`}</div>
                                            <div className="d-flex align-items-center">
                                                <span className="text-white me-2" style={{ fontSize: "0.9rem" }}>
                                                ({chapter.videos?.length || 0} Videos)
                                                </span>
                                                {openChapters.has(chapterIndex) ? <FaChevronUp /> : <FaChevronDown />}
                                            </div>
                                        </Card.Header>

                                        {/* Animated Chapter Content */}
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={openChapters.has(chapterIndex) ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                                            exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                            style={{ overflow: "hidden" }}
                                        >
                                            <Card.Body style={{ padding: "10px" }}>
                                            {chapter.videos && chapter.videos.length > 0 ? (
                                                chapter.videos.map((video, videoIndex) => {
                                                    const videoProgress = videoProgressMap.get(video._id);
                                                    const progressPercent = videoProgress ? videoProgress.percent : 0;
                                                    
                                                    return (
                                                        <div
                                                            key={video._id || videoIndex}
                                                            onClick={() => handleVideoNavigation(video)}

                                                        style={{
                                                                backgroundColor: currentLesson?._id === video._id ? "#e9f0ff" : "transparent",
                                                                borderLeft: currentLesson?._id === video._id ? "3px solid #0d6efd" : "none",
                                                                marginBottom: "5px",
                                                            padding: "8px 10px",
                                                                cursor: "pointer",
                                                                borderRadius: "4px",
                                                            display: "flex",

                                                                flexDirection: "column",
                                                                transition: "background-color 0.2s ease"
                                                            }}
                                                        >
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                <span>
                                                                    <CameraVideo

                                                            className="me-2"


                                                                        style={{ color: currentLesson?._id === video._id ? "#0d6efd" : "#666" }}
                                                                    />
                                                                    {video.title || video.video_title || `Video ${videoIndex + 1}`}
                                                                </span>
                                                                {completedLessons.has(video._id) && (
                                                                    <span className="text-success">✓</span>
                                                                )}

                                                    </div>


                                                            {/* Progress bar for each video */}
                                                            {progressPercent > 0 && (
                                                                <div style={{ 
                                                                    width: "100%", 
                                                                    height: "3px", 
                                                                    backgroundColor: "#e0e0e0",
                                                                    marginTop: "5px",
                                                                    borderRadius: "2px",
                                                                    overflow: "hidden"
                                                                }}>
                                                                    <div style={{
                                                                        width: `${progressPercent}%`,
                                                                        height: "100%",
                                                                        backgroundColor: "#0d6efd",
                                                                        transition: "width 0.3s ease"
                                                                    }} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <p className="text-muted small">No videos in this chapter yet</p>
                                            )}
                                            </Card.Body>
                                        </motion.div>
                                    </Card>
                            ))
                        ) : (
                            <p>No chapters available for this course</p>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Rating Modal */}
            <Modal show={showRatingModal} onHide={() => {
                setShowRatingModal(false);
                setHoveredRating(0);
            }}>
                <Modal.Header closeButton>
                    <Modal.Title>{hasRated ? 'Update Your Rating' : 'Rate this Course'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="text-center mb-3">
                        <div className="d-flex justify-content-center mb-2" style={{ fontSize: "2rem" }}>
                            {[...Array(5)].map((_, i) => (
                        <FaStar
                                    key={i}
                                    style={{
                                        color: i < (hoveredRating || selectedRating) ? "#ffc107" : "#e4e5e9",
                                        cursor: "pointer",
                                        margin: "0 5px"
                                    }}
                                    onClick={() => setSelectedRating(i + 1)}
                                    onMouseEnter={() => setHoveredRating(i + 1)}
                                    onMouseLeave={() => setHoveredRating(0)}
                        />
                    ))}
                        </div>
                        <div className="mt-2">
                            {selectedRating === 0 ? "Select a rating" :
                            selectedRating === 1 ? "Poor" :
                            selectedRating === 2 ? "Fair" :
                            selectedRating === 3 ? "Good" :
                            selectedRating === 4 ? "Very Good" :
                            "Excellent"}
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button 
                        variant="secondary" 
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
                        {hasRated ? 'Update Rating' : 'Leave Rating'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Comment Modal */}
            <Modal show={showEditModal} onHide={() => {
                setShowEditModal(false);
                setEditingComment(null);
                setEditCommentText("");
            }}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Comment</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            placeholder="Edit your comment..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button 
                        variant="secondary" 
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
        </div>
    );
};

export default VideoPlayer;

