const CommentSchema = new mongoose.Schema({
    user_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'UserInfo', 
      required: true 
    },
    video_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'VideoInfo', 
      required: true 
    },
    comment: { 
      type: String, 
      required: true,
      trim: true 
    }
  },{ timestamps: true });
  
  module.exports = mongoose.model('Comment',CommentSchema);
  