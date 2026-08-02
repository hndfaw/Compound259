import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import ViewShot from 'react-native-view-shot';

import { GlassCard } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { Icon, IconName } from '@/components/ui/icon';
import { FadeUp } from '@/components/ui/motion';
import { Screen } from '@/components/ui/screen';
import { Sheet } from '@/components/ui/sheet';
import { Font, Theme } from '@/constants/tokens';
import { SavedCalculation, useCalculations } from '@/hooks/use-calculations';
import { useTheme } from '@/hooks/use-theme';
import { money } from '@/utils/finance';

const APP_STORE_URL = 'https://apps.apple.com/us/app/compound259/id6757372216';

/** Return on invested capital, guarded against a zero-investment record. */
const returnPct = (c: SavedCalculation) => {
  const invested = c.initialDeposit + c.contributions;
  if (!Number.isFinite(invested) || invested <= 0) return 0;
  const pct = Math.round((c.interestEarned / invested) * 100);
  return Number.isFinite(pct) ? pct : 0;
};

const haptic = () => {
  if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

export default function SavedScreen() {
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  const { calculations, isLoading, updateCalculation, deleteCalculation, refreshCalculations } = useCalculations();

  const [editing, setEditing] = useState<SavedCalculation | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleting, setDeleting] = useState<SavedCalculation | null>(null);
  const [sharing, setSharing] = useState<SavedCalculation | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  useFocusEffect(
    useCallback(() => {
      refreshCalculations();
    }, [refreshCalculations]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshCalculations();
    setRefreshing(false);
  };

  const startEdit = (c: SavedCalculation) => {
    setEditing(c);
    setEditTitle(c.title);
  };

  const saveEdit = async () => {
    const title = editTitle.trim();
    if (!editing || !title || busy) return;
    setBusy(true);
    try {
      await updateCalculation(editing.id, { title });
      haptic();
      setEditing(null);
      setEditTitle('');
      Toast.show({ type: 'success', text1: 'Updated', position: 'top', visibilityTime: 2000 });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update', position: 'top', visibilityTime: 2500 });
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting || busy) return;
    setBusy(true);
    try {
      await deleteCalculation(deleting.id);
      haptic();
      setDeleting(null);
      Toast.show({ type: 'success', text1: 'Deleted', position: 'top', visibilityTime: 2000 });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to delete', position: 'top', visibilityTime: 2500 });
    } finally {
      setBusy(false);
    }
  };

  const captureAndShare = async () => {
    if (!viewShotRef.current || !sharing || busy) return;
    setBusy(true);
    try {
      if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const uri = await viewShotRef.current.capture?.();
      if (!uri) throw new Error('capture failed');
      if (!(await Sharing.isAvailableAsync())) {
        await Share.share({ message: `${sharing.title} — ${money(sharing.finalBalance)}\n\n${APP_STORE_URL}` });
      } else {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your investment growth' });
      }
      setSharing(null);
    } catch {
      setSharing(null);
      Toast.show({ type: 'error', text1: 'Failed to share', position: 'top', visibilityTime: 2500 });
    } finally {
      setBusy(false);
    }
  };

  const shareApp = async () => {
    try {
      if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `Check out Compound259 - a beautiful compound interest calculator to visualize your investment growth!\n\n${APP_STORE_URL}`,
      });
    } catch {
      /* cancelled */
    }
  };

  const count = calculations.length;
  const subtitle = isLoading
    ? 'Loading…'
    : count === 0
      ? 'No saved calculations yet'
      : `${count} saved calculation${count !== 1 ? 's' : ''}`;

  return (
    <Screen title="Saved Records" subtitle={subtitle} refreshing={refreshing} onRefresh={onRefresh}>
      {count === 0 && !isLoading ? (
        <View style={s.empty}>
          <View style={s.emptyIcon}>
            <Icon name="bookmark" size={38} color={theme.ter} strokeWidth={1.8} />
          </View>
          <Text style={s.emptyTitle}>No saved calculations</Text>
          <Text style={s.emptySubtitle}>Your saved calculations will appear here. Go to the Calculator to create one.</Text>
        </View>
      ) : (
        <>
          {calculations.map((c) => (
            <FadeUp key={c.id} duration={550}>
              <GlassCard style={s.card} radius={20}>
                <View style={s.cardHeader}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={s.cardTitle} numberOfLines={2}>
                      {c.title}
                    </Text>
                    <Text style={s.cardDate}>Saved on {c.date}</Text>
                  </View>
                  <View style={s.retBadge}>
                    <Text style={s.retText}>+{returnPct(c)}%</Text>
                  </View>
                </View>

                <View style={s.balancePanel}>
                  <Text style={s.balanceLabel}>Final balance</Text>
                  <Text style={s.balanceValue}>{money(c.finalBalance)}</Text>
                </View>

                <View style={s.detailsGrid}>
                  <View style={s.detailCol}>
                    <Detail theme={theme} label="Initial deposit" value={money(c.initialDeposit)} />
                    <Detail
                      theme={theme}
                      label="Contributions"
                      value={`${money(c.contributionAmount)} ${c.frequency.toLowerCase()}`}
                    />
                    <Detail theme={theme} label="Rate of return" value={`${c.rateOfReturn}% per year`} />
                  </View>
                  <View style={s.detailCol}>
                    <Detail theme={theme} label="Interest earned" value={money(c.interestEarned)} highlight />
                    <Detail
                      theme={theme}
                      label="Time period"
                      value={`${c.timePeriod} year${c.timePeriod !== 1 ? 's' : ''}`}
                    />
                    <Detail theme={theme} label="Frequency" value={c.frequency} />
                  </View>
                </View>

                <View style={s.actions}>
                  <ActionButton theme={theme} icon="share" label="Share" onPress={() => setSharing(c)} />
                  <ActionButton theme={theme} icon="edit" label="Edit" onPress={() => startEdit(c)} />
                  <ActionButton theme={theme} icon="trash" label="Delete" danger onPress={() => setDeleting(c)} />
                </View>
              </GlassCard>
            </FadeUp>
          ))}

          <TouchableOpacity activeOpacity={0.85} onPress={shareApp} accessibilityRole="button">
            <GlassCard style={s.shareAppCard} radius={14}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon name="heart" size={18} color={theme.accent} strokeWidth={1.9} />
                <Text style={s.shareAppText}>Enjoying the app? Share with friends</Text>
              </View>
              <Icon name="chevronRight" size={16} color={theme.ter} strokeWidth={2} />
            </GlassCard>
          </TouchableOpacity>
        </>
      )}

      {/* Edit sheet */}
      <Sheet visible={!!editing} onClose={() => setEditing(null)}>
        <Text style={s.sheetEyebrow}>Rename</Text>
        <Text style={s.sheetTitle}>Edit calculation</Text>
        <TextInput
          value={editTitle}
          onChangeText={setEditTitle}
          placeholder="Enter a new title"
          placeholderTextColor={theme.ter}
          selectionColor={theme.accent}
          autoFocus
          maxLength={50}
          returnKeyType="done"
          onSubmitEditing={saveEdit}
          style={[s.textInput, { backgroundColor: theme.mutedBg, borderColor: theme.mutedBorder, color: theme.text }]}
        />
        <View style={[s.sheetActions, { marginTop: 18 }]}>
          <Pressable
            onPress={() => setEditing(null)}
            accessibilityRole="button"
            style={({ pressed }) => [s.mutedBtn, { flex: 1 }, pressed && { transform: [{ scale: 0.97 }] }]}
          >
            <Text style={s.mutedBtnText}>Cancel</Text>
          </Pressable>
          <GradientButton
            onPress={saveEdit}
            disabled={busy || !editTitle.trim()}
            style={{ flex: 1.5, opacity: editTitle.trim() ? 1 : 0.5 }}
            radius={14}
            contentStyle={{ paddingVertical: 15 }}
            shadow
          >
            <Text style={[s.confirmText, { color: theme.btnFg }]}>Save changes</Text>
          </GradientButton>
        </View>
      </Sheet>

      {/* Delete sheet */}
      <Sheet visible={!!deleting} onClose={() => setDeleting(null)}>
        <Text style={[s.sheetEyebrow, { color: theme.danger }]}>Delete</Text>
        <Text style={s.sheetTitle}>Remove this calculation?</Text>
        <View style={s.deleteRow}>
          <View style={s.deleteIcon}>
            <Icon name="trash" size={17} color={theme.danger} strokeWidth={2} />
          </View>
          <View style={{ flexShrink: 1, minWidth: 0 }}>
            <Text style={s.deleteName} numberOfLines={1}>
              {deleting?.title}
            </Text>
            <Text style={s.deleteNote}>This cannot be undone</Text>
          </View>
        </View>
        <View style={[s.sheetActions, { marginTop: 14 }]}>
          <Pressable
            onPress={() => setDeleting(null)}
            accessibilityRole="button"
            style={({ pressed }) => [s.mutedBtn, { flex: 1.5 }, pressed && { transform: [{ scale: 0.97 }] }]}
          >
            <Text style={s.mutedBtnText}>Keep it</Text>
          </Pressable>
          <Pressable
            onPress={confirmDelete}
            disabled={busy}
            accessibilityRole="button"
            style={({ pressed }) => [s.deleteBtn, pressed && { transform: [{ scale: 0.97 }] }]}
          >
            <Text style={s.deleteBtnText}>Delete</Text>
          </Pressable>
        </View>
      </Sheet>

      {/* Share card */}
      <ShareOverlay calc={sharing} viewShotRef={viewShotRef} onShare={captureAndShare} onClose={() => setSharing(null)} />
    </Screen>
  );
}

function Detail({ theme, label, value, highlight }: { theme: Theme; label: string; value: string; highlight?: boolean }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ fontFamily: Font.bodySemi, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4, color: theme.ter }}>
        {label}
      </Text>
      <Text style={{ fontFamily: Font.bodySemi, fontSize: 13, color: highlight ? theme.accent : theme.text }}>{value}</Text>
    </View>
  );
}

function ActionButton({
  theme,
  icon,
  label,
  danger,
  onPress,
}: {
  theme: Theme;
  icon: IconName;
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  const color = danger ? theme.danger : theme.mutedCol;
  return (
    <TouchableOpacity
      onPress={() => {
        if (Platform.OS === 'ios') Haptics.selectionAsync();
        onPress();
      }}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 9,
        borderRadius: 11,
        backgroundColor: danger ? theme.dangerBg : theme.mutedBg,
        borderWidth: 1,
        borderColor: danger ? theme.dangerBorder : theme.mutedBorder,
      }}
    >
      <Icon name={icon} size={15} color={color} strokeWidth={1.9} />
      <Text style={{ fontFamily: Font.bodySemi, fontSize: 12.5, color }}>{label}</Text>
    </TouchableOpacity>
  );
}

/** The shareable summary card, captured to a PNG by ViewShot. */
function ShareOverlay({
  calc,
  viewShotRef,
  onShare,
  onClose,
}: {
  calc: SavedCalculation | null;
  viewShotRef: React.RefObject<ViewShot | null>;
  onShare: () => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const s = useMemo(() => makeShareStyles(theme), [theme]);

  return (
    <Modal visible={!!calc} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[s.overlay, { backgroundColor: theme.overlay }]}>
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 1, result: 'tmpfile' }}
          style={{ width: '100%', maxWidth: 330 }}
        >
          {calc ? (
            <View style={s.card}>
              <View style={s.header}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={s.title} numberOfLines={2}>
                    {calc.title}
                  </Text>
                  <Text style={s.date}>Saved on {calc.date}</Text>
                </View>
                <View style={s.retBadge}>
                  <Text style={s.retText}>+{returnPct(calc)}%</Text>
                </View>
              </View>

              <View style={s.balancePanel}>
                <Text style={s.balanceLabel}>Final balance</Text>
                <Text style={s.balanceValue}>{money(calc.finalBalance)}</Text>
              </View>

              <View style={s.grid}>
                <ShareStat theme={theme} label="Initial" value={money(calc.initialDeposit)} />
                <ShareStat theme={theme} label="Contribution" value={money(calc.contributionAmount)} />
                <ShareStat theme={theme} label="Years" value={`${calc.timePeriod}`} />
                <ShareStat theme={theme} label="Rate" value={`${calc.rateOfReturn}%`} />
                <ShareStat theme={theme} label="Frequency" value={calc.frequency} />
                <ShareStat theme={theme} label="Interest" value={money(calc.interestEarned)} highlight />
              </View>

              <View style={s.footer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={s.logo}>
                    <Icon name="brand" size={14} color={theme.accent} />
                  </View>
                  <Text style={s.brand}>Compound259</Text>
                </View>
                <View style={s.appStore}>
                  <Icon name="apple" size={13} color={theme.mutedCol} />
                  <Text style={s.appStoreText}>App Store</Text>
                </View>
              </View>
            </View>
          ) : null}
        </ViewShot>

        <GradientButton
          onPress={onShare}
          radius={14}
          style={{ width: '100%', maxWidth: 330, marginTop: 14 }}
          contentStyle={{ paddingVertical: 15 }}
        >
          <Text style={{ fontFamily: Font.bodyBold, fontSize: 15, color: theme.btnFg }}>Share image</Text>
        </GradientButton>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7} accessibilityRole="button" style={{ marginTop: 12 }}>
          <Text style={{ fontFamily: Font.bodyBold, fontSize: 14, color: theme.text, opacity: 0.8 }}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function ShareStat({
  theme,
  label,
  value,
  highlight,
}: {
  theme: Theme;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={{ width: '33.33%', alignItems: 'center', paddingVertical: 7 }}>
      <Text
        style={{
          fontFamily: Font.bodyBold,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: theme.ter,
        }}
      >
        {label}
      </Text>
      <Text
        style={{ fontFamily: Font.bodyBold, fontSize: 14, color: highlight ? theme.accent : theme.text, marginTop: 3 }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    empty: { alignItems: 'center', paddingHorizontal: 30, paddingVertical: 70 },
    emptyIcon: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
    },
    emptyTitle: { fontFamily: Font.bodyBold, fontSize: 17, color: theme.text, marginBottom: 8 },
    emptySubtitle: { fontFamily: Font.body, fontSize: 14, color: theme.sub, textAlign: 'center', lineHeight: 21 },
    card: { padding: 16, marginBottom: 13 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardTitle: { fontFamily: Font.bodyBold, fontSize: 15, color: theme.text },
    cardDate: { fontFamily: Font.body, fontSize: 12, color: theme.ter, marginTop: 3 },
    retBadge: {
      backgroundColor: theme.accentSoft,
      borderWidth: 1,
      borderColor: theme.accentBorder,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    retText: { fontFamily: Font.displayBold, fontSize: 12, color: theme.accent },
    balancePanel: {
      backgroundColor: theme.accentSoft,
      borderWidth: 1,
      borderColor: theme.accentBorder,
      borderRadius: 14,
      paddingVertical: 13,
      paddingHorizontal: 15,
      marginVertical: 14,
    },
    balanceLabel: {
      fontFamily: Font.bodyBold,
      fontSize: 10,
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: theme.sub,
    },
    balanceValue: { fontFamily: Font.displayBold, fontSize: 25, color: theme.accent, marginTop: 2 },
    detailsGrid: { flexDirection: 'row', gap: 16, marginBottom: 15 },
    detailCol: { flex: 1, gap: 11 },
    actions: { flexDirection: 'row', gap: 8 },
    shareAppCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginTop: 7,
    },
    shareAppText: { fontFamily: Font.bodySemi, fontSize: 13, color: theme.sub },
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
    textInput: {
      borderWidth: 1,
      borderRadius: 14,
      paddingVertical: 15,
      paddingHorizontal: 16,
      fontFamily: Font.bodySemi,
      fontSize: 16,
    },
    sheetActions: { flexDirection: 'row', gap: 10 },
    mutedBtn: {
      borderRadius: 14,
      borderWidth: 1,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.mutedBg,
      borderColor: theme.mutedBorder,
    },
    mutedBtnText: { fontFamily: Font.bodyBold, fontSize: 15, color: theme.mutedCol },
    confirmText: { fontFamily: Font.bodyBold, fontSize: 15 },
    // The record being removed, shown so it is obvious which one is going.
    deleteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.mutedBg,
      borderWidth: 1,
      borderColor: theme.mutedBorder,
      borderRadius: 14,
      paddingVertical: 13,
      paddingHorizontal: 15,
      marginBottom: 8,
    },
    deleteIcon: {
      width: 34,
      height: 34,
      borderRadius: 11,
      flexShrink: 0,
      backgroundColor: theme.dangerBg,
      borderWidth: 1,
      borderColor: theme.dangerBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteName: { fontFamily: Font.bodyBold, fontSize: 15, color: theme.text },
    deleteNote: { fontFamily: Font.bodySemi, fontSize: 12, color: theme.sub, marginTop: 1 },
    // Tinted rather than a solid fill, so the destructive action reads as
    // secondary to keeping the record.
    deleteBtn: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.dangerBg,
      borderWidth: 1,
      borderColor: theme.dangerBorder,
    },
    deleteBtnText: { fontFamily: Font.bodyBold, fontSize: 15, color: theme.danger },
  });

const makeShareStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    card: {
      backgroundColor: theme.sheet,
      borderWidth: 1,
      borderColor: theme.sheetBorder,
      borderRadius: 22,
      padding: 18,
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    title: { fontFamily: Font.bodyBold, fontSize: 16, color: theme.text },
    date: { fontFamily: Font.body, fontSize: 12, color: theme.sub, marginTop: 2 },
    retBadge: {
      backgroundColor: theme.accentSoft,
      borderWidth: 1,
      borderColor: theme.accentBorder,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    retText: { fontFamily: Font.displayBold, fontSize: 12, color: theme.accent },
    balancePanel: {
      backgroundColor: theme.accentSoft,
      borderWidth: 1,
      borderColor: theme.accentBorder,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginVertical: 14,
    },
    balanceLabel: {
      fontFamily: Font.bodyBold,
      fontSize: 10,
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: theme.sub,
    },
    balanceValue: { fontFamily: Font.displayBold, fontSize: 27, color: theme.accent, marginTop: 2 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: theme.cardBorder,
    },
    logo: {
      width: 24,
      height: 24,
      borderRadius: 7,
      backgroundColor: theme.accentSoft,
      borderWidth: 1,
      borderColor: theme.accentBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brand: { fontFamily: Font.bodyBold, fontSize: 13, color: theme.text, letterSpacing: 0.3 },
    appStore: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: theme.mutedBg,
      borderWidth: 1,
      borderColor: theme.mutedBorder,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 8,
    },
    appStoreText: { fontFamily: Font.bodyBold, fontSize: 11, color: theme.mutedCol },
  });
