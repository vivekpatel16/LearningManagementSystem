const video = require("../models/VideoModel");
const chapter=require("../models/chapterModel");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");


exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No video uploaded" });
    }

    const { video_title, video_description, chapter_id } = req.body;  
    console.log(req.body);
    console.log(req.file);
    console.log("Received chapter_id:", chapter_id);  // ✅ Fix logging order

    const newVideo = new video({
      video_url: `/uploads/videos/${req.file.filename}`,  // ✅ Correct file key
      video_title: video_title,
      video_description: video_description,
      chapter_id: chapter_id
    });

    await newVideo.save();
    res.status(201).json({ message: "Video uploaded successfully", video: newVideo });
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ message: "Server error while uploading video" });
  }
};

exports.getVideosByChapter = async (req, res) => {
  try {
    const { chapter_id } = req.params;
    const videos = await video.find({ chapter_id });

    if (videos.length === 0) {
      return res.status(404).json({ message: "No videos found for this chapter" });
    }

    res.status(200).json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ message: "Server error while fetching videos" });
  }
};

exports.deleteVideo=async(req,res)=>
{
    try{
        const {video_id}=req.params;
        if(!video_id)
        {
            return res.status(400).json({message:"video is required"});
        }
        const foundvideo=await video.findById(video_id);
        
        if(!foundvideo)
        {
            return res.status(404).json({message:"video does not exists"});
        }
        const videoPath = path.join(__dirname, "..", foundvideo.video_url);
    if (fs.existsSync(videoPath)) {
      fs.unlink(videoPath,(err)=>
    {
        if (err) {
            console.error("Error deleting video file:", err);
          } else {
            console.log("Video file deleted successfully.");
          }
    })
    }
    await video.findByIdAndDelete(video_id);
    res.status(200).json({message:"video deleted successfully"});
    }
    catch(error)
    {
        console.log("server error while deleteing video",error);
        res.status(500).json({message:"server error while deleting video"});
    }
}

exports.editVideoDetails = async (req, res) => {
    try {
      const { video_id } = req.params;
     
      if (!video_id) {
        return res.status(400).json({ message: "Video ID is required" });
      }
  
      const foundVideo = await video.findById(video_id); 
   
      if (!foundVideo) {
        return res.status(404).json({ message: "Video does not exist" });
      }
     
      const updateFields = {}; 
      
      if (req.body.video_title) updateFields.video_title = req.body.video_title;
      if (req.body.video_description) updateFields.video_description = req.body.video_description;
      
     
      if (req.file) {
       
        const oldVideoPath = path.join(__dirname, "..", foundVideo.video_url);
        if (fs.existsSync(oldVideoPath)) {
          fs.unlinkSync(oldVideoPath);
        }
  
       
        updateFields.video_url = `/uploads/videos/${req.file.filename}`;
      }
  
      const updatedVideo = await video.findByIdAndUpdate(
        video_id,
        { $set: updateFields },
        { new: true }
      );
  
      res.status(200).json({ message: "Video details updated successfully", updatedVideo });
    } catch (error) {
      console.error("Server error while editing video details:", error);
      res.status(500).json({ message: "Server error while editing video details" });
    }
  };