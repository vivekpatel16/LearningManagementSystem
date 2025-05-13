const express = require("express");
const { generateQueryFromPrompt, executeMongoQuery, formatResultWithGemini } = require("../controllers/ChatbotController");
const router = express.Router();

router.post('/admin', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // Step 1: Get MongoDB query from Gemini
    const { collection, query, type } = await generateQueryFromPrompt(prompt);

    // Step 2: Execute MongoDB query
    const mongoResult = await executeMongoQuery(collection, query, type);

    // Step 3: Format result using Gemini
    const formattedOutput = await formatResultWithGemini(prompt, mongoResult);

    return res.json({ result: mongoResult });
    // return res.json({ response: formattedOutput, rawResult: mongoResult });
  } catch (error) {
    console.error('Chatbot error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;