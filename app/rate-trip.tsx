import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAlert } from '@/template';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { theme, typography } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';

export default function RateTripScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { id: tripId } = useLocalSearchParams<{ id: string }>();
  const { getTripById, allDriversList } = useApp();
  const { user, userRole } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);

  const trip = getTripById(tripId || '');

  // Determine who we are rating
  const isDriver = userRole === 'driver';
  const ratedUserId = isDriver ? trip?.created_by : trip?.driver_id;
  const ratedUserName = isDriver
    ? (trip?.client_name || 'العميل')
    : (() => {
        const d = allDriversList.find(dr => dr.id === trip?.driver_id);
        return d?.full_name || d?.username || 'السائق';
      })();

  useEffect(() => {
    if (tripId && user?.id) {
      api.fetchRatingForTrip(tripId, user.id).then(existing => {
        if (existing) setAlreadyRated(true);
      });
    }
  }, [tripId, user?.id]);

  const handleSubmit = async () => {
    if (rating === 0) { showAlert('خطأ', 'يرجى اختيار التقييم'); return; }
    if (!tripId || !user?.id || !ratedUserId) { showAlert('خطأ', 'بيانات غير مكتملة'); return; }
    setLoading(true);
    const result = await api.createRating({
      trip_id: tripId,
      rater_id: user.id,
      rated_id: ratedUserId,
      rating,
      comment: comment.trim(),
      rater_role: isDriver ? 'driver' : 'client',
    });
    if (result.error) {
      showAlert('خطأ', result.error);
      setLoading(false);
      return;
    }
    // Update the rated user's average rating
    await api.updateUserRating(ratedUserId);
    setLoading(false);
    showAlert('شكراً لك', 'تم إرسال تقييمك بنجاح');
    router.back();
  };

  if (alreadyRated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>تقييم المشوار</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.alreadyRated}>
          <MaterialIcons name="check-circle" size={64} color={theme.success} />
          <Text style={styles.alreadyRatedText}>تم التقييم مسبقاً</Text>
          <Text style={styles.alreadyRatedSub}>لقد قمت بتقييم هذا المشوار بالفعل</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>تقييم المشوار</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.ratingCard}>
          {/* Target user */}
          <View style={styles.targetUser}>
            <View style={styles.targetAvatar}>
              <MaterialIcons name={isDriver ? 'person' : 'local-shipping'} size={36} color={theme.primary} />
            </View>
            <Text style={styles.targetName}>{ratedUserName}</Text>
            <Text style={styles.targetRole}>{isDriver ? 'تقييم العميل' : 'تقييم السائق'}</Text>
          </View>

          {/* Stars */}
          <Animated.View entering={FadeIn.duration(600).delay(200)} style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <Pressable key={star} onPress={() => setRating(star)} style={styles.starBtn}>
                <MaterialIcons
                  name={star <= rating ? 'star' : 'star-border'}
                  size={48}
                  color={star <= rating ? '#FBBF24' : theme.border}
                />
              </Pressable>
            ))}
          </Animated.View>
          <Text style={styles.ratingLabel}>
            {rating === 0 ? 'اضغط للتقييم' :
              rating === 1 ? 'سيء' : rating === 2 ? 'مقبول' :
              rating === 3 ? 'جيد' : rating === 4 ? 'ممتاز' : 'رائع'}
          </Text>

          {/* Comment */}
          <Animated.View entering={FadeInDown.duration(400).delay(300)}>
            <Text style={styles.commentLabel}>تعليق (اختياري)</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="اكتب تعليقك هنا..."
              placeholderTextColor={theme.textMuted}
              style={styles.commentInput}
              textAlign="right"
              multiline
              maxLength={200}
            />
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(400)}>
          <Pressable onPress={handleSubmit} disabled={loading || rating === 0} style={[styles.submitBtn, (loading || rating === 0) && { opacity: 0.5 }]}>
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <>
                <MaterialIcons name="send" size={20} color="#FFF" />
                <Text style={styles.submitBtnText}>إرسال التقييم</Text>
              </>
            )}
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.subtitle, writingDirection: 'rtl' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },

  ratingCard: { backgroundColor: theme.surface, borderRadius: theme.radiusXL, padding: 28, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
  targetUser: { alignItems: 'center', marginBottom: 28 },
  targetAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.primary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  targetName: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  targetRole: { fontSize: 13, color: theme.textMuted, marginTop: 4, writingDirection: 'rtl' },

  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  starBtn: { padding: 4 },
  ratingLabel: { fontSize: 16, fontWeight: '600', color: theme.accent, marginBottom: 28, writingDirection: 'rtl' },

  commentLabel: { fontSize: 13, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl', textAlign: 'right', marginBottom: 8 },
  commentInput: { width: '100%', backgroundColor: theme.surfaceElevated, borderWidth: 1.5, borderColor: theme.border, borderRadius: theme.radiusMedium, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: theme.textPrimary, writingDirection: 'rtl', minHeight: 80, textAlignVertical: 'top' },

  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.accent, paddingVertical: 16, borderRadius: theme.radiusMedium, marginTop: 24 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  alreadyRated: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  alreadyRatedText: { fontSize: 20, fontWeight: '700', color: theme.success, writingDirection: 'rtl' },
  alreadyRatedSub: { fontSize: 14, color: theme.textMuted, writingDirection: 'rtl' },
});
