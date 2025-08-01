const bcrypt = require("bcrypt");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const path = require("path");

const getSignUpPage = (req, res, next) => {
  res.sendFile(
    path.join(__dirname, "../", "public", "views", "recruiterSignUp.html")
  );
};

const getLoginPage = (req, res, next) => {
  res.sendFile(
    path.join(__dirname, "../", "public", "views", "recruiterLogin.html")
  );
};

const signUp = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: "employer",
    });
    await user.save();

    res.status(200).json({ message: "User created Successfully." });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error creating user" });
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email });
    if (!user || (role && user.role !== role)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.TOKEN_SECRET,
      {
        expiresIn: "2h",
      }
    );
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        name: user.name,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = { getSignUpPage, getLoginPage, signUp, login };
