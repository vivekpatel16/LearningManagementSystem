const videoUser=require("../models/videoUserModel");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No video uploaded" });
    }

    const { video_title, video_description, chapter_id,video_thumbnail } = req.body;
    const lastVideo = await video.findOne({ chapter_id }).sort({ order: -1 });  
    const newOrder = lastVideo ? lastVideo.order + 1 : 1;

    const videoPath = path.join(__dirname, "..", "uploads/videos", req.file.filename);
    ffmpeg.ffprobe(videoPath, async (err, metadata) => {
      if (err) {
        console.error("Error extracting video length:", err);
        return res.status(500).json({ message: "Error processing video" });
      }
    const videoLength = Math.floor(metadata.format.duration);
    const newVideo = new video({
      video_url: `/uploads/videos/${req.file.filename}`, 
      video_title: video_title,
      video_description: video_description,
      chapter_id: chapter_id,
      order:newOrder,
      video_length:videoLength,
      video_thumbnail
    });

    await newVideo.save();
    res.status(201).json({ message: "Video uploaded successfully", video: newVideo });
  });
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ message: "Server error while uploading video" });

  }
};

exports.getVideosByChapter = async (req, res) => {
  const { chapter_id } = req.params;
  try {
    const videos=await video.find({chapter_id}).sort({order:1});

   return res.status(200).json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ message: "Server error while fetching videos" });
  }
};

exports.deleteVideo=async(req,res)=>
{
  const {video_id}=req.params;
    try{
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
  const { video_id } = req.params;
    try {
     
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
      if(req.body.video_thumbnail) updateFields.video_thumbnail=req.body.video_thumbnail;
      
      
      if(req.body.video_length && !req.file) {
        updateFields.video_length = req.body.video_length;
      }
     
      if (req.file) {
        
        const oldVideoPath = path.join(__dirname, "..", foundVideo.video_url);
        if (fs.existsSync(oldVideoPath)) {
          fs.unlinkSync(oldVideoPath);
        }
  
        updateFields.video_url = `/uploads/videos/${req.file.filename}`;
        
       
        const videoPath = path.join(__dirname, "..", "uploads/videos", req.file.filename);
        
      
        return ffmpeg.ffprobe(videoPath, async (err, metadata) => {
          if (err) {
            console.error("Error extracting video length:", err);
            return res.status(500).json({ message: "Error processing video" });
          }
          
          
          const videoLength = Math.floor(metadata.format.duration);
          console.log("Updated video length:", videoLength);
          
          
          updateFields.video_length = videoLength;
          
         
          const updatedVideo = await video.findByIdAndUpdate(
            video_id,
            { $set: updateFields },
            { new: true }
          );
          
          return res.status(200).json({ 
            message: "Video details updated successfully", 
            updatedVideo 
          });
        });
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

  
  exports.updateVideoOrder=async(req,res)=>
    {
      const {videos}=req.body;
        try
        {
            if(!videos || !Array.isArray(videos))
            {
                return res.status(400).json({message:"invalid video data"});
            }
            
            const updateOrder=videos.map((videoItem,index)=>
            {
              const updateData={order:index+1};
              if(videoItem.chapter_id)
              {
                updateData.chapter_id=videoItem.chapter_id;
              }
              return video.findByIdAndUpdate(
                videoItem.id,
                {$set:updateData},
                {new:true}
              );
            });
           await Promise.all(updateOrder);
           return res.status(200).json({message:"video order updated successfully"});
        }
        catch(error)
        {
            console.log("server error while updating video order",error);
            res.status(500).json({message:"server error while updating vidoe order"});
        }
    
    };


exports.getVideoProgress = async (req, res) => {
  const { user_id, course_id, video_id } = req.params;
  try {
    if (!user_id || !course_id || !video_id) {
      return res.status(400).json({message: "Missing required parameters: user_id, course_id, or video_id"});
    }

    // Ensure the requesting user can only access their own progress
    if (user_id !== req.user.id) {
      return res.status(403).json({message: "Unauthorized to access this user's progress"});
    }

    // Find the progress record
    const progress = await videoUser.findOne({
      user_id: user_id,
      course_id: course_id,
      video_id: video_id
    });

    let result = {
      success: true,
      data: {
        current_time: 0,
        completed: false,
        progress_percent: 0
      }
    };

    if (progress) {
      // Use the stored progress_percent if available, otherwise calculate it
      let progressPercent = progress.progress_percent || 0;
      
      // If we don't have a stored progress_percent but have a current_time, try to calculate it
      if (progressPercent === 0 && progress.current_time > 0) {
        // Get the video details to calculate progress percentage
        const videoDetails = await video.findById(video_id);
        
        if (videoDetails && videoDetails.video_length > 0) {
          progressPercent = Math.min(
            ((progress.current_time || 0) / videoDetails.video_length) * 100,
            100
          );
          
          // Update the progress record with the calculated percentage for future use
          await videoUser.findByIdAndUpdate(
            progress._id,
            { progress_percent: progressPercent },
            { new: true }
          );
        } else {
          // If we don't have video details but have saved time, set progress to a positive value
          progressPercent = 1; // Just indicate some progress has been made
        }
      }

      result.data = {
        current_time: progress.current_time || 0,
        completed: progress.completed || false,
        progress_percent: progressPercent,
        updatedAt: progress.updatedAt
      };
    }

    // Calculate the overall course progress to include in the response
    const courseProgress = await updateCourseProgress(user_id, course_id);
    result.data.course_progress = courseProgress;

    console.log(`Retrieved progress for video ${video_id}: ${JSON.stringify(result.data)}`);
    res.status(200).json(result);
  }
  catch (error) {
    console.error("Server error while fetching video progress:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching video progress",
      error: error.message
    });
  }
};

exports.updateVideoProgress = async (req, res) => {
  const { user_id, course_id, video_id, current_time, completed, progress_percent } = req.body;
  try {
    // Validate required parameters
    if (!user_id || !course_id || !video_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: user_id, course_id, video_id"
      });
    }

    // Ensure the requesting user can only update their own progress
    if (user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this user's progress"
      });
    }

    console.log("Updating video progress:", {
      user_id,
      course_id,
      video_id,
      current_time,
      progress_percent,
      completed
    });
    
    // Ensure current_time is a number
    const safeCurrentTime = typeof current_time === 'number' ? current_time : parseFloat(current_time) || 0;
    
    // Ensure progress_percent is a number
    const safeProgressPercent = typeof progress_percent === 'number' ? progress_percent : parseFloat(progress_percent) || 0;
    
    // Make sure completed is properly set based on progress
    const isCompleted = completed || safeProgressPercent >= 95;
    
    // Update or create the progress record
    const progress = await videoUser.findOneAndUpdate(
      { 
        user_id: user_id,
        course_id: course_id,
        video_id: video_id
      },
      { 
        current_time: safeCurrentTime,
        progress_percent: safeProgressPercent,
        completed: isCompleted
      },
      {
        new: true,
        upsert: true
      }
    );

    // Calculate and update course progress
    const courseProgressPercent = await updateCourseProgress(user_id, course_id);
    
    res.status(200).json({
      success: true,
      message: "Video progress updated",
      data: {
        ...progress.toObject(),
        course_progress: courseProgressPercent
      }
    });
  }
  catch (error) {
    console.error("Server error while updating video progress:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating video progress",
      error: error.message
    });
  }
};

// Helper function to update overall course progress
const updateCourseProgress = async (user_id, course_id) => {
  try {
    // Find all videos for this course by first getting chapters, then videos
    const chapters = await require('../models/chapterModel').find({ course_id });
    const chapterIds = chapters.map(chapter => chapter._id);
    
    // Get all videos from these chapters
    const allVideos = await video.find({ chapter_id: { $in: chapterIds } });
    
    if (allVideos.length === 0) {
      return 0; // No videos, no progress to calculate
    }
    
    // Find all video progress records for this user and course
    const videoProgresses = await videoUser.find({
      user_id,
      course_id
    });
    
    const totalVideos = allVideos.length;
    let completedCount = 0;
    let totalPartialProgress = 0;
    
    // Count completed videos and add up partial progress
    videoProgresses.forEach(progress => {
      if (progress.completed) {
        completedCount++;
      } else if (progress.progress_percent > 0) {
        // Add weighted partial progress (each video counts as 1 when 100% complete)
        totalPartialProgress += progress.progress_percent / 100;
      }
    });
    
    // Calculate overall progress as completed videos plus partial progress, divided by total videos
    const progressPercent = totalVideos > 0 
      ? Math.min(100, Math.round(((completedCount + totalPartialProgress) / totalVideos) * 100))
      : 0;
    
    console.log(`Course progress for user ${user_id}, course ${course_id}: ${progressPercent}%`);
    
    return progressPercent;
  } catch (error) {
    console.error("Error updating course progress:", error);
    return 0;
  }
};