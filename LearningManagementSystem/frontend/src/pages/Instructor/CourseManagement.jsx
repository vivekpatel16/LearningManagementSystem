import React, { useState } from "react";
import { useNavigate } from "react-router-dom";


const CourseManagement = () => {
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [category, setCategory] = useState("Development");
  const [thumbnail, setThumbnail] = useState(null);
  const [preview, setPreview] = useState(null);

  const navigate = useNavigate();

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const courseData = {
      courseTitle,
      courseDescription,
      category,
      thumbnail,
    };
    
    sessionStorage.setItem("courseData", JSON.stringify(courseData));
    navigate("/add-chapter");
  };

  return (
    <div className="container mt-5">
      <div className="card shadow p-4">
        <h2 className="text-center mb-4">Add a New Course</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Course Title</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter course title"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Course Description</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Enter course description"
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Course Category</label>
            <select
              className="form-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Development">Development</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Business">Business</option>
              <option value="Finance">Finance</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Course Thumbnail</label>
            <input
              type="file"
              accept="image/*"
              className="form-control"
              onChange={handleThumbnailChange}
            />
            {preview && (
              <div className="mt-3">
                <p className="text-muted">Preview:</p>
                <img
                  src={preview}
                  alt="Course Thumbnail"
                  className="img-thumbnail"
                  style={{ width: "150px", height: "150px" }}
                />
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Next: Add Chapters
          </button>
        </form>
      </div>
    </div>
  );
};

export default CourseManagement;
