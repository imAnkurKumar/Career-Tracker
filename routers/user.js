const express = require("express");
const router = express.Router();

const userController = require("../controllers/user");
const authentication = require("../middlewares/auth");
router.use(express.static("public"));

router.get("/", userController.getLandingPage);
router.get("/signUp", userController.getSignUpPage);
router.post("/signUp", userController.postUserSignUp);

router.get("/login", userController.getLoginPage);
router.post("/login", userController.postUserLogin);

router.get("/getJobs", userController.getJobs);
module.exports = router;
