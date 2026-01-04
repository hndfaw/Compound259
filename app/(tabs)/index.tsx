import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useCalculations } from '@/hooks/use-calculations';

const GREEN_ACCENT = '#10B981';

const FREQUENCY_OPTIONS = ['Annually', 'Semi-annually', 'Quarterly', 'Monthly'] as const;
type FrequencyType = (typeof FREQUENCY_OPTIONS)[number];

const FREQUENCY_PERIODS: Record<FrequencyType, number> = {
  Annually: 1,
  'Semi-annually': 2,
  Quarterly: 4,
  Monthly: 12,
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(isFinite(value) ? value : 0);

export default function CalculatorScreen() {
  const insets = useSafeAreaInsets();

  const [initialDeposit, setInitialDeposit] = useState('10000');
  const [frequency, setFrequency] = useState<FrequencyType>('Annually');
  const [yearsOfGrowth, setYearsOfGrowth] = useState('10');
  const [estimatedRate, setEstimatedRate] = useState('7');
  const [totalBalance, setTotalBalance] = useState(0);
  const [interestEarned, setInterestEarned] = useState(0);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);

  const { saveCalculation } = useCalculations();

  const calculateInvestment = useCallback(() => {
    const principal = Number(initialDeposit) || 0;
    const annualRate = (Number(estimatedRate) || 0) / 100;
    const years = Number(yearsOfGrowth) || 0;
    const n = FREQUENCY_PERIODS[frequency];

    // A = P(1 + r/n)^(nt)
    const totalFutureValue = principal * Math.pow(1 + annualRate / n, n * years);
    const totalInterest = totalFutureValue - principal;

    setTotalBalance(totalFutureValue);
    setInterestEarned(totalInterest);
  }, [initialDeposit, estimatedRate, yearsOfGrowth, frequency]);

  useEffect(() => {
    calculateInvestment();
  }, [calculateInvestment]);

  const growthPercentage = useMemo(() => {
    const principal = Number(initialDeposit) || 1;
    return ((interestEarned / principal) * 100).toFixed(1);
  }, [interestEarned, initialDeposit]);

  const principalRatio = useMemo(() => {
    if (totalBalance <= 0) return 0.5;
    const principal = Number(initialDeposit) || 0;
    return Math.min(Math.max(principal / totalBalance, 0.1), 0.9);
  }, [initialDeposit, totalBalance]);

  const handleFrequencySelect = (selected: FrequencyType) => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    setFrequency(selected);
    setShowFrequencyPicker(false);
  };

  const handleSave = async () => {
    if (!saveTitle.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your calculation.');
      return;
    }

    setIsSaving(true);
    try {
      await saveCalculation({
        title: saveTitle.trim(),
        finalBalance: totalBalance,
        initialDeposit: Number(initialDeposit) || 0,
        interestEarned,
        contributions: 0,
        contributionAmount: 0,
        timePeriod: Number(yearsOfGrowth) || 0,
        rateOfReturn: Number(estimatedRate) || 0,
        frequency,
      });

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setShowSaveModal(false);
      setSaveTitle('');
      Alert.alert('Saved!', 'Your calculation has been saved successfully.');
    } catch {
      Alert.alert('Error', 'Failed to save calculation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const openSaveModal = () => {
    Keyboard.dismiss();
    setShowSaveModal(true);
  };

  return (
    <View style={styles.wrapper}>
      {/* Top gradient overlay */}
      <LinearGradient
        colors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)', 'transparent']}
        locations={[0, 0.5, 1]}
        style={styles.topGradient}
        pointerEvents="none"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(52, insets.top + 28) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerGroup}>
          <View style={styles.headerRow}>
            <Ionicons name="trending-up" size={28} color={GREEN_ACCENT} />
            <ThemedText style={styles.headerTitle}>Compound</ThemedText>
          </View>
          <ThemedText style={styles.headerSubtitle}>Watch your money grow over time</ThemedText>
        </View>

        {/* Result Card */}
        <LinearGradient
          colors={['#065F46', '#064E3B', '#022C22']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.resultCard}
        >
          <ThemedText style={styles.resultLabel}>Future Value</ThemedText>
          <ThemedText style={styles.totalBalance}>{formatCurrency(totalBalance)}</ThemedText>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statLabel}>Total Interest</ThemedText>
              <ThemedText style={styles.statValueGreen}>{formatCurrency(interestEarned)}</ThemedText>
            </View>
            <View style={styles.statItemRight}>
              <ThemedText style={styles.statLabel}>Growth</ThemedText>
              <ThemedText style={styles.statValueGreen}>+{growthPercentage}%</ThemedText>
            </View>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressPrincipal, { flex: principalRatio }]} />
            <View style={[styles.progressInterest, { flex: 1 - principalRatio }]} />
          </View>

          <View style={styles.progressLabels}>
            <ThemedText style={styles.progressLabel}>Principal</ThemedText>
            <ThemedText style={styles.progressLabel}>+{growthPercentage}% growth</ThemedText>
          </View>
        </LinearGradient>

        {/* Input Fields */}
        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <View style={styles.inputIconBadge}>
              <Ionicons name="cash-outline" size={16} color={GREEN_ACCENT} />
            </View>
            <ThemedText style={styles.inputLabel}>Initial Investment</ThemedText>
          </View>
          <TextInput
            style={styles.input}
            value={initialDeposit}
            onChangeText={setInitialDeposit}
            keyboardType="numeric"
            placeholder="10000"
            placeholderTextColor="#4B5563"
            selectionColor={GREEN_ACCENT}
          />
        </View>

        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <View style={styles.inputIconBadge}>
              <Ionicons name="analytics-outline" size={16} color={GREEN_ACCENT} />
            </View>
            <ThemedText style={styles.inputLabel}>Annual Interest Rate</ThemedText>
          </View>
          <View style={styles.inputWithSuffix}>
            <TextInput
              style={styles.inputFlex}
              value={estimatedRate}
              onChangeText={setEstimatedRate}
              keyboardType="numeric"
              placeholder="7"
              placeholderTextColor="#4B5563"
              selectionColor={GREEN_ACCENT}
            />
            <ThemedText style={styles.inputSuffix}>%</ThemedText>
          </View>
        </View>

        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <View style={styles.inputIconBadge}>
              <Ionicons name="calendar-outline" size={16} color={GREEN_ACCENT} />
            </View>
            <ThemedText style={styles.inputLabel}>Time Period</ThemedText>
          </View>
          <View style={styles.inputWithSuffix}>
            <TextInput
              style={styles.inputFlex}
              value={yearsOfGrowth}
              onChangeText={setYearsOfGrowth}
              keyboardType="numeric"
              placeholder="10"
              placeholderTextColor="#4B5563"
              selectionColor={GREEN_ACCENT}
            />
            <ThemedText style={styles.inputSuffix}>years</ThemedText>
          </View>
        </View>

        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <View style={styles.inputIconBadge}>
              <Ionicons name="sync-outline" size={16} color={GREEN_ACCENT} />
            </View>
            <ThemedText style={styles.inputLabel}>Compound Frequency</ThemedText>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.selectorRow}
            onPress={() => {
              if (Platform.OS === 'ios') Haptics.selectionAsync();
              setShowFrequencyPicker(true);
            }}
          >
            <ThemedText style={styles.selectorText}>{frequency}</ThemedText>
            <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity activeOpacity={0.85} style={styles.saveButtonWrapper} onPress={openSaveModal}>
          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveButton}
          >
            <Ionicons name="bookmark" size={18} color="#FFFFFF" />
            <ThemedText style={styles.saveButtonText}>Save This Calculation</ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Frequency Picker Modal */}
      <Modal
        visible={showFrequencyPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFrequencyPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFrequencyPicker(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <ThemedText style={styles.modalTitle}>Select Frequency</ThemedText>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={frequency}
                onValueChange={(itemValue: FrequencyType) => handleFrequencySelect(itemValue)}
                dropdownIconColor="#9CA3AF"
                style={styles.picker}
                mode="dropdown"
              >
                {FREQUENCY_OPTIONS.map((option) => (
                  <Picker.Item key={option} label={option} value={option} color="#FFFFFF" />
                ))}
              </Picker>
            </View>
            <View style={styles.pickerActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowFrequencyPicker(false)}>
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={() => setShowFrequencyPicker(false)}>
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.confirmButtonGradient}
                >
                  <ThemedText style={styles.confirmButtonText}>Done</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Save Modal */}
      <Modal visible={showSaveModal} animationType="slide" transparent onRequestClose={() => setShowSaveModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSaveModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.saveModalContent}>
            <View style={styles.modalHandle} />
            <ThemedText style={styles.modalTitle}>Save Calculation</ThemedText>
            <ThemedText style={styles.saveModalSubtitle}>Give your calculation a memorable name</ThemedText>
            <TextInput
              style={styles.saveInput}
              value={saveTitle}
              onChangeText={setSaveTitle}
              placeholder="e.g., Retirement Fund Goal"
              placeholderTextColor="#6B7280"
              selectionColor={GREEN_ACCENT}
              autoFocus
              maxLength={50}
            />
            <View style={styles.saveModalPreview}>
              <ThemedText style={styles.previewLabel}>Final Balance</ThemedText>
              <ThemedText style={styles.previewValue}>{formatCurrency(totalBalance)}</ThemedText>
            </View>
            <View style={styles.saveModalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowSaveModal(false);
                  setSaveTitle('');
                }}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, isSaving && styles.confirmButtonDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.confirmButtonGradient}
                >
                  <Ionicons name="bookmark" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.confirmButtonText}>{isSaving ? 'Saving...' : 'Save'}</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#030712',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    zIndex: 0,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 120,
  },
  headerGroup: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 10,
    lineHeight: 34,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    lineHeight: 22,
  },
  resultCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  resultLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    lineHeight: 20,
  },
  totalBalance: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -1,
    lineHeight: 44,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {},
  statItemRight: {
    alignItems: 'flex-end',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  statValueGreen: {
    color: '#34D399',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 8,
  },
  progressPrincipal: {
    backgroundColor: '#34D399',
    borderRadius: 3,
  },
  progressInterest: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },
  inputCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  inputLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  inputWithSuffix: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputFlex: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  inputSuffix: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  frequencyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  frequencyButtonActive: {
    backgroundColor: GREEN_ACCENT,
    borderColor: GREEN_ACCENT,
  },
  frequencyButtonText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  frequencyButtonTextActive: {
    color: '#FFFFFF',
  },
  selectorRow: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  pickerWrapper: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  picker: {
    color: '#FFFFFF',
  },
  pickerSheet: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
  },
  pickerHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#4B5563',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  pickerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  saveButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  saveModalContent: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#4B5563',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 8,
    textAlign: 'center',
  },
  saveModalSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 20,
    textAlign: 'center',
  },
  saveInput: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#F9FAFB',
    fontWeight: '500',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  saveModalPreview: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
    fontWeight: '500',
  },
  previewValue: {
    fontSize: 22,
    fontWeight: '700',
    color: GREEN_ACCENT,
  },
  saveModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  confirmButton: {
    flex: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
});
