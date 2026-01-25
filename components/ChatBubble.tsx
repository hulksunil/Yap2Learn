import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Theme } from '../constants/theme';

interface ChatBubbleProps {
    text: string;
    sender: 'user' | 'assistant';
    avatar?: any; // Placeholder for image source
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ text, sender, avatar }) => {
    const isUser = sender === 'user';

    return (
        <View style={[
            styles.container,
            isUser ? styles.containerUser : styles.containerAssistant
        ]}>
            {!isUser && avatar && (
                <View style={styles.avatarContainer}>
                    {/* Placeholder for Avatar Image */}
                    <View style={styles.avatarPlaceholder} />
                </View>
            )}
            <View style={[
                styles.bubble,
                isUser ? styles.bubbleUser : styles.bubbleAssistant
            ]}>
                <Text style={[
                    styles.text,
                    isUser ? styles.textUser : styles.textAssistant
                ]}>
                    {text}
                </Text>
            </View>
            {isUser && avatar && (
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarPlaceholder} />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginBottom: Theme.spacing.md,
        alignItems: 'flex-end',
    },
    containerUser: {
        justifyContent: 'flex-end',
    },
    containerAssistant: {
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        width: 32,
        height: 32,
        marginHorizontal: Theme.spacing.xs,
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#DDD',
    },
    bubble: {
        padding: Theme.spacing.md,
        borderRadius: Theme.borderRadius.lg,
        maxWidth: '75%',
    },
    bubbleUser: {
        backgroundColor: Theme.colors.primary,
        borderBottomRightRadius: Theme.borderRadius.sm,
    },
    bubbleAssistant: {
        backgroundColor: Theme.colors.surface,
        borderBottomLeftRadius: Theme.borderRadius.sm,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    text: {
        ...Theme.typography.body,
    },
    textUser: {
        color: '#FFF',
    },
    textAssistant: {
        color: Theme.colors.text,
    },
});
