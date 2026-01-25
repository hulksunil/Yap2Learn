import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../constants/theme';
import { X, MessageSquare, Lightbulb } from 'lucide-react-native';
import { StorageService } from '../services/storage';
import { SavedPhraseCard, CorrectionCard } from '../components/SummaryComponents';
import { TTSService } from '../services/api/tts';
import { Audio } from 'expo-av';
import { MongoService } from '../services/api/mongo';

export default function SessionSummaryScreen() {
    const router = useRouter();
    const { sessionId } = useLocalSearchParams();
    const [session, setSession] = useState<any>(null);

    // Audio State
    const [sound, setSound] = useState<Audio.Sound>();
    const [playingText, setPlayingText] = useState<string | null>(null);
    const [loadingText, setLoadingText] = useState<string | null>(null);

    useEffect(() => {
        loadSession();
        // Ensure audio plays in silent mode
        Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
        });

        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sessionId]); // Re-run if session changes (unlikely) but safe. 
    // Ideally cleanup sound on unmount or sound change.

    useEffect(() => {
        return () => {
            if (sound) sound.unloadAsync();
        };
    }, [sound]);

    // Trigger Sync when session is loaded
    useEffect(() => {
        if (session && session.id) {
            MongoService.syncSession(session.id);
        }
    }, [session]);

    const loadSession = async () => {
        const history = await StorageService.getHistory();
        const currentId = Array.isArray(sessionId) ? sessionId[0] : sessionId;
        const found = currentId
            ? history.find(s => s.id === currentId)
            : history[0];
        setSession(found);
    };

    const playText = async (text: string) => {
        if (loadingText) return;

        // Toggle off if already playing
        if (playingText === text && sound) {
            await sound.stopAsync();
            setPlayingText(null);
            return;
        }

        // Stop any previous sound
        if (sound) {
            await sound.unloadAsync();
            setSound(undefined);
            setPlayingText(null);
        }

        try {
            setLoadingText(text);
            const uri = await TTSService.generateAudio(text);
            if (uri) {
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri },
                    { shouldPlay: true }
                );

                newSound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish) {
                        setPlayingText(null);
                        setSound(undefined);
                    }
                });

                setSound(newSound);
                setPlayingText(text);
            }
        } catch (error) {
            console.error('Audio playback failed', error);
        } finally {
            setLoadingText(null);
        }
    };

    if (!session) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <Text>Loading summary...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const { turnsCount, scenario, level, language, recap } = session;
    const corrections = recap?.top_corrections || [];
    const suggestions = recap?.suggestions || [];

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
                    <Text style={styles.title}>{scenario}</Text>
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
                            <Text style={styles.statsValue}>{turnsCount}</Text>
                            <Text style={styles.statsUnit}> turns</Text>
                        </View>
                    </View>
                </View>

                {/* Suggestions Block (New) */}
                {suggestions.length > 0 && (
                    <View style={{ marginBottom: 32 }}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Suggestions</Text>
                            <Lightbulb size={20} color={Theme.colors.warning} />
                        </View>
                        <View style={styles.suggestionsCard}>
                            {suggestions.map((s: string, i: number) => (
                                <View key={i} style={styles.suggestionItem}>
                                    <View style={styles.bullet} />
                                    <Text style={styles.suggestionText}>{s}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Dynamic Corrections */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Corrections & Feedback</Text>
                </View>

                {corrections.length > 0 ? (
                    corrections.map((c: any, i: number) => (
                        <CorrectionCard
                            key={i}
                            wrong={c.you_said}
                            right={c.better}
                            onPlay={() => playText(c.better)}
                            isPlaying={playingText === c.better}
                            isLoading={loadingText === c.better}
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
                    onPress={() => router.push({ pathname: '/flashcards', params: { sessionId: session.id } })}
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
    },
    suggestionsCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Theme.colors.warning,
        marginTop: 6,
        marginRight: 10,
    },
    suggestionText: {
        color: Theme.colors.text,
        fontSize: 14,
        lineHeight: 20,
        flex: 1,
    }
});
