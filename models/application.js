const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    jobSeeker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Reviewed", "Interviewed", "Rejected", "Hired"],
      default: "Pending",
      required: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },

    resumeLink: {
      type: String,
      trim: true,
    },
    coverLetterLink: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);
