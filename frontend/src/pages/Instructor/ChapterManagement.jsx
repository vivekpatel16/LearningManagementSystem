import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaPlus, FaEdit, FaTrash, FaSave } from "react-icons/fa";
import Courses_API from "../../Api/courseApi";

const ChapterManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState(location.state?.course || {});
  const [chapters, setChapters] = useState([]);
  const [chapterTitle, setChapterTitle] = useState("");
  const [editingChapter, setEditingChapter] = useState(null);

  useEffect(() => {
    if (course?._id) {
      Courses_API
        .get(`/chapter/${course._id}`)
        .then((response) => setChapters(response.data))
        .catch((error) => console.error("Error fetching chapters:", error));
    }
  }, [course]);

  const handleAddChapter = async () => {
    if (!chapterTitle.trim()) {
      alert("Please enter a chapter title.");
      return;
    }

    try {
      const response = await Courses_API.post("/chapter", {
        course_id: course._id,
        chapter_title: chapterTitle,
        chapter_description: "New Chapter",
        order: chapters.length + 1,
      });
      
      setChapters([...chapters, response.data]);
      setChapterTitle("");
      alert("Chapter added successfully!");
    } catch (error) {
      console.error("Error adding chapter:", error);
      alert("Failed to add chapter.");
    }
  };

  const handleEditChapter = (chapter) => {
    setChapterTitle(chapter.chapter_title);
    setEditingChapter(chapter);
  };

  const handleUpdateChapter = async () => {
    if (!editingChapter) return;

    try {
      await Courses_API.put(`/chapter/${editingChapter._id}`, {
        chapter_title: chapterTitle,
      });

      setChapters(
        chapters.map((ch) =>
          ch._id === editingChapter._id ? { ...ch, chapter_title: chapterTitle } : ch
        )
      );
      setEditingChapter(null);
      setChapterTitle("");
      alert("Chapter updated successfully!");
    } catch (error) {
      console.error("Error updating chapter:", error);
      alert("Failed to update chapter.");
    }
  };

  const handleDeleteChapter = async (id) => {
    if (!window.confirm("Are you sure you want to delete this chapter?")) return;

    try {
      await Courses_API.delete(`/chapter/${id}`);
      setChapters(chapters.filter((chapter) => chapter._id !== id));
      alert("Chapter deleted successfully!");
    } catch (error) {
      console.error("Error deleting chapter:", error);
      alert("Failed to delete chapter.");
    }
  };

  const handleAddVideo = (chapter) => {
    navigate("/instructor/courses/add-videos", { state: { chapterId: chapter._id, videos: chapter.videos } });
  };

  return (
    <div className="container mt-4">
      <h2>Edit Chapters for {course.title || "Untitled Course"}</h2>
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Enter Chapter Title"
          value={chapterTitle}
          onChange={(e) => setChapterTitle(e.target.value)}
        />
        <button className="btn btn-success mt-2" onClick={editingChapter ? handleUpdateChapter : handleAddChapter}>
          <FaPlus /> {editingChapter ? "Update Chapter" : "Add Chapter"}
        </button>
      </div>

      <h3>Chapter List</h3>
      {chapters.length > 0 ? (
        chapters.map((chapter, index) => (
          <div key={chapter._id} className="border p-3 mb-2">
            <div className="d-flex justify-content-between align-items-center">
              <span>
                <strong>Chapter {index + 1}: {chapter.chapter_title}</strong>
              </span>
              <div>
                <button className="btn btn-secondary me-2" onClick={() => handleEditChapter(chapter)}>
                  <FaEdit /> Edit Chapter
                </button>
                <button className="btn btn-primary me-2" onClick={() => handleAddVideo(chapter)}>
                  <FaEdit /> Add/Edit Video
                </button>
                <button className="btn btn-danger" onClick={() => handleDeleteChapter(chapter._id)}>
                  <FaTrash /> Delete
                </button>
              </div>
            </div>

            {chapter.videos?.length > 0 && (
              <ul className="mt-2">
                {chapter.videos.map((video, vIndex) => (
                  <li key={vIndex}>
                    🎥 {video.video_title} - <i>{video.video_url}</i>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      ) : (
        <p>No chapters added yet.</p>
      )}
    </div>
  );
};

export default ChapterManagement;
