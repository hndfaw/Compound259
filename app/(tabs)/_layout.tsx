import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { Platform } from 'react-native';
import React, { useEffect, useRef } from 'react';

export default function TabLayout() {
  const navigation = useNavigation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('state', () => {
      if (!isFirstRender.current && Platform.OS === 'ios') {
        Haptics.selectionAsync();
      }
      isFirstRender.current = false;
    });

    return unsubscribe;
  }, [navigation]);

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
