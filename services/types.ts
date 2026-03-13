// Database-aligned types for the Al-Sharq Transport app

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  role: 'admin' | 'driver' | 'supervisor';
  full_name: string;
  phone?: string;
  nationality?: string;
  vehicle_type?: string;
  vehicle_plate?: string;
  car_model?: string;
  license_number?: string;
  driver_code?: string;
  status: 'available' | 'unavailable' | 'onTrip';
  rating: number;
  total_trips: number;
  is_active: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  level: number;
  bonuses: number;
  penalties: number;
  avatar_url?: string;
  push_token?: string;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  trip_number?: number;
  type: 'employee' | 'monthly' | 'delivery' | 'private';
  pickup_location: string;
  dropoff_location: string;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_lat?: number;
  dropoff_lng?: number;
  scheduled_time: string;
  scheduled_date: string;
  passengers: number;
  price: number;
  status: 'available' | 'accepted' | 'inProgress' | 'completed' | 'cancelled' | 'archived' | 'agreed' | 'confirmed';
  notes: string;
  driver_id?: string;
  created_by?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  city?: string;
  home_location?: string;
  work_location?: string;
  passenger_gender?: 'male' | 'female';
  work_days?: string;
  off_days?: string;
  departure_time?: string;
  return_time?: string;
  client_name?: string;
  client_phone?: string;
  payment_type?: 'prepaid' | 'deferred';
  commission_due_date?: string;
}

export interface Earning {
  id: string;
  trip_id: string;
  driver_id: string;
  total_amount: number;
  platform_commission: number;
  driver_earning: number;
  date: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'promo' | 'urgent';
  is_active: boolean;
  created_by?: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'admin' | 'driver';
  recipient_id?: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id?: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface TripApplication {
  id: string;
  trip_id: string;
  driver_id: string;
  driver_name: string;
  status: 'pending' | 'accepted' | 'rejected';
  admin_note: string;
  created_at: string;
  updated_at: string;
}

export interface BonusPenalty {
  id: string;
  driver_id: string;
  driver_name: string;
  amount: number;
  reason: string;
  type: 'bonus' | 'penalty';
  created_by?: string;
  created_at: string;
}

export interface CommissionPayment {
  id: string;
  trip_id: string;
  driver_id: string;
  amount: number;
  status: 'pending' | 'receipt_uploaded' | 'confirmed' | 'rejected';
  receipt_url?: string;
  confirmed_by?: string;
  confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  driver_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  driver_id: string;
  type: 'topup' | 'commission_deduction' | 'refund';
  amount: number;
  description: string;
  receipt_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  trip_id?: string;
  created_at: string;
}

// Conversation summary for admin chat list
export interface ConversationSummary {
  driverId: string;
  driverName: string;
  driverCode?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

// Helper functions
export const getTripTypeLabel = (type: Trip['type']): string => {
  const labels = { employee: 'توصيل موظفين', monthly: 'توصيل شهري', delivery: 'توصيل طلبات', private: 'مشوار خاص' };
  return labels[type] || type;
};

export const getTripStatusLabel = (status: Trip['status']): string => {
  const labels: Record<string, string> = { available: 'متاح', accepted: 'مقبول', inProgress: 'جارٍ التنفيذ', completed: 'مكتمل', cancelled: 'ملغي', archived: 'مؤرشف', agreed: 'تم الاتفاق', confirmed: 'تم الاتفاق' };
  return labels[status] || status;
};

export const getTripTypeIcon = (type: Trip['type']): string => {
  const icons = { employee: 'groups', monthly: 'event-repeat', delivery: 'local-shipping', private: 'person-pin-circle' };
  return icons[type] || 'local-taxi';
};

export const getStatusColor = (status: Trip['status']): string => {
  const colors: Record<string, string> = { available: '#60A5FA', accepted: '#FBBF24', inProgress: '#A78BFA', completed: '#34D399', cancelled: '#F87171', archived: '#64748B', agreed: '#34D399', confirmed: '#34D399' };
  return colors[status] || '#64748B';
};

export const getDriverLevelLabel = (level: number): string => {
  const levels: Record<number, string> = { 1: 'مبتدئ', 2: 'نشط', 3: 'متميز', 4: 'خبير', 5: 'نخبة' };
  return levels[level] || 'مبتدئ';
};

export const getDriverLevelColor = (level: number): string => {
  const colors: Record<number, string> = { 1: '#64748B', 2: '#60A5FA', 3: '#A78BFA', 4: '#FBBF24', 5: '#34D399' };
  return colors[level] || '#64748B';
};

export const getCommissionStatusLabel = (status: CommissionPayment['status']): string => {
  const labels = { pending: 'بانتظار التحويل', receipt_uploaded: 'بانتظار تأكيد الإدارة', confirmed: 'تم استلام العمولة', rejected: 'مرفوض' };
  return labels[status] || status;
};

export const getCommissionStatusColor = (status: CommissionPayment['status']): string => {
  const colors = { pending: '#FBBF24', receipt_uploaded: '#60A5FA', confirmed: '#34D399', rejected: '#F87171' };
  return colors[status] || '#64748B';
};

export const getWalletTransactionLabel = (type: WalletTransaction['type']): string => {
  const labels = { topup: 'شحن المحفظة', commission_deduction: 'خصم عمولة', refund: 'استرداد' };
  return labels[type] || type;
};

export const getWalletTransactionColor = (type: WalletTransaction['type']): string => {
  const colors = { topup: '#34D399', commission_deduction: '#F87171', refund: '#60A5FA' };
  return colors[type] || '#64748B';
};

export const formatTripNumber = (num?: number): string => {
  if (!num) return '';
  return `SH-${num}`;
};
