import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaPlus, FaEdit, FaTrash, FaSave } from "react-icons/fa";

const AddChapter = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState(location.state?.course || {});
  const [chapters, setChapters] = useState(
    JSON.parse(localStorage.getItem(`course_${course.id}_chapters`)) || []
  );
  const [chapterTitle, setChapterTitle] = useState("");
  const [editingChapter, setEditingChapter] = useState(null);

  useEffect(() => {
    if (location.state?.updatedVideos && location.state?.chapterId) {
      setChapters((prevChapters) => {
        const updatedChapters = prevChapters.map((ch) =>
          ch.id === location.state.chapterId
            ? { ...ch, videos: location.state.updatedVideos }
            : ch
        );
        localStorage.setItem(`course_${course.id}_chapters`, JSON.stringify(updatedChapters));
        return updatedChapters;
      });
    } else {
      const storedChapters = JSON.parse(localStorage.getItem(`course_${course.id}_chapters`)) || [];
      setChapters(storedChapters);
    }
  }, [location.state, course.id]);

  useEffect(() => {
    if (course?.id) {
      localStorage.setItem(`course_${course.id}_chapters`, JSON.stringify(chapters));
    }
  }, [chapters, course]);

  const handleAddChapter = () => {
    if (!chapterTitle.trim()) {
      alert("Please enter a chapter title.");
      return;
    }
    if (chapters.some((ch) => ch.title.toLowerCase() === chapterTitle.toLowerCase())) {
      alert("Chapter title already exists.");
      return;
    }
    if (editingChapter) {
      setChapters((prevChapters) =>
        prevChapters.map((ch) =>
          ch.id === editingChapter.id ? { ...ch, title: chapterTitle } : ch
        )
      );
      setEditingChapter(null);
      alert("Chapter updated successfully!");
    } else {
      const newChapter = { id: Date.now(), title: chapterTitle, videos: [] };
      setChapters([...chapters, newChapter]);
      alert("Chapter added successfully!");
    }
    setChapterTitle("");
  };

  const handleEditChapter = (chapter) => {
    setChapterTitle(chapter.title);
    setEditingChapter(chapter);
  };

  const handleDeleteChapter = (id) => {
    if (window.confirm("Are you sure you want to delete this chapter?")) {
      setChapters(chapters.filter((chapter) => chapter.id !== id));
    }
  };

  const handleAddVideo = (chapter) => {
    localStorage.setItem(`course_${course.id}_chapters`, JSON.stringify(chapters));
    navigate("/instructor/courses/add-videos", { state: { chapterId: chapter.id, videos: chapter.videos, chapters } });
  };

  const handleSaveCourse = () => {
    if (chapters.length === 0) {
      alert("Please add at least one chapter before saving.");
      return;
    }

    let savedCourses = JSON.parse(localStorage.getItem("courses")) || [];
    const existingCourseIndex = savedCourses.findIndex((c) => c.id === course.id);
    
    if (existingCourseIndex !== -1) {
      savedCourses[existingCourseIndex] = { ...course, chapters };
    } else {
      savedCourses.push({ ...course, chapters });
    }

    localStorage.setItem("courses", JSON.stringify(savedCourses));
    alert("Course updated successfully!");
    navigate("/instructor/courses");
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
        <button className="btn btn-success mt-2" onClick={handleAddChapter}>
          <FaPlus /> {editingChapter ? "Update Chapter" : "Add Chapter"}
        </button>
      </div>

      <h3>Chapter List</h3>
      {chapters.length > 0 ? (
        chapters.map((chapter, index) => (
          <div key={chapter.id} className="border p-3 mb-2">
            <div className="d-flex justify-content-between align-items-center">
              <span>
                <strong>Chapter {index + 1}: {chapter.title}</strong>
              </span>
              <div>
                <button className="btn btn-secondary me-2" onClick={() => handleEditChapter(chapter)}>
                  <FaEdit /> Edit Chapter
                </button>
                <button className="btn btn-primary me-2" onClick={() => handleAddVideo(chapter)}>
                  <FaEdit /> Add/Edit Video
                </button>
                <button className="btn btn-danger" onClick={() => handleDeleteChapter(chapter.id)}>
                  <FaTrash /> Delete
                </button>
              </div>
            </div>

            {chapter.videos?.length > 0 && (
              <ul className="mt-2">
                {chapter.videos.map((video, vIndex) => (
                  <li key={vIndex}>
                    🎥 {video.title} - <i>{video.fileName}</i>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      ) : (
        <p>No chapters added yet.</p>
      )}

      <button className="btn btn-primary mt-3" onClick={handleSaveCourse}>
        <FaSave /> Save Course
      </button>
    </div>
  );
};

export default AddChapter;
