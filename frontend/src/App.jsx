
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Search,
  PenLine,
  MessageCircle,
  LogIn,
  LogOut,
  UserPlus,
  X,
  LoaderCircle
} from "lucide-react";
import { apiRequest } from "./services/api";

function App() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("inkwell_user")) || null;
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [busy, setBusy] = useState(false);

  const [showEditor, setShowEditor] = useState(false);
  const [postForm, setPostForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "Technology",
    status: "published"
  });

  // Load published articles from MongoDB through the API
  async function loadPosts(query = "") {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ limit: "20" });

      if (query.trim()) {
        params.set("search", query.trim());
      }

      const result = await apiRequest(`/posts?${params}`);
      setPosts(result.posts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  
useEffect(() => {
  async function fetchPosts() {
    await loadPosts();
  }

  fetchPosts();
}, []);


  // Register or log in
  async function submitAuth(event) {
    event.preventDefault();
    setBusy(true);
    setNotice("");

    try {
      const endpoint =
        authMode === "register"
          ? "/auth/register"
          : "/auth/login";

      const result = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(authForm)
      });

      localStorage.setItem("inkwell_token", result.token);
      localStorage.setItem(
        "inkwell_user",
        JSON.stringify(result.user)
      );

      setUser(result.user);
      setAuthMode("");
      setAuthForm({
        name: "",
        email: "",
        password: ""
      });
      setNotice(result.message);
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Log out
  function logout() {
    localStorage.removeItem("inkwell_token");
    localStorage.removeItem("inkwell_user");

    setUser(null);
    setNotice("You have been logged out.");
  }

  // Publish a new article
  async function publishPost(event) {
    event.preventDefault();
    setBusy(true);
    setNotice("");

    try {
      const result = await apiRequest("/posts", {
        method: "POST",
        body: JSON.stringify(postForm)
      });

      setShowEditor(false);
      setPostForm({
        title: "",
        excerpt: "",
        content: "",
        category: "Technology",
        status: "published"
      });

      setNotice(result.message);
      await loadPosts(search);
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* Navigation */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-6">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight"
          >
            <span className="rounded-xl bg-emerald-600 p-2 text-white">
              <BookOpen size={22} />
            </span>
            InkWell
          </Link>

          <a
            href="#articles"
            className="hidden text-sm text-slate-600 hover:text-emerald-700 sm:block"
          >
            Explore
          </a>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden max-w-32 truncate text-sm font-medium sm:block">
                  Hi, {user.name}
                </span>

                <button
                  onClick={() => setShowEditor(true)}
                  className="flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <PenLine size={16} />
                  <span className="hidden sm:inline">Write</span>
                </button>

                <button
                  onClick={logout}
                  aria-label="Log out"
                  title="Log out"
                  className="rounded-full p-2 hover:bg-slate-100"
                >
                  <LogOut size={19} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setAuthMode("login")}
                  className="rounded-full px-3 py-2 text-sm font-semibold hover:bg-slate-100"
                >
                  Log in
                </button>

                <button
                  onClick={() => setAuthMode("register")}
                  className="flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <UserPlus size={16} />
                  Sign up
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-5 pb-14 pt-16 md:px-6 md:pt-24">
          <span className="inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            A home for your ideas
          </span>

          <h1 className="mt-7 text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            Stories worth
            <span className="block text-emerald-600">
              sharing.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Discover fresh perspectives, share what matters, and
            join a community built around great ideas.
          </p>

          {/* Search */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              loadPosts(search);
            }}
            className="mt-9 flex max-w-xl items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
          >
            <Search
              className="ml-3 shrink-0 text-slate-400"
              size={20}
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search stories and ideas..."
              className="min-w-0 flex-1 bg-transparent py-3 outline-none"
              aria-label="Search stories"
            />

            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700"
            >
              Search
            </button>
          </form>
        </section>

        {/* Articles */}
        <section
          id="articles"
          className="mx-auto max-w-6xl px-5 pb-24 md:px-6"
        >
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
              The journal
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Latest stories
            </h2>
          </div>

          {notice && (
            <div
              role="status"
              className="mb-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
            >
              {notice}

              <button
                onClick={() => setNotice("")}
                className="ml-3 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-3 py-16 text-slate-500">
              <LoaderCircle className="animate-spin" />
              Loading stories...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
              {error}

              <button
                onClick={() => loadPosts(search)}
                className="ml-3 font-semibold underline"
              >
                Retry
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <BookOpen
                className="mx-auto text-emerald-600"
                size={36}
              />

              <h3 className="mt-4 text-xl font-bold">
                Your next great read starts here.
              </h3>

              <p className="mt-2 text-slate-600">
                No published stories yet. Sign in and write the first one.
              </p>

              {!user && (
                <button
                  onClick={() => setAuthMode("register")}
                  className="mt-5 rounded-full bg-emerald-600 px-5 py-3 font-semibold text-white"
                >
                  Create an account
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <article
                  key={post._id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* Clickable article cover */}
                  <Link
                    to={`/posts/${post._id}`}
                    aria-label={`Read ${post.title}`}
                    className="flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-100 to-slate-100"
                  >
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                      />
                    ) : (
                      <BookOpen
                        size={54}
                        className="text-emerald-700/40"
                      />
                    )}
                  </Link>

                  <div className="p-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                      {post.category || "General"}
                    </p>

                    {/* Clickable article title */}
                    <Link
                      to={`/posts/${post._id}`}
                      className="mt-3 block text-xl font-bold leading-snug transition hover:text-emerald-700"
                    >
                      {post.title}
                    </Link>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                      {post.excerpt || post.content}
                    </p>

                    <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {post.author?.name || "InkWell author"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {post.createdAt
                            ? new Date(post.createdAt).toLocaleDateString()
                            : ""}
                        </p>
                      </div>

                      <Link
                        to={`/posts/${post._id}`}
                        className="flex shrink-0 items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-900"
                        aria-label={`Read ${post.title} and view comments`}
                      >
                        <MessageCircle size={17} />
                        Read
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-emerald-950 px-6 py-12 text-center text-white">
        <h2 className="text-2xl font-bold">
          Every idea deserves a voice.
        </h2>

        <p className="mt-3 text-sm text-emerald-100/80">
          © 2026 InkWell. Built for ideas worth sharing.
        </p>
      </footer>

      {/* Login and registration modal */}
      {authMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {authMode === "register"
                  ? "Join InkWell"
                  : "Welcome back"}
              </h2>

              <button
                onClick={() => setAuthMode("")}
                aria-label="Close"
              >
                <X />
              </button>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              {authMode === "register"
                ? "Create an account and share your ideas."
                : "Log in to continue your writing journey."}
            </p>

            <form onSubmit={submitAuth} className="mt-6 space-y-4">
              {authMode === "register" && (
                <input
                  required
                  minLength={2}
                  maxLength={60}
                  value={authForm.name}
                  onChange={(event) =>
                    setAuthForm({
                      ...authForm,
                      name: event.target.value
                    })
                  }
                  placeholder="Full name"
                  autoComplete="name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
                />
              )}

              <input
                required
                type="email"
                maxLength={254}
                value={authForm.email}
                onChange={(event) =>
                  setAuthForm({
                    ...authForm,
                    email: event.target.value
                  })
                }
                placeholder="Email address"
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
              />

              <input
                required
                type="password"
                minLength={8}
                maxLength={128}
                value={authForm.password}
                onChange={(event) =>
                  setAuthForm({
                    ...authForm,
                    password: event.target.value
                  })
                }
                placeholder="Password (at least 8 characters)"
                autoComplete={
                  authMode === "register"
                    ? "new-password"
                    : "current-password"
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
              />

              {notice && (
                <p role="status" className="text-sm text-rose-600">
                  {notice}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy ? (
                  <LoaderCircle className="animate-spin" size={18} />
                ) : (
                  <LogIn size={18} />
                )}

                {busy
                  ? "Please wait..."
                  : authMode === "register"
                    ? "Create account"
                    : "Log in"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-600">
              {authMode === "register"
                ? "Already have an account?"
                : "New to InkWell?"}

              <button
                onClick={() => {
                  setNotice("");
                  setAuthMode(
                    authMode === "register" ? "login" : "register"
                  );
                }}
                className="ml-1 font-semibold text-emerald-700"
              >
                {authMode === "register" ? "Log in" : "Sign up"}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* New article editor */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto w-full max-w-2xl rounded-3xl bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                Write a story
              </h2>

              <button
                onClick={() => setShowEditor(false)}
                aria-label="Close"
              >
                <X />
              </button>
            </div>

            <form onSubmit={publishPost} className="mt-6 space-y-4">
              <input
                required
                minLength={3}
                maxLength={180}
                value={postForm.title}
                onChange={(event) =>
                  setPostForm({
                    ...postForm,
                    title: event.target.value
                  })
                }
                placeholder="Story title"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
              />

              <input
                maxLength={300}
                value={postForm.excerpt}
                onChange={(event) =>
                  setPostForm({
                    ...postForm,
                    excerpt: event.target.value
                  })
                }
                placeholder="Short summary (optional)"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
              />

              <select
                value={postForm.category}
                onChange={(event) =>
                  setPostForm({
                    ...postForm,
                    category: event.target.value
                  })
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3"
              >
                <option>Technology</option>
                <option>Design</option>
                <option>Lifestyle</option>
                <option>Education</option>
                <option>Business</option>
                <option>General</option>
              </select>

              <textarea
                required
                minLength={20}
                maxLength={50000}
                rows={9}
                value={postForm.content}
                onChange={(event) =>
                  setPostForm({
                    ...postForm,
                    content: event.target.value
                  })
                }
                placeholder="Tell your story..."
                className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
              />

              {notice && (
                <p role="status" className="text-sm text-rose-600">
                  {notice}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy ? "Publishing..." : "Publish story"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
