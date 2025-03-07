import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaPlus, FaEdit, FaTrash, FaSave } from "react-icons/fa";
import { Button, Modal, Form, Container, Row, Col, Card } from "react-bootstrap";
import Courses_API from "../../Api/courseApi";

const ChapterManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState(location.state?.course || {});
  const [chapters, setChapters] = useState([]);
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterDescription, setChapterDescription] = useState("");
  const [editingChapter, setEditingChapter] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!location.state?.course) {
      alert("No course data found. Redirecting...");
      navigate("/instructor/courses");
    } else {
      setCourse(location.state.course);
      fetchChapters();
    }
  }, [location.state, navigate]);

  const fetchChapters = async () => {
    try {
      const response = await Courses_API.get(`chapter/${course._id}`);
      setChapters(response.data);
    } catch (error) {
      console.error("Error fetching chapters:", error);
    }
  };
  const handleAddChapter = async () => {
    if (!chapterTitle.trim()) {
      alert("Chapter title is required!");
      return;
    }

    const chapterData = {
      chapter_title: chapterTitle,
      chapter_description: chapterDescription,
      course_id: course._id,
    };

    try {
      await Courses_API.post(`/chapter`,chapterData);

      setChapterTitle("");
      setChapterDescription("");
      fetchChapters();
    } catch (error) {
      console.error("Error saving chapter:", error);
      alert(error.response?.data?.message || "An error occurred.");
    }
  };

  const handleDeleteChapter = async (id) => {
    if (!id) {
      console.error("Error: Chapter ID is undefined");
      alert("Invalid chapter ID. Cannot delete.");
      return;
    }
    try {
      await Courses_API.delete(`/chapter/${id}`);

      setChapters(chapters.filter((ch) => ch._id !== id));
    } catch (error) {
      console.error("Error deleting chapter:", error);
      alert("Failed to delete chapter. Please try again.");
    }
  };

  const handleEditChapter = (chapter) => {
    setEditingChapter(chapter);
    setShowModal(true);
  };

  const handleUpdateChapter = async () => {
    if (!editingChapter) return;

    const updatedChapter = {
      chapter_title: editingChapter.chapter_title,
      chapter_description: editingChapter.chapter_description,
    };

    try {
      await Courses_API.patch(`chapter/${editingChapter._id}`,updatedChapter);

      setChapters(
        chapters.map((ch) =>
          ch._id === editingChapter._id ? { ...ch, ...updatedChapter } : ch
        )
      );
      setShowModal(false);
      setEditingChapter(null);
    } catch (error) {
      console.error("Error updating chapter:", error);
      alert("Failed to update chapter.");
    }
  };
  return (
    <Container className="mt-4">
      <h2>Chapters Management for {course.title || "Untitled Course"}</h2>
      <Card className="p-3 mb-4">
        <h4>Add a New Chapter</h4>
        <Form>
          <Form.Group className="mb-2">
            <Form.Control
              type="text"
              placeholder="Enter Chapter Title"
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Control
              as="textarea"
              placeholder="Enter Chapter Description"
              value={chapterDescription}
              onChange={(e) => setChapterDescription(e.target.value)}
            />
          </Form.Group>
          <Button variant="success" onClick={handleAddChapter}>
            <FaPlus /> Add Chapter
          </Button>
        </Form>
      </Card>

      <h3>Chapter List</h3>
      {chapters.length > 0 ? (
        chapters.map((chapter, index) => (
          <Card key={chapter._id} className="p-3 mb-3">
            <Row className="align-items-center">
              <Col>
                <h5>Chapter {index + 1}: {chapter.chapter_title}</h5>
                <p className="text-muted">{chapter.chapter_description}</p>
              </Col>
              <Col className="text-end">
                <Button variant="secondary" className="me-2" onClick={() => handleEditChapter(chapter)}>
                  <FaEdit /> Edit
                </Button>
                <Button
                  variant="primary"
                  className="me-2"
                  onClick={() => navigate("/instructor/courses/add-videos", { state: { chapter_id: chapter._id , chapter_title:chapter.chapter_title } })}
                >
                  <FaEdit /> Add/Edit Video
                </Button>
                <Button variant="danger" onClick={() => handleDeleteChapter(chapter._id)}>
                  <FaTrash /> Delete
                </Button>
              </Col>
            </Row>
          </Card>
        ))
      ) : (
        <p>No chapters added yet.</p>
      )}
      <Button className="mt-3" variant="primary" onClick={() => navigate("/instructor/mycourses",{ state: { newCourse: course }})}>
        <FaSave /> Save Course
      </Button>

      {/* Bootstrap Modal for Editing Chapters */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Chapter</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Control
                type="text"
                placeholder="Enter Chapter Title"
                value={editingChapter?.chapter_title || ""}
                onChange={(e) =>
                  setEditingChapter({ ...editingChapter, chapter_title: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Control
                as="textarea"
                placeholder="Enter Chapter Description"
                value={editingChapter?.chapter_description || ""}
                onChange={(e) =>
                  setEditingChapter({ ...editingChapter, chapter_description: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="success" onClick={handleUpdateChapter}>
            <FaSave /> Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ChapterManagement;


