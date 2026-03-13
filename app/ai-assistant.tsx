import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, typography } from '../constants/theme';
import { askAIAssistant } from '../services/api';

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { icon: 'trending-up', label: 'تحليل الأداء', prompt: 'حلل أداء السائقين والمشاوير هذا الأسبوع وقدم ملخصاً' },
  { icon: 'person-search', label: 'أفضل سائق', prompt: 'من أفضل سائق متاح حالياً لمشوار VIP؟' },
  { icon: 'insights', label: 'تقرير الإيرادات', prompt: 'قدم تقريراً مفصلاً عن الإيرادات والعمولات' },
  { icon: 'lightbulb', label: 'اقتراحات تحسين', prompt: 'ما هي اقتراحاتك لتحسين أداء المنصة وزيادة الأرباح؟' },
];

export default function AIAssistantScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'مرحباً! أنا المساعد الذكي لمنصة الشرق. يمكنني مساعدتك في تحليل بيانات المشاوير والسائقين، اقتراح أفضل السائقين، وتقديم تقارير ذكية. كيف أساعدك؟',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<any>(null);

  const handleSend = async (prompt?: string) => {
    const text = prompt || input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const result = await askAIAssistant(text);

    const aiMsg: ChatMsg = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: result.error ? `عذراً، حدث خطأ: ${result.error}` : result.reply || 'لم أتمكن من الإجابة',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const renderMessage = ({ item }: { item: ChatMsg }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowRight : styles.msgRowLeft]}>
        {!isUser ? (
          <View style={styles.aiAvatar}>
            <MaterialIcons name="smart-toy" size={18} color="#FFF" />
          </View>
        ) : null}
        <View style={[styles.msgBubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.msgText, isUser && { color: '#FFF' }]}>{item.content}</Text>
          <Text style={[styles.msgTime, isUser && { color: 'rgba(255,255,255,0.6)' }]}>
            {item.timestamp.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
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
          <View style={styles.aiHeaderIcon}>
            <MaterialIcons name="smart-toy" size={20} color="#FFF" />
          </View>
          <Text style={styles.headerTitle}>المساعد الذكي</Text>
        </View>
        <View style={{ width: 40 }} />
      </Animated.View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ flex: 1 }}>
          <FlashList
            ref={listRef}
            data={messages}
            renderItem={renderMessage}
            estimatedItemSize={100}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd?.({ animated: true })}
            ListFooterComponent={() => (
              <>
                {isLoading ? (
                  <View style={styles.loadingRow}>
                    <View style={styles.aiAvatar}>
                      <MaterialIcons name="smart-toy" size={18} color="#FFF" />
                    </View>
                    <View style={[styles.msgBubble, styles.aiBubble, { paddingVertical: 16 }]}>
                      <ActivityIndicator size="small" color={theme.primary} />
                    </View>
                  </View>
                ) : null}
                {messages.length <= 1 ? (
                  <View style={styles.quickSection}>
                    <Text style={styles.quickTitle}>اقتراحات سريعة</Text>
                    {QUICK_PROMPTS.map((qp, i) => (
                      <Pressable key={i} onPress={() => handleSend(qp.prompt)} style={styles.quickBtn}>
                        <MaterialIcons name={qp.icon as any} size={18} color={theme.primary} />
                        <Text style={styles.quickBtnText}>{qp.label}</Text>
                        <MaterialIcons name="chevron-left" size={18} color={theme.textMuted} />
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </>
            )}
          />
        </View>

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="اسأل المساعد الذكي..."
            placeholderTextColor={theme.textMuted}
            style={styles.input}
            multiline
            textAlign="right"
            editable={!isLoading}
          />
          <Pressable onPress={() => handleSend()} disabled={!input.trim() || isLoading} style={[styles.sendBtn, (!input.trim() || isLoading) && { opacity: 0.4 }]}>
            <MaterialIcons name="send" size={22} color="#FFF" style={{ transform: [{ rotate: '180deg' }] }} />
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
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface,
  },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiHeaderIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },

  msgRow: { marginBottom: 12 },
  msgRowRight: { alignItems: 'flex-end' },
  msgRowLeft: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  aiAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  msgBubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  userBubble: { backgroundColor: theme.primary, borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: theme.surface, borderBottomLeftRadius: 4, ...theme.shadow },
  msgText: { ...typography.body, writingDirection: 'rtl', textAlign: 'right', lineHeight: 24 },
  msgTime: { ...typography.smallLabel, textAlign: 'left', marginTop: 4 },
  loadingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },

  quickSection: { marginTop: 16, gap: 8 },
  quickTitle: { ...typography.captionBold, writingDirection: 'rtl', textAlign: 'right', marginBottom: 4 },
  quickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
    backgroundColor: theme.surface, borderRadius: theme.radiusMedium, ...theme.shadow,
  },
  quickBtnText: { ...typography.body, flex: 1, writingDirection: 'rtl', textAlign: 'right', fontWeight: '500' },

  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.surface,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 100, backgroundColor: theme.backgroundSecondary,
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: theme.textPrimary, writingDirection: 'rtl',
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
});
