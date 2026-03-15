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

            const response = await hf.textGeneration({
                model: "OxxoCodes/Pula-8B-v0.1",
                inputs: question,
                parameters: {
                    max_new_tokens: 200,
                    temperature: 0.7
                }
            })

            res.send({
                _status: true,
                finalData: response.generated_text
            })
            
        } catch (error) {
            console.log(error)

            res.status(500).send({
                _status: false,
                message: "LLM request failed"
            })
        }
})


App.listen(process.env.PORT, () => {
    console.log('Server running')
})