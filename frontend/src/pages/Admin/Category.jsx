import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Modal, Alert, Spinner, InputGroup, FormControl, Placeholder } from 'react-bootstrap';
import { FaEdit, FaTrash, FaSearch, FaPlus } from 'react-icons/fa';

import { toast } from 'react-hot-toast';
import axiosInstance from '../../Api/axiosInstance';

const Category = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);
    const [editCategoryName, setEditCategoryName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Custom CSS for search input placeholder
    useEffect(() => {
        const searchStyle = document.createElement('style');
        searchStyle.innerHTML = `
            .search-placeholder::placeholder {
                color: rgba(0, 0, 0, 0.5) !important;
                opacity: 1;
            }
            .header-search .form-control:focus {
                box-shadow: none;
                border-color: #0062E6;
            }
        `;
        document.head.appendChild(searchStyle);
        
        return () => {
            document.head.removeChild(searchStyle);
        };
    }, []);

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Please login to view categories');
                return;
            }

            const response = await axiosInstance.get('/courses/category', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setCategories(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setError(error.response?.data?.message || 'Failed to fetch categories');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Handle add category
    const handleAddCategory = async () => {
        if (!newCategory.trim()) {
            toast.error('Please enter a category name');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Please login to add categories');
                return;
            }

            const response = await axiosInstance.post(
                '/courses/category',
                { category_name: newCategory },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success('Category added successfully');
                setCategories([...categories, response.data.data]);
                setShowAddModal(false);
                setNewCategory('');
            }
        } catch (error) {
            console.error('Error adding category:', error);
            toast.error(error.response?.data?.message || 'Failed to add category');
        }
    };

    // Handle edit category
    const handleEditCategory = async () => {
        if (!editCategoryName.trim()) {
            toast.error('Please enter a category name');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Please login to edit categories');
                return;
            }

            const response = await axiosInstance.patch(
                `/courses/category/${editingCategory._id}`,
                { category_name: editCategoryName },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success('Category updated successfully');
                setCategories(categories.map(cat =>
                    cat._id === editingCategory._id ? response.data.data : cat
                ));
                setShowEditModal(false);
                setEditingCategory(null);
                setEditCategoryName('');
            }
        } catch (error) {
            console.error('Error updating category:', error);
            toast.error(error.response?.data?.message || 'Failed to update category');
        }
    };

    // Handle delete category
    const handleDeleteCategory = async (categoryId) => {
        if (!window.confirm('Are you sure you want to delete this category?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Please login to delete categories');
                return;
            }

            const response = await axiosInstance.delete(
                `/courses/category/${categoryId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 200) {
                toast.success('Category deleted successfully');
                setCategories(categories.filter(cat => cat._id !== categoryId));
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error(error.response?.data?.message || 'Failed to delete category');
        }
    };

    // Open edit modal
    const openEditModal = (category) => {
        setEditingCategory(category);
        setEditCategoryName(category.category_name);
        setShowEditModal(true);
    };

    // Filter categories based on search term
    const filteredCategories = categories.filter(category =>
        category.category_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                                <h1 className="fw-bold mb-0">Categories</h1>
                                <p className="mb-0 opacity-75">Manage your course categories</p>
                            </div>
                            {/* Desktop search and add buttons - hidden on mobile - disabled during loading */}
                            <div className="d-none d-md-flex align-items-center gap-3">
                                <div className="header-search position-relative">
                                    <FormControl
                                        disabled
                                        className="search-placeholder"
                                        placeholder="Search categories..."
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
                                    <FaPlus /> Add Category
                                </Button>
                            </div>
                        </div>
                    </Container>
                </div>

                {/* Skeleton for categories table */}
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
                                        }}>Category Name</th>
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
                                    {Array(6).fill().map((_, index) => (
                                        <tr key={index} style={{ 
                                            backgroundColor: index % 2 === 0 ? 'white' : 'rgba(0, 98, 230, 0.01)'
                                        }}>
                                            <td style={{ padding: '18px 25px' }}>
                                                <Placeholder animation="glow">
                                                    <Placeholder xs={6} bg="light" />
                                                </Placeholder>
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

    if (error) {
        return (
            <Alert variant="danger" className="m-4" style={{ borderRadius: '10px', border: 'none' }}>
                {error}
            </Alert>
        );
    }

    return (
        <>
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
                            <h1 className="fw-bold mb-0">Categories</h1>
                            <p className="mb-0 opacity-75">Manage your course categories</p>
                        </div>
                        {/* Desktop search and add buttons - hidden on mobile */}
                        <div className="d-none d-md-flex align-items-center gap-3">
                            <div className="header-search position-relative">
                                <FormControl
                                    className="search-placeholder"
                                    placeholder="Search categories..."
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
                                onClick={() => setShowAddModal(true)}
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
                                <FaPlus /> Add Category
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
                                placeholder="Search categories..."
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
                        onClick={() => setShowAddModal(true)}
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
                                    }}>Category Name</th>
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
                                {filteredCategories.length > 0 ? (
                                    filteredCategories.map((category, index) => (
                                        <tr key={category._id} style={{
                                            backgroundColor: index % 2 === 0 ? 'white' : 'rgba(0, 98, 230, 0.01)',
                                            transition: 'all 0.2s'
                                        }}>
                                            <td style={{ 
                                                padding: '18px 25px',
                                                fontSize: '15px',
                                                color: '#495057',
                                                fontWeight: '500'
                                            }}>{category.category_name}</td>
                                            <td style={{ padding: '18px 25px' }}>
                                                <div className="d-flex justify-content-center gap-2">
                                                    <Button
                                                        onClick={() => openEditModal(category)}
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
                                                        <FaEdit /> Edit
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleDeleteCategory(category._id)}
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
                                                        <FaTrash /> Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="2" className="text-center py-5">
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
                                                <p className="mt-2 mb-0 fw-medium" style={{ color: '#495057' }}>No categories found</p>
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
            </Container>

            {/* Custom CSS for button hover effects */}
            <style>
                {`
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

            {/* Add Category Modal */}
            <Modal 
                show={showAddModal} 
                onHide={() => setShowAddModal(false)}
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
                    <Modal.Title>Add New Category</Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-4">
                    <Form>
                        <Form.Group>
                            <Form.Label>Category Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="Enter category name"
                                autoFocus
                                style={{
                                    border: '1px solid #dee2e6',
                                    borderRadius: '8px',
                                    padding: '10px 15px'
                                }}
                            />
                            <Form.Text className="text-muted">
                                This category will be available for instructors when creating courses.
                            </Form.Text>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer style={{ border: 'none' }}>
                    <Button 
                        variant="light" 
                        onClick={() => setShowAddModal(false)}
                        style={{
                            borderRadius: '8px',
                            fontWeight: '500'
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleAddCategory}
                        disabled={!newCategory.trim()}
                        style={{
                            background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '500'
                        }}
                    >
                        Add Category
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Category Modal */}
            <Modal 
                show={showEditModal} 
                onHide={() => setShowEditModal(false)}
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
                    <Modal.Title>Edit Category</Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-4">
                    <Form>
                        <Form.Group>
                            <Form.Label>Category Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={editCategoryName}
                                onChange={(e) => setEditCategoryName(e.target.value)}
                                placeholder="Enter category name"
                                autoFocus
                                style={{
                                    border: '1px solid #dee2e6',
                                    borderRadius: '8px',
                                    padding: '10px 15px'
                                }}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer style={{ border: 'none' }}>
                    <Button 
                        variant="light" 
                        onClick={() => setShowEditModal(false)}
                        style={{
                            borderRadius: '8px',
                            fontWeight: '500'
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleEditCategory}
                        disabled={!editCategoryName.trim()}
                        style={{
                            background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '500'
                        }}
                    >
                        Update Category
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default Category; 