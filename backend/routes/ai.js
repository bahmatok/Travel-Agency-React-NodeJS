const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');

const router = express.Router();

// ======================
//      POE CLIENT
// ======================
async function poeChat(prompt) {
  const poeApiUrl =
    process.env.POE_API_URL || "https://api.poe.com/v1/chat/completions";

  const response = await axios.post(
    poeApiUrl,
    {
      model: process.env.POE_MODEL || "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.POE_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 20000
    }
  );

  return response.data.choices[0].message.content;
}

// ======================
//     PLACES AI
// ======================
router.post('/places', auth, async (req, res) => {
  try {
    const { location } = req.body;

    if (!location) {
      return res.status(400).json({ message: "Location is required" });
    }

    const prompt = `
Верни JSON массив строго в формате:
[
  { "name": "...", "description": "...", "reason": "..." }
]

Дай 5 лучших достопримечательностей города ${location}.
Без лишнего текста, только JSON.
`;

    const aiRaw = await poeChat(prompt);

    let data;
    try {
      const jsonMatch = aiRaw.match(/\[[\s\S]*\]/);
      data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      return res.status(500).json({
        message: "Invalid JSON received from POE",
        raw: aiRaw
      });
    }

    const formatted = data.map((p, i) => ({
      name: p.name || `Место ${i + 1}`,
      description: p.description,
      formatted_address: p.description,
      rating: 4.6,
      reason: p.reason || "AI Recommendation"
    }));

    res.json({ results: formatted });

  } catch (err) {
    console.error("POE error:", err.message);
    res.status(500).json({ message: "POE request failed", error: err.message });
  }
});

// ======================
//    DALLE IMAGE
// ======================
router.post('/generate-image', auth, async (req, res) => {
  try {
    const { prompt } = req.body;

    const openaiUrl =
      process.env.OPENAI_API_URL || "https://api.openai.com/v1/images/generations";

    const response = await axios.post(
      openaiUrl,
      {
        model: process.env.DALLE_MODEL || "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024"
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ imageUrl: response.data.data[0].url });

  } catch (err) {
    res.status(500).json({ message: "Image generation failed", error: err.message });
  }
});

module.exports = router;
