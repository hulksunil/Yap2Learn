import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../constants/theme';
import { ArrowLeft, MoreVertical, Keyboard, Lightbulb, AudioWaveform as Waveform, X } from 'lucide-react-native';
import { ChatBubble } from '../components/ChatBubble';
import { FeedbackCard } from '../components/FeedbackCard';
import { PulseButton } from '../components/PulseButton';
import { useSessionStore } from '../store/useSessionStore';

import { STTService } from '../services/api/stt';
import { LLMService } from '../services/api/llm';
import { TTSService } from '../services/api/tts';
import { Audio } from 'expo-av';
import { StorageService } from '../services/storage';

import { AudioService } from '../services/audioService';

export default function ConversationScreen() {
    const router = useRouter();
    const [modalVisible, setModalVisible] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const [sound, setSound] = useState<Audio.Sound>();

    // Audio Playback State
    const [playingText, setPlayingText] = useState<string | null>(null);
    const [loadingText, setLoadingText] = useState<string | null>(null);
    const [isGeneratingRecap, setIsGeneratingRecap] = useState(false);

    const {
        transcript,
        status,
        scenario,
        level,
        setStatus,
        addMessage,
        setTranscript
    } = useSessionStore();

    // Basic Sound Cleanup
    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);



    const { sessionId, readOnly } = useLocalSearchParams();
    const isReadOnly = readOnly === 'true';

    // Auto-scroll on new message
    useEffect(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [transcript, status]);

    useEffect(() => {
        if (isReadOnly && sessionId) {
            loadReadOnlySession();
        } else if (transcript.length === 0) {
            initSession();
        }
    }, [isReadOnly, sessionId]);

    const loadReadOnlySession = async () => {
        setStatus('processing');
        // Find session in history
        const history = await StorageService.getHistory();
        const sid = Array.isArray(sessionId) ? sessionId[0] : sessionId;
        const session = history.find(s => s.id === sid);

        if (session && session.transcript) {
            setTranscript(session.transcript);
        }
        setStatus('idle');
    };

    const initSession = async () => {
        setStatus('processing');
        const initialGreeting = "Bonjour! Bienvenue. Comment puis-je vous aider aujourd'hui?";

        // Generate Audio for greeting
        const audioPath = await TTSService.generateAudio(initialGreeting);

        addMessage({
            id: Date.now().toString(),
            role: 'assistant',
            text: initialGreeting,
            audioUrl: audioPath || undefined
        });

        if (audioPath) {
            await playAudio(audioPath);
        }

        setStatus('idle');
    };

    const playAudio = async (uri: string) => {
        // Unload previous sound
        if (sound) {
            await sound.unloadAsync();
        }
        const { sound: newSound } = await Audio.Sound.createAsync({ uri });
        setSound(newSound);
        await newSound.playAsync();
    };

    const playText = async (text: string) => {
        if (loadingText) return;
        if (playingText === text && sound) {
            await sound.stopAsync();
            setPlayingText(null);
            return;
        }

        // Stop previous
        if (sound) {
            await sound.unloadAsync();
            setSound(undefined);
            setPlayingText(null);
        }

        try {
            setLoadingText(text);
            const uri = await TTSService.generateAudio(text);
            if (uri) {
                const { sound: newSound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
                newSound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish) {
                        setPlayingText(null);
                        setSound(undefined);
                    }
                });
                setSound(newSound);
                setPlayingText(text);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingText(null);
        }
    };

    const handleMicPress = async () => {
        // Toggle Recording Logic
        if (status === 'idle') {
            const hasPerm = await AudioService.requestPermissions();
            if (!hasPerm) {
                alert('Microphone permission is required to yap!');
                return;
            }

            setStatus('recording');
            await AudioService.startRecording();
        } else if (status === 'recording') {
            // Stop Recording
            const uri = await AudioService.stopRecording();
            setStatus('processing');

            if (!uri) {
                setStatus('idle');
                // Fallback/Error state
                return;
            }

            // 1. STT (Speech to Text)
            const userText = await STTService.transcribe(uri);

            if (!userText) {
                alert('Could not transcribe audio. Please try again.');
                setStatus('idle');
                return;
            }

            // 2. LLM (Generate Response)
            const aiResponse = await LLMService.generateResponse(userText, scenario, level);

            if (!aiResponse) {
                setStatus('idle');
                return;
            }

            if (aiResponse.feedback) {
                // Feedback usage if implemented
            }

            addMessage({
                id: Date.now().toString(),
                role: 'user',
                text: userText,
                audioUrl: uri,
                // If LLM returns feedback on the user's input, attach it here
                feedback: aiResponse.feedback || undefined
            });

            // 4. TTS (Text to Speech)
            const audioPath = await TTSService.generateAudio(aiResponse.text);

            // 5. Add AI Message
            addMessage({
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: aiResponse.text,
                audioUrl: audioPath || undefined
            });

            // Play Audio
            if (audioPath) {
                await playAudio(audioPath);
            }

            setStatus('idle');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color={Theme.colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Ordering at a Cafe</Text>
                    <Text style={styles.headerSubtitle}>FRENCH • BEGINNER</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <MoreVertical size={24} color={Theme.colors.text} />
                </TouchableOpacity>
            </View>

            {/* Transcript */}
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.transcript}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.timestamp}>Today 9:41 AM</Text>

                {transcript.map((msg) => (
                    <View key={msg.id}>
                        <Text style={[
                            styles.senderLabel,
                            msg.role === 'user' && { alignSelf: 'flex-end', marginRight: 42 }
                        ]}>
                            {msg.role === 'user' ? 'You' : 'Barista'}
                        </Text>

                        <ChatBubble
                            sender={msg.role}
                            text={msg.text}
                            avatar={true}
                        />

                        {msg.feedback && (
                            <View style={styles.feedbackWrapper}>
                                <FeedbackCard
                                    original={msg.feedback.original}
                                    improved={msg.feedback.improved}
                                    explanation={msg.feedback.explanation}
                                    onPlay={() => playText(msg.feedback!.improved)}
                                    isPlaying={playingText === msg.feedback!.improved}
                                    isLoading={loadingText === msg.feedback!.improved}
                                />
                            </View>
                        )}
                    </View>
                ))}

                {status === 'processing' && (
                    <Text style={styles.statusIndicator}>Thinking...</Text>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer Controls - Hide if Read Only */}
            {!isReadOnly && (
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.iconBtn}>
                        <Lightbulb size={24} color={Theme.colors.textSecondary} />
                    </TouchableOpacity>

                    <PulseButton
                        state={status}
                        onPress={handleMicPress}
                    />

                    <TouchableOpacity style={styles.iconBtn}>
                        <Keyboard size={24} color={Theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Read Only Footer Alt */}
            {isReadOnly && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.modalEndBtn, { backgroundColor: Theme.colors.primary, borderRadius: 30 }]}
                        onPress={() => router.push({ pathname: '/session-summary', params: { sessionId } })}
                    >
                        <Text style={styles.modalEndText}>View Summary</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* End Session Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => !isGeneratingRecap && setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIcon}>
                            <Waveform size={24} color={Theme.colors.primary} />
                        </View>
                        <Text style={styles.modalBrand}>YAP2LEARN</Text>

                        <Text style={styles.modalTitle}>End this session?</Text>
                        <Text style={styles.modalDesc}>
                            You’re doing great! If you leave now, you will lose your progress for this conversation scenario.
                        </Text>

                        <TouchableOpacity
                            style={styles.modalEndBtn}
                            onPress={async () => {
                                setModalVisible(false); // Close dropdown logic immediate UX
                                setIsGeneratingRecap(true); // Trigger Overlay

                                // 1. Generate Recap
                                const recap = await LLMService.generateSessionRecap(transcript);

                                // Default fallback (must be defined locally!)
                                const finalRecap = recap || {
                                    saved_phrases: [],
                                    top_corrections: [],
                                    suggestions: []
                                };

                                // 2. Save Session with Recap
                                const curSessionId = Date.now().toString();
                                await StorageService.saveSession({
                                    id: curSessionId,
                                    date: new Date().toISOString(),
                                    scenario: scenario,
                                    language: 'French',
                                    level: level,
                                    turnsCount: transcript.length,
                                    transcript: transcript,
                                    recap: finalRecap
                                });

                                // 3. Save Flashcards (Scoped to Session from Recap)
                                const newCards = finalRecap.saved_phrases.map((phrase: any) => ({
                                    id: Date.now().toString() + Math.random(),
                                    front: phrase.phrase,
                                    back: phrase.translation,
                                    context: phrase.pronunciation_hint || '',
                                    sessionId: curSessionId,
                                    originalPhrase: phrase
                                }));

                                if (newCards.length > 0) {
                                    await StorageService.saveFlashcards(newCards);
                                }

                                setIsGeneratingRecap(false);
                                setStatus('idle');
                                router.replace({ pathname: '/session-summary', params: { sessionId: curSessionId } });
                            }}
                        >
                            <Text style={styles.modalEndText}>End Session</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalCancelBtn}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.modalCancelText}>Continue Practicing</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Generating Recap Overlay */}
            {isGeneratingRecap && (
                <View style={[styles.modalOverlay, { zIndex: 999 }]}>
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color={Theme.colors.primary} />
                        <Text style={styles.loadingText}>Generating recap...</Text>
                    </View>
                </View>
            )}

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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: Theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#FFF',
    },
    headerTextContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Theme.colors.text,
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Theme.colors.primary,
        marginTop: 2,
    },
    transcript: {
        padding: Theme.spacing.md,
    },
    timestamp: {
        alignSelf: 'center',
        marginVertical: Theme.spacing.md,
        color: '#9CA3AF',
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        fontSize: 12,
        overflow: 'hidden',
    },
    senderLabel: {
        marginLeft: 42,
        marginBottom: 4,
        fontSize: 12,
        color: Theme.colors.textSecondary,
    },
    feedbackWrapper: {
        marginLeft: 42,
        marginBottom: Theme.spacing.md,
        maxWidth: '85%',
    },
    statusIndicator: {
        alignSelf: 'center',
        color: Theme.colors.textSecondary,
        fontStyle: 'italic',
        marginBottom: 12,
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    iconBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    /* Modal Styles */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
    modalContent: {
        backgroundColor: '#FFF',
        width: '85%',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
    },
    modalIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    modalBrand: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Theme.colors.primary,
        letterSpacing: 1.5,
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Theme.colors.text,
        marginBottom: 12,
    },
    modalDesc: {
        textAlign: 'center',
        color: Theme.colors.textSecondary,
        marginBottom: 24,
        lineHeight: 20,
    },
    modalEndBtn: {
        backgroundColor: Theme.colors.error,
        width: '100%',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    modalEndText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalCancelBtn: {
        paddingVertical: 12,
    },
    modalCancelText: {
        color: Theme.colors.text,
        fontWeight: '600',
        fontSize: 16,
    },
    loadingBox: {
        backgroundColor: '#FFF',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: Theme.colors.text,
        fontWeight: '600',
    }
});
