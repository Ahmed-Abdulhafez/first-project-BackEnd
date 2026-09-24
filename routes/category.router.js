const express = require("express");
const router = express.Router();

const categoryController = require("../controllers/category.controller.cjs");
const authMiddlware = require("../middlewares/auth.middleware.cjs");
const { isAdmin } = require("../middlewares/isAdmin.middleware.cjs");

// Create new Category
router.post(
  "/",
  authMiddlware,
  isAdmin,
  categoryController.createCategory,
);

// GET ALL Category
router.get("/", categoryController.getAllCategory);

// update Category
router.put(
  "/:id",
  authMiddlware,
  isAdmin,
  categoryController.updateCategory,
);

// get Category With Products
router.get(
  "/:id/products",
  categoryController.getCategoryWithProducts,
);


// Get Category By Id
router.get(
  "/:id",
  authMiddlware,
  isAdmin,
  categoryController.getCategoryById,
);


// API Deleted Category
router.delete(
  "/:id",
  authMiddlware,
  isAdmin,
  categoryController.deletedCategory,
);

module.exports = router;
