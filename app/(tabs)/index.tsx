import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { useCalculations } from '@/hooks/use-calculations';

const GREEN_ACCENT = '#10B981';

const FREQUENCY_OPTIONS = ['Annually', 'Semi-annually', 'Quarterly', 'Monthly'] as const;
const RATE_PRESETS = ['4', '7', '10', '15', '20'];
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

const trimTrailingZeros = (formatted: string) => formatted.replace(/\.00(?=$|[A-Za-z])/g, '');

const formatCurrencySmart = (value: number) => {
  if (!isFinite(value)) return '$0';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  const units = [
    { value: 1e12, suffix: 'T' },
    { value: 1e9, suffix: 'B' },
    { value: 1e6, suffix: 'M' },
  ];

  if (abs >= 1e15) {
    return `${sign}$${abs.toExponential(2).replace('e+', 'e')}`;
  }

  const matchedUnit = units.find((unit) => abs >= unit.value);
  if (matchedUnit) {
    const compactValue = abs / matchedUnit.value;
    const decimals = compactValue >= 10 ? 1 : 2;
    return trimTrailingZeros(`${sign}$${compactValue.toFixed(decimals)}${matchedUnit.suffix}`);
  }

  return trimTrailingZeros(formatCurrency(value));
};

const formatWithCommas = (value: string) => {
  const digitsOnly = value.replace(/[^0-9]/g, '');
  if (!digitsOnly) return '';
  return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const formatCurrencyTrim = (value: number) => trimTrailingZeros(formatCurrency(value));

const parseNumber = (value: string) => Number(value.replace(/,/g, '')) || 0;

export default function CalculatorScreen() {
  const insets = useSafeAreaInsets();

  const [initialDeposit, setInitialDeposit] = useState(() => formatWithCommas('5000'));
  const [contribution, setContribution] = useState('0');
  const [frequency, setFrequency] = useState<FrequencyType>('Monthly');
  const [yearsOfGrowth, setYearsOfGrowth] = useState('7');
  const [estimatedRate, setEstimatedRate] = useState('10');
  const [totalBalance, setTotalBalance] = useState(0);
  const [interestEarned, setInterestEarned] = useState(0);
  const [useCompactBalance, setUseCompactBalance] = useState(false);
  const [balanceWidth, setBalanceWidth] = useState(0);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);

  const { saveCalculation } = useCalculations();

  const isSaveDisabled = isSaving || !saveTitle.trim();

  const balanceDisplay = useMemo(
    () => (useCompactBalance ? formatCurrencySmart(totalBalance) : formatCurrencyTrim(totalBalance)),
    [totalBalance, useCompactBalance],
  );

  const calculateInvestment = useCallback(() => {
    const principal = parseNumber(initialDeposit);
    const periodicContribution = parseNumber(contribution);
    const annualRate = (Number(estimatedRate) || 0) / 100;
    const years = Number(yearsOfGrowth) || 0;
    const n = FREQUENCY_PERIODS[frequency];

    const periods = n * years;
    const ratePerPeriod = n > 0 ? annualRate / n : 0;

    // Future value with recurring contributions at the same frequency.
    const growthFactor = Math.pow(1 + ratePerPeriod, periods);
    const futureValuePrincipal = principal * growthFactor;

    const futureValueContributions =
      ratePerPeriod === 0
        ? periodicContribution * periods
        : periodicContribution * ((growthFactor - 1) / ratePerPeriod);

    const totalFutureValue = futureValuePrincipal + futureValueContributions;
    const totalContributions = principal + periodicContribution * periods;
    const totalInterest = totalFutureValue - totalContributions;

    setTotalBalance(totalFutureValue);
    setInterestEarned(totalInterest);
  }, [initialDeposit, contribution, estimatedRate, yearsOfGrowth, frequency]);

  useEffect(() => {
    calculateInvestment();
  }, [calculateInvestment]);

  const totalContributionsValue = useMemo(() => {
    const periodicContribution = parseNumber(contribution);
    const n = FREQUENCY_PERIODS[frequency];
    const years = Number(yearsOfGrowth) || 0;
    return periodicContribution * n * years;
  }, [contribution, frequency, yearsOfGrowth]);

  const growthPercentage = useMemo(() => {
    const totalInvested = parseNumber(initialDeposit) + totalContributionsValue;
    if (totalInvested <= 0) return '0.0';
    return ((interestEarned / totalInvested) * 100).toFixed(1);
  }, [interestEarned, initialDeposit, totalContributionsValue]);

  const { principalRatio, contributionRatio, interestRatio } = useMemo(() => {
    const principal = parseNumber(initialDeposit);
    const periodicContribution = parseNumber(contribution);
    const n = FREQUENCY_PERIODS[frequency];
    const years = Number(yearsOfGrowth) || 0;
    const totalContributions = periodicContribution * n * years;

    if (totalBalance <= 0) {
      return { principalRatio: 0.33, contributionRatio: 0.33, interestRatio: 0.34 };
    }

    const pRatio = principal / totalBalance;
    const cRatio = totalContributions / totalBalance;
    const iRatio = interestEarned / totalBalance;

    return {
      principalRatio: Math.max(pRatio, 0.05),
      contributionRatio: Math.max(cRatio, 0),
      interestRatio: Math.max(iRatio, 0.05),
    };
  }, [initialDeposit, contribution, frequency, yearsOfGrowth, totalBalance, interestEarned]);

  const handleFrequencySelect = (selected: FrequencyType) => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    setFrequency(selected);
    setShowFrequencyPicker(false);
  };

  const handleSave = async () => {
    if (!saveTitle.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Title Required',
        text2: 'Please enter a title for your calculation.',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }

    setIsSaving(true);
    try {
      const periodicContribution = parseNumber(contribution);
      const n = FREQUENCY_PERIODS[frequency];
      const years = Number(yearsOfGrowth) || 0;
      const totalContributionValue = periodicContribution * n * years;

      await saveCalculation({
        title: saveTitle.trim(),
        finalBalance: totalBalance,
        initialDeposit: parseNumber(initialDeposit),
        interestEarned,
        contributions: totalContributionValue,
        contributionAmount: periodicContribution,
        timePeriod: Number(yearsOfGrowth) || 0,
        rateOfReturn: Number(estimatedRate) || 0,
        frequency,
      });

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setShowSaveModal(false);
      setSaveTitle('');

      Toast.show({
        type: 'success',
        text1: 'Saved!',
        text2: 'Your calculation has been saved successfully.',
        position: 'top',
        visibilityTime: 2000,
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save calculation. Please try again.',
        position: 'top',
        visibilityTime: 3000,
      });
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(52, insets.top + 28), paddingBottom: 80 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader
          icon="trending-up"
          iconSize={22}
          accent={GREEN_ACCENT}
          title="Compound"
          subtitle="Watch your money grow over time"
        />

        {/* Result Card */}
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <ThemedText style={styles.resultLabel}>Future Value</ThemedText>
            <View style={styles.growthBadge}>
              <ThemedText style={styles.growthBadgeText}>+{growthPercentage}%</ThemedText>
            </View>
          </View>
          <View
            onLayout={(e) => setBalanceWidth(e.nativeEvent.layout.width)}
            style={{ alignSelf: 'stretch' }}
          >
            <ThemedText
              style={styles.totalBalance}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
              onTextLayout={(e) => {
                const lineWidth = e.nativeEvent.lines?.[0]?.width || 0;
                if (!balanceWidth) return;
                const shouldCompact = !useCompactBalance && lineWidth > balanceWidth * 0.98;
                if (shouldCompact) setUseCompactBalance(true);
              }}
            >
              {balanceDisplay}
            </ThemedText>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressPrincipal, { flex: principalRatio }]} />
            {contributionRatio > 0 && (
              <View style={[styles.progressContribution, { flex: contributionRatio }]} />
            )}
            <View style={[styles.progressInterest, { flex: interestRatio }]} />
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <View style={styles.breakdownTexts}>
                <ThemedText style={styles.breakdownLabel}>Principal</ThemedText>
                <ThemedText style={[styles.breakdownValue, { color: '#34D399' }]}>{formatCurrencySmart(parseNumber(initialDeposit))}</ThemedText>
              </View>
            </View>
            {contributionRatio > 0 && (
              <View style={styles.breakdownItem}>
                <View style={styles.breakdownTexts}>
                  <ThemedText style={styles.breakdownLabel}>Contributions</ThemedText>
                  <ThemedText style={[styles.breakdownValue, { color: '#60A5FA' }]}>{formatCurrencySmart(totalContributionsValue)}</ThemedText>
                </View>
              </View>
            )}
            <View style={styles.breakdownItem}>
              <View style={styles.breakdownTexts}>
                <ThemedText style={styles.breakdownLabel}>Interest</ThemedText>
                <ThemedText style={[styles.breakdownValue, { color: '#F59E0B' }]}>{formatCurrencySmart(interestEarned)}</ThemedText>
              </View>
            </View>
          </View>
        </View>

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
            onChangeText={(text) => setInitialDeposit(formatWithCommas(text))}
            keyboardType="numeric"
            placeholder="10000"
            placeholderTextColor="#4B5563"
            selectionColor={GREEN_ACCENT}
            maxLength={21}
          />
        </View>

        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <View style={styles.inputIconBadge}>
              <Ionicons name="add-circle-outline" size={16} color={GREEN_ACCENT} />
            </View>
            <ThemedText style={styles.inputLabel}>Contribution (per period)</ThemedText>
          </View>
          <TextInput
            style={styles.input}
            value={contribution}
            onChangeText={(text) => setContribution(formatWithCommas(text))}
            keyboardType="numeric"
            placeholder="500"
            placeholderTextColor="#4B5563"
            selectionColor={GREEN_ACCENT}
            maxLength={21}
          />
        </View>

        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <View style={styles.inputIconBadge}>
              <Ionicons name="analytics-outline" size={16} color={GREEN_ACCENT} />
            </View>
            <ThemedText style={styles.inputLabel}>Interest Rate</ThemedText>
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
              maxLength={8}
            />
            <ThemedText style={styles.inputSuffix}>%</ThemedText>
          </View>
          <View style={styles.presetRow}>
            {RATE_PRESETS.map((rate) => {
              const active = estimatedRate === rate;
              return (
                <TouchableOpacity
                  key={rate}
                  style={[styles.presetChip, active && styles.presetChipActive]}
                  onPress={() => {
                    if (Platform.OS === 'ios') {
                      Haptics.selectionAsync();
                    }
                    setEstimatedRate(rate);
                  }}
                  activeOpacity={0.8}
                >
                  <ThemedText style={[styles.presetText, active && styles.presetTextActive]}>
                    {rate}%
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
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
              maxLength={6}
            />
            <ThemedText style={styles.inputSuffix}>years</ThemedText>
          </View>
        </View>

        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <View style={styles.inputIconBadge}>
              <Ionicons name="sync-outline" size={16} color={GREEN_ACCENT} />
            </View>
            <ThemedText style={styles.inputLabel}>Frequency</ThemedText>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.selectorRow}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setShowFrequencyPicker(true);
            }}
          >
            <ThemedText style={styles.selectorText}>{frequency}</ThemedText>
            <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity activeOpacity={0.85} style={styles.saveButtonWrapper} onPress={openSaveModal}>
          <View style={styles.saveButton}>
            <Ionicons name="bookmark" size={18} color="#FFFFFF" />
            <ThemedText style={styles.saveButtonText}>Save This Calculation</ThemedText>
          </View>
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
                itemStyle={styles.pickerItem}
                mode="dropdown"
              >
                {FREQUENCY_OPTIONS.map((option) => (
                  <Picker.Item key={option} label={option} value={option} color={Platform.OS === 'ios' ? '#FFFFFF' : '#FFFFFF'} />
                ))}
              </Picker>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Save Modal */}
      <Modal visible={showSaveModal} animationType="slide" transparent onRequestClose={() => setShowSaveModal(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
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
                <ThemedText style={styles.previewValue}>{formatCurrencyTrim(totalBalance)}</ThemedText>
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
                  style={[styles.confirmButton, isSaveDisabled && styles.confirmButtonDisabled]}
                  onPress={handleSave}
                  disabled={isSaveDisabled}
                >
                  <View style={[styles.confirmButtonGradient, isSaveDisabled && styles.confirmButtonGradientDisabled]}>
                    <Ionicons name="bookmark" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.confirmButtonText}>{isSaving ? 'Saving...' : 'Save'}</ThemedText>
                  </View>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#030712',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 120,
  },
  resultCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    backgroundColor: '#065F46',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  growthBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  growthBadgeText: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '700',
  },
  totalBalance: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -1,
    lineHeight: 44,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 16,
  },
  progressPrincipal: {
    backgroundColor: '#34D399',
  },
  progressContribution: {
    backgroundColor: '#60A5FA',
  },
  progressInterest: {
    backgroundColor: '#F59E0B',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownItem: {
    alignItems: 'flex-start',
  },
  breakdownTexts: {
    flexDirection: 'column',
  },
  breakdownLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
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
    lineHeight: 32,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  inputWithSuffix: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 12,
  },
  inputFlex: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    paddingVertical: 8,
  },
  inputSuffix: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
    backgroundColor: '#0B1220',
  },
  presetChipActive: {
    borderColor: GREEN_ACCENT,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  presetText: {
    color: '#9CA3AF',
    fontWeight: '600',
    fontSize: 13,
  },
  presetTextActive: {
    color: '#FFFFFF',
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
  pickerItem: {
    color: '#FFFFFF',
    fontSize: 18,
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
    backgroundColor: '#2D3748',
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
    backgroundColor: '#2D3748',
  },
  confirmButtonGradientDisabled: {
    backgroundColor: '#4B5563',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
});
