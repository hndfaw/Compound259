import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

import { AppColors } from '@/constants/tokens';
import { CalculationsProvider } from '@/hooks/use-calculations';

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: AppColors.accent,
    background: '#030712',
    card: 'transparent',
    text: '#F8FAFC',
    border: 'rgba(148, 163, 184, 0.1)',
    notification: AppColors.accent,
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
        borderLeftColor: AppColors.accent,
        borderRightColor: AppColors.accent,
        borderTopColor: AppColors.accent,
        borderBottomColor: AppColors.accent,
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
    <CalculationsProvider>
      <ThemeProvider value={CustomDarkTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
        <StatusBar style="light" />
        <Toast config={toastConfig} topOffset={60} />
      </ThemeProvider>
    </CalculationsProvider>
  );
}
