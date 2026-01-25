import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Theme } from '../constants/theme';
import { useSessionStore } from '../store/useSessionStore';
import { MessageSquare } from 'lucide-react-native';

export default function SplashScreen() {
    const router = useRouter();

    const { hasOnboarded } = useSessionStore();

    useEffect(() => {
        // Build version of hydration check could be better, but this works for now
        // since persist is sync with AsyncStorage usually needs a hydration wait but 
        // zustand persist is often fast enough or has hydration logic.
        // For robustness, we might want to check if hydrated.
        // Assuming sync-like behavior for local tests, but normally async.

        const timer = setTimeout(() => {
            if (hasOnboarded) {
                router.replace('/start-session');
            } else {
                router.replace('/onboarding');
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, [hasOnboarded]);

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <View style={styles.iconWrapper}>
                    <MessageSquare size={48} color="#FFF" fill="#FFF" />
                </View>
                <Text style={styles.title}>Yap2Learn</Text>
                <Text style={styles.subtitle}>Learning to yap</Text>
            </View>

            <View style={styles.loaderContainer}>
                <View style={styles.progressBar}>
                    <View style={styles.progressFill} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F8FF', // Very light blue tint
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 60,
    },
    iconWrapper: {
        backgroundColor: Theme.colors.primary,
        width: 80,
        height: 80,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Theme.spacing.md,
        shadowColor: Theme.colors.primary,
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
        elevation: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: Theme.colors.textSecondary,
    },
    loaderContainer: {
        position: 'absolute',
        bottom: 80,
        width: '100%',
        alignItems: 'center',
    },
    progressBar: {
        width: 120,
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        width: '40%', // Static for now, or animated
        height: '100%',
        backgroundColor: Theme.colors.primary,
        borderRadius: 3,
    }
});
