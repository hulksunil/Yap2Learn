import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Volume2, RotateCw } from 'lucide-react-native';
import { Theme } from '../constants/theme';

interface FlashcardProps {
    front: string;
    back: string;
    phonetic?: string;
}

export const Flashcard: React.FC<FlashcardProps> = ({ front, back, phonetic }) => {
    const [flipped, setFlipped] = useState(false);

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setFlipped(!flipped)}
            style={styles.card}
        >
            <View style={styles.header}>
                <View style={styles.tag}>
                    <Text style={styles.tagText}>French - Level 1</Text>
                </View>
                <TouchableOpacity style={styles.audioBtn}>
                    <Volume2 size={20} color={Theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.mainText}>{flipped ? back : front}</Text>
                {phonetic && !flipped && <Text style={styles.subText}>({phonetic})</Text>}
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
    },
    mainText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: Theme.colors.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    subText: {
        fontSize: 18,
        color: Theme.colors.textSecondary,
        fontWeight: '400',
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
