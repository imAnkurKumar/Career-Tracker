const express = require("express");
const router = express.Router();

const recruitersController = require("../controllers/recruiters");
const authenticateToken = require("../middlewares/auth");

router.use(express.static("public"));

router.get("/signUp", recruitersController.getSignUpPage);
router.get("/login", recruitersController.getLoginPage);
router.post("/signUp", recruitersController.signUp);
router.post("/login", recruitersController.login);

router.get("/dashboard", recruitersController.getRecruiterDashboard);

router.post("/jobs", authenticateToken, recruitersController.postJob);
router.get("/my-jobs", authenticateToken, recruitersController.getMyPostedJobs);
router.get(
  "/jobs/:jobId/applicants",
  authenticateToken,
  recruitersController.getApplicantsForJob
);

// New route to update application status, protected by authentication
router.patch(
  "/applications/:applicationId/status",
  authenticateToken,
  recruitersController.updateApplicationStatus
);

module.exports = router;
