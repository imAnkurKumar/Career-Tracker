// middleware/s3Upload.js
const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
require("dotenv").config(); // Load environment variables

// Configure AWS S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configure Multer-S3 for file uploads
const s3Storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_S3_BUCKET_NAME,
  //   acl: "public-read", // Or 'private' depending on your access needs
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    // Define the file name in S3. Using userId to organize files.
    // Ensure req.user._id is available from your authentication middleware
    const userId = req.user && req.user._id ? req.user._id : "anonymous"; // Fallback for safety during testing
    const fileName = `resumes/${userId}/${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
  contentType: multerS3.AUTO_CONTENT_TYPE, // Automatically set content type
});

// Create the Multer upload instance
const uploadResume = multer({
  storage: s3Storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    // Accept only PDF and DOCX files
    if (
      file.mimetype === "application/pdf" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      cb(null, true);
    } else {
      // Pass an Error object to indicate rejection
      cb(
        new Error("Invalid file type. Only PDF and DOCX files are allowed."),
        false
      );
    }
  },
}).single("resume"); // 'resume' is the name of the input field in your form

module.exports = uploadResume; // This MUST export the multer middleware function
