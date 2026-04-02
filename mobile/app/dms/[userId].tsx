import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Fonts } from '../../constants/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TextMessage {
  id: string;
  text: string;
  senderId: 'me' | 'them';
  timestamp: string;
  type: 'text';
}

interface BarInviteMessage {
  id: string;
  text: string;
  senderId: 'me' | 'them';
  timestamp: string;
  type: 'bar-invite';
  barInvite: { barName: string; neighborhood: string; crowd: number };
}

type Message = TextMessage | BarInviteMessage;

interface Thread {
  name: string;
  messages: Message[];
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_THREADS: Record<string, Thread> = {
  m1: {
    name: 'canton_kate',
    messages: [
      { id: '1', text: 'Are you hitting Fells Point tonight?', senderId: 'them', timestamp: '9:42 PM', type: 'text' },
      { id: '2', text: 'Yes! Meet at The Horse at 10?', senderId: 'me', timestamp: '9:44 PM', type: 'text' },
      { id: '3', text: "Let's go 🔥", senderId: 'them', timestamp: '9:45 PM', type: 'text' },
      { id: '4', text: "Are you at Moe's?", senderId: 'them', timestamp: '10:12 PM', type: 'text' },
    ],
  },
  m2: {
    name: 'jmill_bmore',
    messages: [
      { id: '1', text: 'That crawl was 🔥', senderId: 'them', timestamp: '11:30 PM', type: 'text' },
      { id: '2', text: 'We need to do it again this weekend', senderId: 'me', timestamp: '11:32 PM', type: 'text' },
    ],
  },
  m3: {
    name: 'Power Plant Live',
    messages: [
      { id: '1', text: 'Flash deal tonight! 🍹 2-for-1 cocktails until midnight', senderId: 'them', timestamp: '8:00 PM', type: 'text' },
      {
        id: '2',
        text: '',
        senderId: 'them',
        timestamp: '9:00 PM',
        type: 'bar-invite',
        barInvite: { barName: 'Power Plant Live', neighborhood: 'Inner Harbor', crowd: 92 },
      },
    ],
  },
  m4: { name: 'bmore_legend', messages: [{ id: '1', text: 'Race you to #1!', senderId: 'them', timestamp: '2d', type: 'text' }] },
  m5: { name: 'harbor_hopper', messages: [{ id: '1', text: 'Sticky Rice after?', senderId: 'them', timestamp: '2d', type: 'text' }] },
};

const BAR_INVITE_OPTIONS = [
  { barName: 'The Horse You Came In On', neighborhood: 'Fells Point', crowd: 78 },
  { barName: 'Power Plant Live', neighborhood: 'Inner Harbor', crowd: 92 },
  { barName: 'Canton Social', neighborhood: 'Canton', crowd: 82 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  const parts = name.replace('@', '').split(/[_\s]/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [Colors.primary, Colors.success, Colors.purple, Colors.error, '#3B82F6', '#F59E0B'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getCrowdColor(crowd: number): string {
  if (crowd > 66) return Colors.error;
  if (crowd > 33) return Colors.secondary;
  return Colors.success;
}

// ---------------------------------------------------------------------------
// BarInviteCard
// ---------------------------------------------------------------------------

interface BarInviteCardProps {
  barName: string;
  neighborhood: string;
  crowd: number;
}

function BarInviteCard({ barName, neighborhood, crowd }: BarInviteCardProps): React.ReactElement {
  const crowdColor = getCrowdColor(crowd);
  return (
    <View style={styles.inviteCard}>
      <Text style={styles.inviteBarName}>{barName}</Text>
      <Text style={styles.inviteNeighborhood}>{neighborhood} · {crowd}% capacity</Text>
      <View style={styles.inviteCrowdTrack}>
        <View style={[styles.inviteCrowdFill, { width: `${crowd}%` as `${number}%`, backgroundColor: crowdColor }]} />
      </View>
      <TouchableOpacity
        style={styles.inviteBtn}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
      >
        <Text style={styles.inviteBtnText}>🔥 Check In Together</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// MessageBubble
// ---------------------------------------------------------------------------

interface BubbleProps {
  message: Message;
  contactName: string;
  avatarColor: string;
}

function MessageBubble({ message, contactName, avatarColor }: BubbleProps): React.ReactElement {
  const isMine = message.senderId === 'me';

  if (message.type === 'bar-invite' && message.barInvite) {
    return (
      <View style={[styles.bubbleRow, isMine ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
        {!isMine && (
          <View style={[styles.bubbleAvatar, { backgroundColor: avatarColor + '33' }]}>
            <Text style={[styles.bubbleAvatarText, { color: avatarColor }]}>
              {getInitials(contactName)}
            </Text>
          </View>
        )}
        <BarInviteCard {...message.barInvite} />
      </View>
    );
  }

  return (
    <View style={[styles.bubbleRow, isMine ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
      {!isMine && (
        <View style={[styles.bubbleAvatar, { backgroundColor: avatarColor + '33' }]}>
          <Text style={[styles.bubbleAvatarText, { color: avatarColor }]}>
            {getInitials(contactName)}
          </Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleTheirs,
        ]}
      >
        <Text style={styles.bubbleText}>{message.text}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function DMConversationScreen(): React.ReactElement {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const thread = MOCK_THREADS[userId] ?? { name: userId, messages: [] };

  const [messages, setMessages] = useState<Message[]>([...thread.messages].reverse());
  const [inputText, setInputText] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const flatListRef = useRef<FlatList<Message>>(null);
  const avatarColor = getAvatarColor(thread.name);

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const msg: TextMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      senderId: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
    };

    setMessages((prev) => [msg, ...prev]);
    setInputText('');
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [inputText]);

  const handleBarInvite = useCallback(
    (bar: (typeof BAR_INVITE_OPTIONS)[0]) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const msg: BarInviteMessage = {
        id: Date.now().toString(),
        text: '',
        senderId: 'me',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'bar-invite',
        barInvite: bar,
      };
      setMessages((prev) => [msg, ...prev]);
      setShowInviteModal(false);
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Message>) => (
      <MessageBubble
        message={item}
        contactName={thread.name}
        avatarColor={avatarColor}
      />
    ),
    [thread.name, avatarColor],
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={[styles.headerAvatar, { backgroundColor: avatarColor + '33' }]}>
            <Text style={[styles.headerAvatarText, { color: avatarColor }]}>
              {getInitials(thread.name)}
            </Text>
          </View>
          <Text style={styles.headerName}>{thread.name}</Text>
        </View>

        <TouchableOpacity
          style={styles.headerBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="information-circle-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        inverted
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      {/* Input bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.inputIconBtn}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Ionicons name="add-circle-outline" size={28} color={Colors.textMuted} />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />

          <TouchableOpacity
            style={styles.inputIconBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowInviteModal(true);
            }}
          >
            <Ionicons name="flame-outline" size={28} color={Colors.primary} />
          </TouchableOpacity>

          {inputText.trim().length > 0 && (
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={handleSend}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Bar invite modal */}
      <Modal
        visible={showInviteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite to a bar</Text>
              <TouchableOpacity
                onPress={() => setShowInviteModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {BAR_INVITE_OPTIONS.map((bar) => (
              <TouchableOpacity
                key={bar.barName}
                style={styles.barOption}
                onPress={() => handleBarInvite(bar)}
              >
                <View style={styles.barOptionInfo}>
                  <Text style={styles.barOptionName}>{bar.barName}</Text>
                  <Text style={styles.barOptionSub}>
                    {bar.neighborhood} · {bar.crowd}% capacity
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { fontFamily: Fonts.bodyBold, fontSize: 13 },
  headerName: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.textPrimary },

  // List
  listContent: { paddingHorizontal: 16, paddingVertical: 12 },

  // Bubbles
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10, gap: 8 },
  bubbleRowRight: { justifyContent: 'flex-end' },
  bubbleRowLeft: { justifyContent: 'flex-start' },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubbleAvatarText: { fontFamily: Fonts.bodyBold, fontSize: 10 },
  bubble: {
    maxWidth: '75%',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleMine: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontFamily: Fonts.body, fontSize: 15, color: '#FFFFFF', lineHeight: 21 },

  // Bar invite card
  inviteCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
    borderRadius: 16,
    padding: 16,
    maxWidth: 260,
  },
  inviteBarName: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.textPrimary, marginBottom: 4 },
  inviteNeighborhood: { fontFamily: Fonts.bodyLight, fontSize: 13, color: Colors.textMuted, marginBottom: 10 },
  inviteCrowdTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  inviteCrowdFill: { height: '100%', borderRadius: 3 },
  inviteBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: '#FFFFFF' },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: Colors.background,
    gap: 8,
    minHeight: 60,
  },
  inputIconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bar invite modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: { fontFamily: Fonts.display, fontSize: 22, color: Colors.textPrimary },
  barOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    minHeight: 56,
  },
  barOptionInfo: { flex: 1 },
  barOptionName: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.textPrimary },
  barOptionSub: { fontFamily: Fonts.bodyLight, fontSize: 13, color: Colors.textMuted, marginTop: 2 },
});
