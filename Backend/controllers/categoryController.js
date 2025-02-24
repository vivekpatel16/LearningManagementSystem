const Category = require("../models/categoryModel");
exports.addCategories = async (req, res) => {
  try {
    const categories = req.body;

    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ message: "No categories provided." });
    }
    const newCategories = await Category.insertMany(categories);
    res.status(201).json({
      success: true,
      message: "Categories added successfully.",
      data: newCategories,
    });
  } catch (error) {
    console.error("Error adding categories:", error);
    res.status(500).json({ message: "Server error while adding categories." });
  }
};


