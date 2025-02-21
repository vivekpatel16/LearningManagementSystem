const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/lms");
    console.log('MongoDB Connected');
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
};

module.exports = connectDb;
