const mongoose=require("mongoose");
const pdfSchema=new mongoose.Schema(
    {
        pdf_id:{
            type:String,
            unqiue:true
        },
        video_id:{
            type:String,
            required:true,
            ref:Video
        },
        pdf_url:{
            type:String,
            required:true,
        },
        user_id:{
            type:String,
            required:true,
            ref:UserInfo,
        }
    },{timestamp:true}
);

pdfSchema.pre("save", async function (next) {
    if (this.isNew) {
      const lastpdf = await this.constructor
        .findOne({}, {}, { sort: { createdAt: -1 } });
  
      if (lastpdf && lastpdf.pdf_id) {
        const lastIdNumber = parseInt(lastpdf.pdf_id.slice(1)) + 1;
        this.pdf_id = `P${lastIdNumber}`;
      } else {
        this.pdf_id = "P1";
      }
    }
    next();
  });

module.export =mongoose.model("PDF",pdfSchema);