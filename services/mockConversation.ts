// Mock responses based on scenarios

const SCENARIO_RESPONSES: Record<string, string[]> = {
    cafe: [
        "Bonjour! Qu'est-ce que je peux vous servir aujourd'hui?",
        "Très bien. Un café noir ou avec du lait?",
        "D'accord. Quelle taille désirez-vous? Petit, moyen ou grand?",
        "Ça fera 4 euros s'il vous plaît. Sur place ou à emporter?",
        "Merci! Bonne journée!"
    ],
    job: [
        "Bonjour, merci d'être venu. Pouvez-vous vous présenter?",
        "C'est intéressant. Quelle est votre plus grande force?",
        "Pourquoi voulez-vous travailler ici?",
        "Avez-vous des questions pour nous?",
        "Merci, nous vous recontacterons bientôt."
    ]
};

export const MockConversationService = {
    // Simulate network delay
    simulateDelay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

    // Get next response based on turn count
    getNextResponse: (scenario: string, turnCount: number): string => {
        const responses = SCENARIO_RESPONSES[scenario] || SCENARIO_RESPONSES['cafe'];
        // Loop mock responses if turns exceed defined messages
        const index = turnCount % responses.length;
        return responses[index];
    },

    // Mock feedback generation
    analyzeInput: async (text: string) => {
        // Simple heuristic for demo: 
        // If text is short (< 10 chars), suggest making it a full sentence.
        if (text.length < 10) {
            return {
                original: text,
                improved: `Je voudrais ${text.toLowerCase()}, s'il vous plaît.`,
                explanation: "It's more polite to use a full sentence with 'Je voudrais'."
            };
        }
        // Random correction for demo purposes
        if (Math.random() > 0.7) {
            return {
                original: text,
                improved: text.replace("je veux", "je voudrais"),
                explanation: "'Je voudrais' is softer and more polite than 'Je veux'."
            };
        }
        return null; // No correction
    }
};
