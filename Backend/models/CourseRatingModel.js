const mongoose = require('mongoose');

const CourseRatingSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'UserInfo',
     required: true 
    },
  course_id: {
     type: mongoose.Schema.Types.ObjectId,
      ref: 'CoursesInfo', 
      required: true 
    },
  rating: {
     type: Number
     , min: 1,
      max: 5,
    required: true 
} 
}, { timestamps: true });

module.exports = mongoose.model('CourseRating', CourseRatingSchema);
