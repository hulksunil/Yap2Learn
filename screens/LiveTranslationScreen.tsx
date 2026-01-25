import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../constants/theme';
import { ArrowLeft, Mic, Volume2 } from 'lucide-react-native';
import { LLMService } from '../services/api/llm';
import { TTSService } from '../services/api/tts';
import { AudioService } from '../services/audioService';
import { PulseButton } from '../components/PulseButton';
import { Audio } from 'expo-av';

export default function LiveTranslationScreen() {
    const router = useRouter();
    const [isListening, setIsListening] = useState(false);
    const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'speaking'>('idle');
    const [sound, setSound] = useState<Audio.Sound>();

    // Languages
    const LANGUAGES = ['English', 'French', 'Spanish', 'German', 'Italian', 'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Russian', 'Arabic'];
    const [langA, setLangA] = useState('English');
    const [langB, setLangB] = useState('French');

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [selectingSide, setSelectingSide] = useState<'A' | 'B'>('A');

    const [translations, setTranslations] = useState<{
        id: string;
        original: string;
        translation: string;
        detectedLang: string;
    }[]>([]);

    useEffect(() => {
        return () => {
            if (sound) sound.unloadAsync();
        };
    }, [sound]);

    const openLangModal = (side: 'A' | 'B') => {
        setSelectingSide(side);
        setModalVisible(true);
    };

    const selectLanguage = (lang: string) => {
        if (selectingSide === 'A') {
            if (lang === langB) setLangB(langA); // Swap if same
            setLangA(lang);
        } else {
            if (lang === langA) setLangA(langB); // Swap if same
            setLangB(lang);
        }
        setModalVisible(false);
    };

    const playAudio = async (text: string) => {
        if (sound) await sound.unloadAsync();
        const uri = await TTSService.generateAudio(text);
        if (uri) {
            const { sound: newSound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
            setSound(newSound);
        }
    };

    const handleMicToggle = async () => {
        if (status === 'idle') {
            // START RECORDING
            const hasPerm = await AudioService.requestPermissions();
            if (!hasPerm) {
                alert('Microphone permission required.');
                return;
            }
            setStatus('recording');
            await AudioService.startRecording();
        } else if (status === 'recording') {
            // STOP RECORDING
            const uri = await AudioService.stopRecording();
            if (!uri) {
                setStatus('idle');
                return;
            }
            setStatus('processing');

            // Send to Native Audio Translation Model
            const result = await LLMService.translateLiveAudio(uri, langA, langB);

            if (result) {
                const newEntry = {
                    id: Date.now().toString(),
                    original: result.originalTranscript,
                    translation: result.translation,
                    detectedLang: result.detectedLanguage
                };
                setTranslations(prev => [...prev, newEntry]);

                // Speak the translation
                setStatus('speaking');
                await playAudio(result.translation);
                setStatus('idle');
            } else {
                alert("Translation failed. Try again.");
                setStatus('idle');
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color={Theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Live Translation</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.languageBar}>
                <TouchableOpacity style={styles.langBadge} onPress={() => openLangModal('A')}>
                    <Text style={styles.langText}>{langA}</Text>
                </TouchableOpacity>
                <Text style={{ color: Theme.colors.textSecondary }}>⇄</Text>
                <TouchableOpacity style={styles.langBadge} onPress={() => openLangModal('B')}>
                    <Text style={styles.langText}>{langB}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {translations.length === 0 && (
                    <Text style={styles.placeholder}>
                        Tap the mic and speak in {langA} or {langB}. The AI will auto-detect and translate.
                    </Text>
                )}
                {translations.map((t) => (
                    <View key={t.id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.detectedLabel}>{t.detectedLang}</Text>
                        </View>
                        <Text style={styles.originalText}>{t.original}</Text>

                        <View style={styles.divider} />

                        <View style={styles.translationRow}>
                            <Text style={styles.translationText}>{t.translation}</Text>
                            <TouchableOpacity onPress={() => playAudio(t.translation)}>
                                <Volume2 size={20} color={Theme.colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <PulseButton
                    state={status}
                    onPress={handleMicToggle}
                />
                <Text style={styles.statusText}>
                    {status === 'idle' ? 'Tap to Speak' :
                        status === 'recording' ? 'Listening...' :
                            status === 'processing' ? 'Translating...' : 'Speaking...'}
                </Text>
            </View>

            {/* Language Selection Modal */}
            {modalVisible && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Language</Text>
                        <ScrollView style={{ maxHeight: 300, width: '100%' }}>
                            {LANGUAGES.map(lang => (
                                <TouchableOpacity
                                    key={lang}
                                    style={styles.langOption}
                                    onPress={() => selectLanguage(lang)}
                                >
                                    <Text style={[
                                        styles.langOptionText,
                                        (selectingSide === 'A' ? langA === lang : langB === lang) && { color: Theme.colors.primary, fontWeight: 'bold' }
                                    ]}>
                                        {lang}
                                    </Text>
                                    {(selectingSide === 'A' ? langA === lang : langB === lang) && (
                                        <Text style={{ color: Theme.colors.primary }}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                            <Text style={{ color: Theme.colors.textSecondary }}>Cancel</Text>
                        </TouchableOpacity>
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
        padding: Theme.spacing.md,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.colors.text,
    },
    languageBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
        backgroundColor: '#FFF',
    },
    langBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    langText: {
        color: Theme.colors.primary,
        fontWeight: 'bold',
    },
    content: {
        padding: Theme.spacing.md,
        paddingBottom: 120,
    },
    placeholder: {
        textAlign: 'center',
        color: Theme.colors.textSecondary,
        marginTop: 40,
        fontSize: 16,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    detectedLabel: {
        fontSize: 12,
        color: Theme.colors.textSecondary,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    originalText: {
        fontSize: 16,
        color: Theme.colors.textSecondary,
        fontStyle: 'italic',
        marginBottom: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 12,
    },
    translationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    translationText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.colors.text,
        flex: 1,
        marginRight: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        alignItems: 'center',
        paddingBottom: 40,
        backgroundColor: 'rgba(249,250,251,0.9)',
    },
    statusText: {
        marginTop: 12,
        color: Theme.colors.textSecondary,
        fontWeight: '500',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        maxHeight: '60%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: Theme.colors.text,
    },
    langOption: {
        paddingVertical: 12,
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    langOptionText: {
        fontSize: 16,
        color: Theme.colors.text,
    },
    closeBtn: {
        marginTop: 16,
        padding: 12,
    }
});
