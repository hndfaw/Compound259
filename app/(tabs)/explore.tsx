import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import type { ComponentProps } from 'react';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
  const [editTitle, setEditTitle] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    } catch {
      Alert.alert('Error', 'Failed to update calculation.');
    }
  };

  const handleDelete = (calculation: SavedCalculation) => {
    Alert.alert(
      'Delete Calculation',
      `Are you sure you want to delete "${calculation.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCalculation(calculation.id);
              if (Platform.OS === 'ios') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch {
              Alert.alert('Error', 'Failed to delete calculation.');
            }
          },
        },
      ]
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="bookmark-outline" size={44} color="#4B5563" />
      </View>
      <ThemedText style={styles.emptyTitle}>No Saved Calculations</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Your saved calculations will appear here.{'\n'}Go to Calculator to create one.
      </ThemedText>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, calculations.length === 0 && styles.contentCentered]}
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
        <View style={styles.headerRow}>
          <View style={styles.headerBadge}>
            <Ionicons name="bookmark" size={16} color={GREEN_ACCENT} />
          </View>
          <ThemedText style={styles.headerTitle}>Saved Records</ThemedText>
        </View>
        <ThemedText style={styles.subtitle}>
          {isLoading
            ? 'Loading...'
            : calculations.length === 0
              ? 'No saved calculations yet'
              : `${calculations.length} saved calculation${calculations.length !== 1 ? 's' : ''}`}
        </ThemedText>

        {calculations.length === 0 && !isLoading ? (
          <EmptyState />
        ) : (
          calculations.map((calculation, index) => (
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
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEdit(calculation)}
                >
                  <Ionicons name="create-outline" size={15} color={GREEN_ACCENT} />
                  <ThemedText style={styles.editText}>Edit</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(calculation)}
                >
                  <Ionicons name="trash-outline" size={15} color="#F87171" />
                  <ThemedText style={styles.deleteText}>Delete</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={!!editingCalculation}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingCalculation(null)}
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
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveButtonGradient}
                >
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.saveButtonText}>Save</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F9FAFB',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
    fontWeight: '500',
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
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  editButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  deleteButton: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
  },
  editText: {
    fontSize: 13,
    fontWeight: '600',
    color: GREEN_ACCENT,
    marginLeft: 5,
  },
  deleteText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F87171',
    marginLeft: 5,
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
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
});
