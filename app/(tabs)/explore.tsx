import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useRef, useState } from 'react';
import { Modal, Platform, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import ViewShot from 'react-native-view-shot';

import { GlassCard } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { Icon, IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Dialog, Sheet } from '@/components/ui/sheet';
import { Font, Theme } from '@/constants/tokens';
import { SavedCalculation, useCalculations } from '@/hooks/use-calculations';
import { useTheme } from '@/hooks/use-theme';
import { money } from '@/utils/finance';

const compute = (c: SavedCalculation) => {
  const invested = Math.max(c.initialDeposit + c.contributions, 1);
  const ret = Math.round((c.interestEarned / invested) * 100);
  return { ret };
};

const haptic = () => {
  if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

export default function SavedScreen() {
  const { theme } = useTheme();
  const s = React.useMemo(() => makeStyles(theme), [theme]);
  const { calculations, isLoading, updateCalculation, deleteCalculation, refreshCalculations } = useCalculations();

  const [editing, setEditing] = useState<SavedCalculation | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleting, setDeleting] = useState<SavedCalculation | null>(null);
  const [sharing, setSharing] = useState<SavedCalculation | null>(null);
  const [refreshing, setRefreshing] = useState(false);
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
    if (!editing || !editTitle.trim()) return;
    try {
      await updateCalculation(editing.id, { title: editTitle.trim() });
      haptic();
      setEditing(null);
      setEditTitle('');
      Toast.show({ type: 'success', text1: 'Updated', position: 'top', visibilityTime: 2000 });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update', position: 'top', visibilityTime: 2500 });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteCalculation(deleting.id);
      haptic();
      setDeleting(null);
      Toast.show({ type: 'success', text1: 'Deleted', position: 'top', visibilityTime: 2000 });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to delete', position: 'top', visibilityTime: 2500 });
    }
  };

  const captureAndShare = async () => {
    if (!viewShotRef.current || !sharing) return;
    try {
      if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const uri = await viewShotRef.current.capture?.();
      if (!uri) throw new Error('capture failed');
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your investment growth' });
      setSharing(null);
    } catch {
      setSharing(null);
      Toast.show({ type: 'error', text1: 'Failed to share', position: 'top', visibilityTime: 2500 });
    }
  };

  const shareApp = async () => {
    try {
      if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message:
          'Check out Compound259 - a beautiful compound interest calculator to visualize your investment growth!\n\nhttps://apps.apple.com/us/app/compound259/id6757372216',
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
          {calculations.map((c) => {
            const { ret } = compute(c);
            return (
              <GlassCard key={c.id} style={s.card} radius={20}>
                <View style={s.cardHeader}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={s.cardTitle} numberOfLines={2}>{c.title}</Text>
                    <Text style={s.cardDate}>Saved on {c.date}</Text>
                  </View>
                  <View style={s.retBadge}>
                    <Text style={s.retText}>+{ret}%</Text>
                  </View>
                </View>

                <GradientButton style={s.balancePanel} radius={14} contentStyle={s.balancePanelInner}>
                  <View style={{ width: '100%' }}>
                    <Text style={[s.balanceLabel, { color: theme.btnFg }]}>FINAL BALANCE</Text>
                    <Text style={[s.balanceValue, { color: theme.btnFg }]}>{money(c.finalBalance)}</Text>
                  </View>
                </GradientButton>

                <View style={s.detailsGrid}>
                  <View style={s.detailCol}>
                    <Detail theme={theme} label="Initial deposit" value={money(c.initialDeposit)} />
                    <Detail theme={theme} label="Contributions" value={`${money(c.contributionAmount)} ${c.frequency.toLowerCase()}`} />
                    <Detail theme={theme} label="Rate of return" value={`${c.rateOfReturn}% per year`} />
                  </View>
                  <View style={s.detailCol}>
                    <Detail theme={theme} label="Interest earned" value={money(c.interestEarned)} highlight />
                    <Detail theme={theme} label="Time period" value={`${c.timePeriod} year${c.timePeriod !== 1 ? 's' : ''}`} />
                    <Detail theme={theme} label="Frequency" value={c.frequency} />
                  </View>
                </View>

                <View style={s.actions}>
                  <ActionButton theme={theme} icon="share" label="Share" onPress={() => setSharing(c)} />
                  <ActionButton theme={theme} icon="edit" label="Edit" onPress={() => startEdit(c)} />
                  <ActionButton theme={theme} icon="trash" label="Delete" danger onPress={() => setDeleting(c)} />
                </View>
              </GlassCard>
            );
          })}

          <TouchableOpacity activeOpacity={0.85} onPress={shareApp}>
            <GlassCard style={s.shareAppCard} radius={14}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon name="heart" size={18} color="#F472B6" strokeWidth={1.9} />
                <Text style={s.shareAppText}>Enjoying the app? Share with friends</Text>
              </View>
              <Icon name="chevronRight" size={16} color={theme.ter} strokeWidth={2} />
            </GlassCard>
          </TouchableOpacity>
        </>
      )}

      {/* Edit sheet */}
      <Sheet visible={!!editing} onClose={() => setEditing(null)}>
        <Text style={s.sheetTitle}>Edit calculation</Text>
        <Text style={s.sheetSubtitle}>Update the name of your saved calculation</Text>
        <TextInput
          value={editTitle}
          onChangeText={setEditTitle}
          placeholder="Enter a new title"
          placeholderTextColor={theme.ter}
          selectionColor={theme.accent}
          autoFocus
          maxLength={50}
          style={[s.textInput, { backgroundColor: theme.mutedBg, borderColor: theme.mutedBorder, color: theme.text }]}
        />
        <View style={[s.sheetActions, { marginTop: 18 }]}>
          <TouchableOpacity onPress={() => setEditing(null)} activeOpacity={0.85} style={[s.cancelBtn, { backgroundColor: theme.mutedBg, borderColor: theme.mutedBorder }]}>
            <Text style={[s.cancelText, { color: theme.mutedCol }]}>Cancel</Text>
          </TouchableOpacity>
          <GradientButton onPress={saveEdit} style={{ flex: 1.5 }} radius={12} contentStyle={{ paddingVertical: 14 }}>
            <Text style={[s.confirmText, { color: theme.btnFg }]}>Save changes</Text>
          </GradientButton>
        </View>
      </Sheet>

      {/* Delete dialog */}
      <Dialog visible={!!deleting} onClose={() => setDeleting(null)}>
        <View style={{ alignItems: 'center' }}>
          <View style={[s.deleteIcon, { backgroundColor: theme.dangerBg }]}>
            <Icon name="trash" size={28} color={theme.danger} strokeWidth={2} />
          </View>
          <Text style={s.deleteTitle}>Delete calculation?</Text>
          <Text style={s.deleteMsg}>Delete “{deleting?.title}”? This action cannot be undone.</Text>
          <View style={[s.sheetActions, { width: '100%' }]}>
            <TouchableOpacity onPress={() => setDeleting(null)} activeOpacity={0.85} style={[s.cancelBtn, { backgroundColor: theme.mutedBg, borderColor: theme.mutedBorder }]}>
              <Text style={[s.cancelText, { color: theme.mutedCol }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmDelete} activeOpacity={0.85} style={[s.deleteConfirm, { backgroundColor: theme.danger }]}>
              <Text style={s.deleteConfirmText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Dialog>

      {/* Share overlay */}
      <ShareOverlay
        calc={sharing}
        viewShotRef={viewShotRef}
        onShare={captureAndShare}
        onClose={() => setSharing(null)}
      />
    </Screen>
  );
}

function Detail({ theme, label, value, highlight }: { theme: Theme; label: string; value: string; highlight?: boolean }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ fontFamily: Font.bodySemi, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4, color: theme.ter }}>{label}</Text>
      <Text style={{ fontFamily: Font.bodySemi, fontSize: 13, color: highlight ? theme.accent : theme.text }}>{value}</Text>
    </View>
  );
}

function ActionButton({ theme, icon, label, danger, onPress }: { theme: Theme; icon: IconName; label: string; danger?: boolean; onPress: () => void }) {
  const color = danger ? theme.danger : theme.mutedCol;
  return (
    <TouchableOpacity
      onPress={onPress}
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

/** Theme-independent share card (brand image) rendered into a capturable view. */
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
  const ret = calc ? compute(calc).ret : 0;
  return (
    <Modal visible={!!calc} transparent animationType="fade" onRequestClose={onClose}>
      <View style={sh.overlay}>
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1, result: 'tmpfile' }} style={{ width: '100%', maxWidth: 330 }}>
          {calc && (
            <View style={sh.card}>
              <View style={sh.header}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={sh.title}>{calc.title}</Text>
                  <Text style={sh.date}>Saved on {calc.date}</Text>
                </View>
                <View style={sh.retBadge}>
                  <Text style={sh.retText}>+{ret}%</Text>
                </View>
              </View>
              <View style={sh.balancePanel}>
                <Text style={sh.balanceLabel}>FINAL BALANCE</Text>
                <Text style={sh.balanceValue}>{money(calc.finalBalance)}</Text>
              </View>
              <View style={sh.grid}>
                <ShareStat label="Initial" value={money(calc.initialDeposit)} />
                <ShareStat label="Per period" value={money(calc.contributionAmount)} />
                <ShareStat label="Years" value={`${calc.timePeriod}`} />
                <ShareStat label="Rate" value={`${calc.rateOfReturn}%`} />
                <ShareStat label="Frequency" value={calc.frequency} />
                <ShareStat label="Interest" value={money(calc.interestEarned)} highlight />
              </View>
              <View style={sh.footer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={sh.logo}>
                    <Icon name="trending" size={13} color="#04140D" strokeWidth={3} />
                  </View>
                  <Text style={sh.brand}>Compound259</Text>
                </View>
                <View style={sh.appStore}>
                  <Text style={sh.appStoreText}> App Store</Text>
                </View>
              </View>
            </View>
          )}
        </ViewShot>
        <TouchableOpacity onPress={onShare} activeOpacity={0.85} style={{ width: '100%', maxWidth: 330, marginTop: 14 }}>
          <GradientButton onPress={onShare} radius={14}>
            <Text style={{ fontFamily: Font.bodyBold, fontSize: 15, color: theme.btnFg }}>Share image</Text>
          </GradientButton>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={{ marginTop: 10 }}>
          <Text style={{ fontFamily: Font.bodySemi, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function ShareStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={{ width: '33.33%', alignItems: 'center', paddingVertical: 7 }}>
      <Text style={sh.statLabel}>{label}</Text>
      <Text style={[sh.statValue, highlight && { color: '#8DF7C6' }]}>{value}</Text>
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
    retBadge: { backgroundColor: theme.accentSoft, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
    retText: { fontFamily: Font.displayBold, fontSize: 12, color: theme.accent },
    balancePanel: { marginVertical: 14 },
    balancePanelInner: { alignItems: 'flex-start', justifyContent: 'flex-start', paddingVertical: 13, paddingHorizontal: 15 },
    balanceLabel: { fontFamily: Font.bodyBold, fontSize: 10, letterSpacing: 1, opacity: 0.7 },
    balanceValue: { fontFamily: Font.displayBold, fontSize: 25, marginTop: 2 },
    detailsGrid: { flexDirection: 'row', gap: 16, marginBottom: 15 },
    detailCol: { flex: 1, gap: 11 },
    actions: { flexDirection: 'row', gap: 8 },
    shareAppCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, marginTop: 7 },
    shareAppText: { fontFamily: Font.bodySemi, fontSize: 13, color: theme.sub },
    sheetTitle: { fontFamily: Font.bodyBold, fontSize: 18, color: theme.text, textAlign: 'center' },
    sheetSubtitle: { fontFamily: Font.body, fontSize: 13.5, color: theme.sub, textAlign: 'center', marginTop: 6, marginBottom: 18 },
    textInput: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontFamily: Font.body, fontSize: 16 },
    sheetActions: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
    cancelText: { fontFamily: Font.bodySemi, fontSize: 15 },
    confirmText: { fontFamily: Font.bodyBold, fontSize: 15 },
    deleteIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    deleteTitle: { fontFamily: Font.bodyBold, fontSize: 19, color: theme.text, marginBottom: 9 },
    deleteMsg: { fontFamily: Font.body, fontSize: 14, color: theme.sub, textAlign: 'center', lineHeight: 21, marginBottom: 22 },
    deleteConfirm: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
    deleteConfirmText: { fontFamily: Font.bodyBold, fontSize: 15, color: '#fff' },
  });

// Fixed brand palette for the shareable image (theme-independent).
const sh = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#0E1320', borderWidth: 1, borderColor: '#24303f', borderRadius: 22, padding: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontFamily: Font.bodyBold, fontSize: 16, color: '#F1F4FC' },
  date: { fontFamily: Font.body, fontSize: 12, color: '#7C879A', marginTop: 2 },
  retBadge: { backgroundColor: 'rgba(124,246,208,0.16)', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  retText: { fontFamily: Font.displayBold, fontSize: 12, color: '#8DF7C6' },
  balancePanel: { backgroundColor: '#7CF6B0', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, marginVertical: 14 },
  balanceLabel: { fontFamily: Font.bodyBold, fontSize: 10, letterSpacing: 1, color: '#04140D', opacity: 0.65 },
  balanceValue: { fontFamily: Font.displayBold, fontSize: 27, color: '#04140D', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
  statLabel: { fontFamily: Font.bodySemi, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: '#7C879A' },
  statValue: { fontFamily: Font.bodyBold, fontSize: 14, color: '#E7ECF6', marginTop: 3 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTopWidth: 1, borderTopColor: '#1E2A38' },
  logo: { width: 24, height: 24, borderRadius: 6, backgroundColor: '#7CF6B0', alignItems: 'center', justifyContent: 'center' },
  brand: { fontFamily: Font.bodyBold, fontSize: 13, color: '#E7ECF6', letterSpacing: 0.3 },
  appStore: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6 },
  appStoreText: { fontFamily: Font.bodySemi, fontSize: 11, color: '#fff' },
});
