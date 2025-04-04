const mongoose = require("mongoose");
const Video = require("./videoModel");
const UserInfo = require("./userInfoModel");

const pdfSchema = new mongoose.Schema(
    {
        video_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Video"
        },
        pdf_url: {
            type: String,
            required: true,
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "UserInfo",
        }
    }, 
    { timestamps: true }
);

module.exports = mongoose.model("PDF", pdfSchema);