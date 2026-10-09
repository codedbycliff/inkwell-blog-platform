
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Blog Platform API is running!"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected"
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully!");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
