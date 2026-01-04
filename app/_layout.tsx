import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#10B981',
    background: '#030712',
    card: 'transparent',
    text: '#F8FAFC',
    border: 'rgba(148, 163, 184, 0.1)',
    notification: '#10B981',
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={CustomDarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
