import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const TUTORIAL_COMPLETED_KEY = '@tutorial_completed';

export function useTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    checkTutorialStatus();
  }, []);

  const checkTutorialStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem(TUTORIAL_COMPLETED_KEY);
      if (!completed) {
        // Small delay to let the screen render first
        setTimeout(() => setShowTutorial(true), 500);
      }
    } catch (error) {
      console.error('Error checking tutorial status:', error);
    }
  };

  const completeTutorial = async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
      setShowTutorial(false);
      setCurrentStep(0);
    } catch (error) {
      console.error('Error saving tutorial status:', error);
    }
  };

  const resetTutorial = async () => {
    try {
      await AsyncStorage.removeItem(TUTORIAL_COMPLETED_KEY);
      setShowTutorial(true);
      setCurrentStep(0);
    } catch (error) {
      console.error('Error resetting tutorial:', error);
    }
  };

  const nextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const skipTutorial = () => {
    completeTutorial();
  };

  return {
    showTutorial,
    currentStep,
    nextStep,
    skipTutorial,
    resetTutorial,
  };
}
