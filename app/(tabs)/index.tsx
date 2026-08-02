import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { Collapsible } from '@/components/ui/collapsible';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { GradientText } from '@/components/ui/gradient-text';
import { GrowthChart } from '@/components/ui/growth-chart';
import { Icon } from '@/components/ui/icon';
import { formatFieldValue, Keypad } from '@/components/ui/keypad';
import { FadeUp } from '@/components/ui/motion';
import { Screen } from '@/components/ui/screen';
import { SegmentBar } from '@/components/ui/segment-bar';
import { Sheet } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Field, FieldKey, FIELDS, FREQ_OPTIONS, fieldAt, fieldIndex, tileLabel } from '@/constants/fields';
import { Font, Theme } from '@/constants/tokens';
import { useCalculations } from '@/hooks/use-calculations';
import { useCountTo } from '@/hooks/use-count-to';
import { useSaveAction } from '@/hooks/use-save-action';
import { useTheme } from '@/hooks/use-theme';
import { commitEntry, nextEntry } from '@/utils/entry';
import { balanceAt, breakdown, chartSeries, money } from '@/utils/finance';

type Values = Record<FieldKey, number>;

const DEFAULTS: Values = { initial: 10000, monthly: 500, rate: 8, years: 25 };
/** Fixed chart resolution, so every series can tween into the next. */
const CHART_SAMPLES = 28;

const haptic = () => {
  if (Platform.OS === 'ios') Haptics.selectionAsync();
};

export default function CalculatorScreen() {
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  const { saveCalculation, calculations } = useCalculations();
  const { register } = useSaveAction();
  const scrollRef = useRef<ScrollView>(null);

  const [values, setValues] = useState<Values>(DEFAULTS);
  const [freq, setFreq] = useState('Monthly');

  const [focus, setFocus] = useState<FieldKey | null>(null);
  const [entry, setEntry] = useState('');
  const [fresh, setFresh] = useState(true);
  const [bump, setBump] = useState(0);

  const [freqOpen, setFreqOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const inputs = useMemo(
    () => ({ initial: values.initial, contribution: values.monthly, ratePct: values.rate, freq }),
    [values.initial, values.monthly, values.rate, freq],
  );
  const b = useMemo(() => breakdown(inputs, values.years), [inputs, values.years]);

  // A constant sample count keeps successive series index-aligned so the chart
  // can tween between shapes rather than snapping.
  const chartPoints = useMemo(
    () => chartSeries(inputs, values.years, CHART_SAMPLES),
    [inputs, values.years],
  );

  const { value: display, animateTo, set: setDisplay, stop: stopCount } = useCountTo();

  // Latest inputs, so imperative handlers can compute the balance for a state
  // they are *about* to set without waiting for a re-render.
  const live = useRef({ values, freq });
  live.current = { values, freq };

  const balanceWith = useCallback((patch: Partial<Values>, nextFreq?: string) => {
    const next = { ...live.current.values, ...patch };
    return balanceAt(
      { initial: next.initial, contribution: next.monthly, ratePct: next.rate, freq: nextFreq ?? live.current.freq },
      next.years,
    );
  }, []);

  const balanceRef = useRef(b.balance);
  balanceRef.current = b.balance;

  // Roll the balance up from zero on entry (1.6s the first time, 1.1s when
  // coming back from another tab — matching `componentDidMount` / `go('calc')`).
  const firstVisit = useRef(true);
  useFocusEffect(
    useCallback(() => {
      animateTo(balanceRef.current, firstVisit.current ? 1600 : 1100, 0);
      firstVisit.current = false;
    }, [animateTo]),
  );

  // The tab bar's bookmark button opens the save sheet from outside this tree.
  useEffect(
    () =>
      register(() => {
        setFocus(null);
        setEntry('');
        setFresh(true);
        setSaveOpen(true);
      }),
    [register],
  );

  // ---- keypad -------------------------------------------------------------

  const openFocus = (key: FieldKey) => {
    // Pin the readout to the current balance so the count-up does not keep
    // running underneath the keypad.
    stopCount();
    setDisplay(Math.round(balanceRef.current));
    setFocus(key);
    setEntry(String(live.current.values[key]));
    setFresh(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const closeFocus = () => {
    // A blank or sub-year horizon would make the projection meaningless.
    const patch: Partial<Values> = live.current.values.years < 1 ? { years: 1 } : {};
    if (patch.years !== undefined) setValues((v) => ({ ...v, years: patch.years as number }));
    setFocus(null);
    setEntry('');
    setFresh(true);
    animateTo(balanceWith(patch), 520);
  };

  const commit = (key: FieldKey, raw: string) => {
    const { text, value } = commitEntry(fieldAt(key), raw);
    setEntry(text);
    setFresh(false);
    setValues((v) => ({ ...v, [key]: value }));
    setBump((x) => x + 1);
    animateTo(balanceWith({ [key]: value }), 280);
  };

  const pressKey = (char: string) => {
    if (!focus) return;
    const next = nextEntry(entry, fresh, char);
    if (next === null) return;
    commit(focus, next);
  };

  const deleteKey = () => {
    if (!focus) return;
    commit(focus, entry.slice(0, -1));
  };

  const clearKey = () => {
    if (!focus) return;
    commit(focus, '');
  };

  const moveFocus = (delta: number) => {
    if (!focus) return;
    const i = fieldIndex(focus) + delta;
    if (i < 0 || i >= FIELDS.length) return;
    const next = FIELDS[i];
    setFocus(next.key);
    setEntry(String(live.current.values[next.key]));
    setFresh(true);
  };

  /** Frequency change from inside the keypad — keeps the pad open. */
  const setFreqLive = (next: string) => {
    setFreq(next);
    setBump((x) => x + 1);
    animateTo(balanceWith({}, next), 420);
  };

  /** Frequency change from the sheet. */
  const pickFreq = (next: string) => {
    haptic();
    setFreq(next);
    setFreqOpen(false);
    animateTo(balanceWith({}, next), 650);
  };

  const openFreqSheet = () => {
    haptic();
    setFocus(null);
    setEntry('');
    setFresh(true);
    setFreqOpen(true);
  };

  // ---- save ---------------------------------------------------------------

  const handleSave = async () => {
    const title = saveTitle.trim();
    if (!title) {
      Toast.show({ type: 'error', text1: 'Please enter a title', position: 'top', visibilityTime: 2500 });
      return;
    }
    if (isSaving) return;
    setIsSaving(true);
    try {
      await saveCalculation({
        title,
        finalBalance: b.balance,
        initialDeposit: values.initial,
        interestEarned: b.interest,
        contributions: b.contributionsTotal,
        contributionAmount: values.monthly,
        timePeriod: values.years,
        rateOfReturn: values.rate,
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

  // ---- derived display ----------------------------------------------------

  const focused = focus !== null;
  const growthText = `${b.growthPct >= 0 ? '+' : ''}${b.growthPct.toFixed(0)}%`;
  const horizonYear = new Date().getFullYear() + Math.round(values.years);

  const tileHint = (field: Field) => (field.key === 'years' ? `through ${horizonYear}` : field.hint);

  const header = (
    <>
      <Collapsible expanded={!focused} rise={-18}>
        <FadeUp>
          <View style={s.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>Compound</Text>
              <Text style={s.subtitle}>Watch your money grow over time</Text>
            </View>
            <ThemeToggle />
          </View>
        </FadeUp>
      </Collapsible>

      <Collapsible expanded={focused} rise={-12}>
        <View style={s.editingRow}>
          <Text style={s.editingLabel}>Editing assumptions</Text>
          <TouchableOpacity onPress={closeFocus} activeOpacity={0.7} accessibilityRole="button" hitSlop={10}>
            <Text style={s.editingDone}>Done</Text>
          </TouchableOpacity>
        </View>
      </Collapsible>
    </>
  );

  return (
    <Screen header={header} scrollRef={scrollRef}>
      <FadeUp delay={50} duration={550}>
        <GlassCard style={s.resultCard}>
          <View style={s.rowBetween}>
            <Text style={s.futureLabel}>Future Value</Text>
            <View style={[s.badge, s.growthBadge]}>
              <Icon name="trending" size={11} color={theme.accent} strokeWidth={2.6} />
              <Text style={s.growthText}>{growthText}</Text>
            </View>
          </View>

          <GradientText text={money(display)} colors={theme.balanceGrad} style={s.balance} numberOfLines={1} />

          <View style={s.chartWrap}>
            <GrowthChart points={chartPoints} years={values.years} height={84} />
          </View>

          <Collapsible expanded={!focused} rise={-12}>
            <View style={{ marginTop: 16 }}>
              <SegmentBar principalPct={b.principalRatio} contribPct={b.contribRatio} />
            </View>
            <View style={s.legendRow}>
              <Legend theme={theme} color={theme.cPrincipal} label="Principal" value={money(values.initial)} />
              <Legend theme={theme} color={theme.cContrib} label="Contributions" value={money(b.contributionsTotal)} />
              <Legend
                theme={theme}
                color={theme.cInterest}
                label="Interest"
                value={money(b.interest)}
                valueColor={theme.accent}
                align="flex-end"
              />
            </View>
          </Collapsible>
        </GlassCard>
      </FadeUp>

      <Collapsible expanded={!focused} rise={-22} duration={500} bleed={18}>
        <Text style={s.sectionLabel}>Assumptions</Text>
        <View style={{ gap: 10 }}>
          <View style={s.tileRow}>
            {FIELDS.slice(0, 2).map((f, i) => (
              <Tile
                key={f.key}
                theme={theme}
                styles={s}
                field={f}
                delay={i * 55}
                value={formatFieldValue(f, values[f.key])}
                hint={tileHint(f)}
                freq={freq}
                onPress={() => {
                  haptic();
                  openFocus(f.key);
                }}
                onPickFreq={openFreqSheet}
              />
            ))}
          </View>
          <View style={s.tileRow}>
            {FIELDS.slice(2).map((f, i) => (
              <Tile
                key={f.key}
                theme={theme}
                styles={s}
                field={f}
                delay={(i + 2) * 55}
                value={formatFieldValue(f, values[f.key])}
                hint={tileHint(f)}
                freq={freq}
                onPress={() => {
                  haptic();
                  openFocus(f.key);
                }}
                onPickFreq={openFreqSheet}
              />
            ))}
          </View>
        </View>
      </Collapsible>

      {focus ? (
        <Keypad
          field={fieldAt(focus)}
          entry={entry}
          values={values}
          freq={freq}
          bump={bump}
          onPress={pressKey}
          onDelete={deleteKey}
          onClear={clearKey}
          onMove={moveFocus}
          onSelect={openFocus}
          onPickFreq={setFreqLive}
          onClose={closeFocus}
        />
      ) : null}

      {/* Frequency sheet */}
      <Sheet visible={freqOpen} onClose={() => setFreqOpen(false)}>
        <Text style={s.freqSheetTitle}>Compounding frequency</Text>
        <View style={{ marginTop: 16 }}>
          {FREQ_OPTIONS.map((f) => {
            const active = f === freq;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => pickFreq(f)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={active ? { selected: true } : {}}
                style={[
                  s.freqOption,
                  {
                    backgroundColor: active ? theme.accentSoft : theme.mutedBg,
                    borderColor: active ? theme.accentBorder : theme.mutedBorder,
                  },
                ]}
              >
                <Text style={[s.freqOptionText, { color: active ? theme.accent : theme.text }]}>{f}</Text>
                {active ? <Icon name="check" size={18} color={theme.accent} strokeWidth={2.6} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </Sheet>

      {/* Save sheet */}
      <Sheet visible={saveOpen} onClose={() => setSaveOpen(false)}>
        <Text style={s.sheetEyebrow}>Save scenario</Text>
        <Text style={s.sheetTitle}>Name this calculation</Text>
        <TextInput
          value={saveTitle}
          onChangeText={setSaveTitle}
          placeholder="e.g. Retirement Fund Goal"
          placeholderTextColor={theme.ter}
          selectionColor={theme.accent}
          autoFocus
          maxLength={50}
          returnKeyType="done"
          onSubmitEditing={handleSave}
          style={[s.textInput, { backgroundColor: theme.mutedBg, borderColor: theme.mutedBorder, color: theme.text }]}
        />
        <View style={s.previewRow}>
          <Text style={s.previewLabel}>Future value</Text>
          <Text style={s.previewValue}>{money(b.balance)}</Text>
        </View>
        <View style={s.sheetActions}>
          <Pressable
            onPress={() => setSaveOpen(false)}
            accessibilityRole="button"
            style={({ pressed }) => [s.cancelBtn, pressed && { transform: [{ scale: 0.97 }] }]}
          >
            <Text style={s.cancelText}>Cancel</Text>
          </Pressable>
          <GradientButton
            onPress={handleSave}
            disabled={isSaving}
            style={{ flex: 1.5 }}
            radius={14}
            contentStyle={{ paddingVertical: 15 }}
            shadow
          >
            <Text style={[s.saveConfirmText, { color: theme.btnFg }]}>{isSaving ? 'Saving…' : 'Save'}</Text>
          </GradientButton>
        </View>
      </Sheet>
    </Screen>
  );
}

/** One assumption tile; the contribution tile swaps its hint for a frequency chip. */
function Tile({
  theme,
  styles: s,
  field,
  value,
  hint,
  freq,
  delay,
  onPress,
  onPickFreq,
}: {
  theme: Theme;
  styles: ReturnType<typeof makeStyles>;
  field: Field;
  value: string;
  hint: string;
  freq: string;
  delay: number;
  onPress: () => void;
  onPickFreq: () => void;
}) {
  const isContrib = field.key === 'monthly';
  return (
    <FadeUp delay={delay} style={{ flex: 1 }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${tileLabel(field)}, ${value}. Edit`}
        style={({ pressed }) => [s.tile, pressed && { transform: [{ scale: 0.975 }] }]}
      >
        <Text style={s.tileLabel} numberOfLines={1}>
          {tileLabel(field)}
        </Text>
        <Text style={s.tileValue} numberOfLines={1}>
          {value}
        </Text>
        {isContrib ? (
          <Pressable
            onPress={onPickFreq}
            accessibilityRole="button"
            accessibilityLabel={`Compounding frequency, ${freq}. Change`}
            style={({ pressed }) => [s.freqChip, pressed && { transform: [{ scale: 0.94 }] }]}
          >
            <Text style={s.freqChipText} numberOfLines={1}>
              {freq}
            </Text>
            <Icon name="chevronDown" size={9} color={theme.accent} strokeWidth={3.4} />
          </Pressable>
        ) : (
          <Text style={s.tileHint} numberOfLines={1}>
            {hint}
          </Text>
        )}
      </Pressable>
    </FadeUp>
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
      <Text style={{ fontFamily: Font.display, fontSize: 15, color: valueColor ?? theme.text, marginTop: 3 }}>
        {value}
      </Text>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingBottom: 18 },
    title: { fontFamily: Font.displayBold, fontSize: 26, lineHeight: 28, letterSpacing: -0.4, color: theme.text },
    subtitle: { fontFamily: Font.body, fontSize: 12.5, color: theme.sub, marginTop: 3 },

    editingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 16,
    },
    editingLabel: {
      fontFamily: Font.bodyBold,
      fontSize: 11,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: theme.ter,
    },
    editingDone: { fontFamily: Font.bodyBlack, fontSize: 13.5, color: theme.accent, padding: 2 },

    resultCard: { paddingTop: 18, paddingHorizontal: 16, paddingBottom: 16, overflow: 'hidden' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    futureLabel: {
      fontFamily: Font.bodyBold,
      fontSize: 12,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      color: theme.sub,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 9,
      borderRadius: 9,
      borderWidth: 1,
    },
    growthBadge: { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder },
    growthText: { fontFamily: Font.displayBold, fontSize: 13, color: theme.accent },
    balance: { fontFamily: Font.displayBold, fontSize: 42, lineHeight: 51, letterSpacing: -1.5, marginTop: 5 },
    chartWrap: { marginTop: 14, marginHorizontal: -16 },
    legendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 13 },

    sectionLabel: {
      fontFamily: Font.bodyBold,
      fontSize: 12,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      color: theme.ter,
      marginTop: 20,
      marginBottom: 10,
      marginHorizontal: 4,
    },
    tileRow: { flexDirection: 'row', gap: 10 },
    tile: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: 18,
      paddingTop: 13,
      paddingHorizontal: 14,
      paddingBottom: 12,
      boxShadow: theme.cardShadow,
    },
    tileLabel: {
      fontFamily: Font.bodyBold,
      fontSize: 10,
      letterSpacing: 0.7,
      textTransform: 'uppercase',
      color: theme.sub,
    },
    tileValue: { fontFamily: Font.display, fontSize: 23, letterSpacing: -0.5, color: theme.text, marginTop: 7 },
    tileHint: { fontFamily: Font.bodySemi, fontSize: 10.5, color: theme.ter, marginTop: 3 },
    freqChip: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      marginTop: 5,
      backgroundColor: theme.accentSoft,
      borderWidth: 1,
      borderColor: theme.accentBorder,
      paddingVertical: 2,
      paddingLeft: 7,
      paddingRight: 5,
      borderRadius: 7,
    },
    freqChipText: { fontFamily: Font.bodyBold, fontSize: 10, color: theme.accent },

    // Small uppercase kicker above each sheet's heading.
    sheetEyebrow: {
      fontFamily: Font.bodyBold,
      fontSize: 11,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: theme.ter,
      textAlign: 'center',
    },
    sheetTitle: {
      fontFamily: Font.bodyBold,
      fontSize: 18,
      color: theme.text,
      textAlign: 'center',
      marginTop: 5,
      marginBottom: 16,
    },
    // The picker's heading is a step down from the save/edit sheets.
    freqSheetTitle: { fontFamily: Font.bodyBold, fontSize: 17, color: theme.text, textAlign: 'center' },
    freqOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 15,
      paddingHorizontal: 16,
      borderRadius: 14,
      borderWidth: 1,
      marginBottom: 8,
    },
    freqOptionText: { fontFamily: Font.bodySemi, fontSize: 15 },
    textInput: {
      borderWidth: 1,
      borderRadius: 14,
      paddingVertical: 15,
      paddingHorizontal: 16,
      fontFamily: Font.bodySemi,
      fontSize: 16,
    },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.accentSoft,
      borderWidth: 1,
      borderColor: theme.accentBorder,
      borderRadius: 14,
      paddingVertical: 13,
      paddingHorizontal: 16,
      marginTop: 12,
      marginBottom: 18,
    },
    previewLabel: {
      fontFamily: Font.bodyBold,
      fontSize: 10,
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: theme.sub,
    },
    previewValue: { fontFamily: Font.displayBold, fontSize: 21, color: theme.accent },
    sheetActions: { flexDirection: 'row', gap: 10 },
    cancelBtn: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.mutedBg,
      borderColor: theme.mutedBorder,
    },
    cancelText: { fontFamily: Font.bodyBold, fontSize: 15, color: theme.mutedCol },
    saveConfirmText: { fontFamily: Font.bodyBold, fontSize: 15 },
  });
