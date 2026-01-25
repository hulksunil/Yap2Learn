import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Volume2, RotateCw } from 'lucide-react-native';
import { Theme } from '../constants/theme';

interface FlashcardProps {
    front: string;
    back: string;
    onPlay?: () => void;
    isPlaying?: boolean;
    isLoading?: boolean;
    targetLanguage?: string;
    nativeLanguage?: string;
    hideFrontLabel?: boolean;
}

export const Flashcard: React.FC<FlashcardProps> = ({
    front,
    back,
    onPlay,
    isPlaying,
    isLoading,
    targetLanguage = 'Target',
    nativeLanguage = 'Native',
    hideFrontLabel = false
}) => {
    const [flipped, setFlipped] = useState(false);

    // Legacy support: strip example sentence if present (delimited by \n\n)
    const cleanBack = back.includes('\n\n') ? back.split('\n\n')[0] : back;

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setFlipped(!flipped)}
            style={styles.card}
        >
            <View style={styles.header}>
                {(!hideFrontLabel || flipped) && (
                    <View style={[styles.tag, { backgroundColor: flipped ? '#F3F4F6' : '#EFF6FF' }]}>
                        <Text style={[styles.tagText, { color: flipped ? Theme.colors.textSecondary : Theme.colors.primary }]}>
                            {flipped ? nativeLanguage : targetLanguage}
                        </Text>
                    </View>
                )}
                {(hideFrontLabel && !flipped) && <View />}
                {!flipped && onPlay && (
                    <TouchableOpacity
                        style={styles.audioBtn}
                        onPress={onPlay}
                        disabled={isLoading || isPlaying}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color={Theme.colors.primary} />
                        ) : (
                            <Volume2 size={24} color={isPlaying ? Theme.colors.secondary : Theme.colors.primary} />
                        )}
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.content}>
                <Text style={styles.mainText}>{flipped ? cleanBack : front}</Text>
            </View>

            <View style={styles.footer}>
                <Text style={styles.flipText}>TAP TO FLIP</Text>
                <RotateCw size={14} color={Theme.colors.textSecondary} style={{ marginLeft: 6 }} />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.borderRadius.xl,
        padding: Theme.spacing.lg,
        height: 400, // Fixed height for design fidelity
        width: '100%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        height: 40,
    },
    tag: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    tagText: {
        color: Theme.colors.primary,
        fontWeight: 'bold',
        fontSize: 12,
    },
    audioBtn: {
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingHorizontal: 10,
    },
    mainText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Theme.colors.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.6,
    },
    flipText: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
        color: Theme.colors.textSecondary,
    }
});
