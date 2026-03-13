import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Trip, Earning, Announcement, Message, Notification, BonusPenalty, UserProfile, TripApplication, CommissionPayment, Wallet, WalletTransaction } from '../services/types';
import * as api from '../services/api';
import { AuthContext } from './AuthContext';
import { config } from '../constants/config';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface AppContextType {
  profile: UserProfile | null;
  trips: Trip[];
  availableTrips: Trip[];
  myTrips: Trip[];
  activeTrips: Trip[];
  completedTrips: Trip[];
  loadTrips: () => Promise<void>;
  startTrip: (tripId: string) => Promise<void>;
  completeTrip: (tripId: string) => Promise<void>;
  cancelTrip: (tripId: string) => Promise<void>;
  createTrip: (trip: any) => Promise<{ error: string | null }>;
  updateTrip: (tripId: string, updates: any) => Promise<{ error: string | null }>;
  deleteTrip: (tripId: string) => Promise<{ error: string | null }>;
  archiveTrip: (tripId: string) => Promise<void>;
  confirmTrip: (tripId: string, driverId: string) => Promise<{ error: string | null }>;
  getTripById: (tripId: string) => Trip | undefined;
  earnings: Earning[];
  totalEarnings: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  platformTotalEarnings: number;
  allDriversEarnings: number;
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  unreadMessages: number;
  loadMessages: () => Promise<void>;
  notifications: Notification[];
  unreadNotifications: number;
  markNotificationRead: (id: string) => Promise<void>;
  allDriversList: UserProfile[];
  loadDrivers: () => Promise<void>;
  toggleDriverActive: (driverId: string) => Promise<void>;
  approveDriver: (driverId: string) => Promise<void>;
  rejectDriver: (driverId: string) => Promise<void>;
  announcements: Announcement[];
  loadAnnouncements: () => Promise<void>;
  addAnnouncement: (ann: any) => Promise<{ error: string | null }>;
  removeAnnouncement: (id: string) => Promise<void>;
  toggleAnnouncement: (id: string) => Promise<void>;
  bonusPenalties: BonusPenalty[];
  addBonusPenalty: (bp: any) => Promise<{ error: string | null }>;
  tripApplications: TripApplication[];
  applyForTrip: (tripId: string) => Promise<{ error: string | null }>;
  withdrawApplication: (tripId: string) => Promise<{ error: string | null }>;
  getApplicationsForTrip: (tripId: string) => TripApplication[];
  getMyApplication: (tripId: string) => TripApplication | undefined;
  assignDriverToTrip: (tripId: string, driverId: string, applicationId: string) => Promise<{ error: string | null }>;
  loadApplications: () => Promise<void>;
  wallet: Wallet | null;
  walletTransactions: WalletTransaction[];
  loadWallet: () => Promise<void>;
  topUpWallet: (amount: number, base64Data: string, fileExt: string) => Promise<{ error: string | null }>;
  allWalletTransactions: WalletTransaction[];
  loadAllWalletTransactions: () => Promise<void>;
  approveTopUp: (txId: string, driverId: string, amount: number) => Promise<{ error: string | null }>;
  rejectTopUp: (txId: string) => Promise<{ error: string | null }>;
  acceptTripDirectly: (tripId: string) => Promise<{ error: string | null }>;
  commissionPayments: CommissionPayment[];
  loadCommissionPayments: () => Promise<void>;
  getCommissionForTrip: (tripId: string) => CommissionPayment | undefined;
  uploadReceipt: (tripId: string, base64Data: string, fileExt: string) => Promise<{ error: string | null }>;
  confirmCommission: (paymentId: string) => Promise<{ error: string | null }>;
  rejectCommission: (paymentId: string) => Promise<{ error: string | null }>;
  setDriverStatus: (status: string) => Promise<void>;
  isDataLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

async function registerForPushNotifications(userId: string) {
  try {
    if (!Device.isDevice) return;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: undefined as any });
    const token = tokenData.data;
    if (token) {
      await api.savePushToken(userId, token);
    }
  } catch (e) {
    console.error('Push registration error:', e);
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const authContext = useContext(AuthContext);
  const userId = authContext?.user?.id;
  const profile = authContext?.user || null;

  const [trips, setTrips] = useState<Trip[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [allDriversList, setAllDriversList] = useState<UserProfile[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [bonusPenalties, setBonusPenalties] = useState<BonusPenalty[]>([]);
  const [tripApplications, setTripApplications] = useState<TripApplication[]>([]);
  const [commissionPayments, setCommissionPayments] = useState<CommissionPayment[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [allWalletTransactions, setAllWalletTransactions] = useState<WalletTransaction[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadAllData();
      registerForPushNotifications(userId);
    }
  }, [userId]);

  const loadAllData = useCallback(async () => {
    if (!userId) return;
    setIsDataLoading(true);
    try {
      const [tripsData, earningsData, msgsData, notifsData, annsData, bpData, appsData, commissionsData] = await Promise.all([
        api.fetchTrips(), api.fetchEarnings(), api.fetchMessages(),
        api.fetchNotifications(userId), api.fetchAnnouncements(),
        api.fetchBonusPenalties(), api.fetchTripApplications(), api.fetchCommissionPayments(),
      ]);
      setTrips(tripsData); setEarnings(earningsData); setMessages(msgsData);
      setNotifications(notifsData); setAnnouncements(annsData);
      setBonusPenalties(bpData); setTripApplications(appsData);
      setCommissionPayments(commissionsData);

      if (profile?.role === 'driver') {
        const w = await api.getOrCreateWallet(userId);
        setWallet(w);
        const txs = await api.fetchWalletTransactions(userId);
        setWalletTransactions(txs);
      }

      if (profile?.role === 'admin' || profile?.role === 'supervisor') {
        const drivers = await api.fetchAllProfiles('driver');
        setAllDriversList(drivers);
        const allTxs = await api.fetchAllWalletTransactions();
        setAllWalletTransactions(allTxs);
      }
    } catch (e) { console.error('Load data error:', e); }
    setIsDataLoading(false);
  }, [userId, profile?.role]);

  const loadTrips = useCallback(async () => { setTrips(await api.fetchTrips()); }, []);
  const loadMessages = useCallback(async () => { setMessages(await api.fetchMessages()); }, []);
  const loadAnnouncements = useCallback(async () => { setAnnouncements(await api.fetchAnnouncements()); }, []);
  const loadDrivers = useCallback(async () => { setAllDriversList(await api.fetchAllProfiles('driver')); }, []);
  const loadCommissionPayments = useCallback(async () => { setCommissionPayments(await api.fetchCommissionPayments()); }, []);
  const loadApplications = useCallback(async () => { setTripApplications(await api.fetchTripApplications()); }, []);

  const loadWallet = useCallback(async () => {
    if (!userId) return;
    const w = await api.getOrCreateWallet(userId);
    setWallet(w);
    const txs = await api.fetchWalletTransactions(userId);
    setWalletTransactions(txs);
  }, [userId]);

  const loadAllWalletTransactions = useCallback(async () => {
    const allTxs = await api.fetchAllWalletTransactions();
    setAllWalletTransactions(allTxs);
  }, []);

  // For drivers: filter out confirmed/agreed trips assigned to OTHER drivers
  const availableTrips = trips.filter(t => {
    if (t.status === 'available') return true;
    return false;
  });

  const myTrips = trips.filter(t => t.driver_id === userId);
  const activeTrips = myTrips.filter(t => t.status === 'accepted' || t.status === 'inProgress' || t.status === 'agreed' || t.status === 'confirmed');
  const completedTrips = myTrips.filter(t => t.status === 'completed');

  const myEarnings = earnings.filter(e => e.driver_id === userId);
  const totalEarnings = myEarnings.reduce((s, e) => s + Number(e.driver_earning), 0);
  const today = new Date().toISOString().split('T')[0];
  const todayEarnings = myEarnings.filter(e => e.date === today).reduce((s, e) => s + Number(e.driver_earning), 0);
  const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekEarnings = myEarnings.filter(e => new Date(e.date) >= oneWeekAgo).reduce((s, e) => s + Number(e.driver_earning), 0);
  const oneMonthAgo = new Date(); oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
  const monthEarnings = myEarnings.filter(e => new Date(e.date) >= oneMonthAgo).reduce((s, e) => s + Number(e.driver_earning), 0);
  const platformTotalEarnings = earnings.reduce((s, e) => s + Number(e.platform_commission), 0);
  const allDriversEarnings = earnings.reduce((s, e) => s + Number(e.driver_earning), 0);
  const unreadMessages = messages.filter(m => !m.is_read && m.sender_role === 'admin').length;
  const unreadNotifications = notifications.filter(n => !n.is_read).length;

  const getTripById = useCallback((tripId: string) => trips.find(t => t.id === tripId), [trips]);

  const startTrip = useCallback(async (tripId: string) => {
    const result = await api.updateTrip(tripId, { status: 'inProgress' });
    if (!result.error) { setTrips(prev => prev.map(t => t.id === tripId ? { ...t, status: 'inProgress' as const } : t)); }
  }, []);

  const completeTrip = useCallback(async (tripId: string) => {
    if (!userId) return;
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;
    const result = await api.updateTrip(tripId, { status: 'completed', completed_at: new Date().toISOString() });
    if (!result.error) {
      setTrips(prev => prev.map(t => t.id === tripId ? { ...t, status: 'completed' as const } : t));
      const newEarning = {
        trip_id: tripId, driver_id: userId, total_amount: trip.price,
        platform_commission: trip.price * config.platformCommissionRate,
        driver_earning: trip.price * config.driverShareRate, date: today,
      };
      const earningResult = await api.createEarning(newEarning);
      if (earningResult.data) { setEarnings(prev => [earningResult.data!, ...prev]); }
      await api.updateUserProfile(userId, { status: 'available', total_trips: (profile?.total_trips || 0) + 1 });
    }
  }, [userId, trips, profile, today]);

  const cancelTrip = useCallback(async (tripId: string) => {
    if (!userId) return;
    const result = await api.updateTrip(tripId, { status: 'cancelled' });
    if (!result.error) {
      setTrips(prev => prev.map(t => t.id === tripId ? { ...t, status: 'cancelled' as const } : t));
      const trip = trips.find(t => t.id === tripId);
      if (trip?.driver_id === userId) { await api.updateUserProfile(userId, { status: 'available' }); }
    }
  }, [userId, trips]);

  const createTripAction = useCallback(async (tripData: any) => {
    const result = await api.createTrip({ ...tripData, status: 'available', created_by: userId });
    if (result.data) {
      setTrips(prev => [result.data!, ...prev]);
      await api.notifyAllActiveDrivers(
        'مشوار جديد متاح',
        `مشوار جديد: ${tripData.pickup_location} \u2192 ${tripData.dropoff_location}\nالسعر: ${tripData.price} ر.س | الموعد: ${tripData.scheduled_date} - ${tripData.scheduled_time}`,
        'trip_new'
      );
      return { error: null };
    }
    return { error: result.error };
  }, [userId]);

  const updateTripAction = useCallback(async (tripId: string, updates: any) => {
    const result = await api.updateTrip(tripId, updates);
    if (!result.error) { setTrips(prev => prev.map(t => t.id === tripId ? { ...t, ...updates } : t)); return { error: null }; }
    return { error: result.error };
  }, []);

  const deleteTripAction = useCallback(async (tripId: string) => {
    const result = await api.deleteTrip(tripId);
    if (!result.error) { setTrips(prev => prev.filter(t => t.id !== tripId)); return { error: null }; }
    return { error: result.error };
  }, []);

  const archiveTrip = useCallback(async (tripId: string) => {
    await api.updateTrip(tripId, { status: 'archived' });
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, status: 'archived' as const } : t));
  }, []);

  // Admin: Confirm trip (تم الاتفاق) — set status to confirmed and assign driver
  const confirmTrip = useCallback(async (tripId: string, driverId: string) => {
    const result = await api.updateTrip(tripId, { status: 'confirmed', driver_id: driverId });
    if (result.error) return { error: result.error };
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, status: 'confirmed' as const, driver_id: driverId } : t));

    // Notify the assigned driver
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      await api.createNotification({
        user_id: driverId,
        title: 'تم الاتفاق على مشوار',
        body: `تم تأكيد المشوار: ${trip.pickup_location} \u2192 ${trip.dropoff_location}\nالسعر: ${trip.price} ر.س`,
        type: 'trip_confirmed', is_read: false,
      });
      api.sendPushToUser(driverId, 'تم الاتفاق على مشوار', `المشوار: ${trip.pickup_location} \u2192 ${trip.dropoff_location}`);
    }
    return { error: null };
  }, [trips]);

  const sendMessageAction = useCallback(async (content: string) => {
    if (!userId || !profile) return;
    const msg = { sender_id: userId, sender_name: profile.full_name || profile.username || 'مستخدم', sender_role: profile.role === 'driver' ? 'driver' as const : 'admin' as const, content, is_read: false };
    const result = await api.sendMessageDB(msg);
    if (result.data) { setMessages(prev => [...prev, result.data!]); }
  }, [userId, profile]);

  const markNotificationRead = useCallback(async (id: string) => {
    await api.markNotificationReadDB(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }, []);

  const toggleDriverActive = useCallback(async (driverId: string) => {
    const driver = allDriversList.find(d => d.id === driverId);
    if (!driver) return;
    await api.updateUserProfile(driverId, { is_active: !driver.is_active, status: driver.is_active ? 'unavailable' : 'available' });
    setAllDriversList(prev => prev.map(d => d.id === driverId ? { ...d, is_active: !d.is_active } : d));
  }, [allDriversList]);

  const approveDriver = useCallback(async (driverId: string) => {
    await api.updateUserProfile(driverId, { approval_status: 'approved', is_active: true });
    setAllDriversList(prev => prev.map(d => d.id === driverId ? { ...d, approval_status: 'approved' as const, is_active: true } : d));
    await api.createNotification({ user_id: driverId, title: 'تم قبول طلبك', body: 'تم قبول طلب التسجيل. يمكنك الآن تسجيل الدخول واستقبال المشاوير.', type: 'approval', is_read: false });
    api.sendPushToUser(driverId, 'تم قبول طلبك', 'يمكنك الآن تسجيل الدخول واستقبال المشاوير.');
    await api.getOrCreateWallet(driverId);
  }, []);

  const rejectDriver = useCallback(async (driverId: string) => {
    await api.updateUserProfile(driverId, { approval_status: 'rejected', is_active: false });
    setAllDriversList(prev => prev.map(d => d.id === driverId ? { ...d, approval_status: 'rejected' as const, is_active: false } : d));
    await api.createNotification({ user_id: driverId, title: 'تم رفض طلبك', body: 'تم رفض طلب التسجيل. تواصل مع الإدارة لمزيد من المعلومات.', type: 'approval', is_read: false });
  }, []);

  const addAnnouncement = useCallback(async (ann: any) => {
    const result = await api.createAnnouncement({ ...ann, created_by: userId });
    if (result.data) { setAnnouncements(prev => [result.data!, ...prev]); return { error: null }; }
    return { error: result.error };
  }, [userId]);

  const removeAnnouncement = useCallback(async (id: string) => {
    await api.deleteAnnouncement(id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  }, []);

  const toggleAnnouncement = useCallback(async (id: string) => {
    const ann = announcements.find(a => a.id === id);
    if (!ann) return;
    await api.updateAnnouncement(id, { is_active: !ann.is_active });
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_active: !a.is_active } : a));
  }, [announcements]);

  const addBonusPenalty = useCallback(async (bp: any) => {
    const result = await api.createBonusPenalty({ ...bp, created_by: userId });
    if (result.data) {
      setBonusPenalties(prev => [result.data!, ...prev]);
      const driver = allDriversList.find(d => d.id === bp.driver_id);
      if (driver) {
        const update = bp.type === 'bonus' ? { bonuses: Number(driver.bonuses) + bp.amount } : { penalties: Number(driver.penalties) + bp.amount };
        await api.updateUserProfile(bp.driver_id, update);
      }
      return { error: null };
    }
    return { error: result.error };
  }, [userId, allDriversList]);

  const getApplicationsForTrip = useCallback((tripId: string) => tripApplications.filter(a => a.trip_id === tripId), [tripApplications]);
  const getMyApplication = useCallback((tripId: string) => tripApplications.find(a => a.trip_id === tripId && a.driver_id === userId), [tripApplications, userId]);

  const applyForTripAction = useCallback(async (tripId: string) => {
    if (!userId || !profile) return { error: 'غير مسجل الدخول' };
    const result = await api.applyForTrip({ trip_id: tripId, driver_id: userId, driver_name: profile.full_name || profile.username || 'سائق' });
    if (result.data) {
      setTripApplications(prev => [...prev, result.data!]);
      return { error: null };
    }
    return { error: result.error };
  }, [userId, profile]);

  const withdrawApplicationAction = useCallback(async (tripId: string) => {
    if (!userId) return { error: 'غير مسجل الدخول' };
    const result = await api.withdrawApplication(tripId, userId);
    if (!result.error) { setTripApplications(prev => prev.filter(a => !(a.trip_id === tripId && a.driver_id === userId))); return { error: null }; }
    return { error: result.error };
  }, [userId]);

  // Direct trip acceptance — NO wallet balance check
  const acceptTripDirectly = useCallback(async (tripId: string) => {
    if (!userId || !profile) return { error: 'غير مسجل الدخول' };
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return { error: 'المشوار غير موجود' };
    if (trip.status !== 'available') return { error: 'المشوار محجوز بالفعل' };

    // Assign the trip directly — no wallet check
    const tripResult = await api.updateTrip(tripId, { status: 'accepted', driver_id: userId });
    if (tripResult.error) return { error: tripResult.error };

    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, status: 'accepted' as const, driver_id: userId } : t));
    await api.updateUserProfile(userId, { status: 'onTrip' });

    // Notify admins
    await api.notifyAdmins(
      'تم حجز مشوار',
      `${profile.full_name || profile.username} حجز المشوار: ${trip.pickup_location} \u2192 ${trip.dropoff_location}`,
      'trip_accepted'
    );

    return { error: null };
  }, [userId, profile, trips]);

  const assignDriverToTrip = useCallback(async (tripId: string, driverId: string, applicationId: string) => {
    const appResult = await api.updateApplicationStatus(applicationId, 'accepted');
    if (appResult.error) return { error: appResult.error };
    await api.rejectAllApplications(tripId, driverId);
    const tripResult = await api.updateTrip(tripId, { status: 'accepted', driver_id: driverId });
    if (tripResult.error) return { error: tripResult.error };

    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, status: 'accepted' as const, driver_id: driverId } : t));
    setTripApplications(prev => prev.map(a => {
      if (a.trip_id === tripId && a.id === applicationId) return { ...a, status: 'accepted' as const };
      if (a.trip_id === tripId && a.status === 'pending') return { ...a, status: 'rejected' as const };
      return a;
    }));

    await api.updateUserProfile(driverId, { status: 'onTrip' });

    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      const commission = trip.price * config.platformCommissionRate;
      await api.createNotification({
        user_id: driverId, title: 'تم تعيينك لمشوار جديد',
        body: `المشوار: ${trip.pickup_location} \u2192 ${trip.dropoff_location}\nالسعر: ${trip.price} ر.س`,
        type: 'trip_accepted', is_read: false,
      });
      api.sendPushToUser(driverId, 'تم تعيينك لمشوار جديد', `السعر: ${trip.price} ر.س`);
    }

    const rejectedApps = tripApplications.filter(a => a.trip_id === tripId && a.driver_id !== driverId && a.status === 'pending');
    for (const app of rejectedApps) {
      await api.createNotification({ user_id: app.driver_id, title: 'تم تعيين سائق آخر', body: 'تم اختيار سائق آخر للمشوار. شكرا لاهتمامك.', type: 'general', is_read: false });
    }
    return { error: null };
  }, [trips, tripApplications]);

  const getCommissionForTrip = useCallback((tripId: string) => commissionPayments.find(c => c.trip_id === tripId), [commissionPayments]);

  const uploadReceipt = useCallback(async (tripId: string, base64Data: string, fileExt: string) => {
    if (!userId) return { error: 'غير مسجل الدخول' };
    const uploadResult = await api.uploadReceiptImage(userId, tripId, base64Data, fileExt);
    if (uploadResult.error) return { error: uploadResult.error };
    const payment = commissionPayments.find(c => c.trip_id === tripId && c.driver_id === userId);
    if (!payment) return { error: 'لم يتم العثور على سجل العمولة' };
    const updateResult = await api.updateCommissionPayment(payment.id, { status: 'receipt_uploaded', receipt_url: uploadResult.url! });
    if (updateResult.error) return { error: updateResult.error };
    setCommissionPayments(prev => prev.map(c => c.id === payment.id ? { ...c, status: 'receipt_uploaded' as const, receipt_url: uploadResult.url! } : c));
    await api.notifyAdmins('إيصال تحويل جديد', `${profile?.full_name || 'سائق'} رفع إيصال تحويل العمولة للمشوار. يرجى المراجعة والتأكيد.`, 'general');
    return { error: null };
  }, [userId, commissionPayments, profile]);

  const confirmCommission = useCallback(async (paymentId: string) => {
    if (!userId) return { error: 'غير مسجل الدخول' };
    const result = await api.updateCommissionPayment(paymentId, { status: 'confirmed', confirmed_by: userId, confirmed_at: new Date().toISOString() });
    if (result.error) return { error: result.error };
    const payment = commissionPayments.find(c => c.id === paymentId);
    setCommissionPayments(prev => prev.map(c => c.id === paymentId ? { ...c, status: 'confirmed' as const, confirmed_by: userId, confirmed_at: new Date().toISOString() } : c));
    if (payment) {
      await api.createNotification({ user_id: payment.driver_id, title: 'تم تأكيد استلام العمولة', body: 'تم تأكيد استلام العمولة بنجاح.', type: 'general', is_read: false });
      api.sendPushToUser(payment.driver_id, 'تم تأكيد استلام العمولة', 'تم تأكيد استلام العمولة بنجاح.');
    }
    return { error: null };
  }, [userId, commissionPayments]);

  const rejectCommission = useCallback(async (paymentId: string) => {
    if (!userId) return { error: 'غير مسجل الدخول' };
    const result = await api.updateCommissionPayment(paymentId, { status: 'rejected' });
    if (result.error) return { error: result.error };
    const payment = commissionPayments.find(c => c.id === paymentId);
    setCommissionPayments(prev => prev.map(c => c.id === paymentId ? { ...c, status: 'rejected' as const } : c));
    if (payment) {
      await api.createNotification({ user_id: payment.driver_id, title: 'تم رفض إيصال التحويل', body: 'تم رفض إيصال التحويل. يرجى إعادة التحويل ورفع إيصال صحيح.', type: 'general', is_read: false });
    }
    return { error: null };
  }, [userId, commissionPayments]);

  // Wallet top-up
  const topUpWallet = useCallback(async (amount: number, base64Data: string, fileExt: string) => {
    if (!userId || !wallet) return { error: 'غير مسجل الدخول' };
    const uploadResult = await api.uploadWalletReceipt(userId, base64Data, fileExt);
    if (uploadResult.error) return { error: uploadResult.error };
    const txResult = await api.createWalletTransaction({
      wallet_id: wallet.id, driver_id: userId, type: 'topup',
      amount, description: `شحن المحفظة بمبلغ ${amount} ر.س`,
      receipt_url: uploadResult.url!, status: 'pending',
    });
    if (txResult.error) return { error: txResult.error };
    setWalletTransactions(prev => [txResult.data!, ...prev]);
    await api.notifyAdmins('طلب شحن محفظة', `${profile?.full_name || 'سائق'} طلب شحن المحفظة بمبلغ ${amount} ر.س. يرجى مراجعة الإيصال.`, 'general');
    return { error: null };
  }, [userId, wallet, profile]);

  const approveTopUp = useCallback(async (txId: string, driverId: string, amount: number) => {
    if (!userId) return { error: 'غير مسجل الدخول' };
    const result = await api.updateWalletTransaction(txId, { status: 'approved', reviewed_by: userId, reviewed_at: new Date().toISOString() });
    if (result.error) return { error: result.error };
    const driverWallet = await api.getOrCreateWallet(driverId);
    if (driverWallet) {
      const newBal = Number(driverWallet.balance) + amount;
      await api.updateWalletBalance(driverWallet.id, newBal);
    }
    setAllWalletTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'approved' as const } : t));
    await api.createNotification({ user_id: driverId, title: 'تم اعتماد شحن المحفظة', body: `تم اعتماد شحن المحفظة بمبلغ ${amount} ر.س. رصيدك الحالي محدث.`, type: 'general', is_read: false });
    api.sendPushToUser(driverId, 'تم اعتماد شحن المحفظة', `تم اعتماد شحن المحفظة بمبلغ ${amount} ر.س.`);
    return { error: null };
  }, [userId]);

  const rejectTopUp = useCallback(async (txId: string) => {
    if (!userId) return { error: 'غير مسجل الدخول' };
    const tx = allWalletTransactions.find(t => t.id === txId);
    const result = await api.updateWalletTransaction(txId, { status: 'rejected', reviewed_by: userId, reviewed_at: new Date().toISOString() });
    if (result.error) return { error: result.error };
    setAllWalletTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'rejected' as const } : t));
    if (tx) {
      await api.createNotification({ user_id: tx.driver_id, title: 'تم رفض طلب شحن المحفظة', body: 'تم رفض إيصال شحن المحفظة. يرجى إعادة التحويل ورفع إيصال صحيح.', type: 'general', is_read: false });
    }
    return { error: null };
  }, [userId, allWalletTransactions]);

  const setDriverStatus = useCallback(async (status: string) => {
    if (!userId) return;
    await api.updateUserProfile(userId, { status });
    authContext?.refreshProfile?.();
  }, [userId, authContext]);

  return (
    <AppContext.Provider value={{
      profile, trips, availableTrips, myTrips, activeTrips, completedTrips,
      loadTrips, startTrip, completeTrip, cancelTrip,
      createTrip: createTripAction, updateTrip: updateTripAction, deleteTrip: deleteTripAction, archiveTrip, confirmTrip, getTripById,
      earnings, totalEarnings, todayEarnings, weekEarnings, monthEarnings, platformTotalEarnings, allDriversEarnings,
      messages, sendMessage: sendMessageAction, unreadMessages, loadMessages,
      notifications, unreadNotifications, markNotificationRead,
      allDriversList, loadDrivers, toggleDriverActive, approveDriver, rejectDriver,
      announcements, loadAnnouncements, addAnnouncement, removeAnnouncement, toggleAnnouncement,
      bonusPenalties, addBonusPenalty,
      tripApplications, applyForTrip: applyForTripAction, withdrawApplication: withdrawApplicationAction,
      getApplicationsForTrip, getMyApplication, assignDriverToTrip, loadApplications,
      wallet, walletTransactions, loadWallet, topUpWallet,
      allWalletTransactions, loadAllWalletTransactions, approveTopUp, rejectTopUp,
      acceptTripDirectly,
      commissionPayments, loadCommissionPayments, getCommissionForTrip,
      uploadReceipt, confirmCommission, rejectCommission,
      setDriverStatus, isDataLoading,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
