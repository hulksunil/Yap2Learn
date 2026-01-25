import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../constants/theme';
import { ArrowLeft, Clock, MessageSquare, Briefcase } from 'lucide-react-native';
import { StorageService, SessionRecord } from '../services/storage';

export default function HistoryScreen() {
    const router = useRouter();
    const [history, setHistory] = useState<SessionRecord[]>([]);

    useFocusEffect(
        React.useCallback(() => {
            loadHistory();
        }, [])
    );

    const loadHistory = async () => {
        const data = await StorageService.getHistory();
        setHistory(data);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color={Theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>History</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {history.length === 0 ? (
                    <Text style={styles.emptyText}>No sessions yet. Start yapping!</Text>
                ) : (
                    history.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.card}
                            onPress={() => router.push({
                                pathname: '/conversation',
                                params: { sessionId: item.id, readOnly: 'true' }
                            })}
                        >
                            <View style={styles.iconContainer}>
                                {item.scenario === 'cafe' ?
                                    <MessageSquare size={24} color={Theme.colors.primary} /> :
                                    <Briefcase size={24} color="#EA580C" />
                                }
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.scenarioTitle}>{item.scenario === 'cafe' ? 'Ordering at a Cafe' : 'Job Interview'}</Text>
                                <View style={styles.metaRow}>
                                    <Clock size={12} color={Theme.colors.textSecondary} style={{ marginRight: 4 }} />
                                    <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                                </View>
                            </View>
                            <View style={styles.scoreBadge}>
                                <Text style={styles.scoreText}>{item.turnsCount} turns</Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
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
        marginBottom: Theme.spacing.md,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.colors.text,
    },
    content: {
        paddingHorizontal: Theme.spacing.md,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EFF6FF', // Default light blue
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    scenarioTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Theme.colors.text,
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 12,
        color: Theme.colors.textSecondary,
    },
    scoreBadge: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    scoreText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#10B981',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: Theme.colors.textSecondary,
        fontSize: 16,
    }
});
