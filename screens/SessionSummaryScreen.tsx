import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../constants/theme';
import { X, PenLine, MessageSquare } from 'lucide-react-native';
import { SavedPhraseCard, CorrectionCard } from '../components/SummaryComponents';
import { useSessionStore } from '../store/useSessionStore';

export default function SessionSummaryScreen() {
    const router = useRouter();
    const { transcript, scenario, language, level } = useSessionStore();

    // Calculate stats
    const turns = transcript.length;

    // Get unique corrections
    const corrections = transcript
        .filter(msg => msg.feedback)
        .map(msg => msg.feedback!);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.navigate('/start-session')}>
                    <X size={24} color={Theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Session Summary</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Title Block */}
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>CONVERSATION</Text>
                    </View>
                    <Text style={styles.title}>{scenario === 'cafe' ? 'Ordering at a Café' : 'Job Interview'}</Text>
                    <Text style={styles.subtitle}>{level} • {language}</Text>
                </View>

                {/* Stats Block */}
                <View style={styles.statsCard}>
                    <View style={styles.statsIcon}>
                        <MessageSquare size={24} color="#2563EB" />
                    </View>
                    <View>
                        <Text style={styles.statsLabel}>Total interactions</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                            <Text style={styles.statsValue}>{turns}</Text>
                            <Text style={styles.statsUnit}> turns</Text>
                        </View>
                    </View>
                </View>

                {/* Dynamic Corrections */}
                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                    <Text style={styles.sectionTitle}>Corrections & Feedback</Text>
                    <TouchableOpacity>
                        <PenLine size={20} color={Theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {corrections.length > 0 ? (
                    corrections.map((f, i) => (
                        <CorrectionCard
                            key={i}
                            wrong={f.original}
                            right={f.improved}
                        />
                    ))
                ) : (
                    <Text style={{ color: Theme.colors.textSecondary, fontStyle: 'italic' }}>
                        Great job! No corrections this session.
                    </Text>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => router.push('/flashcards')}
                >
                    <Text style={styles.secondaryBtnText}>Review Flashcards</Text>
                </TouchableOpacity>

                <View style={{ height: 12 }} />

                <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => router.replace('/start-session')}
                >
                    <Text style={styles.primaryBtnText}>Start New Session</Text>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: Theme.spacing.sm,
        marginBottom: Theme.spacing.md,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.colors.text,
    },
    content: {
        paddingHorizontal: Theme.spacing.md,
        paddingBottom: 140,
    },
    tag: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 8,
    },
    tagText: {
        color: Theme.colors.primary,
        fontWeight: 'bold',
        fontSize: 10,
        letterSpacing: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Theme.colors.text,
        marginBottom: 4,
    },
    subtitle: {
        color: Theme.colors.textSecondary,
        fontWeight: '500',
    },
    statsCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    statsIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    statsLabel: {
        color: Theme.colors.textSecondary,
        fontSize: 14,
    },
    statsValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Theme.colors.text,
    },
    statsUnit: {
        fontSize: 16,
        color: Theme.colors.textSecondary,
        fontWeight: '500',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.colors.text,
    },
    seeAll: {
        color: Theme.colors.primary,
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        padding: 24,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    primaryBtn: {
        backgroundColor: Theme.colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    primaryBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    secondaryBtn: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    secondaryBtnText: {
        color: Theme.colors.text,
        fontWeight: 'bold',
        fontSize: 16,
    }
});
