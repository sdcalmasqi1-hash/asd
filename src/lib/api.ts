/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DbSchema, MemberProfile, EventItem, MainProgram, FAQItem, SystemSettings, ThemeSettings, FontSettings, CouncilsData, ReferencePage, GalleryAlbum, SurveyItem, NotificationItem, AdminUser, AdminLog } from "../types";

const API_BASE = (import.meta as any).env?.VITE_API_URL || "/api";

/** Official public website URL — QR codes always use this, never localhost */
export const DEFAULT_PUBLIC_SITE_URL = "https://almasqi-sac.onrender.com";

// Dynamic Theme Applicator Helper
export function applyThemeAndFonts(theme: ThemeSettings, fonts: FontSettings, isDark?: boolean) {
  const root = document.documentElement;
  
  const isDarkMode = isDark ?? (localStorage.getItem("darkMode") === "true");
  
  // Colors
  if (isDarkMode) {
    root.style.setProperty("--primary-color", theme.primaryColor);
    root.style.setProperty("--secondary-color", "#e2e8f0");
    root.style.setProperty("--button-bg", theme.buttonBg);
    root.style.setProperty("--button-text", theme.buttonText);
    root.style.setProperty("--heading-color", "#ffffff");
    root.style.setProperty("--text-color", "#cbd5e1");
    root.style.setProperty("--bg-color", "#0a0a0a");
    root.style.setProperty("--nav-bg", "#141414");
    root.style.setProperty("--footer-bg", "#080808");
    root.style.setProperty("--card-bg", "#141414");
    root.style.setProperty("--border-color", "#262626");
    root.style.setProperty("--input-bg", "#141414");
  } else {
    root.style.setProperty("--primary-color", theme.primaryColor);
    root.style.setProperty("--secondary-color", theme.secondaryColor);
    root.style.setProperty("--button-bg", theme.buttonBg);
    root.style.setProperty("--button-text", theme.buttonText);
    root.style.setProperty("--heading-color", theme.headingColor);
    root.style.setProperty("--text-color", theme.textColor);
    root.style.setProperty("--bg-color", theme.bgColor);
    root.style.setProperty("--nav-bg", theme.navBg);
    root.style.setProperty("--footer-bg", theme.footerBg);
    root.style.setProperty("--card-bg", theme.cardBg);
    root.style.setProperty("--border-color", theme.borderColor);
    root.style.setProperty("--input-bg", theme.inputBg);
  }
  
  // Image Opacity
  const opacityVal = theme.imageOpacity !== undefined ? theme.imageOpacity : 100;
  root.style.setProperty("--image-opacity", (opacityVal / 100).toString());
  
  // Fonts family mapping
  const fontMap = {
    "Cairo": "'Cairo', sans-serif",
    "Tajawal": "'Tajawal', sans-serif",
    "Noto Kufi Arabic": "'Noto Kufi Arabic', sans-serif",
    "IBM Plex Sans Arabic": "'IBM Plex Sans Arabic', sans-serif"
  };
  
  root.style.setProperty("--primary-font", fontMap[fonts.primaryFont] || fontMap["Cairo"]);
  root.style.setProperty("--heading-font", fontMap[fonts.headingFont] || fontMap["Cairo"]);
  root.style.setProperty("--text-font", fontMap[fonts.textFont] || fontMap["Cairo"]);
}

/** Public site URL for QR codes & sharing */
export function getPublicSiteOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    const origin = window.location.origin.replace(/\/$/, "");
    const isLocal =
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin) ||
      origin.startsWith("file:");
    if (!isLocal) {
      return origin;
    }
  }
  const envUrl = (import.meta as any).env?.VITE_PUBLIC_SITE_URL as string | undefined;
  if (envUrl) return envUrl.replace(/\/$/, "");
  return DEFAULT_PUBLIC_SITE_URL;
}

/** Current browser origin (may be localhost during development) */
export function getSiteOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return getPublicSiteOrigin();
}

export type MembershipCardQrData = Pick<
  MemberProfile,
  "id" | "tripleName" | "status" | "expiryDate" | "gender"
>;

/** Verification URL for QR codes — query format works on all hosts without special routing */
export function buildMembershipVerifyUrl(memberId: string): string {
  const base = getPublicSiteOrigin();
  const id = memberId.trim().toUpperCase();
  return `${base}/?tab=memberships&member=${encodeURIComponent(id)}`;
}

/** Short share link (optional) */
export function buildMembershipShortUrl(memberId: string): string {
  const base = getPublicSiteOrigin();
  const id = memberId.trim().toUpperCase();
  return `${base}/v/${encodeURIComponent(id)}`;
}

/** @deprecated QR is rendered locally via MembershipQrCode component */
export function buildMembershipQrCodeImageUrl(member: MembershipCardQrData): string {
  return buildMembershipVerifyUrl(member.id);
}

export interface VerifiedMemberProfile {
  id: string;
  tripleName: string;
  status: MemberProfile["status"];
  gender: MemberProfile["gender"];
  birthDate: string;
  calendarType: MemberProfile["calendarType"];
  expiryDate?: string;
  createdAt: string;
}

export async function verifyMemberById(memberId: string): Promise<VerifiedMemberProfile> {
  const res = await fetch(`${API_BASE}/members/verify/${encodeURIComponent(memberId.trim())}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "لم يتم العثور على العضوية.");
  return json;
}

// Global Public Fetch
export async function getPublicData(): Promise<{
  settings: SystemSettings;
  themeSettings: ThemeSettings;
  fontSettings: FontSettings;
  councils: CouncilsData;
  reference: ReferencePage;
  programs: MainProgram[];
  events: EventItem[];
  gallery: GalleryAlbum[];
  faqs: FAQItem[];
  surveys: SurveyItem[];
}> {
  const res = await fetch(`${API_BASE}/public/data`);
  if (!res.ok) throw new Error("فشل تحميل بيانات الموقع العمومية.");
  return res.json();
}

// Member self registration
export async function registerMember(data: {
  tripleName: string;
  phone: string;
  email?: string;
  birthDate: string;
  calendarType: "hijri" | "gregorian";
  gender: "male" | "female";
  password: string;
}): Promise<{ success: boolean; message: string; member: MemberProfile }> {
  const res = await fetch(`${API_BASE}/members/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "فشل تسجيل العضوية.");
  return json;
}

// Member Authentication
export async function loginMember(
  memberId: string,
  phone: string,
  password: string
): Promise<{ success: boolean; member: MemberProfile }> {
  const res = await fetch(`${API_BASE}/members/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberId, phone, password })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "بيانات العضوية غير صحيحة.");
  return json;
}

export async function lookupMembersByPhone(
  phone: string
): Promise<{ success: boolean; count: number; members: Array<{ id: string; tripleName: string }> }> {
  const res = await fetch(`${API_BASE}/members/lookup-phone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "فشل البحث عن العضوية.");
  return json;
}

// Member Self-profile Update
export async function updateMemberProfile(data: Partial<MemberProfile> & { memberId: string }): Promise<{ success: boolean; member: MemberProfile }> {
  const res = await fetch(`${API_BASE}/members/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "فشل تحديث بيانات العضوية.");
  return json;
}

// Event Registration
export async function registerToEvent(data: {
  eventId: string;
  memberId: string;
  name: string;
  phone: string;
}): Promise<{ success: boolean; message: string; event: EventItem }> {
  const res = await fetch(`${API_BASE}/events/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "فشل التسجيل في الفعالية.");
  return json;
}

// Register to SubProgram
export async function registerToSubProgram(data: {
  programId: string;
  subProgramId: string;
  memberId: string;
  name: string;
  phone: string;
}): Promise<{ success: boolean; message: string; program: MainProgram }> {
  const res = await fetch(`${API_BASE}/subprograms/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "فشل حجز مقعد في المبادرة.");
  return json;
}

// Survey voting
export async function voteInSurvey(data: {
  surveyId: string;
  voterId: string;
  answers: { [questionId: string]: string };
}): Promise<{ success: boolean; message: string; survey: SurveyItem }> {
  const res = await fetch(`${API_BASE}/surveys/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "فشل إرسال التصويت.");
  return json;
}

// Upload file helper (returns static URL)
export async function uploadFile(fileName: string, base64Data: string): Promise<{ success: boolean; url: string }> {
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName, fileData: base64Data })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "فشل رفع الملف على الخادم.");
  return json;
}

// Contact submission
export async function submitContact(data: {
  name: string;
  phone: string;
  email?: string;
  subject?: string;
  message: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "فشل إرسال رسالة تواصل.");
  return json;
}

// Admin API calls (Send 'x-admin-id' in headers for authentication)
export async function adminLogin(username: string, password: string): Promise<{ success: boolean; admin: any }> {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "بيانات الدخول غير صحيحة.");
  return json;
}

export async function fetchFullAdminData(adminId: string): Promise<DbSchema> {
  const res = await fetch(`${API_BASE}/admin/full-data`, {
    headers: { "x-admin-id": adminId }
  });
  if (!res.ok) {
    const err = new Error(
      res.status === 403
        ? "غير مصرح — يرجى تسجيل الدخول مجدداً."
        : "فشل تحميل بيانات لوحة التحكم."
    ) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function saveAdminSettings(adminId: string, settings: SystemSettings): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-id": adminId },
    body: JSON.stringify({ settings })
  });
  return res.json();
}

export async function saveAdminTheme(adminId: string, themeSettings: ThemeSettings): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/theme`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-id": adminId },
    body: JSON.stringify({ themeSettings })
  });
  return res.json();
}

export async function saveAdminFonts(adminId: string, fontSettings: FontSettings): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/fonts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-id": adminId },
    body: JSON.stringify({ fontSettings })
  });
  return res.json();
}

export async function saveAdminCouncils(adminId: string, councils: CouncilsData): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/councils`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-id": adminId },
    body: JSON.stringify({ councils })
  });
  return res.json();
}

export async function saveAdminReference(adminId: string, reference: ReferencePage): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/reference`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-id": adminId },
    body: JSON.stringify({ reference })
  });
  return res.json();
}

export async function saveAdminPrograms(adminId: string, programs: MainProgram[]): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/programs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-id": adminId },
    body: JSON.stringify({ programs })
  });
  return res.json();
}

export async function saveAdminGallery(adminId: string, gallery: GalleryAlbum[]): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/gallery`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-id": adminId },
    body: JSON.stringify({ gallery })
  });
  return res.json();
}

export async function saveAdminFaqs(adminId: string, faqs: FAQItem[]): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/faqs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-id": adminId },
    body: JSON.stringify({ faqs })
  });
  return res.json();
}

export async function saveAdminMembers(adminId: string, members: MemberProfile[]): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-id": adminId },
    body: JSON.stringify({ members })
  });
  return res.json();
}

export async function adminSetMemberPassword(
  adminId: string,
  memberId: string,
  password: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/admin/members/set-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-id": adminId },
    body: JSON.stringify({ memberId, password })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "فشل تحديث كلمة سر العضوية.");
  return json;
}

export async function saveAdminEvents(adminId: string, events: EventItem[]): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-id": adminId },
    body: JSON.stringify({ events })
  });
  return res.json();
}

export async function saveAdminSurveys(adminId: string, surveys: SurveyItem[]): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/surveys`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-id": adminId },
    body: JSON.stringify({ surveys })
  });
  return res.json();
}

export async function saveAdminNotifications(adminId: string, notifications: NotificationItem[]): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-id": adminId },
    body: JSON.stringify({ notifications })
  });
  return res.json();
}

export async function saveAdminUsers(adminId: string, admins: AdminUser[]): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-id": adminId },
    body: JSON.stringify({ admins })
  });
  return res.json();
}

// Backup actions
export async function createBackup(adminId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/backups/create`, {
    method: "POST",
    headers: { "x-admin-id": adminId }
  });
  return res.json();
}

export async function restoreBackup(adminId: string, backupId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/backups/restore`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-id": adminId },
    body: JSON.stringify({ backupId })
  });
  return res.json();
}

export async function deleteBackup(adminId: string, backupId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/backups/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-id": adminId },
    body: JSON.stringify({ backupId })
  });
  return res.json();
}
