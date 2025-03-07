import React, { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Courses_API from "../../Api/courseApi";

const CourseManagement = () => {
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    category_name: "",
    thumbnail: ""
  });

  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    
    Courses_API.get("/category")
      .then((response) => {
        console.log("API Response:", response.data);
        if (response.data && Array.isArray(response.data)) {
          setCategories(response.data); 
        } else {
          setCategories([]); 
        }
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
        setCategories([]); 
      });
  }, []);

  const handleInputChange = (e, field) => {
    setNewCourse({ ...newCourse, [field]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setNewCourse({ ...newCourse, thumbnail: reader.result }); 
      };
    }
  };
  
const handleAddCourse = async () => {
  if (!newCourse.title || !newCourse.description || !newCourse.category_id || !newCourse.thumbnail) {
    alert("All fields including thumbnail are required.");
    console.log(newCourse);
    return;
  }

  const courseData = {
    title: newCourse.title,
    description: newCourse.description,
    category_id: newCourse.category_id,
    thumbnail: newCourse.thumbnail,
  };

  try {
    const response = await Courses_API.post("/", courseData, {
      headers: { "Content-Type": "application/json" },
    });

    if (response.data.data && response.data.data._id) {
      console.log("Course added successfully:", response.data);
      navigate("/instructor/courses/add-chapter", { state: { course: response.data.data } });
    } else {
      alert("Course ID not generated. Please try again.");
    }
  } catch (error) {
    console.error("Error adding course:", error.response?.data || error.message);
    alert(`Failed to add course: ${error.response?.data?.message || "Unknown error"}`);
  }
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
          <Form.Select value={newCourse.category_id} onChange={(e) => handleInputChange(e, "category_id")}>
            <option value="">Select a category</option>
            {categories.length > 0 ? (
              categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.category_name}
                </option>
              ))
            ) : (
              <option disabled>Loading categories...</option>
            )}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Course Image</Form.Label>
          <Form.Control type="file" accept="image/*" onChange={handleImageChange} />
        </Form.Group>

        <Button variant="primary" onClick={handleAddCourse}>
          Add Course
        </Button>
      </Form>
    </div>
  );
};

export default CourseManagement;


