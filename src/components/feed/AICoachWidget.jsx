import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { FaRobot, FaPaperPlane, FaTimes } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import { aiRequest } from "../../lib/aiApi";

function renderMessage(text) {
  const parts = [];
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;

  for (const match of String(text).matchAll(pattern)) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const path = match[2];

    parts.push(
      <Link
        key={match.index}
        to={/^\/(?!\/)/.test(path) ? path : "/jobs"}
        className="font-medium text-blue-600 underline"
      >
        {match[1]}
      </Link>
    );

    lastIndex = match.index + match[0].length;
  }

  parts.push(String(text).slice(lastIndex));

  return parts;
}

export default function AICoachWidget({ onClose, className = "h-[600px] max-h-[80dvh]" }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef(null);
  const requestRef = useRef(null);
  const nextId = useRef(0);

  useEffect(() => {
    requestRef.current?.abort();
    requestRef.current = null;

    setConversationId(null);
    setInput("");
    setLoading(false);
    setMessages([
      {
        id: ++nextId.current,
        text: "Ask me about your profile, resume, interviews, or matching jobs.",
        isBot: true,
      },
    ]);

    return () => requestRef.current?.abort();
  }, [user?.uid]);

  useEffect(() => {
    const container = scrollRef.current;

    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (event) => {
    event.preventDefault();

    const message = input.trim();

    if (!message || !user || requestRef.current) return;

    const controller = new AbortController();
    requestRef.current = controller;

    setMessages((previous) => [
      ...previous,
      {
        id: ++nextId.current,
        text: message,
        isBot: false,
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      const data = await aiRequest(
        "/chat",
        { message, conversationId },
        controller.signal
      );

      if (controller.signal.aborted) return;

      setConversationId(data.conversationId || null);

      const recommendations = Array.isArray(data.recommendations)
        ? data.recommendations
        : [];

      const links = recommendations
        .map(
          (job) =>
            `[${job.title || "View job"} — ${
              job.company || "Company"
            }](${job.link || "/jobs"})`
        )
        .join("\n");

      const reply = data.reply || "Please try asking your question again.";

      setMessages((previous) => [
        ...previous,
        {
          id: ++nextId.current,
          text: reply + (links ? `\n\nMatching jobs:\n${links}` : ""),
          isBot: true,
        },
      ]);
    } catch (error) {
      if (controller.signal.aborted) return;

      setMessages((previous) => [
        ...previous,
        {
          id: ++nextId.current,
          text: error.message || "Could not reach your coach. Please try again.",
          isBot: true,
        },
      ]);
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  };

  return (
    <section className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}>
      <header className="flex items-center justify-between gap-3 bg-gradient-to-r from-blue-600 to-blue-800 p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/15 p-3">
            <FaRobot aria-hidden="true" />
          </div>

          <div>
            <h2 className="text-sm font-bold">AI Career Coach</h2>
            <p className="mt-1 text-xs text-blue-100">
              Guidance for your next step
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close career coach"
            className="rounded-lg p-2 hover:bg-white/15"
          >
            <FaTimes />
          </button>
        )}
      </header>

      <div
        ref={scrollRef}
        role="log"
        aria-label="Career coach conversation"
        aria-live="polite"
        aria-relevant="additions"
        className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-gray-50/50 p-4"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.isBot ? "justify-start" : "justify-end"
            }`}
          >
            <div
              className={`max-w-[90%] whitespace-pre-wrap break-words rounded-2xl p-3 text-sm leading-relaxed ${
                message.isBot
                  ? "rounded-tl-none border border-gray-200 bg-white text-gray-700"
                  : "rounded-br-none bg-blue-600 text-white"
              }`}
            >
              {message.isBot
                ? renderMessage(message.text)
                : message.text}
            </div>
          </div>
        ))}

        {loading && (
          <p role="status" className="text-xs text-gray-500">
            Your coach is thinking…
          </p>
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="flex gap-2 border-t border-gray-100 bg-white p-3"
      >
        <input
          type="text"
          aria-label="Your career question"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask your career question…"
          maxLength={4000}
          disabled={!user || loading}
          className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          aria-label="Send question"
          disabled={!user || loading || !input.trim()}
          className="shrink-0 rounded-xl bg-blue-600 px-4 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaPaperPlane aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}