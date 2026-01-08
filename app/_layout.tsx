import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
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

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        backgroundColor: '#111827',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderLeftColor: '#10B981',
        borderRightColor: '#10B981',
        borderTopColor: '#10B981',
        borderBottomColor: '#10B981',
        borderRadius: 12,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: '600',
        color: '#F9FAFB',
      }}
      text2Style={{
        fontSize: 13,
        color: '#9CA3AF',
      }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        backgroundColor: '#111827',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderLeftColor: '#EF4444',
        borderRightColor: '#EF4444',
        borderTopColor: '#EF4444',
        borderBottomColor: '#EF4444',
        borderRadius: 12,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: '600',
        color: '#F9FAFB',
      }}
      text2Style={{
        fontSize: 13,
        color: '#9CA3AF',
      }}
    />
  ),
};

export default function RootLayout() {
  return (
    <ThemeProvider value={CustomDarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="light" />
      <Toast config={toastConfig} />
    </ThemeProvider>
  );
}
