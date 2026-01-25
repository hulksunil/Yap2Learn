import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Mic } from 'lucide-react-native';
import { Theme } from '../constants/theme';

interface PulseButtonProps {
    onPress: () => void;
    state: 'idle' | 'recording' | 'processing' | 'speaking';
}

export const PulseButton: React.FC<PulseButtonProps> = ({ onPress, state }) => {
    return (
        <View style={styles.wrapper}>
            <View style={styles.outerRing}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={onPress}
                    activeOpacity={0.8}
                >
                    <Mic size={32} color="#FFF" />
                </TouchableOpacity>
            </View>
            {state === 'processing' && (
                <Text style={styles.statusText}>Processing...</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    outerRing: {
        width: 100, // Placeholder for ripple effect
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#BFDBFE', // Light blue
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Theme.spacing.sm,
    },
    button: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    statusText: {
        color: Theme.colors.textSecondary,
        fontWeight: '600',
        marginTop: Theme.spacing.xs,
    }
});
