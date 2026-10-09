
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Comment cannot be empty"],
      trim: true,
      minlength: 1,
      maxlength: 2000
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

commentSchema.index({ post: 1, createdAt: -1 });

module.exports = mongoose.model("Comment", commentSchema);
