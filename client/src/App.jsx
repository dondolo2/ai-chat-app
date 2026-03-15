import { useState, useRef, useEffect } from "react";
import "./App.css";
import axios from "axios";
import ReactMarkdown from "react-markdown";

function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
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
    if (!question.trim()) {
      setError("Please enter a question");
      return;
    }
    setError("");
    setLoadingStatus(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", text: question },
      { role: "assistant", text: "" },
    ]);
    try {
      const res = await axios.post("http://localhost:8000/ask", { question });
      if (res.data._status) {
        streamText(res.data.finalData);
      } else {
        setError(res.data.message || "Something went wrong");
        setLoadingStatus(false);
      }
    } catch (error) {
      console.error("Request failed:", error);
      if (error.response) {
        setError(error.response.data.message || `Server error: ${error.response.status}`);
      } else if (error.request) {
        setError("No response from server. Please check if the server is running.");
      } else {
        setError("Error setting up request: " + error.message);
      }
      setLoadingStatus(false);
    } finally {
      setQuestion("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#f9f9f9", color: "#111" }}>
      {/* Fixed Header */}
      <div style={{ padding: "16px 0 12px", textAlign: "center", borderBottom: "1px solid #e5e5e5", backgroundColor: "#f9f9f9", flexShrink: 0 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 600, margin: 0 }}>Pula AI Chatbot</h1>
      </div>

      {/* Scrollable messages area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 0 8px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 16px" }}>
          {messages.length === 0 && !loadingStatus && (
            <div style={{ textAlign: "center", color: "#999", marginTop: "80px", fontSize: "1rem" }}>
              Ask me anything to get started.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {messages.map((message, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    borderRadius: "18px",
                    padding: "12px 16px",
                    fontSize: "0.95rem",
                    lineHeight: "1.6",
                    backgroundColor: message.role === "user" ? "#111" : "#fff",
                    color: message.role === "user" ? "#fff" : "#111",
                    border: message.role === "assistant" ? "1px solid #e5e5e5" : "none",
                    boxShadow: message.role === "assistant" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  <ReactMarkdown>
                    {message.text || (message.role === "assistant" && loadingStatus ? "▋" : "")}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {loadingStatus && messages[messages.length - 1]?.text === "" && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "12px 16px", borderRadius: "18px", backgroundColor: "#fff", border: "1px solid #e5e5e5", color: "#999", fontSize: "0.9rem" }}>
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {error && (
            <div style={{ marginTop: "16px", padding: "12px 16px", backgroundColor: "#fff0f0", border: "1px solid #fcd0d0", borderRadius: "12px", color: "#c00", fontSize: "0.9rem" }}>
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed bottom input area */}
      <div style={{ flexShrink: 0, borderTop: "1px solid #e5e5e5", backgroundColor: "#f9f9f9", padding: "12px 16px 20px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", alignItems: "flex-end", gap: "10px", backgroundColor: "#fff", border: "1px solid #d0d0d0", borderRadius: "16px", padding: "10px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <textarea
              ref={textareaRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Pula AI... (Enter to send, Shift+Enter for new line)"
              disabled={loadingStatus}
              rows={1}
              style={{
                flex: 1,
                resize: "none",
                border: "none",
                outline: "none",
                backgroundColor: "transparent",
                fontSize: "0.95rem",
                lineHeight: "1.5",
                maxHeight: "200px",
                overflowY: "auto",
                padding: "2px 0",
                fontFamily: "inherit",
                color: "#111",
              }}
            />
            <button
              type="submit"
              disabled={loadingStatus || !question.trim()}
              style={{
                flexShrink: 0,
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: loadingStatus || !question.trim() ? "#ccc" : "#111",
                color: "#fff",
                cursor: loadingStatus || !question.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
                transition: "background-color 0.2s",
              }}
            >
              {loadingStatus ? "⏳" : "↑"}
            </button>
          </form>
          <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#aaa", marginTop: "8px" }}>
            Pula AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;