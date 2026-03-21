require('dotenv').config()

async function test() {
    try {
        console.log("Testing with model: HuggingFaceH4/zephyr-7b-beta")
        
        // Use the new router endpoint
        const response = await fetch(
            "https://router.huggingface.co/hf-inference/models/HuggingFaceH4/zephyr-7b-beta/v1/chat/completions",
            {
                headers: {
                    Authorization: `Bearer ${process.env.HF_TOKEN}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                    model: "HuggingFaceH4/zephyr-7b-beta",
                    messages: [
                        {
                            role: "user",
                            content: "Hello, how are you? Please respond in one short sentence."
                        }
                    ],
                    max_tokens: 100,
                    temperature: 0.7,
                }),
            }
        )

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`HTTP ${response.status}: ${error}`)
        }

        const data = await response.json()
        console.log("✅ Success:", data.choices[0].message.content)
        
    } catch (error) {
        console.error("❌ Failed:", error.message)
    }
}

test()