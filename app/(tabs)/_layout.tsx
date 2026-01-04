import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf="arrow.triangle.2.circlepath" />
        <Label>Calculator</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <Icon sf="bookmark.fill" />
        <Label>Saved</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
