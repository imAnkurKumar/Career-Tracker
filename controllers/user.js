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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // --- Filtering Parameters ---
    const { search, location, type, minSalary, maxSalary } = req.query;
    const query = {};

    // Keyword search (title, description, requirements, company)
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { requirements: searchRegex },
        { company: searchRegex },
      ];
    }

    // Location filter
    if (location) {
      query.location = new RegExp(location, "i");
    }

    // Type filter
    if (type && type !== "All") {
      query.type = type;
    }

    // Robust Salary range filter
    if (minSalary || maxSalary) {
      // Ensure the salary ranges of the job overlap with the filter range
      // Job's maxSalary >= filter's minSalary AND Job's minSalary <= filter's maxSalary
      const salaryConditions = [];

      if (minSalary) {
        const parsedMinSalary = parseFloat(minSalary);
        if (!isNaN(parsedMinSalary)) {
          salaryConditions.push({ maxSalary: { $gte: parsedMinSalary } });
        }
      }
      if (maxSalary) {
        const parsedMaxSalary = parseFloat(maxSalary);
        if (!isNaN(parsedMaxSalary)) {
          salaryConditions.push({ minSalary: { $lte: parsedMaxSalary } });
        }
      }

      if (salaryConditions.length > 0) {
        query.$and = query.$and
          ? [...query.$and, ...salaryConditions]
          : salaryConditions;
      }
    }

    const jobs = await Job.find(query)
      .sort({ postedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalJobs = await Job.countDocuments(query);
    const totalPages = Math.ceil(totalJobs / limit);

    res.status(200).json({
      jobs,
      currentPage: page,
      totalPages,
      totalJobs,
      jobsPerPage: limit,
    });
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const jobSeekerId = req.user._id;

    const applications = await Application.find({ jobSeeker: jobSeekerId })
      .populate("job")
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalApplications = await Application.countDocuments({
      jobSeeker: jobSeekerId,
    });
    const totalPages = Math.ceil(totalApplications / limit);

    res.status(200).json({
      applications,
      currentPage: page,
      totalPages,
      totalApplications,
      applicationsPerPage: limit,
    });
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

    // Find the user and update their resumeUrl
    const user = await User.findByIdAndUpdate(
      userId,
      { resumeUrl: resumeUrl },
      { new: true } // Return the updated document
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
    const userId = req.user._id;
    const user = await User.findById(userId).select("-password");

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
  getJobs, // Now handles filtering
  applyForJob,
  getMyApplications,
  uploadResume,
  getUserProfile,
};
