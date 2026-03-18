// Database-aligned types for the Al-Sharq Transport app
// Supports 4 roles: admin, supervisor, driver, client

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  role: 'admin' | 'driver' | 'supervisor' | 'client';
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

export interface Client {
  id: string;
  user_id: string;
  company_name?: string;
  address?: string;
  preferred_driver_id?: string;
  notes?: string;
  contract_type?: 'monthly' | 'daily' | 'yearly';
  contract_start?: string;
  contract_end?: string;
  is_blocked: boolean;
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
  sender_role: 'admin' | 'driver' | 'client';
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

export interface Rating {
  id: string;
  trip_id: string;
  rater_id: string;
  rated_id: string;
  rating: number;
  comment?: string;
  rater_role: 'client' | 'driver' | 'admin';
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_name: string;
  actor_role: string;
  action: string;
  target_type: string;
  target_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface PricingConfig {
  id: string;
  name: string;
  base_price: number;
  price_per_km: number;
  surge_multiplier: number;
  min_price: number;
  city?: string;
  trip_type?: string;
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  title: string;
  type: 'employment' | 'client' | 'service';
  user_id: string;
  client_id?: string;
  content?: string;
  status: 'draft' | 'active' | 'expired' | 'terminated';
  start_date?: string;
  end_date?: string;
  monthly_amount?: number;
  signed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role: string;
  permission: string;
  is_allowed: boolean;
  created_at: string;
}

// Conversation summary for chat
export interface ConversationSummary {
  driverId: string;
  driverName: string;
  driverCode?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

// ===== Helper Functions =====

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
  const colors: Record<string, string> = { available: '#3B82F6', accepted: '#F59E0B', inProgress: '#8B5CF6', completed: '#22C55E', cancelled: '#EF4444', archived: '#64748B', agreed: '#14B8A6', confirmed: '#14B8A6' };
  return colors[status] || '#64748B';
};

export const getDriverLevelLabel = (level: number): string => {
  const levels: Record<number, string> = { 1: 'مبتدئ', 2: 'نشط', 3: 'متميز', 4: 'خبير', 5: 'نخبة' };
  return levels[level] || 'مبتدئ';
};

export const getDriverLevelColor = (level: number): string => {
  const colors: Record<number, string> = { 1: '#64748B', 2: '#3B82F6', 3: '#8B5CF6', 4: '#F59E0B', 5: '#22C55E' };
  return colors[level] || '#64748B';
};

export const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = { admin: 'مدير', supervisor: 'مشرف', driver: 'كابتن', client: 'عميل' };
  return labels[role] || role;
};

export const getRoleColor = (role: string): string => {
  const colors: Record<string, string> = { admin: '#D4A017', supervisor: '#3B82F6', driver: '#22C55E', client: '#8B5CF6' };
  return colors[role] || '#64748B';
};

export const getCommissionStatusLabel = (status: CommissionPayment['status']): string => {
  const labels = { pending: 'بانتظار التحويل', receipt_uploaded: 'بانتظار تأكيد الإدارة', confirmed: 'تم استلام العمولة', rejected: 'مرفوض' };
  return labels[status] || status;
};

export const getCommissionStatusColor = (status: CommissionPayment['status']): string => {
  const colors = { pending: '#F59E0B', receipt_uploaded: '#3B82F6', confirmed: '#22C55E', rejected: '#EF4444' };
  return colors[status] || '#64748B';
};

export const formatTripNumber = (num?: number): string => {
  if (!num) return '';
  return `SH-${num}`;
};

export const getContractStatusLabel = (status: string): string => {
  const labels: Record<string, string> = { draft: 'مسودة', active: 'نشط', expired: 'منتهي', terminated: 'ملغي' };
  return labels[status] || status;
};

export const getContractStatusColor = (status: string): string => {
  const colors: Record<string, string> = { draft: '#64748B', active: '#22C55E', expired: '#F59E0B', terminated: '#EF4444' };
  return colors[status] || '#64748B';
};
