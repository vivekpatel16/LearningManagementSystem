import React, { useState, useEffect } from "react";
import { Container, Table, Button, Modal, Form, Card, InputGroup, FormControl } from "react-bootstrap";
import { FaUserEdit, FaTrash, FaPlus, FaSearch } from "react-icons/fa";
import Admin_API from "../../Api/adminApi";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("Add");

  // Separate states for new users and existing users
  const [newUser, setNewUser] = useState({ user_name: "", email: "", password: "", role: "user" });
  const [currentUser, setCurrentUser] = useState({ _id: "", user_name: "", email: "", password: "", role: "user" });

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await Admin_API.get("/user");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleShowModal = (type, user = null) => {
    setModalType(type);
    if (type === "Add") {
      setNewUser({ user_name: "", email: "", password: "", role: "user" });
    } else {
      setCurrentUser(user);
    }
    setShowModal(true);
  };

  const handleChangeNewUser = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleChangeCurrentUser = (e) => {
    setCurrentUser({ ...currentUser, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      if (modalType === "Add") {
        await Admin_API.post("/user", newUser);
      } else {
        await Admin_API.patch(`/user/${currentUser._id}`, currentUser);
      }
      setShowModal(false);
      fetchUsers(); // Fetch updated data after saving
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };
  

  const handleDelete = async (id) => {
    try {
      const response = await Admin_API.delete(`/user/${id}`);
      if (response.status === 200) {
        setUsers(users.filter((user) => user._id !== id));
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <InputGroup style={{ maxWidth: "500px" }}>
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
                <tr key={user._id}>
                  <td>{index + 1}</td>
                  <td>{user.user_name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <Button variant="warning" size="sm" className="me-2" onClick={() => handleShowModal("Edit", user)}>
                      <FaUserEdit /> Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(user._id)}>
                      <FaTrash /> Delete
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">No users found</td>
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
                name="user_name"
                value={modalType === "Add" ? newUser.user_name : currentUser.user_name}
                onChange={modalType === "Add" ? handleChangeNewUser : handleChangeCurrentUser}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={modalType === "Add" ? newUser.email : currentUser.email}
                onChange={modalType === "Add" ? handleChangeNewUser : handleChangeCurrentUser}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={modalType === "Add" ? newUser.password : currentUser.password}
                onChange={modalType === "Add" ? handleChangeNewUser : handleChangeCurrentUser}
                required={modalType === "Add"}
                autoComplete="new-password"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                name="role"
                value={modalType === "Add" ? newUser.role : currentUser.role}
                onChange={modalType === "Add" ? handleChangeNewUser : handleChangeCurrentUser}
              >
                <option value="user">Learner</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="success" size="sm" onClick={handleSave}>Save</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserManagement;
