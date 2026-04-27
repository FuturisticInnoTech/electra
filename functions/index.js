const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors")({ origin: true });

admin.initializeApp();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.askElectra = functions.https.onCall(async (data, context) => {
    // onCall automatically handles CORS, but ensure the function is set to allow allUsers in IAM
  // 1. Security Check: Authenticated Users Only
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only registered voters can access Electra AI."
    );
  }

  const { prompt, chatHistory, journeyContext } = data;

  if (!prompt) {
    throw new functions.https.HttpsError("invalid-argument", "Prompt is required.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `You are Electra AI, an expert election assistant.
    Current User Journey Stage: ${journeyContext || 'General Inquiry'}
    Goal: Provide educational, non-partisan, and encouraging information about elections.
    Format: Use markdown, bold text, and bullet points for readability.`;

    // 2. Prepare History for Gemini
    const history = (chatHistory || []).map(msg => ({
      role: msg.sender === "ai" ? "model" : "user",
      parts: [{ text: msg.text }],
    }));

    const chat = model.startChat({
      history: history,
      systemInstruction: systemPrompt,
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    return { text };
  } catch (error) {
    console.error("Gemini Backend Error:", error);
    throw new functions.https.HttpsError("internal", "Electra is thinking too hard. Please try again.");
  }
});
