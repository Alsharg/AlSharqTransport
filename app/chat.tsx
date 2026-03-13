import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { Message } from '../services/types';
import * as api from '../services/api';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { messages, loadMessages, profile } = useApp();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const listRef = useRef<any>(null);

  useEffect(() => { loadMessages(); }, []);

  // Filter messages for this driver's conversation with admins
  const myMessages = messages.filter(m =>
    m.sender_id === user?.id ||
    m.recipient_id === user?.id ||
    (m.sender_role === 'admin' && !m.recipient_id)
  ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const handleSend = async () => {
    if (text.trim().length === 0 || !user?.id || !profile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const msg = {
      sender_id: user.id,
      sender_name: profile.full_name || profile.username || 'سائق',
      sender_role: 'driver' as const,
      content: text.trim(),
      is_read: false,
    };
    await api.sendMessageDB(msg);
    setText('');
    await loadMessages();
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === user?.id;
    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowRight : styles.messageRowLeft]}>
        {!isMe ? (
          <View style={styles.adminAvatar}>
            <MaterialIcons name="support-agent" size={16} color={theme.primary} />
          </View>
        ) : null}
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}>
          {!isMe ? <Text style={styles.senderLabel}>الإدارة</Text> : null}
          <Text style={[styles.messageText, isMe && { color: '#FFF' }]}>{item.content}</Text>
          <Text style={[styles.messageTime, isMe && { color: 'rgba(255,255,255,0.6)' }]}>
            {new Date(item.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <MaterialIcons name="close" size={24} color={theme.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>إدارة الشرق</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>متصل</Text>
          </View>
        </View>
        <View style={{ width: 44 }} />
      </Animated.View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ flex: 1 }}>
          {myMessages.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="chat-bubble-outline" size={64} color={theme.border} />
              <Text style={styles.emptyTitle}>ابدأ المحادثة</Text>
              <Text style={styles.emptySubtext}>أرسل رسالة للتواصل مع إدارة الشرق</Text>
            </View>
          ) : (
            <FlashList
              ref={listRef}
              data={myMessages}
              renderItem={renderMessage}
              estimatedItemSize={80}
              contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16 }}
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface,
  },
  closeBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.surfaceElevated, alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.success },
  onlineText: { fontSize: 11, fontWeight: '600', color: theme.success },

  // Empty
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingBottom: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl' },
  emptySubtext: { ...typography.caption, writingDirection: 'rtl', textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },

  // Messages
  messageRow: { marginBottom: 14 },
  messageRowRight: { alignItems: 'flex-end' },
  messageRowLeft: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  adminAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: theme.primary + '15', alignItems: 'center', justifyContent: 'center',
  },
  messageBubble: { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18 },
  myBubble: { backgroundColor: theme.primary, borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: theme.surfaceElevated, borderBottomLeftRadius: 4 },
  senderLabel: { fontSize: 11, fontWeight: '700', color: theme.primary, marginBottom: 4, writingDirection: 'rtl' },
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
