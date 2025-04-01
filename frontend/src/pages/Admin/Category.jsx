import { useState } from "react";
import { FaPlus, FaTrash, FaTags, FaEdit, FaCheck, FaTimes } from "react-icons/fa";

const Category = () => {
    const [categories, setCategories] = useState([
        { id: 1, name: "Web Development" },
        { id: 2, name: "Data Science" },
        { id: 3, name: "Artificial Intelligence" },
        { id: 4, name: "Machine Learning" },
        { id: 5, name: "Cybersecurity" },
        { id: 6, name: "Blockchain" },
        { id: 7, name: "Cloud Computing" },
        { id: 8, name: "Game Development" },
        { id: 9, name: "Graphic Design" },
        { id: 10, name: "Digital Marketing" },
        { id: 11, name: "Finance & Investment" },
        { id: 12, name: "Photography" },
        { id: 13, name: "Video Editing" },
        { id: 14, name: "Mobile App Development" },
        { id: 15, name: "UI/UX Design" },
    ]);

    const [newCategory, setNewCategory] = useState("");
    const [editCategory, setEditCategory] = useState(null);
    const [editedName, setEditedName] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    const handleAddCategory = () => {
        if (newCategory.trim() === "") return;
        setCategories([...categories, { id: Date.now(), name: newCategory }]);
        setNewCategory("");
    };

    const handleEditCategory = (category) => {
        setEditCategory(category.id);
        setEditedName(category.name);
    };

    const handleUpdateCategory = () => {
        setCategories(categories.map(cat =>
            cat.id === editCategory ? { ...cat, name: editedName } : cat
        ));
        setEditCategory(null);
        setEditedName("");
    };

    const handleDeleteCategory = (id) => {
        setCategories(categories.filter(category => category.id !== id));
        setShowDeleteConfirm(null);
    };

    return (
        <div className="container mt-4">
            <h2 className="mb-3 d-flex align-items-center">
                <FaTags className="me-2 text-primary" /> Category Management
            </h2>
            <h4 className="mb-3">Add Category</h4>

            {/* Add Category */}
            <div className="card p-3 shadow-sm">
                <div className="d-flex">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Enter category name"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                    />
                    <button className="btn" onClick={handleAddCategory}>
                        <FaPlus className="text-primary" size={20} />
                    </button>
                </div>
            </div>

            {/* Category List */}
            <div className="mt-4">
                <h4 className="mb-3">Category List</h4>
                <div className="card p-3 shadow-sm">
                    {categories.length === 0 ? (
                        <p className="text-muted text-center">No categories available.</p>
                    ) : (
                        <ul className="list-group">
                            {categories.map((category) => (
                                <li key={category.id} className="list-group-item d-flex justify-content-between align-items-center">
                                    {/* Editing Input */}
                                    {editCategory === category.id ? (
                                        <input
                                            type="text"
                                            className="form-control me-2"
                                            value={editedName}
                                            onChange={(e) => setEditedName(e.target.value)}
                                        />
                                    ) : (
                                        <span className="fw-bold">{category.name}</span>
                                    )}
                                    
                                    <div className="d-flex align-items-center">
                                        {/* Save / Cancel */}
                                        {editCategory === category.id ? (
                                            <>
                                                <FaCheck
                                                    className="text-success me-3"
                                                    size={20}
                                                    style={{ cursor: "pointer" }}
                                                    onClick={handleUpdateCategory}
                                                />
                                                <FaTimes
                                                    className="text-danger"
                                                    size={20}
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => setEditCategory(null)}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                {/* Edit Button */}
                                                <FaEdit
                                                    className="text-primary me-3"
                                                    size={20}
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => handleEditCategory(category)}
                                                />

                                                {/* Delete Confirmation */}
                                                {showDeleteConfirm === category.id ? (
                                                    <>
                                                        <span className="text-danger me-3 fw-bold" style={{ cursor: "pointer" }} onClick={() => handleDeleteCategory(category.id)}>
                                                            Confirm Delete
                                                        </span>
                                                        <FaTimes
                                                            className="text-secondary"
                                                            size={20}
                                                            style={{ cursor: "pointer" }}
                                                            onClick={() => setShowDeleteConfirm(null)}
                                                        />
                                                    </>
                                                ) : (
                                                    <FaTrash
                                                        className="text-danger"
                                                        size={20}
                                                        style={{ cursor: "pointer" }}
                                                        onClick={() => setShowDeleteConfirm(category.id)}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Category;
