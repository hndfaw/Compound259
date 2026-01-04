import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useCalculations } from '@/hooks/use-calculations';

const GREEN_ACCENT = '#10B981';
const PREMIUM_GOLD = '#F59E0B';

const FREQUENCY_OPTIONS = ['Weekly', 'Monthly', 'Quarterly', 'Yearly'] as const;
type FrequencyType = (typeof FREQUENCY_OPTIONS)[number];

const FREQUENCY_PERIODS: Record<FrequencyType, number> = {
  Weekly: 52,
  Monthly: 12,
  Quarterly: 4,
  Yearly: 1,
};

const sanitizeNumber = (value: string, allowDecimal = false) => {
  const cleaned = value.replace(allowDecimal ? /[^0-9.]/g : /[^0-9]/g, '');
  if (!allowDecimal) {
    return cleaned;
  }

  const parts = cleaned.split('.');
  const integerPart = parts.shift() ?? '';
  const decimalPart = parts.join('').replace(/\./g, '');
  if (!integerPart && !decimalPart) {
    return '';
  }

  const prefix = integerPart || '0';
  return decimalPart ? `${prefix}.${decimalPart}` : prefix;
};

const formatNumberWithSeparators = (value: string) => {
  if (!value) {
    return '';
  }

  const [integerPart, decimalPart] = value.split('.');
  const integerValue = integerPart ? Number(integerPart) : 0;
  const formattedInteger = integerValue.toLocaleString('en-US');

  if (decimalPart !== undefined && decimalPart.length > 0) {
    return `${formattedInteger}.${decimalPart}`;
  }

  if (value.endsWith('.')) {
    return `${formattedInteger}.`;
  }

  return formattedInteger;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(isFinite(value) ? value : 0);

export default function CalculatorScreen() {
  const [initialDeposit, setInitialDeposit] = useState('10000');
  const [contributionAmount, setContributionAmount] = useState('500');
  const [frequency, setFrequency] = useState<FrequencyType>('Monthly');
  const [yearsOfGrowth, setYearsOfGrowth] = useState('10');
  const [estimatedRate, setEstimatedRate] = useState('8');
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalContributions, setTotalContributions] = useState(0);
  const [interestEarned, setInterestEarned] = useState(0);
  const [investedCapital, setInvestedCapital] = useState(0);

  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { saveCalculation } = useCalculations();

  const calculateInvestment = useCallback(() => {
    const principal = Number(initialDeposit) || 0;
    const periodicContribution = Number(contributionAmount) || 0;
    const annualRate = (Number(estimatedRate) || 0) / 100;
    const years = Number(yearsOfGrowth) || 0;
    const periodsPerYear = FREQUENCY_PERIODS[frequency];
    const totalPeriods = Math.max(years * periodsPerYear, 0);
    const ratePerPeriod = annualRate / periodsPerYear;

    const growthFactor = Math.pow(1 + ratePerPeriod, totalPeriods);
    const futureValuePrincipal = principal * growthFactor;
    const futureValueContributions =
      ratePerPeriod === 0
        ? periodicContribution * totalPeriods
        : periodicContribution * ((growthFactor - 1) / ratePerPeriod);

    const totalFutureValue = futureValuePrincipal + futureValueContributions;
    const contributionsTotal = periodicContribution * totalPeriods;
    const investedTotal = principal + contributionsTotal;
    const totalInterest = totalFutureValue - investedTotal;

    setTotalBalance(totalFutureValue);
    setTotalContributions(contributionsTotal);
    setInterestEarned(totalInterest);
    setInvestedCapital(investedTotal);
  }, [initialDeposit, contributionAmount, estimatedRate, yearsOfGrowth, frequency]);

  useEffect(() => {
    calculateInvestment();
  }, [calculateInvestment]);

  const contributionsRatio = useMemo(() => {
    if (totalBalance <= 0) {
      return 0;
    }
    const ratio = investedCapital / totalBalance;
    return Math.min(Math.max(ratio, 0), 1);
  }, [investedCapital, totalBalance]);

  const interestRatio = useMemo(() => 1 - contributionsRatio, [contributionsRatio]);

  const handleFrequencySelect = (selected: FrequencyType) => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    setFrequency(selected);
    setShowFrequencyModal(false);
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
        contributions: totalContributions,
        contributionAmount: Number(contributionAmount) || 0,
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerGroup}>
          <View style={styles.headerRow}>
            <ThemedText style={styles.headerTitle}>Calculator</ThemedText>
            <View style={styles.premiumBadge}>
              <Ionicons name="diamond" size={12} color={PREMIUM_GOLD} />
              <ThemedText style={styles.premiumText}>PRO</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.headerSubtitle}>Compound Interest</ThemedText>
        </View>

        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <ThemedText style={styles.resultLabel}>Total Balance</ThemedText>
            <View style={styles.growthBadge}>
              <Ionicons name="trending-up" size={12} color="#FFFFFF" />
              <ThemedText style={styles.growthText}>
                +{((interestEarned / Math.max(investedCapital, 1)) * 100).toFixed(1)}%
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.totalBalance}>{formatCurrency(totalBalance)}</ThemedText>

          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressSegmentPrincipal, { flex: contributionsRatio || 0.001 }]} />
              <View style={[styles.progressSegmentInterest, { flex: interestRatio || 0.001 }]} />
            </View>
            <View style={styles.progressLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendPrincipal]} />
                <ThemedText style={styles.legendLabel}>Principal + Contributions</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendInterest]} />
                <ThemedText style={styles.legendLabel}>Interest</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Initial</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {formatCurrency(Number(initialDeposit) || 0)}
              </ThemedText>
            </View>
            <View style={[styles.summaryItem, styles.summaryItemMiddle]}>
              <ThemedText style={styles.summaryLabel}>Contributions</ThemedText>
              <ThemedText style={styles.summaryValue}>{formatCurrency(totalContributions)}</ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Interest</ThemedText>
              <ThemedText style={[styles.summaryValue, styles.interestValue]}>
                {formatCurrency(interestEarned)}
              </ThemedText>
            </View>
          </View>
        </View>

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

        <ThemedText style={styles.sectionTitle}>Investment Details</ThemedText>

        <View style={styles.inputBlock}>
          <ThemedText style={styles.inputLabel}>Initial Deposit</ThemedText>
          <View style={styles.inputRow}>
            <View style={styles.iconBadge}>
              <Ionicons name="card-outline" size={18} color={GREEN_ACCENT} />
            </View>
            <ThemedText style={styles.currencyPrefix}>$</ThemedText>
            <TextInput
              style={styles.input}
              value={formatNumberWithSeparators(initialDeposit)}
              onChangeText={(text) => setInitialDeposit(sanitizeNumber(text, true))}
              keyboardType="decimal-pad"
              placeholder="10,000"
              placeholderTextColor="#4B5563"
              selectionColor={GREEN_ACCENT}
              maxLength={15}
            />
          </View>
        </View>

        <View style={styles.inputBlock}>
          <ThemedText style={styles.inputLabel}>Contribution Amount</ThemedText>
          <View style={styles.inputRow}>
            <View style={styles.iconBadge}>
              <Ionicons name="wallet-outline" size={18} color={GREEN_ACCENT} />
            </View>
            <ThemedText style={styles.currencyPrefix}>$</ThemedText>
            <TextInput
              style={styles.input}
              value={formatNumberWithSeparators(contributionAmount)}
              onChangeText={(text) => setContributionAmount(sanitizeNumber(text, true))}
              keyboardType="decimal-pad"
              placeholder="500"
              placeholderTextColor="#4B5563"
              selectionColor={GREEN_ACCENT}
              maxLength={12}
            />
          </View>
        </View>

        <View style={styles.inputBlock}>
          <ThemedText style={styles.inputLabel}>Contribution Frequency</ThemedText>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.inputRow}
            onPress={() => setShowFrequencyModal(true)}
          >
            <View style={styles.iconBadge}>
              <Ionicons name="repeat-outline" size={18} color={GREEN_ACCENT} />
            </View>
            <ThemedText style={styles.selectorValue}>{frequency}</ThemedText>
            <View style={styles.chevronBadge}>
              <Ionicons name="chevron-down" size={14} color="#6B7280" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.inputBlock}>
          <ThemedText style={styles.inputLabel}>Investment Period</ThemedText>
          <View style={styles.inputRow}>
            <View style={styles.iconBadge}>
              <Ionicons name="calendar-outline" size={18} color={GREEN_ACCENT} />
            </View>
            <TextInput
              style={styles.input}
              value={yearsOfGrowth}
              onChangeText={(text) => setYearsOfGrowth(sanitizeNumber(text, true))}
              keyboardType="decimal-pad"
              placeholder="10"
              placeholderTextColor="#4B5563"
              selectionColor={GREEN_ACCENT}
              maxLength={3}
            />
            <View style={styles.suffixBadge}>
              <ThemedText style={styles.inputSuffix}>Years</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.inputBlock}>
          <ThemedText style={styles.inputLabel}>Expected Annual Return</ThemedText>
          <View style={styles.inputRow}>
            <View style={styles.iconBadge}>
              <Ionicons name="trending-up-outline" size={18} color={GREEN_ACCENT} />
            </View>
            <TextInput
              style={styles.input}
              value={estimatedRate}
              onChangeText={(text) => setEstimatedRate(sanitizeNumber(text, true))}
              keyboardType="decimal-pad"
              placeholder="8"
              placeholderTextColor="#4B5563"
              selectionColor={GREEN_ACCENT}
              maxLength={5}
            />
            <View style={styles.suffixBadge}>
              <ThemedText style={styles.inputSuffix}>%</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.formulaCard}>
          <View style={styles.formulaHeader}>
            <Ionicons name="calculator-outline" size={14} color="#6B7280" />
            <ThemedText style={styles.formulaCaption}>Compound Interest Formula</ThemedText>
          </View>
          <ThemedText style={styles.formulaText}>
            A = P(1 + r/n)^(nt) + PMT × ((1 + r/n)^(nt) - 1) / (r/n)
          </ThemedText>
        </View>
      </ScrollView>

      {/* Frequency Picker Modal */}
      <Modal
        visible={showFrequencyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFrequencyModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFrequencyModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <ThemedText style={styles.modalTitle}>Select Frequency</ThemedText>
            {FREQUENCY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.modalOption, frequency === option && styles.modalOptionSelected]}
                onPress={() => handleFrequencySelect(option)}
              >
                <ThemedText
                  style={[styles.modalOptionText, frequency === option && styles.modalOptionTextSelected]}
                >
                  {option}
                </ThemedText>
                {frequency === option && <Ionicons name="checkmark-circle" size={22} color={GREEN_ACCENT} />}
              </TouchableOpacity>
            ))}
          </View>
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
            <ThemedText style={styles.saveModalSubtitle}>
              Give your calculation a memorable name
            </ThemedText>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  headerGroup: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F9FAFB',
    letterSpacing: -0.5,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 12,
  },
  premiumText: {
    fontSize: 11,
    fontWeight: '700',
    color: PREMIUM_GOLD,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  resultCard: {
    backgroundColor: '#065F46',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  growthText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  totalBalance: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: -1,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  progressSegmentPrincipal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  progressSegmentInterest: {
    backgroundColor: '#34D399',
  },
  progressLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendPrincipal: {
    backgroundColor: '#FFFFFF',
  },
  legendInterest: {
    backgroundColor: '#34D399',
  },
  legendLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
  },
  summaryItem: {
    flex: 1,
  },
  summaryItemMiddle: {
    alignItems: 'center',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  interestValue: {
    color: '#A7F3D0',
  },
  saveButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32,
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
  sectionTitle: {
    color: '#F9FAFB',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputBlock: {
    marginBottom: 14,
  },
  inputLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  currencyPrefix: {
    color: '#6B7280',
    fontSize: 17,
    fontWeight: '600',
    marginRight: 2,
  },
  input: {
    flex: 1,
    color: '#F9FAFB',
    fontSize: 17,
    fontWeight: '600',
  },
  suffixBadge: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  inputSuffix: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  selectorValue: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  chevronBadge: {
    backgroundColor: '#1F2937',
    padding: 8,
    borderRadius: 8,
  },
  formulaCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  formulaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  formulaText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  formulaCaption: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
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
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#111827',
  },
  modalOptionSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  modalOptionTextSelected: {
    color: GREEN_ACCENT,
  },
  saveModalContent: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
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
