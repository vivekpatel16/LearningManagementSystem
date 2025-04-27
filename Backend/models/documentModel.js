const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    pdf_url: {
      type: String,
      required: true,
    },
    pdf_title: {
      type: String,
      required: true
    },
    pdf_description: {
      type: String,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);