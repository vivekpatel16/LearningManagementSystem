const Category = require("../models/categoryModel");

exports.addCategories = async (req, res) => {
  try {

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Only admin can deactivate course" });
    }

    const { category_name } = req.body;
    
    if (!category_name) {
      return res.status(400).json({ message: "Category name is required." });
    }

    const existingCategory = await Category.findOne({ category_name });
    if (existingCategory) {
      return res.status(409).json({ message: "Category already exists." });
    }

    const newCategory = new Category({ category_name });
    await newCategory.save();

    res.status(201).json({
      success: true,
      message: "Category added successfully.",
      data: newCategory,
    });
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).json({ message: "Server error while adding category." });
  }
};



exports.allCategories=async(req,res)=>
{
  try
  {
    const category=await Category.find();
    res.status(200).json(category);
  }
  catch(error)
  {
    console.log("error while fetching the categories",error);
    res.status(500).json({message:"server error while fetching categories"});
  }
}

exports.updateCategory = async (req,res)=>{
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Only admin can update category" });
    }
    const {category_id} = req.params;
    const category = await Category.findById(category_id);

    if(!category){
      return res.status(404).json({ message: "category not found" });
    }

    const { category_name } = req.body;

    if(category_name) category.category_name = category_name;

    await category.save();

    res.status(200).json({
      success: true,
      message: "category updated successfully.",
      data: category,
    });
  } catch (error) {
    console.error("Error updating Category:", error);
    res.status(500).json({ message: "Server error while updating Category." });
  }
}
