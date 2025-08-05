const express = require("express");
const router = express.Router();

const userController = require("../controllers/user");
// FIX: Destructure the imported module to get the authenticateToken function
const { authenticateToken } = require("../middlewares/auth");
const uploadResume = require("../middlewares/s3Upload");

router.use(express.static("public"));

router.get("/", userController.getLandingPage);
router.get("/signUp", userController.getSignUpPage);
router.post("/signUp", userController.postUserSignUp);

router.get("/login", userController.getLoginPage);
router.post("/login", userController.postUserLogin);

router.get("/getJobs", authenticateToken, userController.getJobs);
router.post("/apply-job", authenticateToken, userController.applyForJob);
router.get(
  "/my-applications",
  authenticateToken,
  userController.getMyApplications
);

router.post(
  "/upload-resume",
  authenticateToken,
  uploadResume,
  userController.uploadResume
);

// New route for fetching user profile, protected by authentication
router.get("/profile", authenticateToken, userController.getUserProfile);

// New route to get job details by ID, protected by authentication
router.get("/jobs/:jobId", authenticateToken, userController.getJobById);

module.exports = router;
