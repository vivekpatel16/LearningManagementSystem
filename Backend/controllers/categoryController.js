const Category = require("../models/categoryModel");

exports.addCategories = async (req, res) => {
  try {
    const {category_name}=req.params;
    if(!category_name)
    {
    return res.status()
    }
  } catch (error) {
    console.error("Error adding categories:", error);
    res.status(500).json({ message: "Server error while adding categories." });
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

