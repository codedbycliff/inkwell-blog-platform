
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MessageCircle,
  Send,
  Trash2,
  Pencil,
  X,
  Save,
  Heart,
} from "lucide-react";
import { apiRequest } from "../services/api";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);

  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    category: "",
    coverImage: "",
    tags: "",
  });

  const currentUser = JSON.parse(
    localStorage.getItem("inkwell_user") || "null"
  );

  const isOwner =
    Boolean(currentUser?.id && post?.author?._id) &&
    String(currentUser.id) === String(post.author._id);

  const isLiked = (post?.likes || []).some(
    (userId) =>
      String(userId?._id || userId) === String(currentUser?.id)
  );

  const likeCount = (post?.likes || []).length;

  async function loadPost() {
    try {
      const result = await apiRequest(`/posts/${id}`);
      const loadedPost = result.post;

      setPost(loadedPost);

      setEditForm({
        title: loadedPost.title || "",
        content: loadedPost.content || "",
        excerpt: loadedPost.excerpt || "",
        category: loadedPost.category || "",
        coverImage: loadedPost.coverImage || "",
        tags: Array.isArray(loadedPost.tags)
          ? loadedPost.tags.join(", ")
          : "",
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadComments() {
    try {
      const result = await apiRequest(`/comments/${id}`);
      setComments(result.comments || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [postResult, commentsResult] = await Promise.all([
          apiRequest(`/posts/${id}`),
          apiRequest(`/comments/${id}`),
        ]);

        const loadedPost = postResult.post;

        setPost(loadedPost);
        setComments(commentsResult.comments || []);

        setEditForm({
          title: loadedPost.title || "",
          content: loadedPost.content || "",
          excerpt: loadedPost.excerpt || "",
          category: loadedPost.category || "",
          coverImage: loadedPost.coverImage || "",
          tags: Array.isArray(loadedPost.tags)
            ? loadedPost.tags.join(", ")
            : "",
        });

        setError("");
      } catch (err) {
        setError(err.message);
      }
    }

    fetchData();
  }, [id]);

  function updateEditField(event) {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function toggleLike() {
    if (!currentUser?.id) {
      setError("Please log in to like a post.");
      return;
    }

    if (likeBusy) return;

    setError("");
    setNotice("");
    setLikeBusy(true);

    try {
      const result = await apiRequest(`/posts/${id}/like`, {
        method: "POST",
      });

      // Update the like list using the confirmed server response.
      setPost((previous) => {
        if (!previous) return previous;

        const previousLikes = previous.likes || [];
        const userId = String(currentUser.id);

        const updatedLikes = result.liked
          ? [
              ...previousLikes.filter(
                (item) => String(item?._id || item) !== userId
              ),
              userId,
            ]
          : previousLikes.filter(
              (item) => String(item?._id || item) !== userId
            );

        return {
          ...previous,
          likes: updatedLikes,
        };
      });

      setNotice(result.message || "Like updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLikeBusy(false);
    }
  }

  async function savePost(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);

    try {
      const result = await apiRequest(`/posts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: editForm.title.trim(),
          content: editForm.content.trim(),
          excerpt: editForm.excerpt.trim(),
          category: editForm.category.trim(),
          coverImage: editForm.coverImage.trim(),
          tags: editForm.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });

      if (result.post) {
        setPost(result.post);
      } else {
        await loadPost();
      }

      setEditing(false);
      setNotice("Post updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deletePost() {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this post?"
    );

    if (!confirmed) return;

    setError("");
    setDeleting(true);

    try {
      await apiRequest(`/posts/${id}`, {
        method: "DELETE",
      });

      navigate("/", {
        state: { notice: "Post deleted successfully." },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  async function addComment(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      await apiRequest(`/comments/${id}`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });

      setContent("");
      setNotice("Comment added successfully.");
      await loadComments();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteComment(commentId) {
    if (!window.confirm("Delete this comment?")) return;

    setError("");

    try {
      await apiRequest(`/comments/${commentId}`, {
        method: "DELETE",
      });

      setComments((previous) =>
        previous.filter((comment) => comment._id !== commentId)
      );

      setNotice("Comment deleted successfully.");
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !post) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20">
        <p role="alert" className="text-rose-600">
          {error}
        </p>

        <Link
          to="/"
          className="mt-4 inline-block text-emerald-700"
        >
          Return home
        </Link>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="p-20 text-center">
        Loading article...
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 md:px-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700"
      >
        <ArrowLeft size={17} />
        Back to stories
      </Link>

      {error && (
        <p role="alert" className="mt-5 text-sm text-rose-600">
          {error}
        </p>
      )}

      {notice && (
        <p role="status" className="mt-5 text-sm text-emerald-700">
          {notice}
        </p>
      )}

      {isOwner && !editing && (
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setError("");
              setEditing(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 font-semibold hover:bg-slate-50"
          >
            <Pencil size={16} />
            Edit Post
          </button>

          <button
            type="button"
            onClick={deletePost}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            <Trash2 size={16} />
            {deleting ? "Deleting..." : "Delete Post"}
          </button>
        </div>
      )}

      {editing ? (
        <form
          onSubmit={savePost}
          className="mt-8 space-y-5 rounded-2xl border border-slate-200 p-5 md:p-7"
        >
          <h2 className="text-2xl font-bold">Edit your post</h2>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Title
            </label>
            <input
              name="title"
              value={editForm.title}
              onChange={updateEditField}
              required
              maxLength={200}
              className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Category
            </label>
            <input
              name="category"
              value={editForm.category}
              onChange={updateEditField}
              required
              maxLength={80}
              className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Excerpt
            </label>
            <textarea
              name="excerpt"
              value={editForm.excerpt}
              onChange={updateEditField}
              maxLength={500}
              rows={2}
              className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Content
            </label>
            <textarea
              name="content"
              value={editForm.content}
              onChange={updateEditField}
              required
              rows={10}
              className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Cover image URL
            </label>
            <input
              name="coverImage"
              type="url"
              value={editForm.coverImage}
              onChange={updateEditField}
              className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Tags
            </label>
            <input
              name="tags"
              value={editForm.tags}
              onChange={updateEditField}
              placeholder="technology, life, stories"
              className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-emerald-600"
            />
            <p className="mt-1 text-xs text-slate-500">
              Separate tags with commas.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError("");
                setEditForm({
                  title: post.title || "",
                  content: post.content || "",
                  excerpt: post.excerpt || "",
                  category: post.category || "",
                  coverImage: post.coverImage || "",
                  tags: Array.isArray(post.tags)
                    ? post.tags.join(", ")
                    : "",
                });
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-semibold hover:bg-slate-50"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <article className="mt-8">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            {post.category}
          </span>

          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            {post.title}
          </h1>

          <div className="mt-5 text-sm text-slate-500">
            By {post.author?.name || "InkWell author"} ·{" "}
            {new Date(post.createdAt).toLocaleDateString()}
          </div>

          {/* Like and unlike button */}
          <div className="mt-6">
            <button
              type="button"
              onClick={toggleLike}
              disabled={likeBusy}
              aria-pressed={isLiked}
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 font-semibold transition disabled:opacity-50 ${
                isLiked
                  ? "border-rose-200 bg-rose-50 text-rose-600"
                  : "border-slate-200 text-slate-600 hover:border-rose-200 hover:text-rose-600"
              }`}
            >
              <Heart
                size={19}
                fill={isLiked ? "currentColor" : "none"}
              />
              {likeBusy
                ? "Updating..."
                : isLiked
                  ? "Liked"
                  : "Like"}{" "}
              · {likeCount}
            </button>
          </div>

          {post.coverImage && (
            <img
              src={post.coverImage}
              alt=""
              className="mt-8 max-h-[420px] w-full rounded-3xl object-cover"
            />
          )}

          {post.excerpt && (
            <p className="mt-8 text-xl leading-8 text-slate-600">
              {post.excerpt}
            </p>
          )}

          <div className="mt-8 whitespace-pre-wrap break-words text-lg leading-9 text-slate-700">
            {post.content}
          </div>

          {post.tags?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-800"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </article>
      )}

      <section className="mt-16 border-t border-slate-200 pt-10">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <MessageCircle />
          Discussion ({comments.length})
        </h2>

        <form onSubmit={addComment} className="mt-6">
          <textarea
            required
            minLength={1}
            maxLength={2000}
            rows={3}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Share your thoughts..."
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 outline-none focus:border-emerald-600"
          />

          <button
            type="submit"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            <Send size={16} />
            Add comment
          </button>
        </form>

        <div className="mt-8 space-y-4">
          {comments.map((comment) => {
            const ownsComment =
              Boolean(currentUser?.id && comment.author?._id) &&
              String(currentUser.id) === String(comment.author._id);

            return (
              <div
                key={comment._id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {comment.author?.name || "User"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {ownsComment && (
                    <button
                      type="button"
                      onClick={() => deleteComment(comment._id)}
                      aria-label="Delete comment"
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>

                <p className="mt-3 whitespace-pre-wrap break-words leading-7 text-slate-700">
                  {comment.content}
                </p>
              </div>
            );
          })}

          {comments.length === 0 && (
            <p className="py-8 text-center text-slate-500">
              No comments yet. Start the conversation.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
