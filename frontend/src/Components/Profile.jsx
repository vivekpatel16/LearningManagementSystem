import React, { useState, useRef } from "react";
import { Container, Row, Col, Card, Button, Modal, Form, Alert } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { logout, updateUser } from "../features/auth/authSlice";
import { FaEdit, FaCamera, FaTrash, FaSignOutAlt, FaUser } from "react-icons/fa";
import axiosInstance from "../Api/axiosInstance";
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
          const response = await axiosInstance.patch(
            "/users/profile",
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
      await axiosInstance.patch(
        "/users/delete-image",
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
  
      const response = await axiosInstance.patch(
        "/users/profile",
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
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col xs={12} md={8} lg={6}>
          {alertMessage && (
            <Alert 
              variant="success" 
              className="d-flex align-items-center shadow-sm border-0 mb-4"
              style={{ 
                background: 'rgba(0, 98, 230, 0.1)', 
                color: '#0062E6',
                borderRadius: '10px'
              }}
            >
              {alertMessage}
            </Alert>
          )}
          
          <Card 
            className="border-0 shadow-lg overflow-hidden"
            style={{ borderRadius: '15px' }}
          >
            <div 
              className="text-white py-4 px-4 text-center"
              style={{ 
                background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
                borderTopLeftRadius: '15px',
                borderTopRightRadius: '15px'
              }}
            >
              <div className="position-relative d-inline-block">
                <img
                  src={profilePic}
                  alt="Profile"
                  className="rounded-circle border border-3 border-white shadow"
                  width="120"
                  height="120"
                  onClick={() => setShowImagePreview(true)}
                  style={{ 
                    cursor: "pointer",
                    objectFit: "cover"
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultProfilePic;
                  }}
                />
                <div
                  className="position-absolute bottom-0 end-0 bg-white rounded-circle shadow d-flex justify-content-center align-items-center"
                  style={{ 
                    width: "35px", 
                    height: "35px", 
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditPopup(true);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <FaCamera style={{ color: "#0062E6" }} />
                </div>
              </div>
              <h3 className="mt-3 mb-1 fw-bold">{user?.user_name || "User"}</h3>
              <p className="mb-0" style={{ opacity: "0.9" }}>
                {user?.role === "user" ? "Learner" : user?.role || "User"}
              </p>
            </div>
            
            <Card.Body className="p-4">
              <div className="profile-info">
                <div className="mb-4">
                  <h5 className="text-secondary mb-3 border-bottom pb-2">Account Information</h5>
                  <Row className="mb-3">
                    <Col xs={4} className="text-muted">Email:</Col>
                    <Col xs={8} className="text-dark fw-medium">{user?.email || "Not provided"}</Col>
                  </Row>
                  <Row className="mb-3">
                    <Col xs={4} className="text-muted">Role:</Col>
                    <Col xs={8} className="text-dark fw-medium">
                      <span 
                        className="badge"
                        style={{ 
                          background: 'rgba(0, 98, 230, 0.1)', 
                          color: '#0062E6',
                          fontSize: '0.85rem',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '30px'
                        }}
                      >
                        {user?.role === "user" ? "Learner" : user?.role || "User"}
                      </span>
                    </Col>
                  </Row>
                </div>
              </div>
              
              <div className="d-grid gap-2 d-md-flex mt-4">
                <Button 
                  className="flex-grow-1 d-flex align-items-center justify-content-center"
                  onClick={() => setShowProfileEdit(true)}
                  style={{ 
                    background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '10px 15px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 6px rgba(0, 98, 230, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 10px rgba(0, 98, 230, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 98, 230, 0.2)";
                  }}
                >
                  <FaEdit className="me-2" /> Edit Profile
                </Button>
                <Button 
                  variant="outline-danger"
                  className="flex-grow-1 d-flex align-items-center justify-content-center"
                  onClick={() => dispatch(logout())}
                  style={{ 
                    borderRadius: '50px',
                    padding: '10px 15px',
                    transition: 'all 0.3s ease',
                    borderColor: '#dc3545',
                    color: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.05)';
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <FaSignOutAlt className="me-2" /> Logout
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Image Preview Modal */}
      <Modal 
        show={showImagePreview} 
        onHide={() => setShowImagePreview(false)} 
        centered
        size="sm"
      >
        <Modal.Body className="p-0">
          <img 
            src={profilePic} 
            alt="Profile" 
            className="img-fluid w-100" 
            style={{ borderRadius: '4px' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = defaultProfilePic;
            }}
          />
        </Modal.Body>
        <Modal.Footer className="border-0 justify-content-center p-3">
          <Button 
            variant="secondary" 
            onClick={() => setShowImagePreview(false)}
            style={{ borderRadius: '50px', padding: '8px 20px' }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Image Modal */}
      <Modal 
        show={showEditPopup} 
        onHide={() => setShowEditPopup(false)} 
        centered
        size="sm"
      >
        <Modal.Header 
          closeButton
          style={{ 
            background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
            color: 'white',
            border: 'none'
          }}
        >
          <Modal.Title style={{ fontSize: '1.2rem' }}>Update Profile Picture</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-4">
          <div 
            className="profile-image-container mb-4 mx-auto"
            style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid #f0f0f0',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}
          >
            <img 
              src={profilePic} 
              alt="Profile" 
              className="w-100 h-100"
              style={{ objectFit: 'cover' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultProfilePic;
              }}
            />
          </div>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            style={{ display: "none" }} 
            onChange={handleImageChange} 
          />
          <div className="d-grid gap-2">
            <Button 
              style={{ 
                background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
                border: 'none',
                borderRadius: '50px',
                padding: '10px'
              }}
              onClick={handleEditImage}
              className="d-flex align-items-center justify-content-center"
            >
              <FaCamera className="me-2" /> Choose New Photo
            </Button>
            <Button 
              variant="outline-danger" 
              onClick={handleDeleteImage}
              style={{ 
                borderRadius: '50px',
                padding: '10px',
                borderColor: '#dc3545',
                color: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.05)'
              }}
              className="d-flex align-items-center justify-content-center"
            >
              <FaTrash className="me-2" /> Remove Photo
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal 
        show={showProfileEdit} 
        onHide={() => setShowProfileEdit(false)} 
        centered
      >
        <Modal.Header 
          closeButton
          style={{ 
            background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
            color: 'white',
            border: 'none'
          }}
        >
          <Modal.Title style={{ fontSize: '1.2rem' }}>Edit Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: '500' }}>Name</Form.Label>
              <Form.Control 
                type="text" 
                name="user_name" 
                value={formData.user_name} 
                onChange={handleInputChange} 
                style={{ 
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid #ced4da'
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: '500' }}>Password</Form.Label>
              <Form.Control 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleInputChange} 
                placeholder="Enter new password"
                style={{ 
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid #ced4da'
                }}
              />
              <Form.Text className="text-muted">
                Leave blank to keep your current password
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label style={{ fontWeight: '500' }}>Confirm Password</Form.Label>
              <Form.Control 
                type="password" 
                name="confirmPassword" 
                value={formData.confirmPassword} 
                onChange={handleInputChange} 
                placeholder="Confirm new password"
                style={{ 
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid #ced4da'
                }}
              />
            </Form.Group>
            <Button 
              className="w-100"
              onClick={handleSaveProfile}
              style={{ 
                background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
                border: 'none',
                borderRadius: '50px',
                padding: '12px',
                fontWeight: '500'
              }}
            >
              Save Changes
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Profile;
