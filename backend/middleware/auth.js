
const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || "";
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found."
      });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token."
    });
  }
}

module.exports = requireAuth;
