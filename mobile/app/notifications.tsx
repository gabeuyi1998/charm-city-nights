import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Colors, Fonts } from '../constants/theme';
import { Button } from '../components/ui';
import { getNotifications, markNotificationRead, Notification as ApiNotif } from '../lib/api';

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
// Helpers
// ---------------------------------------------------------------------------

function typeToIcon(type: string): string {
  switch (type) {
    case 'crowd': return '🔥';
    case 'badge': return '🏅';
    case 'friend': return '👥';
    case 'deal': return '🎁';
    case 'crawl': return '🗺️';
    case 'rank': return '🏆';
    case 'story': return '💬';
    default: return '🔔';
  }
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function mapApiNotif(n: ApiNotif): NotifItem {
  return {
    id: n.id,
    type: n.type,
    icon: typeToIcon(n.type),
    message: n.message,
    time: formatRelative(n.createdAt),
    action: 'View',
    isUnread: !n.isRead,
  };
}

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
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getNotifications()
      .then((r) => setNotifs(r.data.map(mapApiNotif)))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAllRead = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifs((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  }, []);

  const handleAction = useCallback((item: NotifItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifs((prev) => prev.map((n) => (n.id === item.id ? { ...n, isUnread: false } : n)));
    markNotificationRead(item.id).catch(() => {});
  }, []);

  const today = notifs.filter((n) => {
    const diff = Date.now() - new Date().setHours(0, 0, 0, 0);
    return diff >= 0 && n.time.endsWith('m ago') || n.time.endsWith('h ago');
  });
  const older = notifs.filter((n) => !today.includes(n));

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
          <Ionicons name="checkmark-done-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading && (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        )}
        {!loading && error && (
          <Text style={{ color: Colors.primary, fontFamily: Fonts.body, fontSize: 14, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 }}>
            {error}
          </Text>
        )}
        {!loading && !error && notifs.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🔔</Text>
            <Text style={{ fontFamily: Fonts.body, fontSize: 15, color: Colors.textMuted }}>No notifications yet</Text>
          </View>
        )}

        {today.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>TODAY</Text>
            {today.map((item) => (
              <NotifRow key={item.id} item={item} onAction={handleAction} />
            ))}
          </>
        )}

        {older.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>EARLIER</Text>
            {older.map((item) => (
              <NotifRow key={item.id} item={item} onAction={handleAction} />
            ))}
          </>
        )}

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
