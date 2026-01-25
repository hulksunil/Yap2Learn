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
    const { sessionId } = useLocalSearchParams();

    // -- STATE --
    const [allLocalCards, setAllLocalCards] = useState<FlashcardData[]>([]);
    const [displayedCards, setDisplayedCards] = useState<FlashcardData[]>([]); // What is actually shown
    const [currentIndex, setCurrentIndex] = useState(0);

    const [currentScenarioId, setCurrentScenarioId] = useState<string>('All');
    const [allScenarios, setAllScenarios] = useState<string[]>(['All']);
    const [showPicker, setShowPicker] = useState(false);
    const [scenarioMap, setScenarioMap] = useState<Record<string, string>>({}); // sessionId -> scenarioName (Title)
    const [isSingleSessionMode, setIsSingleSessionMode] = useState(false);
    const [singleSessionId, setSingleSessionId] = useState<string | null>(null);

    const [sound, setSound] = useState<Audio.Sound>();
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const { nativeLanguage: globalNativeLanguage } = useSessionStore();

    const [targetLang, setTargetLang] = useState('French');
    const [nativeLang, setNativeLang] = useState(globalNativeLanguage || 'English');

    const [mode, setMode] = useState<'SCENARIO' | 'STRUGGLES'>('SCENARIO');

    useFocusEffect(
        React.useCallback(() => {
            initializeScreen();
            return () => {
                if (sound) sound.unloadAsync();
            };
        }, [])
    );

    // Effect: Filter cards when Scenario or Mode changes
    // Effect: Filter cards when Scenario or Mode changes
    React.useEffect(() => {
        if (mode === 'SCENARIO') {
            if (isSingleSessionMode && singleSessionId) {
                // Strict filter for single session
                setDisplayedCards(allLocalCards.filter(c => c.sessionId === singleSessionId));
            } else {
                filterCardsByScenario(currentScenarioId);
            }
        } else if (mode === 'STRUGGLES') {
            loadStruggles();
        }
    }, [currentScenarioId, mode, allLocalCards]);

    const initializeScreen = async () => {
        // 1. Parallel Load Local Data (Blocking for minimal time)
        const [history, flashcards] = await Promise.all([
            StorageService.getHistory(),
            StorageService.getFlashcards()
        ]);

        // 2. Build Scenario Map (sessionId -> Title)
        const sMap: Record<string, string> = {};
        const distinctScenarios = new Set<string>();

        history.forEach(s => {
            // Prefer Title, fallback to standard mapping, fallback to raw
            let title = s.scenarioTitle;
            if (!title) {
                if (s.scenario === 'cafe') title = 'Ordering at a Cafe';
                else if (s.scenario === 'job') title = 'Job Interview';
                else title = s.scenario; // fallback
            }

            if (s.id) {
                sMap[s.id] = title;
                if (title && title.trim().length > 0) {
                    distinctScenarios.add(title);
                }
            }
        });
        setScenarioMap(sMap);

        // 3. Update Scenario List (Local First)
        const sortedScenarios = Array.from(distinctScenarios).sort();
        setAllScenarios(['All', ...sortedScenarios]);

        // 4. Set Local Cards State
        setAllLocalCards(flashcards);

        // 5. Intelligent Default Selection
        const sid = Array.isArray(sessionId) ? sessionId[0] : sessionId;

        if (sid) {
            // Single Session Mode
            setIsSingleSessionMode(true);
            setSingleSessionId(sid);

            // Set context for Dropdown Label (visual only)
            const targetTitle = sMap[sid];
            if (targetTitle) setCurrentScenarioId(targetTitle);

            // Set languages from session
            const sess = history.find(s => s.id === sid);
            if (sess) {
                setTargetLang(sess.language || 'French');
                if (sess.nativeLanguage) setNativeLang(sess.nativeLanguage);
            }
        } else if (history.length > 0) {
            // Default to most recent scenario
            const last = history[0];
            const lastTitle = sMap[last.id];
            if (lastTitle) {
                setCurrentScenarioId(lastTitle);
                setTargetLang(last.language || 'French');
            }
        }

        // 6. Background: Fetch Cloud Scenarios to enrich list
        // fetchCloudScenarios(distinctScenarios);
    };

    const filterCardsByScenario = (scenario: string) => {
        let filtered: FlashcardData[] = [];

        if (scenario === 'All') {
            filtered = allLocalCards;
        } else {
            // Filter local cards that belong to sessions of this scenario
            // Look up which sessionIds map to this scenario
            filtered = allLocalCards.filter(c => scenarioMap[c.sessionId] === scenario);
        }

        // Safety: If filtered is empty for 'All', it's truly empty.
        // If filtered is empty for specific scenario locally, it might be cloud only.

        setDisplayedCards(filtered);
        // Reset index only if we are out of bounds or just switched context
        // Simple approach: Always reset index on filter change
        if (currentIndex >= filtered.length) {
            setCurrentIndex(0);
        }
    };

    // const fetchCloudScenarios = async (localSet: Set<string>) => { ... }
    // const fetchCloudCardsForScenario = async (scenario: string) => { ... }

    const loadStruggles = async () => {
        setDisplayedCards([]);
        try {
            // Use local history instead of Mongo
            const history = await StorageService.getHistory();
            const struggleCards: FlashcardData[] = [];

            history.forEach(session => {
                if (session.recap && session.recap.top_corrections) {
                    session.recap.top_corrections.forEach((c: any, index: number) => {
                        struggleCards.push({
                            id: `struggle-${session.id}-${index}`,
                            front: c.you_said, // Keep just the text for cleaner TTS. Context explains it's a correction.
                            back: c.better,
                            context: `💡 Correction for: "${c.you_said}"\n\n${c.tip}`,
                            sessionId: session.id,
                            language: session.language,
                            nativeLanguage: session.nativeLanguage
                        });
                    });
                }
            });

            // Randomize or sort by date? Let's show most recent first (which history is already sorting, but we are pushing)
            // History is ordered new -> old.
            // Pushing in order means newest first.

            setDisplayedCards(struggleCards);
        } catch (e) {
            console.error('Failed to load local struggles', e);
            setDisplayedCards([]);
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
        if (currentIndex < displayedCards.length - 1) {
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

    const currentCard = displayedCards[currentIndex];

    // -- HELPER: Friendly Titles --
    // Now we use titles directly from the map, so this fallback is minimal
    const getDisplayTitle = (scen: string) => {
        return scen;
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color={Theme.colors.text} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setShowPicker(!showPicker)} style={styles.headerPicker}>
                    <Text style={styles.headerTitle}>
                        {mode === 'STRUGGLES' ? 'Struggled With' : getDisplayTitle(currentScenarioId || 'All')}
                    </Text>
                    {mode === 'SCENARIO' && <ArrowRight size={16} color={Theme.colors.textSecondary} style={{ transform: [{ rotate: '90deg' }] }} />}
                </TouchableOpacity>
                <View style={{ width: 24 }} />
            </View>

            {/* Scenario Picker (Scrollable List) */}
            {showPicker && mode === 'SCENARIO' && (
                <View style={styles.pickerContainer}>
                    <Text style={styles.pickerTitle}>SELECT A SCENARIO</Text>
                    {allScenarios.length > 0 ? (
                        allScenarios.map(scen => (
                            <TouchableOpacity
                                key={scen}
                                style={[styles.pickerItem, scen === currentScenarioId && styles.pickerItemActive]}
                                onPress={() => {
                                    setCurrentScenarioId(scen);
                                    setIsSingleSessionMode(false); // Reset single session mode
                                    setSingleSessionId(null);
                                    setShowPicker(false);
                                }}
                            >
                                <Text style={[styles.pickerItemText, scen === currentScenarioId && styles.pickerItemTextActive]}>
                                    {getDisplayTitle(scen)}
                                </Text>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={{ padding: 10, color: '#999' }}>No scenarios found yet.</Text>
                    )}
                </View>
            )}

            {/* Mode Toggle */}
            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[styles.toggleBtn, mode === 'SCENARIO' && styles.toggleBtnActive]}
                    onPress={() => { setMode('SCENARIO'); setCurrentIndex(0); }}
                >
                    <Text style={[styles.toggleText, mode === 'SCENARIO' && styles.toggleTextActive]}>By Scenario</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleBtn, mode === 'STRUGGLES' && styles.toggleBtnActive]}
                    onPress={() => { setMode('STRUGGLES'); setCurrentIndex(0); }}
                >
                    <Text style={[styles.toggleText, mode === 'STRUGGLES' && styles.toggleTextActive]}>Struggled With</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {displayedCards.length > 0 ? (
                    <Flashcard
                        key={currentCard.id}
                        front={currentCard.front}
                        back={currentCard.back}
                        targetLanguage={currentCard.language || targetLang}
                        // For Struggles, the back is also Target Language (Correction), not Native.
                        // So we pass target language as the "nativeLanguage" prop to show correct label on flip.
                        nativeLanguage={mode === 'STRUGGLES'
                            ? (currentCard.language || targetLang)
                            : (currentCard.nativeLanguage || nativeLang)
                        }
                        hideFrontLabel={mode === 'STRUGGLES'}
                        // Play corrected audio (back) if struggles, else front (phrase)
                        onPlay={() => playAudio(
                            mode === 'STRUGGLES' ? currentCard.back : currentCard.front,
                            currentCard.id
                        )}
                        isPlaying={playingId === currentCard.id}
                        isLoading={loadingId === currentCard.id}
                    />
                ) : (
                    <View style={{ alignItems: 'center', marginTop: 40 }}>
                        <Text style={styles.emptyText}>
                            {mode === 'STRUGGLES'
                                ? "No smart recommendations yet.\nTry initializing the cloud or practicing more!"
                                : "No flashcards found for this scenario."}
                        </Text>
                    </View>
                )}

                {displayedCards.length > 0 && (
                    <Text style={styles.counter}>{currentIndex + 1} / {displayedCards.length}</Text>
                )}
            </View>

            {/* Navigation Buttons */}
            {displayedCards.length > 0 && (
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
                        style={[styles.navBtnPrimary, currentIndex === displayedCards.length - 1 && { opacity: 0.5 }]}
                        onPress={handleNext}
                        disabled={currentIndex === displayedCards.length - 1}
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
    },
    toggleContainer: {
        flexDirection: 'row',
        marginHorizontal: 24,
        backgroundColor: '#E5E7EB',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 10,
    },
    toggleBtnActive: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: Theme.colors.textSecondary,
    },
    toggleTextActive: {
        color: Theme.colors.primary,
    },
    headerPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F3F4F6',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    pickerContainer: {
        position: 'absolute',
        top: 100,
        left: 24,
        right: 24,
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        zIndex: 100,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    pickerTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Theme.colors.textSecondary,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    pickerItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    pickerItemActive: {
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        paddingHorizontal: 8,
    },
    pickerItemText: {
        fontSize: 16,
        color: Theme.colors.text,
    },
    pickerItemTextActive: {
        color: Theme.colors.primary,
        fontWeight: '600',
    }
});
