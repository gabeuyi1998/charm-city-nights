import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Colors, Fonts } from '../constants/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Conversation {
  id: string;
  name: string;
  lastMsg: string;
  time: string;
  unread: number;
  isBar?: boolean;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_CONVERSATIONS: Conversation[] = [
  { id: 'm1', name: 'canton_kate', lastMsg: "Are you at Moe's?", time: '2m', unread: 2 },
  { id: 'm2', name: 'jmill_bmore', lastMsg: 'That crawl was 🔥', time: '1h', unread: 0 },
  { id: 'm3', name: 'Power Plant Live', lastMsg: 'Flash deal tonight!', time: '3h', unread: 1, isBar: true },
  { id: 'm4', name: 'bmore_legend', lastMsg: 'Race you to #1', time: '1d', unread: 0 },
  { id: 'm5', name: 'harbor_hopper', lastMsg: 'Sticky Rice after?', time: '2d', unread: 0 },
];

// ---------------------------------------------------------------------------
// Avatar helper
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  const parts = name.replace('@', '').split(/[_\s]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    Colors.primary,
    Colors.success,
    Colors.purple,
    Colors.error,
    '#3B82F6',
    '#F59E0B',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ---------------------------------------------------------------------------
// Conversation row
// ---------------------------------------------------------------------------

interface ConvRowProps {
  item: Conversation;
  onPress: (item: Conversation) => void;
}

function ConvRow({ item, onPress }: ConvRowProps): React.ReactElement {
  const avatarColor = getAvatarColor(item.name);
  const initials = getInitials(item.name);

  return (
    <TouchableOpacity
      style={styles.convRow}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          { backgroundColor: avatarColor + '33' },
          item.isBar && styles.avatarSquare,
        ]}
      >
        <Text style={[styles.avatarText, { color: avatarColor }]}>
          {item.isBar ? '🏠' : initials}
        </Text>
      </View>

      {/* Text block */}
      <View style={styles.convTextBlock}>
        <View style={styles.convTopRow}>
          <Text style={styles.convName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.convTime}>{item.time}</Text>
        </View>
        <Text style={styles.convLastMsg} numberOfLines={1}>
          {item.lastMsg}
        </Text>
      </View>

      {/* Unread badge */}
      {item.unread > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{item.unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function MessagesScreen(): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = searchQuery.trim()
    ? MOCK_CONVERSATIONS.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.lastMsg.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : MOCK_CONVERSATIONS;

  const handleConvPress = useCallback((item: Conversation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/dms/${item.id}` as never);
  }, []);

  const handleCompose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('New Message', 'Coming soon!', [{ text: 'OK' }]);
  }, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Conversation>) => (
      <ConvRow item={item} onPress={handleConvPress} />
    ),
    [handleConvPress],
  );

  const keyExtractor = useCallback((item: Conversation) => item.id, []);

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

        <Text style={styles.headerTitle}>MESSAGES</Text>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleCompose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="create-outline"
            size={24}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search messages..."
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Conversation list */}
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>💬</Text>
            <Text style={styles.emptyStateText}>No conversations found</Text>
          </View>
        }
      />
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

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.textPrimary,
    padding: 0,
  },

  // List
  listContent: {
    paddingBottom: 32,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginLeft: 72,
  },

  // Conversation row
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 72,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarSquare: {
    borderRadius: 12,
  },
  avatarText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
  },
  convTextBlock: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  convTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  convName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  convTime: {
    fontFamily: Fonts.bodyLight,
    fontSize: 11,
    color: Colors.textMuted,
  },
  convLastMsg: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.textPrimary,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.textMuted,
  },
});
