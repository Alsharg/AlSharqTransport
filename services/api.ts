import { getSupabaseClient } from '@/template';
import {
  Trip, Earning, Announcement, Message as AppMessage, Notification as AppNotification,
  BonusPenalty, UserProfile, TripApplication, CommissionPayment, Wallet, WalletTransaction,
} from './types';
import { decode } from 'base64-arraybuffer';

const supabase = getSupabaseClient();

// ===== Auth =====
export async function signUpUser(email: string, password: string, metadata: Record<string, string>) {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: metadata } });
  if (error) return { user: null, error: error.message };
  return { user: data.user, error: null };
}

export async function sendOTPEmail(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) return { error: error.message };
  return { error: null };
}

export async function verifyOTPAndLogin(email: string, otp: string, password?: string) {
  const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
  if (error) return { user: null, error: error.message };
  if (password && data.user) { await supabase.auth.updateUser({ password }); }
  return { user: data.user, error: null };
}

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { user: null, error: error.message };
  return { user: data.user, error: null };
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  return { error: error?.message || null };
}

// ===== User Profiles =====
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from('user_profiles').select('*').eq('id', userId).single();
  if (error) return null;
  return data;
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase.from('user_profiles').update(updates).eq('id', userId).select().single();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function fetchAllProfiles(role?: string): Promise<UserProfile[]> {
  let query = supabase.from('user_profiles').select('*');
  if (role) query = query.eq('role', role);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

// ===== Push Token =====
export async function savePushToken(userId: string, token: string) {
  const { error } = await supabase.from('user_profiles').update({ push_token: token }).eq('id', userId);
  return { error: error?.message || null };
}

export async function sendPushToUser(userId: string, title: string, body: string) {
  try {
    const { data } = await supabase.from('user_profiles').select('push_token').eq('id', userId).single();
    if (data?.push_token) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: data.push_token, title, body, sound: 'default' }),
      });
    }
  } catch (e) { console.error('Push send error:', e); }
}

export async function sendPushToAllDrivers(title: string, body: string) {
  try {
    const { data } = await supabase.from('user_profiles').select('push_token').eq('role', 'driver').eq('is_active', true).eq('approval_status', 'approved').not('push_token', 'is', null);
    if (data && data.length > 0) {
      const tokens = data.map((d: any) => d.push_token).filter(Boolean);
      // Send in batches of 100
      for (let i = 0; i < tokens.length; i += 100) {
        const batch = tokens.slice(i, i + 100).map((token: string) => ({ to: token, title, body, sound: 'default' }));
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batch),
        });
      }
    }
  } catch (e) { console.error('Push broadcast error:', e); }
}

export async function sendPushToAdmins(title: string, body: string) {
  try {
    const { data } = await supabase.from('user_profiles').select('push_token').in('role', ['admin', 'supervisor']).not('push_token', 'is', null);
    if (data && data.length > 0) {
      const tokens = data.map((d: any) => d.push_token).filter(Boolean);
      for (let i = 0; i < tokens.length; i += 100) {
        const batch = tokens.slice(i, i + 100).map((token: string) => ({ to: token, title, body, sound: 'default' }));
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batch),
        });
      }
    }
  } catch (e) { console.error('Push admin error:', e); }
}

// ===== Trips =====
export async function fetchTrips(): Promise<Trip[]> {
  const { data, error } = await supabase.from('trips').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function createTrip(trip: Omit<Trip, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Trip | null; error: string | null }> {
  const { data, error } = await supabase.from('trips').insert(trip).select().single();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function updateTrip(tripId: string, updates: Partial<Trip>) {
  const { data, error } = await supabase.from('trips').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', tripId).select().single();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function deleteTrip(tripId: string) {
  const { error } = await supabase.from('trips').delete().eq('id', tripId);
  return { error: error?.message || null };
}

// ===== Earnings =====
export async function fetchEarnings(driverId?: string): Promise<Earning[]> {
  let query = supabase.from('earnings').select('*');
  if (driverId) query = query.eq('driver_id', driverId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function createEarning(earning: Omit<Earning, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('earnings').insert(earning).select().single();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ===== Announcements =====
export async function fetchAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function createAnnouncement(ann: Omit<Announcement, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('announcements').insert(ann).select().single();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function updateAnnouncement(id: string, updates: Partial<Announcement>) {
  const { error } = await supabase.from('announcements').update(updates).eq('id', id);
  return { error: error?.message || null };
}

export async function deleteAnnouncement(id: string) {
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  return { error: error?.message || null };
}

// ===== Messages =====
export async function fetchMessages(): Promise<AppMessage[]> {
  const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
  if (error) return [];
  return data || [];
}

export async function fetchConversationMessages(userId1: string, userId2: string): Promise<AppMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${userId1},recipient_id.eq.${userId2}),and(sender_id.eq.${userId2},recipient_id.eq.${userId1})`)
    .order('created_at', { ascending: true });
  if (error) return [];
  return data || [];
}

export async function fetchDriverMessages(driverId: string): Promise<AppMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${driverId},recipient_id.eq.${driverId}`)
    .order('created_at', { ascending: true });
  if (error) return [];
  return data || [];
}

export async function sendMessageDB(msg: Omit<AppMessage, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('messages').insert(msg).select().single();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function markConversationRead(senderId: string, recipientId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('sender_id', senderId)
    .eq('recipient_id', recipientId)
    .eq('is_read', false);
  return { error: error?.message || null };
}

// ===== Notifications =====
export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function markNotificationReadDB(id: string) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  return { error: error?.message || null };
}

export async function createNotification(notif: Omit<AppNotification, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('notifications').insert(notif).select().single();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function notifyAllActiveDrivers(title: string, body: string, type: string) {
  const drivers = await fetchAllProfiles('driver');
  const active = drivers.filter(d => d.is_active && d.approval_status === 'approved');
  for (const driver of active) {
    await createNotification({ user_id: driver.id, title, body, type, is_read: false });
  }
  // Also send push notifications
  sendPushToAllDrivers(title, body);
}

export async function notifyAdmins(title: string, body: string, type: string) {
  const admins = await fetchAllProfiles('admin');
  const supervisors = await fetchAllProfiles('supervisor');
  for (const admin of [...admins, ...supervisors]) {
    await createNotification({ user_id: admin.id, title, body, type, is_read: false });
  }
  // Also send push notifications
  sendPushToAdmins(title, body);
}

// ===== Bonus/Penalties =====
export async function fetchBonusPenalties(): Promise<BonusPenalty[]> {
  const { data, error } = await supabase.from('bonus_penalties').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function createBonusPenalty(bp: Omit<BonusPenalty, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('bonus_penalties').insert(bp).select().single();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ===== Trip Applications =====
export async function fetchTripApplications(tripId?: string): Promise<TripApplication[]> {
  let query = supabase.from('trip_applications').select('*');
  if (tripId) query = query.eq('trip_id', tripId);
  const { data, error } = await query.order('created_at', { ascending: true });
  if (error) return [];
  return data || [];
}

export async function applyForTrip(application: { trip_id: string; driver_id: string; driver_name: string }) {
  const { data, error } = await supabase.from('trip_applications').insert({ ...application, status: 'pending' }).select().single();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function withdrawApplication(tripId: string, driverId: string) {
  const { error } = await supabase.from('trip_applications').delete().eq('trip_id', tripId).eq('driver_id', driverId);
  return { error: error?.message || null };
}

export async function updateApplicationStatus(applicationId: string, status: string, adminNote?: string) {
  const updates: any = { status, updated_at: new Date().toISOString() };
  if (adminNote !== undefined) updates.admin_note = adminNote;
  const { data, error } = await supabase.from('trip_applications').update(updates).eq('id', applicationId).select().single();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function rejectAllApplications(tripId: string, exceptDriverId?: string) {
  let query = supabase.from('trip_applications').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('trip_id', tripId).eq('status', 'pending');
  if (exceptDriverId) query = query.neq('driver_id', exceptDriverId);
  const { error } = await query;
  return { error: error?.message || null };
}

// ===== Commission Payments =====
export async function fetchCommissionPayments(): Promise<CommissionPayment[]> {
  const { data, error } = await supabase.from('commission_payments').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function createCommissionPayment(payment: { trip_id: string; driver_id: string; amount: number }) {
  const { data, error } = await supabase.from('commission_payments').insert({ ...payment, status: 'pending' }).select().single();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function uploadReceiptImage(driverId: string, tripId: string, base64Data: string, fileExt: string) {
  const filePath = `${driverId}/${tripId}_${Date.now()}.${fileExt}`;
  const { data, error } = await supabase.storage.from('receipts').upload(filePath, decode(base64Data), { contentType: `image/${fileExt}`, upsert: true });
  if (error) return { url: null, error: error.message };
  const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(data.path);
  return { url: urlData.publicUrl, error: null };
}

export async function updateCommissionPayment(paymentId: string, updates: Partial<CommissionPayment>) {
  const { data, error } = await supabase.from('commission_payments').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', paymentId).select().single();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ===== Wallet =====
export async function fetchWallet(driverId: string): Promise<Wallet | null> {
  const { data, error } = await supabase.from('wallets').select('*').eq('driver_id', driverId).single();
  if (error) return null;
  return data;
}

export async function createWallet(driverId: string): Promise<Wallet | null> {
  const { data, error } = await supabase.from('wallets').insert({ driver_id: driverId, balance: 0 }).select().single();
  if (error) return null;
  return data;
}

export async function getOrCreateWallet(driverId: string): Promise<Wallet | null> {
  let wallet = await fetchWallet(driverId);
  if (!wallet) wallet = await createWallet(driverId);
  return wallet;
}

export async function updateWalletBalance(walletId: string, newBalance: number) {
  const { data, error } = await supabase.from('wallets').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', walletId).select().single();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function fetchWalletTransactions(driverId: string): Promise<WalletTransaction[]> {
  const { data, error } = await supabase.from('wallet_transactions').select('*').eq('driver_id', driverId).order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function fetchAllWalletTransactions(): Promise<WalletTransaction[]> {
  const { data, error } = await supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function createWalletTransaction(tx: Omit<WalletTransaction, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('wallet_transactions').insert(tx).select().single();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function updateWalletTransaction(txId: string, updates: Partial<WalletTransaction>) {
  const { data, error } = await supabase.from('wallet_transactions').update(updates).eq('id', txId).select().single();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function uploadWalletReceipt(driverId: string, base64Data: string, fileExt: string) {
  const filePath = `wallet/${driverId}/topup_${Date.now()}.${fileExt}`;
  const { data, error } = await supabase.storage.from('receipts').upload(filePath, decode(base64Data), { contentType: `image/${fileExt}`, upsert: true });
  if (error) return { url: null, error: error.message };
  const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(data.path);
  return { url: urlData.publicUrl, error: null };
}

// ===== AI Assistant =====
export async function askAIAssistant(prompt: string, context?: string) {
  const { data, error } = await supabase.functions.invoke('ai-trip-assistant', { body: { prompt, context } });
  if (error) {
    const { FunctionsHttpError } = await import('@supabase/supabase-js');
    let errorMessage = error.message;
    if (error instanceof FunctionsHttpError) {
      try { const textContent = await error.context?.text(); errorMessage = textContent || error.message; } catch { errorMessage = error.message; }
    }
    return { reply: null, error: errorMessage };
  }
  return { reply: data?.reply || null, stats: data?.stats || null, error: null };
}
