const video = require("../models/videoModel");
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
    const { video_title, video_description, chapter_id } = req.body;
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
      video_length:videoLength
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
  try {
    const { chapter_id } = req.params;
    const videos=await video.find({chapter_id}).sort({order:1});

   return res.status(200).json(videos);
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

  
  exports.updateVideoOrder=async(req,res)=>
    {
        try
        {
            const {videos}=req.body;
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