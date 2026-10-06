import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import {
  FaEye,
  FaTrash,
  FaRegComment,
  FaRegHeart,
  FaRegFileAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { request } from "../lib/api";
import {
  Avatar,
  PageHeading,
  SearchField,
  EmptyState,
  CardsLoading,
  ErrorBanner,
  Dialog,
} from "../components/community/CommunityUI";

import { shortDate, safeLink } from "../components/community/communityUtils";

export default function AdminPosts() {
  const { userProfile } = useAuth();
  const admin = userProfile?.userType === "admin";
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({
    posts: [],
    totalPosts: 0,
    pagination: { total: 0, totalPages: 1 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (!admin) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    request(
      `/api/admin/posts?${new URLSearchParams({ page, search: query })}`,
      { signal: controller.signal },
    )
      .then((result) => {
        if (!result.success)
          throw new Error(result.message || "Posts could not be loaded.");
        if (!controller.signal.aborted) {
          if (page > result.pagination.totalPages)
            setPage(result.pagination.totalPages);
          else setData(result);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [admin, page, query, refresh]);
  useEffect(() => {
    if (!detailId || !admin) return;
    const controller = new AbortController();
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);
    request(`/api/admin/posts/${detailId}`, { signal: controller.signal })
      .then((result) => {
        if (!result.success)
          throw new Error(result.message || "Post could not be loaded.");
        if (!controller.signal.aborted) setDetail(result.post);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setDetailError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false);
      });
    return () => controller.abort();
  }, [detailId, admin, refresh]);
  const remove = async () => {
    if (!toDelete || deleting) return;
    setDeleting(true);
    try {
      const result = await request(`/api/admin/posts/${toDelete._id}`, {
        method: "DELETE",
      });
      if (!result.success)
        throw new Error(result.message || "Post could not be deleted.");
      toast.success("Post deleted");
      setToDelete(null);
      setDetailId(null);
      setRefresh((v) => v + 1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };
  const confirmDelete = (post) => {
    setDetailId(null);
    setToDelete(post);
  };
  if (!admin) return <Navigate to="/admin/dashboard" replace />;
  return (
    <>
      <PageHeading
        eyebrow="Community management"
        title="Posts"
        description="Read community posts and their comments, and remove content when needed."
      >
        <span className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
          {data.totalPosts} total posts
        </span>
      </PageHeading>
      <section className="cc-panel mb-5 p-4">
        <SearchField
          label="Search user posts"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search post text, author name or email"
        />
      </section>
      <ErrorBanner error={error} onRetry={() => setRefresh((v) => v + 1)} />
      <p className="mb-4 text-xs text-gray-500" aria-live="polite">
        {loading ? "Loading posts…" : `${data.pagination.total} matching posts`}
      </p>
      {loading ? (
        <CardsLoading />
      ) : error ? null : !data.posts.length ? (
        <EmptyState
          icon={FaRegFileAlt}
          title="No posts found"
          description={
            query
              ? "Try a different author or keyword."
              : "User posts will appear here when they are published."
          }
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.posts.map((post) => (
              <article
                key={post._id}
                className="cc-panel flex flex-col overflow-hidden"
              >
                <div className="flex items-center gap-3 p-5">
                  <Avatar person={post.userProfile} className="h-10 w-10" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {post.userProfile?.displayName || "Member"}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      {shortDate(post.createdAt)}
                    </p>
                  </div>
                </div>
                {safeLink(post.imageUrl) && (
                  <img
                    loading="lazy"
                    src={safeLink(post.imageUrl)}
                    alt="Post attachment"
                    className="h-44 w-full bg-gray-50 object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col p-5 pt-3">
                  <p className="mb-5 line-clamp-4 whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
                    {post.content}
                  </p>
                  <div className="mt-auto">
                    <div className="mb-4 flex gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <FaRegHeart />
                        {post.likes.length} likes
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FaRegComment />
                        {post.comments.length} comments
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDetailId(post._id)}
                        className="cc-secondary flex-1"
                      >
                        <FaEye />
                        Read post
                      </button>
                      <button
                        onClick={() => confirmDelete(post)}
                        className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100"
                      >
                        <FaTrash />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {data.pagination.totalPages > 1 && (
            <nav
              aria-label="Post pages"
              className="mt-6 flex items-center justify-center gap-3"
            >
              <button
                disabled={page === 1}
                onClick={() => setPage((v) => v - 1)}
                className="cc-secondary disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                {page} / {data.pagination.totalPages}
              </span>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((v) => v + 1)}
                className="cc-secondary disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
      {detailId && (
        <Dialog
          title="Read post"
          onClose={() => setDetailId(null)}
          footer={
            detail && (
              <button
                onClick={() => confirmDelete(detail)}
                className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
              >
                <FaTrash />
                Delete post
              </button>
            )
          }
        >
          {detailLoading ? (
            <p role="status" className="text-sm text-gray-400">
              Loading post…
            </p>
          ) : detailError ? (
            <ErrorBanner
              error={detailError}
              onRetry={() => setRefresh((v) => v + 1)}
            />
          ) : (
            detail && (
              <>
                <div className="mb-5 flex items-center gap-3">
                  <Avatar person={detail.userProfile} />
                  <div>
                    <p className="font-bold">
                      {detail.userProfile?.displayName}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {detail.userEmail || detail.userId}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {shortDate(detail.createdAt)}
                    </p>
                  </div>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-700 [overflow-wrap:anywhere]">
                  {detail.content}
                </p>
                {safeLink(detail.imageUrl) && (
                  <a
                    href={safeLink(detail.imageUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={safeLink(detail.imageUrl)}
                      alt="Post attachment"
                      className="mt-5 max-h-96 w-full rounded-2xl object-contain"
                    />
                  </a>
                )}
                <h3 className="mb-4 mt-7 border-t border-gray-100 pt-5 text-sm font-bold">
                  Comments ({detail.comments.length})
                </h3>
                {!detail.comments.length && (
                  <p className="text-sm text-gray-400">No comments yet.</p>
                )}
                {detail.comments.map((comment, i) => (
                  <div
                    key={comment._id || comment.id || i}
                    className="mb-3 flex gap-3 rounded-xl bg-gray-50 p-3"
                  >
                    <Avatar person={comment.userProfile} className="h-8 w-8" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold">
                        {comment.userProfile?.displayName || "Member"}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
                        {comment.content || comment.text}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )
          )}
        </Dialog>
      )}
      {toDelete && (
        <Dialog
          title="Delete this post?"
          onClose={() => setToDelete(null)}
          busy={deleting}
          footer={
            <>
              <button
                disabled={deleting}
                onClick={() => setToDelete(null)}
                className="cc-secondary"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={remove}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete permanently"}
              </button>
            </>
          }
        >
          <p className="text-sm leading-6 text-gray-600">
            This permanently removes the post by{" "}
            <strong>
              {toDelete.userProfile?.displayName || "this member"}
            </strong>
            , including its likes and comments. This action cannot be undone.
          </p>
          <p className="mt-4 line-clamp-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
            {toDelete.content}
          </p>
        </Dialog>
      )}
    </>
  );
}
