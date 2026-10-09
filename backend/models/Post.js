
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: 3,
      maxlength: 180
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      minlength: 20,
      maxlength: 50000
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: 300,
      default: ""
    },
    category: {
      type: String,
      trim: true,
      default: "General",
      maxlength: 60
    },
    coverImage: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2048
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    tags: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
      index: true
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }]
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ category: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
