import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle, Lightbulb, RotateCcw } from 'lucide-react-native';
import { Theme } from '../constants/theme';

interface FeedbackCardProps {
    original: string;
    improved: string;
    explanation: string;
    onRetry?: () => void;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ original, improved, explanation, onRetry }) => {
    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <CheckCircle size={20} color={Theme.colors.secondary} style={styles.icon} />
                <View style={styles.content}>
                    <Text style={styles.label}>BETTER WAY</Text>
                    <Text style={styles.improvedText}>{improved}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
                <Lightbulb size={20} color={Theme.colors.secondary} style={styles.icon} />
                <View style={styles.content}>
                    <Text style={styles.explanationText}>{explanation}</Text>
                </View>
            </View>

            {onRetry && (
                <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                    <RotateCcw size={16} color={Theme.colors.primary} />
                    <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFF7ED', // Very light orange/cream
        borderRadius: Theme.borderRadius.lg,
        padding: Theme.spacing.md,
        borderWidth: 1,
        borderColor: '#FED7AA', // Light orange border
        marginVertical: Theme.spacing.sm,
    },
    section: {
        flexDirection: 'row',
        marginBottom: Theme.spacing.sm,
    },
    icon: {
        marginTop: 2,
        marginRight: Theme.spacing.sm,
    },
    content: {
        flex: 1,
    },
    label: {
        color: Theme.colors.secondary,
        fontWeight: 'bold',
        fontSize: 12,
        marginBottom: 4,
    },
    improvedText: {
        color: Theme.colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    explanationText: {
        color: Theme.colors.textSecondary,
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: '#FED7AA',
        marginVertical: Theme.spacing.sm,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: Theme.spacing.xs,
    },
    retryText: {
        color: Theme.colors.primary,
        fontWeight: '600',
        marginLeft: 6,
        fontSize: 14,
    },
});
