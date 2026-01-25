import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Volume2, X, Check } from 'lucide-react-native';
import { Theme } from '../constants/theme';

interface SavedPhraseProps {
    french: string;
    english: string;
}

export const SavedPhraseCard: React.FC<SavedPhraseProps> = ({ french, english }) => (
    <View style={styles.card}>
        <View style={{ flex: 1 }}>
            <Text style={styles.frenchText}>{french}</Text>
            <Text style={styles.englishText}>{english}</Text>
        </View>
        <TouchableOpacity style={styles.audioButton}>
            <Volume2 size={20} color={Theme.colors.primary} />
        </TouchableOpacity>
    </View>
);

interface CorrectionCardProps {
    wrong: string;
    right: string;
    onPlay?: () => void;
    isPlaying?: boolean;
    isLoading?: boolean;
}

export const CorrectionCard: React.FC<CorrectionCardProps> = ({ wrong, right, onPlay, isPlaying, isLoading }) => (
    <View style={[styles.card, styles.correctionCard]}>
        {/* Wrong Part */}
        <View style={styles.correctionRow}>
            <X size={16} color={Theme.colors.error} style={{ marginTop: 2 }} />
            <View style={{ marginLeft: 8, flex: 1 }}>
                <Text style={[styles.label, { color: Theme.colors.error }]}>YOU SAID</Text>
                <Text style={styles.wrongText}>"{wrong}"</Text>
            </View>
        </View>

        {/* Right Part */}
        <View style={[styles.correctionRow, { marginTop: 12 }]}>
            <Check size={16} color={Theme.colors.success} style={{ marginTop: 2 }} />
            <View style={{ marginLeft: 8, flex: 1 }}>
                <Text style={[styles.label, { color: Theme.colors.success }]}>BETTER</Text>
                <Text style={styles.rightText}>"{right}"</Text>
            </View>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={onPlay}
                disabled={isLoading || isPlaying}
                style={{ padding: 4 }}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color={Theme.colors.success} />
                ) : (
                    <Volume2 size={16} color={isPlaying ? Theme.colors.primary : Theme.colors.success} />
                )}
            </TouchableOpacity>
        </View>
    </View>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.borderRadius.lg,
        padding: Theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Theme.spacing.sm,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    correctionCard: {
        flexDirection: 'column',
        alignItems: 'stretch',
    },
    frenchText: {
        fontSize: 16,
        fontWeight: '600',
        color: Theme.colors.text,
        marginBottom: 2,
    },
    englishText: {
        fontSize: 14,
        color: Theme.colors.textSecondary,
    },
    audioButton: {
        padding: 8,
        backgroundColor: '#EFF6FF',
        borderRadius: 20,
        marginLeft: 8,
    },
    correctionRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    label: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    wrongText: {
        fontSize: 16,
        color: Theme.colors.text,
    },
    rightText: {
        fontSize: 16,
        color: Theme.colors.text,
        fontWeight: '600',
    }
});
