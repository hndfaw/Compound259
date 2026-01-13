import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import type { ComponentProps } from 'react';
import React, { useCallback, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import ViewShot from 'react-native-view-shot';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { SavedCalculation, useCalculations } from '@/hooks/use-calculations';

const GREEN_ACCENT = '#10B981';
type IoniconName = ComponentProps<typeof Ionicons>['name'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(isFinite(value) ? value : 0);

const formatCurrencyFull = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(isFinite(value) ? value : 0);

export default function SavedScreen() {
  const { calculations, isLoading, updateCalculation, deleteCalculation, refreshCalculations } = useCalculations();
  const [editingCalculation, setEditingCalculation] = useState<SavedCalculation | null>(null);
  const [deletingCalculation, setDeletingCalculation] = useState<SavedCalculation | null>(null);
  const [sharingCalculation, setSharingCalculation] = useState<SavedCalculation | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      refreshCalculations();
    }, [refreshCalculations])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshCalculations();
    setIsRefreshing(false);
  };

  const handleEdit = (calculation: SavedCalculation) => {
    setEditingCalculation(calculation);
    setEditTitle(calculation.title);
  };

  const handleSaveEdit = async () => {
    if (!editingCalculation || !editTitle.trim()) return;

    try {
      await updateCalculation(editingCalculation.id, { title: editTitle.trim() });
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setEditingCalculation(null);
      setEditTitle('');
      Toast.show({
        type: 'success',
        text1: 'Updated!',
        text2: 'Calculation has been updated successfully.',
        position: 'top',
        visibilityTime: 2000,
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update calculation.',
        position: 'top',
        visibilityTime: 3000,
      });
    }
  };

  const handleDelete = (calculation: SavedCalculation) => {
    setDeletingCalculation(calculation);
  };

  const confirmDelete = async () => {
    if (!deletingCalculation) return;

    try {
      await deleteCalculation(deletingCalculation.id);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setDeletingCalculation(null);
      Toast.show({
        type: 'success',
        text1: 'Deleted!',
        text2: 'Calculation has been deleted.',
        position: 'top',
        visibilityTime: 2000,
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete calculation.',
        position: 'top',
        visibilityTime: 3000,
      });
    }
  };

  const handleShare = (calculation: SavedCalculation) => {
    setSharingCalculation(calculation);
  };

  const captureAndShare = async () => {
    if (!viewShotRef.current || !sharingCalculation) return;

    try {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const uri = await viewShotRef.current.capture?.();
      if (!uri) {
        throw new Error('Failed to capture image');
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your investment growth',
      });

      setSharingCalculation(null);
    } catch {
      setSharingCalculation(null);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to share calculation.',
        position: 'top',
        visibilityTime: 3000,
      });
    }
  };

  const handleShareApp = async () => {
    try {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      await Share.share({
        message: 'Check out Compound259 - a beautiful compound interest calculator to visualize your investment growth!\n\nhttps://apps.apple.com/us/app/compound259/id6757372216',
      });
    } catch {
      // User cancelled or error
    }
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="bookmark-outline" size={44} color="#4B5563" />
      </View>
      <ThemedText style={styles.emptyTitle}>No Saved Calculations</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Your saved calculations will appear here.{"\n"}Go to Calculator to create one.
      </ThemedText>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(52, insets.top + 28), paddingBottom: 80 + insets.bottom },
          calculations.length === 0 && styles.contentCentered,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={GREEN_ACCENT}
            colors={[GREEN_ACCENT]}
          />
        }
      >
        <ScreenHeader
          icon="bookmark"
          iconSize={18}
          accent={GREEN_ACCENT}
          title="Saved Records"
          subtitle={
            isLoading
              ? 'Loading...'
              : calculations.length === 0
                ? 'No saved calculations yet'
                : `${calculations.length} saved calculation${calculations.length !== 1 ? 's' : ''}`
          }
        />

        {calculations.length === 0 && !isLoading ? (
          <EmptyState />
        ) : (
          <>
            {calculations.map((calculation, index) => (
              <View
                key={calculation.id}
                style={[styles.card, index === calculations.length - 1 && styles.lastCard]}
              >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <ThemedText style={styles.cardTitle} numberOfLines={2}>
                    {calculation.title}
                  </ThemedText>
                  <ThemedText style={styles.cardDate}>Saved on {calculation.date}</ThemedText>
                </View>
                <View style={styles.returnBadge}>
                  <Ionicons name="trending-up" size={11} color="#FFFFFF" />
                  <ThemedText style={styles.returnText}>
                    +{((calculation.interestEarned / Math.max(calculation.initialDeposit + calculation.contributions, 1)) * 100).toFixed(0)}%
                  </ThemedText>
                </View>
              </View>

              <View style={styles.balanceSection}>
                <ThemedText style={styles.balanceLabel}>FINAL BALANCE</ThemedText>
                <ThemedText style={styles.balanceValue}>{formatCurrencyFull(calculation.finalBalance)}</ThemedText>
              </View>

              <View style={styles.detailsGrid}>
                <View style={[styles.detailColumn, styles.detailColumnSpacing]}>
                  <DetailRow
                    icon="card-outline"
                    label="Initial Deposit"
                    value={formatCurrency(calculation.initialDeposit)}
                  />
                  <DetailRow
                    icon="wallet-outline"
                    label="Contributions"
                    value={`${formatCurrency(calculation.contributionAmount)} ${calculation.frequency.toLowerCase()}`}
                  />
                  <DetailRow
                    icon="trending-up-outline"
                    label="Rate of Return"
                    value={`${calculation.rateOfReturn}% per year`}
                  />
                </View>
                <View style={styles.detailColumn}>
                  <DetailRow
                    icon="cash-outline"
                    label="Interest Earned"
                    value={formatCurrency(calculation.interestEarned)}
                    highlight
                  />
                  <DetailRow
                    icon="calendar-outline"
                    label="Time Period"
                    value={`${calculation.timePeriod} year${calculation.timePeriod !== 1 ? 's' : ''}`}
                  />
                  <DetailRow icon="repeat-outline" label="Frequency" value={calculation.frequency} />
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.actionButton, styles.shareButton]}
                  onPress={() => handleShare(calculation)}
                >
                  <Ionicons name="share-outline" size={18} color="#60A5FA" />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEdit(calculation)}
                >
                  <Ionicons name="create-outline" size={18} color={GREEN_ACCENT} />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(calculation)}
                >
                  <Ionicons name="trash-outline" size={18} color="#F87171" />
                </TouchableOpacity>
              </View>
              </View>
            ))}

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.shareAppCard}
              onPress={handleShareApp}
            >
              <View style={styles.shareAppContent}>
                <Ionicons name="heart-outline" size={18} color="#F472B6" />
                <ThemedText style={styles.shareAppText}>Enjoying the app? Share with friends</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#6B7280" />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={!!editingCalculation}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingCalculation(null)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom : 0}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setEditingCalculation(null)}
          >
            <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <ThemedText style={styles.modalTitle}>Edit Calculation</ThemedText>
              <ThemedText style={styles.modalSubtitle}>Update the name of your saved calculation</ThemedText>

              <TextInput
                style={styles.editInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Enter a new title"
                placeholderTextColor="#6B7280"
                selectionColor={GREEN_ACCENT}
                autoFocus
                maxLength={50}
              />

              {editingCalculation && (
                <View style={styles.editPreview}>
                  <ThemedText style={styles.previewLabel}>Final Balance</ThemedText>
                  <ThemedText style={styles.previewValue}>
                    {formatCurrencyFull(editingCalculation.finalBalance)}
                  </ThemedText>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setEditingCalculation(null);
                    setEditTitle('');
                  }}
                >
                  <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                  <View style={styles.saveButtonGradient}>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.saveButtonText}>Save</ThemedText>
                  </View>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={!!deletingCalculation}
        animationType="fade"
        transparent
        onRequestClose={() => setDeletingCalculation(null)}
      >
        <TouchableOpacity
          style={styles.deleteModalOverlay}
          activeOpacity={1}
          onPress={() => setDeletingCalculation(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.deleteModalContent}>
            <View style={styles.deleteIconContainer}>
              <Ionicons name="trash" size={32} color="#EF4444" />
            </View>
            <ThemedText style={styles.deleteModalTitle}>Delete Calculation?</ThemedText>
            <ThemedText style={styles.deleteModalMessage}>
              Are you sure you want to delete "{deletingCalculation?.title}"? This action cannot be undone.
            </ThemedText>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.deleteCancelButton}
                onPress={() => setDeletingCalculation(null)}
              >
                <ThemedText style={styles.deleteCancelText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmButton} onPress={confirmDelete}>
                <Ionicons name="trash" size={16} color="#FFFFFF" />
                <ThemedText style={styles.deleteConfirmText}>Delete</ThemedText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Share Modal */}
      <Modal
        visible={!!sharingCalculation}
        animationType="fade"
        transparent
        onRequestClose={() => setSharingCalculation(null)}
        onShow={() => {
          setTimeout(captureAndShare, 300);
        }}
      >
        <View style={styles.shareModalOverlay}>
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'png', quality: 1, result: 'tmpfile' }}
            style={styles.shareCardContainer}
          >
            {sharingCalculation && (
              <View style={styles.shareCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleContainer}>
                    <ThemedText style={styles.cardTitle} numberOfLines={2}>
                      {sharingCalculation.title}
                    </ThemedText>
                    <ThemedText style={styles.cardDate}>Saved on {sharingCalculation.date}</ThemedText>
                  </View>
                  <View style={styles.returnBadge}>
                    <Ionicons name="trending-up" size={11} color="#FFFFFF" />
                    <ThemedText style={styles.returnText}>
                      +{((sharingCalculation.interestEarned / Math.max(sharingCalculation.initialDeposit + sharingCalculation.contributions, 1)) * 100).toFixed(0)}%
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.balanceSection}>
                  <ThemedText style={styles.balanceLabel}>FINAL BALANCE</ThemedText>
                  <ThemedText style={styles.balanceValue}>{formatCurrencyFull(sharingCalculation.finalBalance)}</ThemedText>
                </View>

                <View style={styles.shareDetailsGrid}>
                  <View style={styles.shareDetailRow}>
                    <View style={styles.shareDetailItem}>
                      <ThemedText style={styles.shareDetailLabel}>Initial</ThemedText>
                      <ThemedText style={styles.shareDetailValue}>{formatCurrency(sharingCalculation.initialDeposit)}</ThemedText>
                    </View>
                    <View style={styles.shareDetailItem}>
                      <ThemedText style={styles.shareDetailLabel}>Monthly</ThemedText>
                      <ThemedText style={styles.shareDetailValue}>{formatCurrency(sharingCalculation.contributionAmount)}</ThemedText>
                    </View>
                    <View style={styles.shareDetailItem}>
                      <ThemedText style={styles.shareDetailLabel}>Years</ThemedText>
                      <ThemedText style={styles.shareDetailValue}>{sharingCalculation.timePeriod}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.shareDetailRow}>
                    <View style={styles.shareDetailItem}>
                      <ThemedText style={styles.shareDetailLabel}>Rate</ThemedText>
                      <ThemedText style={styles.shareDetailValue}>{sharingCalculation.rateOfReturn}%</ThemedText>
                    </View>
                    <View style={styles.shareDetailItem}>
                      <ThemedText style={styles.shareDetailLabel}>Frequency</ThemedText>
                      <ThemedText style={styles.shareDetailValue}>{sharingCalculation.frequency}</ThemedText>
                    </View>
                    <View style={styles.shareDetailItem}>
                      <ThemedText style={styles.shareDetailLabel}>Interest</ThemedText>
                      <ThemedText style={[styles.shareDetailValue, styles.shareDetailHighlight]}>{formatCurrency(sharingCalculation.interestEarned)}</ThemedText>
                    </View>
                  </View>
                </View>

                <View style={styles.shareFooter}>
                  <View style={styles.shareFooterLeft}>
                    <Image
                      source={require('@/assets/images/icon.png')}
                      style={styles.appIcon}
                    />
                    <ThemedText style={styles.appNameText}>Compound259</ThemedText>
                  </View>
                  <View style={styles.appStoreBadge}>
                    <Ionicons name="logo-apple" size={11} color="#FFFFFF" />
                    <ThemedText style={styles.appStoreText}>App Store</ThemedText>
                  </View>
                </View>
              </View>
            )}
          </ViewShot>
        </View>
      </Modal>
    </View>
  );
}

type DetailRowProps = {
  icon: IoniconName;
  label: string;
  value: string;
  highlight?: boolean;
};

function DetailRow({ icon, label, value, highlight }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIconBadge, highlight && styles.detailIconBadgeHighlight]}>
        <Ionicons name={icon} size={13} color={highlight ? '#34D399' : GREEN_ACCENT} />
      </View>
      <View style={styles.detailTexts}>
        <ThemedText style={styles.detailLabel}>{label}</ThemedText>
        <ThemedText style={[styles.detailValue, highlight && styles.detailValueHighlight]}>{value}</ThemedText>
      </View>
    </View>
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
    paddingBottom: 100,
    paddingTop: 16,
  },
  contentCentered: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  lastCard: {
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 3,
    lineHeight: 20,
  },
  cardDate: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  returnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  returnText: {
    color: GREEN_ACCENT,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 3,
  },
  balanceSection: {
    backgroundColor: '#065F46',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  detailsGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailColumn: {
    flex: 1,
  },
  detailColumnSpacing: {
    marginRight: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    marginRight: 8,
  },
  detailIconBadgeHighlight: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  detailTexts: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  detailValueHighlight: {
    color: '#34D399',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
  },
  editButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  deleteButton: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
  },
  shareAppCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  shareAppContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shareAppText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
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
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 20,
    textAlign: 'center',
  },
  editInput: {
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
  editPreview: {
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
  modalActions: {
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
  saveButton: {
    flex: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#3B82F6',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  deleteModalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  deleteIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 10,
    textAlign: 'center',
  },
  deleteModalMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteCancelButton: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  deleteConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  shareModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  shareCardContainer: {
    width: '100%',
    maxWidth: 360,
  },
  shareCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    borderColor: '#374151',
  },
  shareDetailsGrid: {
    marginBottom: 16,
  },
  shareDetailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  shareDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  shareDetailLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  shareDetailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  shareDetailHighlight: {
    color: '#34D399',
  },
  shareFooter: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
  },
  shareFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: 8,
  },
  appNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E5E7EB',
    letterSpacing: 0.3,
  },
  appStoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  appStoreText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
