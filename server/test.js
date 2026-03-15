require('dotenv').config()
const { HfInference } = require("@huggingface/inference")

const hf = new HfInference(process.env.HF_TOKEN)

async function test() {
    try {
        const response = await hf.textGeneration({
            model: "gpt2", // Test with a known working model
            inputs: "Hello, how are you?",
            parameters: {
                max_new_tokens: 50
            }
        })
        console.log("Success:", response.generated_text)
    } catch (error) {
        console.error("Failed:", error)
    }
}

test()