const Assessment = require('../models/assessmentModel');
const AssessmentAttempt = require('../models/assessmentAttemptModel');
const asyncHandler = require('express-async-handler');

// @desc    Create new assessment
// @route   POST /api/assessments
// @access  Private (Instructor/Admin)
exports.createAssessment = asyncHandler(async (req, res) => {
  console.log("Creating assessment with data:", JSON.stringify(req.body, null, 2));
  
  const {
    title,
    description,
    questions,
    passing_score,
    time_limit,
    max_attempts,
    isPublished
  } = req.body;

  // Basic validation for required fields
  if (!title || !description) {
    res.status(400);
    throw new Error('Title and description are required');
  }

  // Prepare questions array - default to empty if not provided
  let processedQuestions = [];
  
  // Process questions only if they are provided
  if (questions && Array.isArray(questions) && questions.length > 0) {
    console.log(`Processing ${questions.length} questions`);
    
    processedQuestions = questions.map((question, index) => {
      console.log(`Question ${index + 1}:`, JSON.stringify(question, null, 2));
      
      // Validate questions only if they exist
      if ((!question.text && !question.question_text) || !question.options || !Array.isArray(question.options) || question.options.length === 0) {
        const errorMsg = `Question ${index + 1} is missing text or options`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Ensure at least one option is marked as correct
      const hasCorrectOption = question.options.some(option => option.isCorrect);
      if (!hasCorrectOption) {
        const errorMsg = `Question ${index + 1} must have at least one correct option`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      const processedQuestion = {
        question_text: question.text || question.question_text,
        options: question.options,
        points: question.points || 1,
        order: index + 1
      };
      
      console.log(`Processed question ${index + 1}:`, JSON.stringify(processedQuestion, null, 2));
      return processedQuestion;
    });
  } else {
    console.log("No questions provided or questions is not an array");
  }

  // Create assessment
  const assessment = await Assessment.create({
    title,
    description,
    questions: processedQuestions,
    passing_score: passing_score || 70,
    time_limit: time_limit || 1800, // default 30 minutes in seconds
    max_attempts: max_attempts || 1,
    isPublished: isPublished !== undefined ? isPublished : false
  });

  res.status(201).json(assessment);
});

// @desc    Get assessment by ID
// @route   GET /api/assessments/:id
// @access  Public
exports.getAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    res.status(404);
    throw new Error('Assessment not found');
  }

  res.status(200).json(assessment);
});

// @desc    Update assessment
// @route   PUT /api/assessments/:id
// @access  Private (Instructor/Admin)
exports.updateAssessment = asyncHandler(async (req, res) => {
  const { 
    title, 
    description, 
    questions, 
    passing_score, 
    time_limit, 
    max_attempts, 
    isPublished 
  } = req.body;
  
  const assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    res.status(404);
    throw new Error('Assessment not found');
  }

  // If questions array is provided, process and validate them
  let processedQuestions = assessment.questions;
  if (questions && Array.isArray(questions)) {
    processedQuestions = questions.map((question, index) => {
      if (!question.question_text || !question.options || !Array.isArray(question.options) || question.options.length === 0) {
        throw new Error(`Question ${index + 1} is missing text or options`);
      }

      // Ensure at least one option is marked as correct
      const hasCorrectOption = question.options.some(option => option.isCorrect);
      if (!hasCorrectOption) {
        throw new Error(`Question ${index + 1} must have at least one correct option`);
      }

      return {
        ...question,
        order: question.order || index + 1
      };
    });
  }

  assessment.title = title || assessment.title;
  assessment.description = description || assessment.description;
  assessment.questions = processedQuestions;
  assessment.passing_score = passing_score !== undefined ? passing_score : assessment.passing_score;
  assessment.time_limit = time_limit !== undefined ? time_limit : assessment.time_limit;
  assessment.max_attempts = max_attempts !== undefined ? max_attempts : assessment.max_attempts;
  assessment.isPublished = isPublished !== undefined ? isPublished : assessment.isPublished;

  const updatedAssessment = await assessment.save();

  res.status(200).json(updatedAssessment);
});

// @desc    Delete assessment
// @route   DELETE /api/assessments/:id
// @access  Private (Instructor/Admin)
exports.deleteAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    res.status(404);
    throw new Error('Assessment not found');
  }

  await Assessment.findByIdAndDelete(req.params.id);

  res.status(200).json({ message: 'Assessment deleted successfully' });
});

// @desc    Reorder questions in assessment
// @route   PUT /api/assessments/:id/reorder-questions
// @access  Private (Instructor/Admin)
exports.reorderQuestions = asyncHandler(async (req, res) => {
  const { questionOrder } = req.body;
  const assessmentId = req.params.id;

  if (!questionOrder || !Array.isArray(questionOrder)) {
    res.status(400);
    throw new Error('questionOrder array is required');
  }

  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    res.status(404);
    throw new Error('Assessment not found');
  }

  // Create a map of question IDs to their current data
  const questionMap = {};
  assessment.questions.forEach(q => {
    questionMap[q._id.toString()] = q;
  });

  // Reorder questions based on the provided order
  const reorderedQuestions = questionOrder.map((qId, index) => {
    const question = questionMap[qId];
    if (!question) {
      throw new Error(`Question with ID ${qId} not found in assessment`);
    }
    question.order = index + 1;
    return question;
  });

  assessment.questions = reorderedQuestions;
  await assessment.save();

  res.status(200).json(assessment);
});

// @desc    Start a new assessment attempt
// @route   POST /api/assessments/:id/attempts
// @access  Private
exports.startAssessmentAttempt = asyncHandler(async (req, res) => {
  const assessmentId = req.params.id;
  const userId = req.user._id;
  const { courseId, chapterId } = req.body;

  if (!courseId || !chapterId) {
    res.status(400);
    throw new Error('Course ID and Chapter ID are required');
  }

  // Get the assessment
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    res.status(404);
    throw new Error('Assessment not found');
  }

  if (!assessment.isPublished) {
    res.status(403);
    throw new Error('This assessment is not currently available');
  }

  // Check if user has attempts remaining
  const previousAttempts = await AssessmentAttempt.find({
    user_id: userId,
    assessment_id: assessmentId,
    course_id: courseId,
    chapter_id: chapterId,
    completed: true
  }).countDocuments();

  if (previousAttempts >= assessment.max_attempts) {
    res.status(403);
    throw new Error('You have reached the maximum number of attempts for this assessment');
  }

  // Check if there's an incomplete attempt
  const incompleteAttempt = await AssessmentAttempt.findOne({
    user_id: userId,
    assessment_id: assessmentId,
    course_id: courseId,
    chapter_id: chapterId,
    completed: false
  });

  if (incompleteAttempt) {
    // Return the existing incomplete attempt
    return res.status(200).json(incompleteAttempt);
  }

  // Create a new attempt
  const attemptsRemaining = assessment.max_attempts - previousAttempts - 1;
  const attempt = await AssessmentAttempt.create({
    user_id: userId,
    assessment_id: assessmentId,
    course_id: courseId,
    chapter_id: chapterId,
    attempt_number: previousAttempts + 1,
    attempts_remaining: attemptsRemaining,
    score: 0,
    passed: false,
    completed: false,
    answers: [],
    time_taken: 0
  });

  res.status(201).json(attempt);
});

// @desc    Submit an assessment attempt
// @route   PUT /api/assessments/attempts/:attemptId
// @access  Private
exports.submitAssessmentAttempt = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { answers, timeTaken } = req.body;
  const userId = req.user._id;

  // Get the attempt
  const attempt = await AssessmentAttempt.findById(attemptId);
  if (!attempt) {
    res.status(404);
    throw new Error('Assessment attempt not found');
  }

  // Verify the attempt belongs to the user
  if (attempt.user_id.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  if (attempt.completed) {
    res.status(400);
    throw new Error('This attempt has already been submitted');
  }

  // Get the assessment to grade answers
  const assessment = await Assessment.findById(attempt.assessment_id);
  if (!assessment) {
    res.status(404);
    throw new Error('Assessment not found');
  }

  // Process and grade the answers
  let totalPoints = 0;
  let earnedPoints = 0;
  const gradedAnswers = [];

  answers.forEach(answer => {
    const question = assessment.questions.find(q => q._id.toString() === answer.question_id);
    if (!question) return;

    totalPoints += question.points || 1;

    // Check if the selected options match the correct options
    const isCorrect = checkAnswerCorrectness(question.options, answer.selected_options);
    if (isCorrect) {
      earnedPoints += question.points || 1;
    }

    gradedAnswers.push({
      question_index: question.order,
      selected_options: answer.selected_options,
      is_correct: isCorrect
    });
  });

  // Calculate score as percentage
  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = score >= assessment.passing_score;

  // Update the attempt
  attempt.answers = gradedAnswers;
  attempt.score = score;
  attempt.passed = passed;
  attempt.completed = true;
  attempt.time_taken = timeTaken || 0;
  attempt.date_completed = Date.now();

  await attempt.save();

  res.status(200).json({
    ...attempt.toObject(),
    assessment: {
      title: assessment.title,
      passing_score: assessment.passing_score
    }
  });
});

// @desc    Get all attempts for a user on an assessment
// @route   GET /api/assessments/:id/attempts
// @access  Private
exports.getUserAssessmentAttempts = asyncHandler(async (req, res) => {
  const assessmentId = req.params.id;
  const userId = req.user._id;
  const { courseId, chapterId } = req.query;

  if (!courseId || !chapterId) {
    res.status(400);
    throw new Error('Course ID and Chapter ID are required as query parameters');
  }

  const attempts = await AssessmentAttempt.find({
    user_id: userId,
    assessment_id: assessmentId,
    course_id: courseId,
    chapter_id: chapterId
  }).sort({ createdAt: -1 });

  // Get the assessment for context
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    res.status(404);
    throw new Error('Assessment not found');
  }

  res.status(200).json({
    assessment: {
      title: assessment.title,
      max_attempts: assessment.max_attempts,
      passing_score: assessment.passing_score
    },
    attempts
  });
});

// Helper function to check if selected options match the correct answers
// Not exported as it's just a helper function
const checkAnswerCorrectness = (options, selectedOptionIndices) => {
  // For multiple correct answers, all correct options must be selected and no incorrect ones
  const correctOptionIndices = options
    .map((option, index) => option.isCorrect ? index : -1)
    .filter(index => index !== -1);
  
  // Check if arrays have the same content
  const selectedSorted = [...selectedOptionIndices].sort();
  const correctSorted = [...correctOptionIndices].sort();
  
  return JSON.stringify(selectedSorted) === JSON.stringify(correctSorted);
};

// @desc    Create minimal assessment (just title and description)
// @route   POST /api/assessments/create-minimal
// @access  Private (Instructor/Admin)
exports.createMinimalAssessment = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  // Validate required fields
  if (!title || !description) {
    res.status(400);
    throw new Error('Title and description are required');
  }

  // Create assessment with minimal required fields and empty questions array
  const assessment = await Assessment.create({
    title,
    description,
    questions: [], // Start with an empty array of questions
    passing_score: 70, // Default passing score
    time_limit: 1800, // Default 30 minutes
    max_attempts: 1, // Default 1 attempt
    isPublished: false // Default to unpublished
  });

  res.status(201).json(assessment);
});

// @desc    Patch assessment (partial update)
// @route   PATCH /api/assessments/:id
// @access  Private (Instructor/Admin)
exports.patchAssessment = asyncHandler(async (req, res) => {
  console.log("Patching assessment with data:", JSON.stringify(req.body, null, 2));
  
  const assessmentId = req.params.id;
  const updateData = req.body;
  
  // Find the assessment
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    res.status(404);
    throw new Error('Assessment not found');
  }
  
  // Handle questions array if provided
  if (updateData.questions && Array.isArray(updateData.questions)) {
    console.log(`Processing ${updateData.questions.length} questions for patch`);
    
    // Process and validate questions
    const processedQuestions = updateData.questions.map((question, index) => {
      console.log(`Question ${index + 1}:`, JSON.stringify(question, null, 2));
      
      // Check for text in either property
      const questionText = question.text || question.question_text;
      if (!questionText || !question.options || !Array.isArray(question.options) || question.options.length === 0) {
        const errorMsg = `Question ${index + 1} is missing text or options`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Ensure at least one option is marked as correct
      const hasCorrectOption = question.options.some(option => option.isCorrect);
      if (!hasCorrectOption) {
        const errorMsg = `Question ${index + 1} must have at least one correct option`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Format the question properly
      const processedQuestion = {
        question_text: questionText,
        options: question.options,
        points: question.points || 1,
        order: index + 1
      };
      
      console.log(`Processed question ${index + 1}:`, JSON.stringify(processedQuestion, null, 2));
      return processedQuestion;
    });
    
    // Update the questions array
    assessment.questions = processedQuestions;
  }
  
  // Update other fields if provided
  if (updateData.title !== undefined) assessment.title = updateData.title;
  if (updateData.description !== undefined) assessment.description = updateData.description;
  if (updateData.passing_score !== undefined) assessment.passing_score = updateData.passing_score;
  if (updateData.time_limit !== undefined) assessment.time_limit = updateData.time_limit;
  if (updateData.max_attempts !== undefined) assessment.max_attempts = updateData.max_attempts;
  if (updateData.isPublished !== undefined) assessment.isPublished = updateData.isPublished;
  
  // Save the updated assessment
  const updatedAssessment = await assessment.save();
  console.log("Assessment updated successfully");
  
  res.status(200).json(updatedAssessment);
}); 