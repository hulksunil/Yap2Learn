import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../constants/theme';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react-native';
import { Flashcard } from '../components/Flashcard';
import { StorageService, FlashcardData } from '../services/storage';
import { TTSService } from '../services/api/tts';
import { Audio } from 'expo-av';
import { useSessionStore } from '../store/useSessionStore';

export default function FlashcardsScreen() {
    const router = useRouter();
    // Get sessionId from params if passed (e.g. from summary)
    // Note: expo-router useLocalSearchParams might return string | string[]
    const { sessionId } = useLocalSearchParams();

    const [cards, setCards] = useState<FlashcardData[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const [sound, setSound] = useState<Audio.Sound>();
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const { nativeLanguage: globalNativeLanguage } = useSessionStore();

    const [targetLang, setTargetLang] = useState('French');
    const [nativeLang, setNativeLang] = useState(globalNativeLanguage || 'English');

    useFocusEffect(
        React.useCallback(() => {
            loadCards();
            return () => {
                if (sound) sound.unloadAsync();
            };
        }, [])
    );

    const loadCards = async () => {
        const sid = Array.isArray(sessionId) ? sessionId[0] : sessionId;
        const data = await StorageService.getFlashcards(sid);
        setCards(data);

        // Fetch session for language info
        if (sid) {
            const history = await StorageService.getHistory();
            const session = history.find(s => s.id === sid);
            if (session) {
                setTargetLang(session.language || 'French');
                if (session.nativeLanguage) {
                    setNativeLang(session.nativeLanguage);
                }
                console.log('FlashcardsScreen: loaded session languages', {
                    sid,
                    target: session.language || 'French',
                    native: session.nativeLanguage || 'undefined',
                    currentNativeState: nativeLang
                });
            }
        }
    };

    const playAudio = async (text: string, id: string) => {
        if (loadingId) return; // Prevent double load
        if (playingId === id && sound) {
            // Already playing this one? Maybe stop?
            // Simple logic: Stop current if playing
            await sound.stopAsync();
            setPlayingId(null);
            return;
        }

        // Stop any previous
        if (sound) {
            await sound.unloadAsync();
            setSound(undefined);
            setPlayingId(null);
        }

        try {
            setLoadingId(id);
            const uri = await TTSService.generateAudio(text);
            if (uri) {
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri },
                    { shouldPlay: true }
                );

                newSound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish) {
                        setPlayingId(null);
                        setSound(undefined);
                    }
                });

                setSound(newSound);
                setPlayingId(id);
            }
        } catch (error) {
            console.log('Error playing flashcard audio:', error);
        } finally {
            setLoadingId(null);
        }
    };

    const handleNext = () => {
        // Stop audio when changing cards
        if (sound) {
            sound.stopAsync();
            setPlayingId(null);
        }
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        if (sound) {
            sound.stopAsync();
            setPlayingId(null);
        }
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const currentCard = cards[currentIndex];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color={Theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Review Flashcards</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                {cards.length > 0 ? (
                    <Flashcard
                        key={currentCard.id}
                        front={currentCard.front}
                        back={currentCard.back}
                        targetLanguage={targetLang}
                        nativeLanguage={nativeLang}
                        // Remove phonetic prop
                        onPlay={() => playAudio(currentCard.front, currentCard.id)}
                        isPlaying={playingId === currentCard.id}
                        isLoading={loadingId === currentCard.id}
                    />
                ) : (
                    <Text style={styles.emptyText}>No flashcards saved yet.</Text>
                )}

                {cards.length > 0 && (
                    <Text style={styles.counter}>{currentIndex + 1} / {cards.length}</Text>
                )}
            </View>

            {/* Navigation Buttons */}
            {cards.length > 0 && (
                <View style={styles.navContainer}>
                    <TouchableOpacity
                        style={[styles.navBtn, currentIndex === 0 && { opacity: 0.5 }]}
                        onPress={handlePrev}
                        disabled={currentIndex === 0}
                    >
                        <ArrowLeft size={20} color={Theme.colors.text} />
                        <Text style={styles.navBtnText}>Previous</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.navBtnPrimary, currentIndex === cards.length - 1 && { opacity: 0.5 }]}
                        onPress={handleNext}
                        disabled={currentIndex === cards.length - 1}
                    >
                        <Text style={styles.navBtnTextPrimary}>Next</Text>
                        <ArrowRight size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Mock Bottom Tab Bar */}
            <View style={styles.tabBar}>
                <TouchableOpacity style={styles.tabItem} onPress={() => router.navigate('/start-session')}>
                    <Home size={24} color={Theme.colors.textSecondary} />
                    <Text style={styles.tabLabel}>Home</Text>
                </TouchableOpacity>
            </View>
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
        marginBottom: Theme.spacing.lg,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.colors.text,
    },
    content: {
        paddingHorizontal: 24,
        alignItems: 'center',
        flex: 1,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: Theme.colors.textSecondary,
        fontSize: 16,
    },
    counter: {
        marginTop: 16,
        color: Theme.colors.textSecondary,
        fontWeight: '600',
    },
    navContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    navBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    navBtnText: {
        marginLeft: 8,
        fontWeight: '600',
        color: Theme.colors.text,
    },
    navBtnPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    navBtnTextPrimary: {
        marginRight: 8,
        fontWeight: '600',
        color: '#FFF',
    },
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    tabItem: {
        alignItems: 'center',
    },
    tabLabel: {
        fontSize: 10,
        marginTop: 4,
        color: Theme.colors.textSecondary,
    }
});
