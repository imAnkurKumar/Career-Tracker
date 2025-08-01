// middleware/auth.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

const SECRET_KEY = process.env.TOKEN_SECRET;

const authenticateToken = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer TOKEN"

  if (token == null) {
    return res
      .status(401)
      .json({ message: "No token provided, authorization denied." });
  }

  try {
    // Verify token
    const verified = jwt.verify(token, SECRET_KEY);
    req.user = verified; // Attach user payload to the request object
    next(); // Proceed to the next middleware/route handler
  } catch (err) {
    res.status(403).json({ message: "Token is not valid." });
  }
};

module.exports = authenticateToken;
