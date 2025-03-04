import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const AddVideo = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { course, chapter, numVideos } = location.state || {};

  const [videos, setVideos] = useState(
    Array.from({ length: numVideos }, () => ({ title: "", file: null }))
  );

  const handleChange = (index, field, value) => {
    const newVideos = [...videos];
    newVideos[index][field] = value;
    setVideos(newVideos);
  };

  const handleSubmit = () => {
    if (!course || !chapter || videos.some(video => !video.title || !video.file)) {
      alert("Please fill all fields.");
      return;
    }

    console.log("Course:", course);
    console.log("Chapter:", chapter);
    console.log("Videos:", videos);

    alert("Videos added successfully!");
    navigate("/instructor/courses");
  };

  return (
    <div className="container mt-4">
      <h2>Add Videos</h2>
      <p>Course: {course.title} | Chapter: {chapter.title}</p>
      {videos.map((video, index) => (
        <div key={index} className="mb-3">
          <input
            type="text"
            className="form-control mb-2"
            placeholder={`Video ${index + 1} Title`}
            value={video.title}
            onChange={(e) => handleChange(index, "title", e.target.value)}
          />
          <input
            type="file"
            className="form-control"
            accept="video/*"
            onChange={(e) => handleChange(index, "file", e.target.files[0])}
          />
        </div>
      ))}
      <button className="btn btn-primary" onClick={handleSubmit}>Submit Videos</button>
    </div>
  );
};

export default AddVideo;
