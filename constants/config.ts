export const config = {
  appName: 'الشرق درايفر',
  appNameEn: 'Al-Sharq Driver',
  version: '2.0.0',
  
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
  // Google Maps
  googleMapsKey: 'AIzaSyBgh-D-6VzxB1D-qn29iTAnGbGRUKjDMYs',

  // Pricing
  pricePerKm: 0.8,
  baseMonthlyPrice: 100,
  extraPassengerPercent: 15,

  tripTypes: {
    employee: 'توصيل موظفين',
    monthly: 'اشتراك شهري',
    delivery: 'توصيل طلبات',
    private: 'اشتراك شهري',
  } as const,
  
  // Contact
  email: 'ALSHARGDRIVES@GMAIL.COM',
  
  // Currency
  currency: 'ريال',

  // Roles
  roles: {
    admin: 'مدير',
    supervisor: 'مشرف',
    driver: 'كابتن',
    client: 'عميل',
  } as const,
};
