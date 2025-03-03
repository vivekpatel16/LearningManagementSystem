const VideoInfo = require("../models/VideoModel");
const User = require("../models/userInfoModel");
const Chapter = require("../models/chapterModel");

exports.addVideo = async (req, res) => {
    try {
        
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized! Please login." });
        }
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        if (user.role !== "instructor") {
            return res.status(403).json({
                success: false,
                message: "Only instructors are authorized to add videos.",
            });
        }
        const { video_url, video_title, video_description, course_id, chapter_id } = req.body;
        if (!video_url || !video_title || !video_description || !course_id || !chapter_id) {
            return res.status(400).json({ message: "All fields are required." });
        }
        const chapter = await Chapter.findById(chapter_id);
        if (!chapter) {
            return res.status(404).json({ message: "Chapter not found." });
        }
        const newVideo = new VideoInfo({
            video_url,
            video_title,
            video_description,
            course_id,
            chapter_id,
        });

        await newVideo.save();

        res.status(201).json({ message: "Video added successfully", video: newVideo });

    } catch (error) {
        console.error("Error while adding video:", error);
        res.status(500).json({ message: "Server error while adding video" });
    }
};
