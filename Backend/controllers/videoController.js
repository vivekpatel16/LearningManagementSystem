const videoUser=require("../models/videoUserModel");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const { cloudinary, uploadBase64Image } = require('../config/cloudinaryConfig');
const video = require('../models/videoModel');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Helper function to get video duration using ffprobe
const getVideoDuration = async (videoUrl) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoUrl, (err, metadata) => {
      if (err) {
        console.error("Error getting video duration with ffprobe:", err);
        resolve(0); // Resolve with 0 instead of rejecting
      } else {
        const duration = metadata.format.duration || 0;
        resolve(Math.floor(duration));
      }
    });
  });
};

exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No video uploaded" });
    }

    const { video_title, video_description, chapter_id, video_thumbnail } = req.body;
    const lastVideo = await video.findOne({ chapter_id }).sort({ order: -1 });  
    const newOrder = lastVideo ? lastVideo.order + 1 : 1;

    // Cloudinary already processed the video and gives us the URL
    const videoUrl = req.file.path;
    
    // Get video metadata from Cloudinary
    const videoPublicId = req.file.filename; // Should be the public_id from Cloudinary
    
    let videoLength = 0; // Default to 0 if we can't get the duration
    
    try {
      // Get video duration using Cloudinary's API
      const result = await cloudinary.api.resource(videoPublicId, { resource_type: 'video' });
      console.log(result);
      
      // For some videos, Cloudinary might not process duration immediately
      // Let's try to extract it from different potential places
      if (result.duration) {
        videoLength = Math.floor(result.duration);
      } else if (result.video && result.video.duration) {
        videoLength = Math.floor(result.video.duration);
      } else if (result.metadata && result.metadata.video && result.metadata.video.duration) {
        videoLength = Math.floor(result.metadata.video.duration);
      } else {
        // If we can't get duration from Cloudinary, try to get it directly from the video
        console.log("Could not extract duration from Cloudinary response, using ffprobe");
        videoLength = await getVideoDuration(videoUrl);
      }
    } catch (error) {
      console.error("Error getting video metadata from Cloudinary:", error);
      // Try to get duration using ffprobe
      try {
        videoLength = await getVideoDuration(videoUrl);
      } catch (ffprobeError) {
        console.error("Failed to get duration with ffprobe:", ffprobeError);
        videoLength = 0; // Default if all methods fail
      }
    }
    
    console.log("Final video length:", videoLength);
    
    // Upload thumbnail to Cloudinary if provided as base64
    let thumbnailUrl = '';
    if (video_thumbnail && typeof video_thumbnail === 'string' && video_thumbnail.includes('base64')) {
      try {
        thumbnailUrl = await uploadBase64Image(video_thumbnail, 'lms-thumbnails');
      } catch (error) {
        console.error("Error uploading thumbnail to Cloudinary:", error);
        return res.status(500).json({ message: "Error uploading thumbnail" });
      }
    } else if (video_thumbnail) {
      // If it's already a URL, use it directly
      thumbnailUrl = video_thumbnail;
    }
    
    // Create new video with Cloudinary URL
    const newVideo = new video({
      video_url: videoUrl, 
      video_title: video_title,
      video_description: video_description,
      chapter_id: chapter_id,
      order: newOrder,
      video_length: videoLength,
      video_thumbnail: thumbnailUrl || ''
    });

    await newVideo.save();
    res.status(201).json({ message: "Video uploaded successfully", video: newVideo });
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

exports.deleteVideo = async (req, res) => {
  try {
    const { video_id } = req.params;
    
    const foundVideo = await video.findById(video_id);
    if (!foundVideo) {
      return res.status(404).json({ message: "Video not found" });
    }
    
    // Delete from Cloudinary if it's a Cloudinary URL
    if (foundVideo.video_url && foundVideo.video_url.includes('cloudinary.com')) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = foundVideo.video_url.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];
        
        // Delete video from Cloudinary
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      } catch (deleteError) {
        console.error("Error deleting video from Cloudinary:", deleteError);
        // Continue with the deletion from DB even if Cloudinary deletion fails
      }
    }
    
    // Delete the video document from the database
    await video.findByIdAndDelete(video_id);
    
    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Server error while deleting video:", error);
    res.status(500).json({ message: "Server error while deleting video" });
  }
};

exports.editVideoDetails = async (req, res) => {
  try {
    const { video_id } = req.params;
    const { video_title, video_description, order, video_thumbnail } = req.body;

    const foundVideo = await video.findById(video_id);
    if (!foundVideo) {
      return res.status(404).json({ message: "Video not found" });
    }

    const updateFields = {
      video_title: video_title || foundVideo.video_title,
      video_description: video_description || foundVideo.video_description,
      order: order || foundVideo.order,
    };

    // Handle thumbnail update
    if (video_thumbnail) {
      // Check if the thumbnail is a base64 image that needs to be uploaded
      if (typeof video_thumbnail === 'string' && video_thumbnail.includes('base64')) {
        try {
          // Delete old thumbnail from Cloudinary if it exists
          if (foundVideo.video_thumbnail && foundVideo.video_thumbnail.includes('cloudinary.com')) {
            try {
              const urlParts = foundVideo.video_thumbnail.split('/');
              const publicIdWithExtension = urlParts[urlParts.length - 1];
              const publicId = publicIdWithExtension.split('.')[0];
              
              await cloudinary.uploader.destroy(publicId);
            } catch (deleteError) {
              console.error("Error deleting old thumbnail from Cloudinary:", deleteError);
              // Continue even if deletion fails
            }
          }
          
          // Upload new thumbnail
          const thumbnailUrl = await uploadBase64Image(video_thumbnail, 'lms-thumbnails');
          updateFields.video_thumbnail = thumbnailUrl;
        } catch (error) {
          console.error("Error uploading thumbnail to Cloudinary:", error);
          return res.status(500).json({ message: "Error uploading thumbnail" });
        }
      } else {
        // If it's already a URL, use it directly
        updateFields.video_thumbnail = video_thumbnail;
      }
    }
     
    let videoLength = 0;
    if (req.file) {
      // If there's a Cloudinary URL of the old video, delete it
      if (foundVideo.video_url && foundVideo.video_url.includes('cloudinary.com')) {
        try {
          // Extract public_id from Cloudinary URL
          const urlParts = foundVideo.video_url.split('/');
          const publicIdWithExtension = urlParts[urlParts.length - 1];
          const publicId = publicIdWithExtension.split('.')[0];
          
          // Delete old video from Cloudinary
          await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
        } catch (deleteError) {
          console.error("Error deleting old video from Cloudinary:", deleteError);
          // Continue with the update even if deletion fails
        }
      }

      // The new Cloudinary URL is in req.file.path
      updateFields.video_url = req.file.path;
      
      // Get video metadata from Cloudinary
      const videoPublicId = req.file.filename;
      
      try {
        // Get video duration using Cloudinary's API
        const result = await cloudinary.api.resource(videoPublicId, { resource_type: 'video' });
        
        if (result.duration) {
          videoLength = Math.floor(result.duration);
        } else if (result.video && result.video.duration) {
          videoLength = Math.floor(result.video.duration);
        } else if (result.metadata && result.metadata.video && result.metadata.video.duration) {
          videoLength = Math.floor(result.metadata.video.duration);
        } else {
          // If we can't get duration from Cloudinary, try to get it directly from the video
          videoLength = await getVideoDuration(req.file.path);
        }
      } catch (error) {
        console.error("Error getting video metadata from Cloudinary:", error);
        // Try ffprobe as fallback
        try {
          videoLength = await getVideoDuration(req.file.path);
        } catch (ffprobeError) {
          console.error("Failed to get duration with ffprobe:", ffprobeError);
          videoLength = 0; // Default if all methods fail
        }
      }
      
      updateFields.video_length = videoLength;
    } else {
      // If no new video file, try to get video length from existing URL
      try {
        videoLength = await getVideoDuration(foundVideo.video_url);
        if (videoLength > 0) {
          updateFields.video_length = videoLength;
        }
      } catch (error) {
        console.error("Error getting video duration from existing URL:", error);
        // Keep the existing video_length if we can't get a new one
        updateFields.video_length = foundVideo.video_length || 0;
      }
    }
    
    const updatedVideo = await video.findByIdAndUpdate(
      video_id,
      { $set: updateFields },
      { new: true }
    );

    res.status(200).json({ 
      message: "Video details updated successfully", 
      updatedVideo 
    });
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
        try {
          // Get the video details to calculate progress percentage
          const videoDetails = await video.findById(video_id);
          
          if (videoDetails) {
            // Ensure we have a valid video_length, fallback to a default if missing
            let videoLength = videoDetails.video_length;
            
            // If video_length is not set or is zero, try to calculate it from the video URL
            if (!videoLength || videoLength <= 0) {
              try {
                videoLength = await getVideoDuration(videoDetails.video_url);
                
                // Save the updated video_length to the video record if we got a valid duration
                if (videoLength > 0) {
                  await video.findByIdAndUpdate(
                    video_id,
                    { $set: { video_length: videoLength } },
                    { new: true }
                  );
                  console.log(`Updated missing video_length for video ${video_id} to ${videoLength}`);
                }
              } catch (durationError) {
                console.error(`Error getting video duration for ${video_id}:`, durationError);
                videoLength = 0;
              }
            }
            
            if (videoLength > 0) {
              progressPercent = Math.min(
                ((progress.current_time || 0) / videoLength) * 100,
                100
              );
              
              // Update the progress record with the calculated percentage for future use
              await videoUser.findByIdAndUpdate(
                progress._id,
                { progress_percent: progressPercent },
                { new: true }
              );
            } else {
              // If we still don't have a valid video length but have saved time, set progress to a positive value
              progressPercent = 1; // Just indicate some progress has been made
            }
          } else {
            // If we don't have video details but have saved time, set progress to a positive value
            progressPercent = 1; // Just indicate some progress has been made
          }
        } catch (error) {
          console.error("Error calculating progress percent:", error);
          progressPercent = progress.progress_percent || 1;
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