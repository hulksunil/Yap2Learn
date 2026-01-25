import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../constants/theme';
import { useSessionStore } from '../store/useSessionStore';
import { ArrowLeft, Save } from 'lucide-react-native';

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

export default function SettingsScreen() {
    const router = useRouter();
    const {
        nativeLanguage,
        targetLanguage,
        setLanguages,
        resetSession
    } = useSessionStore();

    const [native, setNative] = useState(nativeLanguage);
    const [target, setTarget] = useState(targetLanguage);

    const handleSave = () => {
        setLanguages(native, target);
        // Optional: Reset session if languages change to avoid confusion
        resetSession();
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color={Theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <TouchableOpacity onPress={handleSave}>
                    <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionHeader}>Language Preferences</Text>

                <View style={styles.card}>
                    <Text style={styles.label}>Native Language</Text>
                    <Text style={styles.helperText}>Used for explanations and UI.</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.pillsContainer}
                    >
                        {LANGUAGES.map(lang => (
                            <TouchableOpacity
                                key={`native-${lang}`}
                                style={[styles.pill, native === lang && styles.pillActive]}
                                onPress={() => setNative(lang)}
                            >
                                <Text style={[styles.pillText, native === lang && styles.pillTextActive]}>
                                    {lang}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>Target Language</Text>
                    <Text style={styles.helperText}>The language you are learning.</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.pillsContainer}
                    >
                        {LANGUAGES.map(lang => (
                            <TouchableOpacity
                                key={`target-${lang}`}
                                style={[styles.pill, target === lang && styles.pillActive]}
                                onPress={() => setTarget(lang)}
                            >
                                <Text style={[styles.pillText, target === lang && styles.pillTextActive]}>
                                    {lang}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <Text style={styles.sectionHeader}>About</Text>
                <View style={styles.card}>
                    <Text style={styles.infoTextSub}>Designed for Hackathon Project.</Text>
                </View>

                {/* Cloud Sync Section */}
                <Text style={styles.sectionHeader}>Cloud Sync</Text>
                <TouchableOpacity
                    style={styles.syncBtn}
                    onPress={async () => {
                        const { MongoService } = await import('../services/api/mongo');
                        alert('Starting sync... please wait.');
                        const count = await MongoService.syncHistory();
                        alert(`Sync Complete! Uploaded ${count} sessions.`);
                    }}
                >
                    <Save size={20} color="#FFF" />
                    <Text style={styles.syncBtnText}>Sync History to Cloud</Text>
                </TouchableOpacity>
                <Text style={styles.helperText}>Uploads your past sessions to enable Semantic Flashcards.</Text>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: Theme.spacing.sm,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.colors.text,
    },
    saveText: {
        fontSize: 16,
        fontWeight: '600',
        color: Theme.colors.primary,
    },
    content: {
        padding: Theme.spacing.md,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '700',
        color: Theme.colors.textSecondary,
        marginTop: 24,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: Theme.colors.text,
        marginBottom: 4,
    },
    helperText: {
        fontSize: 12,
        color: Theme.colors.textSecondary,
        marginBottom: 12,
    },
    pillsContainer: {
        gap: 8,
        paddingBottom: 4,
    },
    pill: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    pillActive: {
        backgroundColor: '#EFF6FF',
        borderColor: Theme.colors.primary,
    },
    pillText: {
        fontSize: 14,
        color: Theme.colors.text,
    },
    pillTextActive: {
        color: Theme.colors.primary,
        fontWeight: '600',
    },
    infoText: {
        fontSize: 16,
        fontWeight: '500',
        color: Theme.colors.text,
    },
    infoTextSub: {
        fontSize: 14,
        color: Theme.colors.textSecondary,
        marginTop: 4,
    },
    syncBtn: {
        backgroundColor: Theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        gap: 8,
    },
    syncBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
