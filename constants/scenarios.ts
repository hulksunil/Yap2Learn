export const BUILT_IN_SCENARIOS = {
    'cafe': {
        id: 'cafe',
        title: 'Ordering at a Cafe',
        role: 'Barista'
    },
    'job': {
        id: 'job',
        title: 'Job Interview',
        role: 'Interviewer'
    }
};

export const getScenarioTitle = (id: string, customScenarios: { id: string; name: string }[] = []) => {
    // 1. Check Built-ins
    if (BUILT_IN_SCENARIOS[id as keyof typeof BUILT_IN_SCENARIOS]) {
        return BUILT_IN_SCENARIOS[id as keyof typeof BUILT_IN_SCENARIOS].title;
    }

    // 2. Check Custom Scenarios (Stored)
    const custom = customScenarios.find(s => s.id === id);
    if (custom) return custom.name;

    // 3. Fallback (e.g. 'All' or unknown ID)
    if (id === 'All') return 'All Scenarios';
    if (id === 'custom') return 'Custom Scenario'; // Legacy fallback

    return id; // Fallback to ID
};
