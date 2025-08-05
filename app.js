const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routers/user");
const recruitersRoutes = require("./routers/recrutiters");
const adminRoutes = require("./routers/admin"); // Import admin routes

const app = express();

mongoose.set("strictQuery", true);

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", userRoutes);
app.use("/user", userRoutes);
app.use("/recruiter", recruitersRoutes);
app.use("/admin", adminRoutes); // Use admin routes

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(4000, () => console.log("Server running on port 4000"));
  })
  .catch((err) => console.error("MongoDB connection failed:", err.message));
