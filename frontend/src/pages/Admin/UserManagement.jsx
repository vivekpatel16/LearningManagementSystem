import React, { useState, useEffect } from "react";
import { Container, Table, Button, Modal, Form, Card, InputGroup, FormControl, Toast, Spinner } from "react-bootstrap";
import { FaUserEdit, FaTrash, FaPlus, FaSearch, FaEye, FaEyeSlash } from "react-icons/fa";
import Admin_API from "../../Api/adminApi";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("Add");
  const [showPassword, setShowPassword] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState("success");
  const [deleteLoading, setDeleteLoading] = useState(false);

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
      showToastMessage("Failed to fetch users", "danger");
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

  const showToastMessage = (message, variant = "success") => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSave = async () => {
    try {
      if (modalType === "Add") {
        await Admin_API.post("/user", newUser);
        showToastMessage("User added successfully");
      } else {
        await Admin_API.patch(`/user/${currentUser._id}`, currentUser);
        showToastMessage("User updated successfully");
      }
      setShowModal(false);
      fetchUsers(); // Fetch updated data after saving
    } catch (error) {
      showToastMessage(error.response?.data?.message || "Failed to save user", "danger");
      console.error("Error saving user:", error);
    }
  };

  const handleDelete = async (id) => {
    const userToDelete = users.find(user => user._id === id);
    let confirmMessage = "Are you sure you want to delete this user?";
    
    if (userToDelete?.role === "instructor") {
      confirmMessage = "WARNING: Deleting this instructor will permanently remove:\n\n" +
        "• ALL courses created by them\n" +
        "• ALL chapters and video content\n" +
        "• ALL student enrollments and progress\n" +
        "• ALL course ratings and reviews\n" +
        "• ALL PDF materials and resources\n" +
        "• ALL comments and discussion threads\n\n" +
        "This action CANNOT be undone. Are you sure you want to proceed?";
    }
    
    if (window.confirm(confirmMessage)) {
      try {
        setDeleteLoading(true);
        const response = await Admin_API.delete(`/user/${id}`);
        if (response.status === 200) {
          setUsers(users.filter((user) => user._id !== id));
          showToastMessage("User deleted successfully");
        }
      } catch (error) {
        showToastMessage("Failed to delete user", "danger");
        console.error("Error deleting user:", error);
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container className="mt-4">
      <div className="position-relative">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          className="position-fixed top-0 start-50 translate-middle-x mt-3"
          style={{ 
            zIndex: 9999,
            minWidth: '300px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: 'none',
            borderRadius: '8px',
            animation: 'slideIn 0.5s ease-in-out'
          }}
          bg={toastVariant}
        >
          <Toast.Header className={`bg-${toastVariant} text-white`}>
            <strong className="me-auto">
              {toastVariant === 'success' ? 'Success!' : 'Error!'}
            </strong>
            <small className="text-white">Just now</small>
          </Toast.Header>
          <Toast.Body className={`bg-${toastVariant} text-white`}>
            {toastMessage}
          </Toast.Body>
        </Toast>

        <style>
          {`
            @keyframes slideIn {
              from {
                transform: translate(-50%, -100%);
                opacity: 0;
              }
              to {
                transform: translate(-50%, 0);
                opacity: 1;
              }
            }
          `}
        </style>

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
                      <Button variant="secondary" size="sm" className="me-2" onClick={() => handleShowModal("Edit", user)}>
                        <FaUserEdit /> Edit
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleDelete(user._id)}
                        disabled={deleteLoading}
                      >
                        {deleteLoading ? <Spinner size="sm" animation="border" /> : <FaTrash />} Delete
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
      </div>

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
              <div style={{ position: "relative" }}>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={modalType === "Add" ? newUser.password : currentUser.password}
                  onChange={modalType === "Add" ? handleChangeNewUser : handleChangeCurrentUser}
                  required={modalType === "Add"}
                  autoComplete="new-password"
                />
                <FaEye
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "#666",
                  }}
                  onClick={() => setShowPassword(!showPassword)}
                  className={showPassword ? "d-none" : ""}
                />
                <FaEyeSlash
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "#666"
                  }}
                  onClick={() => setShowPassword(!showPassword)}
                  className={!showPassword ? "d-none" : ""}
                />
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                name="role"
                value={modalType === "Add" ? newUser.role : currentUser.role}
                onChange={modalType === "Add" ? handleChangeNewUser : handleChangeCurrentUser}
                required
              >
                <option value="user">User</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {modalType === "Add" ? "Add" : "Update"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserManagement;