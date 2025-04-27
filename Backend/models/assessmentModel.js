const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  questions: [{
    question_text: {
      type: String,
      required: false
    },
    options: [{
      text: {
        type: String,
        required: false
      },
      isCorrect: {
        type: Boolean,
        default: false
      }
    }],
    points: {
      type: Number,
      default: 1
    },
    order: {
      type: Number,
      required: false
    }
  }],
  passing_score: {
    type: Number,
    default: 70
  },
  time_limit: {
    type: Number, // in seconds
    default: 1800 // 30 minutes in seconds
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  max_attempts: {
    type: Number,
    default: 1
  }
}, { timestamps: true });

module.exports = mongoose.model("Assessment", assessmentSchema); 