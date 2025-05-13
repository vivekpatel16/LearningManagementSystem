const mongoose = require("mongoose");

const assessmentAttemptSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "UserInfo"
  },
  assessment_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Assessment"
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "CoursesInfo"
  },
  chapter_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Chapter"
  },
  attempt_number: {
    type: Number,
    default: 1
  },
  answers: [{
    question_index: Number,
    selected_options: [Number], // Array of selected option indices for multiple-choice questions
    is_correct: Boolean
  }],
  score: {
    type: Number,
    required: true
  },
  passed: {
    type: Boolean,
    default: false
  },
  time_taken: {
    type: Number, // in seconds
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
}, { timestamps: true });

module.exports = mongoose.model("AssessmentAttempt", assessmentAttemptSchema); 