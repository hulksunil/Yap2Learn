import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CheckCircle, Lightbulb, RotateCcw, Volume2 } from 'lucide-react-native';
import { Theme } from '../constants/theme';

interface FeedbackCardProps {
    original: string;
    improved: string;
    explanation: string;
    onPlay?: () => void;
    isPlaying?: boolean;
    isLoading?: boolean;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ original, improved, explanation, onPlay, isPlaying, isLoading }) => {
    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <CheckCircle size={20} color={Theme.colors.secondary} style={styles.icon} />
                <View style={styles.content}>
                    <Text style={styles.label}>BETTER WAY</Text>
                    <Text style={styles.improvedText}>{improved}</Text>
                </View>
                {onPlay && (
                    <TouchableOpacity
                        style={styles.audioBtn}
                        onPress={onPlay}
                        disabled={isLoading || isPlaying}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color={Theme.colors.secondary} />
                        ) : (
                            <Volume2 size={20} color={isPlaying ? Theme.colors.primary : Theme.colors.secondary} />
                        )}
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
                <Lightbulb size={20} color={Theme.colors.secondary} style={styles.icon} />
                <View style={styles.content}>
                    <Text style={styles.explanationText}>{explanation}</Text>
                </View>
            </View>
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
    audioBtn: {
        marginLeft: 8,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
    }
});
