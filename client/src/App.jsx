import { useState } from "react";
import "./App.css";
import axios from "axios";
import ReactMarkdown from "react-markdown";

function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [error, setError] = useState("");

  const appendToAssistantMessage = (char) => {
    setMessages((prev) => {
      if (!prev.length) return prev;

      const last = prev[prev.length - 1];
      if (last.role !== "assistant") return prev;

      const updated = [...prev];
      updated[updated.length - 1] = {
        ...last,
        text: last.text + char,
      };
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

    // Persist the user question + placeholder assistant response in history
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

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111]">
      <h1 className="text-center text-3xl font-semibold pt-10 pb-6">
        Pula AI Chatbot
      </h1>

      <div className="max-w-4xl mx-auto px-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask something..."
            className="w-full h-36 resize-none rounded-xl border border-gray-200 bg-white p-4 focus:outline-none focus:ring-1 focus:ring-gray-300"
            disabled={loadingStatus}
          />

          <button 
            type="submit"
            disabled={loadingStatus}
            className="bg-black text-white px-6 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingStatus ? "Processing..." : "Ask"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        <div className="mt-10 bg-white border border-gray-200 rounded-xl p-6 min-h-[250px]">
          <div className="space-y-4">
            {messages.length === 0 && !loadingStatus && (
              <div className="text-gray-500">Ask something to start the conversation.</div>
            )}

            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl p-4 ${
                    message.role === "user"
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <ReactMarkdown>
                    {message.text || (message.role === "assistant" && loadingStatus ? "..." : "")}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {loadingStatus && (
              <div className="flex justify-start">
                <div className="text-sm text-gray-500">Typing...</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;