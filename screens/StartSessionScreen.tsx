import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../constants/theme';
import { useSessionStore } from '../store/useSessionStore';
import { X, MessageSquare, Coffee, Briefcase, ArrowRight, MoreVertical } from 'lucide-react-native';

export default function StartSessionScreen() {
    const router = useRouter();
    const { setSessionConfig, resetSession, targetLanguage } = useSessionStore();
    // Local state only for level and scenario now
    const [level, setLevel] = useState('Intermediate');
    const [selectedScenario, setSelectedScenario] = useState('cafe');
    const [showMenu, setShowMenu] = useState(false);

    const handleStart = () => {
        resetSession();
        setSessionConfig(level, selectedScenario); // Updated store method
        router.push('/conversation');
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ width: 24 }} />
                <View style={styles.headerTitleContainer}>
                    <MessageSquare size={18} color={Theme.colors.primary} fill={Theme.colors.primary} />
                    <Text style={styles.headerTitle}>Start Session</Text>
                </View>
                <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
                    <MoreVertical size={24} color={Theme.colors.text} />
                </TouchableOpacity>
            </View>

            {
                showMenu && (
                    <View style={styles.menuContainer}>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                setShowMenu(false);
                                router.push('/settings');
                            }}
                        >
                            <Text style={styles.menuText}>Settings</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                setShowMenu(false);
                                router.push('/history');
                            }}
                        >
                            <Text style={styles.menuText}>History</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                setShowMenu(false);
                                router.push('/flashcards');
                            }}
                        >
                            <Text style={styles.menuText}>View Flashcards</Text>
                        </TouchableOpacity>
                    </View>
                )
            }

            <ScrollView contentContainerStyle={styles.content}>
                {/* Language (Learning) Section */}
                <Text style={styles.sectionLabel}>I want to practice...</Text>
                <TouchableOpacity
                    style={styles.languageDisplay}
                    onPress={() => router.push('/settings')} // Shortcut to settings/language
                >
                    <Text style={styles.languageDisplayText}>{targetLanguage}</Text>
                    {/* Reusing Search icon or just Edit/Arrow */}
                    <View style={styles.editIcon}>
                        <MoreVertical size={16} color={Theme.colors.primary} style={{ transform: [{ rotate: '90deg' }] }} />
                    </View>
                </TouchableOpacity>

                {/* Level Section */}
                <Text style={styles.sectionLabel}>Level</Text>
                <View style={styles.segmentContainer}>
                    {['Beginner', 'Intermediate', 'Advanced'].map((l) => (
                        <TouchableOpacity
                            key={l}
                            style={[styles.segmentBtn, level === l && styles.segmentBtnActive]}
                            onPress={() => setLevel(l)}
                        >
                            <Text style={[styles.segmentText, level === l && styles.segmentTextActive]}>{l}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Scenario Section */}
                <Text style={styles.sectionLabel}>Scenario</Text>

                <TouchableOpacity
                    style={[styles.scenarioCard, selectedScenario === 'cafe' && styles.scenarioCardActive]}
                    onPress={() => setSelectedScenario('cafe')}
                >
                    <View style={styles.iconContainer}>
                        <Coffee size={24} color={Theme.colors.primary} />
                    </View>
                    <View style={styles.scenarioInfo}>
                        <Text style={styles.scenarioTitle}>Ordering at a Cafe</Text>
                        <Text style={styles.scenarioSub}>Practice basic requests</Text>
                    </View>
                    <View style={[styles.radio, selectedScenario === 'cafe' && styles.radioActive]} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.scenarioCard, selectedScenario === 'job' && styles.scenarioCardActive]}
                    onPress={() => setSelectedScenario('job')}
                >
                    <View style={[styles.iconContainer, { backgroundColor: '#FFEDD5' }]}>
                        <Briefcase size={24} color="#EA580C" />
                    </View>
                    <View style={styles.scenarioInfo}>
                        <Text style={styles.scenarioTitle}>Job Interview</Text>
                        <Text style={styles.scenarioSub}>Discuss your experience</Text>
                    </View>
                    <View style={[styles.radio, selectedScenario === 'job' && styles.radioActive]} />
                </TouchableOpacity>

            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.startBtn}
                    onPress={handleStart}
                >
                    <Text style={styles.startBtnText}>Start Conversation</Text>
                    <ArrowRight size={20} color="#FFF" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>
        </SafeAreaView >
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
        backgroundColor: '#F9FAFB',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.colors.text,
    },
    content: {
        paddingHorizontal: Theme.spacing.md,
        paddingBottom: 100,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Theme.colors.text,
        marginBottom: 12,
        marginTop: 24,
    },
    segmentContainer: {
        flexDirection: 'row',
        backgroundColor: '#E5E7EB',
        borderRadius: 12,
        padding: 4,
    },
    segmentBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    segmentBtnActive: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    segmentText: {
        fontSize: 14,
        fontWeight: '500',
        color: Theme.colors.textSecondary,
    },
    segmentTextActive: {
        color: Theme.colors.primary,
        fontWeight: '600',
    },
    languageDisplay: {
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    languageDisplayText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.colors.primary,
    },
    editIcon: {
        backgroundColor: '#EFF6FF',
        padding: 8,
        borderRadius: 8,
    },
    scenarioCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    scenarioCardActive: {
        borderColor: Theme.colors.primary,
        backgroundColor: '#EFF6FF',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#DBEAFE',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    scenarioInfo: {
        flex: 1,
    },
    scenarioTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Theme.colors.text,
        marginBottom: 4,
    },
    scenarioSub: {
        fontSize: 14,
        color: Theme.colors.textSecondary,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#D1D5DB',
    },
    radioActive: {
        borderColor: Theme.colors.primary,
        backgroundColor: '#FFF',
        borderWidth: 6,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        padding: 24,
        backgroundColor: '#F9FAFB',
    },
    startBtn: {
        backgroundColor: Theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: Theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    startBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 18,
    },
    menuContainer: {
        position: 'absolute',
        top: 60,
        right: 20,
        backgroundColor: '#FFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        zIndex: 100,
        width: 160,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    menuItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    menuText: {
        fontSize: 16,
        color: Theme.colors.text,
        fontWeight: '500',
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
    }
});
