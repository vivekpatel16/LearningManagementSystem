import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FaVideo, FaFileAlt, FaGripLines, FaEdit, FaTrash, FaPlus, FaSpinner, FaArrowLeft, FaExclamationTriangle, FaBook, FaSync, FaInfoCircle, FaSearch, FaFilePdf, FaEye, FaEyeSlash, FaQuestionCircle, FaEllipsisV } from "react-icons/fa";
import { Accordion, Button, ListGroup, Card, Spinner, Modal, Form, Alert, Container, Row, Col, InputGroup, Badge, Nav } from "react-bootstrap";
import Courses_API from "../../Api/courseApi";
import Document_API, { uploadDocument, updateDocument, deleteDocument } from "../../Api/documentApi";
import { toast } from "react-toastify";
import axiosInstance from "../../Api/axiosInstance";
import { uploadVideo, updateVideo, deleteVideo, getChapterContent } from "../../Api/videoApi";
import axios from "axios";
import { createMinimalQuiz } from "../../Api/quizApi";

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
  const [activeDocument, setActiveDocument] = useState(null);

  // Quiz management state
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  
  // Content type selection dropdown
  const [showContentDropdown, setShowContentDropdown] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);

  // Add these state variables near the other state definitions at the top of the component
  const [activeChapter, setActiveChapter] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [thumbnailImage, setThumbnailImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState("");

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
      
      // Fetch chapters from API
      const chaptersResponse = await Courses_API.get(`/chapter/${course._id}`);
      const chaptersData = chaptersResponse.data;

      console.log("Fetched chapters:", chaptersData);

      // For each chapter, fetch its content from ChapterContent API
      const chaptersWithContent = await Promise.all(
        chaptersData.map(async (chapter) => {
          try {
            // Fetch content for this chapter using ChapterContent API
            let contentItems = [];
            try {
              // Use the new getChapterContent function from videoApi
              const chapterContentResponse = await getChapterContent(chapter._id);
              contentItems = chapterContentResponse || [];
            } catch (contentError) {
              // If we get a 404, it means no content found for this chapter, which is okay
              if (contentError.response && contentError.response.status === 404) {
                console.log(`No content found for chapter ${chapter._id}`);
              } else {
                // For other errors, log them
                console.error(`Error fetching content for chapter ${chapter._id}:`, contentError);
              }
            }
            
            // Process content items based on their type
            const formattedItems = await Promise.all(contentItems.map(async (item) => {
              const contentType = item.content_type_ref;
              const contentId = item.content_id;
              
              // If contentDetails is already populated from the API, use it directly
              if (item.contentDetails) {
                const details = item.contentDetails;
                
                if (contentType === 'VideoInfo') {
                  return {
                    id: details._id,
                    title: details.video_title,
                    type: "video",
                    description: details.video_description,
                    url: details.video_url,
                    order: item.order,
                    thumbnail: details.video_thumbnail
                  };
                } else if (contentType === 'Document') {
                  return {
                    id: details._id,
                    title: details.pdf_title,
                    type: "document",
                    description: details.pdf_description || "",
                    url: details.pdf_url,
                    order: item.order
                  };
                } else if (contentType === 'Assessment') {
                  return {
                    id: details._id,
                    title: details.title,
                    type: "quiz",
                    description: details.description,
                    isPublished: details.is_published,
                    passingScore: details.passing_score,
                    timeLimit: details.time_limit,
                    attempts: details.attempts,
                    order: item.order,
                    questions: details.questions || []
                  };
                }
              }
              
              // Fallback to legacy method if contentDetails is not populated
              if (contentType === 'VideoInfo') {
                try {
                  // Fetch video details
                  const videoResponse = await axiosInstance.get(`/courses/video/${contentId}`, {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                  });
                  
                  const video = videoResponse.data;
                  return {
              id: video._id,
              title: video.video_title,
              type: "video",
              description: video.video_description,
              url: video.video_url,
                    order: item.order,
                    thumbnail: video.video_thumbnail
                  };
                } catch (error) {
                  console.error(`Error fetching video details for ${contentId}:`, error);
                  return null;
                }
              } 
              else if (contentType === 'PDF') {
                try {
                  // Fetch PDF details
                  const pdfResponse = await axiosInstance.get(`/documents/${contentId}`, {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                  });
                  
                  const pdf = pdfResponse.data;
                  return {
                    id: pdf._id,
                    title: pdf.pdf_title,
                    type: "document",
                    url: pdf.pdf_url,
                    order: item.order
                  };
                } catch (error) {
                  console.error(`Error fetching PDF details for ${contentId}:`, error);
                  return null;
                }
              }
              else if (contentType === 'Assessment') {
                try {
                  // Fetch quiz details
                  const quizResponse = await axiosInstance.get(`/quizzes/${contentId}`, {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                  });
                  
                  const quiz = quizResponse.data;
                  return {
                    id: quiz._id,
                    title: quiz.title,
                    type: "quiz",
                    description: quiz.description,
                    isPublished: quiz.is_published,
                    passingScore: quiz.passing_score,
                    timeLimit: quiz.time_limit,
                    attempts: quiz.attempts,
                    order: item.order,
                    questions: quiz.questions || []
                  };
                } catch (error) {
                  console.error(`Error fetching quiz details for ${contentId}:`, error);
                  return null;
                }
              }
              else if (contentType === 'Document') {
                try {
                  // Fetch document details
                  const documentResponse = await Document_API.get(`/${contentId}`);
                  
                  return {
                    id: documentResponse._id,
                    title: documentResponse.pdf_title,
                    type: "document",
                    description: documentResponse.pdf_description || "",
                    url: documentResponse.pdf_url,
                    order: item.order
                  };
                } catch (error) {
                  console.error(`Error fetching document details for ${contentId}:`, error);
                  return null;
                }
              }
              
              return null;
            }));
            
            // Remove null entries and sort by order
            const validItems = formattedItems.filter(item => item !== null)
              .sort((a, b) => a.order - b.order);
            
            return {
              id: chapter._id,
              title: chapter.chapter_title,
              description: chapter.chapter_description,
              order: chapter.order,
              items: validItems,
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
    setActiveChapter(chapter);
    setEditingVideo(null);
    setActiveVideo(null);
    setIsEditing(false);
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
    setActiveChapter(chapter);
    setDocumentTitle("");
    setDocumentDescription("");
    setSelectedDocument(null);
    setActiveDocument(null);
    setIsEditing(false);
    setShowDocumentModal(true);
    setShowContentModal(false);
    
    // Reset file input
    if (documentInputRef.current) {
      documentInputRef.current.value = "";
    }
  };

  // Function to open edit document modal
  const openEditDocumentModal = (chapter, document) => {
    setSelectedChapter(chapter);
    setActiveChapter(chapter);
    setActiveDocument(document);
    setIsEditing(true);
    setDocumentTitle(document.title || "");
    setDocumentDescription(document.description || "");
    setSelectedDocument(null);
    setShowDocumentModal(true);
    
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

  // Add resetQuizForm function which is called but not defined
  const resetQuizForm = () => {
    setQuizTitle("");
    setQuizDescription("");
    setSelectedChapter(null);
  };

  // Function to handle cancellation and return to content selection modal
  const handleCancelAndReturn = (type) => {
    if (type === 'video') {
      setShowVideoModal(false);
      setVideoTitle("");
      setVideoDescription("");
    setSelectedFile(null);
      setVideoThumbnail("");
      setThumbnailImage(null);
      setEditingVideo(null);
      setEditingThumbnail(null);
      setUploadError(null);
    setUploadProgress(0);
      setIsEditing(false);
    } else if (type === 'document') {
      setShowDocumentModal(false);
      setDocumentTitle("");
      setSelectedDocument(null);
      setActiveDocument(null);
      setIsEditing(false);
      setUploadError(null);
    } else if (type === 'quiz') {
      setShowQuizModal(false);
      resetQuizForm();
    }
  };

  const handleOpenQuizEditor = () => {
    if (!quizTitle.trim()) {
      toast.error("Quiz title is required!");
      return;
    }

    // Just navigate to quiz editor with title and description
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
    try {
      setSubmitting(true);
      setUploadError("");

      // Validate form
      if ((!selectedDocument && !isEditing) || !documentTitle.trim()) {
        setUploadError("Please fill in all required fields");
        setSubmitting(false);
      return;
    }

      // Create form data
      const formData = new FormData();
      if (selectedDocument) {
        formData.append("pdf", selectedDocument);
      }
      formData.append("pdf_title", documentTitle);
      formData.append("chapter_id", selectedChapter.id);
      
      let response;
      
      // For editing existing document
      if (isEditing && activeDocument) {
        response = await updateDocument(activeDocument.id, formData);
        
        // Update the chapter's document item in state
        const updatedChapters = [...chapters];
        const chapterIndex = updatedChapters.findIndex((chapter) => chapter.id === selectedChapter.id);
        if (chapterIndex !== -1) {
          const docIndex = updatedChapters[chapterIndex].items.findIndex(
            (item) => item.id === activeDocument.id && item.type === "document"
          );
          if (docIndex !== -1) {
            updatedChapters[chapterIndex].items[docIndex] = {
              ...updatedChapters[chapterIndex].items[docIndex],
              title: documentTitle,
              url: response.pdf_url
            };
          }
        }
        
        // Update state
        setChapters(updatedChapters);
        
        // Show success message
        toast.success("Document updated successfully!");
      } 
      // For adding new document
      else {
        // Upload the PDF using our document API
        console.log("Uploading PDF with chapter_id:", selectedChapter.id);
        response = await uploadDocument(formData);
        
        // Refresh the data to get the updated content
        await fetchChaptersAndVideos();
        
        // Show success message
        toast.success("Document uploaded successfully!");
      }

      // Close modal and reset form
      handleCancelAndReturn('document');
    } catch (error) {
      console.error("Error submitting document:", error);
      setUploadError(
        error.response?.data?.message ||
        error.message ||
        "Failed to upload document. Please try again."
      );
    } finally {
      setSubmitting(false);
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
    setShowDocumentModal(false);
    setDocumentTitle("");
    setSelectedDocument(null);
    setActiveDocument(null);
  };

  const handleDeleteVideo = async (chapterId, videoId) => {
    try {
      // Show confirmation dialog
      const confirmed = window.confirm("Are you sure you want to delete this video? This action cannot be undone.");
      if (!confirmed) {
        return;
      }

      setLoading(true);
      
      // Delete the video via our API helper
      await deleteVideo(videoId);
      
      // Update UI
      const updatedChapters = [...chapters];
      const chapterIndex = updatedChapters.findIndex(ch => ch.id === chapterId);
      
      if (chapterIndex !== -1) {
        // Remove the video from the chapter's items
        updatedChapters[chapterIndex].items = updatedChapters[chapterIndex].items.filter(
          item => !(item.id === videoId && item.type === "video")
        );
        
        // Update state
        setChapters(updatedChapters);
        
        // Show success message
        toast.success("Video deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Failed to delete video. Please try again.");
    } finally {
      setLoading(false);
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
  const handleDeleteDocument = async (chapterId, documentId) => {
    try {
      // Show confirmation dialog
      const confirmed = window.confirm("Are you sure you want to delete this document? This action cannot be undone.");
      if (!confirmed) {
        return;
      }

      setLoading(true);
      
      // Delete the document via our document API
      await deleteDocument(documentId);
      
      // Update UI
      const updatedChapters = [...chapters];
      const chapterIndex = updatedChapters.findIndex(ch => ch.id === chapterId);
      
      if (chapterIndex !== -1) {
        // Remove the document from the chapter's items
        updatedChapters[chapterIndex].items = updatedChapters[chapterIndex].items.filter(
          item => !(item.id === documentId && item.type === "document")
        );
        
        // Update state
        setChapters(updatedChapters);
        
        // Show success message
        toast.success("Document deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle quiz deletion
  const handleDeleteQuiz = async (chapterId, quizId) => {
    try {
      // Show confirmation dialog
      const confirmed = window.confirm("Are you sure you want to delete this quiz? This action cannot be undone.");
      if (!confirmed) {
        return;
      }
      
      setLoading(true);
      
      // Delete the quiz via the Quiz API
      // Note: The Quiz controller will automatically delete any associated ChapterContent entries
      await axiosInstance.delete(`/quizzes/${quizId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Update UI
      const updatedChapters = [...chapters];
      const chapterIndex = updatedChapters.findIndex(ch => ch.id === chapterId);
      
      if (chapterIndex !== -1) {
        // Remove the quiz from the chapter's items
        updatedChapters[chapterIndex].items = updatedChapters[chapterIndex].items.filter(
          item => !(item.id === quizId && item.type === "quiz")
        );
        
        // Update state
        setChapters(updatedChapters);
        
        // Show success message
        toast.success("Quiz deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Failed to delete quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert File to base64 string for preview
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
      
      // Update the quiz status in the backend
      const response = await axiosInstance.put(
        `/quizzes/${quizId}`,
        { is_published: !currentStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Update UI
      const updatedChapters = [...chapters];
      const chapterIndex = updatedChapters.findIndex(ch => ch.id === chapterId);
      
      if (chapterIndex !== -1) {
        const quizIndex = updatedChapters[chapterIndex].items.findIndex(
          item => item.id === quizId && item.type === 'quiz'
        );
        
        if (quizIndex !== -1) {
          updatedChapters[chapterIndex].items[quizIndex].isPublished = !currentStatus;
          setChapters(updatedChapters);
          
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

  // Add a proper openEditVideoModal function
  const openEditVideoModal = (chapter, video) => {
    setSelectedChapter(chapter);
    setActiveChapter(chapter);
    setEditingVideo(video);
    setActiveVideo(video);
    setIsEditing(true);
    setVideoTitle(video.title || "");
    setVideoDescription(video.description || "");
    setEditingThumbnail(video.thumbnail || "");
    setSelectedFile(null);
    setUploadProgress(0);
    setShowVideoModal(true);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (thumbnailInputRed.current) {
      thumbnailInputRed.current.value = "";
    }
  };

  // Add the handleVideoSubmit function
  const handleVideoSubmit = async () => {
    // Validate required fields
    if (!videoTitle.trim()) {
      setUploadError("Video title is required");
      return;
    }

    if (!isEditing && !selectedFile) {
      setUploadError("Please select a video file");
      return;
    }

    setUploadError(null);
    setSubmitting(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      
      // Add video file if selected (for new upload or replacement)
      if (selectedFile) {
        formData.append("video", selectedFile);
      }
      
      // Add thumbnail if selected (as a file object, not base64)
      if (videoThumbnail && videoThumbnail instanceof File) {
        formData.append("thumbnail", videoThumbnail);
      } else if (thumbnailImage && typeof thumbnailImage === 'string' && thumbnailImage.startsWith('data:image')) {
        // If we have a base64 image, pass it as video_thumbnail in the body
        formData.append("video_thumbnail", thumbnailImage);
      }
      
      // Add basic video info with correct field names
      formData.append("video_title", videoTitle);
      formData.append("video_description", videoDescription || "");
      formData.append("chapter_id", selectedChapter.id);
      
      console.log("Uploading video with data:", {
        title: videoTitle,
        description: videoDescription,
        chapterId: selectedChapter.id,
        fileSelected: selectedFile ? selectedFile.name : "None",
        thumbnailProvided: !!videoThumbnail
      });

      let response;
      
      if (isEditing) {
        // Update existing video using our API helper
        response = await updateVideo(
          activeVideo.id, 
          formData, 
          (progress) => setUploadProgress(progress)
        );
        
        console.log("Video update response:", response);
        
        // Refresh chapters and videos after successful update
      await fetchChaptersAndVideos();
        
        toast.success("Video updated successfully!");
      } else {
        // Upload new video using our API helper
        response = await uploadVideo(
          formData,
          (progress) => setUploadProgress(progress)
        );
        
        console.log("Video upload response:", response);
        
        // Refresh chapters and videos after successful upload
        await fetchChaptersAndVideos();
        
        toast.success("Video uploaded successfully!");
      }
      
      // Close modal and reset form
      resetFormAndCloseModal();
      
    } catch (error) {
      console.error("Video upload error:", error);
      
      // Extract error message from response or error object
      let errorMessage = "An error occurred during video upload. Please try again.";
      
      if (error.response) {
        // The request was made and the server responded with a status code
        errorMessage = error.response.data?.message || errorMessage;
        console.error("Server error response:", error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
        errorMessage = "The server did not respond. This could be due to network issues or a timeout.";
      } else {
        // Something happened in setting up the request
        console.error("Error message:", error.message);
        errorMessage = error.message || errorMessage;
      }
      
      setUploadError(errorMessage);
    } finally {
      setSubmitting(false);
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
                                      disabled={videoLoading || documentLoading}
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
                                                            : item.type === 'document'
                                                            ? openEditDocumentModal(chapter, item)
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
              {uploadError && (
                <Alert variant="danger" className="mb-3">
                  {uploadError}
                </Alert>
              )}
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
                      disabled={submitting}
                      style={{ 
                        borderRadius: "8px",
                        padding: "12px",
                        borderColor: "#ced4da"
                      }}
        />
      </Form.Group>
      <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: "500" }}>
                      Video Description
                    </Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          placeholder="Enter Video Description"
          value={videoDescription}
          onChange={(e) => setVideoDescription(e.target.value)}
                      disabled={submitting}
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
                      {thumbnailImage ? (
                        <img 
                          src={thumbnailImage} 
                          alt="Video Thumbnail" 
                          style={{ maxWidth: "100%", maxHeight: "148px", objectFit: "contain" }} 
                        />
                      ) : editingVideo?.thumbnail ? (
                        <img 
                          src={editingVideo.thumbnail} 
                          alt="Current Thumbnail" 
                          style={{ maxWidth: "100%", maxHeight: "148px", objectFit: "contain" }} 
                        />
                      ) : editingThumbnail ? (
                        <img 
                          src={editingThumbnail} 
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
          ref={thumbnailInputRed}
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              // Create a preview for the UI
              const reader = new FileReader();
              reader.onloadend = () => {
                setVideoThumbnail(file); // Store the actual file object for FormData
                setThumbnailImage(reader.result); // Store base64 for preview only
              };
              reader.readAsDataURL(file);
            }
          }}
          disabled={submitting}
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
                  {isEditing ? "Replace Video (optional)" : "Upload Video"}
                  {!isEditing && <span className="text-danger">*</span>}
                </Form.Label>
        <Form.Control
                  ref={fileInputRef}
          type="file"
                  accept="video/*"
          onChange={(e) => {
            const file = e.target.files[0];
                    setSelectedFile(file);
                    
                    // Log file info for debugging
            if (file) {
                      console.log("Selected file:", {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        lastModified: new Date(file.lastModified).toISOString()
                      });
                    }
                  }}
                  disabled={submitting}
                  style={{ 
                    borderRadius: "8px",
                    padding: "10px",
                    borderColor: "#ced4da"
                  }}
                />
        <Form.Text className="text-muted">
                  {isEditing ? "Leave empty to keep the current video." : "Supported formats: MP4, WebM, MOV (max 500MB)"}
        </Form.Text>
        
        {/* Direct upload button for debugging */}
        {process.env.NODE_ENV === 'development' && selectedFile && (
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={async () => {
              try {
                // Create a simple FormData with just the video
                const debugFormData = new FormData();
                debugFormData.append("video", selectedFile);
                debugFormData.append("video_title", "Debug Upload");
                debugFormData.append("chapter_id", selectedChapter.id);
                
                // Log what we're sending
                console.log("Debug form data:", {
                  video: selectedFile.name,
                  video_title: "Debug Upload",
                  chapter_id: selectedChapter.id
                });
                
                // Direct upload attempt
                const response = await fetch(`http://localhost:5000/api/courses/video`, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                  body: debugFormData
                });
                
                const result = await response.json();
                console.log("Direct upload result:", result);
                
                if (response.ok) {
                  toast.success("Debug upload successful!");
                  // Refresh data
                  await fetchChaptersAndVideos();
                } else {
                  toast.error(`Upload failed: ${result.message || 'Unknown error'}`);
                }
              } catch (error) {
                console.error("Error in direct upload:", error);
                alert(`Direct upload error: ${error.message}`);
              }
            }}
          >
            Debug Direct Upload
          </Button>
        )}
      </Form.Group>

      {/* Upload Progress */}
              {(submitting || uploadProgress > 0) && selectedFile && (
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
              disabled={submitting}
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
              disabled={submitting || (isEditing ? false : !selectedFile) || !videoTitle.trim()}
              style={{ 
                borderRadius: "50px",
                padding: "8px 20px",
                background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
                border: 'none'
              }}
            >
              {submitting ? (
        <>
          <FaSpinner className="me-2 fa-spin" />
                  {isEditing ? "Updating..." : "Uploading..."}
        </>
      ) : (
                <>
                  {isEditing ? "Update Video" : "Add Video"}
                </>
      )}
    </Button>
  </Modal.Footer>
</Modal>

        {/* Document Modal */}
        <Modal 
          show={showDocumentModal} 
          onHide={() => !submitting && handleCancelAndReturn('document')} 
          centered 
          backdrop="static"
          size="lg"
        >
          <Modal.Header 
            closeButton={!submitting}
            style={{ background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}
          >
            <Modal.Title style={{ fontWeight: "600", color: '#0062E6' }}>
              {isEditing ? `Edit Document: ${activeDocument?.title || ""}` : "Add New Document"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: "500" }}>
                  Document Title <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter Document Title"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  disabled={submitting}
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
                  Document File {!isEditing && <span className="text-danger">*</span>}
                  {isEditing && <span className="text-muted ms-2">(Leave empty to keep current file)</span>}
                </Form.Label>
                <Form.Control
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSelectedDocument(e.target.files[0])}
                  disabled={submitting}
                  ref={documentInputRef}
                  required={!isEditing}
                  style={{ 
                    borderRadius: "8px",
                    padding: "12px",
                    borderColor: "#ced4da"
                  }}
                />
                <Form.Text className="text-muted">
                  Only PDF files are accepted.
                </Form.Text>
              </Form.Group>
              {uploadError && (
                <Alert variant="danger" className="mt-3">
                  {uploadError}
                </Alert>
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer style={{ background: '#f8f9fa', borderTop: '1px solid #e9ecef' }}>
            <Button 
              variant="secondary" 
              onClick={() => handleCancelAndReturn('document')}
              disabled={submitting}
              style={{ 
                borderRadius: "8px",
                padding: "8px 16px"
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleDocumentSubmit}
              disabled={submitting}
              style={{ 
                borderRadius: "8px",
                padding: "8px 16px",
                backgroundColor: '#0062E6',
                borderColor: '#0062E6'
              }}
            >
              {submitting ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  {isEditing ? "Updating..." : "Uploading..."}
                </>
              ) : (
                isEditing ? "Update Document" : "Upload Document"
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Quiz Modal */}
        <Modal 
          show={showQuizModal} 
          onHide={() => setShowQuizModal(false)} 
          centered 
          backdrop="static"
          size="lg"
        >
          <Modal.Header 
            closeButton
            style={{ background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}
          >
            <Modal.Title style={{ fontWeight: "600", color: '#0062E6' }}>
              Add Quiz 
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
              style={{ 
                borderRadius: "50px",
                padding: "8px 16px",
              }}
            >
              <FaArrowLeft className="me-2" /> Back
            </Button>
            <Button 
              variant="primary" 
              onClick={handleOpenQuizEditor} 
              disabled={!quizTitle.trim()}
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
                    <h6 className="mb-0">Quiz</h6>
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
