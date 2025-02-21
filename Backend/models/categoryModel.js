const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    category_id: {
      type: String,
    },
    category_name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);


categorySchema.pre("save", async function (next) {
  if (this.isNew) {
    const lastCategory = await this.constructor.findOne({}, {}, { sort: { createdAt: -1 } });
    if (lastCategory && lastCategory.category_id) {
      const lastIdNumber = parseInt(lastCategory.category_id.slice(1)) + 1;
      this.category_id = `C${lastIdNumber}`;
    } else {
      this.category_id = "C1";
    }
  }
  next();
});

module.exports = mongoose.model("Category", categorySchema);
