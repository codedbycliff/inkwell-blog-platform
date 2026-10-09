
const express = require("express");
const mongoose = require("mongoose");
const Post = require("../models/Post");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// GET /api/posts — list published posts
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      20,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const filter = { status: "published" };

    if (typeof req.query.category === "string" && req.query.category.trim()) {
      filter.category = req.query.category.trim();
    }

    if (typeof req.query.search === "string" && req.query.search.trim()) {
      const escaped = req.query.search.trim().slice(0, 100)
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { excerpt: { $regex: escaped, $options: "i" } }
      ];
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate("author", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter)
    ]);

    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("List posts error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to load posts."
    });
  }
});

// GET /api/posts/:id — fetch a published post
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID."
      });
    }

    const post = await Post.findOne({
      _id: req.params.id,
      status: "published"
    }).populate("author", "name");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found."
      });
    }

    res.json({ success: true, post });
  } catch (error) {
    console.error("Get post error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to load post."
    });
  }
});

// POST /api/posts — create a post
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, content, excerpt, category, coverImage, tags, status } =
      req.body;

    if (
      typeof title !== "string" ||
      typeof content !== "string" ||
      title.trim().length < 3 ||
      title.trim().length > 180 ||
      content.trim().length < 20 ||
      content.length > 50000
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid title and content."
      });
    }

    if (
      status !== undefined &&
      !["draft", "published"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid publication status."
      });
    }

    const post = await Post.create({
      title: title.trim(),
      content: content.trim(),
      excerpt: typeof excerpt === "string" ? excerpt.trim() : "",
      category: typeof category === "string" ? category.trim() : "General",
      coverImage: typeof coverImage === "string" ? coverImage.trim() : "",
      tags: Array.isArray(tags)
        ? tags.filter(tag => typeof tag === "string").slice(0, 10)
        : [],
      status: status || "published",
      author: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Post created successfully.",
      post
    });
  } catch (error) {
    console.error("Create post error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to create post."
    });
  }
});

// PATCH /api/posts/:id — edit your own post
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID."
      });
    }

    const post = await Post.findOne({
      _id: req.params.id,
      author: req.user._id
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found or you are not the author."
      });
    }

    const allowed = [
      "title", "content", "excerpt", "category",
      "coverImage", "tags", "status"
    ];

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        post.set(field, req.body[field]);
      }
    }

    await post.save();

    res.json({
      success: true,
      message: "Post updated successfully.",
      post
    });
  } catch (error) {
    console.error("Update post error:", error.message);
    res.status(400).json({
      success: false,
      message: "Unable to update post. Check the supplied fields."
    });
  }
});

// DELETE /api/posts/:id — delete your own post
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID."
      });
    }

    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      author: req.user._id
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found or you are not the author."
      });
    }

    res.json({
      success: true,
      message: "Post deleted successfully."
    });
  } catch (error) {
    console.error("Delete post error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to delete post."
    });
  }
});


router.post("/:id/like", requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid post ID." });
    }

    const post = await Post.findById(req.params.id);

    if (!post || post.status !== "published") {
      return res.status(404).json({ message: "Post not found." });
    }

    const userId = req.user._id;
    const alreadyLiked = post.likes.some(
      (id) => id.toString() === userId.toString()
    );

    if (alreadyLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.addToSet(userId);
    }

    await post.save();

    res.json({
      message: alreadyLiked ? "Like removed." : "Post liked!",
      liked: !alreadyLiked,
      likeCount: post.likes.length,
    });
  } catch (error) {
    console.error("Like post error:", error);
    res.status(500).json({ message: "Unable to update like." });
  }
});


module.exports = router;
