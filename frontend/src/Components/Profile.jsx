import React, { useState, useRef } from "react";
import { Container, Row, Col, Card, Button, Modal, Form, Alert } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { logout, updateUser } from "../features/auth/authSlice";
import { PencilSquare } from "react-bootstrap-icons";
import axios from "axios";
import defaultProfilePic from "../assets/th.png";

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [profilePic, setProfilePic] = useState(user?.user_image || defaultProfilePic);
  const [formData, setFormData] = useState({
    user_name: user?.user_name || "",
    password: "",
    confirmPassword: "",
  });
  const [alertMessage, setAlertMessage] = useState(null);
  const fileInputRef = useRef(null);

  const handleEditImage = () => fileInputRef.current.click();

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.patch(
            "http://localhost:5000/api/users/profile",
            { user_image: reader.result },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          dispatch(updateUser(response.data.user));
          localStorage.setItem("user", JSON.stringify(response.data.user));
          setProfilePic(reader.result);
          setAlertMessage("Profile picture updated!");
          setTimeout(() => setAlertMessage(null), 3000);
        } catch (error) {
          console.error("Error updating image:", error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        "http://localhost:5000/api/users/delete-image",
        { userId: user._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedUser = { ...user, user_image: "" };
      dispatch(updateUser(updatedUser));
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setProfilePic(defaultProfilePic);
      setAlertMessage("Profile picture removed!");
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    if (formData.password && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
      const updateData = { user_name: formData.user_name };
      if (formData.password) updateData.password = formData.password;
  
      const response = await axios.patch(
        "http://localhost:5000/api/users/profile",
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      dispatch(updateUser(response.data.user));
      localStorage.setItem("user", JSON.stringify(response.data.user));
  
      setAlertMessage("Profile updated successfully!");
      setTimeout(() => setAlertMessage(null), 3000);
      setShowProfileEdit(false); // Close the modal after saving
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };
  

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6}>
          {alertMessage && <Alert variant="success">{alertMessage}</Alert>}
          <Card className="shadow-lg p-3 mb-5 bg-white rounded">
            <Card.Body className="text-center">
              <div style={{ position: "relative", display: "inline-block" }}>
                <img
                  src={profilePic}
                  alt="Profile"
                  className="rounded-circle mb-3"
                  width="100"
                  height="100"
                  onClick={() => setShowImagePreview(true)}
                  style={{ cursor: "pointer" }}
                />
                <PencilSquare
                  className="position-absolute bottom-0 end-0 bg-white p-1 rounded-circle"
                  size={20}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditPopup(true);
                  }}
                />
              </div>
              <h4>{user?.user_name}</h4>
              <p className="text-muted">{user?.role}</p>
              <p>Email: {user?.email}</p>
              <Button variant="primary" className="m-2" onClick={() => setShowProfileEdit(true)}>
                Edit Profile
              </Button>
              <Button variant="danger" className="m-2" onClick={() => dispatch(logout())}>
                Logout
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showImagePreview} onHide={() => setShowImagePreview(false)} centered>
        <Modal.Body className="text-center">
          <img src={profilePic} alt="Profile" className="img-fluid rounded" />
        </Modal.Body>
      </Modal>

      <Modal show={showEditPopup} onHide={() => setShowEditPopup(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Update Profile Picture</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <img src={profilePic} alt="Profile" className="img-fluid rounded mb-3" width="150" />
          <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleImageChange} />
          <div className="d-flex justify-content-center">
            <Button variant="primary" className="m-2" onClick={handleEditImage}>Edit Image</Button>
            <Button variant="danger" className="m-2" onClick={handleDeleteImage}>Delete Image</Button>
          </div>
        </Modal.Body>
      </Modal>

      <Modal show={showProfileEdit} onHide={() => setShowProfileEdit(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" name="user_name" value={formData.user_name} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" name="password" value={formData.password} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} />
            </Form.Group>
            <Button variant="primary" className="w-100" onClick={handleSaveProfile}>Save Changes</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Profile;
