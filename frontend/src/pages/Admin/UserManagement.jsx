import React, { useState } from "react";
import { Container, Table, Button, Modal, Form, Card, InputGroup, FormControl } from "react-bootstrap";
import { FaUserEdit, FaTrash, FaPlus, FaSearch } from "react-icons/fa";

const UserManagement = () => {
  const [users, setUsers] = useState([
    { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "Learner" },
    { id: 2, name: "Michael Smith", email: "michael@example.com", role: "Instructor" },
    { id: 3, name: "Sarah Williams", email: "sarah@example.com", role: "Learner" },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("Add");
  const [currentUser, setCurrentUser] = useState({ id: "", name: "", email: "", role: "Learner" });

  const handleShowModal = (type, user = { id: "", name: "", email: "", role: "Learner" }) => {
    setModalType(type);
    setCurrentUser(user);
    setShowModal(true);
  };

  const handleChange = (e) => {
    setCurrentUser({ ...currentUser, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (modalType === "Add") {
      setUsers([...users, { ...currentUser, id: users.length + 1 }]);
    } else {
      setUsers(users.map((user) => (user.id === currentUser.id ? currentUser : user)));
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    setUsers(users.filter((user) => user.id !== id));
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container className="mt-4">
      <Card className="shadow p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">Manage Users</h4>
          <Button variant="primary" size="sm" onClick={() => handleShowModal("Add")}>
            <FaPlus /> Add User
          </Button>
        </div>

        {/* Search Bar */}
        <div className="d-flex justify-content mb-3">
        <InputGroup style={{ maxWidth: "500px" }} >
          <InputGroup.Text><FaSearch /></InputGroup.Text>
          <FormControl
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        </div>

        <Table striped bordered hover responsive>
          <thead className="table-dark">
            <tr>
              <th>Index</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <tr key={user.id}>
                  <td>{index + 1}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <Button
                      variant="warning"
                      size="sm"
                      className="me-2"
                      onClick={() => handleShowModal("Edit", user)}
                    >
                      <FaUserEdit /> Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(user.id)}>
                      <FaTrash /> Delete
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{modalType} User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={currentUser.name}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={currentUser.email}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select name="role" value={currentUser.role} onChange={handleChange}>
                <option value="Learner">Learner</option>
                <option value="Instructor">Instructor</option>
                <option value="Admin">Admin</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserManagement;
