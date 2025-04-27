const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/authUserMiddleware");
const {
  addContentToChapter,
  getChapterContent,
  moveContentBetweenChapters,
  reorderChapterContent,
  deleteChapterContent
} = require("../controllers/chapterContentController");

// Create chapter content
router.post("/:chapterId", authenticateUser, addContentToChapter);

// Get all chapter content
router.get("/chapter/:chapterId", authenticateUser, getChapterContent);

// Update content order
router.put("/reorder", authenticateUser, reorderChapterContent);

// Move content between chapters
router.put("/move", authenticateUser, moveContentBetweenChapters);

// Delete content from chapter
router.delete("/:contentId", authenticateUser, deleteChapterContent);

module.exports = router; 