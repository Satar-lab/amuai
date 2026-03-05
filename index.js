const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";

app.get("/", (req, res) => {
  res.send("Server is running...");
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY (or GOOGLE_API_KEY) is not set");
      return res.status(500).json({
        reply: "Server configuration error: Gemini API key is missing"
      });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: message }],
          },
        ],
      }),
    });

    const data = await response.json();

    console.log("Gemini Response Status:", response.status);
    console.log("Gemini Response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("Gemini API Error:", data);

      const errorMessage =
        data.error?.message ||
        data.error?.status ||
        data.error?.code ||
        "Gemini API error occurred";

      return res.status(response.status).json({ reply: errorMessage });
    }

    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse || typeof textResponse !== "string") {
      console.error("Invalid Gemini response structure:", data);
      return res.status(500).json({
        reply: "Invalid response from Gemini API"
      });
    }

    res.json({
      reply: textResponse.trim(),
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({
      reply: `Server error: ${error.message}`,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
