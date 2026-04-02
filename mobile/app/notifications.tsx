import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Colors, Fonts } from '../constants/theme';
import { Button } from '../components/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NotifItem {
  id: string;
  type: string;
  icon: string;
  message: string;
  time: string;
  action: string;
  isUnread?: boolean;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const TODAY_NOTIFS: NotifItem[] = [
  {
    id: 'n1',
    type: 'crowd',
    icon: '🔥',
    message: 'Power Plant Live just hit 96% capacity',
    time: '2m ago',
    action: 'View Bar',
  },
  {
    id: 'n2',
    type: 'badge',
    icon: '🏅',
    message: 'You earned the Old Mare badge at The Horse!',
    time: '1h ago',
    action: 'View Badge',
    isUnread: true,
  },
  {
    id: 'n3',
    type: 'friend',
    icon: '👥',
    message: "canton_kate checked in at Moe's Tavern — join her?",
    time: '2h ago',
    action: 'Check In',
  },
  {
    id: 'n4',
    type: 'deal',
    icon: '🎁',
    message: 'FLASH DEAL: Free shot at Federal Hill Brewing — 30 min left!',
    time: '3h ago',
    action: 'Claim',
    isUnread: true,
  },
];

const WEEK_NOTIFS: NotifItem[] = [
  {
    id: 'n5',
    type: 'crawl',
    icon: '🗺️',
    message: 'The Fells Point Crawl is 2 stops away from completion',
    time: '2d ago',
    action: 'Continue',
  },
  {
    id: 'n6',
    type: 'rank',
    icon: '🏆',
    message: 'You moved up to #4 on the Baltimore leaderboard!',
    time: '3d ago',
    action: 'View',
  },
  {
    id: 'n7',
    type: 'story',
    icon: '💬',
    message: 'jmill_bmore replied to your story',
    time: '5d ago',
    action: 'Reply',
  },
];

// ---------------------------------------------------------------------------
// Notification row
// ---------------------------------------------------------------------------

interface NotifRowProps {
  item: NotifItem;
  onAction: (item: NotifItem) => void;
}

function NotifRow({ item, onAction }: NotifRowProps): React.ReactElement {
  return (
    <View
      style={[
        styles.notifRow,
        item.isUnread && styles.notifRowUnread,
      ]}
    >
      {/* Unread dot */}
      {item.isUnread && <View style={styles.unreadDot} />}

      {/* Icon circle */}
      <View style={styles.iconCircle}>
        <Text style={styles.iconEmoji}>{item.icon}</Text>
      </View>

      {/* Middle text */}
      <View style={styles.notifTextBlock}>
        <Text style={styles.notifMessage}>{item.message}</Text>
        <Text style={styles.notifTime}>{item.time}</Text>
      </View>

      {/* Action button */}
      <Button
        label={item.action}
        variant="ghost"
        size="sm"
        onPress={() => onAction(item)}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function NotificationsScreen(): React.ReactElement {
  const [todayNotifs, setTodayNotifs] = useState<NotifItem[]>(TODAY_NOTIFS);
  const [weekNotifs] = useState<NotifItem[]>(WEEK_NOTIFS);

  const handleMarkAllRead = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTodayNotifs((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  }, []);

  const handleAction = useCallback((item: NotifItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Mark this notification as read
    setTodayNotifs((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isUnread: false } : n)),
    );
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>NOTIFICATIONS</Text>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleMarkAllRead}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={24}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Today */}
        <Text style={styles.sectionLabel}>TODAY</Text>
        {todayNotifs.map((item) => (
          <NotifRow key={item.id} item={item} onAction={handleAction} />
        ))}

        {/* This week */}
        <Text style={styles.sectionLabel}>THIS WEEK</Text>
        {weekNotifs.map((item) => (
          <NotifRow key={item.id} item={item} onAction={handleAction} />
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: 24,
    color: Colors.textPrimary,
  },

  // Section label
  sectionLabel: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.textMuted,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  // Notification row
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
  },
  notifRowUnread: {
    backgroundColor: 'rgba(255,107,53,0.05)',
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    left: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: {
    fontSize: 20,
  },
  notifTextBlock: {
    flex: 1,
    marginHorizontal: 12,
  },
  notifMessage: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  notifTime: {
    fontFamily: Fonts.bodyLight,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },

  scroll: {
    flex: 1,
  },
});
