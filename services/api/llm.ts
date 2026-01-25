import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export const LLMService = {
    generateResponse: async (
        userText: string,
        scenario: string,
        level: string
    ): Promise<{ text: string; feedback?: any } | null> => {
        if (!GEMINI_API_KEY) {
            console.error('Missing Gemini API Key');
            return { text: "Error: Missing API Key. Check .env file." };
        }

        try {
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `
        You are a helpful language tutor roleplaying a scenario: "${scenario}". 
        The student is at level: "${level}".
        Language: French.
        
        Analyze the student's input: "${userText}".
        
        1. If there are grammar mistakes, provide a gentle correction (feedback).
        2. Respond to the input naturally as the character in the scenario (e.g., barista, interviewer).
        
        Return JSON format:
        {
          "text": "Your response as the character (in French)",
          "feedback": {
             "original": "The student's original text",
             "improved": "The corrected version",
             "explanation": "Why it was corrected (in English)"
          }
        }
        If no correction needed, set feedback to null.
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean up markdown code blocks if present
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

            return JSON.parse(cleanJson);
        } catch (error) {
            console.error('LLM Error:', error);
            // Fallback
            return { text: "Désolé, je n'ai pas compris. Pouvez-vous répéter?" };
        }
    },

    generateSessionRecap: async (transcript: any[]): Promise<any | null> => {
        if (!GEMINI_API_KEY) return null;

        try {
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: { responseMimeType: "application/json" } // Enforce JSON
            });

            // Filter transcript for context
            const context = transcript.map(t => `${t.role}: ${t.text}`).join('\n');

            const prompt = `
             Analyze this conversation transcript between a user (student) and an AI (tutor).
             Target Language: French.
             
             Generate a JSON session recap with exactly this structure:
             {
               "saved_phrases": [
                 {
                   "phrase": "French phrase from conversation or relevant to it",
                   "translation": "English translation",
                   "example_sentence": "Example usage in French",
                   "difficulty": "beginner" | "intermediate" | "advanced",
                   "pronunciation_hint": "phonetic-ish hint (optional)"
                 }
               ],
               "top_corrections": [
                 {
                   "you_said": "User's mistake",
                   "better": "Corrected version",
                   "tip": "Short explanation",
                   "category": "grammar" | "vocab" | "pronunciation_guess" | "fluency"
                 }
               ],
               "suggestions": [
                 "Actionable suggestion 1",
                 "Actionable suggestion 2",
                 "Actionable suggestion 3"
               ]
             }

             Criteria:
             1. Select 3-5 useful phrases the user should remember (can be improved versions of what they tried to say).
             2. Select 3-5 key corrections based on their actual mistakes.
             3. Provide 3 concrete suggestions for next time.

             Transcript:
             ${context}
           `;

            const result = await model.generateContent(prompt);
            const text = result.response.text();

            // Clean and Parse
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);
        } catch (error) {
            console.error('LLM Recap Error:', error);
            // Fallback safe object
            return {
                saved_phrases: [],
                top_corrections: [],
                suggestions: ["Keep practicing!"]
            };
        }
    }
};
