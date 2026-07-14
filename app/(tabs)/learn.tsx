import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { GlassCard } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Dialog } from '@/components/ui/sheet';
import { Font } from '@/constants/tokens';
import { useTheme } from '@/hooks/use-theme';

const STEPS = [
  { n: '1', bold: 'You invest a starting amount.', rest: ' This is your principal.' },
  { n: '2', bold: 'It earns a return each period.', rest: ' A percentage is added to your balance.' },
  { n: '3', bold: 'Next period you earn on the bigger balance.', rest: ' Repeat, and growth accelerates.' },
];

const BARS = [
  { label: 'Year 1', width: 15.8, principal: 92.6, value: '$1,080', accent: false },
  { label: 'Year 10', width: 31.5, principal: 46.3, value: '$2,159', accent: false },
  { label: 'Year 25', width: 100, principal: 14.6, value: '$6,848', accent: true },
];

const FORMULA_VARS = [
  ['A', 'future value'],
  ['P', 'principal'],
  ['r', 'annual rate'],
  ['n', 'times compounded / year'],
  ['t', 'number of years'],
];

const TIPS = [
  { title: 'Start early', body: 'Time is the biggest lever. Even small amounts compound powerfully over decades.' },
  { title: 'Invest regularly', body: 'Steady contributions add fuel to the snowball every single period.' },
  { title: 'Reinvest your returns', body: 'Leaving interest in place is what turns growth into exponential growth.' },
];

export default function LearnScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [tour, setTour] = useState(false);
  const s = makeStyles(theme);

  return (
    <Screen title="How it works" subtitle="Compound interest, explained simply">
      {/* What is compound interest */}
      <GlassCard style={s.card} radius={20}>
        <View style={s.rowCenter}>
          <View style={s.iconTile}>
            <Icon name="bulb" size={17} color={theme.accent} strokeWidth={1.8} />
          </View>
          <Text style={s.cardTitle}>What is compound interest?</Text>
        </View>
        <Text style={s.paragraph}>
          It is the interest you earn on both your original money and on the interest it has already earned. Your
          returns start earning returns of their own, so the balance grows faster the longer you leave it.
        </Text>
      </GlassCard>

      <Text style={s.sectionLabel}>The snowball effect</Text>
      <View style={{ gap: 10 }}>
        {STEPS.map((step) => (
          <GlassCard key={step.n} style={s.stepCard} radius={16}>
            <View style={s.stepNum}>
              <Text style={s.stepNumText}>{step.n}</Text>
            </View>
            <Text style={s.stepText}>
              <Text style={s.stepBold}>{step.bold}</Text>
              {step.rest}
            </Text>
          </GlassCard>
        ))}
      </View>

      {/* Snowball chart */}
      <GlassCard style={[s.card, { marginTop: 14 }]} radius={20}>
        <Text style={[s.stepBold, { marginBottom: 14 }]}>$1,000 left to grow at 8% a year</Text>
        <View style={{ gap: 12 }}>
          {BARS.map((bar) => (
            <View key={bar.label} style={s.barRow}>
              <Text style={s.barLabel}>{bar.label}</Text>
              <View style={s.barTrack}>
                <View style={{ height: '100%', width: `${bar.width}%`, flexDirection: 'row' }}>
                  <View style={{ width: `${bar.principal}%`, backgroundColor: theme.cPrincipal }} />
                  <View style={{ flex: 1, backgroundColor: theme.cInterest }} />
                </View>
              </View>
              <Text style={[s.barValue, bar.accent && { color: theme.accent }]}>{bar.value}</Text>
            </View>
          ))}
        </View>
        <View style={s.legendRow}>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: theme.cPrincipal }]} />
            <Text style={s.legendText}>Your money</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: theme.cInterest }]} />
            <Text style={s.legendText}>Interest earned</Text>
          </View>
        </View>
        <Text style={s.caption}>
          By year 25 the interest earned is far larger than the amount you put in. That is compounding at work.
        </Text>
      </GlassCard>

      {/* Formula */}
      <GlassCard style={[s.card, { marginTop: 14 }]} radius={20}>
        <Text style={[s.sectionLabel, { marginTop: 0, marginBottom: 10, marginHorizontal: 0 }]}>The formula</Text>
        <Text style={s.formula}>
          A = P (1 + r/n)<Text style={s.formulaSup}>nt</Text>
        </Text>
        <View style={s.formulaGrid}>
          {FORMULA_VARS.map(([v, meaning]) => (
            <View key={v} style={s.formulaItem}>
              <Text style={s.formulaVar}>{v}</Text>
              <Text style={s.formulaMeaning}> {meaning}</Text>
            </View>
          ))}
        </View>
      </GlassCard>

      <Text style={s.sectionLabel}>Make it work harder</Text>
      <View style={{ gap: 10 }}>
        {TIPS.map((tip) => (
          <GlassCard key={tip.title} style={s.tipCard} radius={16}>
            <Text style={s.tipTitle}>{tip.title}</Text>
            <Text style={s.tipBody}>{tip.body}</Text>
          </GlassCard>
        ))}
      </View>

      <View style={{ marginTop: 20, gap: 12 }}>
        <GradientButton onPress={() => router.navigate('/')} contentStyle={{ paddingVertical: 17 }}>
          <Text style={[s.primaryBtnText, { color: theme.btnFg }]}>Try it in the calculator</Text>
        </GradientButton>
        <TouchableOpacity
          onPress={() => setTour(true)}
          activeOpacity={0.85}
          style={[s.secondaryBtn, { backgroundColor: theme.mutedBg, borderColor: theme.mutedBorder }]}
        >
          <Text style={[s.secondaryBtnText, { color: theme.mutedCol }]}>Take a quick tour</Text>
        </TouchableOpacity>
      </View>

      <Dialog visible={tour} onClose={() => setTour(false)} padding={18}>
        <View style={{ alignItems: 'center' }}>
          <View style={[s.iconTile, { marginRight: 0, marginBottom: 12, width: 34, height: 34, borderRadius: 17 }]}>
            <Icon name="bulb" size={18} color={theme.accent} strokeWidth={1.8} />
          </View>
          <Text style={s.tourText}>
            Set your initial investment, rate, and time with the steppers or preset chips, no typing needed. The balance
            and chart update instantly. Tap the bookmark to save scenarios.
          </Text>
          <TouchableOpacity
            onPress={() => setTour(false)}
            activeOpacity={0.85}
            style={[s.tourBtn, { backgroundColor: theme.accent }]}
          >
            <Text style={[s.tourBtnText, { color: theme.btnFg }]}>Got it!</Text>
          </TouchableOpacity>
        </View>
      </Dialog>
    </Screen>
  );
}

const makeStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
  StyleSheet.create({
    card: { padding: 18 },
    rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 11 },
    iconTile: {
      width: 34,
      height: 34,
      borderRadius: 11,
      backgroundColor: theme.iconTile,
      borderWidth: 1,
      borderColor: theme.iconTileBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: { fontFamily: Font.bodyBold, fontSize: 15, color: theme.text, flex: 1 },
    paragraph: { fontFamily: Font.body, fontSize: 14, color: theme.sub, lineHeight: 22 },
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
    stepCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 14 },
    stepNum: {
      width: 26,
      height: 26,
      borderRadius: 9,
      backgroundColor: theme.accentSoft,
      borderWidth: 1,
      borderColor: theme.accentBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepNumText: { fontFamily: Font.displayBold, fontSize: 14, color: theme.accent },
    stepText: { flex: 1, fontFamily: Font.body, fontSize: 13.5, color: theme.sub, lineHeight: 20 },
    stepBold: { fontFamily: Font.bodyBold, fontSize: 13.5, color: theme.text },
    barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    barLabel: { width: 52, fontFamily: Font.bodySemi, fontSize: 11, color: theme.ter },
    barTrack: { flex: 1, height: 14, borderRadius: 7, backgroundColor: theme.track, overflow: 'hidden' },
    barValue: { width: 56, textAlign: 'right', fontFamily: Font.displayMed, fontSize: 12.5, color: theme.text },
    legendRow: { flexDirection: 'row', gap: 16, marginTop: 14 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 9, height: 9, borderRadius: 3 },
    legendText: { fontFamily: Font.bodySemi, fontSize: 11.5, color: theme.sub },
    caption: { fontFamily: Font.body, fontSize: 12.5, color: theme.ter, lineHeight: 19, marginTop: 12 },
    formula: { fontFamily: Font.display, fontSize: 26, color: theme.text, letterSpacing: 0.5 },
    formulaSup: { fontSize: 15 },
    formulaGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14 },
    formulaItem: { width: '50%', paddingVertical: 5, flexDirection: 'row', alignItems: 'center' },
    formulaVar: { fontFamily: Font.display, fontSize: 12.5, color: theme.accent },
    formulaMeaning: { fontFamily: Font.body, fontSize: 12.5, color: theme.sub },
    tipCard: { padding: 14, paddingHorizontal: 15 },
    tipTitle: { fontFamily: Font.bodyBold, fontSize: 13.5, color: theme.text },
    tipBody: { fontFamily: Font.body, fontSize: 12.5, color: theme.sub, lineHeight: 19, marginTop: 2 },
    primaryBtnText: { fontFamily: Font.bodyBold, fontSize: 16 },
    secondaryBtn: { borderRadius: 16, paddingVertical: 15, alignItems: 'center', borderWidth: 1 },
    secondaryBtnText: { fontFamily: Font.bodyBold, fontSize: 14.5 },
    tourText: { fontFamily: Font.body, fontSize: 14, color: theme.text, lineHeight: 21, textAlign: 'center', marginBottom: 15 },
    tourBtn: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 22 },
    tourBtnText: { fontFamily: Font.bodySemi, fontSize: 14 },
  });
