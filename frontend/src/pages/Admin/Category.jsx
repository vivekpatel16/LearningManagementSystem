import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Modal, Alert, Spinner } from 'react-bootstrap';
import { FaEdit, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Category= () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);
    const [editCategoryName, setEditCategoryName] = useState('');

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Please login to view categories');
                return;
            }

            const response = await axios.get('http://localhost:5000/api/courses/category', {
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
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Please login to add categories');
                return;
            }

            const response = await axios.post(
                'http://localhost:5000/api/courses/category',
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
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Please login to edit categories');
                return;
            }

            const response = await axios.patch(
                `http://localhost:5000/api/courses/category/${editingCategory._id}`,
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

            const response = await axios.delete(
                `http://localhost:5000/api/courses/category/${categoryId}`,
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

    if (loading) {
        return (
            <div className="text-center p-5">
                <Spinner animation="border" />
                <p>Loading categories...</p>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="danger" className="m-4">
                {error}
            </Alert>
        );
    }

    return (
        <Container className="mt-4">
            <Row className="mb-4">
                <Col>
                    <h2>Category Management</h2>
                    <Button variant="primary" onClick={() => setShowAddModal(true)}>
                        Add New Category
                    </Button>
                </Col>
            </Row>

            <Row>
                <Col>
                    <Card>
                        <Card.Body>
                            <Table striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Category Name</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map((category) => (
                                        <tr key={category._id}>
                                            <td>{category.category_name}</td>
                                            <td>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() => openEditModal(category)}
                                                >
                                                    <FaEdit /> Edit
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteCategory(category._id)}
                                                >
                                                    <FaTrash /> Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Add Category Modal */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Add New Category</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>Category Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="Enter category name"
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleAddCategory}>
                        Add Category
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Category Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Category</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>Category Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={editCategoryName}
                                onChange={(e) => setEditCategoryName(e.target.value)}
                                placeholder="Enter category name"
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleEditCategory}>
                        Update Category
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default Category; 