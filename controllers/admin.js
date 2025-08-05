const User = require("../models/user");
const Job = require("../models/job");
const Application = require("../models/application");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");

require("dotenv").config();
const SECRET_KEY = process.env.TOKEN_SECRET;

exports.getAdminSignUpPage = (req, res) => {
  res.sendFile(path.join(__dirname, "../public/views/adminSignUp.html"));
};

exports.getAdminLoginPage = (req, res) => {
  res.sendFile(path.join(__dirname, "../public/views/adminLogin.html"));
};

exports.signUpAdmin = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists." });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });
    await newUser.save();
    res.status(201).json({ message: "Admin user created successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error creating admin user." });
  }
};

exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, role: "admin" });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Admin not found or invalid credentials." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const token = jwt.sign({ _id: user._id, role: user.role }, SECRET_KEY, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Error logging in." });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const [userCount, jobCount, applicationCount] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Application.countDocuments(),
    ]);
    res.json({ userCount, jobCount, applicationCount });
  } catch (error) {
    res.status(500).json({ message: "Error fetching dashboard stats." });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users." });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.userId);
    res.json({ message: "User deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user." });
  }
};

exports.getAllJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9; // Default to 9 for a nice 3x3 grid
    const skip = (page - 1) * limit;

    const jobs = await Job.find()
      .populate("postedBy", "name") // Populate recruiter name
      .sort({ postedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalJobs = await Job.countDocuments();
    const totalPages = Math.ceil(totalJobs / limit);

    res.json({
      jobs,
      currentPage: page,
      totalPages,
      totalJobs,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching jobs." });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    await Application.deleteMany({ job: jobId });
    await Job.findByIdAndDelete(jobId);
    res.json({
      message: "Job and all associated applications deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({ message: "Error deleting job." });
  }
};
