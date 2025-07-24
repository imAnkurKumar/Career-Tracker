const User = require("../models/user");
const bcrypt = require("bcrypt");
const path = require("path");
const jwt = require("jsonwebtoken");

require("dotenv").config();
const SECRET_KEY = process.env.TOKEN_SECRET;

const getLandingPage = (req, res, next) => {
  res.sendFile(path.join(__dirname, "../", "public", "views", "landing.html"));
};
const getSignUpPage = (req, res, next) => {
  res.sendFile(path.join(__dirname, "../", "public", "views", "signUp.html"));
};

const getLoginPage = (req, res, next) => {
  res.sendFile(path.join(__dirname, "../", "public", "views", "login.html"));
};

const postUserSignUp = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ name: username, email, password: hashedPassword });

    await user.save();

    res.status(201).json({ message: "User created successfully." });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error during sign-up." });
  }
};

const postUserLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign(
      {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      SECRET_KEY,
      { expiresIn: "1h" }
    );
    res.status(200).json({ message: "User logged in successfully.", token });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error during login." });
  }
};

module.exports = {
  getSignUpPage,
  getLoginPage,
  getLandingPage,
  postUserSignUp,
  postUserLogin,
};
