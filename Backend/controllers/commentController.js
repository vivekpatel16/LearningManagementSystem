const comment = require("../models/commentModel");

exports.addComment = async(req, res) => {
    try {
        const {user_id, video_id, comment_text} = req.body;
        if(!user_id || !video_id || !comment_text) {
            return res.status(400).json({message: "All fields required"});
        }
        const newComment = new comment({
            user_id: user_id,
            video_id: video_id,
            comment: comment_text
        });
        await newComment.save();
        res.status(200).json({message: "Added comment successfully", newComment});
    } catch(error) {
        console.log("Server error while adding comment", error);
        res.status(500).json({message: "Server error while adding comment"});
    }
};

exports.getComment = async(req, res) => {
    try {
        const {video_id} = req.params;
        if(!video_id) {
            return res.status(400).json({message: "Video ID is required"});
        }
        const fetchComment = await comment.find({video_id: video_id})
            .populate("user_id", "user_name")
            .sort({createdAt: -1});
        res.status(200).json({message: "Comments fetched successfully", comments: fetchComment});
    } catch(error) {
        console.log("Server error while getting comments for this particular video", error);
        res.status(500).json({message: "Server error while getting comments for this particular video"});
    }
};

exports.deleteComment = async(req, res) => {
    try {
        const {comment_id} = req.params;
        if(!comment_id) {
            return res.status(400).json({message: "Comment ID is required"});
        }
        const deletedComment = await comment.findByIdAndDelete(comment_id);
        if (!deletedComment) {
            return res.status(404).json({message: "Comment not found"});
        }
        res.status(200).json({message: "Deleted comment successfully", deletedComment});
    } catch(error) {
        console.log("Server error while deleting comment", error);
        res.status(500).json({message: "Server error while deleting comment"});
    }
};

exports.editComment = async(req, res) => {
    try {
        const {comment_text} = req.body;
        const {comment_id} = req.params;
        if(!comment_text || !comment_id) {
            return res.status(400).json({message: "Comment text and ID are required"});
        }
        const editedComment = await comment.findByIdAndUpdate(
            comment_id,
            {comment: comment_text},
            {new: true}
        );
        if (!editedComment) {
            return res.status(404).json({message: "Comment not found"});
        }
        res.status(200).json({message: "Edited comment successfully", editedComment});
    } catch(error) {
        console.log("Server error while editing comment", error);
        res.status(500).json({message: "Server error while editing comment"});
    }
}