import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../constants/theme';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react-native';
import { Flashcard } from '../components/Flashcard';
import { StorageService, FlashcardData } from '../services/storage';

export default function FlashcardsScreen() {
    const router = useRouter();
    const [cards, setCards] = useState<FlashcardData[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useFocusEffect(
        React.useCallback(() => {
            loadCards();
        }, [])
    );

    const loadCards = async () => {
        const data = await StorageService.getFlashcards();
        setCards(data);
    };

    const handleNext = () => {
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
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
                        phonetic={currentCard.context} // Using context as phonetic logic/explanation for now
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
