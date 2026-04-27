import { auth, db, AI_ENABLED } from '../config.js';
import { httpsCallable, getFunctions } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-functions.js";

const functions = getFunctions(undefined, 'us-central1');
const askElectraFn = httpsCallable(functions, 'askElectra');

export const geminiApi = {
    async generateResponse(prompt, context = '', history = []) {
        if (!AI_ENABLED) {
            console.warn("AI is currently disabled. Skipping API call.");
            return null;
        }
        try {
            const result = await askElectraFn({
                prompt: prompt,
                journeyContext: context,
                chatHistory: history
            });
            
            return result.data.text;
        } catch (error) {
            console.error("Secure AI Error:", error);
            if (error.code === 'unauthenticated') {
                return "Please sign in to chat with Electra AI. I'm here to protect your data and provide a personalized experience!";
            }
            return null;
        }
    }
};
