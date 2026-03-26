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
App.post("/ask", async (req, res) => {
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
    const response = await client.chatCompletion({
      model:      modelName,
      messages,
      max_tokens: 2048,
      temperature: 0.7,
    })

    const answer = response.choices[0].message.content
    console.log("✅  answer:", answer.substring(0, 80) + "...")
    res.json({ _status: true, finalData: answer })

  } catch (error) {
    const msg    = error?.message || ""
    const status = error?.response?.status || error?.statusCode

    console.error("❌  error:", msg, "| status:", status || "n/a")

    let userMessage
    if      (status === 401 || msg.includes("401"))                            userMessage = "Token rejected (401) — check HF_TOKEN in server/.env"
    else if (status === 403 || msg.includes("403"))                            userMessage = "Access denied (403) — enable 'Make calls to Inference API' on your HF token"
    else if (status === 429 || msg.includes("429"))                            userMessage = "Rate limited — wait 60 s and try again"
    else if (status === 503 || msg.includes("503") || msg.includes("loading")) userMessage = "Model warming up — wait 20-30 s and try again"
    else if (msg.includes("provider") || msg.includes("inference"))            userMessage = "Inference API blocked — enable serverless inference on your HF token"
    else                                                                       userMessage = "Error: " + (msg || "check server terminal")

    res.status(500).json({ _status: false, message: userMessage })
  }
})

const PORT = process.env.PORT || 8000
App.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`🤖  model : ${process.env.MODEL_NAME || "meta-llama/Meta-Llama-3-8B-Instruct"}`)
})
