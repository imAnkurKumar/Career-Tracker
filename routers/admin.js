// routers/admin.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");
const { authenticateToken, isAdmin } = require("../middlewares/auth");
router.use(express.static("public"));
// Public routes for admin sign-up and login
router.get("/signUp", adminController.getAdminSignUpPage);
router.post("/signUp", adminController.signUpAdmin);
router.get("/login", adminController.getAdminLoginPage);
router.post("/login", adminController.loginAdmin);

// Middleware to protect all subsequent admin routes
router.use(authenticateToken, isAdmin);

// Protected admin routes
router.get("/stats", adminController.getDashboardStats);
router.get("/users", adminController.getAllUsers);
router.delete("/users/:userId", adminController.deleteUser);

// NEW: Job management routes
router.get("/jobs", adminController.getAllJobs);
router.delete("/jobs/:jobId", adminController.deleteJob);

module.exports = router;
