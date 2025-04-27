import React, { useState, useEffect } from "react";
import { Container, Table, Button, Modal, Form, Card, InputGroup, FormControl, Toast, Spinner, Alert, Placeholder } from "react-bootstrap";
import { FaUserEdit, FaTrash, FaPlus, FaSearch, FaEye, FaEyeSlash, FaUserCircle } from "react-icons/fa";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Separate states for new users and existing users
  const [newUser, setNewUser] = useState({ user_name: "", email: "", password: "", role: "user" });
  const [currentUser, setCurrentUser] = useState({ _id: "", user_name: "", email: "", password: "", role: "user" });

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await Admin_API.get("/user");
      setUsers(response.data);
      setError(null);
    } catch (error) {
      showToastMessage("Failed to fetch users", "danger");
      setError("Failed to fetch users. Please try again.");
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
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

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.user_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower)
    );
  });

  const getRoleBadgeStyles = (role) => {
    switch (role) {
      case 'admin':
        return {
          background: 'rgba(220, 53, 69, 0.1)',
          color: '#dc3545',
        };
      case 'instructor':
        return {
          background: 'rgba(111, 66, 193, 0.1)',
          color: '#6f42c1',
        };
      default:
        return {
          background: 'rgba(40, 167, 69, 0.1)',
          color: '#28a745',
        };
    }
  };

  if (loading) {
    return (
      <>
        {/* Full width header section - always show this */}
        <div className="w-100" style={{ 
          background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
          padding: '30px 0',
          color: 'white',
          borderBottomLeftRadius: '30px',
          borderBottomRightRadius: '30px',
          marginBottom: '25px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)'
        }}>
          <Container>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
              <div className="mb-3 mb-md-0">
                <h1 className="fw-bold mb-0">User Management</h1>
                <p className="mb-0 opacity-75">Add, edit, and manage system users</p>
              </div>
              {/* Desktop search and add buttons - hidden on mobile - disabled during loading */}
              <div className="d-none d-md-flex align-items-center gap-3">
                <div className="header-search position-relative">
                  <FormControl
                    disabled
                    className="search-placeholder"
                    placeholder="Search users..."
                    style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      border: 'none',
                      borderRadius: '50px',
                      padding: '10px 20px',
                      paddingLeft: '45px',
                      width: '280px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <FaSearch className="position-absolute" style={{ 
                    left: '20px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#0062E6',
                    fontSize: '14px',
                    opacity: '0.5'
                  }} />
                </div>
                <Button 
                  disabled
                  className="d-flex align-items-center gap-2" 
                  style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    color: '#0062E6',
                    border: 'none',
                    borderRadius: '50px',
                    fontWeight: '600',
                    padding: '10px 24px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    whiteSpace: 'nowrap',
                    opacity: '0.8'
                  }}
                >
                  <FaPlus /> Add User
                </Button>
              </div>
            </div>
          </Container>
        </div>

        {/* Skeleton for user table */}
        <Container className="mb-4">
          <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead style={{ 
                  background: 'linear-gradient(to right, rgba(0, 98, 230, 0.08), rgba(51, 161, 253, 0.08))',
                  borderBottom: '2px solid rgba(0, 98, 230, 0.1)'
                }}>
                  <tr>
                    <th style={{ 
                      padding: '18px 25px', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Index</th>
                    <th style={{ 
                      padding: '18px 25px', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Name</th>
                    <th style={{ 
                      padding: '18px 25px', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Email</th>
                    <th style={{ 
                      padding: '18px 25px', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Role</th>
                    <th style={{ 
                      width: '200px', 
                      padding: '18px 25px', 
                      textAlign: 'center', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array(5).fill().map((_, index) => (
                    <tr key={index} style={{ 
                      backgroundColor: index % 2 === 0 ? 'white' : 'rgba(0, 98, 230, 0.01)'
                    }}>
                      <td style={{ padding: '18px 25px' }}>
                        <Placeholder animation="glow">
                          <Placeholder xs={1} bg="light" />
                        </Placeholder>
                      </td>
                      <td style={{ padding: '18px 25px' }}>
                        <div className="d-flex align-items-center">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(0, 98, 230, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '10px'
                          }}>
                            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(0, 98, 230, 0.2)' }}></div>
                          </div>
                          <Placeholder animation="glow" className="mb-0 flex-grow-1">
                            <Placeholder xs={8} bg="light" />
                          </Placeholder>
                        </div>
                      </td>
                      <td style={{ padding: '18px 25px' }}>
                        <Placeholder animation="glow">
                          <Placeholder xs={8} bg="light" />
                        </Placeholder>
                      </td>
                      <td style={{ padding: '18px 25px' }}>
                        <div style={{
                          width: '60px',
                          height: '24px',
                          borderRadius: '20px',
                          background: 'rgba(0, 0, 0, 0.05)',
                        }}></div>
                      </td>
                      <td style={{ padding: '18px 25px' }}>
                        <div className="d-flex justify-content-center gap-2">
                          <div style={{
                            width: '70px',
                            height: '32px',
                            borderRadius: '6px',
                            background: 'rgba(0, 98, 230, 0.1)',
                          }}></div>
                          <div style={{
                            width: '70px',
                            height: '32px',
                            borderRadius: '6px',
                            background: 'rgba(220, 53, 69, 0.1)',
                          }}></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Container>
      </>
    );
  }

  return (
    <>
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
            
            .btn-hover-effect:hover {
              background: linear-gradient(135deg, #0056CD 0%, #2B8AD9 100%) !important;
              transform: translateY(-1px);
              box-shadow: 0 4px 10px rgba(0, 98, 230, 0.2);
            }
            
            .delete-btn-hover:hover {
              background: rgba(220, 53, 69, 0.15) !important;
              transform: translateY(-1px);
              box-shadow: 0 4px 10px rgba(220, 53, 69, 0.1);
            }
            
            tbody tr:hover {
              background-color: rgba(0, 98, 230, 0.03) !important;
            }
          `}
        </style>

        {/* Full width header section */}
        <div className="w-100" style={{ 
          background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
          padding: '30px 0',
          color: 'white',
          borderBottomLeftRadius: '30px',
          borderBottomRightRadius: '30px',
          marginBottom: '25px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)'
        }}>
          <Container>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
              <div className="mb-3 mb-md-0">
                <h1 className="fw-bold mb-0">User Management</h1>
                <p className="mb-0 opacity-75">Add, edit, and manage system users</p>
              </div>
              {/* Desktop search and add buttons - hidden on mobile */}
              <div className="d-none d-md-flex align-items-center gap-3">
                <div className="header-search position-relative">
                  <FormControl
                    className="search-placeholder"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      background: 'white',
                      border: 'none',
                      borderRadius: '50px',
                      padding: '10px 20px',
                      paddingLeft: '45px',
                      width: '280px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <FaSearch className="position-absolute" style={{ 
                    left: '20px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#0062E6',
                    fontSize: '14px'
                  }} />
                </div>
                <Button 
                  className="d-flex align-items-center gap-2" 
                  onClick={() => handleShowModal("Add")}
                  style={{
                    background: 'white',
                    color: '#0062E6',
                    border: 'none',
                    borderRadius: '50px',
                    fontWeight: '600',
                    padding: '10px 24px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <FaPlus /> Add User
                </Button>
              </div>
            </div>
          </Container>
        </div>

        {/* Mobile search and add buttons - only visible on mobile */}
        <Container className="d-md-none mb-4">
          <div className="d-flex align-items-center gap-2">
            <div style={{ flex: '1' }}>
              <div className="position-relative">
                <FormControl
                  className="search-placeholder"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    background: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '50px',
                    padding: '10px 20px',
                    paddingLeft: '45px',
                    height: '48px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  left: '16px',
                  top: '0',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaSearch color="#0062E6" fontSize="14px" />
                </div>
              </div>
            </div>
            <Button 
              className="d-flex align-items-center justify-content-center"
              onClick={() => handleShowModal("Add")}
              style={{
                background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                fontWeight: '600',
                padding: '10px 0',
                width: '48px',
                height: '48px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                flexShrink: 0
              }}
            >
              <FaPlus />
            </Button>
          </div>
        </Container>

        {/* Table section */}
        <Container className="mb-4">
          {error ? (
            <Alert variant="danger" className="m-4" style={{ borderRadius: '10px', border: 'none' }}>
              {error}
            </Alert>
          ) : (
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
              <Card.Body className="p-0">
                <Table hover responsive className="mb-0">
                  <thead style={{ 
                    background: 'linear-gradient(to right, rgba(0, 98, 230, 0.08), rgba(51, 161, 253, 0.08))',
                    borderBottom: '2px solid rgba(0, 98, 230, 0.1)'
                  }}>
                    <tr>
                      <th style={{ 
                        padding: '18px 25px', 
                        fontWeight: '600', 
                        color: '#0062E6',
                        fontSize: '15px'
                      }}>Index</th>
                      <th style={{ 
                        padding: '18px 25px', 
                        fontWeight: '600', 
                        color: '#0062E6',
                        fontSize: '15px'
                      }}>Name</th>
                      <th style={{ 
                        padding: '18px 25px', 
                        fontWeight: '600', 
                        color: '#0062E6',
                        fontSize: '15px'
                      }}>Email</th>
                      <th style={{ 
                        padding: '18px 25px', 
                        fontWeight: '600', 
                        color: '#0062E6',
                        fontSize: '15px'
                      }}>Role</th>
                      <th style={{ 
                        width: '200px', 
                        padding: '18px 25px', 
                        textAlign: 'center', 
                        fontWeight: '600', 
                        color: '#0062E6',
                        fontSize: '15px'
                      }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user, index) => (
                        <tr key={user._id} style={{
                          backgroundColor: index % 2 === 0 ? 'white' : 'rgba(0, 98, 230, 0.01)',
                          transition: 'all 0.2s'
                        }}>
                          <td style={{ 
                            padding: '18px 25px',
                            fontSize: '15px',
                            color: '#495057',
                            fontWeight: '500'
                          }}>{index + 1}</td>
                          <td style={{ 
                            padding: '18px 25px',
                            fontSize: '15px',
                            color: '#495057',
                            fontWeight: '500'
                          }}>
                            <div className="d-flex align-items-center">
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'rgba(0, 98, 230, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '10px'
                              }}>
                                <FaUserCircle size={18} color="#0062E6" />
                              </div>
                              {user.user_name}
                            </div>
                          </td>
                          <td style={{ 
                            padding: '18px 25px',
                            fontSize: '15px',
                            color: '#495057',
                            fontWeight: '500'
                          }}>{user.email}</td>
                          <td style={{ 
                            padding: '18px 25px',
                            fontSize: '15px',
                            fontWeight: '500'
                          }}>
                            <span style={{
                              ...getRoleBadgeStyles(user.role),
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '13px',
                              fontWeight: '500'
                            }}>
                              {user.role}
                            </span>
                          </td>
                          <td style={{ padding: '18px 25px' }}>
                            <div className="d-flex justify-content-center gap-2">
                              <Button
                                onClick={() => handleShowModal("Edit", user)}
                                size="sm"
                                style={{
                                  background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
                                  border: 'none',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '6px 15px',
                                  fontWeight: '500',
                                  transition: 'all 0.3s ease'
                                }}
                                className="btn-hover-effect"
                              >
                                <FaUserEdit /> Edit
                              </Button>
                              <Button
                                onClick={() => handleDelete(user._id)}
                                disabled={deleteLoading}
                                size="sm"
                                style={{
                                  background: 'rgba(220, 53, 69, 0.1)',
                                  color: '#dc3545',
                                  border: 'none',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '6px 15px',
                                  fontWeight: '500',
                                  transition: 'all 0.3s ease'
                                }}
                                className="delete-btn-hover"
                              >
                                {deleteLoading ? <Spinner size="sm" animation="border" /> : <FaTrash />} Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-5">
                          <div className="d-flex flex-column align-items-center">
                            <div style={{
                              background: 'rgba(0, 98, 230, 0.05)',
                              width: '80px',
                              height: '80px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '15px'
                            }}>
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 15H13V17H11V15ZM11 7H13V13H11V7Z" fill="#0062E6" opacity="0.5"/>
                              </svg>
                            </div>
                            <p className="mt-2 mb-0 fw-medium" style={{ color: '#495057' }}>No users found</p>
                            {searchTerm && (
                              <p className="small text-muted mt-1">Try a different search term</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Container>

        {/* Add/Edit Modal */}
        <Modal 
          show={showModal} 
          onHide={() => setShowModal(false)}
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
            <Modal.Title>{modalType} User</Modal.Title>
          </Modal.Header>
          <Modal.Body className="py-4">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  name="user_name"
                  value={modalType === "Add" ? newUser.user_name : currentUser.user_name}
                  onChange={modalType === "Add" ? handleChangeNewUser : handleChangeCurrentUser}
                  required
                  style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '10px 15px'
                  }}
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
                  style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '10px 15px'
                  }}
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
                    style={{
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      padding: '10px 15px'
                    }}
                  />
                  <FaEye
                    style={{
                      position: "absolute",
                      right: "15px",
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
                      right: "15px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      color: "#666"
                    }}
                    onClick={() => setShowPassword(!showPassword)}
                    className={!showPassword ? "d-none" : ""}
                  />
                </div>
                {modalType === "Edit" && (
                  <Form.Text className="text-muted">
                    Leave blank to keep the current password.
                  </Form.Text>
                )}
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Role</Form.Label>
                <Form.Select
                  name="role"
                  value={modalType === "Add" ? newUser.role : currentUser.role}
                  onChange={modalType === "Add" ? handleChangeNewUser : handleChangeCurrentUser}
                  required
                  style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '10px 15px'
                  }}
                >
                  <option value="user">User</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </Form.Select>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer style={{ border: 'none' }}>
            <Button 
              variant="light" 
              onClick={() => setShowModal(false)}
              style={{
                borderRadius: '8px',
                fontWeight: '500'
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              style={{
                background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500'
              }}
            >
              {modalType === "Add" ? "Add User" : "Update User"}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default UserManagement;