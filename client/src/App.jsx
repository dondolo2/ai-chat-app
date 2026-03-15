import { useState } from "react";
import "./App.css";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import Loading from "./Loading";

function App() {
  let [question, setQuestion] = useState("");
  let [data, setData] = useState("");
  let [loadingStatus, setLoadingStatus] = useState(false);
  let [error, setError] = useState("");

  let handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!question.trim()) {
      setError("Please enter a question");
      return;
    }
    
    setLoadingStatus(true);
    setData("");
    setError("");

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
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(error.response.data.message || `Server error: ${error.response.status}`);
      } else if (error.request) {
        // The request was made but no response was received
        setError("No response from server. Please check if the server is running.");
      } else {
        // Something happened in setting up the request that triggered an Error
        setError("Error setting up request: " + error.message);
      }
      
      setLoadingStatus(false);
    }
  };

  const streamText = (text) => {
    let i = 0;

    const interval = setInterval(() => {
      setData((prev) => prev + text[i]);
      i++;

      if (i >= text.length) {
        clearInterval(interval);
        setLoadingStatus(false);
      }
    }, 15);
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
          {loadingStatus ? (
            <Loading />
          ) : (
            <div className="prose max-w-none">
              <ReactMarkdown>{data}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;