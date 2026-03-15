let express = require("express")
let cors = require("cors")
require("dotenv").config()

const { HfInference } = require("@huggingface/inference")

let App = express()

App.use(cors()) // Middleware
App.use(express.json())

const hf = new HfInference(process.env.HF_TOKEN)

App.post("/ask",
    async (req, res) => {
        try {
            const question = req.body.question
            
            if (!question) {
                return res.status(400).send({
                    _status: false,
                    message: "Question is required"
                })
            }

            console.log("Processing question:", question)

            // Determine which model to use (can be overridden via environment variable)
            const modelName = process.env.MODEL_NAME || "gpt2";

            // Add timeout to the request
            const response = await Promise.race([
                hf.textGeneration({
                    model: modelName,
                    inputs: question,
                    parameters: {
                        max_new_tokens: 200,
                        temperature: 0.7
                    }
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Request timeout")), 30000)
                )
            ])

            console.log(`Response received from model ${modelName}:`, response.generated_text.substring(0, 100) + "...")

            res.send({
                _status: true,
                finalData: response.generated_text
            })
            
        } catch (error) {
            console.error("Detailed error:", error)

            // Check for specific Hugging Face errors
            if (error.message?.includes("403")) {
                res.status(500).send({
                    _status: false,
                    message: "Model not accessible. Please check if the model exists and your token is valid."
                })
            } else if (error.message?.includes("timeout")) {
                res.status(500).send({
                    _status: false,
                    message: "Request timed out. The model is taking too long to respond."
                })
            } else {
                res.status(500).send({
                    _status: false,
                    message: "LLM request failed: " + error.message
                })
            }
        }
})

App.listen(process.env.PORT, () => {
    console.log('Server running on port', process.env.PORT)
})