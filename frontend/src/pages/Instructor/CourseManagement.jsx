import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const CourseManagement = () => {
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    category: "",
    image: "",
    chapters: [],  // Store chapters within the course object
  });

  const navigate = useNavigate();

  const categories = [
    "Software Development",
    "UI/UX & Web Design",
    "Programming & Scripting",
    "DevOps & Cloud Computing",
    "Cybersecurity & Ethical Hacking",
    "Data Science & AI/ML"
  ];

  const handleInputChange = (e, field) => {
    setNewCourse({ ...newCourse, [field]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCourse({ ...newCourse, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddChapter = () => {
    if (!newCourse.title || !newCourse.description || !newCourse.category || !newCourse.image) {
      alert("All fields including image are required.");
      return;
    }

    navigate("/instructor/courses/add-chapter", { state: { course: newCourse } });
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Add Course</h2>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Course Title</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter course title"
            value={newCourse.title}
            onChange={(e) => handleInputChange(e, "title")}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Enter course description"
            value={newCourse.description}
            onChange={(e) => handleInputChange(e, "description")}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Category</Form.Label>
          <Form.Select value={newCourse.category} onChange={(e) => handleInputChange(e, "category")}>
            <option value="">Select a category</option>
            {categories.map((cat, index) => (
              <option key={index} value={cat}>{cat}</option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Course Image</Form.Label>
          <Form.Control type="file" accept="image/*" onChange={handleImageChange} />
        </Form.Group>

        <Button variant="primary" onClick={handleAddChapter}>
          Add Chapter
        </Button>
      </Form>
    </div>
  );
};

export default CourseManagement;
