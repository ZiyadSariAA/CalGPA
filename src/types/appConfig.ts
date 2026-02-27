export type BannerType = 'text' | 'image';

export type AppConfig = {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  minAppVersion: string;
  cvEnabled: boolean;
  bannerEnabled: boolean;
  bannerType: BannerType;
  bannerText: string;
  bannerBgColor: string;
  bannerTextColor: string;
  bannerImageUrl: string;
  bannerImagePath: string;
  bannerLink: string;
  rateIosLink: string;
  rateAndroidLink: string;
  aiDailyLimit: number;
};

export const DEFAULT_APP_CONFIG: AppConfig = {
  maintenanceMode: false,
  maintenanceMessage: '',
  minAppVersion: '1.0.0',
  cvEnabled: true,
  bannerEnabled: false,
  bannerType: 'text',
  bannerText: '',
  bannerBgColor: '#2D5A3D',
  bannerTextColor: '#FFFFFF',
  bannerImageUrl: '',
  bannerImagePath: '',
  bannerLink: '',
  rateIosLink: '',
  rateAndroidLink: '',
  aiDailyLimit: 0,
};
