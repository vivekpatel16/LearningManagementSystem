import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaTrash, FaSave, FaPlus, FaEdit } from "react-icons/fa";
import { Button, Form, Container, Row, Col, Card, Modal } from "react-bootstrap";
import Courses_API from "../../Api/courseApi";

const VideoManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { chapter_id, chapter_title } = location.state || {};
  const [videos, setVideos] = useState([]);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editVideo, setEditVideo] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedFile, setEditedFile] = useState(null);

  useEffect(() => {
    if (chapter_id) {
      Courses_API.get(`/video/${chapter_id}`)
        .then((response) => setVideos(response.data))
        .catch((error) => console.error("Error fetching videos:", error));
    }
  }, [chapter_id]);

  const handleAddVideo = async () => {
    if (!videoTitle.trim() || !videoDescription.trim() || !selectedFile) {
      alert("Please enter a title, description, and select a video file.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("video", selectedFile);
      formData.append("video_title", videoTitle);
      formData.append("video_description", videoDescription);
      formData.append("chapter_id", chapter_id);

      const response = await Courses_API.post("/video", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data && response.data.video) {
        setVideos([...videos, response.data.video]);
      }

      setVideoTitle("");
      setVideoDescription("");
      setSelectedFile(null);
    } catch (error) {
      console.error("Error adding video:", error);
      alert("Failed to upload video");
    }
  };

  const handleDeleteVideo = async (id) => {
    try {
      await Courses_API.delete(`/video/${id}`);
      setVideos(videos.filter((video) => video._id !== id));
    } catch (error) {
      console.error("Error deleting video:", error);
    }
  };

  const handleEditClick = (video) => {
    setEditVideo(video);
    setEditedTitle(video.video_title);
    setEditedDescription(video.video_description);
    setEditedFile(null);
    setShowEditModal(true);
  };

  const handleUpdateVideo = async () => {
    if (!editVideo || !editedTitle.trim() || !editedDescription.trim()) {
      alert("Title and description cannot be empty.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("video_title", editedTitle);
      formData.append("video_description", editedDescription);
      if (editedFile) {
        formData.append("video", editedFile);
      }

      await Courses_API.patch(`/video/${editVideo._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setVideos(
        videos.map((video) =>
          video._id === editVideo._id
            ? { ...video, video_title: editedTitle, video_description: editedDescription }
            : video
        )
      );

      setShowEditModal(false);
      setEditVideo(null);
      alert("Changes have been updated successfully!");
    } catch (error) {
      console.error("Error updating video:", error);
      alert("Failed to update video.");
    }
  };

  return (
    <Container className="mt-4">
      <h2>Video Management for {chapter_title || "Unknown Chapter"}</h2>
      <Card className="p-3 mb-4">
        <h4>Add a New Video</h4>
        <Form>
          <Form.Group className="mb-2">
            <Form.Control type="text" placeholder="Enter Video Title" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Control as="textarea" rows={2} placeholder="Enter Video Description" value={videoDescription} onChange={(e) => setVideoDescription(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Control type="file" accept="video/*" onChange={(e) => setSelectedFile(e.target.files[0])} />
          </Form.Group>
          <Button variant="success" onClick={handleAddVideo}><FaPlus /> Add Video</Button>
        </Form>
      </Card>

      <h3>Video List</h3>
      {videos.length > 0 ? (
        videos.map((video, index) => (
          <Card key={video._id} className="p-3 mb-3">
            <Row className="align-items-center">
              <Col>
                <h5>Video {index + 1}: {video.video_title}</h5>
                <p>{video.video_description}</p>
              </Col>
              <Col className="text-end">
                <Button variant="primary" className="me-2" onClick={() => handleEditClick(video)}><FaEdit /> Edit</Button>
                <Button variant="danger" onClick={() => handleDeleteVideo(video._id)}><FaTrash /> Delete</Button>
              </Col>
            </Row>
          </Card>
        ))
      ) : (
        <p className="text-muted">No videos added yet.</p>
      )}

      <Button className="mt-3" variant="primary" onClick={() => navigate(-1)}><FaSave /> Save Videos</Button>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Video</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-2">
            <Form.Control type="text" placeholder="Enter Video Title" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Control as="textarea" rows={2} placeholder="Enter Video Description" value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Control type="file" accept="video/*" onChange={(e) => setEditedFile(e.target.files[0])} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleUpdateVideo}>Update</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default VideoManagement;


