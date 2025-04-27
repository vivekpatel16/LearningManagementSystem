const express = require('express');
const router = express.Router();
const { 
  createAssessment, 
  getAssessment, 
  updateAssessment, 
  patchAssessment,
  deleteAssessment, 
  reorderQuestions, 
  startAssessmentAttempt, 
  submitAssessmentAttempt, 
  getUserAssessmentAttempts,
  createMinimalAssessment
} = require('../controllers/assessmentController');
const { authenticateUser } = require('../middleware/authUserMiddleware');
const { authorizeInstructor } = require('../middleware/roleMiddleware');

// Assessment routes
router.post('/', authenticateUser, createAssessment);
router.post('/create-minimal', authenticateUser, authorizeInstructor, createMinimalAssessment);
router.get('/:id', getAssessment);
router.put('/:id', authenticateUser, authorizeInstructor, updateAssessment);
router.patch('/:id', authenticateUser, patchAssessment);
router.delete('/:id', authenticateUser, authorizeInstructor, deleteAssessment);
router.put('/:id/reorder-questions', authenticateUser, authorizeInstructor, reorderQuestions);

// Assessment attempt routes
router.post('/:id/attempts', authenticateUser, startAssessmentAttempt);
router.get('/:id/attempts', authenticateUser, getUserAssessmentAttempts);
router.put('/attempts/:attemptId', authenticateUser, submitAssessmentAttempt);

module.exports = router; 