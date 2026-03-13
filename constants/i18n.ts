// Multi-language support for Al-Sharq Transport
// Statuses are stored as English codes in DB — only display labels are translated

export type Language = 'ar' | 'en' | 'ur';

export const LANGUAGES: { id: Language; label: string; nativeLabel: string }[] = [
  { id: 'ar', label: 'العربية', nativeLabel: 'العربية' },
  { id: 'en', label: 'English', nativeLabel: 'English' },
  { id: 'ur', label: 'اردو', nativeLabel: 'اردو' },
];

type TranslationKeys = {
  // General
  appName: string;
  home: string;
  myTrips: string;
  earnings: string;
  more: string;
  settings: string;
  back: string;
  cancel: string;
  confirm: string;
  save: string;
  delete: string;
  close: string;
  loading: string;
  error: string;
  success: string;
  ok: string;
  yes: string;
  no: string;
  search: string;
  noData: string;
  retry: string;

  // Auth
  login: string;
  logout: string;
  logoutConfirm: string;
  email: string;
  password: string;
  register: string;

  // Trip statuses
  statusAvailable: string;
  statusAccepted: string;
  statusInProgress: string;
  statusCompleted: string;
  statusCancelled: string;
  statusArchived: string;
  statusConfirmed: string;

  // Trip types
  typeEmployee: string;
  typeMonthly: string;
  typeDelivery: string;
  typePrivate: string;

  // Trip actions
  acceptTrip: string;
  startTrip: string;
  endTrip: string;
  cancelTrip: string;
  newTrip: string;
  tripDetails: string;
  tripConfirmAccept: string;
  netEarning: string;
  tripBooked: string;
  tripBookedMsg: string;
  viewMap: string;
  clientInfo: string;
  clientInfoHidden: string;
  clientInfoAfterApproval: string;

  // Driver
  available: string;
  unavailable: string;
  onTrip: string;
  availableForTrips: string;
  notAvailable: string;
  driverProfile: string;
  vehicleInfo: string;
  drivingLicense: string;
  totalTrips: string;
  rating: string;
  level: string;
  wallet: string;

  // Earnings
  totalEarnings: string;
  todayEarnings: string;
  weekEarnings: string;
  monthEarnings: string;
  tripFare: string;
  platformCommission: string;
  driverEarning: string;
  currency: string;

  // Chat & Notifications
  chat: string;
  chatWithAdmin: string;
  notifications: string;
  tripHistory: string;
  announcements: string;

  // More / Support
  account: string;
  general: string;
  support: string;
  contactUs: string;
  aboutApp: string;
  version: string;
  language: string;
  changeLanguage: string;
  contactAdmin: string;
  contactViaWhatsApp: string;
  contactDriver: string;

  // Summary
  dailySummary: string;
  completedTrips: string;
  activeTrips: string;
  availableTripsCount: string;

  // Passengers
  passengers: string;
  waitingApproval: string;
  applicationSent: string;
  applicationWaiting: string;
};

const ar: TranslationKeys = {
  appName: 'الشرق للنقل والتوصيل',
  home: 'الرئيسية',
  myTrips: 'مشاويري',
  earnings: 'الأرباح',
  more: 'المزيد',
  settings: 'الإعدادات',
  back: 'رجوع',
  cancel: 'إلغاء',
  confirm: 'تأكيد',
  save: 'حفظ',
  delete: 'حذف',
  close: 'إغلاق',
  loading: 'جاري التحميل...',
  error: 'خطأ',
  success: 'تم بنجاح',
  ok: 'حسناً',
  yes: 'نعم',
  no: 'لا',
  search: 'بحث',
  noData: 'لا توجد بيانات',
  retry: 'إعادة المحاولة',

  login: 'تسجيل الدخول',
  logout: 'تسجيل الخروج',
  logoutConfirm: 'هل أنت متأكد من تسجيل الخروج؟',
  email: 'البريد الإلكتروني',
  password: 'كلمة المرور',
  register: 'تسجيل جديد',

  statusAvailable: 'متاح',
  statusAccepted: 'مقبول',
  statusInProgress: 'جارٍ التنفيذ',
  statusCompleted: 'مكتمل',
  statusCancelled: 'ملغي',
  statusArchived: 'مؤرشف',
  statusConfirmed: 'تم الاتفاق',

  typeEmployee: 'توصيل موظفين',
  typeMonthly: 'توصيل شهري',
  typeDelivery: 'توصيل طلبات',
  typePrivate: 'مشوار خاص',

  acceptTrip: 'قبول المشوار',
  startTrip: 'بدء المشوار',
  endTrip: 'إنهاء المشوار',
  cancelTrip: 'إلغاء المشوار',
  newTrip: 'مشوار جديد',
  tripDetails: 'تفاصيل المشوار',
  tripConfirmAccept: 'هل أنت متأكد من قبول هذا المشوار؟',
  netEarning: 'صافي ربحك',
  tripBooked: 'تم حجز المشوار',
  tripBookedMsg: 'تم حجز المشوار بنجاح.',
  viewMap: 'عرض الخريطة',
  clientInfo: 'بيانات العميل',
  clientInfoHidden: 'بيانات العميل مخفية',
  clientInfoAfterApproval: 'سيتم عرضها بعد اعتماد الإدارة',

  available: 'متاح',
  unavailable: 'غير متاح',
  onTrip: 'في مشوار',
  availableForTrips: 'متاح لاستقبال المشاوير',
  notAvailable: 'غير متاح حالياً',
  driverProfile: 'الملف الشخصي',
  vehicleInfo: 'بيانات المركبة',
  drivingLicense: 'رخصة القيادة',
  totalTrips: 'مشاوير',
  rating: 'التقييم',
  level: 'المستوى',
  wallet: 'المحفظة',

  totalEarnings: 'إجمالي الأرباح',
  todayEarnings: 'أرباح اليوم',
  weekEarnings: 'أرباح الأسبوع',
  monthEarnings: 'أرباح الشهر',
  tripFare: 'قيمة المشوار',
  platformCommission: 'عمولة المنصة (10%)',
  driverEarning: 'صافي الربح (90%)',
  currency: 'ر.س',

  chat: 'المحادثة',
  chatWithAdmin: 'المحادثة مع الإدارة',
  notifications: 'الإشعارات',
  tripHistory: 'سجل المشاوير',
  announcements: 'الإعلانات',

  account: 'الحساب',
  general: 'عام',
  support: 'الدعم',
  contactUs: 'تواصل معنا',
  aboutApp: 'عن الشرق',
  version: 'الإصدار',
  language: 'اللغة',
  changeLanguage: 'تغيير اللغة',
  contactAdmin: 'تواصل مع الإدارة',
  contactViaWhatsApp: 'واتساب الإدارة',
  contactDriver: 'تواصل مع السائق',

  dailySummary: 'ملخص اليوم',
  completedTrips: 'مشوار مكتمل',
  activeTrips: 'نشط',
  availableTripsCount: 'متاح',

  passengers: 'ركاب',
  waitingApproval: 'بانتظار الموافقة',
  applicationSent: 'تم إرسال طلبك',
  applicationWaiting: 'بانتظار موافقة الإدارة لتعيينك لهذا المشوار',
};

const en: TranslationKeys = {
  appName: 'Al-Sharq Transport',
  home: 'Home',
  myTrips: 'My Trips',
  earnings: 'Earnings',
  more: 'More',
  settings: 'Settings',
  back: 'Back',
  cancel: 'Cancel',
  confirm: 'Confirm',
  save: 'Save',
  delete: 'Delete',
  close: 'Close',
  loading: 'Loading...',
  error: 'Error',
  success: 'Success',
  ok: 'OK',
  yes: 'Yes',
  no: 'No',
  search: 'Search',
  noData: 'No data',
  retry: 'Retry',

  login: 'Login',
  logout: 'Logout',
  logoutConfirm: 'Are you sure you want to logout?',
  email: 'Email',
  password: 'Password',
  register: 'Register',

  statusAvailable: 'Available',
  statusAccepted: 'Accepted',
  statusInProgress: 'In Progress',
  statusCompleted: 'Completed',
  statusCancelled: 'Cancelled',
  statusArchived: 'Archived',
  statusConfirmed: 'Confirmed',

  typeEmployee: 'Employee Transport',
  typeMonthly: 'Monthly Transport',
  typeDelivery: 'Delivery',
  typePrivate: 'Private Trip',

  acceptTrip: 'Accept Trip',
  startTrip: 'Start Trip',
  endTrip: 'End Trip',
  cancelTrip: 'Cancel Trip',
  newTrip: 'New Trip',
  tripDetails: 'Trip Details',
  tripConfirmAccept: 'Are you sure you want to accept this trip?',
  netEarning: 'Your net earning',
  tripBooked: 'Trip Booked',
  tripBookedMsg: 'Trip booked successfully.',
  viewMap: 'View Map',
  clientInfo: 'Client Info',
  clientInfoHidden: 'Client info is hidden',
  clientInfoAfterApproval: 'Will be shown after admin approval',

  available: 'Available',
  unavailable: 'Unavailable',
  onTrip: 'On Trip',
  availableForTrips: 'Available for trips',
  notAvailable: 'Currently unavailable',
  driverProfile: 'Profile',
  vehicleInfo: 'Vehicle Info',
  drivingLicense: 'Driving License',
  totalTrips: 'Trips',
  rating: 'Rating',
  level: 'Level',
  wallet: 'Wallet',

  totalEarnings: 'Total Earnings',
  todayEarnings: 'Today',
  weekEarnings: 'This Week',
  monthEarnings: 'This Month',
  tripFare: 'Trip Fare',
  platformCommission: 'Platform Commission (10%)',
  driverEarning: 'Net Earning (90%)',
  currency: 'SAR',

  chat: 'Chat',
  chatWithAdmin: 'Chat with Admin',
  notifications: 'Notifications',
  tripHistory: 'Trip History',
  announcements: 'Announcements',

  account: 'Account',
  general: 'General',
  support: 'Support',
  contactUs: 'Contact Us',
  aboutApp: 'About Al-Sharq',
  version: 'Version',
  language: 'Language',
  changeLanguage: 'Change Language',
  contactAdmin: 'Contact Admin',
  contactViaWhatsApp: 'WhatsApp Admin',
  contactDriver: 'Contact Driver',

  dailySummary: 'Daily Summary',
  completedTrips: 'Completed',
  activeTrips: 'Active',
  availableTripsCount: 'Available',

  passengers: 'Passengers',
  waitingApproval: 'Waiting for approval',
  applicationSent: 'Application sent',
  applicationWaiting: 'Waiting for admin to assign you to this trip',
};

const ur: TranslationKeys = {
  appName: 'الشرق ٹرانسپورٹ',
  home: 'ہوم',
  myTrips: 'میری سواریاں',
  earnings: 'کمائی',
  more: 'مزید',
  settings: 'ترتیبات',
  back: 'واپس',
  cancel: 'منسوخ',
  confirm: 'تصدیق',
  save: 'محفوظ کریں',
  delete: 'حذف کریں',
  close: 'بند کریں',
  loading: 'لوڈ ہو رہا ہے...',
  error: 'خرابی',
  success: 'کامیاب',
  ok: 'ٹھیک ہے',
  yes: 'ہاں',
  no: 'نہیں',
  search: 'تلاش',
  noData: 'کوئی ڈیٹا نہیں',
  retry: 'دوبارہ کوشش',

  login: 'لاگ ان',
  logout: 'لاگ آؤٹ',
  logoutConfirm: 'کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟',
  email: 'ای میل',
  password: 'پاسورڈ',
  register: 'رجسٹر',

  statusAvailable: 'دستیاب',
  statusAccepted: 'قبول',
  statusInProgress: 'جاری',
  statusCompleted: 'مکمل',
  statusCancelled: 'منسوخ',
  statusArchived: 'آرکائیو',
  statusConfirmed: 'تصدیق شدہ',

  typeEmployee: 'ملازمین کی ترسیل',
  typeMonthly: 'ماہانہ ترسیل',
  typeDelivery: 'ڈیلیوری',
  typePrivate: 'ذاتی سواری',

  acceptTrip: 'سواری قبول کریں',
  startTrip: 'سواری شروع کریں',
  endTrip: 'سواری ختم کریں',
  cancelTrip: 'سواری منسوخ کریں',
  newTrip: 'نئی سواری',
  tripDetails: 'سواری کی تفصیلات',
  tripConfirmAccept: 'کیا آپ واقعی یہ سواری قبول کرنا چاہتے ہیں؟',
  netEarning: 'آپ کی خالص کمائی',
  tripBooked: 'سواری بک ہو گئی',
  tripBookedMsg: 'سواری کامیابی سے بک ہو گئی۔',
  viewMap: 'نقشہ دیکھیں',
  clientInfo: 'کلائنٹ کی معلومات',
  clientInfoHidden: 'کلائنٹ کی معلومات چھپی ہوئی ہیں',
  clientInfoAfterApproval: 'ایڈمن کی منظوری کے بعد دکھائی جائیں گی',

  available: 'دستیاب',
  unavailable: 'غیر دستیاب',
  onTrip: 'سواری پر',
  availableForTrips: 'سواریوں کے لیے دستیاب',
  notAvailable: 'فی الحال دستیاب نہیں',
  driverProfile: 'پروفائل',
  vehicleInfo: 'گاڑی کی معلومات',
  drivingLicense: 'ڈرائیونگ لائسنس',
  totalTrips: 'سواریاں',
  rating: 'درجہ بندی',
  level: 'سطح',
  wallet: 'والیٹ',

  totalEarnings: 'کل کمائی',
  todayEarnings: 'آج کی کمائی',
  weekEarnings: 'ہفتے کی کمائی',
  monthEarnings: 'مہینے کی کمائی',
  tripFare: 'سواری کا کرایہ',
  platformCommission: 'پلیٹ فارم کمیشن (10%)',
  driverEarning: 'خالص کمائی (90%)',
  currency: 'ر.س',

  chat: 'چیٹ',
  chatWithAdmin: 'ایڈمن سے چیٹ',
  notifications: 'اطلاعات',
  tripHistory: 'سواری کی تاریخ',
  announcements: 'اعلانات',

  account: 'اکاؤنٹ',
  general: 'عام',
  support: 'سپورٹ',
  contactUs: 'ہم سے رابطہ کریں',
  aboutApp: 'الشرق کے بارے میں',
  version: 'ورژن',
  language: 'زبان',
  changeLanguage: 'زبان تبدیل کریں',
  contactAdmin: 'ایڈمن سے رابطہ',
  contactViaWhatsApp: 'ایڈمن واٹس ایپ',
  contactDriver: 'ڈرائیور سے رابطہ',

  dailySummary: 'آج کا خلاصہ',
  completedTrips: 'مکمل',
  activeTrips: 'فعال',
  availableTripsCount: 'دستیاب',

  passengers: 'مسافر',
  waitingApproval: 'منظوری کا انتظار',
  applicationSent: 'درخواست بھیج دی گئی',
  applicationWaiting: 'ایڈمن کی منظوری کا انتظار',
};

const translations: Record<Language, TranslationKeys> = { ar, en, ur };

export function getTranslations(lang: Language): TranslationKeys {
  return translations[lang] || translations.ar;
}

// Localized helper functions that respect language
export function getLocalizedTripStatus(status: string, lang: Language): string {
  const t = getTranslations(lang);
  const map: Record<string, string> = {
    available: t.statusAvailable,
    accepted: t.statusAccepted,
    inProgress: t.statusInProgress,
    completed: t.statusCompleted,
    cancelled: t.statusCancelled,
    archived: t.statusArchived,
    agreed: t.statusConfirmed,
    confirmed: t.statusConfirmed,
  };
  return map[status] || status;
}

export function getLocalizedTripType(type: string, lang: Language): string {
  const t = getTranslations(lang);
  const map: Record<string, string> = {
    employee: t.typeEmployee,
    monthly: t.typeMonthly,
    delivery: t.typeDelivery,
    private: t.typePrivate,
  };
  return map[type] || type;
}

export function getLocalizedDriverStatus(status: string, lang: Language): string {
  const t = getTranslations(lang);
  const map: Record<string, string> = {
    available: t.available,
    unavailable: t.unavailable,
    onTrip: t.onTrip,
  };
  return map[status] || status;
}

// WhatsApp admin number (Saudi format)
export const ADMIN_WHATSAPP = '966569559088';
