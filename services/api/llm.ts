import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export const LLMService = {
    generateResponse: async (
        userText: string,
        scenario: string,
        level: string,
        targetLanguage: string,
        nativeLanguage: string,
        customScenario?: { name: string; context: string; }
    ): Promise<{ text: string; feedback?: any; translation?: string; suggestedResponse?: { text: string; translation: string; } } | null> => {
        if (!GEMINI_API_KEY) {
            console.error('Missing Gemini API Key');
            return { text: "Error: Missing API Key. Check .env file." };
        }

        try {
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const scenarioPrompt = customScenario
                ? `Scenario: "${customScenario.name}". Context: "${customScenario.context}"`
                : `Scenario: "${scenario}"`;

            const prompt = `
        You are a helpful language tutor roleplaying a scenario.
        ${scenarioPrompt}
        The student is at level: "${level}".
        Language to practice (Target): ${targetLanguage}.
        Student's Native Language: ${nativeLanguage}.
        
        Analyze the student's input: "${userText}".
        
        1. If there are grammar mistakes, provide a gentle correction (feedback).
        2. Respond to the input naturally as the character in the scenario (e.g., barista, interviewer).
        3. Provide a translation of your response in ${nativeLanguage}.
        4. Provide a suggested response for the student to say next (in ${targetLanguage}) AND its translation. (REQUIRED)
        
        Return JSON format:
        {
          "text": "Your response as the character (in ${targetLanguage})",
          "translation": "Translation of your response (in ${nativeLanguage})",
          "suggestedResponse": {
              "text": "A natural next response (in ${targetLanguage})",
              "translation": "Translation of that response (in ${nativeLanguage})"
          },
          "feedback": {
             "original": "The student's original text",
             "improved": "The corrected version",
             "explanation": "Why it was corrected (in ${nativeLanguage})"
          }
        }
        If no correction needed, set feedback to null.
        Note: The "suggestedResponse" field is MANDATORY. Always provide a suggestion for what the user can say next.
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            console.log("LLM Raw Response:", text); // DEBUG

            // Robust JSON extraction
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error("No JSON found in response");
                return null;
            }

            const cleanJson = jsonMatch[0];
            const parsed = JSON.parse(cleanJson);
            console.log("LLM Parsed Data:", parsed); // DEBUG

            return parsed;
        } catch (error) {
            console.error('LLM Error:', error);
            // Fallback
            return { text: "Désolé, je n'ai pas compris. Pouvez-vous répéter?" };
        }
    },

    generateSessionRecap: async (
        transcript: any[],
        targetLanguage: string = 'French',
        nativeLanguage: string = 'English'
    ): Promise<any | null> => {
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
             Target Language: ${targetLanguage}.
             Student's Native Language: ${nativeLanguage}.
             
             Generate a JSON session recap with exactly this structure:
             {
               "saved_phrases": [
                 {
                   "phrase": "Phrase in ${targetLanguage}",
                   "translation": "Translation in ${nativeLanguage}",
                   "example_sentence": "Example usage in ${targetLanguage}",
                   "difficulty": "beginner" | "intermediate" | "advanced",
                   "pronunciation_hint": "phonetic-ish hint (optional)"
                 }
               ],
               "top_corrections": [
                 {
                   "you_said": "User's mistake",
                   "better": "Corrected version",
                   "tip": "Short explanation in ${nativeLanguage}",
                   "category": "grammar" | "vocab" | "pronunciation_guess" | "fluency"
                 }
               ],
               "suggestions": [
                 "Actionable suggestion 1 (in ${nativeLanguage})",
                 "Actionable suggestion 2 (in ${nativeLanguage})",
                 "Actionable suggestion 3 (in ${nativeLanguage})"
               ]
             }

             IMPORTANT LANGUAGE RULES:
             - 'saved_phrases' -> 'phrase' and 'example_sentence' must be in ${targetLanguage}.
             - 'saved_phrases' -> 'translation' must be in ${nativeLanguage}.
             - 'top_corrections' -> 'tip' must be in ${nativeLanguage}.
             - 'suggestions' -> ALL items must be written in ${nativeLanguage} (so the student understands how to improve).

             Transcript:
             ${context}
           `;

            const result = await model.generateContent(prompt);
            const text = result.response.text();

            // Robust JSON extraction
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error("No JSON found in recap response");
                return {
                    saved_phrases: [],
                    top_corrections: [],
                    suggestions: ["Keep practicing!"]
                };
            }

            const cleanJson = jsonMatch[0];
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
    },

    generateGreeting: async (
        scenario: string,
        level: string,
        targetLanguage: string,
        nativeLanguage: string = 'English',
        customScenario?: { name: string; context: string; }
    ): Promise<{ text: string; translation: string; suggestedResponse?: { text: string; translation: string; } } | null> => {
        if (!GEMINI_API_KEY) {
            return {
                text: `Hello! Ready for ${customScenario ? customScenario.name : scenario}?`,
                translation: `Bonjour! Prêt pour ${customScenario ? customScenario.name : scenario}?`,
                suggestedResponse: { text: "Yes, I am ready.", translation: "Oui, je suis prêt." }
            };
        }

        try {
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const scenarioPrompt = customScenario
                ? `Scenario: "${customScenario.name}". Context: "${customScenario.context}"`
                : `Scenario: "${scenario}"`;

            const prompt = `
            You are a roleplay partner in a language learning app.
            ${scenarioPrompt}
            Student Level: "${level}".
            Language: ${targetLanguage}.
            Native Language: ${nativeLanguage}.

            1. Generate a short, natural opening line for this scenario to start the conversation.
            2. Provide a translation of that opening line.
            3. Provide a suggested response for the student to say back (in ${targetLanguage}) AND its translation. (REQUIRED)

            Return JSON format:
            {
                "text": "Opening line in ${targetLanguage}",
                "translation": "Translation in ${nativeLanguage}",
                "suggestedResponse": {
                    "text": "Suggested reply in ${targetLanguage}",
                    "translation": "Translation in ${nativeLanguage}"
                }
            }
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            console.log("LLM Greeting Raw:", text); // DEBUG

            // Robust JSON extraction
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error("No JSON found in greeting response");
                return null;
            }

            const cleanJson = jsonMatch[0];
            const parsed = JSON.parse(cleanJson);
            console.log("LLM Greeting Parsed:", parsed); // DEBUG
            return parsed;
        } catch (error) {
            console.error('LLM Greeting Error:', error);
            return null;
        }
    }


};
