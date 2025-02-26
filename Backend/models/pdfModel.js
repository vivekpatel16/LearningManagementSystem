const mongoose=require("mongoose");
const pdfSchema=new mongoose.Schema(
    {
        video_id:{
            type: mongoose.Schema.Types.ObjectId,
            required:true,
            ref:Video
        },
        pdf_url:{
            type:String,
            required:true,
        },
        user_id:{
            type: mongoose.Schema.Types.ObjectId,
            required:true,
            ref:UserInfo,
        }
    },{timestamp:true}
);



module.export =mongoose.model("PDF",pdfSchema);