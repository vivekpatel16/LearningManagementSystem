import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const AddChapter = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const course = location.state?.course || {}; // Get course data from state

  const [chapter, setChapter] = useState({
    title: "",
    videoCount: 0,
  });

  const handleNext = () => {
    if (!chapter.title || chapter.videoCount <= 0) {
      alert("Please enter a valid chapter title and at least one video.");
      return;
    }
    navigate("/instructor/courses/add-videos", { state: { course, chapter, numVideos: chapter.videoCount } });
  };

  return (
    <div className="container mt-4">
      <h2>Add Chapter</h2>
      <p>Course: {course.title}</p>
      <input
        type="text"
        className="form-control mb-2"
        placeholder="Chapter Title"
        value={chapter.title}
        onChange={(e) => setChapter({ ...chapter, title: e.target.value })}
      />
      <input
        type="number"
        className="form-control mb-3"
        placeholder="How many videos?"
        value={chapter.videoCount}
        onChange={(e) => setChapter({ ...chapter, videoCount: parseInt(e.target.value) || 0 })}
      />
      <button className="btn btn-primary" onClick={handleNext}>Add Videos</button>
    </div>
  );
};

export default AddChapter;
