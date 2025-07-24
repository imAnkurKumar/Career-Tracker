const express = require("express");
const router = express.Router();

const userController = require("../controllers/user");
router.use(express.static("public"));

router.get("/", userController.getLandingPage);
router.get("/signUp", userController.getSignUpPage);
router.post("/signUp", userController.postUserSignUp);

router.get("/login", userController.getLoginPage);
router.post("/login", userController.postUserLogin);

module.exports = router;
