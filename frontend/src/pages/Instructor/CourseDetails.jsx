import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FaVideo, FaFileAlt, FaGripLines, FaEdit, FaTrash, FaPlus, FaSpinner, FaArrowLeft } from "react-icons/fa";
import { Accordion, Button, ListGroup, Card, Spinner, Modal, Form, Alert, Container, Row, Col } from "react-bootstrap";
import Courses_API from "../../Api/courseApi";

const CourseDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState(location.state?.course || {});
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openChapters, setOpenChapters] = useState([]);
  const [error, setError] = useState(null);
  
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

  // Fetch chapters and videos when component mounts or when navigating back to this page
  useEffect(() => {
    if (course && course._id) {
      fetchChaptersAndVideos();
    } else {
      setLoading(false);
    }
  }, [course, location.key]);

  const fetchChaptersAndVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch chapters
      const chaptersResponse = await Courses_API.get(`/chapter/${course._id}`);
      const chaptersData = chaptersResponse.data;

      console.log("Fetched chapters:", chaptersData);

      // For each chapter, fetch its videos
      const chaptersWithVideos = await Promise.all(
        chaptersData.map(async (chapter) => {
          try {
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
              thumbnail:video.video_thumbnail
            }));
            
            return {
              id: chapter._id,
              title: chapter.chapter_title,
              description: chapter.chapter_description,
              order: chapter.order,
              items: formattedVideos.sort((a, b) => a.order - b.order),
              
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
      setChapters(chaptersWithVideos.sort((a, b) => a.order - b.order));
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
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";

  };

  const openEditVideoModal = (chapter, video) => {
    setSelectedChapter(chapter);
    setEditingVideo(video);
    setVideoTitle(video.title);
    setVideoDescription(video.description);
    setEditingThumbnail(video.thumbnail);
    setSelectedFile(null);
    setUploadProgress(0);
    setShowVideoModal(true);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if(thumbnail.current)
    { thumbnail.current.value="";    }
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

    if(!editingThumbnail && !selectedFile)
    {
      alert("Please select a video Thumbnail");
      return;
    }

    try {
      setVideoLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append("video_title", videoTitle);
      formData.append("video_description", videoDescription);
      formData.append("video_thumbnail",videoThumbnail);
      
      
      if (selectedFile) {
        formData.append("video", selectedFile);
      }
      
      if (videoThumbnail && videoThumbnail instanceof File) {  
        formData.append("video_thumbnail", videoThumbnail); // Upload the file, not URL
    }

    let response;
      if (editingVideo) {
        // Update existing video
        response = await Courses_API.patch(`/video/${editingVideo.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        });
        
        console.log("Video updated successfully:", response.data);
        
        // Refresh data from server to ensure we have the latest
        await fetchChaptersAndVideos();
      } else {
        // Add new video
        formData.append("chapter_id", selectedChapter.id);
        
         response = await Courses_API.post("/video", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        });
        
        if(response.data)
        {
          console.log("Video created successfully:", response.data);
        
        // Refresh data from server to ensure we have the latest
        await fetchChaptersAndVideos();
        }
        
        // Make sure the chapter is open to see the new video
        if (!openChapters.includes(selectedChapter.id)) {
          setOpenChapters(prev => [...prev, selectedChapter.id]);
        }
      }

      // Reset form and close modal
      setVideoTitle("");
      setVideoDescription("");
      setSelectedFile(null);
      setEditingThumbnail(null);
      setEditingVideo(null);
      setSelectedChapter(null);
      setShowVideoModal(false);
      setUploadProgress(0);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if(thumbnailInputRed.current)thumbnailInputRed.current.value="";
      // await fetchChaptersAndVideos
    } catch (error) {
      console.error("Error saving video:", error);
      
      // More detailed error logging
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      
      setError("Failed to save video. Please try again.");
      alert(error.response?.data?.message || error.message || "An error occurred.");
    } finally {
      setVideoLoading(false);
    }
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col xs={12}>
          <Button 
            variant="outline-secondary" 
            className="mb-3"
            onClick={handleBackToMyCourses}
            style={{ width: 'fit-content' }}
          >
            <FaArrowLeft className="me-2" /> Back to My Courses
          </Button>
          <div className="d-flex justify-content-between align-items-center">
            <h2>{course.title || "Course Details"}</h2>
            <Button 
              variant="primary" 
              onClick={openAddChapterModal}
              disabled={chapterLoading}
            >
              {chapterLoading ? (
                <>
                  <FaSpinner className="me-2 fa-spin" />
                  Processing...
                </>
              ) : (
                "+ Add Chapter"
              )}
        </Button>
      </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-3" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {chapters.length === 0 ? (
        <div className="alert alert-info">
          No chapters found for this course. Click the "Add Chapter" button to create your first chapter.
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="chapters" type="chapter">
            {(provided) => (
              <Accordion activeKey={openChapters} ref={provided.innerRef} {...provided.droppableProps}>
                {chapters.map((chapter, chapterIndex) => (
                  <Draggable key={chapter.id} draggableId={chapter.id} index={chapterIndex}>
                    {(provided) => (
                      <Card ref={provided.innerRef} {...provided.draggableProps} className="mb-2">
                        <Accordion.Item eventKey={chapter.id}>
                          <Accordion.Header onClick={() => toggleChapter(chapter.id)}>
                            <div className="d-flex align-items-center w-100">
                              <span {...provided.dragHandleProps} className="me-2">
                                <FaGripLines className="text-muted" />
                              </span>
                              <span className="flex-grow-1">{chapter.title || "Untitled Chapter"}</span>
                              <div className="d-flex me-4" onClick={(e) => e.stopPropagation()}>
                                <Button 
                                  variant="outline-secondary" 
                                  size="sm" 
                                  className="me-2"
                                  onClick={() => openEditChapterModal(chapter)}
                                  disabled={chapterLoading}
                                >
                                  <FaEdit />
                                </Button>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => handleDeleteChapter(chapter.id)}
                                  disabled={chapterLoading}
                                >
                                  <FaTrash />
                                </Button>
                              </div>
                            </div>
                          </Accordion.Header>
                          <Accordion.Body>
                            <div className="mb-2">
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => openAddVideoModal(chapter)}
                                disabled={videoLoading}
                              >
                                {videoLoading ? (
                                  <>
                                    <FaSpinner className="me-1 fa-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  "+ Add Video"
                                )}
                              </Button>
                            </div>
                            <Droppable droppableId={chapter.id} type="items">
                              {(provided) => (
                                <ListGroup ref={provided.innerRef} {...provided.droppableProps}>
                                  {chapter.items.length === 0 ? (
                                    <div className="text-muted py-2">No videos in this chapter yet.</div>
                                  ) : (
                                    chapter.items.map((item, itemIndex) => (
                                      <Draggable key={item.id} draggableId={item.id} index={itemIndex}>
                                        {(provided) => (
                                          <ListGroup.Item
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className="d-flex justify-content-between align-items-center"
                                          >
                                            <div className="d-flex align-items-center">
                                              <FaGripLines className="me-2 text-muted" />
                                              {item.type === "video" ? (
                                                <FaVideo className="me-2 text-primary" />
                                              ) : (
                                                <FaFileAlt className="me-2 text-warning" />
                                              )}
                                              {item.title}
                                            </div>
                                            <div>
                                              <Button 
                                                variant="outline-secondary" 
                                                size="sm" 
                                                className="me-2"
                                                onClick={() => openEditVideoModal(chapter, item)}
                                                disabled={videoLoading}
                                              >
                                                <FaEdit />
                                              </Button>
                                              <Button 
                                                variant="outline-danger" 
                                                size="sm"
                                                onClick={() => handleDeleteVideo(chapter.id, item.id)}
                                                disabled={videoLoading}
                                              >
                                                <FaTrash />
                                              </Button>
                                            </div>
                                          </ListGroup.Item>
                                        )}
                                      </Draggable>
                                    ))
                                  )}
                                  {provided.placeholder}
                                </ListGroup>
                              )}
                            </Droppable>
                          </Accordion.Body>
                        </Accordion.Item>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Accordion>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Chapter Modal */}
      <Modal 
        show={showChapterModal} 
        onHide={() => !chapterLoading && setShowChapterModal(false)} 
        centered 
        backdrop="static"
      >
        <Modal.Header closeButton={!chapterLoading}>
          <Modal.Title>
            {editingChapter ? `Edit Chapter: ${editingChapter.title || ""}` : "Add New Chapter"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Chapter Title <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter Chapter Title"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                disabled={chapterLoading}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Chapter Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter Chapter Description"
                value={chapterDescription}
                onChange={(e) => setChapterDescription(e.target.value)}
                disabled={chapterLoading}
              />
            </Form.Group>
            {editingChapter && (
              <input type="hidden" value={editingChapter.id} />
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowChapterModal(false)}
            disabled={chapterLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleChapterSubmit}
            disabled={chapterLoading || !chapterTitle.trim()}
          >
            {chapterLoading ? (
              <>
                <FaSpinner className="me-2 fa-spin" />
                {editingChapter ? "Updating..." : "Adding..."}
              </>
            ) : (
              editingChapter ? "Update Chapter" : "Add Chapter"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Video Modal */}
<Modal show={showVideoModal} onHide={() => !videoLoading && setShowVideoModal(false)} centered backdrop="static">
  <Modal.Header closeButton={!videoLoading}>
    <Modal.Title>{editingVideo ? "Edit Video" : "Add New Video"}</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Form>
      <Form.Group className="mb-3">
        <Form.Label>Video Title</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter Video Title"
          value={videoTitle}
          onChange={(e) => setVideoTitle(e.target.value)}
          disabled={videoLoading}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Video Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          placeholder="Enter Video Description"
          value={videoDescription}
          onChange={(e) => setVideoDescription(e.target.value)}
          disabled={videoLoading}
        />
      </Form.Group>
      
      {/* Video Upload */}
      <Form.Group className="mb-3">
        <Form.Label>{editingVideo ? "Replace Video (optional)" : "Upload Video"}</Form.Label>
        <Form.Control
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          disabled={videoLoading}
        />
        {editingVideo && (
          <Form.Text className="text-muted">
            Leave empty to keep the current video.
          </Form.Text>
        )}
      </Form.Group>

      {/* Video Thumbnail Upload */}
      <Form.Group className="mb-3">
        <Form.Label>{editingThumbnail ? "Replace Thumbnail (optional)" : "Upload Thumbnail"}</Form.Label>
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
          }
          }
          disabled={videoLoading}
        />
        {videoThumbnail && (
          <div className="mt-2">
            <img src={videoThumbnail} alt="Video Thumbnail" style={{ width: "100%", maxHeight: "200px", objectFit: "contain" }} />
          </div>
        )}
         {!videoThumbnail && editingVideo?.thumbnail_url && (
          <div className="mt-2">
            <img src={editingVideo.thumbnail_url} alt="Current Thumbnail" style={{ width: "100%", maxHeight: "200px", objectFit: "contain" }} />
          </div>
        )}
        <Form.Text className="text-muted">
        {editingVideo ? "Leave empty to keep the current thumbnail." : "Upload a new thumbnail for the video."}
        </Form.Text>
      </Form.Group>

      {/* Upload Progress */}
      {videoLoading && (
        <div className="mt-3">
          <div className="d-flex justify-content-between mb-1">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="progress">
            <div 
              className="progress-bar progress-bar-striped progress-bar-animated" 
              role="progressbar" 
              style={{ width: `${uploadProgress}%` }} 
              aria-valuenow={uploadProgress} 
              aria-valuemin="0" 
              aria-valuemax="100"
            ></div>
          </div>
        </div>
      )}
    </Form>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowVideoModal(false)} disabled={videoLoading}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleVideoSubmit} disabled={videoLoading}>
      {videoLoading ? (
        <>
          <FaSpinner className="me-2 fa-spin" />
          {editingVideo ? "Updating..." : "Adding..."}
        </>
      ) : (
        editingVideo ? "Update Video" : "Add Video"
      )}
    </Button>
  </Modal.Footer>
</Modal>

    </Container>
  );
};

export default CourseDetail;