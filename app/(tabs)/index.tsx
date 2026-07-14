import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as StoreReview from 'expo-store-review';
import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { Chip } from '@/components/ui/chip';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { GradientText } from '@/components/ui/gradient-text';
import { GrowthChart } from '@/components/ui/growth-chart';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { SegmentBar } from '@/components/ui/segment-bar';
import { Sheet } from '@/components/ui/sheet';
import { Font, Theme } from '@/constants/tokens';
import { useCalculations } from '@/hooks/use-calculations';
import { useCountUp } from '@/hooks/use-count-up';
import { useTheme } from '@/hooks/use-theme';
import { breakdown, chartSeries, money, smoothPath } from '@/utils/finance';

const FREQ_OPTIONS = ['Annually', 'Semi-annually', 'Quarterly', 'Monthly'];
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const kLabel = (v: number) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`);

const haptic = () => {
  if (Platform.OS === 'ios') Haptics.selectionAsync();
};

export default function CalculatorScreen() {
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  const { saveCalculation, calculations } = useCalculations();

  const [initial, setInitial] = useState(10000);
  const [monthly, setMonthly] = useState(500);
  const [rate, setRate] = useState(8);
  const [years, setYears] = useState(25);
  const [freq, setFreq] = useState('Monthly');

  const [freqOpen, setFreqOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const inputs = useMemo(
    () => ({ initial, contribution: monthly, ratePct: rate, freq }),
    [initial, monthly, rate, freq],
  );
  const b = useMemo(() => breakdown(inputs, years), [inputs, years]);
  const display = useCountUp(b.balance);

  const { line, area } = useMemo(() => {
    const l = smoothPath(chartSeries(inputs, years));
    return { line: l, area: `${l} L 312 150 L 8 150 Z` };
  }, [inputs, years]);

  const set = (fn: () => void) => () => {
    haptic();
    fn();
  };

  const ASSUMPTIONS = [
    {
      label: 'Initial investment',
      value: money(initial),
      dec: () => setInitial((v) => clamp(v - 1000, 0, 1e8)),
      inc: () => setInitial((v) => clamp(v + 1000, 0, 1e8)),
      chips: [5000, 10000, 25000, 50000].map((v) => ({ label: kLabel(v), active: initial === v, set: () => setInitial(v) })),
    },
    {
      label: 'Monthly contribution',
      value: money(monthly),
      dec: () => setMonthly((v) => clamp(v - 50, 0, 1e6)),
      inc: () => setMonthly((v) => clamp(v + 50, 0, 1e6)),
      chips: [100, 250, 500, 1000].map((v) => ({ label: kLabel(v), active: monthly === v, set: () => setMonthly(v) })),
    },
    {
      label: 'Annual return',
      value: `${rate}%`,
      dec: () => setRate((v) => clamp(v - 1, 0, 50)),
      inc: () => setRate((v) => clamp(v + 1, 0, 50)),
      chips: [4, 6, 8, 10].map((v) => ({ label: `${v}%`, active: rate === v, set: () => setRate(v) })),
    },
    {
      label: 'Time horizon',
      value: `${years} yrs`,
      dec: () => setYears((v) => clamp(v - 1, 1, 60)),
      inc: () => setYears((v) => clamp(v + 1, 1, 60)),
      chips: [10, 20, 25, 30].map((v) => ({ label: `${v}y`, active: years === v, set: () => setYears(v) })),
    },
  ];

  const pickFreq = (f: string) => {
    haptic();
    setFreq(f);
    setFreqOpen(false);
  };

  const handleSave = async () => {
    if (!saveTitle.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter a title', position: 'top', visibilityTime: 2500 });
      return;
    }
    setIsSaving(true);
    try {
      await saveCalculation({
        title: saveTitle.trim(),
        finalBalance: b.balance,
        initialDeposit: initial,
        interestEarned: b.interest,
        contributions: b.contributionsTotal,
        contributionAmount: monthly,
        timePeriod: years,
        rateOfReturn: rate,
        frequency: freq,
      });
      if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSaveOpen(false);
      setSaveTitle('');
      Toast.show({ type: 'success', text1: 'Scenario saved', position: 'top', visibilityTime: 2000 });

      const newCount = calculations.length + 1;
      if (newCount >= 3) {
        const requested = await AsyncStorage.getItem('hasRequestedReview');
        if (!requested && (await StoreReview.isAvailableAsync())) {
          await AsyncStorage.setItem('hasRequestedReview', 'true');
          setTimeout(() => StoreReview.requestReview(), 1500);
        }
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to save', position: 'top', visibilityTime: 2500 });
    } finally {
      setIsSaving(false);
    }
  };

  const growthText = `${b.growthPct >= 0 ? '+' : ''}${b.growthPct.toFixed(0)}%`;

  return (
    <Screen title="Compound" subtitle="Watch your money grow over time">
      {/* Result card */}
      <GlassCard style={s.resultCard}>
        <View style={s.rowBetween}>
          <Text style={s.futureLabel}>Future Value</Text>
          <View style={s.growthBadge}>
            <Icon name="trending" size={11} color={theme.accent} strokeWidth={2.6} />
            <Text style={s.growthText}>{growthText}</Text>
          </View>
        </View>
        <GradientText text={money(display)} colors={theme.balanceGrad} style={s.balance} numberOfLines={1} />
        <SegmentBar principalPct={b.principalRatio} contribPct={b.contribRatio} />
        <View style={s.legendRow}>
          <Legend theme={theme} color={theme.cPrincipal} label="Principal" value={money(initial)} />
          <Legend theme={theme} color={theme.cContrib} label="Contributions" value={money(b.contributionsTotal)} />
          <Legend theme={theme} color={theme.cInterest} label="Interest" value={money(b.interest)} valueColor={theme.accent} align="flex-end" />
        </View>
      </GlassCard>

      {/* Chart card */}
      <GlassCard style={s.chartCard}>
        <View style={[s.rowBetween, { paddingHorizontal: 4, marginBottom: 2 }]}>
          <Text style={s.chartTitle}>Projected growth</Text>
          <Text style={s.freqBadge}>{freq}</Text>
        </View>
        <GrowthChart line={line} area={area} />
      </GlassCard>

      <Text style={s.sectionLabel}>Assumptions</Text>
      {ASSUMPTIONS.map((a) => (
        <GlassCard key={a.label} style={s.inputCard} radius={18}>
          <View style={s.rowBetween}>
            <View>
              <Text style={s.inputLabel}>{a.label}</Text>
              <Text style={s.inputValue}>{a.value}</Text>
            </View>
            <View style={s.stepperRow}>
              <TouchableOpacity onPress={set(a.dec)} activeOpacity={0.8} style={[s.stepBtn, { backgroundColor: theme.mutedBg, borderColor: theme.mutedBorder }]} accessibilityLabel={`Decrease ${a.label}`}>
                <Icon name="minus" size={16} color={theme.mutedCol} strokeWidth={2.6} />
              </TouchableOpacity>
              <TouchableOpacity onPress={set(a.inc)} activeOpacity={0.8} style={[s.stepBtn, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]} accessibilityLabel={`Increase ${a.label}`}>
                <Icon name="plus" size={16} color={theme.accent} strokeWidth={2.6} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.chipRow}>
            {a.chips.map((c) => (
              <Chip key={c.label} label={c.label} active={c.active} onPress={set(c.set)} />
            ))}
          </View>
        </GlassCard>
      ))}

      {/* Frequency selector */}
      <TouchableOpacity activeOpacity={0.85} onPress={() => { haptic(); setFreqOpen(true); }}>
        <GlassCard style={s.freqCard} radius={18}>
          <View>
            <Text style={s.inputLabel}>Compounding frequency</Text>
            <Text style={s.freqValue}>{freq}</Text>
          </View>
          <Icon name="chevronDown" size={18} color={theme.sub} strokeWidth={2.2} />
        </GlassCard>
      </TouchableOpacity>

      <GradientButton onPress={() => { haptic(); setSaveOpen(true); }} style={{ marginBottom: 4 }}>
        <Icon name="bookmark" size={17} color={theme.btnFg} filled />
        <Text style={[s.saveBtnText, { color: theme.btnFg }]}>Save this scenario</Text>
      </GradientButton>

      {/* Frequency sheet */}
      <Sheet visible={freqOpen} onClose={() => setFreqOpen(false)}>
        <Text style={s.sheetTitle}>Compounding frequency</Text>
        {FREQ_OPTIONS.map((f) => {
          const active = f === freq;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => pickFreq(f)}
              activeOpacity={0.85}
              style={[s.freqOption, { backgroundColor: active ? theme.accentSoft : theme.mutedBg, borderColor: active ? theme.accentBorder : theme.mutedBorder }]}
            >
              <Text style={[s.freqOptionText, { color: active ? theme.accent : theme.text }]}>{f}</Text>
              {active && <Icon name="check" size={18} color={theme.accent} strokeWidth={2.6} />}
            </TouchableOpacity>
          );
        })}
      </Sheet>

      {/* Save sheet */}
      <Sheet visible={saveOpen} onClose={() => setSaveOpen(false)}>
        <Text style={s.sheetTitle}>Save calculation</Text>
        <Text style={s.sheetSubtitle}>Give your scenario a memorable name</Text>
        <TextInput
          value={saveTitle}
          onChangeText={setSaveTitle}
          placeholder="e.g. Retirement Fund Goal"
          placeholderTextColor={theme.ter}
          selectionColor={theme.accent}
          autoFocus
          maxLength={50}
          style={[s.textInput, { backgroundColor: theme.mutedBg, borderColor: theme.mutedBorder, color: theme.text }]}
        />
        <View style={[s.previewBox, { backgroundColor: theme.accentSoft }]}>
          <Text style={s.previewLabel}>Final balance</Text>
          <Text style={[s.previewValue, { color: theme.accent }]}>{money(b.balance)}</Text>
        </View>
        <View style={s.sheetActions}>
          <TouchableOpacity onPress={() => setSaveOpen(false)} activeOpacity={0.85} style={[s.cancelBtn, { backgroundColor: theme.mutedBg, borderColor: theme.mutedBorder }]}>
            <Text style={[s.cancelText, { color: theme.mutedCol }]}>Cancel</Text>
          </TouchableOpacity>
          <GradientButton onPress={handleSave} disabled={isSaving} style={{ flex: 1.5 }} radius={12} contentStyle={{ paddingVertical: 14 }}>
            <Text style={[s.saveConfirmText, { color: theme.btnFg }]}>{isSaving ? 'Saving…' : 'Save'}</Text>
          </GradientButton>
        </View>
      </Sheet>
    </Screen>
  );
}

function Legend({
  theme,
  color,
  label,
  value,
  valueColor,
  align = 'flex-start',
}: {
  theme: Theme;
  color: string;
  label: string;
  value: string;
  valueColor?: string;
  align?: 'flex-start' | 'flex-end';
}) {
  return (
    <View style={{ alignItems: align }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 3, backgroundColor: color }} />
        <Text style={{ fontFamily: Font.bodySemi, fontSize: 11, color: theme.sub }}>{label}</Text>
      </View>
      <Text style={{ fontFamily: Font.display, fontSize: 15, color: valueColor ?? theme.text, marginTop: 3 }}>{value}</Text>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    resultCard: { padding: 16, paddingBottom: 16 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    futureLabel: {
      fontFamily: Font.bodyBold,
      fontSize: 12,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      color: theme.sub,
    },
    growthBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.accentSoft,
      borderWidth: 1,
      borderColor: theme.accentBorder,
      paddingVertical: 4,
      paddingHorizontal: 9,
      borderRadius: 9,
    },
    growthText: { fontFamily: Font.displayBold, fontSize: 13, color: theme.accent },
    balance: {
      fontFamily: Font.displayBold,
      fontSize: 42,
      letterSpacing: -1.5,
      marginTop: 8,
      marginBottom: 15,
    },
    legendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 13 },
    chartCard: { marginTop: 14, paddingHorizontal: 14, paddingTop: 16, paddingBottom: 12 },
    chartTitle: { fontFamily: Font.bodySemi, fontSize: 12, color: theme.sub },
    freqBadge: {
      fontFamily: Font.bodyBold,
      fontSize: 11,
      color: theme.accent,
      backgroundColor: theme.accentSoft,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 7,
      overflow: 'hidden',
    },
    sectionLabel: {
      fontFamily: Font.bodyBold,
      fontSize: 12,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      color: theme.ter,
      marginTop: 22,
      marginBottom: 10,
      marginHorizontal: 4,
    },
    inputCard: { padding: 15, marginBottom: 11 },
    inputLabel: {
      fontFamily: Font.bodySemi,
      fontSize: 11,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: theme.sub,
    },
    inputValue: { fontFamily: Font.display, fontSize: 25, color: theme.text, marginTop: 3 },
    stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    stepBtn: {
      width: 40,
      height: 40,
      borderRadius: 13,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipRow: { flexDirection: 'row', gap: 7, marginTop: 14 },
    freqCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, marginBottom: 16 },
    freqValue: { fontFamily: Font.display, fontSize: 19, color: theme.text, marginTop: 3 },
    saveBtnText: { fontFamily: Font.bodyBold, fontSize: 15 },
    sheetTitle: { fontFamily: Font.bodyBold, fontSize: 18, color: theme.text, textAlign: 'center' },
    sheetSubtitle: { fontFamily: Font.body, fontSize: 13.5, color: theme.sub, textAlign: 'center', marginTop: 6, marginBottom: 18 },
    freqOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 15,
      paddingHorizontal: 16,
      borderRadius: 14,
      borderWidth: 1,
      marginBottom: 8,
      marginTop: 8,
    },
    freqOptionText: { fontFamily: Font.bodySemi, fontSize: 15 },
    textInput: {
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      fontFamily: Font.body,
      fontSize: 16,
    },
    previewBox: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', marginVertical: 16 },
    previewLabel: { fontFamily: Font.body, fontSize: 12, color: theme.sub },
    previewValue: { fontFamily: Font.displayBold, fontSize: 22, marginTop: 2 },
    sheetActions: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
    cancelText: { fontFamily: Font.bodySemi, fontSize: 15 },
    saveConfirmText: { fontFamily: Font.bodyBold, fontSize: 15 },
  });
