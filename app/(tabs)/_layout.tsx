import { Tabs } from 'expo-router';
import React from 'react';

import { GlassTabBar } from '@/components/ui/tab-bar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Calculator' }} />
      <Tabs.Screen name="explore" options={{ title: 'Saved' }} />
      <Tabs.Screen name="learn" options={{ title: 'Learn' }} />
    </Tabs>
  );
}
