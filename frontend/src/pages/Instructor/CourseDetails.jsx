import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FaVideo, FaFileAlt, FaGripLines, FaEdit, FaTrash, FaPlus, FaSpinner, FaArrowLeft, FaExclamationTriangle, FaBook, FaSync, FaInfoCircle, FaSearch, FaFilePdf, FaEye, FaEyeSlash, FaQuestionCircle, FaEllipsisV } from "react-icons/fa";
import { Accordion, Button, ListGroup, Card, Spinner, Modal, Form, Alert, Container, Row, Col, InputGroup, Badge, Nav } from "react-bootstrap";
import Courses_API from "../../Api/courseApi";
import { toast } from "react-toastify";

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState(location.state?.course || {});
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openChapters, setOpenChapters] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Chapter management state
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterDescription, setChapterDescription] = useState("");
  const [editingChapter, setEditingChapter] = useState(null);
  const [chapterLoading, setChapterLoading] = useState(false);
  
  // Video management state
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoThumbnail,setVideoThumbnail]=useState(null);
  const [editingThumbnail,setEditingThumbnail]=useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const thumbnailInputRed=useRef(null);

  // Document management state
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentDescription, setDocumentDescription] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const documentInputRef = useRef(null);

  // Quiz management state
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizLoading, setQuizLoading] = useState(false);
  
  // Content type selection dropdown
  const [showContentDropdown, setShowContentDropdown] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);

  // Fetch chapters and videos when component mounts or when navigating back to this page
  useEffect(() => {
    if (course && course._id) {
      // Check if course exists and isn't deactivated
      if (course.status === false) {
        toast.warning("This course is currently inactive and not visible to students.", {
          autoClose: 7000
        });
      }
      
      // Check if this is a transition from course creation
      const isTransitioning = localStorage.getItem('course_transition_loading') === 'true';
      if (isTransitioning) {
        setLoading(true);
        // Clear the flag
        localStorage.removeItem('course_transition_loading');
      }
      
      fetchChaptersAndVideos();
    } else {
      setLoading(false);
    }
  }, [course, location.key]);

  // Load content from local storage when needed
  useEffect(() => {
    // Try to load saved content from localStorage if chapters are empty
    if (chapters.length === 0 && course && course._id) {
      const savedContent = loadContentFromLocalStorage(course._id);
      if (savedContent && savedContent.length > 0) {
        console.log("Loaded content from local storage:", savedContent);
        setChapters(savedContent);
        setLoading(false);
      }
    }
  }, [chapters, course]);

  // Save content to local storage whenever chapters change
  useEffect(() => {
    if (chapters.length > 0 && course && course._id) {
      saveContentToLocalStorage(course._id, chapters);
    }
  }, [chapters, course]);

  // Helper function to save content to localStorage
  const saveContentToLocalStorage = (courseId, data) => {
    try {
      localStorage.setItem(`course_content_${courseId}`, JSON.stringify(data));
      console.log("Content saved to local storage");
    } catch (error) {
      console.error("Error saving content to localStorage:", error);
    }
  };

  // Helper function to load content from localStorage
  const loadContentFromLocalStorage = (courseId) => {
    try {
      const savedData = localStorage.getItem(`course_content_${courseId}`);
      return savedData ? JSON.parse(savedData) : null;
    } catch (error) {
      console.error("Error loading content from localStorage:", error);
      return null;
    }
  };

  // Additional useEffect to handle the case when coming from course creation
  useEffect(() => {
    if (location.state?.isNewlyCreated) {
      toast.success("Course created successfully! You can now add chapters and videos.", {
        autoClose: 5000
      });
    }
  }, []);

  // Additional useEffect to handle quiz updates from quiz editor
  useEffect(() => {
    // Check if we're returning from quiz editor (using location.state.fromQuizEditor)
    if (location.state?.fromQuizEditor && course && course._id) {
      console.log("Returning from quiz editor, refreshing content");
      fetchChaptersAndVideos();
    }
  }, [location.state, course]);

  const fetchChaptersAndVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First check if we have data in localStorage
      const savedContent = loadContentFromLocalStorage(course._id);
      
      if (savedContent && savedContent.length > 0) {
        console.log("Using content from local storage");
        setChapters(savedContent);
        setLoading(false);
        return;
      }
      
      // If no localStorage data, proceed with API fetch
      const chaptersResponse = await Courses_API.get(`/chapter/${course._id}`);
      const chaptersData = chaptersResponse.data;

      console.log("Fetched chapters:", chaptersData);

      // For each chapter, fetch its videos and documents
      const chaptersWithContent = await Promise.all(
        chaptersData.map(async (chapter) => {
          try {
            // Fetch videos for this chapter
            let videos = [];
            try {
              const videosResponse = await Courses_API.get(`/video/${chapter._id}`);
              videos = videosResponse.data || [];
            } catch (videoError) {
              // If we get a 404, it means no videos found for this chapter, which is okay
              if (videoError.response && videoError.response.status === 404) {
                console.log(`No videos found for chapter ${chapter._id}`);
              } else {
                // For other errors, log them
                console.error(`Error fetching videos for chapter ${chapter._id}:`, videoError);
              }
            }
            
            // Format videos for our UI
            const formattedVideos = videos.map(video => ({
              id: video._id,
              title: video.video_title,
              type: "video",
              description: video.video_description,
              url: video.video_url,
              order: video.order,
              thumbnail: video.video_thumbnail
            }));
            
            // Fetch documents for this chapter
            let documents = [];
            try {
              // TODO: Replace with actual API endpoint when implemented
              // For now, we'll use mock data as a placeholder
              // const documentsResponse = await Courses_API.get(`/document/${chapter._id}`);
              // documents = documentsResponse.data || [];
              
              // This is where the documents would be loaded from the API
              // We'll leave the mock data commented out for now, as they should come from real data
            } catch (documentError) {
              console.log(`No documents found for chapter ${chapter._id}`);
            }
            
            // Format documents for our UI
            const formattedDocuments = documents.map(doc => ({
              id: doc._id,
              title: doc.document_title,
              type: "document",
              description: doc.document_description,
              url: doc.document_url,
              order: doc.order
            }));
            
            // Fetch quizzes for this chapter
            let quizzes = [];
            try {
              // TODO: Replace with actual API endpoint when implemented
              // For now, we'll use mock data as a placeholder
              // const quizzesResponse = await Courses_API.get(`/quiz/${chapter._id}`);
              // quizzes = quizzesResponse.data || [];
              
              // This is where the quizzes would be loaded from the API
              // We'll leave the mock data commented out for now, as they should come from real data
            } catch (quizError) {
              console.log(`No quizzes found for chapter ${chapter._id}`);
            }
            
            // Format quizzes for our UI
            const formattedQuizzes = quizzes.map(quiz => ({
              id: quiz._id,
              title: quiz.quiz_title,
              type: "quiz",
              description: quiz.quiz_description,
              isPublished: quiz.is_published,
              passingScore: quiz.passing_score,
              timeLimit: quiz.time_limit,
              attempts: quiz.attempts,
              order: quiz.order,
              questions: quiz.questions || []
            }));
            
            // Combine and sort all content items by order
            const allContentItems = [...formattedVideos, ...formattedDocuments, ...formattedQuizzes].sort((a, b) => a.order - b.order);
            
            return {
              id: chapter._id,
              title: chapter.chapter_title,
              description: chapter.chapter_description,
              order: chapter.order,
              items: allContentItems,
            };
          } catch (error) {
            console.error(`Error processing chapter ${chapter._id}:`, error);
            return {
              id: chapter._id,
              title: chapter.chapter_title,
              description: chapter.chapter_description,
              order: chapter.order,
              items: []
            };
          }
        })
      );

      // Sort chapters by order
      setChapters(chaptersWithContent.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error("Error fetching chapters:", error);
      setError("Failed to load chapters. Please try refreshing the page.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchChaptersAndVideos();
  };

  const handleBackToMyCourses = () => {
    navigate("/instructor/mycourses");
  };

  const toggleChapter = (chapterId) => {
    setOpenChapters((prev) =>
      prev.includes(chapterId) ? prev.filter((id) => id !== chapterId) : [...prev, chapterId]
    );
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, type } = result;

    // Handle chapter reordering
    if (type === "chapter") {
      const updatedChapters = [...chapters];
      const [movedChapter] = updatedChapters.splice(source.index, 1);
      updatedChapters.splice(destination.index, 0, movedChapter);
      
      // Update UI immediately
      setChapters(updatedChapters);
      
      // Send update to backend using PATCH
      try {
        await Courses_API.patch("/chapter/order", {
          chapters: updatedChapters.map(chapter => ({ id: chapter.id }))
        });
      } catch (error) {
        console.error("Error updating chapter order:", error);
        // Revert to original order if API call fails
        fetchChaptersAndVideos();
      }
    } 
    // Handle video reordering or moving between chapters
    else if (type === "items") {
      const sourceChapterIndex = chapters.findIndex((ch) => ch.id === source.droppableId);
      const destChapterIndex = chapters.findIndex((ch) => ch.id === destination.droppableId);

      if (sourceChapterIndex !== -1 && destChapterIndex !== -1) {
        const updatedChapters = [...chapters];
        const [movedItem] = updatedChapters[sourceChapterIndex].items.splice(source.index, 1);
        
        // If moving to a different chapter, update the chapter_id
        if (sourceChapterIndex !== destChapterIndex) {
          movedItem.chapter_id = updatedChapters[destChapterIndex].id;
        }
        
        updatedChapters[destChapterIndex].items.splice(destination.index, 0, movedItem);
        
        // Update UI immediately
        setChapters(updatedChapters);
        
        // Send update to backend using PATCH
        try {
          // Prepare data for the API call
          const videosToUpdate = updatedChapters[destChapterIndex].items.map((item, index) => ({
            id: item.id,
            order: index + 1,
            ...(sourceChapterIndex !== destChapterIndex ? { chapter_id: updatedChapters[destChapterIndex].id } : {})
          }));
          
          // If videos were moved between chapters, we need to update the order of the source chapter too
          if (sourceChapterIndex !== destChapterIndex) {
            const sourceChapterVideos = updatedChapters[sourceChapterIndex].items.map((item, index) => ({
              id: item.id,
              order: index + 1
            }));
            
            // Update both chapters' videos
            await Promise.all([
              Courses_API.patch("/video/order", { videos: videosToUpdate }),
              Courses_API.patch("/video/order", { videos: sourceChapterVideos })
            ]);
          } else {
            // Just update the destination chapter's videos
            await Courses_API.patch("/video/order", { videos: videosToUpdate });
          }
        } catch (error) {
          console.error("Error updating video order:", error);
          // Revert to original order if API call fails
          fetchChaptersAndVideos();
        }
      }
    }
  };

  // Chapter Management Functions
  const openAddChapterModal = () => {
    setEditingChapter(null);
    setChapterTitle("");
    setChapterDescription("");
    setShowChapterModal(true);
  };

  const openEditChapterModal = (chapter) => {
    console.log("Editing chapter:", chapter);
    if (!chapter || !chapter.id) {
      console.error("Invalid chapter data:", chapter);
      alert("Cannot edit this chapter: Invalid chapter data");
      return;
    }
    
    setEditingChapter({
      id: chapter.id,
      title: chapter.title || "",
      description: chapter.description || ""
    });
    setChapterTitle(chapter.title || "");
    setChapterDescription(chapter.description || "");
    setShowChapterModal(true);
  };

  const handleChapterSubmit = async () => {
    if (!chapterTitle.trim()) {
      alert("Chapter title is required!");
      return;
    }

    try {
      setChapterLoading(true);
      setError(null);
      
      if (editingChapter) {
        // Validate chapter ID
        if (!editingChapter.id) {
          throw new Error("Invalid chapter ID");
        }
        
        console.log("Updating chapter with ID:", editingChapter.id);
        
        // Update existing chapter
        const updatedChapter = {
          chapter_title: chapterTitle,
          chapter_description: chapterDescription,
        };

        // Make sure we're using the correct API endpoint format
        const response = await Courses_API.patch(`/chapter/${editingChapter.id}`, updatedChapter);
        
        if (response.data) {
          console.log("Chapter updated successfully:", response.data);
          
          // Refresh data from server to ensure we have the latest
          await fetchChaptersAndVideos();
        }
      } else {
        // Add new chapter
        const chapterData = {
          chapter_title: chapterTitle,
          chapter_description: chapterDescription,
          course_id: course._id,
        };

        console.log("Creating new chapter for course:", course._id);
        const response = await Courses_API.post(`/chapter`, chapterData);
        
        if (response.data) {
          console.log("Chapter created successfully:", response.data);
          
          // Refresh data from server to ensure we have the latest
          await fetchChaptersAndVideos();
          
          // Open the newly created chapter
          setOpenChapters(prev => [...prev, response.data._id]);
        }
      }

      // Reset form and close modal
      setChapterTitle("");
      setChapterDescription("");
      setEditingChapter(null);
      setShowChapterModal(false);
    } catch (error) {
      console.error("Error saving chapter:", error);
      
      // More detailed error logging
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      
      setError("Failed to save chapter. Please try again.");
      alert(error.response?.data?.message || error.message || "An error occurred.");
    } finally {
      setChapterLoading(false);
    }
  };

  const handleDeleteChapter = async (chapterId) => {
    if (!chapterId) {
      console.error("Error: Chapter ID is undefined");
      alert("Invalid chapter ID. Cannot delete.");
      return;
    }

    console.log("Deleting chapter with ID:", chapterId);

    if (!window.confirm("Are you sure you want to delete this chapter? This will also delete all videos in this chapter.")) {
      return;
    }

    try {
      setChapterLoading(true);
      setError(null);
      
      const response = await Courses_API.delete(`/chapter/${chapterId}`);
      console.log("Chapter deleted successfully:", response.data);
      
      // Refresh data from server to ensure we have the latest
      await fetchChaptersAndVideos();
      
      // Remove from open chapters if it was open
      setOpenChapters(prev => prev.filter(id => id !== chapterId));
    } catch (error) {
      console.error("Error deleting chapter:", error);
      
      // More detailed error logging
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      
      setError("Failed to delete chapter. Please try again.");
      alert("Failed to delete chapter. Please try again.");
    } finally {
      setChapterLoading(false);
    }
  };

  // Content Management Functions
  const openContentDropdown = (chapter) => {
    setSelectedChapter(chapter);
    setShowContentModal(true);
  };

  const closeContentDropdown = () => {
    setShowContentModal(false);
  };

  // Video Management Functions
  const openAddVideoModal = (chapter) => {
    setSelectedChapter(chapter);
    setEditingVideo(null);
    setVideoTitle("");
    setVideoDescription("");
    setVideoThumbnail(null);
    setSelectedFile(null);
    setUploadProgress(0);
    setShowVideoModal(true);
    setShowContentModal(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (thumbnailInputRed.current) thumbnailInputRed.current.value = "";
  };

  // Document Management Functions
  const openAddDocumentModal = (chapter) => {
    setSelectedChapter(chapter);
    setDocumentTitle("");
    setDocumentDescription("");
    setSelectedDocument(null);
    setShowDocumentModal(true);
    setShowContentModal(false);
    
    // Reset file input
    if (documentInputRef.current) {
      documentInputRef.current.value = "";
    }
  };

  // Quiz Management Functions
  const openAddQuizModal = (chapter) => {
    setSelectedChapter(chapter);
    setQuizTitle("");
    setQuizDescription("");
    setShowQuizModal(true);
    setShowContentModal(false);
  };

  // Function to handle cancellation and return to content selection modal
  const handleCancelAndReturn = (modalToClose) => {
    // Close the current modal
    if (modalToClose === 'video') setShowVideoModal(false);
    if (modalToClose === 'document') setShowDocumentModal(false);
    if (modalToClose === 'quiz') setShowQuizModal(false);
    
    // Reopen the content selection modal
    setTimeout(() => setShowContentModal(true), 100);
  };

  const handleOpenQuizEditor = () => {
    if (!quizTitle.trim()) {
      alert("Quiz title is required!");
      return;
    }
    
    // Navigate to quiz editor page with quiz details
    navigate("/instructor/quiz-editor", { 
      state: { 
        chapterId: selectedChapter.id,
        courseId: course._id,
        quizTitle,
        quizDescription
      } 
    });
  };

  const handleDocumentSubmit = async () => {
    if (!documentTitle.trim()) {
      alert("Document title is required!");
      return;
    }

    if (!selectedDocument) {
      alert("Please select a PDF document.");
      return;
    }

    try {
      setDocumentLoading(true);
      
      // Generate a mock ID for the document
      const mockDocId = `doc_${Math.random().toString(36).substring(2, 11)}`;
      
      // Convert file to base64 for storage in localStorage
      const base64File = await convertFileToBase64(selectedDocument);
      
      // Create a mock document object
      const newDocument = {
        id: mockDocId,
        title: documentTitle,
        type: "document",
        description: documentDescription,
        url: URL.createObjectURL(selectedDocument), // For immediate display
        base64Data: base64File, // For localStorage persistence
        fileName: selectedDocument.name,
        fileSize: selectedDocument.size,
        fileType: selectedDocument.type,
        order: selectedChapter.items.length + 1
      };
      
      // Update the UI with the new document
      const updatedChapters = [...chapters];
      const chapterIndex = updatedChapters.findIndex(ch => ch.id === selectedChapter.id);
      
      if (chapterIndex !== -1) {
        // Add the new document to the chapter
        updatedChapters[chapterIndex].items.push(newDocument);
        setChapters(updatedChapters);
        
        // Save to localStorage
        saveContentToLocalStorage(course._id, updatedChapters);
      }
      
      // Close modal and show success message
      setShowDocumentModal(false);
      toast.success("Document uploaded successfully!");
      
      // Reset form fields
      setDocumentTitle("");
      setDocumentDescription("");
      setSelectedDocument(null);
      if (documentInputRef.current) {
        documentInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document. Please try again.");
    } finally {
      setDocumentLoading(false);
    }
  };

  // Helper function to convert File to base64 string for localStorage
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Quiz Publish/Unpublish functionality
  const toggleQuizPublish = async (chapterId, quizId, currentStatus) => {
    try {
      // Show loading state
      setLoading(true);
      
      // Update UI immediately
      const updatedChapters = [...chapters];
      const chapterIndex = updatedChapters.findIndex(ch => ch.id === chapterId);
      
      if (chapterIndex !== -1) {
        const quizIndex = updatedChapters[chapterIndex].items.findIndex(
          item => item.id === quizId && item.type === 'quiz'
        );
        
        if (quizIndex !== -1) {
          updatedChapters[chapterIndex].items[quizIndex].isPublished = !currentStatus;
          setChapters(updatedChapters);
          
          // Save to localStorage
          saveContentToLocalStorage(course._id, updatedChapters);
          
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Show success message
          toast.success(`Quiz ${!currentStatus ? 'published' : 'unpublished'} successfully`);
        }
      }
    } catch (error) {
      console.error("Error updating quiz publish status:", error);
      toast.error("Failed to update quiz status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openEditVideoModal = (chapter, video) => {
    console.log("Opening edit modal for video:", video);
    setSelectedChapter(chapter);
    setEditingVideo(video);
    setVideoTitle(video.video_title || video.title || "");
    setVideoDescription(video.video_description || video.description || "");
    setEditingThumbnail(video.video_thumbnail || video.thumbnail || "");
    setSelectedFile(null);
    setUploadProgress(0);
    setShowVideoModal(true);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if(thumbnailInputRed.current) { 
      thumbnailInputRed.current.value = ""; 
    }
  };

  const handleVideoSubmit = async () => {
    if (!videoTitle.trim() || !videoDescription.trim()) {
      alert("Video title and description are required!");
      return;
    }

    if (!editingVideo && !selectedFile) {
      alert("Please select a video file.");
      return;
    }

    // Add validation for thumbnail only when adding a new video (not when editing)
    if (!editingVideo && !videoThumbnail) {
      alert("Please select a video thumbnail. This is required when adding a new video.");
      return;
    }

    try {
      setVideoLoading(true);
      setUploadProgress(0); // Reset progress at start
      setError(null);
      const formData = new FormData();
      formData.append("video_title", videoTitle);
      formData.append("video_description", videoDescription);
      
      // Handle thumbnail correctly
      if (videoThumbnail) {
        if (videoThumbnail instanceof File) {
          console.log("Appending thumbnail as file");
          formData.append("video_thumbnail", videoThumbnail);
        } else if (typeof videoThumbnail === 'string') {
          console.log("Appending thumbnail as string");
          formData.append("video_thumbnail", videoThumbnail);
        }
      } else if (editingThumbnail) {
        console.log("Using existing thumbnail:", editingThumbnail);
        formData.append("video_thumbnail", editingThumbnail);
      }

      // Track if we're uploading a video file (to show progress)
      const isUploadingVideoFile = !!selectedFile;

      if (selectedFile) {
        console.log("Appending video file:", selectedFile.name);
        formData.append("video", selectedFile);
      }

      let response;
      if (editingVideo) {
        // Update existing video
        console.log(`Updating video ID: ${editingVideo.id || editingVideo._id}`);
        const videoId = editingVideo.id || editingVideo._id;
        
        // Log the formData contents for debugging
        for (let pair of formData.entries()) {
          console.log(`Form data for update: ${pair[0]}: ${pair[1]}`);
        }
        
        response = await Courses_API.patch(`/video/${videoId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            // Only calculate progress if we're actually uploading a video file
            if (isUploadingVideoFile) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              console.log(`Upload progress: ${percentCompleted}%`);
              setUploadProgress(percentCompleted);
              
              // Set upload as complete when we reach 100%
              if (percentCompleted === 100) {
                console.log("Upload complete, processing video...");
                // Keep loader but change message
                setUploadProgress(100);
              }
            }
          }
        });
        
        console.log("Video update response:", response.data);
        
        // Update UI immediately with the updated video
        if (response.data) {
          // Close modal and show success message immediately
          setShowVideoModal(false);
          toast.success("Video updated successfully!");
          
          // Update the UI immediately without fetching all chapters again
          const updatedChapters = [...chapters];
          const chapterIndex = updatedChapters.findIndex(ch => ch.id === selectedChapter.id);
          
          if (chapterIndex !== -1) {
            const videoIndex = updatedChapters[chapterIndex].items.findIndex(v => v.id === videoId);
            
            if (videoIndex !== -1) {
              // Update the video in the current state
              const updatedVideo = {
                ...updatedChapters[chapterIndex].items[videoIndex],
                title: videoTitle,
                description: videoDescription,
                thumbnail: videoThumbnail || editingThumbnail || updatedChapters[chapterIndex].items[videoIndex].thumbnail
              };
              
              updatedChapters[chapterIndex].items[videoIndex] = updatedVideo;
              setChapters(updatedChapters);
            }
          }
          
          // Reset form state
          resetFormState();
        }
      } else {
        // Add new video
        formData.append("chapter_id", selectedChapter.id);
        
        // Log the formData contents for debugging
        for (let pair of formData.entries()) {
          console.log(`Form data for new video: ${pair[0]}: ${pair[1]}`);
        }
        
        response = await Courses_API.post("/video", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            if (isUploadingVideoFile) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              console.log(`Upload progress: ${percentCompleted}%`);
              setUploadProgress(percentCompleted);
              
              // Set upload as complete when we reach 100%
              if (percentCompleted === 100) {
                console.log("Upload complete, processing video...");
                // Keep loader but change message
                setUploadProgress(100);
              }
            }
          }
        });
        
        console.log("Video creation response:", response.data);
        
        // Update UI immediately with the new video
        if (response.data) {
          // Close modal and show success message immediately
          setShowVideoModal(false);
          toast.success("Video created successfully!");
          
          // Make sure the chapter is open to see the new video
          if (!openChapters.includes(selectedChapter.id)) {
            setOpenChapters(prev => [...prev, selectedChapter.id]);
          }
          
          // Add the new video to the UI immediately without fetching all chapters again
          const updatedChapters = [...chapters];
          const chapterIndex = updatedChapters.findIndex(ch => ch.id === selectedChapter.id);
          
          if (chapterIndex !== -1) {
            // Format the new video for our UI
            const newVideo = {
              id: response.data._id,
              title: videoTitle,
              type: "video",
              description: videoDescription,
              url: response.data.video_url,
              order: updatedChapters[chapterIndex].items.length + 1,
              thumbnail: response.data.video_thumbnail
            };
            
            // Add the new video to the chapter
            updatedChapters[chapterIndex].items.push(newVideo);
            setChapters(updatedChapters);
          }
          
          // Reset form state
          resetFormState();
        }
      }
    } catch (error) {
      console.error("Error saving video:", error);
      
      // More detailed error logging
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      
      setError("Failed to save video. Please try again.");
      toast.error(error.response?.data?.message || "Failed to upload video. Please try again.");
      setVideoLoading(false);
    }
  };

  // Reset form state without closing modal
  const resetFormState = () => {
    setVideoTitle("");
    setVideoDescription("");
    setSelectedFile(null);
    setEditingThumbnail(null);
    setVideoThumbnail(null);
    setEditingVideo(null);
    setSelectedChapter(null);
    setUploadProgress(0);
    setVideoLoading(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if(thumbnailInputRed.current) {
      thumbnailInputRed.current.value = "";
    }
  };

  const resetFormAndCloseModal = () => {
    // Reset form and close modal
    resetFormState();
    setShowVideoModal(false);
  };

  const handleDeleteVideo = async (chapterId, videoId) => {
    if (!videoId) {
      console.error("Error: Video ID is undefined");
      alert("Invalid video ID. Cannot delete.");
      return;
    }

    console.log("Deleting video with ID:", videoId, "from chapter:", chapterId);

    if (!window.confirm("Are you sure you want to delete this video?")) {
      return;
    }

    try {
      setVideoLoading(true);
      setError(null);
      
      const response = await Courses_API.delete(`/video/${videoId}`);
      console.log("Video deleted successfully:", response.data);
      
      // Refresh data from server to ensure we have the latest
      await fetchChaptersAndVideos();
    } catch (error) {
      console.error("Error deleting video:", error);
      
      // More detailed error logging
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      
      setError("Failed to delete video. Please try again.");
      alert("Failed to delete video. Please try again.");
    } finally {
      setVideoLoading(false);
    }
  };

  // Filter chapters and videos based on search term
  const filteredChapters = chapters.map(chapter => {
    // If no search term, return chapter with all videos
    if (!searchTerm.trim()) return chapter;
    
    // Check if chapter title/description matches search
    const chapterMatches = 
      chapter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (chapter.description && chapter.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter videos that match search
    const filteredVideos = chapter.items.filter(video => 
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    // If either chapter matches or it has matching videos, return it
    if (chapterMatches || filteredVideos.length > 0) {
      // If chapter matches, open it automatically
      if (!openChapters.includes(chapter.id) && (chapterMatches || filteredVideos.length > 0)) {
        setOpenChapters(prev => [...prev, chapter.id]);
      }
      
      // Return chapter with only matching videos
      return {
        ...chapter,
        items: filteredVideos
      };
    }
    
    // No matches in this chapter
    return null;
  }).filter(Boolean); // Remove null chapters

  // Function to handle document deletion
  const handleDeleteDocument = (chapterId, documentId) => {
    if (!documentId) {
      console.error("Error: Document ID is undefined");
      alert("Invalid document ID. Cannot delete.");
      return;
    }

    console.log("Deleting document with ID:", documentId, "from chapter:", chapterId);

    if (!window.confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      setDocumentLoading(true);
      setError(null);
      
      // Update the UI by removing the document
      const updatedChapters = [...chapters];
      const chapterIndex = updatedChapters.findIndex(ch => ch.id === chapterId);
      
      if (chapterIndex !== -1) {
        // Filter out the document to delete
        updatedChapters[chapterIndex].items = updatedChapters[chapterIndex].items.filter(
          item => !(item.id === documentId && item.type === 'document')
        );
        
        // Update state
        setChapters(updatedChapters);
        
        // Save to localStorage
        saveContentToLocalStorage(course._id, updatedChapters);
        
        // Show success message
        toast.success("Document deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      setError("Failed to delete document. Please try again.");
      alert("Failed to delete document. Please try again.");
    } finally {
      setDocumentLoading(false);
    }
  };

  // Function to handle quiz deletion
  const handleDeleteQuiz = (chapterId, quizId) => {
    if (!quizId) {
      console.error("Error: Quiz ID is undefined");
      alert("Invalid quiz ID. Cannot delete.");
      return;
    }

    console.log("Deleting quiz with ID:", quizId, "from chapter:", chapterId);

    if (!window.confirm("Are you sure you want to delete this quiz?")) {
      return;
    }

    try {
      setQuizLoading(true);
      setError(null);
      
      // Update the UI by removing the quiz
      const updatedChapters = [...chapters];
      const chapterIndex = updatedChapters.findIndex(ch => ch.id === chapterId);
      
      if (chapterIndex !== -1) {
        // Filter out the quiz to delete
        updatedChapters[chapterIndex].items = updatedChapters[chapterIndex].items.filter(
          item => !(item.id === quizId && item.type === 'quiz')
        );
        
        // Update state
        setChapters(updatedChapters);
        
        // Save to localStorage
        saveContentToLocalStorage(course._id, updatedChapters);
        
        // Show success message
        toast.success("Quiz deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting quiz:", error);
      setError("Failed to delete quiz. Please try again.");
      alert("Failed to delete quiz. Please try again.");
    } finally {
      setQuizLoading(false);
    }
  };

  if (loading) {
    return (
      <Container fluid className="p-0">
        {/* Skeleton Header */}
        <div className="w-100 mb-4" style={{ 
          background: 'linear-gradient(135deg, #e9ecef 0%, #f8f9fa 100%)',
          padding: '30px 0',
          borderBottomLeftRadius: '30px',
          borderBottomRightRadius: '30px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
          animation: 'pulse 1.5s infinite ease-in-out'
        }}>
          <Container>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
              <div className="mb-3 mb-md-0">
                <div className="skeleton mb-2" style={{ width: '180px', height: '36px', backgroundColor: '#e9ecef', borderRadius: '50px' }}></div>
                <div className="skeleton mb-1" style={{ width: '250px', height: '32px', backgroundColor: '#e9ecef', borderRadius: '4px' }}></div>
                <div className="skeleton" style={{ width: '350px', height: '20px', backgroundColor: '#e9ecef', borderRadius: '4px' }}></div>
              </div>
              <div className="d-flex">
                <div className="skeleton" style={{ width: '150px', height: '45px', backgroundColor: '#e9ecef', borderRadius: '50px', marginLeft: '10px' }}></div>
              </div>
            </div>
          </Container>
        </div>

        <Container fluid className="px-3">
          {/* Skeleton Chapters */}
          {[1, 2, 3].map((_, index) => (
            <div 
              key={index}
              className="mb-3 skeleton-card" 
              style={{ 
                height: index === 0 ? '300px' : '80px', 
                borderRadius: '12px',
                overflow: 'hidden',
                animation: 'pulse 1.5s infinite ease-in-out',
                backgroundColor: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              <div className="d-flex p-3">
                <div className="skeleton me-3" style={{ width: '15px', height: '20px', backgroundColor: '#e9ecef' }}></div>
                <div className="skeleton me-3" style={{ width: '32px', height: '32px', backgroundColor: '#e9ecef', borderRadius: '50%' }}></div>
                <div className="flex-grow-1">
                  <div className="skeleton mb-2" style={{ width: '60%', height: '24px', backgroundColor: '#e9ecef', borderRadius: '4px' }}></div>
                  <div className="skeleton" style={{ width: '40%', height: '16px', backgroundColor: '#e9ecef', borderRadius: '4px' }}></div>
                </div>
                <div className="d-flex align-items-center">
                  <div className="skeleton me-2" style={{ width: '80px', height: '30px', backgroundColor: '#e9ecef', borderRadius: '50px' }}></div>
                  <div className="skeleton" style={{ width: '80px', height: '30px', backgroundColor: '#e9ecef', borderRadius: '50px' }}></div>
                </div>
              </div>
              
              {index === 0 && (
                <div className="p-4 mt-2" style={{ backgroundColor: '#f8f9fa' }}>
                  <div className="skeleton mb-3" style={{ width: '120px', height: '32px', backgroundColor: '#e9ecef', borderRadius: '50px' }}></div>
                  
                  {/* Skeleton Video Items */}
                  {[1, 2, 3].map((_, videoIndex) => (
                    <div 
                      key={videoIndex}
                      className="mb-2 p-3 d-flex align-items-center"
                      style={{ 
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef'
                      }}
                    >
                      <div className="skeleton me-2" style={{ width: '15px', height: '15px', backgroundColor: '#e9ecef' }}></div>
                      <div className="skeleton me-3" style={{ width: '28px', height: '28px', backgroundColor: '#e9ecef', borderRadius: '50%' }}></div>
                      <div className="skeleton me-3" style={{ width: '80px', height: '45px', backgroundColor: '#e9ecef', borderRadius: '6px' }}></div>
                      <div className="flex-grow-1">
                        <div className="skeleton mb-2" style={{ width: '70%', height: '20px', backgroundColor: '#e9ecef', borderRadius: '4px' }}></div>
                        <div className="skeleton" style={{ width: '50%', height: '16px', backgroundColor: '#e9ecef', borderRadius: '4px' }}></div>
                      </div>
                      <div className="d-flex">
                        <div className="skeleton me-2" style={{ width: '32px', height: '32px', backgroundColor: '#e9ecef', borderRadius: '50%' }}></div>
                        <div className="skeleton" style={{ width: '32px', height: '32px', backgroundColor: '#e9ecef', borderRadius: '50%' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Container>
        
        {/* Animation Styles */}
        <style jsx="true">{`
          @keyframes pulse {
            0% {
              opacity: 0.6;
            }
            50% {
              opacity: 1;
            }
            100% {
              opacity: 0.6;
            }
          }
          .skeleton {
            animation: pulse 1.5s infinite ease-in-out;
          }
        `}</style>
      </Container>
    );
  }

  return (
    <Container fluid className="p-0">
      {/* Standard Header Section - Just adding this without changing any functionality */}
      <div className="w-100 mb-4" style={{ 
        background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
        padding: '30px 0',
        color: 'white',
        borderBottomLeftRadius: '30px',
        borderBottomRightRadius: '30px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)'
      }}>
        <Container>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
            <div className="mb-3 mb-md-0">
              <Button 
                variant="light" 
                className="d-flex align-items-center mb-3"
                onClick={handleBackToMyCourses}
                style={{ 
                  color: '#0062E6',
                  fontWeight: '500',
                  borderRadius: '50px',
                  padding: '8px 16px',
                  border: 'none',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
                }}
              >
                <FaArrowLeft className="me-2" /> Back to My Courses
              </Button>
              <h1 className="fw-bold mb-0" style={{ fontSize: 'calc(1.2rem + 0.8vw)' }}>{course.title || "Course Details"}</h1>
              <p className="mb-0 opacity-75">{course.description || "Manage your course content"}</p>
            </div>
            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-3">
              <div className="header-search position-relative">
                <Form.Control
                  type="text"
                  placeholder="Search chapters and videos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    background: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '10px 20px',
                    paddingLeft: '45px',
                    width: '260px',
                    height: '45px',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
                    fontSize: '0.95rem'
                  }}
                />
                <FaSearch className="position-absolute" style={{ 
                  left: '20px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#0062E6',
                  fontSize: '14px'
                }} />
              </div>
              <Button 
                className="d-flex align-items-center gap-2" 
                onClick={openAddChapterModal}
                disabled={chapterLoading}
                style={{ 
                  background: 'white',
                  color: '#0062E6',
                  border: 'none',
                  borderRadius: '50px',
                  fontWeight: '600',
                  padding: '10px 20px',
                  height: '45px',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
                  whiteSpace: 'nowrap'
                }}
              >
                {chapterLoading ? (
                  <>
                    <FaSpinner className="fa-spin me-2" /> Processing...
                  </>
                ) : (
                  <>
                    <FaPlus className="me-2" /> Add Chapter
                  </>
                )}
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container fluid className="px-3 px-md-4">
        {course.status === false && (
          <Alert variant="warning" className="d-flex align-items-center mb-3">
            <FaExclamationTriangle size={20} className="me-2 flex-shrink-0" />
            <div>
              <strong>Course Inactive:</strong> This course is currently deactivated and not visible to students. 
              Contact an administrator to reactivate it.
            </div>
          </Alert>
        )}

        {error && (
          <Alert variant="danger" className="mb-3" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {searchTerm.trim() !== "" && filteredChapters.length === 0 && (
          <Alert variant="info" className="text-center p-4 mb-3">
            <h5 className="mb-2">No results found</h5>
            <p className="mb-2">No chapters or videos match your search term: "{searchTerm}"</p>
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={() => setSearchTerm("")}
              style={{ borderRadius: '50px', padding: '6px 16px' }}
            >
              Clear Search
            </Button>
          </Alert>
        )}

        {chapters.length === 0 ? (
          <div className="text-center py-5 bg-white rounded-4 shadow-sm">
            <div 
              className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: '70px',
                height: '70px',
                background: 'rgba(0, 98, 230, 0.1)'
              }}
            >
              <FaBook size={24} color="#0062E6" />
            </div>
            <h5>No chapters added yet</h5>
            <p className="text-muted">Click the "Add Chapter" button to get started</p>
          </div>
        ) : (
          <>
            <div className="d-block d-md-none alert alert-info mb-3">
              <small><FaInfoCircle className="me-2" /> Tap and hold items to reorder chapters and videos.</small>
            </div>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="chapters" type="chapter">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="chapters-container">
                    {filteredChapters.map((chapter, chapterIndex) => (
                      <Draggable key={chapter.id} draggableId={chapter.id} index={chapterIndex}>
                        {(provided) => (
                          <Card 
                            ref={provided.innerRef} 
                            {...provided.draggableProps} 
                            className="mb-3 border-0 shadow-sm" 
                            style={{ 
                              ...provided.draggableProps.style, 
                              borderRadius: '12px',
                              overflow: 'hidden'
                            }}
                          >
                            <Card.Header 
                              className="bg-white py-3 px-3 px-md-4 d-flex flex-column flex-md-row align-items-md-center" 
                              style={{ 
                                borderBottom: openChapters.includes(chapter.id) ? '1px solid #eee' : 'none',
                                cursor: 'pointer'
                              }}
                              onClick={() => toggleChapter(chapter.id)}
                            >
                              <div className="d-flex align-items-center flex-grow-1 mb-2 mb-md-0">
                                <div 
                                  {...provided.dragHandleProps} 
                                  className="drag-handle me-3 text-muted"
                                  style={{ touchAction: 'none' }}
                                >
                                  <FaGripLines />
                                </div>
                                <div 
                                  className="chapter-number d-flex align-items-center justify-content-center me-3"
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    backgroundColor: '#0062E6',
                                    color: 'white',
                                    borderRadius: '50%',
                                    fontSize: '0.9rem',
                                    fontWeight: '500'
                                  }}
                                >
                                  {chapterIndex + 1}
                                </div>
                                <div className="flex-grow-1">
                                  <h5 className="mb-0 fw-bold text-break" style={{ fontSize: 'calc(0.9rem + 0.3vw)' }}>{chapter.title || "Untitled Chapter"}</h5>
                                  {chapter.description && (
                                    <p className="mb-0 text-muted small text-break">{chapter.description}</p>
                                  )}
                                </div>
                                <span 
                                  className="badge rounded-pill ms-2 text-muted d-none d-sm-inline-block" 
                                  style={{ 
                                    background: 'rgba(0, 98, 230, 0.1)',
                                    fontSize: '0.8rem',
                                    padding: '6px 12px'
                                  }}
                                >
                                  {chapter.items?.length ?? 0} {chapter.items?.length === 1 ? 'item' : 'items'}
                                </span>
                                <span className="ms-3 text-primary d-none d-sm-inline-block">
                                  {openChapters.includes(chapter.id) ? (
                                    <i className="fas fa-chevron-up"></i>
                                  ) : (
                                    <i className="fas fa-chevron-down"></i>
                                  )}
                                </span>
                              </div>
                              <div className="d-flex" onClick={(e) => e.stopPropagation()}>
                                <Button 
                                  variant="outline-primary" 
                                  size="sm" 
                                  className="me-2 d-flex align-items-center"
                                  onClick={() => openEditChapterModal(chapter)}
                                  disabled={chapterLoading}
                                  style={{ 
                                    borderRadius: '50px',
                                    borderColor: '#0062E6',
                                    color: '#0062E6',
                                    backgroundColor: 'rgba(0, 98, 230, 0.05)',
                                    minWidth: '80px',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <FaEdit className="me-1 d-none d-sm-block" /> 
                                  <span className="d-none d-sm-block">Edit</span>
                                  <FaEdit className="d-sm-none" />
                                </Button>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  className="d-flex align-items-center"
                                  onClick={() => handleDeleteChapter(chapter.id)}
                                  disabled={chapterLoading}
                                  style={{ 
                                    borderRadius: '50px',
                                    borderColor: '#dc3545',
                                    color: '#dc3545',
                                    backgroundColor: 'rgba(220, 53, 69, 0.05)',
                                    minWidth: '80px',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <FaTrash className="me-1 d-none d-sm-block" /> 
                                  <span className="d-none d-sm-block">Delete</span>
                                  <FaTrash className="d-sm-none" />
                                </Button>
                              </div>
                            </Card.Header>
                            
                            {openChapters.includes(chapter.id) && (
                              <Card.Body className="bg-light p-3 p-md-4">
                                <div className="mb-3">
                                  <div className="content-dropdown-container position-relative">
                                  <Button 
                                    variant="primary" 
                                    size="sm"
                                    className="d-flex align-items-center"
                                      onClick={() => openContentDropdown(chapter)}
                                      disabled={videoLoading || documentLoading || quizLoading}
                                    style={{ 
                                      borderRadius: '50px',
                                      backgroundColor: '#0062E6',
                                      borderColor: '#0062E6',
                                        minWidth: '130px',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    <FaPlus className="me-2" /> 
                                      Add Content
                                  </Button>
                                  </div>
                                </div>
                                
                                <Droppable droppableId={chapter.id} type="items">
                                  {(provided) => (
                                    <div ref={provided.innerRef} {...provided.droppableProps}>
                                      {chapter.items.length === 0 && !videoLoading && !documentLoading ? (
                                        <div className="text-center p-4 bg-white rounded-3">
                                          <div className="text-muted py-2">
                                            <FaInfoCircle className="me-2 mb-2" size={20} style={{ opacity: 0.5 }} />
                                            <p className="mb-0">No content in this chapter yet. Click "Add Content" to get started.</p>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="content-list rounded bg-white p-2">
                                          {videoLoading || documentLoading ? (
                                            // Skeleton loading UI
                                            Array(3).fill(0).map((_, index) => (
                                              <div 
                                                key={`skeleton-${index}`}
                                                className="mb-2 bg-white rounded-3 border position-relative"
                                                style={{ 
                                                  height: '80px',
                                                  animation: 'pulse 1.5s infinite ease-in-out'
                                                }}
                                              >
                                                <div className="p-3 d-flex align-items-center h-100">
                                                  <div 
                                                    className="me-2 skeleton"
                                                    style={{
                                                      width: '15px',
                                                      height: '20px',
                                                      backgroundColor: '#e9ecef',
                                                      borderRadius: '3px'
                                                    }}
                                                  ></div>
                                                  <div 
                                                    className="skeleton me-3"
                                                    style={{
                                                      width: '28px',
                                                      height: '28px',
                                                      backgroundColor: '#e9ecef',
                                                      borderRadius: '50%'
                                                    }}
                                                  ></div>
                                                  <div 
                                                    className="skeleton me-3 d-none d-sm-block"
                                                    style={{
                                                      width: '80px',
                                                      height: '45px',
                                                      backgroundColor: '#e9ecef',
                                                      borderRadius: '6px'
                                                    }}
                                                  ></div>
                                                  <div className="flex-grow-1">
                                                    <div 
                                                      className="skeleton mb-2"
                                                      style={{
                                                        width: '70%',
                                                        height: '16px',
                                                        backgroundColor: '#e9ecef',
                                                        borderRadius: '3px'
                                                      }}
                                                    ></div>
                                                    <div 
                                                      className="skeleton"
                                                      style={{
                                                        width: '50%',
                                                        height: '12px',
                                                        backgroundColor: '#e9ecef',
                                                        borderRadius: '3px'
                                                      }}
                                                    ></div>
                                                  </div>
                                                  <div className="d-flex">
                                                    <div 
                                                      className="skeleton me-2"
                                                      style={{
                                                        width: '30px',
                                                        height: '30px',
                                                        backgroundColor: '#e9ecef',
                                                        borderRadius: '50%'
                                                      }}
                                                    ></div>
                                                    <div 
                                                      className="skeleton"
                                                      style={{
                                                        width: '30px',
                                                        height: '30px',
                                                        backgroundColor: '#e9ecef',
                                                        borderRadius: '50%'
                                                      }}
                                                    ></div>
                                                  </div>
                                                </div>
                                              </div>
                                            ))
                                          ) : (
                                            chapter.items.map((item, itemIndex) => (
                                              <Draggable key={item.id} draggableId={item.id} index={itemIndex}>
                                                {provided => (
                                                  <div 
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className="mb-2 bg-white rounded-3 border"
                                                    style={{ ...provided.draggableProps.style }}
                                                  >
                                                    <div className="p-3 d-flex align-items-center flex-wrap flex-sm-nowrap">
                                                      <div 
                                                        {...provided.dragHandleProps} 
                                                        className="drag-handle me-2 text-muted"
                                                        style={{ touchAction: 'none' }}
                                                      >
                                                        <FaGripLines />
                                                      </div>
                                                      <div 
                                                        className="video-number d-flex align-items-center justify-content-center me-3"
                                                        style={{
                                                          width: '28px',
                                                          height: '28px',
                                                          backgroundColor: '#4cc9f0',
                                                          color: 'white',
                                                          borderRadius: '50%',
                                                          fontSize: '0.8rem'
                                                        }}
                                                      >
                                                        {itemIndex + 1}
                                                      </div>
                                                      
                                                      {item.thumbnail && (
                                                        <div className="me-3 d-none d-sm-block" style={{ width: '80px', height: '45px', overflow: 'hidden', borderRadius: '6px', backgroundColor: '#f8f9fa' }}>
                                                          <img 
                                                            src={item.thumbnail} 
                                                            alt="" 
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                          />
                                                        </div>
                                                      )}
                                                      
                                                      <div className="flex-grow-1 ms-0 ms-sm-2 mb-2 mb-sm-0 w-100 w-sm-auto">
                                                        <h6 className="mb-0 d-flex align-items-center text-break">
                                                          {item.type === "video" ? (
                                                            <FaVideo className="me-2 text-primary" />
                                                          ) : item.type === "document" ? (
                                                            <FaFilePdf className="me-2 text-danger" />
                                                          ) : (
                                                            <FaBook className="me-2 text-success" />
                                                          )}
                                                          {item.title}
                                                        </h6>
                                                        {item.description && (
                                                          <small className="text-muted text-break">{item.description}</small>
                                                        )}
                                                        {item.type === 'quiz' && (
                                                          <div className="mt-2">
                                                            <Badge 
                                                              bg={item.isPublished ? "success" : "warning"} 
                                                              className="me-2"
                                                              style={{ fontSize: '0.7rem' }}
                                                            >
                                                              {item.isPublished ? "Published" : "Draft"}
                                                            </Badge>
                                                            {item.questions?.length > 0 && (
                                                              <Badge 
                                                                bg="info" 
                                                                className="me-2"
                                                                style={{ fontSize: '0.7rem' }}
                                                              >
                                                                {item.questions.length} question{item.questions.length !== 1 ? 's' : ''}
                                                              </Badge>
                                                            )}
                                                            {item.passingScore && (
                                                              <Badge 
                                                                bg="secondary"
                                                                style={{ fontSize: '0.7rem' }}
                                                              >
                                                                Pass: {item.passingScore}%
                                                              </Badge>
                                                            )}
                                                          </div>
                                                        )}
                                                      </div>
                                                      
                                                      <div className="ms-auto d-flex">
                                                        <Button 
                                                          variant="outline-primary" 
                                                          size="sm" 
                                                          className="me-2"
                                                          onClick={() => item.type === 'video' 
                                                            ? openEditVideoModal(chapter, item)
                                                            : item.type === 'quiz'
                                                            ? navigate("/instructor/quiz-editor", { 
                                                                state: { 
                                                                  chapterId: chapter.id,
                                                                  courseId: course._id,
                                                                  quizId: item.id,
                                                                  quizTitle: item.title,
                                                                  quizDescription: item.description
                                                                } 
                                                              })
                                                            : null /* document edit not yet implemented */
                                                          }
                                                          disabled={videoLoading}
                                                          style={{ 
                                                            borderRadius: '50px',
                                                            borderColor: '#0062E6',
                                                            color: '#0062E6',
                                                            backgroundColor: 'rgba(0, 98, 230, 0.05)',
                                                            width: '32px',
                                                            height: '32px',
                                                            padding: '0',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                          }}
                                                        >
                                                          <FaEdit />
                                                        </Button>
                                                        
                                                        {item.type === 'quiz' && (
                                                          <Button 
                                                            variant={item.isPublished ? "outline-warning" : "outline-success"}
                                                            size="sm"
                                                            className="me-2"
                                                            onClick={() => toggleQuizPublish(chapter.id, item.id, item.isPublished)}
                                                            style={{ 
                                                              borderRadius: '50px',
                                                              width: '32px',
                                                              height: '32px',
                                                              padding: '0',
                                                              display: 'inline-flex',
                                                              alignItems: 'center',
                                                              justifyContent: 'center'
                                                            }}
                                                          >
                                                            {item.isPublished ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                                                          </Button>
                                                        )}
                                                        
                                                        <Button 
                                                          variant="outline-danger" 
                                                          size="sm"
                                                          onClick={() => item.type === 'video' 
                                                            ? handleDeleteVideo(chapter.id, item.id)
                                                            : item.type === 'document'
                                                            ? handleDeleteDocument(chapter.id, item.id) 
                                                            : item.type === 'quiz'
                                                            ? handleDeleteQuiz(chapter.id, item.id)
                                                            : null
                                                          }
                                                          disabled={videoLoading}
                                                          style={{ 
                                                            borderRadius: '50px',
                                                            borderColor: '#dc3545',
                                                            color: '#dc3545',
                                                            backgroundColor: 'rgba(220, 53, 69, 0.05)',
                                                            width: '32px',
                                                            height: '32px',
                                                            padding: '0',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                          }}
                                                        >
                                                          <FaTrash />
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}
                                              </Draggable>
                                            ))
                                          )}
                                        </div>
                                      )}
                                      {provided.placeholder}
                                    </div>
                                  )}
                                </Droppable>
                              </Card.Body>
                            )}
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            <style jsx="true">{`
              .drag-handle {
                cursor: grab;
                transition: all 0.2s ease;
              }
              
              .drag-handle:active {
                cursor: grabbing;
                transform: scale(1.1);
                color: #0062E6;
              }
              
              @media (hover: hover) {
                .drag-handle:hover {
                  transform: scale(1.1);
                  color: #0062E6;
                }
              }

              @keyframes pulse {
                0% {
                  opacity: 0.6;
                }
                50% {
                  opacity: 1;
                }
                100% {
                  opacity: 0.6;
                }
              }
              .skeleton {
                animation: pulse 1.5s infinite ease-in-out;
              }
            `}</style>
          </>
        )}

        {/* Chapter Modal */}
        <Modal 
          show={showChapterModal} 
          onHide={() => !chapterLoading && setShowChapterModal(false)} 
          centered 
          backdrop="static"
          size="lg"
        >
          <Modal.Header 
            closeButton={!chapterLoading}
            style={{ background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}
          >
            <Modal.Title style={{ fontWeight: "600", color: '#0062E6' }}>
              {editingChapter ? `Edit Chapter: ${editingChapter.title || ""}` : "Add New Chapter"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: "500" }}>
                  Chapter Title <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter Chapter Title"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  disabled={chapterLoading}
                  required
                  style={{ 
                    borderRadius: "8px",
                    padding: "12px",
                    borderColor: "#ced4da"
                  }}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: "500" }}>
                  Chapter Description
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="Enter Chapter Description"
                  value={chapterDescription}
                  onChange={(e) => setChapterDescription(e.target.value)}
                  disabled={chapterLoading}
                  style={{ 
                    borderRadius: "8px",
                    padding: "12px",
                    borderColor: "#ced4da"
                  }}
                />
                <Form.Text className="text-muted">
                  A brief description of what this chapter covers
                </Form.Text>
              </Form.Group>
              {editingChapter && (
                <input type="hidden" value={editingChapter.id} />
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer style={{ background: '#f8f9fa', borderTop: '1px solid #e9ecef' }}>
            <Button 
              variant="light" 
              onClick={() => setShowChapterModal(false)}
              disabled={chapterLoading}
              style={{ 
                borderRadius: "50px",
                padding: "8px 20px"
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleChapterSubmit}
              disabled={chapterLoading || !chapterTitle.trim()}
              style={{ 
                borderRadius: "50px",
                padding: "8px 20px",
                background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
                border: 'none'
              }}
            >
              {chapterLoading ? (
                <>
                  <FaSpinner className="me-2 fa-spin" />
                  {editingChapter ? "Updating..." : "Adding..."}
                </>
              ) : (
                <>
                  {editingChapter ? "Update Chapter" : "Add Chapter"}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Video Modal */}
        <Modal 
          show={showVideoModal} 
          onHide={() => !videoLoading && setShowVideoModal(false)} 
          centered 
          backdrop="static"
          size="lg"
        >
          <Modal.Header 
            closeButton={!videoLoading}
            style={{ background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}
          >
            <Modal.Title style={{ fontWeight: "600", color: '#0062E6' }}>
              {editingVideo ? `Edit Video: ${editingVideo.title || ""}` : "Add New Video"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Form>
              <Row>
                <Col md={7}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: "500" }}>
                      Video Title <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter Video Title"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      disabled={videoLoading}
                      style={{ 
                        borderRadius: "8px",
                        padding: "12px",
                        borderColor: "#ced4da"
                      }}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: "500" }}>
                      Video Description <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Enter Video Description"
                      value={videoDescription}
                      onChange={(e) => setVideoDescription(e.target.value)}
                      disabled={videoLoading}
                      style={{ 
                        borderRadius: "8px",
                        padding: "12px",
                        borderColor: "#ced4da"
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col md={5}>
                  {/* Video Thumbnail */}
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: "500" }}>
                      {editingThumbnail ? "Video Thumbnail (optional)" : "Video Thumbnail"}
                    </Form.Label>
                    <div 
                      className="preview-container mb-2"
                      style={{
                        border: '1px dashed #ced4da',
                        borderRadius: '8px',
                        height: '150px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f8f9fa',
                        overflow: 'hidden'
                      }}
                    >
                      {videoThumbnail ? (
                        <img 
                          src={videoThumbnail} 
                          alt="Video Thumbnail" 
                          style={{ maxWidth: "100%", maxHeight: "148px", objectFit: "contain" }} 
                        />
                      ) : editingVideo?.thumbnail_url ? (
                        <img 
                          src={editingVideo.thumbnail_url} 
                          alt="Current Thumbnail" 
                          style={{ maxWidth: "100%", maxHeight: "148px", objectFit: "contain" }} 
                        />
                      ) : (
                        <div className="text-center text-muted">
                          <FaFileAlt size={24} className="mb-2" />
                          <p className="mb-0">Upload a thumbnail</p>
                        </div>
                      )}
                    </div>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setVideoThumbnail(reader.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                      disabled={videoLoading}
                      style={{ 
                        borderRadius: "8px",
                        padding: "10px",
                        borderColor: "#ced4da"
                      }}
                    />
                    <Form.Text className="text-muted">
                      {editingThumbnail ? "Leave empty to keep the current thumbnail." : "Upload a thumbnail image for your video."}
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              {/* Video Upload */}
              <Form.Group className="mt-3 mb-3">
                <Form.Label style={{ fontWeight: "500" }}>
                  {editingVideo ? "Replace Video (optional)" : "Upload Video"}
                  {!editingVideo && <span className="text-danger">*</span>}
                </Form.Label>
                <Form.Control
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  disabled={videoLoading}
                  style={{ 
                    borderRadius: "8px",
                    padding: "10px",
                    borderColor: "#ced4da"
                  }}
                />
                <Form.Text className="text-muted">
                  {editingVideo ? "Leave empty to keep the current video." : "Supported formats: MP4, WebM, MOV (max 500MB)"}
                </Form.Text>
              </Form.Group>

              {/* Upload Progress */}
              {videoLoading && selectedFile && (
                <div className="mt-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="fw-semibold">
                      {uploadProgress === 100 
                        ? "Processing video, please wait..." 
                        : "Uploading... Please don't close the window."}
                    </span>
                    <span className="badge" style={{ 
                      background: uploadProgress === 100 ? '#28a745' : '#0062E6', 
                      padding: '6px 12px' 
                    }}>
                      {uploadProgress === 100 ? "Processing" : `${uploadProgress}%`}
                    </span>
                  </div>
                  <div className="progress" style={{ height: "10px", borderRadius: "5px", backgroundColor: '#f0f0f0' }}>
                    <div 
                      className="progress-bar" 
                      role="progressbar" 
                      style={{ 
                        width: `${uploadProgress}%`,
                        background: uploadProgress === 100 
                          ? 'linear-gradient(135deg, #28a745 0%, #5cb85c 100%)'
                          : 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
                        borderRadius: "5px",
                        transition: 'width 0.3s ease, background 0.5s ease'
                      }} 
                      aria-valuenow={uploadProgress} 
                      aria-valuemin="0" 
                      aria-valuemax="100"
                    ></div>
                  </div>
                  <p className="text-muted small mt-2">
                    {uploadProgress === 100 
                      ? "Video upload complete. Server is now processing the video..." 
                      : "Large videos may take several minutes to upload. Please be patient."}
                  </p>
                </div>
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer style={{ background: '#f8f9fa', borderTop: '1px solid #e9ecef' }}>
            <Button 
              variant="light" 
              onClick={() => handleCancelAndReturn('video')}
              disabled={videoLoading}
              style={{ 
                borderRadius: "50px",
                padding: "8px 20px"
              }}
            >
              <FaArrowLeft className="me-2" /> Back
            </Button>
            <Button 
              variant="primary" 
              onClick={handleVideoSubmit} 
              disabled={videoLoading}
              style={{ 
                borderRadius: "50px",
                padding: "8px 20px",
                background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
                border: 'none'
              }}
            >
              {videoLoading ? (
                <>
                  <FaSpinner className="me-2 fa-spin" />
                  {editingVideo ? "Updating..." : "Adding..."}
                </>
              ) : (
                <>
                  {editingVideo ? "Update Video" : "Add Video"}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Document Modal */}
        <Modal 
          show={showDocumentModal} 
          onHide={() => !documentLoading && setShowDocumentModal(false)} 
          centered 
          backdrop="static"
          size="lg"
        >
          <Modal.Header 
            closeButton={!documentLoading}
            style={{ background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}
          >
            <Modal.Title style={{ fontWeight: "600", color: '#0062E6' }}>
              Add Document
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: "500" }}>
                  Document Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter Document Name"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  disabled={documentLoading}
                  style={{ 
                    borderRadius: "8px",
                    padding: "12px",
                    borderColor: "#ced4da"
                  }}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: "500" }}>
                  Document Description
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Enter Document Description"
                  value={documentDescription}
                  onChange={(e) => setDocumentDescription(e.target.value)}
                  disabled={documentLoading}
                  style={{ 
                    borderRadius: "8px",
                    padding: "12px",
                    borderColor: "#ced4da"
                  }}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: "500" }}>
                  Select PDF <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  ref={documentInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSelectedDocument(e.target.files[0])}
                  disabled={documentLoading}
                  style={{ 
                    borderRadius: "8px",
                    padding: "10px",
                    borderColor: "#ced4da"
                  }}
                />
                <Form.Text className="text-muted">
                  Only PDF files are accepted.
                </Form.Text>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer style={{ background: '#f8f9fa', borderTop: '1px solid #e9ecef' }}>
            <Button 
              variant="light" 
              onClick={() => handleCancelAndReturn('document')}
              disabled={documentLoading}
              style={{ 
                borderRadius: "50px",
                padding: "8px 20px"
              }}
            >
              <FaArrowLeft className="me-2" /> Back
            </Button>
            <Button 
              variant="primary" 
              onClick={handleDocumentSubmit} 
              disabled={documentLoading}
              style={{ 
                borderRadius: "50px",
                padding: "8px 20px",
                background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
                border: 'none'
              }}
            >
              {documentLoading ? (
                <>
                  <FaSpinner className="me-2 fa-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Document"
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Quiz Modal */}
        <Modal 
          show={showQuizModal} 
          onHide={() => !quizLoading && setShowQuizModal(false)} 
          centered 
          backdrop="static"
          size="lg"
        >
          <Modal.Header 
            closeButton={!quizLoading}
            style={{ background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}
          >
            <Modal.Title style={{ fontWeight: "600", color: '#0062E6' }}>
              Add Quiz & Assessment
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: "500" }}>
                  Quiz Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter Quiz Name"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  disabled={quizLoading}
                  style={{ 
                    borderRadius: "8px",
                    padding: "12px",
                    borderColor: "#ced4da"
                  }}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: "500" }}>
                  Quiz Description
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Enter Quiz Description"
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  disabled={quizLoading}
                  style={{ 
                    borderRadius: "8px",
                    padding: "12px",
                    borderColor: "#ced4da"
                  }}
                />
              </Form.Group>
              <div className="alert alert-info">
                <FaInfoCircle className="me-2" /> After creating the quiz, you'll be directed to the quiz editor where you can set up questions, passing score, time limits, and other settings.
              </div>
            </Form>
          </Modal.Body>
          <Modal.Footer style={{ background: '#f8f9fa', borderTop: '1px solid #e9ecef' }}>
            <Button 
              variant="light" 
              onClick={() => handleCancelAndReturn('quiz')}
              disabled={quizLoading}
              style={{ 
                borderRadius: "50px",
                padding: "8px 20px"
              }}
            >
              <FaArrowLeft className="me-2" /> Back
            </Button>
            <Button 
              variant="primary" 
              onClick={handleOpenQuizEditor} 
              disabled={quizLoading || !quizTitle.trim()}
              style={{ 
                borderRadius: "50px",
                padding: "8px 20px",
                background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
                border: 'none'
              }}
            >
              Create Quiz
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Content Type Selection Modal */}
        <Modal 
          show={showContentModal} 
          onHide={closeContentDropdown} 
          centered 
          size="sm"
        >
          <Modal.Header 
            closeButton
            style={{ background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}
          >
            <Modal.Title style={{ fontWeight: "600", color: '#0062E6', fontSize: '1.1rem' }}>
              Select Content Type
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-2">
            <ListGroup variant="flush">
              <ListGroup.Item 
                action 
                onClick={() => {
                  openAddVideoModal(selectedChapter);
                  closeContentDropdown();
                }}
                className="border-0 rounded-3 mb-1 p-3"
                style={{
                  transition: 'background-color 0.2s'
                }}
              >
                <div className="d-flex align-items-center">
                  <div 
                    className="me-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(13, 110, 253, 0.1)'
                    }}
                  >
                    <FaVideo size={18} className="text-primary" />
                  </div>
                  <div>
                    <h6 className="mb-0">Video</h6>
                    <small className="text-muted">Upload video content</small>
                  </div>
                </div>
              </ListGroup.Item>
              
              <ListGroup.Item 
                action 
                onClick={() => {
                  openAddDocumentModal(selectedChapter);
                  closeContentDropdown();
                }}
                className="border-0 rounded-3 mb-1 p-3"
              >
                <div className="d-flex align-items-center">
                  <div 
                    className="me-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 193, 7, 0.1)'
                    }}
                  >
                    <FaFileAlt size={18} className="text-warning" />
                  </div>
                  <div>
                    <h6 className="mb-0">Document</h6>
                    <small className="text-muted">Upload PDF document</small>
                  </div>
                </div>
              </ListGroup.Item>
              
              <ListGroup.Item 
                action 
                onClick={() => {
                  openAddQuizModal(selectedChapter);
                  closeContentDropdown();
                }}
                className="border-0 rounded-3 p-3"
              >
                <div className="d-flex align-items-center">
                  <div 
                    className="me-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(25, 135, 84, 0.1)'
                    }}
                  >
                    <FaBook size={18} className="text-success" />
                  </div>
                  <div>
                    <h6 className="mb-0">Quiz & Assessment</h6>
                    <small className="text-muted">Create interactive quiz</small>
                  </div>
                </div>
              </ListGroup.Item>
            </ListGroup>
          </Modal.Body>
        </Modal>

        {/* Add CSS for input placeholder styling */}
        <style jsx="true">{`
          input::placeholder {
            color: #888 !important;
          }
        `}</style>
      </Container>
    </Container>
  );
};

export default CourseDetail;
