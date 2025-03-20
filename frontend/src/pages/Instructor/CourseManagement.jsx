import React, { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import Courses_API from "../../Api/courseApi";

const CourseManagement = ({ onUpdateCourses }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const existingCourse = location.state?.course || null;

  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    category_id: "",
    thumbnail: "",
  });

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    Courses_API.get("/category")
      .then((response) => {
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

    if (existingCourse) {
      setNewCourse({
        title: existingCourse.title || "",
        description: existingCourse.description || "",
        category_id: existingCourse.category_id || "",
        thumbnail: existingCourse.thumbnail || "",
      });
    } else {
      setNewCourse({
        title: "",
        description: "",
        category_id: "",
        thumbnail: "",
      });
    }
  }, [location.state]);

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

  const handleSubmit = async () => {
    if (!newCourse.title || !newCourse.description || !newCourse.category_id || !newCourse.thumbnail) {
      alert("All fields including thumbnail are required.");
      return;
    }

    const courseData = {
      title: newCourse.title,
      description: newCourse.description,
      category_id: newCourse.category_id,
      thumbnail: newCourse.thumbnail,
    };

    try {
      let response;
      if (existingCourse) {
        response = await Courses_API.patch(`/${existingCourse._id}`, courseData, {
          headers: { "Content-Type": "application/json" },
        });
      } else {
        response = await Courses_API.post("/", courseData, {
          headers: { "Content-Type": "application/json" },
        });
      }

      if (response.data.data && response.data.data._id) {
        console.log("Course saved successfully:", response.data);
        if (onUpdateCourses) {
          onUpdateCourses(response.data.data);
        }
        
        // Redirect to ChapterManagement after saving the course
        navigate("/instructor/courses/add-chapter", { state: { course: response.data.data } });
      } else {
        alert("Course ID not generated. Please try again.");
      }
    } catch (error) {
      console.error("Error saving course:", error.response?.data || error.message);
      alert(`Failed to save course: ${error.response?.data?.message || "Unknown error"}`);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">{existingCourse ? "Edit Course" : "Add Course"}</h2>
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
        <Button variant="primary" onClick={handleSubmit}>
          {existingCourse ? "Update Course" : "Add Course"}
        </Button>
      </Form>
    </div>
  );
};

export default CourseManagement;