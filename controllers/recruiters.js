const bcrypt = require("bcrypt");
const User = require("../models/user");
const Job = require("../models/job");
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

const getRecruiterDashboard = (req, res, next) => {
  res.sendFile(
    path.join(__dirname, "../", "public", "views", "recruiterDashboard.html")
  );
};

const signUp = async (req, res, next) => {
  try {
    const { name, email, password } = req.body; // Remove role from destructuring, set explicitly below

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
      role: "employer", // Explicitly set role for recruiter sign-up
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
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    // Check if user exists and if their role is 'employer'
    if (!user || user.role !== "employer") {
      return res
        .status(401)
        .json({ message: "Invalid credentials or not an employer account" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role }, // Include role in token payload
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
      redirect: "/recruiter/dashboard",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error." });
  }
};

const postJob = async (req, res, next) => {
  try {
    const {
      title,
      company,
      location,
      description,
      requirements,
      salary,
      type,
    } = req.body;

    // The user ID is available from the authenticated token
    const postedBy = req.user.userId;

    // Basic validation
    if (
      !title ||
      !company ||
      !location ||
      !description ||
      !requirements ||
      !postedBy
    ) {
      return res
        .status(400)
        .json({ message: "Please fill in all required fields." });
    }

    const newJob = new Job({
      title,
      company,
      location,
      description,
      requirements,
      salary,
      type,
      postedBy,
    });

    await newJob.save();
    res.status(201).json({ message: "Job posted successfully!", job: newJob });
  } catch (err) {
    console.error("Error posting job:", err);
    res.status(500).json({ message: "Server error while posting job." });
  }
};

const getMyPostedJobs = async (req, res, next) => {
  try {
    const recruiterId = req.user.userId; // Get recruiter ID from authenticated token
    const jobs = await Job.find({ postedBy: recruiterId }).sort({
      postedAt: -1,
    });

    if (!jobs || jobs.length === 0) {
      return res.status(200).json({ message: "No jobs posted yet.", jobs: [] });
    }

    res.status(200).json({ jobs });
  } catch (err) {
    console.error("Error fetching posted jobs:", err);
    res.status(500).json({ message: "Server error while fetching your jobs." });
  }
};

module.exports = {
  getSignUpPage,
  getLoginPage,
  getRecruiterDashboard,
  signUp,
  login,
  postJob,
  getMyPostedJobs,
};
