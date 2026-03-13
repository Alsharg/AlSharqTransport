export const config = {
  appName: 'الشرق للنقل والتوصيل',
  appNameEn: 'Al-Sharq Transport',
  version: '1.0.0',
  
  // Commission System
  platformCommissionRate: 0.10, // 10%
  driverShareRate: 0.90, // 90%
  
  // Trip statuses
  tripStatuses: {
    available: 'متاح',
    accepted: 'مقبول',
    inProgress: 'جارٍ التنفيذ',
    completed: 'مكتمل',
    cancelled: 'ملغي',
  } as const,
  
  // Driver statuses
  driverStatuses: {
    available: 'متاح',
    unavailable: 'غير متاح',
    onTrip: 'في مشوار',
  } as const,
  
  // Trip types
  tripTypes: {
    employee: 'توصيل موظفين',
    monthly: 'توصيل شهري',
    delivery: 'توصيل طلبات',
    private: 'مشوار خاص',
  } as const,
  
  // Contact
  email: 'ALSHARGDRIVES@GMAIL.COM',
  
  // Currency
  currency: 'ريال',
};
