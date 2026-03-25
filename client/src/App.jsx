import { useState, useRef, useEffect } from "react";
import "./App.css";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import Loading from "./Loading";

// ─── helpers ────────────────────────────────────────────────────────────────

const genId = () => crypto.randomUUID();

const todayLabel = (date) => {
  const d   = new Date(date);
  const now = new Date();
  const diff = (now - d) / 86400000;
  if (diff < 1 && now.getDate() === d.getDate()) return "Today";
  if (diff < 2 && now.getDate() - d.getDate() === 1) return "Yesterday";
  if (diff < 7) return "This Week";
  if (diff < 30) return "This Month";
  return d.toLocaleString("default", { month: "long", year: "numeric" });
};

const groupChats = (chats) => {
  const groups = {};
  [...chats].sort((a, b) => b.updatedAt - a.updatedAt).forEach((c) => {
    const label = todayLabel(c.updatedAt);
    if (!groups[label]) groups[label] = [];
    groups[label].push(c);
  });
  return groups;
};

const LS_KEY = "fastnyana_chats";

const loadChats = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
};

const saveChats = (chats) =>
  localStorage.setItem(LS_KEY, JSON.stringify(chats));

const newChat = () => ({
  id:        genId(),
  title:     "New chat",
  messages:  [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// ─── component ──────────────────────────────────────────────────────────────

function App() {
  const [chats,         setChats]         = useState(loadChats);
    const [activeChatId,  setActiveChatId]  = useState(null);
    const [question,      setQuestion]      = useState("");
    const [loadingStatus, setLoadingStatus] = useState(false);
    const [error,         setError]         = useState("");
    const [sidebarOpen,   setSidebarOpen]   = useState(true);
    const [editingId,     setEditingId]     = useState(null);   // chat being renamed
    const [editingTitle,  setEditingTitle]  = useState("");
  
    const messagesEndRef = useRef(null);
    const textareaRef    = useRef(null);
    const titleInputRef  = useRef(null);
  
      // derive active chat object
  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const messages   = activeChat?.messages || [];

  // ── persistence: save whenever chats changes ──────────────────────────────
  useEffect(() => { saveChats(chats); }, [chats]);

// ── auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── auto-resize textarea ──────────────────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  }, [question]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  }, [question]);

  const appendToAssistantMessage = (char) => {
    setMessages((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      if (last.role !== "assistant") return prev;
      const updated = [...prev];
      updated[updated.length - 1] = { ...last, text: last.text + char };
      return updated;
    });
  };

  const streamText = (text) => {
    if (!text || typeof text !== "string") {
      setLoadingStatus(false);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      if (i >= text.length) {
        clearInterval(interval);
        setLoadingStatus(false);
        return;
      }
      appendToAssistantMessage(text[i]);
      i += 1;
    }, 15);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userQuestion = question.trim();
    setError("");
    setLoadingStatus(true);
    setQuestion("");

    setMessages((prev) => [
      ...prev,
      { role: "user", text: userQuestion },
      { role: "assistant", text: "" },
    ]);

    try {
      const res = await axios.post("http://localhost:8000/ask", { question: userQuestion });
      if (res.data._status) {
        streamText(res.data.finalData);
      } else {
        setError(res.data.message || "Something went wrong");
        setLoadingStatus(false);
      }
    } catch (err) {
      console.error("Request failed:", err);
      if (err.response) {
        setError(err.response.data.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        setError("Cannot reach server. Make sure the server is running on port 8000.");
      } else {
        setError("Request error: " + err.message);
      }
      setLoadingStatus(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="app-shell">

      <header className="app-header">
        <span className="app-logo">🪘</span>
        <h1 className="app-title">Fast-nyana AI</h1>
      </header>

      <main className="app-feed">
        <div className="feed-inner">

          {messages.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">🪘</span>
              <p className="empty-heading">How can I help you today?</p>
              <p className="empty-sub">Type a message below to get started.</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={"bubble-row " + msg.role}>
              {msg.role === "assistant" && (
                <div className="avatar">🪘</div>
              )}
              <div className={"bubble " + msg.role}>
                <ReactMarkdown>
                  {msg.text || (msg.role === "assistant" && loadingStatus ? "\u200b" : "")}
                </ReactMarkdown>
                {msg.role === "assistant" && !msg.text && loadingStatus && (
                  <span className="typing-dot" />
                )}
              </div>
            </div>
          ))}

          {error && (
            <div className="error-banner">
              <span>⚠</span> {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="app-footer">
        <form className="input-form" onSubmit={handleSubmit}>
          <div className="input-box">
            <textarea
              ref={textareaRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Fast-nyana AI…"
              disabled={loadingStatus}
              rows={1}
              className="input-textarea"
            />
            <button
              type="submit"
              disabled={loadingStatus || !question.trim()}
              className="send-btn"
              aria-label="Send"
            >
              {loadingStatus ? <Loading /> : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 13V3M8 3L3 8M8 3l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
          <p className="input-hint">Enter to send · Shift+Enter for new line</p>
        </form>
      </footer>

    </div>
  );
}

export default App;
