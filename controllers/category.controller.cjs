const categoryModle = require("../models/category.schema.cjs");

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Category name is required!" });
    }

    const newCategory = new categoryModle({ name });
    const saveCategory = await newCategory.save();
    return res.status(201).json({
      message: "Category created successfully",
      data: saveCategory,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Category already exists!" });
    }
    console.log("Error creating category:", error);
    return res.status(500).json({
      message: "Failed to create category",
      error: error.message,
    });
  }
};

// GET ALL category
exports.getAllCategory = async (req, res) => {
  try {
    const category = await categoryModle.find();
    return res
      .status(200)
      .json({ message: "category retrieved successfully", data: category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Category By Id
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryModle.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found!" });
    }

    return res
      .status(200)
      .json({ message: "category retrieved successfully", data: category });
  } catch (error) {
    console.log("Error getting category:", error);

    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid category ID format" });
    }

    res.status(500).json({ message: "Server Error" });
  }
};

// get Category With Products
exports.getCategoryWithProducts = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await categoryModle.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found!" });
    }

    const products = await productModel.find({ category: id });

    return res.status(200).json({
      message: "Category and related products retrieved successfully",
      data: {
        category,
        productsCount: products.length, 
        products,
      },
    });
  } catch (error) {
    console.log("Error getting category with products:", error);

    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid category ID format" });
    }

    res.status(500).json({ message: "Server Error" });
  }
};

// update Category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updatedCategory = await categoryModle.findByIdAndUpdate(
      id,
      { name: name },
      { new: true, runValidators: true },
    );
    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found!" });
    }

    return res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.log("Error updating category:", error);

    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid category ID format" });
    }

    return res.status(500).json({ message: "Server Error" });
  }
};

// Delete Category
exports.deletedCategory = async (req, res) => {
  try {
    const category = await categoryModle.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "category not found!" });
    }
    await categoryModle.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.log("Error deleting category:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
