import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import defaultProfilePic from "./th.jpeg"; // Ensure the correct path
import { useNavigate } from "react-router-dom"; // For Logout Redirection

const Profile = () => {
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("instructor@example.com");
  const [profilePic, setProfilePic] = useState(defaultProfilePic);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate(); // For Logout Redirection

  const handleEditClick = () => setShowModal(true);
  const handleClose = () => setShowModal(false);
  const handleClosePasswordModal = () => setShowPasswordModal(false);

  const handleSaveChanges = () => {
    setShowModal(false);
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePasswordClick = () => {
    setShowPasswordModal(true);
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      alert("New Password and Confirm Password do not match!");
      return;
    }
    alert("Password changed successfully!");
    setShowPasswordModal(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); // Clear authentication token
    navigate("/"); // Redirect to the main login page
  };

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="card text-center shadow p-4 " style={{ width: "600px" }}>
        <div className="d-flex justify-content-center">
          <img
            src={profilePic}
            alt="Profile"
            className="rounded-circle mb-3"
            width="100"
            height="100"
          />
        </div>

        <h4 className="mt-3">{name}</h4>
        <p className="text-muted">Instructor</p>
        <p>Email: {email}</p>

        <div className="d-flex justify-content-center">
          <Button variant="primary" className="me-2" onClick={handleEditClick}>
            Edit Profile
          </Button>
          <Button variant="warning" className="me-2" onClick={handleChangePasswordClick}>
            Change Password
          </Button>
          <Button variant="danger" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Profile Picture</Form.Label>
              <Form.Control type="file" onChange={handleProfilePicChange} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSaveChanges}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Change Password Modal */}
      <Modal show={showPasswordModal} onHide={handleClosePasswordModal}>
        <Modal.Header closeButton>
          <Modal.Title>Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Current Password</Form.Label>
              <Form.Control
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClosePasswordModal}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleChangePassword}>
            Change Password
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Profile;
