const express = require("express");
const router = express.Router();

const recruitersController = require("../controllers/recruiters");
router.use(express.static("public"));

router.get("/signUp", recruitersController.getSignUpPage);
router.get("/login", recruitersController.getLoginPage);
router.post("/signUp", recruitersController.signUp);
router.post("/login", recruitersController.login);

module.exports = router;
