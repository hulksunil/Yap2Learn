export const Theme = {
    colors: {
        primary: '#2F80ED', // Bright Blue
        secondary: '#F2994A', // Orange (Better Way)
        background: '#FAF9F6', // Off-white/Cream
        surface: '#FFFFFF',
        text: '#111827',
        textSecondary: '#6B7280',
        error: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
        border: '#E5E7EB',
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },
    typography: {
        h1: { fontSize: 32, fontWeight: 'bold' },
        h2: { fontSize: 24, fontWeight: 'bold' },
        h3: { fontSize: 20, fontWeight: '600' },
        body: { fontSize: 16, fontWeight: '400' },
        caption: { fontSize: 12, fontWeight: '400' },
    },
    borderRadius: {
        sm: 4,
        md: 8,
        lg: 16,
        xl: 24,
        full: 9999,
    },
} as const;
