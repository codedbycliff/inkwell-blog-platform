
const express = require("express");
const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// GET /api/comments/:postId — list comments for a published post
router.get("/:postId", async (req, res) => {
  try {
    const { postId } = req.params;

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID."
      });
    }

    const post = await Post.findOne({
      _id: postId,
      status: "published"
    }).select("_id");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found."
      });
    }

    const comments = await Comment.find({ post: postId })
      .populate("author", "name")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, comments });
  } catch (error) {
    console.error("List comments error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to load comments."
    });
  }
});

// POST /api/comments/:postId — add a comment
router.post("/:postId", requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID."
      });
    }

    if (
      typeof content !== "string" ||
      content.trim().length < 1 ||
      content.trim().length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "Comment must contain 1–2000 characters."
      });
    }

    const post = await Post.findOne({
      _id: postId,
      status: "published"
    }).select("_id");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Published post not found."
      });
    }

    const comment = await Comment.create({
      content: content.trim(),
      author: req.user._id,
      post: post._id
    });

    await comment.populate("author", "name");

    res.status(201).json({
      success: true,
      message: "Comment added successfully.",
      comment
    });
  } catch (error) {
    console.error("Create comment error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to add comment."
    });
  }
});

// DELETE /api/comments/:id — delete your own comment
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID."
      });
    }

    const comment = await Comment.findOneAndDelete({
      _id: req.params.id,
      author: req.user._id
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found or you are not its author."
      });
    }

    res.json({
      success: true,
      message: "Comment deleted successfully."
    });
  } catch (error) {
    console.error("Delete comment error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to delete comment."
    });
  }
});

module.exports = router;
