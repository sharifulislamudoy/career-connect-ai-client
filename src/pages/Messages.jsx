import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router";
import {
  FaArrowLeft,
  FaComments,
  FaPaperPlane,
  FaCheck,
  FaCheckDouble,
  FaSpinner,
} from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { request, jsonRequest } from "../lib/api";
import {
  Avatar,
  PageHeading,
  SearchField,
  EmptyState,
  ErrorBanner,
} from "../components/community/CommunityUI";

import { shortDate } from "../components/community/communityUtils";

const mergeMessages = (previous, incoming) => {
  const map = new Map(previous.map((m) => [String(m._id), m]));
  for (const message of incoming)
    map.set(String(message._id), {
      ...map.get(String(message._id)),
      ...message,
    });
  return [...map.values()].sort(
    (a, b) =>
      new Date(a.timestamp) - new Date(b.timestamp) ||
      String(a._id).localeCompare(String(b._id)),
  );
};
const time = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};
export default function Messages() {
  const { user } = useAuth();
  const socket = useSocket();
  const [params, setParams] = useSearchParams();
  const partnerUid = params.get("user");
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState({});
  const [listLoading, setListLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatError, setChatError] = useState("");
  const [sending, setSending] = useState(false);
  const [olderLoading, setOlderLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [reload, setReload] = useState(0);
  const [typing, setTyping] = useState(false);
  const [connected, setConnected] = useState(!!socket?.connected);
  const [status, setStatus] = useState({});
  const current = conversations.find((c) => c.partner.uid === partnerUid);
  const conversationId = current?.conversationId;
  const activeRef = useRef(null);
  activeRef.current = current;
  const paneRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const sendingRef = useRef(false);
  const draft = drafts[conversationId] || "";
  const markRead = useCallback(
    async (id) => {
      if (!user?.uid) return;
      await request(
        "/api/messages/mark-read",
        jsonRequest("POST", { conversationId: id, userId: user.uid }),
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.conversationId === id ? { ...c, unreadCount: 0 } : c,
        ),
      );
    },
    [user?.uid],
  );
  const loadConversations = useCallback(
    async (signal) => {
      const data = await request(`/api/messages/conversations/${user.uid}`, {
        signal,
      });
      if (!data.success)
        throw new Error(data.message || "Inbox could not be loaded.");
      if (!signal?.aborted) setConversations(data.conversations);
    },
    [user?.uid],
  );
  useEffect(() => {
    if (!user?.uid) return;
    const controller = new AbortController();
    setListLoading(true);
    setError("");
    loadConversations(controller.signal)
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setListLoading(false);
      });
    return () => controller.abort();
  }, [user?.uid, reload, loadConversations]);
  useEffect(() => {
    if (!conversationId || !user?.uid) {
      setMessages([]);
      return;
    }
    const controller = new AbortController();
    setMessages([]);
    setChatLoading(true);
    setChatError("");
    setTyping(false);
    setHasMore(false);
    const query = new URLSearchParams({ userId: user.uid, limit: 50 });
    request(
      `/api/messages/conversation/${encodeURIComponent(conversationId)}?${query}`,
      { signal: controller.signal },
    )
      .then((data) => {
        if (!data.success)
          throw new Error(data.message || "Conversation could not be loaded.");
        if (!controller.signal.aborted) {
          setMessages((prev) => mergeMessages(data.messages, prev));
          setHasMore(data.hasMore);
          setConversations((prev) =>
            prev.map((c) =>
              c.conversationId === conversationId
                ? { ...c, unreadCount: 0 }
                : c,
            ),
          );
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) setChatError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setChatLoading(false);
          requestAnimationFrame(() =>
            bottomRef.current?.scrollIntoView({ block: "nearest" }),
          );
        }
      });
    return () => controller.abort();
  }, [conversationId, user?.uid, reload]);
  useEffect(() => {
    if (!socket || !conversationId) return;
    const join = () => socket.emit("join-conversation", conversationId);
    join();
    socket.on("connect", join);
    return () => {
      socket.off("connect", join);
      socket.emit("typing", { conversationId, isTyping: false });
      socket.emit("leave-conversation", conversationId);
      clearTimeout(timerRef.current);
    };
  }, [socket, conversationId]);
  useEffect(() => {
    if (!socket || !user?.uid) return;
    setConnected(socket.connected);
    const onConnect = () => {
      setConnected(true);
      loadConversations().catch((err) => setError(err.message));
    };
    const onDisconnect = () => {
      setConnected(false);
      setTyping(false);
    };
    const receive = (message) => {
      const active = activeRef.current;
      const viewing = active?.conversationId === message.conversationId;
      const reading = viewing && document.visibilityState === "visible";
      const nearBottom =
        !paneRef.current ||
        paneRef.current.scrollHeight -
          paneRef.current.scrollTop -
          paneRef.current.clientHeight <
          120;
      if (viewing) {
        setMessages((prev) => mergeMessages(prev, [message]));
        if (message.receiverId === user.uid && reading)
          markRead(message.conversationId).catch((err) =>
            setChatError(err.message),
          );
        if (nearBottom || message.senderId === user.uid)
          requestAnimationFrame(() =>
            bottomRef.current?.scrollIntoView({
              block: "nearest",
              behavior: "smooth",
            }),
          );
      }
      setConversations((prev) => {
        if (!prev.some((c) => c.conversationId === message.conversationId)) {
          loadConversations().catch(() => {});
          return prev;
        }
        return prev
          .map((c) =>
            c.conversationId === message.conversationId
              ? {
                  ...c,
                  lastMessage: message,
                  updatedAt: message.timestamp,
                  unreadCount: reading
                    ? 0
                    : message.receiverId === user.uid
                      ? (c.unreadCount || 0) + 1
                      : c.unreadCount,
                }
              : c,
          )
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    };
    const receipts = ({ userId, conversationId: id }) => {
      if (activeRef.current?.conversationId !== id || userId === user.uid)
        return;
      setMessages((prev) =>
        prev.map((m) => (m.senderId === user.uid ? { ...m, read: true } : m)),
      );
    };
    const onTyping = ({ userId, isTyping }) => {
      if (activeRef.current?.partner.uid === userId) setTyping(isTyping);
    };
    const onStatus = ({ userId, status: value }) =>
      setStatus((prev) => ({ ...prev, [userId]: value }));
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("receive-message", receive);
    socket.on("messages-read", receipts);
    socket.on("user-typing", onTyping);
    socket.on("user-status-changed", onStatus);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("receive-message", receive);
      socket.off("messages-read", receipts);
      socket.off("user-typing", onTyping);
      socket.off("user-status-changed", onStatus);
    };
  }, [socket, user?.uid, markRead, loadConversations]);
  useEffect(() => {
    const visible = () => {
      if (document.visibilityState === "visible" && activeRef.current)
        markRead(activeRef.current.conversationId).catch(() => {});
    };
    document.addEventListener("visibilitychange", visible);
    return () => document.removeEventListener("visibilitychange", visible);
  }, [markRead]);
  const editDraft = (value) => {
    setDrafts((prev) => ({ ...prev, [conversationId]: value }));
    if (!socket?.connected) return;
    socket.emit("typing", { conversationId, isTyping: !!value });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(
      () => socket.emit("typing", { conversationId, isTyping: false }),
      1500,
    );
  };
  const send = async (e) => {
    e.preventDefault();
    if (!current || !draft.trim() || sendingRef.current || chatLoading) return;
    const target = current,
      content = draft.trim(),
      originalDraft = draft;
    sendingRef.current = true;
    setSending(true);
    setChatError("");
    clearTimeout(timerRef.current);
    socket?.emit("typing", {
      conversationId: target.conversationId,
      isTyping: false,
    });
    try {
      const data = await request(
        "/api/messages/send",
        jsonRequest("POST", {
          conversationId: target.conversationId,
          senderId: user.uid,
          receiverId: target.partner.uid,
          content,
        }),
      );
      if (!data.success)
        throw new Error(data.message || "Message could not be sent.");
      setDrafts((prev) => ({
        ...prev,
        [target.conversationId]:
          prev[target.conversationId] === originalDraft
            ? ""
            : prev[target.conversationId],
      }));
      if (activeRef.current?.conversationId === target.conversationId) {
        setMessages((prev) => mergeMessages(prev, [data.data]));
        requestAnimationFrame(() =>
          bottomRef.current?.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          }),
        );
      }
      setConversations((prev) =>
        prev
          .map((c) =>
            c.conversationId === target.conversationId
              ? { ...c, lastMessage: data.data, updatedAt: data.data.timestamp }
              : c,
          )
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
      );
    } catch (err) {
      setChatError(
        `${err.message} Your draft is saved. Refresh the conversation before retrying if the connection was interrupted.`,
      );
    } finally {
      sendingRef.current = false;
      setSending(false);
      inputRef.current?.focus();
    }
  };
  const loadOlder = async () => {
    if (!messages[0] || olderLoading || !current) return;
    const id = current.conversationId;
    const height = paneRef.current?.scrollHeight || 0;
    setOlderLoading(true);
    try {
      const query = new URLSearchParams({
        userId: user.uid,
        limit: 50,
        before: messages[0].timestamp,
        beforeId: String(messages[0]._id),
      });
      const data = await request(
        `/api/messages/conversation/${encodeURIComponent(id)}?${query}`,
      );
      if (!data.success)
        throw new Error(data.message || "Older messages could not be loaded.");
      if (activeRef.current?.conversationId === id) {
        setMessages((prev) => mergeMessages(prev, data.messages));
        setHasMore(data.hasMore);
        requestAnimationFrame(() => {
          if (paneRef.current)
            paneRef.current.scrollTop += paneRef.current.scrollHeight - height;
        });
      }
    } catch (err) {
      setChatError(err.message);
    } finally {
      setOlderLoading(false);
    }
  };
  const unread = conversations.reduce(
    (sum, c) => sum + (c.unreadCount || 0),
    0,
  );
  const filtered = conversations.filter((c) =>
    `${c.partner.displayName || ""} ${c.partner.profession || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <div className="cc-container py-5 sm:py-8">
      <div className={current ? "hidden md:block" : ""}>
        <PageHeading
          eyebrow="Keep the conversation going"
          title="Your inbox."
          description="A simple space to exchange ideas and stay in touch with your connections."
        >
          <Link to="/network" className="cc-secondary">
            Find connections
          </Link>
        </PageHeading>
      </div>
      <ErrorBanner error={error} onRetry={() => setReload((v) => v + 1)} />
      <div className="cc-panel flex h-[calc(100dvh-240px)] min-h-[420px] overflow-hidden md:h-[min(720px,calc(100dvh-220px))]">
        <aside
          className={`${current ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col border-r border-gray-100 md:w-80 lg:w-96`}
          aria-label="Conversations"
        >
          <div className="border-b border-gray-100 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">
                Messages{" "}
                <span className="ml-2 rounded-lg bg-blue-50 px-2 py-1 text-xs text-blue-600">
                  {unread} unread
                </span>
              </h2>
              <span
                title={
                  connected
                    ? "Live updates connected"
                    : "Live updates reconnecting"
                }
                className={`h-2 w-2 rounded-full ${connected ? "bg-blue-500" : "bg-gray-300"}`}
              />
            </div>
            <SearchField
              label="Search conversations"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search connections"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {listLoading ? (
              <p role="status" className="p-6 text-sm text-gray-500">
                Loading inbox…
              </p>
            ) : !filtered.length ? (
              <div className="p-6 text-center text-sm text-gray-500">
                <FaComments className="mx-auto mb-3 text-3xl text-blue-200" />
                <p>
                  {search
                    ? "No conversations match this search."
                    : "Connect with someone to start a conversation."}
                </p>
                <Link
                  to="/network"
                  className="mt-4 inline-block font-semibold text-blue-600"
                >
                  Explore your network
                </Link>
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.conversationId}
                  onClick={() => setParams({ user: c.partner.uid })}
                  aria-current={
                    c.partner.uid === partnerUid ? "true" : undefined
                  }
                  className={`mb-1 flex w-full items-start gap-3 rounded-2xl p-3 text-left transition ${c.partner.uid === partnerUid ? "bg-blue-50" : "hover:bg-gray-50"}`}
                >
                  <Avatar person={c.partner} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {c.partner.displayName || "Member"}
                      </p>
                      <span className="shrink-0 text-[10px] text-gray-400">
                        {c.lastMessage ? time(c.lastMessage.timestamp) : ""}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-gray-400">
                      {c.partner.profession || "Your connection"}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-xs ${c.unreadCount ? "font-semibold text-gray-700" : "text-gray-500"}`}
                      >
                        {c.lastMessage?.senderId === user?.uid ? "You: " : ""}
                        {c.lastMessage?.content || "Say hello 👋"}
                      </p>
                      {c.unreadCount > 0 && (
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>
        <section
          className={`${current ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col bg-gray-50/60`}
          aria-label="Chat"
        >
          {!current ? (
            <div className="m-auto w-full max-w-md px-6">
              <EmptyState
                icon={FaComments}
                title={
                  partnerUid && !listLoading
                    ? "This connection is unavailable"
                    : "A conversation starts with hello"
                }
                description={
                  partnerUid && !listLoading
                    ? "You can message members after your connection is accepted."
                    : "Choose a connection from your inbox to start chatting."
                }
              />
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-gray-100 bg-white p-4">
                <button
                  className="rounded-xl p-2 text-gray-500 md:hidden"
                  aria-label="Back to inbox"
                  onClick={() => setParams({})}
                >
                  <FaArrowLeft />
                </button>
                <Avatar person={current.partner} className="h-10 w-10" />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-bold">
                    {current.partner.displayName || "Member"}
                  </h2>
                  <p className="mt-1 truncate text-xs text-gray-400">
                    {typing
                      ? "Typing…"
                      : status[partnerUid] === "online"
                        ? "Online"
                        : current.partner.profession || "Your connection"}
                  </p>
                </div>
                <Link
                  to="/network"
                  className="hidden text-xs font-semibold text-blue-600 sm:block"
                >
                  Your network
                </Link>
              </header>
              <div
                ref={paneRef}
                className="flex-1 overflow-y-auto p-4 sm:p-6"
                aria-busy={chatLoading}
              >
                {chatLoading ? (
                  <p
                    role="status"
                    className="py-12 text-center text-sm text-gray-400"
                  >
                    Loading conversation…
                  </p>
                ) : (
                  <>
                    {hasMore && (
                      <div className="mb-5 text-center">
                        <button
                          disabled={olderLoading}
                          onClick={loadOlder}
                          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs text-gray-500"
                        >
                          {olderLoading ? "Loading…" : "Load earlier messages"}
                        </button>
                      </div>
                    )}
                    {!messages.length && !chatError && (
                      <p className="py-12 text-center text-sm text-gray-400">
                        Say hello to{" "}
                        {current.partner.displayName || "your connection"}.
                      </p>
                    )}
                    {messages.map((message, i) => {
                      const mine = message.senderId === user.uid;
                      const day = shortDate(message.timestamp),
                        previousDay = i
                          ? shortDate(messages[i - 1].timestamp)
                          : "";
                      return (
                        <div key={String(message._id)}>
                          {day !== previousDay && (
                            <p className="my-5 text-center text-[11px] text-gray-400">
                              {day}
                            </p>
                          )}
                          <div
                            className={`mb-3 flex ${mine ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${mine ? "rounded-br-md bg-blue-600 text-white" : "rounded-bl-md border border-gray-100 bg-white text-gray-700"}`}
                            >
                              <p className="whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]">
                                {message.content}
                              </p>
                              <div
                                className={`mt-2 flex items-center justify-end gap-2 text-[10px] ${mine ? "text-blue-100" : "text-gray-400"}`}
                              >
                                <span>{time(message.timestamp)}</span>
                                {mine &&
                                  (message.read ? (
                                    <FaCheckDouble
                                      aria-label="Read"
                                      title="Read"
                                    />
                                  ) : (
                                    <FaCheck aria-label="Sent" title="Sent" />
                                  ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>
              <div className="border-t border-gray-100 bg-white p-3 sm:p-4">
                <ErrorBanner
                  error={chatError}
                  onRetry={() => setReload((v) => v + 1)}
                />
                {!connected && (
                  <p className="mb-2 text-[11px] text-gray-400">
                    Live updates reconnecting. Refresh to see the latest
                    messages.
                  </p>
                )}
                <form onSubmit={send} className="flex items-end gap-3">
                  <textarea
                    ref={inputRef}
                    aria-label="Write a message"
                    placeholder="Write a message…"
                    value={draft}
                    rows={2}
                    maxLength={10000}
                    onChange={(e) => editDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        !e.nativeEvent.isComposing
                      ) {
                        e.preventDefault();
                        send(e);
                      }
                    }}
                    className="max-h-32 min-h-12 flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={
                      !draft.trim() || sending || chatLoading || !!chatError
                    }
                    aria-label="Send message"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white disabled:opacity-40"
                  >
                    {sending ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaPaperPlane />
                    )}
                  </button>
                </form>
                <p className="mt-2 hidden text-[10px] text-gray-400 sm:block">
                  Enter to send • Shift + Enter for a new line
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
