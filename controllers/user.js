const User = require("../models/user");
const Job = require("../models/job");
const Application = require("../models/application");
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

const getJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find().sort({ postedAt: -1 });
    res.status(200).json({ jobs });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error while fetching jobs." });
  }
};

const postUserSignUp = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      name: username,
      email,
      password: hashedPassword,
      role: "job_seeker",
    });

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

    if (!user || user.role !== "job_seeker") {
      return res
        .status(401)
        .json({ message: "Invalid credentials or not a job seeker account" });
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
        role: user.role,
      },
      SECRET_KEY,
      { expiresIn: "1h" }
    );
    res.status(200).json({
      message: "User logged in successfully.",
      token,
      redirect: "/views/dashboard.html",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error during login." });
  }
};

const applyForJob = async (req, res, next) => {
  try {
    const { jobId } = req.body;
    const jobSeekerId = req.user._id;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found." });
    }

    const existingApplication = await Application.findOne({
      jobSeeker: jobSeekerId,
      job: jobId,
    });
    if (existingApplication) {
      return res
        .status(400)
        .json({ message: "You have already applied for this job." });
    }

    const newApplication = new Application({
      jobSeeker: jobSeekerId,
      job: jobId,
      status: "Pending",
    });
    await newApplication.save();

    job.applicants.push(jobSeekerId);
    await job.save();

    res
      .status(201)
      .json({
        message: "Application submitted successfully!",
        application: newApplication,
      });
  } catch (err) {
    console.error("Error applying for job:", err);
    res
      .status(500)
      .json({ message: "Server error while submitting application." });
  }
};

const getMyApplications = async (req, res, next) => {
  try {
    const jobSeekerId = req.user._id;
    const applications = await Application.find({ jobSeeker: jobSeekerId })
      .populate("job")
      .sort({ appliedAt: -1 });

    if (!applications || applications.length === 0) {
      return res
        .status(200)
        .json({ message: "No applications found.", applications: [] });
    }

    res.status(200).json({ applications });
  } catch (err) {
    console.error("Error fetching applications:", err);
    res
      .status(500)
      .json({ message: "Server error while fetching your applications." });
  }
};

const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const userId = req.user._id;
    const resumeUrl = req.file.location;

    const user = await User.findByIdAndUpdate(
      userId,
      { resumeUrl: resumeUrl },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: "Resume uploaded successfully!",
      resumeUrl: user.resumeUrl,
    });
  } catch (err) {
    console.error("Error uploading resume:", err);
    if (
      err.message === "Invalid file type. Only PDF and DOCX files are allowed."
    ) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Server error during resume upload." });
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user._id; // Get user ID from authenticated token
    const user = await User.findById(userId).select("-password"); // Exclude password from the response

    if (!user) {
      return res.status(404).json({ message: "User profile not found." });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res
      .status(500)
      .json({ message: "Server error while fetching user profile." });
  }
};

module.exports = {
  getSignUpPage,
  getLoginPage,
  getLandingPage,
  postUserSignUp,
  postUserLogin,
  getJobs,
  applyForJob,
  getMyApplications,
  uploadResume,
  getUserProfile, // Export the new function
};
