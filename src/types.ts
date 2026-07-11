/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SocialLink {
  id: string;
  name: string;
  url: string;
  icon: string;
}

export interface SystemSettings {
  centerName: string;
  logo: string;
  logoMini: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  mapLocation: string; // embedded map or coordinate url
  socialX: string;
  socialInstagram: string;
  socialSnapchat: string;
  socialTikTok: string;
  socialYouTube: string;
  seoTitle: string;
  seoDesc: string;
  seoKeywords: string;
  socialLinks?: SocialLink[];
  whatsappApi: {
    accessToken: string;
    phoneNumberId: string;
    businessAccountId: string;
    webhookUrl: string;
  };
  mainCover?: string;
  mainCoverOpacity?: number; // 0 to 100
  headerSlogan?: string;
  footerDescription?: string;
  copyrightText?: string;
  heroBadge?: string;
  heroDescription?: string;
  introTitle?: string;
  introDescription?: string;
  headerSloganColor?: string;
  headerSloganHide?: boolean;
  copyrightTextColor?: string;
  copyrightTextHide?: boolean;
  heroBadgeColor?: string;
  heroBadgeHide?: boolean;
  footerDescriptionColor?: string;
  footerDescriptionHide?: boolean;
  heroDescriptionColor?: string;
  heroDescriptionHide?: boolean;
  introTitleColor?: string;
  introTitleHide?: boolean;
  introDescriptionColor?: string;
  introDescriptionHide?: boolean;
  centerNameHeaderColor?: string;
  centerNameHeaderHide?: boolean;
  centerNameHeroColor?: string;
  centerNameHeroHide?: boolean;
  centerNameFooterColor?: string;
  centerNameFooterHide?: boolean;
  centerNameHighlightType?: "none" | "marker" | "shadow" | "badge";
  centerNameHighlightColor?: string;
  feature1Title?: string;
  feature1Desc?: string;
  feature2Title?: string;
  feature2Desc?: string;
  feature3Title?: string;
  feature3Desc?: string;
}

export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  buttonBg: string;
  buttonText: string;
  headingColor: string;
  textColor: string;
  bgColor: string;
  navBg: string;
  footerBg: string;
  cardBg: string;
  borderColor: string;
  inputBg: string;
  currentPreset: string;
  imageOpacity?: number; // 0 to 100
}

export interface FontSettings {
  primaryFont: "Tajawal" | "Cairo" | "Noto Kufi Arabic" | "IBM Plex Sans Arabic";
  headingFont: "Tajawal" | "Cairo" | "Noto Kufi Arabic" | "IBM Plex Sans Arabic";
  textFont: "Tajawal" | "Cairo" | "Noto Kufi Arabic" | "IBM Plex Sans Arabic";
  titleSize: string; // e.g. "text-3xl"
  textSize: string;  // e.g. "text-base"
  fontWeight: string; // e.g. "font-medium"
}

export interface BoardMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string;
  order: number;
}

export interface CouncilsData {
  previous: BoardMember[];
  current: BoardMember[];
  introText: string;
}

export interface ReferencePage {
  content: string; // Markdown/HTML
  images: string[];
  files: Array<{ name: string; url: string; size: string }>;
  links: string[];
}

export interface SubProgram {
  id: string;
  title: string;
  description: string;
  images: string[];
  files: Array<{ name: string; url: string; size: string }>;
  links: string[];
  isHidden: boolean;
  order: number;
  date?: string; // YYYY-MM-DD
  timeFrom?: string; // HH:MM
  timeTo?: string; // HH:MM
  location?: string; // Location of the subprogram / event
  seatsEnabled?: boolean;
  seatsTotal?: number;
  seatsRemaining?: number;
  registrations?: EventRegistration[];
}

export interface MainProgram {
  id: string;
  name: string;
  image: string;
  description: string;
  subPrograms: SubProgram[];
}

export interface MemberProfile {
  id: string; // AA1234
  tripleName: string;
  phone: string;
  email?: string;
  birthDate: string;
  calendarType: "hijri" | "gregorian";
  gender: "male" | "female";
  status: "active" | "pending" | "expired";
  photo?: string; // Base64 or placeholder
  createdAt: string;
  qrCodeUrl: string;
  expiryDate?: string;
}

export interface EventRegistration {
  memberId: string;
  name: string;
  phone: string;
  status: "pending" | "approved" | "rejected";
  registeredAt: string;
}

export interface EventItem {
  id: string;
  title: string;
  image: string;
  shortDesc: string;
  fullDesc: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;
  location: string;
  mapUrl: string;
  seatsTotal: number;
  seatsRemaining: number;
  status: "open" | "closed";
  registrations: EventRegistration[];
}

export interface GalleryPhoto {
  id: string;
  url: string;
  description: string;
  order: number;
}

export interface GalleryAlbum {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  photos: GalleryPhoto[];
  order: number;
}

export interface SurveyQuestion {
  id: string;
  type: "mcq" | "text";
  questionText: string;
  options?: string[]; // for mcq
}

export interface SurveyResponse {
  voterId: string; // memberId
  answers: { [questionId: string]: string };
  submittedAt: string;
}

export interface SurveyItem {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  questions: SurveyQuestion[];
  responses: SurveyResponse[];
  votesCount: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  scheduledAt: string;
  targetGroup: "all" | "active" | "event" | "specific";
  targetEventId?: string;
  sent: boolean;
  sentCount: number;
  whatsappTemplateId: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  passwordHash: string; // simple hashed password or salt
  role: "admin" | "content_manager" | "member_manager" | "event_manager";
}

export interface AdminLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  timestamp: string;
}

export interface DbSchema {
  settings: SystemSettings;
  themeSettings: ThemeSettings;
  fontSettings: FontSettings;
  councils: CouncilsData;
  reference: ReferencePage;
  programs: MainProgram[];
  members: MemberProfile[];
  events: EventItem[];
  gallery: GalleryAlbum[];
  surveys: SurveyItem[];
  notifications: NotificationItem[];
  faqs: FAQItem[];
  admins: AdminUser[];
  logs: AdminLog[];
  backups: Array<{ id: string; date: string; type: string; size: string; filename: string }>;
}
