const express = require("express")
const cors = require("cors")
require("dotenv").config()

const { InferenceClient } = require("@huggingface/inference")

const App = express()
App.use(cors())
App.use(express.json())

App.get("/health", (req, res) => {
  const token = process.env.HF_TOKEN
  res.json({
    status:       "running",
    token_loaded: !!token,
    model:        process.env.MODEL_NAME || "meta-llama/Meta-Llama-3-8B-Instruct",
  })
})

// InferenceClient is the current, non-deprecated API (replaces HfInference)
app.post("/ask", async (req, res) => {
  const { question, history = [] } = req.body

  if (!question?.trim()) {
    return res.status(400).json({ _status: false, message: "Question is required" })
  }

  const token = process.env.HF_TOKEN
  if (!token) {
    return res.status(500).json({ _status: false, message: "HF_TOKEN missing from .env" })
  }

  const client    = new InferenceClient(token)
  const modelName = process.env.MODEL_NAME || "meta-llama/Meta-Llama-3-8B-Instruct"

  // Build full message array:
  //   [system]  →  [all prior turns from this chat]  →  [new user message]
  const messages = [
    {
      role:    "system",
      content: "You are Fast-nyana AI, a helpful, concise and friendly assistant. " +
               "You remember everything said earlier in this conversation and use that context when answering.",
    },
    ...history,                              // full chat history sent every request
    { role: "user", content: question },
  ]

  console.log(`\n📨  ${question}`)
  console.log(`📜  history turns: ${history.length}`)


    try {
        const modelName = process.env.MODEL_NAME || "meta-llama/Llama-3.1-8B-Instruct";

        // Use chatCompletion for Llama to get the best results
        const response = await client.chatCompletion({
            model: modelName,
            messages: [
                { role: "system", content: "You are a helpful chat assistant." },
                { role: "user", content: question }
            ],
            max_tokens: 500,
            temperature: 0.7,
        });

    const answer = response.choices[0].message.content;

    console.log("✅ Response:", answer.substring(0, 100) + "...");

    res.json({
        _status: true,
        finalData: answer
    });

    } catch (error) {
        // Always log the full error so you can debug in the terminal
        console.error("❌ Full error:", error?.message || error)

        let userMessage = "Something went wrong."

        if (error?.message?.includes("403") || error?.message?.includes("401")) {
            userMessage = "Invalid or missing HuggingFace token. Check your HF_TOKEN in server/.env"
        } else if (error?.message?.includes("429")) {
            userMessage = "HuggingFace rate limit hit. Wait a moment and try again."
        } else if (error?.message?.includes("503") || error?.message?.includes("loading")) {
            userMessage = "Model is loading on HuggingFace servers. Try again in 20–30 seconds."
        } else if (error?.message?.includes("timeout")) {
            userMessage = "Request timed out. Try again."
        } else {
            userMessage = "API error: " + (error?.message || "Unknown error")
        }

        res.status(500).json({
            _status: false,
            message: userMessage
        })
    }
})

const PORT = process.env.PORT || 8000
App.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
})
