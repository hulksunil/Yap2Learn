import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Theme } from '../constants/theme';

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Theme.colors.background,
          },
          headerTintColor: Theme.colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: Theme.colors.background,
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="start-session" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="conversation" options={{ headerShown: false }} />
        <Stack.Screen name="session-summary" options={{ headerShown: false }} />
        <Stack.Screen name="flashcards" options={{ headerShown: false }} />
        <Stack.Screen name="history" options={{ headerShown: false }} />
      </Stack >
      <StatusBar style="auto" />
    </>
  );
}
