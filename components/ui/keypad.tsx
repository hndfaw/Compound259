import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Field,
  FieldKey,
  FIELDS,
  FREQ_ADJ,
  FREQ_SEGMENTS,
  fieldIndex,
  tileShort,
} from '@/constants/fields';
import { Font, Theme } from '@/constants/tokens';
import { useTheme } from '@/hooks/use-theme';
import { money } from '@/utils/finance';
import { Icon } from './icon';
import { Pop } from './motion';

const KEY_H = 58;
const KEY_R = 29;
const GAP = 9;
const PAD_X = 14;
/** Far enough offscreen that any pad height starts fully hidden. */
const OFFSCREEN = 700;
/** Drag distance past which releasing dismisses the pad. */
const DISMISS_AT = 64;

const SPRINGY = Easing.bezier(0.16, 1, 0.3, 1);

const haptic = () => {
  if (Platform.OS === 'ios') Haptics.selectionAsync();
};

/** Format a field's committed value the way its tile shows it. */
export const formatFieldValue = (field: Field, value: number): string => {
  if (field.key === 'rate') return `${Math.round(value * 10) / 10}%`;
  if (field.key === 'years') return `${Math.round(value)} yrs`;
  return money(value);
};

/** Split the raw entry string into the grouped head and the unit suffix. */
export const entryParts = (field: Field, entry: string): { head: string; suffix: string } => {
  const parts = entry.split('.');
  const integer = parseInt(parts[0] || '0', 10) || 0;
  let shown = integer.toLocaleString('en-US');
  if (entry.includes('.')) shown += `.${parts[1] ?? ''}`;
  if (entry === '') shown = '0';
  return { head: field.pre + shown, suffix: field.suf };
};

/** A single key: press feedback is a scale-down plus a brightening overlay. */
function Key({
  onPress,
  children,
  background,
  style,
  label,
  scale = 0.93,
}: {
  onPress: () => void;
  children: React.ReactNode;
  background: string;
  style?: StyleProp<ViewStyle>;
  label: string;
  scale?: number;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={() => {
        haptic();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        {
          height: KEY_H,
          borderRadius: KEY_R,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: background,
          boxShadow: theme.keyShadow,
          transform: [{ scale: pressed ? scale : 1 }],
        },
        style,
      ]}
    >
      {({ pressed }) => (
        <>
          {pressed ? (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.16)' }]} />
          ) : null}
          {children}
        </>
      )}
    </Pressable>
  );
}

/**
 * The redesign's in-app number pad. It replaces the OS keyboard entirely: every
 * assumption is typed here, and Prev/Next walk all four fields without closing.
 */
export function Keypad({
  field,
  entry,
  values,
  freq,
  bump,
  onPress,
  onDelete,
  onClear,
  onMove,
  onSelect,
  onPickFreq,
  onClose,
}: {
  field: Field;
  entry: string;
  values: Record<FieldKey, number>;
  freq: string;
  /** Increments on every committed keystroke to retrigger the value bump. */
  bump: number;
  onPress: (char: string) => void;
  onDelete: () => void;
  onClear: () => void;
  onMove: (delta: number) => void;
  onSelect: (key: FieldKey) => void;
  onPickFreq: (freq: string) => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const s = useMemo(() => makeStyles(theme), [theme]);

  const col = (width - PAD_X * 2 - GAP * 3) / 4;
  const wide = col * 2 + GAP;

  const index = fieldIndex(field.key);
  const atFirst = index === 0;
  const atLast = index === FIELDS.length - 1;
  const isContrib = field.key === 'monthly';
  const { head, suffix } = entryParts(field, entry);

  // ---- enter / drag-to-dismiss -------------------------------------------
  const translate = useRef(new Animated.Value(OFFSCREEN)).current;
  const dragging = useRef(false);
  const closing = useRef(false);

  useEffect(() => {
    const anim = Animated.timing(translate, {
      toValue: 0,
      duration: 460,
      easing: SPRINGY,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [translate]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 2,
      onPanResponderGrant: () => {
        dragging.current = true;
        translate.stopAnimation();
      },
      onPanResponderMove: (_e, g) => {
        translate.setValue(Math.max(0, g.dy));
      },
      onPanResponderRelease: (_e, g) => {
        dragging.current = false;
        if (g.dy > DISMISS_AT) {
          if (closing.current) return;
          closing.current = true;
          Animated.timing(translate, {
            toValue: OFFSCREEN,
            duration: 200,
            easing: Easing.bezier(0.4, 0, 0.7, 1),
            useNativeDriver: true,
          }).start(() => onClose());
        } else {
          Animated.timing(translate, {
            toValue: 0,
            duration: 340,
            easing: Easing.bezier(0.22, 1, 0.3, 1),
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        dragging.current = false;
        Animated.timing(translate, { toValue: 0, duration: 240, useNativeDriver: true }).start();
      },
    }),
  ).current;

  // ---- blinking caret ------------------------------------------------------
  const caret = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(caret, { toValue: 0, duration: 0, delay: 525, useNativeDriver: true }),
        Animated.timing(caret, { toValue: 1, duration: 0, delay: 525, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [caret]);

  // ---- value bump ----------------------------------------------------------
  const bumpAnim = useRef(new Animated.Value(0)).current;
  const [entryBox, setEntryBox] = useState({ width: 0, height: 0 });
  const firstBump = useRef(true);

  useEffect(() => {
    if (firstBump.current) {
      firstBump.current = false;
      return;
    }
    bumpAnim.setValue(0);
    const anim = Animated.sequence([
      Animated.timing(bumpAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(bumpAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [bump, bumpAnim]);

  const onEntryLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (w !== entryBox.width || h !== entryBox.height) setEntryBox({ width: w, height: h });
  };

  // Scale from the bottom-left corner (`transform-origin: left bottom`) by
  // compensating for the centre-origin scaling React Native applies.
  const scale = bumpAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const bumpTransform = [
    { translateX: bumpAnim.interpolate({ inputRange: [0, 1], outputRange: [0, (entryBox.width * 0.06) / 2] }) },
    { translateY: bumpAnim.interpolate({ inputRange: [0, 1], outputRange: [0, (-entryBox.height * 0.06) / 2] }) },
    { scale },
  ];

  const caption = isContrib ? `${FREQ_ADJ[freq] ?? 'Monthly'} contribution` : field.label;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close keypad" />

        <Animated.View
          style={[
            s.pad,
            { paddingBottom: Math.max(24, insets.bottom + 6), transform: [{ translateY: translate }] },
          ]}
        >
          {/* Grab handle — drag down to dismiss. */}
          <View {...pan.panHandlers} style={s.grabArea}>
            <View style={s.grabber} />
          </View>

          {/* Caption + live entry + (contribution) frequency rail. */}
          <View style={s.headerRow}>
            <View style={{ flexShrink: 1, minWidth: 0 }}>
              <Text style={s.caption} numberOfLines={1}>
                {caption}
              </Text>
              <Animated.View style={[s.entryRow, { transform: bumpTransform }]} onLayout={onEntryLayout}>
                <Text style={s.entryHead} numberOfLines={1}>
                  {head}
                </Text>
                <Animated.View style={[s.caret, { opacity: caret }]} />
                {suffix ? <Text style={s.entrySuffix}>{suffix}</Text> : null}
              </Animated.View>
            </View>

            {isContrib ? (
              <Pop style={s.freqRail} duration={320}>
                {FREQ_SEGMENTS.map((seg) => {
                  const on = seg.value === freq;
                  return (
                    <Pressable
                      key={seg.value}
                      onPress={() => {
                        haptic();
                        onPickFreq(seg.value);
                      }}
                      accessibilityRole="button"
                      accessibilityState={on ? { selected: true } : {}}
                      accessibilityLabel={seg.value}
                      style={({ pressed }) => [
                        s.freqSeg,
                        { backgroundColor: on ? theme.accentSoft : 'transparent' },
                        pressed && { transform: [{ scale: 0.92 }] },
                      ]}
                    >
                      <Text style={[s.freqSegText, { color: on ? theme.accent : theme.ter }]}>{seg.label}</Text>
                    </Pressable>
                  );
                })}
              </Pop>
            ) : (
              <Text style={s.step}>{`${index + 1} of ${FIELDS.length}`}</Text>
            )}
          </View>

          {/* Mini tiles — jump straight to another assumption. */}
          <View style={s.miniRow}>
            {FIELDS.map((f, i) => {
              const on = f.key === field.key;
              return (
                <Pop key={f.key} delay={i * 55} duration={420} style={{ flex: 1, minWidth: 0 }}>
                <Pressable
                  onPress={() => {
                    haptic();
                    onSelect(f.key);
                  }}
                  accessibilityRole="button"
                  accessibilityState={on ? { selected: true } : {}}
                  accessibilityLabel={`${tileShort(f)}, ${formatFieldValue(f, values[f.key])}`}
                  style={({ pressed }) => [
                    s.mini,
                    {
                      backgroundColor: on ? theme.accentSoft : theme.railBg,
                      borderColor: on ? theme.accentBorder : theme.railBorder,
                    },
                    pressed && { transform: [{ scale: 0.95 }] },
                  ]}
                >
                  <Text style={[s.miniLabel, { color: on ? theme.accent : theme.ter }]} numberOfLines={1}>
                    {tileShort(f)}
                  </Text>
                  <Text style={[s.miniValue, { color: on ? theme.accent : theme.text }]} numberOfLines={1}>
                    {formatFieldValue(f, values[f.key])}
                  </Text>
                </Pressable>
                </Pop>
              );
            })}
          </View>

          {/* Keys. */}
          <View style={{ gap: GAP }}>
            <View style={s.keyRow}>
              <Key onPress={onDelete} background={theme.keyUtil} style={{ width: col }} label="Delete">
                <Icon name="backspace" size={25} color={theme.keyUtilFg} />
              </Key>
              <Key onPress={onClear} background={theme.keyUtil} style={{ width: wide }} label="Clear">
                <Text style={[s.utilText, { color: theme.keyUtilFg }]}>AC</Text>
              </Key>
              <NavKey
                theme={theme}
                disabled={atFirst}
                icon="chevronUp"
                caption="Prev"
                width={col}
                onPress={() => onMove(-1)}
              />
            </View>

            <View style={s.keyRow}>
              <Digit theme={theme} char="7" width={col} onPress={onPress} />
              <Digit theme={theme} char="8" width={col} onPress={onPress} />
              <Digit theme={theme} char="9" width={col} onPress={onPress} />
              <NavKey
                theme={theme}
                disabled={atLast}
                icon="chevronDown"
                caption="Next"
                width={col}
                onPress={() => onMove(1)}
              />
            </View>

            <View style={s.keyRow}>
              <Digit theme={theme} char="4" width={col} onPress={onPress} />
              <Digit theme={theme} char="5" width={col} onPress={onPress} />
              <Digit theme={theme} char="6" width={col} onPress={onPress} />
              <Key onPress={() => onPress('000')} background={theme.keyGreen} style={{ width: col }} label="Triple zero">
                <Text style={s.zerosText}>000</Text>
              </Key>
            </View>

            <View style={s.keyRow}>
              <View style={{ gap: GAP }}>
                <View style={s.keyRow}>
                  <Digit theme={theme} char="1" width={col} onPress={onPress} />
                  <Digit theme={theme} char="2" width={col} onPress={onPress} />
                  <Digit theme={theme} char="3" width={col} onPress={onPress} />
                </View>
                <View style={s.keyRow}>
                  <Digit theme={theme} char="0" width={wide} onPress={onPress} scale={0.96} />
                  <Key
                    onPress={() => onPress('.')}
                    background={theme.keyBg}
                    style={{ width: col, justifyContent: 'flex-end', paddingBottom: 12 }}
                    label="Decimal point"
                  >
                    <Text style={[s.dotText, { color: theme.keyFg }]}>.</Text>
                  </Key>
                </View>
              </View>
              <Key
                onPress={onClose}
                background={theme.keyGreen}
                scale={0.96}
                style={{ width: col, height: KEY_H * 2 + GAP, gap: 4, boxShadow: '0 8px 22px rgba(15,169,104,0.3)' }}
                label="Done"
              >
                <Icon name="check" size={22} color="#fff" strokeWidth={2.8} />
                <Text style={s.doneText}>Done</Text>
              </Key>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function Digit({
  theme,
  char,
  width,
  onPress,
  scale,
}: {
  theme: Theme;
  char: string;
  width: number;
  onPress: (char: string) => void;
  scale?: number;
}) {
  return (
    <Key onPress={() => onPress(char)} background={theme.keyBg} style={{ width }} label={char} scale={scale}>
      <Text style={{ fontFamily: Font.displayMed, fontSize: 26, color: theme.keyFg }}>{char}</Text>
    </Key>
  );
}

function NavKey({
  theme,
  disabled,
  icon,
  caption,
  width,
  onPress,
}: {
  theme: Theme;
  disabled: boolean;
  icon: 'chevronUp' | 'chevronDown';
  caption: string;
  width: number;
  onPress: () => void;
}) {
  const fg = disabled ? theme.keyDim : '#fff';
  return (
    <Key
      onPress={onPress}
      background={disabled ? theme.keyUtil : theme.keyGreen}
      style={{ width, gap: 1 }}
      label={caption}
    >
      <Icon name={icon} size={17} color={fg} strokeWidth={2.6} />
      <Text
        style={{
          fontFamily: Font.bodyBlack,
          fontSize: 8.5,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: fg,
        }}
      >
        {caption}
      </Text>
    </Key>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
});

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    pad: {
      backgroundColor: theme.keypadBg,
      borderTopWidth: 1,
      borderTopColor: theme.keypadBorder,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      paddingTop: 4,
      paddingHorizontal: PAD_X,
      boxShadow: theme.keypadShadow,
    },
    grabArea: { paddingTop: 8, paddingBottom: 11, marginHorizontal: -PAD_X, alignItems: 'center' },
    grabber: { width: 42, height: 5, borderRadius: 3, backgroundColor: theme.grabber },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 10,
      paddingHorizontal: 6,
      marginBottom: 12,
    },
    caption: {
      fontFamily: Font.bodyBlack,
      fontSize: 10.5,
      letterSpacing: 1.3,
      textTransform: 'uppercase',
      color: theme.accent,
    },
    entryRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 3 },
    entryHead: {
      fontFamily: Font.displayBold,
      fontSize: 34,
      letterSpacing: -1,
      lineHeight: 36,
      color: theme.text,
    },
    caret: {
      width: 3,
      height: 25,
      borderRadius: 2,
      backgroundColor: theme.accent,
      marginLeft: 3,
      marginRight: 2,
      marginBottom: 2,
    },
    entrySuffix: { fontFamily: Font.display, fontSize: 19, color: theme.sub },
    step: { fontFamily: Font.bodyBold, fontSize: 11, color: theme.sub, paddingBottom: 6, flexShrink: 0 },
    freqRail: {
      flexDirection: 'row',
      gap: 2,
      backgroundColor: theme.railBg,
      borderWidth: 1,
      borderColor: theme.railBorder,
      padding: 3,
      borderRadius: 12,
      flexShrink: 0,
    },
    freqSeg: { paddingVertical: 5, paddingHorizontal: 8, borderRadius: 9 },
    freqSegText: { fontFamily: Font.bodyBlack, fontSize: 10.5, letterSpacing: 0.4 },
    miniRow: { flexDirection: 'row', gap: 7, marginBottom: 14 },
    mini: {
      // No `flex: 1` here — the Pop wrapper owns the row distribution. Inside
      // that column-direction wrapper `flex: 1` would zero the tile's height
      // basis and clip the label and value.
      alignItems: 'center',
      paddingTop: 7,
      paddingBottom: 8,
      paddingHorizontal: 4,
      borderRadius: 13,
      borderWidth: 1,
    },
    miniLabel: { fontFamily: Font.bodyBlack, fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase' },
    miniValue: { fontFamily: Font.display, fontSize: 13, marginTop: 2 },
    keyRow: { flexDirection: 'row', gap: GAP },
    utilText: { fontFamily: Font.display, fontSize: 21, letterSpacing: 1.5 },
    zerosText: { fontFamily: Font.display, fontSize: 20, letterSpacing: 0.5, color: '#fff' },
    dotText: { fontFamily: Font.display, fontSize: 28, lineHeight: 30 },
    doneText: { fontFamily: Font.bodyBlack, fontSize: 11, letterSpacing: 0.4, color: '#fff' },
  });
