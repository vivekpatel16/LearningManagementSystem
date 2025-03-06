import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaPlus, FaTrash, FaSave } from "react-icons/fa";

const VideoManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { chapterId } = location.state || {};

  const [videos, setVideos] = useState(() => {
    return JSON.parse(localStorage.getItem(`videos-${chapterId}`)) || [];
  });

  useEffect(() => {
    localStorage.setItem(`videos-${chapterId}`, JSON.stringify(videos));
  }, [videos, chapterId]);

  const handleAddVideo = () => {
    setVideos([...videos, { id: Date.now(), title: "", fileName: "" }]);
  };

  const handleRemoveVideo = (id) => {
    setVideos(videos.filter((video) => video.id !== id));
  };

  const handleVideoChange = (index, field, value) => {
    const updatedVideos = [...videos];
    updatedVideos[index][field] = value;
    setVideos(updatedVideos);
  };

  const handleFileChange = (index, event) => {
    const file = event.target.files[0];
    if (file) {
      const updatedVideos = [...videos];
      updatedVideos[index].fileName = file.name;
      setVideos(updatedVideos);
    }
  };

  const handleSaveVideos = () => {
    if (videos.length === 0) {
      alert("Please add at least one video before saving.");
      return;
    }

    for (let video of videos) {
      if (!video.title.trim() || !video.fileName) {
        alert("Please fill in all video titles and select a file before saving.");
        return;
      }
    }

    // Store updated videos in localStorage
    localStorage.setItem(`videos-${chapterId}`, JSON.stringify(videos));

    // Navigate back to AddChapter.jsx with updated videos
    navigate(-1, { state: { chapterId, updatedVideos: videos } });
  };

  return (
    <div className="container mt-4">
      <h2>Manage Videos</h2>

      <h4>Videos</h4>
      {videos.map((video, index) => (
        <div key={video.id} className="border p-3 mb-2">
          <label>Video {index + 1} Title</label>
          <input
            type="text"
            className="form-control"
            value={video.title}
            onChange={(e) => handleVideoChange(index, "title", e.target.value)}
          />
          <label>Upload Video</label>
          <input
            type="file"
            className="form-control"
            onChange={(e) => handleFileChange(index, e)}
          />
          {video.fileName && <p>Selected: {video.fileName}</p>}
          <button className="btn btn-danger mt-2" onClick={() => handleRemoveVideo(video.id)}>
            <FaTrash /> Remove Video
          </button>
        </div>
      ))}
      <button className="btn btn-success mt-3" onClick={handleAddVideo}>
        <FaPlus /> Add Video
      </button>
      <button className="btn btn-primary mt-3 ms-2" onClick={handleSaveVideos}>
        <FaSave /> Save Changes
      </button>
    </div>
  );
};

export default VideoManagement;