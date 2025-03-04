import React, { useState } from "react";
import { Container, Row, Col, Card, Button, Form, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom"; // For Logout Redirection
import defaultProfilePic from "./th.png"; // Ensure correct path

const adminData = {
  name: "John Doe",
  email: "admin@example.com",
  role: "Administrator",
  profilePic: defaultProfilePic,
};

const AdminProfile = () => {
  const [admin, setAdmin] = useState(adminData);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editedData, setEditedData] = useState({ ...admin });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate(); // For Logout

  // Handle input changes
  const handleChange = (e) => {
    setEditedData({ ...editedData, [e.target.name]: e.target.value });
  };

  // Handle profile picture change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditedData({ ...editedData, profilePic: URL.createObjectURL(file) });
    }
  };

  // Save updated profile
  const handleSave = () => {
    setAdmin(editedData);
    setShowEditModal(false);
  };

  // Handle Change Password
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

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("token"); // Clear authentication token
    navigate("/"); // Redirect to login page
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card className="shadow-lg p-3 mb-5 bg-white rounded">
            <Card.Body className="text-center">
              <img
                src={admin.profilePic}
                alt="Admin Profile"
                className="rounded-circle mb-3"
                width="100"
                height="100"
              />
              <h3>{admin.name}</h3>
              <p className="text-muted">{admin.role}</p>
              <p>Email: {admin.email}</p>

              <Button variant="primary" className="m-2" onClick={() => setShowEditModal(true)}>
                Edit Profile
              </Button>
              <Button variant="warning" className="m-2" onClick={() => setShowPasswordModal(true)}>
                Change Password
              </Button>
              <Button variant="danger" className="m-2" onClick={handleLogout}>
                Logout
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Edit Profile Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={editedData.name}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={editedData.email}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Profile Picture</Form.Label>
              <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSave}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Change Password Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
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
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleChangePassword}>
            Change Password
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminProfile;
  