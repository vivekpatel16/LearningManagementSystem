import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Form, Modal } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
import defaultProfilePic from "../assets/th.png";

const Profile = () => {
  const { user } = useSelector((state) => state.auth); 
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editedData, setEditedData] = useState({ ...user });

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const handleChange = (e) => {
    setEditedData({ ...editedData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    console.log("Save changes", editedData);
    setShowEditModal(false);
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card className="shadow-lg p-3 mb-5 bg-white rounded">
            <Card.Body className="text-center">
              <img
                // src={user?.profilePic || "default-image.png"}
                src={defaultProfilePic}
                alt="Profile"
                className="rounded-circle mb-3"
                width="100"
                height="100"
              />
              <h4>{user?.user_name}</h4>
              <p className="text-muted">{user?.role}</p>
              <p>Email: {user?.email}</p>

              <Button variant="primary" className="m-2" onClick={() => setShowEditModal(true)}>
                Edit Profile
              </Button>
              <Button variant="warning" className="m-2">Change Password</Button>
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
              <Form.Control type="text" name="name" value={editedData.name} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" name="email" value={editedData.email} onChange={handleChange} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button variant="success" onClick={handleSave}>Save Changes</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Profile;
