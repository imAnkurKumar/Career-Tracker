const express = require("express");
const router = express.Router();

const recruitersController = require("../controllers/recruiters");
const auth = require("../middlewares/auth");
router.use(express.static("public"));

router.get("/signUp", recruitersController.getSignUpPage);
router.get("/login", recruitersController.getLoginPage);
router.post("/signUp", recruitersController.signUp);
router.post("/login", recruitersController.login);

router.get("/dashboard", recruitersController.getRecruiterDashboard);
router.post("/jobs", auth, recruitersController.postJob);
router.get("/my-jobs", auth, recruitersController.getMyPostedJobs);
module.exports = router;
