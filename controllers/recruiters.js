const bcrypt = require("bcrypt");
const User = require("../models/user");
const Job = require("../models/job");
const Application = require("../models/application"); // Import the Application model
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
    const { name, email, password } = req.body;

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
    const { email, password } = req.body;
    const user = await User.findOne({ email });
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

    const postedBy = req.user.userId;

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
    const recruiterId = req.user.userId;
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

const getApplicantsForJob = async (req, res, next) => {
  try {
    const jobId = req.params.jobId;
    const recruiterId = req.user.userId;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found." });
    }
    if (job.postedBy.toString() !== recruiterId) {
      return res
        .status(403)
        .json({
          message: "You are not authorized to view applicants for this job.",
        });
    }

    const applications = await Application.find({ job: jobId })
      .populate("jobSeeker", "name email resumeUrl")
      .sort({ appliedAt: 1 });

    if (!applications || applications.length === 0) {
      return res
        .status(200)
        .json({ message: "No applicants for this job yet.", applicants: [] });
    }

    res.status(200).json({ applicants: applications });
  } catch (err) {
    console.error("Error fetching applicants for job:", err);
    res
      .status(500)
      .json({ message: "Server error while fetching applicants." });
  }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const { applicationId } = req.params; // Get application ID from URL parameters
    const { status } = req.body; // Get new status from request body
    const recruiterId = req.user.userId; // Get recruiter ID from authenticated token

    // Validate the new status against the enum in the Application model
    const validStatuses = [
      "Pending",
      "Reviewed",
      "Interviewed",
      "Rejected",
      "Hired",
    ];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ message: "Invalid application status provided." });
    }

    // Find the application and populate the job to check ownership
    const application = await Application.findById(applicationId).populate(
      "job"
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    // Ensure the recruiter owns the job associated with this application
    if (application.job.postedBy.toString() !== recruiterId) {
      return res
        .status(403)
        .json({
          message: "You are not authorized to update this application.",
        });
    }

    // Update the application status
    application.status = status;
    await application.save();

    res
      .status(200)
      .json({
        message: "Application status updated successfully!",
        application,
      });
  } catch (err) {
    console.error("Error updating application status:", err);
    res
      .status(500)
      .json({ message: "Server error while updating application status." });
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
  getApplicantsForJob,
  updateApplicationStatus, // Export the new function
};
