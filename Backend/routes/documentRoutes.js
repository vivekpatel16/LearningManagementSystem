const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authUserMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { 
  createDocument, 
  getDocument, 
  updateDocument, 
  deleteDocument, 
  trackDocumentProgress, 
  getDocumentProgress 
} = require('../controllers/documentController');

// Document routes
router.post('/', authenticateUser, upload.single('pdf'), createDocument);
router.get('/:id', getDocument);
router.put('/:id', authenticateUser, upload.single('pdf'), updateDocument);
router.delete('/:id', authenticateUser, deleteDocument);

// Document progress tracking routes
router.post('/:id/progress', authenticateUser, trackDocumentProgress);
router.get('/:id/progress', authenticateUser, getDocumentProgress);

module.exports = router; 