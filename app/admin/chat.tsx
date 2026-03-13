import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { theme, typography } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { Message, ConversationSummary } from '../../services/types';
import * as api from '../../services/api';

export default function AdminChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ driverId?: string; driverName?: string }>();
  const { messages, loadMessages, allDriversList, profile } = useApp();
  const { user } = useAuth();
  const [selectedDriver, setSelectedDriver] = useState<string | null>(params.driverId || null);
  const [selectedDriverName, setSelectedDriverName] = useState(params.driverName || '');
  const [text, setText] = useState('');
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const listRef = useRef<any>(null);

  useEffect(() => { loadMessages(); }, []);

  // Build conversation summaries from messages
  const conversations = useMemo((): ConversationSummary[] => {
    const driverMap = new Map<string, { msgs: Message[]; driver?: typeof allDriversList[0] }>();

    // Group messages by driver
    for (const msg of messages) {
      const driverId = msg.sender_role === 'driver' ? msg.sender_id : (msg.recipient_id || '');
      if (!driverId) continue;
      if (!driverMap.has(driverId)) {
        driverMap.set(driverId, { msgs: [], driver: allDriversList.find(d => d.id === driverId) });
      }
      driverMap.get(driverId)?.msgs.push(msg);
    }

    // Also add drivers that have no messages yet
    for (const driver of allDriversList.filter(d => d.is_active && d.approval_status === 'approved')) {
      if (!driverMap.has(driver.id)) {
        driverMap.set(driver.id, { msgs: [], driver });
      }
    }

    const result: ConversationSummary[] = [];
    driverMap.forEach((val, driverId) => {
      const sorted = val.msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const lastMsg = sorted[sorted.length - 1];
      const unread = sorted.filter(m => m.sender_role === 'driver' && !m.is_read).length;
      result.push({
        driverId,
        driverName: val.driver?.full_name || val.driver?.username || lastMsg?.sender_name || 'سائق',
        driverCode: val.driver?.driver_code,
        lastMessage: lastMsg?.content || 'لا توجد رسائل',
        lastMessageTime: lastMsg?.created_at || '',
        unreadCount: unread,
        isOnline: val.driver?.status === 'available',
      });
    });

    // Sort: unread first, then by last message time
    return result.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });
  }, [messages, allDriversList]);

  // Load conversation when driver selected
  useEffect(() => {
    if (selectedDriver && user?.id) {
      const driverMsgs = messages.filter(m =>
        (m.sender_id === selectedDriver && (m.recipient_id === user.id || !m.recipient_id)) ||
        (m.sender_id === user.id && m.recipient_id === selectedDriver) ||
        (m.sender_id === selectedDriver && m.sender_role === 'driver' && !m.recipient_id)
      ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setConversationMessages(driverMsgs);

      // Mark unread messages as read
      api.markConversationRead(selectedDriver, user.id);
    }
  }, [selectedDriver, messages, user?.id]);

  const handleSend = async () => {
    if (text.trim().length === 0 || !selectedDriver || !user?.id || !profile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const msg = {
      sender_id: user.id,
      sender_name: profile.full_name || profile.username || 'الإدارة',
      sender_role: 'admin' as const,
      recipient_id: selectedDriver,
      content: text.trim(),
      is_read: false,
    };
    await api.sendMessageDB(msg);
    setText('');
    await loadMessages();
  };

  const handleSelectDriver = (driverId: string, driverName: string) => {
    setSelectedDriver(driverId);
    setSelectedDriverName(driverName);
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 24) return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    if (diffHours < 48) return 'أمس';
    return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
  };

  // Conversation list view
  if (!selectedDriver) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>المحادثات</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{conversations.reduce((s, c) => s + c.unreadCount, 0)}</Text>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          {conversations.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="chat-bubble-outline" size={72} color={theme.border} />
              <Text style={styles.emptyTitle}>لا توجد محادثات</Text>
              <Text style={styles.emptySubtext}>ابدأ محادثة مع أحد السائقين من قائمة السائقين</Text>
            </View>
          ) : (
            <FlashList
              data={conversations}
              estimatedItemSize={88}
              contentContainerStyle={{ paddingVertical: 8 }}
              renderItem={({ item, index }) => (
                <Animated.View entering={FadeInRight.duration(250).delay(index * 40)}>
                  <Pressable
                    onPress={() => handleSelectDriver(item.driverId, item.driverName)}
                    style={({ pressed }) => [styles.convItem, pressed && { backgroundColor: theme.backgroundSecondary }]}
                  >
                    <View style={styles.convAvatar}>
                      <MaterialIcons name="person" size={24} color={theme.primary} />
                      {item.isOnline ? <View style={styles.onlineDot} /> : null}
                    </View>

                    <View style={styles.convContent}>
                      <View style={styles.convTopRow}>
                        <Text style={styles.convName} numberOfLines={1}>{item.driverName}</Text>
                        <Text style={styles.convTime}>{formatTime(item.lastMessageTime)}</Text>
                      </View>
                      {item.driverCode ? (
                        <Text style={styles.convCode}>{item.driverCode}</Text>
                      ) : null}
                      <Text style={styles.convLastMsg} numberOfLines={1}>{item.lastMessage}</Text>
                    </View>

                    {item.unreadCount > 0 ? (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{item.unreadCount}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                </Animated.View>
              )}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Chat view with selected driver
  const renderMessage = ({ item }: { item: Message }) => {
    const isAdmin = item.sender_role === 'admin';
    return (
      <View style={[styles.messageRow, isAdmin ? styles.messageRowRight : styles.messageRowLeft]}>
        {!isAdmin ? (
          <View style={styles.msgAvatar}>
            <MaterialIcons name="person" size={16} color={theme.primary} />
          </View>
        ) : null}
        <View style={[styles.messageBubble, isAdmin ? styles.adminBubble : styles.driverBubble]}>
          <Text style={[styles.messageText, isAdmin && { color: '#FFF' }]}>{item.content}</Text>
          <Text style={[styles.messageTime, isAdmin && { color: 'rgba(255,255,255,0.6)' }]}>
            {new Date(item.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.chatHeader}>
        <Pressable onPress={() => setSelectedDriver(null)} style={styles.backBtn}>
          <MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} />
        </Pressable>
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderName}>{selectedDriverName}</Text>
          <Text style={styles.chatHeaderStatus}>
            {allDriversList.find(d => d.id === selectedDriver)?.status === 'available' ? 'متصل' : 'غير متصل'}
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ flex: 1 }}>
          {conversationMessages.length === 0 ? (
            <View style={styles.emptyChatState}>
              <MaterialIcons name="chat" size={56} color={theme.border} />
              <Text style={styles.emptyChatText}>ابدأ المحادثة مع {selectedDriverName}</Text>
            </View>
          ) : (
            <FlashList
              ref={listRef}
              data={conversationMessages}
              renderItem={renderMessage}
              estimatedItemSize={80}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
            />
          )}
        </View>

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 12 }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="اكتب رسالة..."
            placeholderTextColor={theme.textMuted}
            style={styles.input}
            multiline
            textAlign="right"
          />
          <Pressable
            onPress={handleSend}
            style={[styles.sendBtn, text.trim().length === 0 && { opacity: 0.4 }]}
            disabled={text.trim().length === 0}
          >
            <MaterialIcons name="send" size={20} color="#FFF" style={{ transform: [{ rotate: '180deg' }] }} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.surfaceElevated, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  headerBadge: {
    backgroundColor: theme.error, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
  },
  headerBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  // Conversation List
  convItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: theme.borderLight,
  },
  convAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: theme.primary + '15', alignItems: 'center', justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: theme.success, borderWidth: 2, borderColor: theme.background,
  },
  convContent: { flex: 1, gap: 3 },
  convTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convName: { fontSize: 15, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl', flex: 1, textAlign: 'right' },
  convTime: { fontSize: 11, fontWeight: '500', color: theme.textMuted, marginLeft: 8 },
  convCode: { fontSize: 11, fontWeight: '600', color: theme.primary, writingDirection: 'rtl', textAlign: 'right' },
  convLastMsg: { fontSize: 13, color: theme.textSecondary, writingDirection: 'rtl', textAlign: 'right', lineHeight: 18 },
  unreadBadge: {
    backgroundColor: theme.primary, borderRadius: 12,
    minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  // Empty States
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 60 },
  emptyTitle: { ...typography.subtitle, color: theme.textMuted },
  emptySubtext: { ...typography.caption, writingDirection: 'rtl', textAlign: 'center', paddingHorizontal: 40 },
  emptyChatState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyChatText: { ...typography.caption, writingDirection: 'rtl' },

  // Chat Header
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface,
  },
  chatHeaderInfo: { flex: 1, alignItems: 'center' },
  chatHeaderName: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  chatHeaderStatus: { fontSize: 12, fontWeight: '500', color: theme.success, marginTop: 2 },

  // Messages
  messageRow: { marginBottom: 12 },
  messageRowRight: { alignItems: 'flex-end' },
  messageRowLeft: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: theme.primary + '15', alignItems: 'center', justifyContent: 'center',
  },
  messageBubble: { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18 },
  adminBubble: { backgroundColor: theme.primary, borderBottomRightRadius: 4 },
  driverBubble: { backgroundColor: theme.surfaceElevated, borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, fontWeight: '400', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'right', lineHeight: 22 },
  messageTime: { fontSize: 10, fontWeight: '500', color: theme.textMuted, textAlign: 'left', marginTop: 6 },

  // Input
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 20, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.surface,
  },
  input: {
    flex: 1, minHeight: 48, maxHeight: 100,
    backgroundColor: theme.backgroundSecondary, borderRadius: 24,
    paddingHorizontal: 18, paddingVertical: 12,
    fontSize: 15, color: theme.textPrimary, writingDirection: 'rtl',
  },
  sendBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center',
  },
});
