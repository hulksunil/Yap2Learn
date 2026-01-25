import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../constants/theme';
import { useSessionStore } from '../store/useSessionStore';
import { Globe, ArrowRight, Check } from 'lucide-react-native';

const LANGUAGES = [
    'English',
    'French',
    'Spanish',
    'German',
    'Italian',
    'Portuguese',
    'Chinese',
    'Japanese'
];

export default function OnboardingScreen() {
    const router = useRouter();
    const { setLanguages, completeOnboarding } = useSessionStore();

    // Default to reasonable values
    const [nativeLang, setNativeLang] = useState('English');
    const [targetLang, setTargetLang] = useState('French');

    const handleGetStarted = () => {
        setLanguages(nativeLang, targetLang);
        completeOnboarding();
        router.replace('/start-session');
    };

    const LanguageSelector = ({
        label,
        selected,
        onSelect
    }: {
        label: string;
        selected: string;
        onSelect: (l: string) => void
    }) => (
        <View style={styles.selectorContainer}>
            <Text style={styles.selectorLabel}>{label}</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsContainer}
            >
                {LANGUAGES.map((lang) => (
                    <TouchableOpacity
                        key={lang}
                        style={[
                            styles.chip,
                            selected === lang && styles.chipActive
                        ]}
                        onPress={() => onSelect(lang)}
                    >
                        <Text style={[
                            styles.chipText,
                            selected === lang && styles.chipTextActive
                        ]}>
                            {lang}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.iconWrapper}>
                        <Globe size={32} color={Theme.colors.primary} />
                    </View>
                    <Text style={styles.title}>Welcome to Yap2Learn</Text>
                    <Text style={styles.subtitle}>
                        Let's set up your learning path.
                    </Text>
                </View>

                <View style={styles.form}>
                    <LanguageSelector
                        label="I speak..."
                        selected={nativeLang}
                        onSelect={setNativeLang}
                    />

                    <LanguageSelector
                        label="I want to learn..."
                        selected={targetLang}
                        onSelect={setTargetLang}
                    />
                </View>

                <View style={styles.summary}>
                    <Text style={styles.summaryText}>
                        You speak <Text style={styles.highlight}>{nativeLang}</Text> and want to learn <Text style={styles.highlight}>{targetLang}</Text>.
                    </Text>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.startBtn}
                    onPress={handleGetStarted}
                >
                    <Text style={styles.startBtnText}>Get Started</Text>
                    <ArrowRight size={20} color="#FFF" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    content: {
        flex: 1,
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    iconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Theme.colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: Theme.colors.textSecondary,
        textAlign: 'center',
    },
    form: {
        gap: 24,
    },
    selectorContainer: {
        gap: 12,
    },
    selectorLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: Theme.colors.text,
    },
    chipsContainer: {
        gap: 8,
        paddingRight: 24,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        marginRight: 8,
    },
    chipActive: {
        backgroundColor: Theme.colors.primary,
    },
    chipText: {
        fontSize: 14,
        color: Theme.colors.text,
        fontWeight: '500',
    },
    chipTextActive: {
        color: '#FFF',
        fontWeight: '600',
    },
    summary: {
        marginTop: 40,
        padding: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        alignItems: 'center',
    },
    summaryText: {
        fontSize: 14,
        color: Theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    highlight: {
        color: Theme.colors.primary,
        fontWeight: 'bold',
    },
    footer: {
        padding: 24,
    },
    startBtn: {
        backgroundColor: Theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: Theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    startBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 18,
    },
});
