import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FaVideo, FaFileAlt, FaGripLines, FaPlus } from "react-icons/fa";
import { Accordion, Button, ListGroup, Card, Spinner } from "react-bootstrap";
import Courses_API from "../../Api/courseApi";

const CourseDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState(location.state?.course || {});
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openChapters, setOpenChapters] = useState([]);

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
      // Fetch chapters
      const chaptersResponse = await Courses_API.get(`/chapter/${course._id}`);
      const chaptersData = chaptersResponse.data;

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
              order: video.order
            }));

            return {
              id: chapter._id,
              title: chapter.chapter_title,
              description: chapter.chapter_description,
              order: chapter.order,
              items: formattedVideos.sort((a, b) => a.order - b.order)
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
      setLoading(false);
    } catch (error) {
      console.error("Error fetching chapters:", error);
      setLoading(false);
    }
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

  // Function to handle navigation to add video page
  const handleAddVideo = (chapter) => {
    navigate("/instructor/courses/add-videos", {
      state: {
        chapter_id: chapter.id,
        chapter_title: chapter.title
      }
    });
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
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Course Details</h2>
        <Button
          variant="primary"
          onClick={() => navigate("/instructor/courses/add-chapter", { state: { course: course } })}
          style={{ display: "flex", alignItems: "center", gap: "5px" }}
        >
          <FaPlus /> Add Chapter
        </Button>

      </div>

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
                            <div className="d-flex align-items-center">
                              <span {...provided.dragHandleProps} className="me-2">
                                <FaGripLines className="text-muted" />
                              </span>
                              {chapter.title}
                            </div>
                          </Accordion.Header>
                          <Accordion.Body>
                            <div className="mb-2">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleAddVideo(chapter)}
                              >
                                + Add Video
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
    </div>
  );
};

export default CourseDetail;