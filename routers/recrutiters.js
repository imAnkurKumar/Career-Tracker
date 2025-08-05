const express = require("express");
const router = express.Router();

const recruitersController = require("../controllers/recruiters");
// FIX: Destructure the imported module to get the authenticateToken function
const { authenticateToken } = require("../middlewares/auth");

router.use(express.static("public"));

router.get("/signUp", recruitersController.getSignUpPage);
router.get("/login", recruitersController.getLoginPage);
router.post("/signUp", recruitersController.signUp);
router.post("/login", recruitersController.login);

router.get(
  "/dashboard",
  authenticateToken,
  recruitersController.getRecruiterDashboard
);

router.post("/jobs", authenticateToken, recruitersController.postJob);
router.get("/my-jobs", authenticateToken, recruitersController.getMyPostedJobs);
router.get(
  "/jobs/:jobId/applicants",
  authenticateToken,
  recruitersController.getApplicantsForJob
);
router.patch(
  "/applications/:applicationId/status",
  authenticateToken,
  recruitersController.updateApplicationStatus
);

router.get(
  "/my-jobs/:jobId",
  authenticateToken,
  recruitersController.getJobById
);

router.patch("/jobs/:jobId", authenticateToken, recruitersController.editJob);
router.delete(
  "/jobs/:jobId",
  authenticateToken,
  recruitersController.deleteJob
);

// New route to get recruiter profile, protected by authentication
router.get(
  "/profile",
  authenticateToken,
  recruitersController.getRecruiterProfile
);

module.exports = router;
