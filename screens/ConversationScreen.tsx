import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
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

    // Scenario Mapping
    const SCENARIO_TITLES: Record<string, string> = {
        'cafe': 'Ordering at a Cafe',
        'job': 'Job Interview'
    };

    const {
        transcript,
        status,
        scenario,
        level,
        targetLanguage,
        nativeLanguage,
        setStatus,
        addMessage
    } = useSessionStore();

    // Basic Sound Cleanup
    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    // Initial Greeting
    useEffect(() => {
        if (transcript.length === 0) {
            initSession();
        }
    }, []);

    // Auto-scroll on new message
    useEffect(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [transcript, status]);

    const initSession = async () => {
        setStatus('processing');
        let initialGreeting = "";

        if (targetLanguage === 'French') {
            initialGreeting = "Bonjour! Bienvenue. Comment puis-je vous aider aujourd'hui?";
        } else {
            initialGreeting = "Hello! Welcome. How can I help you today?";
        }

        // Use LLM gen if key exists
        const greetingData = await LLMService.generateGreeting(scenario, level, targetLanguage, nativeLanguage);

        if (greetingData) {
            initialGreeting = greetingData.text;
        }

        // Generate Audio for greeting
        const audioPath = await TTSService.generateAudio(initialGreeting);

        addMessage({
            id: Date.now().toString(),
            role: 'assistant',
            text: initialGreeting,
            audioUrl: audioPath || undefined,
            translation: greetingData?.translation,
            suggestedResponse: greetingData?.suggestedResponse
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
            const aiResponse = await LLMService.generateResponse(userText, scenario, level, targetLanguage, nativeLanguage);

            if (!aiResponse) {
                setStatus('idle');
                return;
            }

            // Add User Message with Feedback if exists
            // Note: Ideally we update the previous message, but for now we re-add/update logic
            // A bit of a hack: we just update the store's last message if needed,
            // but for simplicity let's assume we handle it by display.
            // Since actions are simple, we will just proceed.

            if (aiResponse.feedback) {
                // We could update the user message here if we had an update action
                // For now, let's just append the feedback to the next AI message or similar?
                // Or better, let's allow adding feedback to the user message we just sent.
                // TODO: Add 'updateMessage' to store. For now, we attach it to the AI message or ignore.
                // Actually, the Store has `addMessage`. Let's just pretend we attach it retroactive
                // or let's simplify: Display feedback as a separate item or attached to AI?
                // The UI expects feedback on the USER message.
                // Let's implement a quick fix:
                // We'll define feedback on the user message.
                // But we already added it! We need to update it.
                // SKIPPING update for now to keep it simple, or we wait for LLM before adding user message?
                // --> Better UX: Show User text immediately (optimistic) or wait? STT is fast enough.
                // Let's Add User Message AFTER LLM for this demo to ensure feedback is attached?
                // No, that feels slow.
                // Re-implementation: Add user message first (no feedback). Then update it?
                // Since we don't have update logic, I will just proceed without displaying feedback on the bubbles for this step
                // OR I will wait for LLM to return before adding the User Message to the store.
                // It's a slightly longer "Processing" wait, but ensures data consistency.

                // RETRYING: Logic - data consistency first.
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
                audioUrl: audioPath || undefined,
                translation: aiResponse.translation,
                // Ensure this matches the new type: { text, translation } | undefined
                suggestedResponse: aiResponse.suggestedResponse
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
                    <Text style={styles.headerTitle}>{SCENARIO_TITLES[scenario] || 'Conversation'}</Text>
                    <Text style={styles.headerSubtitle}>{targetLanguage.toUpperCase()} • {level.toUpperCase()}</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <MoreVertical size={24} color={Theme.colors.text} />
                </TouchableOpacity>
            </View>

            {/* Transcript */}
            <ScrollView
                ref={scrollViewRef}
                style={{ flex: 1 }}
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
                            translation={msg.translation}
                        />

                        {msg.feedback && (
                            <View style={styles.feedbackWrapper}>
                                <FeedbackCard
                                    original={msg.feedback.original}
                                    improved={msg.feedback.improved}
                                    explanation={msg.feedback.explanation}
                                    onRetry={() => { }}
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

            {/* Footer Controls */}
            <View style={styles.footerContainer}>
                {/* Suggested Response */}
                {transcript.length > 0 && transcript[transcript.length - 1].role === 'assistant' && transcript[transcript.length - 1].suggestedResponse && (
                    <View style={styles.suggestionContainer}>
                        <View style={styles.suggestionLabelContainer}>
                            <Lightbulb size={12} color="#FFF" />
                            <Text style={styles.suggestionLabel}>Suggestion</Text>
                        </View>
                        <Text style={styles.suggestionText}>
                            "{transcript[transcript.length - 1].suggestedResponse?.text}"
                        </Text>
                        <Text style={styles.suggestionTranslation}>
                            {transcript[transcript.length - 1].suggestedResponse?.translation}
                        </Text>
                    </View>
                )}

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
            </View>

            {/* End Session Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
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
                                // Save Session
                                await StorageService.saveSession({
                                    id: Date.now().toString(),
                                    date: new Date().toISOString(),
                                    scenario: scenario,
                                    language: targetLanguage,
                                    level: level,
                                    turnsCount: transcript.length
                                });

                                // Extract and Save Flashcards
                                const newCards = transcript
                                    .filter(msg => msg.feedback)
                                    .map(msg => ({
                                        id: Date.now().toString() + Math.random(),
                                        front: msg.feedback!.original,
                                        back: msg.feedback!.improved,
                                        context: msg.feedback!.explanation,
                                        sessionId: Date.now().toString()
                                    }));

                                if (newCards.length > 0) {
                                    await StorageService.saveFlashcards(newCards);
                                }

                                setModalVisible(false);
                                router.replace('/session-summary');
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
    footerContainer: {
        width: '100%',
        paddingBottom: 20,
        paddingTop: 10,
        alignItems: 'center',
        backgroundColor: '#F9FAFB', // Match container bg to avoid transparency issues
    },
    suggestionContainer: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 12,
        borderRadius: 16,
        marginBottom: 16,
        maxWidth: '85%',
        alignItems: 'center',
    },
    suggestionLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 4,
    },
    suggestionLabel: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    suggestionText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
    suggestionTranslation: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 4,
    },
});
