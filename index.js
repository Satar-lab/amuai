const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_KEY = process.env.OPENAI_KEY;

app.get("/", (req, res) => {
  res.send("Server is running...");
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!OPENAI_KEY) {
      console.error("OPENAI_KEY is not set");
      return res.status(500).json({ 
        reply: "Server configuration error: OpenAI API key is missing" 
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await response.json();

    console.log("OpenAI Response Status:", response.status);
    console.log("OpenAI Response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("OpenAI API Error:", data);
      return res.status(500).json({ 
        reply: `OpenAI API error: ${data.error?.message || JSON.stringify(data)}` 
      });
    }

    // Check if response has the expected structure
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error("Invalid OpenAI response structure:", data);
      return res.status(500).json({ 
        reply: "Invalid response from OpenAI API" 
      });
    }

    const content = data.choices[0]?.message?.content;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      console.error("Empty or invalid content from OpenAI:", data);
      return res.status(500).json({ 
        reply: "Received empty response from OpenAI" 
      });
    }

    res.json({
      reply: content.trim()
    });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ 
      reply: `Server error: ${error.message}` 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
