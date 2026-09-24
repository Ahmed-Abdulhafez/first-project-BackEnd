const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller.cjs");
const authMiddlware = require("../middlewares/auth.middleware.cjs");
const { isAdmin } = require("../middlewares/isAdmin.middleware.cjs");

// register User
router.post("/register", userController.register);

// Verify Email
router.get("/verify-email/:token", userController.verifyEmail);

// login User
router.post("/login", userController.login);

// API GET All Users
router.get("/", authMiddlware, isAdmin, userController.getAllUsers);

// API GET Profile
router.get("/profile", authMiddlware, userController.getProfile);

// API Update Profile
router.put(
  "/profile",
  authMiddlware,
  userController.updateProfileUser,
);

// API Get a user by ID
router.get(
  "/:id",
  authMiddlware,
  isAdmin,
  userController.getUserById,
);

// API Delete User
router.delete(
  "/:id",
  authMiddlware,
  isAdmin,
  userController.deleteUser,
);

module.exports = router;
