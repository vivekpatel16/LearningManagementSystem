const Document = require('../models/documentModel');
const DocumentUser = require('../models/documentUserModel');
const ChapterContent = require('../models/chapterContentModel');
const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');

// @desc    Create new document
// @route   POST /api/documents
// @access  Private (Instructor/Admin)
const createDocument = asyncHandler(async (req, res) => {
  const { pdf_title, pdf_description, chapter_id } = req.body;

  if (!pdf_title || !chapter_id) {
    res.status(400);
    throw new Error('Please provide document title and chapter ID');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a PDF file');
  }

  // Generate file path
  const relativePath = `uploads/pdfs/${req.file.filename}`;

  // Create document
  const document = await Document.create({
    pdf_url: relativePath,
    pdf_title,
    pdf_description
  });

  // Get highest order for content in this chapter
  const highestOrder = await ChapterContent.findOne({ chapter_id })
    .sort({ order: -1 })
    .lean();

  const newOrder = highestOrder ? highestOrder.order + 1 : 1;

  // Create chapter content entry
  await ChapterContent.create({
    chapter_id,
    content_id: document._id,
    content_type_ref: 'Document',
    order: newOrder
  });

  res.status(201).json(document);
});

// @desc    Get document by ID
// @route   GET /api/documents/:id
// @access  Public
const getDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  res.status(200).json(document);
});

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private (Instructor/Admin)
const updateDocument = asyncHandler(async (req, res) => {
  const { pdf_title, pdf_description } = req.body;
  
  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Update title and description
  document.pdf_title = pdf_title || document.pdf_title;
  document.pdf_description = pdf_description !== undefined ? pdf_description : document.pdf_description;

  // If new file uploaded, update pdf_url
  if (req.file) {
    // Delete old file if it exists
    const oldFilePath = path.join(__dirname, '..', document.pdf_url);
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }

    // Set new path
    document.pdf_url = `uploads/pdfs/${req.file.filename}`;
  }

  const updatedDocument = await document.save();

  res.status(200).json(updatedDocument);
});

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private (Instructor/Admin)
const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Delete file from storage
  const filePath = path.join(__dirname, '..', document.pdf_url);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Delete document from database
  await Document.findByIdAndDelete(req.params.id);

  // Delete chapter content references
  await ChapterContent.deleteMany({ 
    content_id: req.params.id,
    content_type_ref: 'Document'
  });

  res.status(200).json({ message: 'Document deleted successfully' });
});

// @desc    Track document progress
// @route   POST /api/documents/:id/progress
// @access  Private
const trackDocumentProgress = asyncHandler(async (req, res) => {
  const { courseId, chapterId, currentPage, totalPages, timeSpent } = req.body;
  const documentId = req.params.id;
  const userId = req.user._id;

  if (!courseId || !chapterId) {
    res.status(400);
    throw new Error('Course ID and Chapter ID are required');
  }

  // Calculate progress percentage
  const progressPercent = Math.min(100, Math.round((currentPage / totalPages) * 100));
  const completed = progressPercent >= 100;

  // Find existing record or create new one
  let docUser = await DocumentUser.findOne({
    document_id: documentId,
    user_id: userId,
    course_id: courseId,
    chapter_id: chapterId
  });

  if (docUser) {
    // Update existing record
    docUser.current_page = currentPage;
    docUser.total_pages = totalPages;
    docUser.progress_percent = progressPercent;
    docUser.completed = completed;
    docUser.time_spent += timeSpent || 0;
    docUser.last_accessed = Date.now();
    
    await docUser.save();
  } else {
    // Create new record
    docUser = await DocumentUser.create({
      document_id: documentId,
      user_id: userId,
      course_id: courseId,
      chapter_id: chapterId,
      current_page: currentPage,
      total_pages: totalPages,
      progress_percent: progressPercent,
      completed,
      time_spent: timeSpent || 0,
      last_accessed: Date.now()
    });
  }

  res.status(200).json(docUser);
});

// @desc    Get document progress for a user
// @route   GET /api/documents/:id/progress
// @access  Private
const getDocumentProgress = asyncHandler(async (req, res) => {
  const documentId = req.params.id;
  const userId = req.user._id;
  const { courseId, chapterId } = req.query;

  if (!courseId || !chapterId) {
    res.status(400);
    throw new Error('Course ID and Chapter ID are required as query parameters');
  }

  const docUser = await DocumentUser.findOne({
    document_id: documentId,
    user_id: userId,
    course_id: courseId,
    chapter_id: chapterId
  });

  if (!docUser) {
    // Return default values if no progress exists yet
    return res.status(200).json({
      document_id: documentId,
      current_page: 1,
      total_pages: 1,
      progress_percent: 0,
      completed: false,
      time_spent: 0
    });
  }

  res.status(200).json(docUser);
});

module.exports = {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  trackDocumentProgress,
  getDocumentProgress
}; 