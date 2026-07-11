/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { DbSchema, SystemSettings, ThemeSettings, FontSettings, CouncilsData, ReferencePage, MainProgram, EventItem, GalleryAlbum, SurveyItem, MemberProfile, AdminLog, BoardMember } from "../types";
import {
  adminLogin,
  fetchFullAdminData,
  saveAdminSettings,
  saveAdminTheme,
  saveAdminFonts,
  saveAdminCouncils,
  saveAdminReference,
  saveAdminPrograms,
  saveAdminEvents,
  saveAdminMembers,
  adminSetMemberPassword,
  saveAdminSurveys,
  saveAdminGallery,
  saveAdminUsers,
  createBackup,
  restoreBackup,
  deleteBackup,
  applyThemeAndFonts
} from "../lib/api";
import {
  Lock, LayoutDashboard, Palette, Type, Users, FileText, FolderGit, Ticket, BarChart3, Image, Database, Activity,
  Settings, Save, Plus, Trash2, Eye, UserCheck, Shield, AlertTriangle, RefreshCw, Upload, Download, Check, X, Phone, Mail, Edit, ImageIcon, BookOpen, Calendar, Clock, Share2, MapPin,
  Twitter, Instagram, Youtube, MessageCircle, Facebook, Send
} from "lucide-react";

export function AdminDashboard({
  currentTheme,
  currentFonts,
  onSystemUpdate
}: {
  currentTheme: ThemeSettings;
  currentFonts: FontSettings;
  onSystemUpdate: (options?: { silent?: boolean }) => void;
}) {
  const [adminId, setAdminId] = useState<string | null>(localStorage.getItem("adminId"));
  const [adminUser, setAdminUser] = useState<string | null>(localStorage.getItem("adminUser"));
  const [db, setDb] = useState<DbSchema | null>(null);

  // Login form state
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState<string | null>(null);

  // Sidebar Tab Routing state
  const [activeTab, setActiveTab] = useState<
    "stats" | "identity" | "colors" | "fonts" | "councils" | "reference" | "programs" | "events" | "members" | "surveys" | "gallery" | "backups" | "logs" | "adminUsers"
  >("stats");

  // Admin accounts management state
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [adminForm, setAdminForm] = useState<{
    id?: string;
    username: string;
    name: string;
    passwordHash: string;
    role: "admin" | "content_manager" | "member_manager" | "event_manager";
  }>({
    username: "",
    name: "",
    passwordHash: "",
    role: "content_manager"
  });
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  const [passwordEditMember, setPasswordEditMember] = useState<MemberProfile | null>(null);
  const [newMemberPassword, setNewMemberPassword] = useState("");
  const [confirmMemberPassword, setConfirmMemberPassword] = useState("");

  // Loading indicator for any action
  const [loading, setLoading] = useState(false);
  const [dbLoadError, setDbLoadError] = useState<string | null>(null);
  const [opStatus, setOpStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 1. System Info Settings state
  const [settingsForm, setSettingsForm] = useState<SystemSettings>(() => {
    return {
      centerName: "",
      logo: "",
      logoMini: "",
      phone: "",
      whatsapp: "",
      email: "",
      address: "",
      mapLocation: "",
      socialX: "",
      socialInstagram: "",
      socialSnapchat: "",
      socialTikTok: "",
      socialYouTube: "",
      seoTitle: "",
      seoDesc: "",
      seoKeywords: "",
      mainCoverOpacity: 25,
      centerNameHighlightType: "none",
      centerNameHighlightColor: "rgba(250, 204, 21, 0.2)",
      feature1Title: "بناء مجتمعي فاعل",
      feature1Desc: "تكامل حقيقي بين لجان الرعاية والشباب لخدمة قرية المسقي الأثرية.",
      feature2Title: "تمكين العمل التطوعي",
      feature2Desc: "منصات وفرص تطوعية مستمرة تتيح للشباب فرصة البناء والترشح.",
      feature3Title: "تحول رقمي متكامل",
      feature3Desc: "أول مركز اجتماعي يوفر بطاقات عضوية رقمية مدعمة بالتحقق عبر الباركود.",
      whatsappApi: {
        accessToken: "",
        phoneNumberId: "",
        businessAccountId: "",
        webhookUrl: ""
      }
    };
  });
  
  // 2. Identity theme picker state
  const [themeForm, setThemeForm] = useState<ThemeSettings>(() => {
    return {
      primaryColor: "",
      secondaryColor: "",
      buttonBg: "",
      buttonText: "",
      headingColor: "",
      textColor: "",
      bgColor: "",
      navBg: "",
      footerBg: "",
      cardBg: "",
      borderColor: "",
      inputBg: "",
      currentPreset: "",
      imageOpacity: 100
    };
  });
  
  // 3. Fonts picker state
  const [fontForm, setFontForm] = useState<FontSettings>(() => {
    return {
      primaryFont: "Tajawal",
      headingFont: "Tajawal",
      textFont: "Tajawal",
      titleSize: "text-3xl",
      textSize: "text-base",
      fontWeight: "font-medium"
    };
  });

  // 4. Councils state
  const [councilsForm, setCouncilsForm] = useState<CouncilsData>(() => {
    return { previous: [], current: [], introText: "" };
  });

  // 5. Reference state
  const [referenceForm, setReferenceForm] = useState<ReferencePage>(() => {
    return { content: "", images: [], files: [], links: [] };
  });

  // 6. Programs edit state
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [editingSubProgramId, setEditingSubProgramId] = useState<string | null>(null);

  const [deletingProgramId, setDeletingProgramId] = useState<string | null>(null);
  const [deletingSubProgramId, setDeletingSubProgramId] = useState<string | null>(null);

  const [tempProgName, setTempProgName] = useState("");
  const [tempProgDesc, setTempProgDesc] = useState("");
  const [tempProgImage, setTempProgImage] = useState("");

  const [tempSubTitle, setTempSubTitle] = useState("");
  const [tempSubDesc, setTempSubDesc] = useState("");
  const [tempSubImages, setTempSubImages] = useState<string[]>([]);
  const [tempSubDate, setTempSubDate] = useState("");
  const [tempSubTimeFrom, setTempSubTimeFrom] = useState("");
  const [tempSubTimeTo, setTempSubTimeTo] = useState("");
  const [tempSubLocation, setTempSubLocation] = useState("");
  const [tempSubSeatsEnabled, setTempSubSeatsEnabled] = useState(false);
  const [tempSubSeatsTotal, setTempSubSeatsTotal] = useState<number>(50);

  // States for adding a new main program (avoids browser prompt)
  const [isAddingProgram, setIsAddingProgram] = useState(false);
  const [addProgName, setAddProgName] = useState("");
  const [addProgDesc, setAddProgDesc] = useState("");
  const [addProgImage, setAddProgImage] = useState("https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600");

  // States for adding a new sub-program/initiative (avoids browser prompt)
  const [addingSubProgParentId, setAddingSubProgParentId] = useState<string | null>(null);
  const [addSubProgTitle, setAddSubProgTitle] = useState("");
  const [addSubProgDesc, setAddSubProgDesc] = useState("");
  const [addSubProgDate, setAddSubProgDate] = useState("");
  const [addSubProgTimeFrom, setAddSubProgTimeFrom] = useState("");
  const [addSubProgTimeTo, setAddSubProgTimeTo] = useState("");
  const [addSubProgLocation, setAddSubProgLocation] = useState("");
  const [addSubProgSeatsEnabled, setAddSubProgSeatsEnabled] = useState(false);
  const [addSubProgSeatsTotal, setAddSubProgSeatsTotal] = useState<number>(50);
  const [addSubProgImages, setAddSubProgImages] = useState<string[]>([]);

  // Sync forms with database when db loads
  useEffect(() => {
    if (db) {
      const loadedSettings = { ...db.settings };
      if (!loadedSettings.socialLinks || !Array.isArray(loadedSettings.socialLinks)) {
        const links: any[] = [];
        if (db.settings.whatsapp) {
          links.push({ id: "wa", name: "واتساب", url: `https://wa.me/${db.settings.whatsapp}`, icon: "MessageCircle" });
        }
        if (db.settings.socialX) {
          links.push({ id: "x", name: "تويتر / X", url: db.settings.socialX, icon: "Twitter" });
        }
        if (db.settings.socialInstagram) {
          links.push({ id: "ig", name: "إنستغرام", url: db.settings.socialInstagram, icon: "Instagram" });
        }
        if (db.settings.socialYouTube) {
          links.push({ id: "yt", name: "يوتيوب", url: db.settings.socialYouTube, icon: "Youtube" });
        }
        if (db.settings.socialSnapchat) {
          links.push({ id: "snap", name: "سناب شات", url: db.settings.socialSnapchat, icon: "ExternalLink" });
        }
        if (db.settings.socialTikTok) {
          links.push({ id: "tiktok", name: "تيك توك", url: db.settings.socialTikTok, icon: "ExternalLink" });
        }
        loadedSettings.socialLinks = links;
      }
      setSettingsForm(loadedSettings);
      setThemeForm(db.themeSettings);
      setFontForm(db.fontSettings);
      setCouncilsForm(db.councils);
      setReferenceForm(db.reference);
    }
  }, [db]);

  // Load database if admin logged in
  useEffect(() => {
    if (adminId) {
      loadDbData();
    }
  }, [adminId]);

  const loadDbData = async (options?: { silent?: boolean }) => {
    if (!adminId) return;
    if (!options?.silent) setLoading(true);
    setDbLoadError(null);
    try {
      const data = await fetchFullAdminData(adminId);
      setDb(data);
    } catch (err: any) {
      if (err.status === 403) {
        setLoginError("انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.");
        handleLogout();
      } else {
        const msg = err.message || "فشل تحميل البيانات. يرجى المحاولة مرة أخرى.";
        if (db) {
          setOpStatus({ type: "error", text: msg });
        } else {
          setDbLoadError(msg);
        }
      }
    } finally {
      if (!options?.silent) setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);
    try {
      const res = await adminLogin(credentials.username, credentials.password);
      if (res.success) {
        localStorage.setItem("adminId", res.admin.id);
        localStorage.setItem("adminUser", res.admin.username);
        try {
          sessionStorage.setItem("almasqi_current_tab", "admin");
        } catch {
          // ignore
        }
        setAdminId(res.admin.id);
        setAdminUser(res.admin.username);
      }
    } catch (err: any) {
      setLoginError(err.message || "فشل تسجيل دخول المسؤول.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminId");
    localStorage.removeItem("adminUser");
    setAdminId(null);
    setAdminUser(null);
    setDb(null);
  };

  const exportRegistrationsToExcel = (evt: EventItem) => {
    if (!db || !evt.registrations || evt.registrations.length === 0) return;

    const centerName = db.settings?.centerName || "مركز النشاط الاجتماعي بالمسقي";
    const logoMini = db.settings?.logoMini || db.settings?.logo || "";
    
    // Format current date and time
    const now = new Date();
    const exportDate = now.toLocaleDateString("ar-SA", { year: "numeric", month: "2-digit", day: "2-digit" });
    const exportTime = now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });

    // Build the registrations HTML rows
    const rowsHtml = evt.registrations.map((reg, index) => {
      let statusText = "قيد المراجعة";
      let statusClass = "status-pending";
      if (reg.status === "approved") {
        statusText = "مقبول ومؤكد";
        statusClass = "status-approved";
      } else if (reg.status === "rejected") {
        statusText = "مرفوض";
        statusClass = "status-rejected";
      }

      let regDateStr = "-";
      if (reg.registeredAt) {
        try {
          const regDate = new Date(reg.registeredAt);
          regDateStr = regDate.toLocaleDateString("ar-SA", { year: "numeric", month: "2-digit", day: "2-digit" }) + " " + regDate.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
        } catch (e) {
          regDateStr = reg.registeredAt;
        }
      }

      return '<tr>' +
        '<td class="text-center" style="font-weight: bold; background-color: #f8fafc;">' + (index + 1) + '</td>' +
        '<td style="font-weight: 500; color: #1e293b;">' + reg.name + '</td>' +
        '<td style="font-family: \'Courier New\', monospace; text-align: left; direction: ltr;">' + reg.phone + '</td>' +
        '<td class="text-center" style="font-weight: bold; color: #15803d; background-color: #f0fdf4;">' + reg.memberId + '</td>' +
        '<td class="' + statusClass + '">' + statusText + '</td>' +
        '<td class="text-center" style="color: #64748b; font-size: 11px;">' + regDateStr + '</td>' +
        '</tr>';
    }).join("");

    const logoHtml = logoMini ? '<img src="' + logoMini + '" width="70" height="70" class="center-logo" style="margin-bottom: 5px;" />' : '';

    // HTML Template for Excel
    const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">' +
'<head>' +
'  <meta charset="utf-8" />' +
'  <!--[if gte mso 9]>' +
'  <xml>' +
'    <x:ExcelWorkbook>' +
'      <x:ExcelWorksheets>' +
'        <x:ExcelWorksheet>' +
'          <x:Name>قائمة الحجوزات</x:Name>' +
'          <x:WorksheetOptions>' +
'            <x:DisplayGridlines/>' +
'            <x:LayoutDirection>RTL</x:LayoutDirection>' +
'          </x:WorksheetOptions>' +
'        </x:ExcelWorksheet>' +
'      </x:ExcelWorksheets>' +
'    </x:ExcelWorkbook>' +
'  </xml>' +
'  <![endif]-->' +
'  <style>' +
'    body { font-family: \'Arial\', sans-serif; direction: rtl; }' +
'    table { border-collapse: collapse; width: 100%; margin-top: 15px; }' +
'    th { background-color: #15803d; color: #ffffff; font-weight: bold; padding: 10px 15px; border: 1px solid #cbd5e1; font-size: 13px; text-align: center; }' +
'    td { padding: 8px 12px; border: 1px solid #cbd5e1; font-size: 12px; text-align: right; }' +
'    .header-table td { border: none !important; padding: 4px; }' +
'    .center-logo { width: 70px; height: 70px; object-fit: contain; }' +
'    .app-title { font-size: 18px; font-weight: bold; color: #15803d; }' +
'    .doc-title { font-size: 16px; font-weight: bold; color: #1e293b; }' +
'    .meta-label { font-weight: bold; color: #475569; }' +
'    .meta-value { color: #0f172a; }' +
'    .status-approved { background-color: #d1fae5; color: #065f46; font-weight: bold; text-align: center; }' +
'    .status-pending { background-color: #fef08a; color: #854d0e; font-weight: bold; text-align: center; }' +
'    .status-rejected { background-color: #fee2e2; color: #991b1b; font-weight: bold; text-align: center; }' +
'    .text-center { text-align: center; }' +
'  </style>' +
'</head>' +
'<body>' +
'  ' +
'  <!-- Header Info with Logo and Metadata -->' +
'  <table class="header-table" style="width: 100%; border: none;">' +
'    <tr>' +
'      <!-- Column 1: Logo and Center Name -->' +
'      <td style="width: 50%; vertical-align: middle; text-align: right; border: none;">' +
'        ' + logoHtml +
'        <div class="app-title">' + centerName + '</div>' +
'        <div style="font-size: 11px; color: #64748b;">ملتقى العطاء والمواطنة والتطوير بالمسقي</div>' +
'      </td>' +
'      <!-- Column 2: Document Details & DateTime -->' +
'      <td style="width: 50%; vertical-align: middle; text-align: left; border: none; font-size: 12px;">' +
'        <div class="doc-title" style="margin-bottom: 8px;">تقرير طلبات حجز المقاعد المعتمدة</div>' +
'        <div><span class="meta-label">الفعالية / الملتقى:</span> <span class="meta-value">' + evt.title + '</span></div>' +
'        <div><span class="meta-label">تاريخ التصدير:</span> <span class="meta-value">' + exportDate + '</span></div>' +
'        <div><span class="meta-label">وقت التصدير:</span> <span class="meta-value">' + exportTime + '</span></div>' +
'      </td>' +
'    </tr>' +
'  </table>' +
'' +
'  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;" />' +
'' +
'  <!-- Registrations Table -->' +
'  <table>' +
'    <thead>' +
'      <tr>' +
'        <th style="width: 5%;" class="text-center">م</th>' +
'        <th style="width: 30%;">الاسم بالبطاقة</th>' +
'        <th style="width: 20%;">رقم الجوال</th>' +
'        <th style="width: 15%;" class="text-center">رقم العضوية</th>' +
'        <th style="width: 15%;" class="text-center">حالة الطلب</th>' +
'        <th style="width: 15%;" class="text-center">تاريخ تقديم الطلب</th>' +
'      </tr>' +
'    </thead>' +
'    <tbody>' +
'      ' + rowsHtml +
'    </tbody>' +
'  </table>' +
'' +
'  <div style="margin-top: 30px; font-size: 11px; color: #94a3b8; text-align: center;">' +
'    تم إنشاء هذا الملف تلقائياً بواسطة المنصة الرقمية لـ ' + centerName +
'  </div>' +
'' +
'</body>' +
'</html>';

    // Download flow
    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    // Safe filename
    const safeTitle = evt.title.replace(/[\\/?:*|"<>]/g, "_");
    link.download = `حجوزات_${safeTitle}_${exportDate.replace(/\//g, "-")}.xls`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (opStatus?.type === "success") {
      const timer = setTimeout(() => setOpStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [opStatus]);

  // Generic Save wrapper
  const saveAction = async (taskName: string, savePromise: Promise<any>) => {
    if (!adminId) return;
    setLoading(true);
    setOpStatus(null);
    try {
      const result = await savePromise;
      if (result.success) {
        setOpStatus({ type: "success", text: `تم تنفيذ العملية بنجاح: ${taskName}` });
        await loadDbData({ silent: true });
        onSystemUpdate({ silent: true });
      } else {
        setOpStatus({ type: "error", text: result.error || "حدث خطأ غير معروف." });
      }
    } catch (err: any) {
      setOpStatus({ type: "error", text: err.message || "فشلت عملية حفظ التعديلات." });
    } finally {
      setLoading(false);
    }
  };

  const closeMemberPasswordEditor = () => {
    setPasswordEditMember(null);
    setNewMemberPassword("");
    setConfirmMemberPassword("");
  };

  const handleAdminSetMemberPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminId || !passwordEditMember) return;
    if (newMemberPassword.trim().length < 4) {
      setOpStatus({ type: "error", text: "كلمة السر يجب أن تكون 4 أحرف على الأقل." });
      return;
    }
    if (newMemberPassword !== confirmMemberPassword) {
      setOpStatus({ type: "error", text: "كلمة السر وتأكيدها غير متطابقين." });
      return;
    }
    await saveAction(
      `تغيير كلمة سر العضو ${passwordEditMember.id}`,
      adminSetMemberPassword(adminId, passwordEditMember.id, newMemberPassword)
    );
    closeMemberPasswordEditor();
  };

  if (!adminId) {
    return (
      <div className="max-w-md mx-auto py-16 px-4" id="admin-login-screen">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-md">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-[var(--primary-color)] text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">بوابة الإشراف والتحكم</h1>
            <p className="text-xs text-slate-500 mt-1">مركز النشاط الاجتماعي بالمسقي</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700">اسم مستخدم المشرف *</label>
              <input
                type="text"
                required
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white"
                placeholder="admin"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700">كلمة المرور السرية *</label>
              <input
                type="password"
                required
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white"
                placeholder="••••••••"
              />
            </div>

            {loginError && (
              <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center">{loginError}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--primary-color)] text-white font-bold rounded-xl hover:opacity-95 disabled:opacity-50 transition-opacity"
            >
              {loading ? "جاري التحقق والمصادقة..." : "تسجيل دخول المشرف"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!db) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-16 px-4" id="admin-loading-screen">
        {dbLoadError ? (
          <div className="text-center space-y-4 max-w-md">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-sm font-semibold text-red-600">{dbLoadError}</p>
            <button
              onClick={() => loadDbData()}
              disabled={loading}
              className="px-6 py-2.5 bg-[var(--primary-color)] text-white text-sm font-bold rounded-xl disabled:opacity-50"
            >
              {loading ? "جاري إعادة المحاولة..." : "إعادة المحاولة"}
            </button>
          </div>
        ) : (
          <>
            <RefreshCw className="w-10 h-10 text-[var(--primary-color)] animate-spin mb-4" />
            <p className="text-sm font-semibold text-slate-600">جاري تحميل بيانات لوحة التحكم...</p>
          </>
        )}
      </div>
    );
  }

  // --- SUB-SECTIONS STATE HANDLERS ---
  
  // Helper for Base64 Upload in Admin Forms
  const triggerBase64Convert = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProgram = (progId: string) => {
    if (!db) return;
    const updatedList = db.programs.map(p => {
      if (p.id === progId) {
        return {
          ...p,
          name: tempProgName,
          description: tempProgDesc,
          image: tempProgImage
        };
      }
      return p;
    });
    saveAction("تعديل برنامج رئيسي", saveAdminPrograms(adminId, updatedList));
    setEditingProgramId(null);
  };

  const handleSaveSubProgram = (progId: string, subId: string) => {
    if (!db) return;
    const updatedList = db.programs.map(p => {
      if (p.id === progId) {
        const updatedSubs = p.subPrograms.map(s => {
          if (s.id === subId) {
            const oldRegistrations = s.registrations || [];
              return {
                ...s,
                title: tempSubTitle,
                description: tempSubDesc,
                images: tempSubImages,
                date: tempSubDate || undefined,
                timeFrom: tempSubTimeFrom || undefined,
                timeTo: tempSubTimeTo || undefined,
                location: tempSubLocation || undefined,
                seatsEnabled: tempSubSeatsEnabled,
                seatsTotal: tempSubSeatsTotal,
                seatsRemaining: Math.max(0, tempSubSeatsTotal - oldRegistrations.length),
                registrations: oldRegistrations
              };
          }
          return s;
        });
        return { ...p, subPrograms: updatedSubs };
      }
      return p;
    });

    // Also update associated event item in db.events if exists
    const associatedEventId = `e_${subId}`;
    const updatedEvents = db.events.map(e => {
      if (e.id === associatedEventId) {
        return {
          ...e,
          title: tempSubTitle,
          shortDesc: tempSubDesc.substring(0, 100) || "مبادرة من برامجنا الرئيسية",
          fullDesc: tempSubDesc,
          image: (tempSubImages && tempSubImages.length > 0) ? tempSubImages[0] : e.image,
          date: tempSubDate || e.date || "2026-07-15",
          startTime: tempSubTimeFrom || e.startTime || "16:30",
          endTime: tempSubTimeTo || e.endTime || "19:00",
          location: tempSubLocation || e.location || "مقر مركز المسقي الرئيسي",
          seatsTotal: tempSubSeatsEnabled ? tempSubSeatsTotal : e.seatsTotal,
          seatsRemaining: tempSubSeatsEnabled ? Math.max(0, tempSubSeatsTotal - (e.registrations?.length || 0)) : e.seatsRemaining,
        };
      }
      return e;
    });

    const compositeSave = (async () => {
      const progRes = await saveAdminPrograms(adminId, updatedList);
      if (!progRes.success) return progRes;
      const evtRes = await saveAdminEvents(adminId, updatedEvents);
      return evtRes;
    })();

    saveAction("تعديل مبادرة فرعية وتحديث فعاليتها", compositeSave);
    setEditingSubProgramId(null);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4" id="admin-dashboard-root">
      
      {/* Top action status drawer */}
      {opStatus && (
        <div className={`p-4 mb-6 rounded-2xl font-semibold text-sm flex items-center justify-between shadow-sm no-print ${
          opStatus.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-red-50 text-red-800 border border-red-100"
        }`}>
          <div className="flex items-center gap-2">
            {opStatus.type === "success" ? <Check className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
            <span>{opStatus.text}</span>
          </div>
          <button onClick={() => setOpStatus(null)} className="text-xs hover:underline opacity-70">إغلاق</button>
        </div>
      )}

      {/* Admin header layout */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-6 border-b border-slate-200 mb-8 no-print">
        <div className="flex items-center gap-3">
          <Shield className="w-10 h-10 text-[var(--primary-color)]" />
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">لوحة التحكم الإدارية الشاملة</h1>
            <p className="text-xs text-slate-500 mt-1">
              مرحباً بك، <strong className="text-slate-800">{adminUser}</strong>. تحكم بكافة تفاصيل وهوية المركز الرقمية.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDbData}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleLogout}
            className="px-5 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl font-bold text-sm transition-colors"
          >
            تسجيل خروج المشرف
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar Navigator + Canvas Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Navigation Sidebar (3 columns) */}
        <div className="lg:col-span-3 space-y-2 bg-slate-50 border border-slate-200 p-4 rounded-3xl no-print">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">إحصائيات وهوية</p>
          <button
            onClick={() => setActiveTab("stats")}
            className={`w-full text-right p-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all ${
              activeTab === "stats" ? "bg-[var(--primary-color)] text-white" : "hover:bg-slate-200/50 text-slate-600"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> الإحصائيات العامة
          </button>
          <button
            onClick={() => setActiveTab("identity")}
            className={`w-full text-right p-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all ${
              activeTab === "identity" ? "bg-[var(--primary-color)] text-white" : "hover:bg-slate-200/50 text-slate-600"
            }`}
          >
            <Settings className="w-4 h-4" /> بيانات المركز العامة
          </button>
          <button
            onClick={() => setActiveTab("colors")}
            className={`w-full text-right p-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all ${
              activeTab === "colors" ? "bg-[var(--primary-color)] text-white" : "hover:bg-slate-200/50 text-slate-600"
            }`}
          >
            <Palette className="w-4 h-4" /> الألوان والسمات البصرية
          </button>
          <button
            onClick={() => setActiveTab("fonts")}
            className={`w-full text-right p-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all ${
              activeTab === "fonts" ? "bg-[var(--primary-color)] text-white" : "hover:bg-slate-200/50 text-slate-600"
            }`}
          >
            <Type className="w-4 h-4" /> إدارة الخطوط والحجم
          </button>

          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mt-4 mb-2">إدارة المحتوى</p>
          <button
            onClick={() => setActiveTab("councils")}
            className={`w-full text-right p-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all ${
              activeTab === "councils" ? "bg-[var(--primary-color)] text-white" : "hover:bg-slate-200/50 text-slate-600"
            }`}
          >
            <Users className="w-4 h-4" /> مجلس الإدارة واللجان
          </button>
          <button
            onClick={() => setActiveTab("reference")}
            className={`w-full text-right p-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all ${
              activeTab === "reference" ? "bg-[var(--primary-color)] text-white" : "hover:bg-slate-200/50 text-slate-600"
            }`}
          >
            <FileText className="w-4 h-4" /> المرجعية واللوائح
          </button>
          <button
            onClick={() => setActiveTab("programs")}
            className={`w-full text-right p-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all ${
              activeTab === "programs" ? "bg-[var(--primary-color)] text-white" : "hover:bg-slate-200/50 text-slate-600"
            }`}
          >
            <FolderGit className="w-4 h-4" /> البرامج والأنشطة
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`w-full text-right p-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all ${
              activeTab === "events" ? "bg-[var(--primary-color)] text-white" : "hover:bg-slate-200/50 text-slate-600"
            }`}
          >
            <Ticket className="w-4 h-4" /> الفعاليات والتسجيلات
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`w-full text-right p-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all ${
              activeTab === "members" ? "bg-[var(--primary-color)] text-white" : "hover:bg-slate-200/50 text-slate-600"
            }`}
          >
            <UserCheck className="w-4 h-4" /> قاعدة الأعضاء والعضويات
          </button>
          <button
            onClick={() => setActiveTab("surveys")}
            className={`w-full text-right p-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all ${
              activeTab === "surveys" ? "bg-[var(--primary-color)] text-white" : "hover:bg-slate-200/50 text-slate-600"
            }`}
          >
            <BarChart3 className="w-4 h-4" /> استطلاعات الرأي والاستبيانات
          </button>
          <button
            onClick={() => setActiveTab("gallery")}
            className={`w-full text-right p-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all ${
              activeTab === "gallery" ? "bg-[var(--primary-color)] text-white" : "hover:bg-slate-200/50 text-slate-600"
            }`}
          >
            <Image className="w-4 h-4" /> ألبومات صور المعرض
          </button>

          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mt-4 mb-2">النظام والصيانة</p>
          <button
            onClick={() => setActiveTab("backups")}
            className={`w-full text-right p-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all ${
              activeTab === "backups" ? "bg-[var(--primary-color)] text-white" : "hover:bg-slate-200/50 text-slate-600"
            }`}
          >
            <Database className="w-4 h-4" /> النسخ الاحتياطية والدعم
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`w-full text-right p-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all ${
              activeTab === "logs" ? "bg-[var(--primary-color)] text-white" : "hover:bg-slate-200/50 text-slate-600"
            }`}
          >
            <Activity className="w-4 h-4" /> سجل العمليات والرقابة
          </button>
          <button
            onClick={() => setActiveTab("adminUsers")}
            className={`w-full text-right p-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all ${
              activeTab === "adminUsers" ? "bg-[var(--primary-color)] text-white" : "hover:bg-slate-200/50 text-slate-600"
            }`}
          >
            <Lock className="w-4 h-4" /> حسابات المشرفين والوصول
          </button>
        </div>

        {/* Dynamic Details Canvas (9 columns) */}
        <div className="lg:col-span-9 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 min-h-[600px] shadow-sm">
          
          {/* TAB 1: GENERAL STATS SUMMARY */}
          {activeTab === "stats" && (
            <div className="space-y-8" id="tab-stats">
              <h2 className="text-xl font-bold border-b pb-3 mb-6 flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-[var(--primary-color)]" />
                لوحة إحصائيات الأداء الموحدة
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-5 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl shadow-xs">
                  <p className="text-xs text-slate-400 font-semibold">إجمالي العضويات الرقمية</p>
                  <p className="text-3xl font-extrabold text-slate-800 mt-2">{db.members.length}</p>
                  <span className="text-[10px] text-emerald-700 font-bold mt-1 inline-block">
                    {db.members.filter(m => m.status === "active").length} عضو نشط مفعل
                  </span>
                </div>
                <div className="p-5 bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl shadow-xs">
                  <p className="text-xs text-slate-400 font-semibold">الفعاليات المعتمدة</p>
                  <p className="text-3xl font-extrabold text-slate-800 mt-2">{db.events.length}</p>
                  <span className="text-[10px] text-blue-700 font-bold mt-1 inline-block">
                    {db.events.reduce((acc, curr) => acc + (curr.seatsTotal - curr.seatsRemaining), 0)} مقعد محجوز
                  </span>
                </div>
                <div className="p-5 bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-2xl shadow-xs">
                  <p className="text-xs text-slate-400 font-semibold">ألبومات الصور</p>
                  <p className="text-3xl font-extrabold text-slate-800 mt-2">{db.gallery.length}</p>
                  <span className="text-[10px] text-purple-700 font-bold mt-1 inline-block">
                    {db.gallery.reduce((acc, curr) => acc + curr.photos.length, 0)} لقطة موثقة
                  </span>
                </div>
                <div className="p-5 bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-2xl shadow-xs">
                  <p className="text-xs text-slate-400 font-semibold">استطلاعات الرأي</p>
                  <p className="text-3xl font-extrabold text-slate-800 mt-2">{db.surveys.length}</p>
                  <span className="text-[10px] text-amber-700 font-bold mt-1 inline-block">
                    {db.surveys.reduce((acc, curr) => acc + curr.responses.length, 0)} صوت مشارك
                  </span>
                </div>
              </div>

              {/* Pending Approvals Block */}
              <div className="border border-yellow-200 bg-yellow-50/50 rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  إجراءات معلقة عاجلة وبانتظار الاعتماد:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-slate-500">طلبات العضوية المعلقة</p>
                      <p className="text-xl font-bold mt-1 text-slate-800">
                        {db.members.filter(m => m.status === "pending").length} طلب
                      </p>
                    </div>
                    <button onClick={() => setActiveTab("members")} className="text-xs text-[var(--primary-color)] hover:underline">مراجعة الآن &rarr;</button>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-slate-500">طلبات حجز مقاعد الفعاليات المعلقة</p>
                      <p className="text-xl font-bold mt-1 text-slate-800">
                        {db.events.reduce((acc, curr) => acc + curr.registrations.filter(r => r.status === "pending").length, 0)} حجز
                      </p>
                    </div>
                    <button onClick={() => setActiveTab("events")} className="text-xs text-[var(--primary-color)] hover:underline">مراجعة الآن &rarr;</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IDENTITY DETAILS FORM */}
          {activeTab === "identity" && (
            <div id="tab-identity" className="space-y-6">
              <h2 className="text-xl font-bold border-b pb-3 mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-[var(--primary-color)]" />
                إعدادات بيانات المركز العامة
              </h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveAction("بيانات المركز العامة", saveAdminSettings(adminId, settingsForm));
                }}
                className="space-y-4 text-sm"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1 opacity-80">اسم المركز بالكامل *</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.centerName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, centerName: e.target.value })}
                      className="w-full p-2.5 border rounded-lg bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 opacity-80">البريد الإلكتروني الرسمي *</label>
                    <input
                      type="email"
                      required
                      value={settingsForm.email}
                      onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                      className="w-full p-2.5 border rounded-lg bg-slate-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1 opacity-80">رقم الهاتف للاتصال *</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.phone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                      className="w-full p-2.5 border rounded-lg bg-slate-50 text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 opacity-80">رقم الواتساب الرسمي *</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.whatsapp}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                      className="w-full p-2.5 border rounded-lg bg-slate-50 text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 opacity-80">العنوان الجغرافي *</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.address}
                      onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                      className="w-full p-2.5 border rounded-lg bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 opacity-80">موقع خريطة جوجل التفاعلي (رابط iframe src) *</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.mapLocation}
                    onChange={(e) => setSettingsForm({ ...settingsForm, mapLocation: e.target.value })}
                    className="w-full p-2.5 border rounded-lg bg-slate-50 text-left text-xs"
                  />
                </div>

                {/* تخصيص نصوص وأيقونات الموقع الرئيسية */}
                <div className="border-t border-slate-200/60 pt-6 mt-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[var(--primary-color)]" />
                    تخصيص نصوص ورسائل الموقع (الرأس، التذييل، والواجهة الرئيسية)
                  </h3>
                  <p className="text-xs text-slate-500">
                    يمكنك تعديل النصوص والشعارات والعبارات التي تظهر للزوار في رأس الموقع وتذييله والصفحة الرئيسية لتمثيل هويتك تماماً.
                  </p>

                  {/* 1. تخصيص اسم المركز */}
                  <div className="border border-slate-200 bg-slate-50/40 p-4 rounded-xl space-y-4">
                    <div className="space-y-1.5 bg-white p-3.5 rounded-lg border border-slate-200/60">
                      <label className="block text-xs font-extrabold text-slate-800">نص اسم المركز الرئيسي (تعديل العبارة بالكامل):</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.centerName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, centerName: e.target.value })}
                        className="w-full p-2.5 border rounded-lg bg-slate-50 text-sm focus:bg-white focus:ring-1 focus:ring-[var(--primary-color)] font-medium"
                        placeholder="مثال: مركز النشاط الاجتماعي بالمسقي"
                      />
                      <p className="text-[10px] text-slate-500">تحديث هذه القيمة سيغير اسم المركز بالكامل في جميع الأقسام بما في ذلك لوحة التحكم والواجهة الرئيسية.</p>
                    </div>

                    {/* خيارات تظليل وتأثيرات العبارة */}
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200/60 space-y-3">
                      <label className="block text-xs font-extrabold text-slate-800">خيارات تظليل العبارة (لتوضيحها في الواجهات):</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">نوع التظليل/الخلفية:</label>
                          <select
                            value={settingsForm.centerNameHighlightType || "none"}
                            onChange={(e) => setSettingsForm({ ...settingsForm, centerNameHighlightType: e.target.value as any })}
                            className="w-full p-2 border rounded-lg bg-slate-50 text-xs focus:bg-white focus:ring-1 focus:ring-[var(--primary-color)] outline-none"
                          >
                            <option value="none">بدون تظليل (عادي)</option>
                            <option value="marker">تظليل فسفوري (خلفية نصية ملونة رقيقة)</option>
                            <option value="shadow">ظل خلفي عريض ثلاثي الأبعاد (Text Shadow)</option>
                            <option value="badge">كبسولة أو بطاقة داكنة نصف شفافة (Badge Overlay)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">لون التظليل الفسفوري / الظل:</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={settingsForm.centerNameHighlightColor || "rgba(250, 204, 21, 0.2)"}
                              onChange={(e) => setSettingsForm({ ...settingsForm, centerNameHighlightColor: e.target.value })}
                              placeholder="مثال: rgba(250, 204, 21, 0.2) أو #facc15"
                              className="w-full p-2 border rounded-lg bg-slate-50 text-xs focus:bg-white focus:ring-1 focus:ring-[var(--primary-color)] outline-none font-mono"
                            />
                            <input
                              type="color"
                              value={settingsForm.centerNameHighlightColor?.startsWith("#") ? settingsForm.centerNameHighlightColor : "#facc15"}
                              onChange={(e) => setSettingsForm({ ...settingsForm, centerNameHighlightColor: e.target.value })}
                              className="w-8 h-8 rounded cursor-pointer border border-slate-300 shrink-0"
                            />
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500">هذه الخيارات تساعد في زيادة وضوح اسم المركز وإعطائه تظليلاً مميزاً في واجهة الموقع الرئيسية والصفحات العامة.</p>
                    </div>

                    <p className="text-xs font-bold text-slate-700">تخصيص ظهور اسم المركز ومظهره في مختلف أقسام الموقع:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Name in Header */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-2">
                        <span className="block text-xs font-bold text-slate-800">اسم المركز في رأس الموقع (Header)</span>
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-500">اللون:</span>
                            <input
                              type="color"
                              value={settingsForm.centerNameHeaderColor || "#0f172a"}
                              onChange={(e) => setSettingsForm({ ...settingsForm, centerNameHeaderColor: e.target.value })}
                              className="w-7 h-6 rounded cursor-pointer border border-slate-300"
                            />
                          </div>
                          <label className="flex items-center gap-1.5 text-[10px] text-slate-500 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!settingsForm.centerNameHeaderHide}
                              onChange={(e) => setSettingsForm({ ...settingsForm, centerNameHeaderHide: e.target.checked })}
                              className="rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)] h-3.5 w-3.5"
                            />
                            إخفاء
                          </label>
                        </div>
                      </div>

                      {/* Name in Hero */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-2">
                        <span className="block text-xs font-bold text-slate-800">اسم المركز في الواجهة الرئيسية (Hero)</span>
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-500">اللون:</span>
                            <input
                              type="color"
                              value={settingsForm.centerNameHeroColor || "#ffffff"}
                              onChange={(e) => setSettingsForm({ ...settingsForm, centerNameHeroColor: e.target.value })}
                              className="w-7 h-6 rounded cursor-pointer border border-slate-300"
                            />
                          </div>
                          <label className="flex items-center gap-1.5 text-[10px] text-slate-500 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!settingsForm.centerNameHeroHide}
                              onChange={(e) => setSettingsForm({ ...settingsForm, centerNameHeroHide: e.target.checked })}
                              className="rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)] h-3.5 w-3.5"
                            />
                            إخفاء
                          </label>
                        </div>
                      </div>

                      {/* Name in Footer */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-2">
                        <span className="block text-xs font-bold text-slate-800">اسم المركز في أسفل الموقع (Footer)</span>
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-500">اللون:</span>
                            <input
                              type="color"
                              value={settingsForm.centerNameFooterColor || "#ffffff"}
                              onChange={(e) => setSettingsForm({ ...settingsForm, centerNameFooterColor: e.target.value })}
                              className="w-7 h-6 rounded cursor-pointer border border-slate-300"
                            />
                          </div>
                          <label className="flex items-center gap-1.5 text-[10px] text-slate-500 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!settingsForm.centerNameFooterHide}
                              onChange={(e) => setSettingsForm({ ...settingsForm, centerNameFooterHide: e.target.checked })}
                              className="rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)] h-3.5 w-3.5"
                            />
                            إخفاء
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. تخصيص الشعارات والعبارات الأخرى */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Header Slogan */}
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2">
                      <label className="block text-xs font-bold opacity-90">الشعر الفرعي في رأس الموقع (بجانب الاسم) *</label>
                      <input
                        type="text"
                        value={settingsForm.headerSlogan || ""}
                        onChange={(e) => setSettingsForm({ ...settingsForm, headerSlogan: e.target.value })}
                        className="w-full p-2.5 border rounded-lg bg-white"
                        placeholder="مثال: ملتقى العطاء والمواطنة والتطوير بالمسقي"
                      />
                      <div className="flex items-center gap-4 pt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500">اللون:</span>
                          <input
                            type="color"
                            value={settingsForm.headerSloganColor || "#94a3b8"}
                            onChange={(e) => setSettingsForm({ ...settingsForm, headerSloganColor: e.target.value })}
                            className="w-7 h-6 rounded cursor-pointer border border-slate-300"
                          />
                        </div>
                        <label className="flex items-center gap-1.5 text-[10px] text-slate-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!settingsForm.headerSloganHide}
                            onChange={(e) => setSettingsForm({ ...settingsForm, headerSloganHide: e.target.checked })}
                            className="rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)] h-3.5 w-3.5"
                          />
                          حذف / إخفاء العبارة بالكامل
                        </label>
                      </div>
                    </div>

                    {/* Copyright Line */}
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2">
                      <label className="block text-xs font-bold opacity-90">عبارة حقوق النشر والملكية (تذييل الموقع) *</label>
                      <input
                        type="text"
                        value={settingsForm.copyrightText || ""}
                        onChange={(e) => setSettingsForm({ ...settingsForm, copyrightText: e.target.value })}
                        className="w-full p-2.5 border rounded-lg bg-white"
                        placeholder="مثال: جميع الحقوق محفوظة © 2026"
                      />
                      <div className="flex items-center gap-4 pt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500">اللون:</span>
                          <input
                            type="color"
                            value={settingsForm.copyrightTextColor || "#94a3b8"}
                            onChange={(e) => setSettingsForm({ ...settingsForm, copyrightTextColor: e.target.value })}
                            className="w-7 h-6 rounded cursor-pointer border border-slate-300"
                          />
                        </div>
                        <label className="flex items-center gap-1.5 text-[10px] text-slate-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!settingsForm.copyrightTextHide}
                            onChange={(e) => setSettingsForm({ ...settingsForm, copyrightTextHide: e.target.checked })}
                            className="rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)] h-3.5 w-3.5"
                          />
                          حذف / إخفاء العبارة بالكامل
                        </label>
                      </div>
                    </div>

                    {/* Hero Badge */}
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2">
                      <label className="block text-xs font-bold opacity-90">البادج الترحيبي أعلى عنوان الصفحة الرئيسية *</label>
                      <input
                        type="text"
                        value={settingsForm.heroBadge || ""}
                        onChange={(e) => setSettingsForm({ ...settingsForm, heroBadge: e.target.value })}
                        className="w-full p-2.5 border rounded-lg bg-white"
                        placeholder="مثال: منصة مركز المسقي الرقمية الرسمية المعتمدة"
                      />
                      <div className="flex items-center gap-4 pt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500">اللون:</span>
                          <input
                            type="color"
                            value={settingsForm.heroBadgeColor || "#fde047"}
                            onChange={(e) => setSettingsForm({ ...settingsForm, heroBadgeColor: e.target.value })}
                            className="w-7 h-6 rounded cursor-pointer border border-slate-300"
                          />
                        </div>
                        <label className="flex items-center gap-1.5 text-[10px] text-slate-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!settingsForm.heroBadgeHide}
                            onChange={(e) => setSettingsForm({ ...settingsForm, heroBadgeHide: e.target.checked })}
                            className="rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)] h-3.5 w-3.5"
                          />
                          حذف / إخفاء العبارة بالكامل
                        </label>
                      </div>
                    </div>

                    {/* Footer Slogan/Description */}
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2">
                      <label className="block text-xs font-bold opacity-90">الوصف التعريفي في تذييل الموقع *</label>
                      <textarea
                        rows={2}
                        value={settingsForm.footerDescription || ""}
                        onChange={(e) => setSettingsForm({ ...settingsForm, footerDescription: e.target.value })}
                        className="w-full p-2.5 border rounded-lg bg-white text-xs"
                        placeholder="اكتب وصفاً مختصراً يظهر في ذيل الموقع"
                      />
                      <div className="flex items-center gap-4 pt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500">اللون:</span>
                          <input
                            type="color"
                            value={settingsForm.footerDescriptionColor || "#94a3b8"}
                            onChange={(e) => setSettingsForm({ ...settingsForm, footerDescriptionColor: e.target.value })}
                            className="w-7 h-6 rounded cursor-pointer border border-slate-300"
                          />
                        </div>
                        <label className="flex items-center gap-1.5 text-[10px] text-slate-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!settingsForm.footerDescriptionHide}
                            onChange={(e) => setSettingsForm({ ...settingsForm, footerDescriptionHide: e.target.checked })}
                            className="rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)] h-3.5 w-3.5"
                          />
                          حذف / إخفاء العبارة بالكامل
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Hero Description */}
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <label className="block text-xs font-bold opacity-90">الوصف التعريفي العريض بالصفحة الرئيسية (Hero Description) *</label>
                    <textarea
                      rows={2}
                      value={settingsForm.heroDescription || ""}
                      onChange={(e) => setSettingsForm({ ...settingsForm, heroDescription: e.target.value })}
                      className="w-full p-2.5 border rounded-lg bg-white text-xs"
                      placeholder="اكتب عبارة ترحيبية أو تعريفية تظهر في واجهة الموقع بمنتصف الصورة الرئيسية"
                    />
                    <div className="flex items-center gap-4 pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500">اللون:</span>
                        <input
                          type="color"
                          value={settingsForm.heroDescriptionColor || "#cbd5e1"}
                          onChange={(e) => setSettingsForm({ ...settingsForm, heroDescriptionColor: e.target.value })}
                          className="w-7 h-6 rounded cursor-pointer border border-slate-300"
                        />
                      </div>
                      <label className="flex items-center gap-1.5 text-[10px] text-slate-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!settingsForm.heroDescriptionHide}
                          onChange={(e) => setSettingsForm({ ...settingsForm, heroDescriptionHide: e.target.checked })}
                          className="rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)] h-3.5 w-3.5"
                        />
                        حذف / إخفاء العبارة بالكامل
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 border-l-4 border-[var(--primary-color)]/30 bg-slate-50/50 p-4 rounded-xl">
                    <p className="text-xs font-bold text-slate-700">تخصيص لوحة التوطئة والتعريف في الصفحة الرئيسية:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1 bg-white p-3 rounded-lg border border-slate-100 space-y-2">
                        <label className="block text-[11px] font-bold opacity-85">عنوان لوحة التوطئة</label>
                        <input
                          type="text"
                          value={settingsForm.introTitle || ""}
                          onChange={(e) => setSettingsForm({ ...settingsForm, introTitle: e.target.value })}
                          className="w-full p-2 border rounded-lg bg-slate-50 text-xs"
                          placeholder="توطئة وتعريف بمركز النشاط الاجتماعي بالمسقي"
                        />
                        <div className="flex items-center justify-between gap-1 pt-1.5">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-slate-500">اللون:</span>
                            <input
                              type="color"
                              value={settingsForm.introTitleColor || "#15803d"}
                              onChange={(e) => setSettingsForm({ ...settingsForm, introTitleColor: e.target.value })}
                              className="w-6 h-5 rounded cursor-pointer border border-slate-300"
                            />
                          </div>
                          <label className="flex items-center gap-1 text-[9px] text-slate-500 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!settingsForm.introTitleHide}
                              onChange={(e) => setSettingsForm({ ...settingsForm, introTitleHide: e.target.checked })}
                              className="rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)] h-3 w-3"
                            />
                            إخفاء بالكامل
                          </label>
                        </div>
                      </div>
                      
                      <div className="md:col-span-2 bg-white p-3 rounded-lg border border-slate-100 space-y-2">
                        <label className="block text-[11px] font-bold opacity-85">نص التوطئة والتعريف بالكامل</label>
                        <textarea
                          rows={3}
                          value={settingsForm.introDescription || ""}
                          onChange={(e) => setSettingsForm({ ...settingsForm, introDescription: e.target.value })}
                          className="w-full p-2 border rounded-lg bg-slate-50 text-xs"
                          placeholder="اكتب النص التعريفي الكامل للمركز"
                        />
                        <div className="flex items-center justify-between gap-1 pt-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-slate-500">اللون:</span>
                            <input
                              type="color"
                              value={settingsForm.introDescriptionColor || "#475569"}
                              onChange={(e) => setSettingsForm({ ...settingsForm, introDescriptionColor: e.target.value })}
                              className="w-6 h-5 rounded cursor-pointer border border-slate-300"
                            />
                          </div>
                          <label className="flex items-center gap-1 text-[9px] text-slate-500 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!settingsForm.introDescriptionHide}
                              onChange={(e) => setSettingsForm({ ...settingsForm, introDescriptionHide: e.target.checked })}
                              className="rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)] h-3 w-3"
                            />
                            إخفاء بالكامل
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* تخصيص الكروت التعريفية الثلاثة */}
                  <div className="grid grid-cols-1 gap-4 border-l-4 border-amber-500/30 bg-slate-50/50 p-4 rounded-xl">
                    <p className="text-xs font-bold text-slate-700">تخصيص الكروت التعريفية الثلاثة بالصفحة الرئيسية (الخدمات والمزايا):</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* الكرت الأول */}
                      <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500">الكرت 01</span>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">العنوان الأساسي</label>
                          <input
                            type="text"
                            value={settingsForm.feature1Title || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, feature1Title: e.target.value })}
                            className="w-full p-2 border rounded-lg bg-slate-50 text-xs focus:bg-white"
                            placeholder="بناء مجتمعي فاعل"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">الوصف التفصيلي</label>
                          <textarea
                            rows={2}
                            value={settingsForm.feature1Desc || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, feature1Desc: e.target.value })}
                            className="w-full p-2 border rounded-lg bg-slate-50 text-xs focus:bg-white"
                            placeholder="تكامل حقيقي بين لجان الرعاية والشباب لخدمة قرية المسقي الأثرية."
                          />
                        </div>
                      </div>

                      {/* الكرت الثاني */}
                      <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500">الكرت 02</span>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">العنوان الأساسي</label>
                          <input
                            type="text"
                            value={settingsForm.feature2Title || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, feature2Title: e.target.value })}
                            className="w-full p-2 border rounded-lg bg-slate-50 text-xs focus:bg-white"
                            placeholder="تمكين العمل التطوعي"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">الوصف التفصيلي</label>
                          <textarea
                            rows={2}
                            value={settingsForm.feature2Desc || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, feature2Desc: e.target.value })}
                            className="w-full p-2 border rounded-lg bg-slate-50 text-xs focus:bg-white"
                            placeholder="منصات وفرص تطوعية مستمرة تتيح للشباب فرصة البناء والترشح."
                          />
                        </div>
                      </div>

                      {/* الكرت الثالث */}
                      <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500">الكرت 03</span>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">العنوان الأساسي</label>
                          <input
                            type="text"
                            value={settingsForm.feature3Title || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, feature3Title: e.target.value })}
                            className="w-full p-2 border rounded-lg bg-slate-50 text-xs focus:bg-white"
                            placeholder="تحول رقمي متكامل"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">الوصف التفصيلي</label>
                          <textarea
                            rows={2}
                            value={settingsForm.feature3Desc || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, feature3Desc: e.target.value })}
                            className="w-full p-2 border rounded-lg bg-slate-50 text-xs focus:bg-white"
                            placeholder="أول مركز اجتماعي يوفر بطاقات عضوية رقمية مدعمة بالتحقق عبر الباركود."
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200/60 pt-6 mt-6 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-[var(--primary-color)]" />
                        إدارة حسابات وقنوات التواصل الاجتماعي (التي تظهر في أسفل الموقع)
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        يمكنك إضافة، تعديل، حذف، وتغيير أيقونة أي قناة تواصل اجتماعي تابعة للمركز.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newLink = {
                          id: "soc_" + Date.now(),
                          name: "قناة تواصل جديدة",
                          url: "https://",
                          icon: "Link"
                        };
                        setSettingsForm({
                          ...settingsForm,
                          socialLinks: [...(settingsForm.socialLinks || []), newLink]
                        });
                      }}
                      className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> إضافة قناة تواصل جديدة
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(!settingsForm.socialLinks || settingsForm.socialLinks.length === 0) ? (
                      <div className="col-span-1 md:col-span-2 p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                        لا توجد قنوات تواصل مضافة حالياً. انقر على "إضافة قناة تواصل جديدة" للبدء.
                      </div>
                    ) : (
                      settingsForm.socialLinks.map((link, idx) => {
                        // Helper to render icon preview locally
                        const renderIconPreview = (icoName: string) => {
                          const cls = "w-5 h-5 text-slate-600";
                          if (icoName && (icoName.startsWith("data:image/") || icoName.startsWith("http://") || icoName.startsWith("https://"))) {
                            return <img src={icoName} className="w-5 h-5 object-contain rounded" alt="" referrerPolicy="no-referrer" />;
                          }
                          switch (icoName?.toLowerCase()) {
                            case "twitter":
                            case "x":
                              return <Twitter className={cls} />;
                            case "instagram":
                              return <Instagram className={cls} />;
                            case "youtube":
                              return <Youtube className={cls} />;
                            case "messagecircle":
                            case "whatsapp":
                              return <MessageCircle className={cls} />;
                            case "facebook":
                              return <Facebook className={cls} />;
                            case "send":
                            case "telegram":
                              return <Send className={cls} />;
                            case "phone":
                              return <Phone className={cls} />;
                            case "mail":
                              return <Mail className={cls} />;
                            default:
                              return <Share2 className={cls} />;
                          }
                        };

                        return (
                          <div key={link.id} className="p-4 bg-slate-50/50 border border-slate-150 rounded-2xl space-y-3 relative group hover:border-[var(--primary-color)]/30 transition-all">
                            {/* Trash action button */}
                            <button
                              type="button"
                              onClick={() => {
                                const filtered = (settingsForm.socialLinks || []).filter(l => l.id !== link.id);
                                setSettingsForm({ ...settingsForm, socialLinks: filtered });
                              }}
                              className="absolute top-3 left-3 p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="حذف هذا الحساب"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            <div className="grid grid-cols-12 gap-3 pt-2">
                              {/* Icon Selector with Preview */}
                              <div className="col-span-5 space-y-1">
                                <label className="block text-[10px] font-bold text-slate-500">الأيقونة</label>
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-3xs overflow-hidden">
                                      {renderIconPreview(link.icon)}
                                    </div>
                                    <select
                                      value={link.icon.startsWith("data:") ? "custom" : link.icon}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const updated = [...(settingsForm.socialLinks || [])];
                                        if (val === "custom") {
                                          updated[idx] = { ...updated[idx], icon: link.icon.startsWith("data:") ? link.icon : "Link" };
                                        } else {
                                          updated[idx] = { ...updated[idx], icon: val };
                                        }
                                        setSettingsForm({ ...settingsForm, socialLinks: updated });
                                      }}
                                      className="w-full p-1 border rounded-lg bg-white text-[11px] cursor-pointer focus:outline-[var(--primary-color)]"
                                    >
                                      <option value="Twitter">تويتر / X</option>
                                      <option value="Instagram">إنستغرام</option>
                                      <option value="Youtube">يوتيوب</option>
                                      <option value="MessageCircle">واتساب</option>
                                      <option value="Facebook">فيسبوك</option>
                                      <option value="Send">تيليجرام</option>
                                      <option value="Phone">هاتف</option>
                                      <option value="Mail">بريد إلكتروني</option>
                                      <option value="Link">رابط عام</option>
                                      <option value="custom">صورة مخصصة 🖼️</option>
                                    </select>
                                  </div>
                                  
                                  {/* Custom Image File Upload */}
                                  <div className="flex items-center gap-1">
                                    <label className="px-2 py-0.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[9px] font-bold cursor-pointer text-slate-600 block text-center truncate max-w-full">
                                      تحميل صورة
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            triggerBase64Convert(file, (base64) => {
                                              const updated = [...(settingsForm.socialLinks || [])];
                                              updated[idx] = { ...updated[idx], icon: base64 };
                                              setSettingsForm({ ...settingsForm, socialLinks: updated });
                                            });
                                          }
                                        }}
                                      />
                                    </label>
                                    {link.icon.startsWith("data:") && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = [...(settingsForm.socialLinks || [])];
                                          updated[idx] = { ...updated[idx], icon: "Link" };
                                          setSettingsForm({ ...settingsForm, socialLinks: updated });
                                        }}
                                        className="px-1 text-rose-500 hover:bg-rose-50 border border-transparent rounded text-[9px] font-bold cursor-pointer"
                                        title="إلغاء الصورة المخصصة"
                                      >
                                        إلغاء
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Platform Name */}
                              <div className="col-span-7 space-y-1">
                                <label className="block text-[10px] font-bold text-slate-500">اسم المنصة / القناة</label>
                                <input
                                  type="text"
                                  value={link.name}
                                  onChange={(e) => {
                                    const updated = [...(settingsForm.socialLinks || [])];
                                    updated[idx] = { ...updated[idx], name: e.target.value };
                                    setSettingsForm({ ...settingsForm, socialLinks: updated });
                                  }}
                                  className="w-full p-2 border rounded-lg bg-white text-xs font-bold focus:outline-[var(--primary-color)]"
                                  placeholder="مثال: حساب سناب شات"
                                />
                              </div>
                            </div>

                            {/* URL */}
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-500">الرابط المباشر (URL)</label>
                              <input
                                type="url"
                                value={link.url}
                                onChange={(e) => {
                                  const updated = [...(settingsForm.socialLinks || [])];
                                  updated[idx] = { ...updated[idx], url: e.target.value };
                                  setSettingsForm({ ...settingsForm, socialLinks: updated });
                                }}
                                className="w-full p-2 border rounded-lg bg-white text-left font-mono text-xs focus:outline-[var(--primary-color)]"
                                placeholder="https://..."
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1 opacity-80">أيقونة الشعار المصغرة (Base64)</label>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 border rounded bg-slate-50 overflow-hidden flex items-center justify-center">
                        <img src={settingsForm.logoMini} alt="Mini logo preview" className="w-full h-full object-cover" />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            triggerBase64Convert(file, (base64) => {
                              setSettingsForm({ ...settingsForm, logoMini: base64 });
                            });
                          }
                        }}
                        className="text-xs"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold mb-1 opacity-80">الصورة الرئيسية للواجهة (Base64)</label>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 border rounded bg-slate-50 overflow-hidden flex items-center justify-center">
                        <img 
                          src={settingsForm.mainCover} 
                          alt="Cover preview" 
                          className="w-full h-full object-cover" 
                          style={{ opacity: (settingsForm.mainCoverOpacity ?? 25) / 100 }}
                        />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            triggerBase64Convert(file, (base64) => {
                              setSettingsForm({ ...settingsForm, mainCover: base64 });
                            });
                          }
                        }}
                        className="text-xs"
                      />
                    </div>
                    
                    {/* Main cover opacity control */}
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                      <div className="flex justify-between items-center text-[11px] font-bold">
                        <span className="text-slate-600">درجة شفافية صورة الغلاف الرئيسية:</span>
                        <span className="text-[var(--primary-color)] bg-white px-2 py-0.5 rounded border border-slate-200">
                          {settingsForm.mainCoverOpacity ?? 25}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        step="5"
                        value={settingsForm.mainCoverOpacity ?? 25}
                        onChange={(e) => setSettingsForm({ ...settingsForm, mainCoverOpacity: parseInt(e.target.value, 10) })}
                        className="w-full accent-[var(--primary-color)]"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <Save className="w-5 h-5" />
                  حفظ وتطبيق التحديثات العمومية
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: VISUAL IDENTITY COLORS */}
          {activeTab === "colors" && (
            <div id="tab-colors" className="space-y-6">
              <h2 className="text-xl font-bold border-b pb-3 mb-6 flex items-center gap-2">
                <Palette className="w-5 h-5 text-[var(--primary-color)]" />
                تعديل الألوان والهوية البصرية للموقع
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form color pickers */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveAction("هوية الألوان والسمات", saveAdminTheme(adminId, themeForm));
                  }}
                  className="space-y-4 text-xs font-semibold"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 opacity-80">اللون الأساسي للمركز</label>
                      <div className="flex gap-1">
                        <input
                          type="color"
                          value={themeForm.primaryColor}
                          onChange={(e) => setThemeForm({ ...themeForm, primaryColor: e.target.value })}
                          className="w-10 h-8 rounded border cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeForm.primaryColor}
                          onChange={(e) => setThemeForm({ ...themeForm, primaryColor: e.target.value })}
                          className="p-1 border rounded w-full text-center font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1 opacity-80">اللون الثانوي للمركز</label>
                      <div className="flex gap-1">
                        <input
                          type="color"
                          value={themeForm.secondaryColor}
                          onChange={(e) => setThemeForm({ ...themeForm, secondaryColor: e.target.value })}
                          className="w-10 h-8 rounded border cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeForm.secondaryColor}
                          onChange={(e) => setThemeForm({ ...themeForm, secondaryColor: e.target.value })}
                          className="p-1 border rounded w-full text-center font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 opacity-80">لون العناوين الرئيسية</label>
                      <div className="flex gap-1">
                        <input
                          type="color"
                          value={themeForm.headingColor}
                          onChange={(e) => setThemeForm({ ...themeForm, headingColor: e.target.value })}
                          className="w-10 h-8 rounded border cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeForm.headingColor}
                          onChange={(e) => setThemeForm({ ...themeForm, headingColor: e.target.value })}
                          className="p-1 border rounded w-full text-center font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1 opacity-80">لون النصوص والفقرات العامة</label>
                      <div className="flex gap-1">
                        <input
                          type="color"
                          value={themeForm.textColor}
                          onChange={(e) => setThemeForm({ ...themeForm, textColor: e.target.value })}
                          className="w-10 h-8 rounded border cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeForm.textColor}
                          onChange={(e) => setThemeForm({ ...themeForm, textColor: e.target.value })}
                          className="p-1 border rounded w-full text-center font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 opacity-80">خلفية الأزرار الرئيسية</label>
                      <input
                        type="color"
                        value={themeForm.buttonBg}
                        onChange={(e) => setThemeForm({ ...themeForm, buttonBg: e.target.value })}
                        className="w-full h-8 rounded border cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 opacity-80">لون نصوص الأزرار</label>
                      <input
                        type="color"
                        value={themeForm.buttonText}
                        onChange={(e) => setThemeForm({ ...themeForm, buttonText: e.target.value })}
                        className="w-full h-8 rounded border cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 opacity-80">خلفية شريط التنقل</label>
                      <input
                        type="color"
                        value={themeForm.navBg}
                        onChange={(e) => setThemeForm({ ...themeForm, navBg: e.target.value })}
                        className="w-full h-8 rounded border cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 opacity-80">خلفية الفوتر السفلي</label>
                      <input
                        type="color"
                        value={themeForm.footerBg}
                        onChange={(e) => setThemeForm({ ...themeForm, footerBg: e.target.value })}
                        className="w-full h-8 rounded border cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Image Opacity Slider */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-slate-700">التحكم في شفافية الصور بجميع الأقسام:</label>
                      <span className="text-xs font-bold text-[var(--primary-color)] bg-white px-2 py-0.5 rounded border border-slate-200">{themeForm.imageOpacity ?? 100}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={themeForm.imageOpacity ?? 100}
                      onChange={(e) => setThemeForm({ ...themeForm, imageOpacity: parseInt(e.target.value, 10) })}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[var(--primary-color)]"
                    />
                    <p className="text-[10px] text-slate-500">تمكنك هذه الميزة من التحكم في درجة وضوح وشفافية جميع الصور المرفوعة للمبادرات، الفعاليات، المعرض، وبقية أقسام الموقع لإعطاء تباين جمالي مميز للموقع.</p>
                  </div>

                  {/* Built-in template selector helper */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold mb-2 text-slate-700">قوالب ألوان جاهزة مقترحة:</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setThemeForm({
                            primaryColor: "#15803d", // Masqi Green
                            secondaryColor: "#eab308", // Yellow
                            buttonBg: "#15803d",
                            buttonText: "#ffffff",
                            headingColor: "#1e293b",
                            textColor: "#475569",
                            bgColor: "#f8fafc",
                            navBg: "#ffffff",
                            footerBg: "#0f172a",
                            cardBg: "#ffffff",
                            borderColor: "#e2e8f0",
                            inputBg: "#ffffff",
                            imageOpacity: 100
                          });
                        }}
                        className="px-3 py-1 bg-emerald-700 text-white text-[10px] rounded hover:opacity-90"
                      >
                        أخضر عسيري كلاسيك
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setThemeForm({
                            primaryColor: "#1e3a8a", // Dark Blue
                            secondaryColor: "#0284c7", // Sky
                            buttonBg: "#1e3a8a",
                            buttonText: "#ffffff",
                            headingColor: "#0f172a",
                            textColor: "#334155",
                            bgColor: "#f8fafc",
                            navBg: "#ffffff",
                            footerBg: "#0f172a",
                            cardBg: "#ffffff",
                            borderColor: "#e2e8f0",
                            inputBg: "#ffffff",
                            imageOpacity: 100
                          });
                        }}
                        className="px-3 py-1 bg-blue-800 text-white text-[10px] rounded hover:opacity-90"
                      >
                        أزرق مائي معاصر
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <Save className="w-5 h-5" />
                    حفظ وتطبيق قالب الألوان
                  </button>
                </form>

                {/* Live Preview block */}
                <div className="p-6 border border-slate-200 bg-slate-50 rounded-2xl space-y-4">
                  <p className="text-xs font-bold text-slate-500 uppercase">معاينة حية للمظهر الجديد:</p>
                  <div
                    className="p-5 rounded-2xl border transition-colors space-y-4 shadow-xs"
                    style={{ backgroundColor: themeForm.bgColor, borderColor: themeForm.borderColor }}
                  >
                    <div className="p-3 rounded-lg flex justify-between items-center" style={{ backgroundColor: themeForm.navBg, borderColor: themeForm.borderColor, borderWidth: "1px" }}>
                      <span className="font-bold text-xs" style={{ color: themeForm.primaryColor }}>بوابة مركز المسقي</span>
                    </div>

                    <div className="p-4 rounded-xl space-y-2 border" style={{ backgroundColor: themeForm.cardBg, borderColor: themeForm.borderColor }}>
                      <h4 className="font-bold text-sm" style={{ color: themeForm.headingColor }}>العنوان الرئيسي للخبر</h4>
                      <p className="text-xs leading-relaxed" style={{ color: themeForm.textColor }}>هذا النص يحاكي نمط كتابة نصوص الفقرات والمقالات بمركز النشاط الاجتماعي بالمسقي لتقييم مدى وضوح تباين الألوان المختارة.</p>
                      
                      <button className="px-4 py-2 rounded-lg font-bold text-xs shadow-xs transition-opacity" style={{ backgroundColor: themeForm.buttonBg, color: themeForm.buttonText }}>
                        زر إجراء رئيسي
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FONTS MANAGEMENT */}
          {activeTab === "fonts" && (
            <div id="tab-fonts" className="space-y-6">
              <h2 className="text-xl font-bold border-b pb-3 mb-6 flex items-center gap-2">
                <Type className="w-5 h-5 text-[var(--primary-color)]" />
                تغيير وإدارة خطوط الواجهة العربية
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveAction("إعدادات الخطوط", saveAdminFonts(adminId, fontForm));
                  }}
                  className="space-y-4 text-sm"
                >
                  <div>
                    <label className="block text-xs font-bold mb-1 opacity-80">خط الواجهة الرئيسي (الأزرار والتحكم) *</label>
                    <select
                      value={fontForm.primaryFont}
                      onChange={(e) => setFontForm({ ...fontForm, primaryFont: e.target.value as any })}
                      className="w-full p-2.5 border rounded-lg bg-slate-50 font-semibold"
                    >
                      <option value="Cairo">Cairo (خط القاهرة)</option>
                      <option value="Tajawal">Tajawal (خط تجول)</option>
                      <option value="Noto Kufi Arabic">Noto Kufi Arabic (الخط الكوفي المعتمد)</option>
                      <option value="IBM Plex Sans Arabic">IBM Plex Sans Arabic (آي بي إم المطور)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 opacity-80">خط العناوين الرئيسية والفرعية *</label>
                    <select
                      value={fontForm.headingFont}
                      onChange={(e) => setFontForm({ ...fontForm, headingFont: e.target.value as any })}
                      className="w-full p-2.5 border rounded-lg bg-slate-50 font-semibold"
                    >
                      <option value="Cairo">Cairo (خط القاهرة)</option>
                      <option value="Tajawal">Tajawal (خط تجول)</option>
                      <option value="Noto Kufi Arabic">Noto Kufi Arabic (الخط الكوفي المعتمد)</option>
                      <option value="IBM Plex Sans Arabic">IBM Plex Sans Arabic (آي بي إم المطور)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 opacity-80">خط قراءة المقالات والوصف الطويل *</label>
                    <select
                      value={fontForm.textFont}
                      onChange={(e) => setFontForm({ ...fontForm, textFont: e.target.value as any })}
                      className="w-full p-2.5 border rounded-lg bg-slate-50 font-semibold"
                    >
                      <option value="Cairo">Cairo (خط القاهرة)</option>
                      <option value="Tajawal">Tajawal (خط تجول)</option>
                      <option value="Noto Kufi Arabic">Noto Kufi Arabic (الخط الكوفي المعتمد)</option>
                      <option value="IBM Plex Sans Arabic">IBM Plex Sans Arabic (آي بي إم المطور)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    <Save className="w-5 h-5" />
                    حفظ وتطبيق إعدادات الخطوط
                  </button>
                </form>

                <div className="p-6 border border-slate-200 bg-slate-50 rounded-2xl space-y-4">
                  <p className="text-xs font-bold text-slate-500 uppercase">معاينة نمط الخطوط الجديد:</p>
                  
                  {/* Font map display preview */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-slate-400">العناوين الرئيسية:</p>
                      <h3
                        className="text-2xl font-bold border-b pb-2 text-slate-900"
                        style={{ fontFamily: fontForm.headingFont === "Cairo" ? "Cairo" : fontForm.headingFont === "Tajawal" ? "Tajawal" : fontForm.headingFont === "Noto Kufi Arabic" ? "Noto Kufi Arabic" : "IBM Plex Sans Arabic" }}
                      >
                        مركز النشاط الاجتماعي بالمسقي 2026
                      </h3>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400">النصوص والفقرات العامة:</p>
                      <p
                        className="text-sm leading-relaxed text-slate-700"
                        style={{ fontFamily: fontForm.textFont === "Cairo" ? "Cairo" : fontForm.textFont === "Tajawal" ? "Tajawal" : fontForm.textFont === "Noto Kufi Arabic" ? "Noto Kufi Arabic" : "IBM Plex Sans Arabic" }}
                      >
                        المسقي هي بلدة أثرية تاريخية تقع بمنطقة عسير، نسعى بجهود شباب ورجال المركز لتوفير بيئة اجتماعية وتربوية وتطوعية رائدة.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: COUNCILS CRUD */}
          {activeTab === "councils" && (
            <div id="tab-councils" className="space-y-6">
              <h2 className="text-xl font-bold border-b pb-3 mb-6 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[var(--primary-color)]" />
                  إدارة المجلس واللجان (النبذة التعريفية، المجلس الحالي، والمجالس السابقة)
                </span>
                <button
                  onClick={() => saveAction("حفظ تعديلات المجالس واللجان بالكامل", saveAdminCouncils(adminId, councilsForm))}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all"
                >
                  <Save className="w-4 h-4" /> حفظ كافة التغييرات بالكامل
                </button>
              </h2>

              <div className="space-y-8">
                {/* 1. Introduction Text Section */}
                <div className="bg-white p-6 border border-slate-200 rounded-3xl space-y-3 shadow-xs">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary-color)]" />
                    النبذة التعريفية لمركز المسقي الاجتماعي
                  </h3>
                  <p className="text-xs text-slate-500">هذه الفقرة تظهر في أعلى صفحة "من نحن" بجوار الرؤية والرسالة.</p>
                  <textarea
                    value={councilsForm.introText || ""}
                    onChange={(e) => setCouncilsForm({ ...councilsForm, introText: e.target.value })}
                    placeholder="اكتب هنا نبذة عامة وتاريخية عن المركز وأهم إنجازاته..."
                    rows={4}
                    className="w-full p-3 border rounded-2xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                  />
                </div>

                {/* 2. Current Council Board Members */}
                <div className="bg-white p-6 border border-slate-200 rounded-3xl space-y-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3 gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                        مجلس الإدارة واللجان (الدورة الحالية)
                      </h3>
                      <p className="text-xs text-slate-500">الأعضاء الفاعلون في الدورة الحالية للمركز.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newMember: BoardMember = {
                          id: `c_${Date.now()}`,
                          name: "اسم العضو الجديد",
                          role: "منصب العضو",
                          photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
                          bio: "عضو فاعل ومساهم في دعم مشاريع قرية المسقي التاريخية.",
                          order: (councilsForm.current?.length || 0) + 1
                        };
                        setCouncilsForm({
                          ...councilsForm,
                          current: [...(councilsForm.current || []), newMember]
                        });
                      }}
                      className="px-3 py-1.5 bg-[var(--primary-color)] text-white font-bold rounded-lg text-xs flex items-center gap-1 hover:opacity-90"
                    >
                      <Plus className="w-4 h-4" /> إضافة عضو للمجلس الحالي
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {(!councilsForm.current || councilsForm.current.length === 0) ? (
                      <div className="text-center py-6 text-slate-400 text-sm">لا يوجد أعضاء مضافين حالياً. اضغط على زر الإضافة للبدء.</div>
                    ) : (
                      councilsForm.current.map((m, idx) => (
                        <div key={m.id} className="relative p-5 border border-slate-150 rounded-2xl bg-slate-50/50 flex flex-col lg:flex-row gap-5 items-stretch hover:border-slate-300 transition-all">
                          {/* Image Box */}
                          <div className="lg:w-1/4 flex flex-col items-center justify-center border-l lg:border-l border-slate-200 lg:pl-5 pb-4 lg:pb-0 gap-3">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[var(--primary-color)] bg-slate-200 flex-shrink-0">
                              <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="w-full text-center space-y-1">
                              <label className="text-[10px] text-slate-500 font-bold block">تحميل صورة العضو</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    triggerBase64Convert(file, (base64) => {
                                      const updatedMembers = [...councilsForm.current];
                                      updatedMembers[idx].photo = base64;
                                      setCouncilsForm({ ...councilsForm, current: updatedMembers });
                                    });
                                  }
                                }}
                                className="hidden"
                                id={`file-upload-current-${m.id}`}
                              />
                              <label
                                htmlFor={`file-upload-current-${m.id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-md cursor-pointer shadow-xs"
                              >
                                <Upload className="w-3 h-3" /> اختر صورة
                              </label>
                              <input
                                type="text"
                                placeholder="رابط صورة مباشر"
                                value={m.photo}
                                onChange={(e) => {
                                  const updatedMembers = [...councilsForm.current];
                                  updatedMembers[idx].photo = e.target.value;
                                  setCouncilsForm({ ...councilsForm, current: updatedMembers });
                                }}
                                className="w-full p-1.5 text-[10px] border rounded bg-white text-left outline-none mt-1"
                              />
                            </div>
                          </div>

                          {/* Info Fields */}
                          <div className="lg:w-3/4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold mb-1 opacity-85">الاسم الثلاثي أو الكامل *</label>
                              <input
                                type="text"
                                required
                                value={m.name}
                                onChange={(e) => {
                                  const updatedMembers = [...councilsForm.current];
                                  updatedMembers[idx].name = e.target.value;
                                  setCouncilsForm({ ...councilsForm, current: updatedMembers });
                                }}
                                className="w-full p-2 border rounded-xl bg-white text-sm outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold mb-1 opacity-85">المنصب / الصفة الاعتبارية *</label>
                              <input
                                type="text"
                                required
                                value={m.role}
                                onChange={(e) => {
                                  const updatedMembers = [...councilsForm.current];
                                  updatedMembers[idx].role = e.target.value;
                                  setCouncilsForm({ ...councilsForm, current: updatedMembers });
                                }}
                                className="w-full p-2 border rounded-xl bg-white text-sm outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-xs font-bold mb-1 opacity-85">نبذة تعريفية مختصرة وسيرة ذاتية</label>
                              <textarea
                                value={m.bio || ""}
                                onChange={(e) => {
                                  const updatedMembers = [...councilsForm.current];
                                  updatedMembers[idx].bio = e.target.value;
                                  setCouncilsForm({ ...councilsForm, current: updatedMembers });
                                }}
                                placeholder="مثال: عضو فاعل ومساهم في دعم مشاريع قرية المسقي التاريخية..."
                                rows={2}
                                className="w-full p-2 border rounded-xl bg-white text-xs outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                              />
                            </div>

                            <div className="flex items-center gap-3">
                              <div>
                                <label className="block text-xs font-bold mb-1 opacity-85">ترتيب الظهور</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={m.order || idx + 1}
                                  onChange={(e) => {
                                    const updatedMembers = [...councilsForm.current];
                                    updatedMembers[idx].order = parseInt(e.target.value) || 0;
                                    setCouncilsForm({ ...councilsForm, current: updatedMembers });
                                  }}
                                  className="w-20 p-2 border rounded-xl bg-white text-sm outline-none"
                                />
                              </div>
                            </div>

                            <div className="flex items-end justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedMembers = councilsForm.current.filter(item => item.id !== m.id);
                                  setCouncilsForm({ ...councilsForm, current: updatedMembers });
                                }}
                                className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                              >
                                <Trash2 className="w-4 h-4" /> حذف العضو من الدورة الحالية
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 3. Previous Council Board Members */}
                <div className="bg-white p-6 border border-slate-200 rounded-3xl space-y-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3 gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                        أعضاء مجالس الإدارة واللجان السابقة (لهم منا جزيل العرفان والتقدير)
                      </h3>
                      <p className="text-xs text-slate-500">الرجال المخلصين الذين خدموا المركز والبلدة في دورات سابقة.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newMember: BoardMember = {
                          id: `p_${Date.now()}`,
                          name: "اسم العضو السابق",
                          role: "المنصب / الصفة السابقة",
                          photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
                          bio: "قدّم جهوداً مباركة في خدمة وتأسيس أنشطة المركز ولجانه.",
                          order: (councilsForm.previous?.length || 0) + 1
                        };
                        setCouncilsForm({
                          ...councilsForm,
                          previous: [...(councilsForm.previous || []), newMember]
                        });
                      }}
                      className="px-3 py-1.5 bg-slate-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 hover:bg-slate-800"
                    >
                      <Plus className="w-4 h-4" /> إضافة عضو للمجلس السابق
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {(!councilsForm.previous || councilsForm.previous.length === 0) ? (
                      <div className="text-center py-6 text-slate-400 text-sm">لا يوجد أعضاء مضافين للمجالس السابقة حالياً. اضغط على زر الإضافة للبدء.</div>
                    ) : (
                      councilsForm.previous.map((m, idx) => (
                        <div key={m.id} className="relative p-5 border border-slate-150 rounded-2xl bg-slate-50/50 flex flex-col lg:flex-row gap-5 items-stretch hover:border-slate-300 transition-all">
                          {/* Image Box */}
                          <div className="lg:w-1/4 flex flex-col items-center justify-center border-l lg:border-l border-slate-200 lg:pl-5 pb-4 lg:pb-0 gap-3">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-300 bg-slate-200 flex-shrink-0">
                              <img src={m.photo} alt={m.name} className="w-full h-full object-cover grayscale" />
                            </div>
                            <div className="w-full text-center space-y-1">
                              <label className="text-[10px] text-slate-500 font-bold block">تحميل صورة العضو</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    triggerBase64Convert(file, (base64) => {
                                      const updatedMembers = [...councilsForm.previous];
                                      updatedMembers[idx].photo = base64;
                                      setCouncilsForm({ ...councilsForm, previous: updatedMembers });
                                    });
                                  }
                                }}
                                className="hidden"
                                id={`file-upload-previous-${m.id}`}
                              />
                              <label
                                htmlFor={`file-upload-previous-${m.id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-md cursor-pointer shadow-xs"
                              >
                                <Upload className="w-3 h-3" /> اختر صورة
                              </label>
                              <input
                                type="text"
                                placeholder="رابط صورة مباشر"
                                value={m.photo}
                                onChange={(e) => {
                                  const updatedMembers = [...councilsForm.previous];
                                  updatedMembers[idx].photo = e.target.value;
                                  setCouncilsForm({ ...councilsForm, previous: updatedMembers });
                                }}
                                className="w-full p-1.5 text-[10px] border rounded bg-white text-left outline-none mt-1"
                              />
                            </div>
                          </div>

                          {/* Info Fields */}
                          <div className="lg:w-3/4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold mb-1 opacity-85">الاسم الثلاثي أو الكامل *</label>
                              <input
                                type="text"
                                required
                                value={m.name}
                                onChange={(e) => {
                                  const updatedMembers = [...councilsForm.previous];
                                  updatedMembers[idx].name = e.target.value;
                                  setCouncilsForm({ ...councilsForm, previous: updatedMembers });
                                }}
                                className="w-full p-2 border rounded-xl bg-white text-sm outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold mb-1 opacity-85">المنصب / الصفة السابقة *</label>
                              <input
                                type="text"
                                required
                                value={m.role}
                                onChange={(e) => {
                                  const updatedMembers = [...councilsForm.previous];
                                  updatedMembers[idx].role = e.target.value;
                                  setCouncilsForm({ ...councilsForm, previous: updatedMembers });
                                }}
                                className="w-full p-2 border rounded-xl bg-white text-sm outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-xs font-bold mb-1 opacity-85">نبذة تعريفية مختصرة وسيرة ذاتية</label>
                              <textarea
                                value={m.bio || ""}
                                onChange={(e) => {
                                  const updatedMembers = [...councilsForm.previous];
                                  updatedMembers[idx].bio = e.target.value;
                                  setCouncilsForm({ ...councilsForm, previous: updatedMembers });
                                }}
                                placeholder="مثال: من الرعيل الأول الذين ساهموا بجهد وفير في رعاية وتوجيه المبادرات الأولى للمركز..."
                                rows={2}
                                className="w-full p-2 border rounded-xl bg-white text-xs outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                              />
                            </div>

                            <div className="flex items-center gap-3">
                              <div>
                                <label className="block text-xs font-bold mb-1 opacity-85">ترتيب الظهور</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={m.order || idx + 1}
                                  onChange={(e) => {
                                    const updatedMembers = [...councilsForm.previous];
                                    updatedMembers[idx].order = parseInt(e.target.value) || 0;
                                    setCouncilsForm({ ...councilsForm, previous: updatedMembers });
                                  }}
                                  className="w-20 p-2 border rounded-xl bg-white text-sm outline-none"
                                />
                              </div>
                            </div>

                            <div className="flex items-end justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedMembers = councilsForm.previous.filter(item => item.id !== m.id);
                                  setCouncilsForm({ ...councilsForm, previous: updatedMembers });
                                }}
                                className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                              >
                                <Trash2 className="w-4 h-4" /> حذف العضو من الدورة السابقة
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium">ملاحظة: لحفظ أي تحديث على النبذة أو الأعضاء، يجب الضغط على زر "حفظ التغييرات" بالأسفل أو بالأعلى.</p>
                <button
                  onClick={() => saveAction("تعديلات أعضاء ومجالس المركز", saveAdminCouncils(adminId, councilsForm))}
                  className="px-8 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <Save className="w-5 h-5" /> حفظ التغييرات بالكامل
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: REFERENCE PAGE AND LEGALITY DOCUMENTS */}
          {activeTab === "reference" && (
            <div id="tab-reference" className="space-y-6">
              <h2 className="text-xl font-bold border-b pb-3 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--primary-color)]" />
                تحرير المرجعية واللوائح التنظيمية الرسمية
              </h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveAction("اللوائح والمرجعية", saveAdminReference(adminId, referenceForm));
                }}
                className="space-y-4 text-sm"
              >
                <div>
                  <label className="block text-xs font-bold mb-1 opacity-80">المحتوى النصي المفصل (يدعم التنسيق السريع) *</label>
                  <textarea
                    required
                    rows={12}
                    value={referenceForm.content}
                    onChange={(e) => setReferenceForm({ ...referenceForm, content: e.target.value })}
                    className="w-full p-3 border rounded-xl bg-slate-50 font-mono text-xs leading-relaxed"
                    placeholder="اكتب لوائح المركز هنا..."
                  />
                  <p className="text-[10px] text-slate-400 mt-1">يمكنك استخدام ## للعناوين و - للنقاط المنفصلة لتنسيق الصفحة تلقائياً.</p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-[var(--primary-color)] text-[var(--button-text)] rounded-xl font-bold flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> حفظ ونشر اللوائح المرجعية
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 7: PROGRAMS AND SUB-PROGRAMS CRUD */}
          {activeTab === "programs" && (
            <div id="tab-programs" className="space-y-6">
              <h2 className="text-xl font-bold border-b pb-3 mb-6 flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <FolderGit className="w-5 h-5 text-[var(--primary-color)]" />
                  إدارة البرامج واللجان الفرعية بالمسقي
                </span>
                <button
                  onClick={() => {
                    setIsAddingProgram(true);
                    setAddProgName("");
                    setAddProgDesc("برنامج مجتمعي فاعل ومخصص لخدمة أفراد المجتمع.");
                    setAddProgImage("https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600");
                  }}
                  className="px-3 py-1.5 bg-[var(--primary-color)] text-white font-bold rounded-lg text-xs flex items-center gap-1 hover:opacity-90"
                >
                  <Plus className="w-4 h-4" /> إضافة برنامج رئيسي
                </button>
              </h2>

              {/* Form to add a new Main Program */}
              {isAddingProgram && (
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4 animate-fade-in">
                  <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-[var(--primary-color)]" />
                    إضافة برنامج رئيسي جديد للمركز
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold mb-1 opacity-80 text-slate-700">اسم البرنامج الرئيسي *</label>
                      <input
                        type="text"
                        value={addProgName}
                        onChange={(e) => setAddProgName(e.target.value)}
                        placeholder="مثال: لجنة التنمية الأسرية / ديوانية النشاط الاجتماعي"
                        className="w-full p-2.5 border rounded-xl bg-white text-xs outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1 opacity-80 text-slate-700">وصف البرنامج الرئيسي *</label>
                      <textarea
                        value={addProgDesc}
                        onChange={(e) => setAddProgDesc(e.target.value)}
                        placeholder="اكتب وصفاً أو نبذة تعريفية لبرنامج المركز..."
                        rows={3}
                        className="w-full p-2.5 border rounded-xl bg-white text-xs outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1 opacity-80 text-slate-700">رابط صورة الغلاف أو الأيقونة</label>
                      <input
                        type="text"
                        value={addProgImage}
                        onChange={(e) => setAddProgImage(e.target.value)}
                        placeholder="أدخل رابط صورة الغلاف للبرنامج"
                        className="w-full p-2.5 border rounded-xl bg-white text-xs outline-none focus:ring-1 focus:ring-[var(--primary-color)] font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!addProgName.trim()) return alert("الرجاء إدخال اسم البرنامج الرئيسي");
                        const newProg = {
                          id: `p_${Date.now()}`,
                          name: addProgName.trim(),
                          image: addProgImage.trim() || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600",
                          description: addProgDesc.trim() || "برنامج مجتمعي فاعل ومخصص لخدمة أفراد المجتمع.",
                          subPrograms: []
                        };
                        saveAction("إضافة برنامج رئيسي", saveAdminPrograms(adminId, [...db.programs, newProg]));
                        setIsAddingProgram(false);
                      }}
                      className="px-4 py-2 bg-[var(--primary-color)] text-white font-bold text-xs rounded-xl flex items-center gap-1 hover:opacity-90"
                    >
                      <Check className="w-3.5 h-3.5" /> إضافة البرنامج
                    </button>
                    <button
                      onClick={() => setIsAddingProgram(false)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> إلغاء
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {db.programs.map((prog, pIdx) => (
                  <div key={prog.id} className="border border-slate-200 rounded-3xl p-6 bg-white shadow-xs space-y-6">
                    
                    {/* Header Row of Main Program */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border flex-shrink-0">
                          <img src={prog.image} alt={prog.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                            {prog.name}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">معرف البرنامج: {prog.id}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Edit Main Program Trigger */}
                        <button
                          onClick={() => {
                            if (editingProgramId === prog.id) {
                              setEditingProgramId(null);
                            } else {
                              setEditingProgramId(prog.id);
                              setTempProgName(prog.name);
                              setTempProgDesc(prog.description);
                              setTempProgImage(prog.image);
                              setEditingSubProgramId(null); // Close subprograms edits
                            }
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 border transition-all ${
                            editingProgramId === prog.id
                              ? "bg-slate-100 text-slate-700 border-slate-300"
                              : "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                          }`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                          {editingProgramId === prog.id ? "إلغاء التعديل" : "تعديل البرنامج الرئيسي"}
                        </button>

                        <button
                          onClick={() => {
                            if (addingSubProgParentId === prog.id) {
                              setAddingSubProgParentId(null);
                            } else {
                              setAddingSubProgParentId(prog.id);
                              setAddSubProgTitle("");
                              setAddSubProgDesc("تفاصيل المبادرة الجديدة المعمول بها.");
                              setAddSubProgDate("");
                              setAddSubProgTimeFrom("");
                              setAddSubProgTimeTo("");
                              setAddSubProgLocation("");
                              setAddSubProgSeatsEnabled(false);
                              setAddSubProgSeatsTotal(50);
                              setAddSubProgImages([]);
                            }
                          }}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> {addingSubProgParentId === prog.id ? "إلغاء الإضافة" : "إضافة مبادرة فرعية"}
                        </button>
                        
                        {deletingProgramId === prog.id ? (
                          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 p-1.5 rounded-xl animate-fade-in">
                            <span className="text-[10px] font-bold text-rose-800">تأكيد الحذف؟</span>
                            <button
                              onClick={() => {
                                const subIds = prog.subPrograms?.map(s => `e_${s.id}`) || [];
                                const updatedList = db.programs.filter(p => p.id !== prog.id);
                                const updatedEvents = db.events.filter(e => !subIds.includes(e.id));
                                
                                const compositeSave = (async () => {
                                  const progRes = await saveAdminPrograms(adminId, updatedList);
                                  if (!progRes.success) return progRes;
                                  const evtRes = await saveAdminEvents(adminId, updatedEvents);
                                  return evtRes;
                                })();

                                saveAction("حذف برنامج رئيسي ومبادراته", compositeSave);
                                setDeletingProgramId(null);
                              }}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold"
                            >
                              نعم، احذف
                            </button>
                            <button
                              onClick={() => setDeletingProgramId(null)}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold"
                            >
                              تراجع
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setDeletingProgramId(prog.id);
                            }}
                            className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 rounded-xl"
                            title="حذف البرنامج الرئيسي"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* MAIN PROGRAM EDIT MODE BOX */}
                    {editingProgramId === prog.id && (
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          <Edit className="w-4 h-4 text-blue-600" />
                          تعديل بيانات البرنامج الرئيسي: {prog.name}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold mb-1 opacity-80">اسم البرنامج *</label>
                            <input
                              type="text"
                              value={tempProgName}
                              onChange={(e) => setTempProgName(e.target.value)}
                              className="w-full p-2.5 border rounded-xl bg-white text-sm outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold mb-1 opacity-80">رابط صورة الغلاف</label>
                            <input
                              type="text"
                              value={tempProgImage}
                              onChange={(e) => setTempProgImage(e.target.value)}
                              className="w-full p-2.5 border rounded-xl bg-white text-xs font-mono outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                              placeholder="رابط مباشر للصورة..."
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold mb-1 opacity-80">وصف البرنامج الرئيسي *</label>
                          <textarea
                            value={tempProgDesc}
                            onChange={(e) => setTempProgDesc(e.target.value)}
                            rows={3}
                            className="w-full p-2.5 border rounded-xl bg-white text-sm outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                            placeholder="اكتب وصفاً معبراً عن أهداف البرنامج..."
                          />
                        </div>

                        {/* Image Upload Row */}
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                          <div className="flex-1">
                            <span className="text-xs text-slate-500 font-medium block mb-1">أو اختر صورة من جهازك لتحميلها مباشرة:</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  triggerBase64Convert(file, (base64) => {
                                    setTempProgImage(base64);
                                  });
                                }
                              }}
                              className="hidden"
                              id={`upload-main-prog-${prog.id}`}
                            />
                            <label
                              htmlFor={`upload-main-prog-${prog.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer shadow-xs"
                            >
                              <Upload className="w-3.5 h-3.5" /> تحميل صورة غلاف
                            </label>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveProgram(prog.id)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> حفظ التغييرات
                            </button>
                            <button
                              onClick={() => setEditingProgramId(null)}
                              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> إلغاء
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Description Paragraph of Main Program (when not editing) */}
                    {editingProgramId !== prog.id && (
                      <p className="text-sm text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                        {prog.description}
                      </p>
                    )}

                    {/* Subprograms array manager under parent */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 border-b pb-2">
                        <BookOpen className="w-4 h-4 text-[var(--primary-color)]" />
                        المبادرات واللجان الفرعية التابعة للبرنامج ({prog.subPrograms.length})
                      </h4>

                      {/* Inline Form to Add Sub-program/Initiative */}
                      {addingSubProgParentId === prog.id && (
                        <div className="p-4 bg-emerald-50/40 border border-emerald-150 rounded-2xl space-y-4 text-xs animate-fade-in">
                          <div className="border-b border-emerald-100 pb-2 mb-2 flex justify-between items-center">
                            <h5 className="font-extrabold text-emerald-800 flex items-center gap-1.5 text-sm">
                              <Plus className="w-4 h-4 text-emerald-700" />
                              إضافة مبادرة فرعية أو لجنة جديدة للبرنامج
                            </h5>
                          </div>

                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold mb-1 opacity-80 text-slate-700">عنوان المبادرة الفرعية *</label>
                                <input
                                  type="text"
                                  value={addSubProgTitle}
                                  onChange={(e) => setAddSubProgTitle(e.target.value)}
                                  placeholder="مثال: ورشة تدريب صيانة الأجهزة / دورة ريادة الأعمال"
                                  className="w-full p-2 border rounded-lg bg-white text-xs outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold mb-1 opacity-80 text-slate-700">تاريخ المبادرة (اختياري - للربط بالتقويم)</label>
                                <input
                                  type="date"
                                  value={addSubProgDate}
                                  onChange={(e) => setAddSubProgDate(e.target.value)}
                                  className="w-full p-2 border rounded-lg bg-white text-xs outline-none focus:ring-1 focus:ring-[var(--primary-color)] font-mono"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold mb-1 opacity-80 text-slate-700">وقت البداية (من)</label>
                                <input
                                  type="time"
                                  value={addSubProgTimeFrom}
                                  onChange={(e) => setAddSubProgTimeFrom(e.target.value)}
                                  className="w-full p-2 border rounded-lg bg-white text-xs outline-none focus:ring-1 focus:ring-[var(--primary-color)] font-mono"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold mb-1 opacity-80 text-slate-700">وقت النهاية (إلى)</label>
                                <input
                                  type="time"
                                  value={addSubProgTimeTo}
                                  onChange={(e) => setAddSubProgTimeTo(e.target.value)}
                                  className="w-full p-2 border rounded-lg bg-white text-xs outline-none focus:ring-1 focus:ring-[var(--primary-color)] font-mono"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold mb-1 opacity-80 text-slate-700">موقع إقامة المبادرة</label>
                              <input
                                type="text"
                                value={addSubProgLocation}
                                onChange={(e) => setAddSubProgLocation(e.target.value)}
                                className="w-full p-2 border rounded-lg bg-white text-xs outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                                placeholder="مثال: مقر المركز بالمسقي / الملعب الرياضي"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold mb-1 opacity-80 text-slate-700">وصف وتفاصيل المبادرة الفرعية *</label>
                              <textarea
                                value={addSubProgDesc}
                                onChange={(e) => setAddSubProgDesc(e.target.value)}
                                rows={3}
                                className="w-full p-2 border rounded-lg bg-white text-xs outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                                placeholder="اكتب هنا تفاصيل ومحاور المبادرة بالتفصيل..."
                              />
                            </div>

                            {/* Seats booking settings */}
                            <div className="bg-white border border-emerald-100 p-3 rounded-xl space-y-3 mt-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-emerald-700" />
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">تفعيل حجز المقاعد للمبادرة الفرعية</p>
                                    <p className="text-[10px] text-slate-500">تمكين الزوار من حجز مقعد وحساب المقاعد المتبقية تلقائياً</p>
                                  </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={addSubProgSeatsEnabled}
                                    onChange={(e) => setAddSubProgSeatsEnabled(e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary-color)]"></div>
                                </label>
                              </div>

                              {addSubProgSeatsEnabled && (
                                <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-bold mb-1 text-slate-700">العدد الأقصى للمقاعد المتاحة</label>
                                    <input
                                      type="number"
                                      min={1}
                                      value={addSubProgSeatsTotal}
                                      onChange={(e) => setAddSubProgSeatsTotal(parseInt(e.target.value) || 50)}
                                      className="w-full p-2 border rounded-lg bg-white text-xs outline-none focus:ring-1 focus:ring-[var(--primary-color)] font-mono"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-emerald-100">
                            <button
                              type="button"
                              onClick={() => {
                                if (!addSubProgTitle.trim()) return alert("الرجاء إدخال عنوان المبادرة");
                                const subId = `s_${Date.now()}`;
                                const newSub = {
                                  id: subId,
                                  title: addSubProgTitle.trim(),
                                  description: addSubProgDesc.trim() || "تفاصيل المبادرة الجديدة المعمول بها.",
                                  images: addSubProgImages,
                                  files: [],
                                  links: [],
                                  isHidden: false,
                                  order: prog.subPrograms.length + 1,
                                  date: addSubProgDate || undefined,
                                  timeFrom: addSubProgTimeFrom || undefined,
                                  timeTo: addSubProgTimeTo || undefined,
                                  location: addSubProgLocation || undefined,
                                  seatsEnabled: addSubProgSeatsEnabled,
                                  seatsTotal: addSubProgSeatsEnabled ? addSubProgSeatsTotal : undefined,
                                  seatsRemaining: addSubProgSeatsEnabled ? addSubProgSeatsTotal : undefined,
                                  registrations: []
                                };
                                const updatedProg = { ...prog, subPrograms: [...prog.subPrograms, newSub] };
                                const updatedList = db.programs.map(p => p.id === prog.id ? updatedProg : p);

                                // Automatically create a corresponding EventItem
                                const associatedEventId = `e_${subId}`;
                                const newEvt: EventItem = {
                                  id: associatedEventId,
                                  title: addSubProgTitle.trim(),
                                  shortDesc: addSubProgDesc.trim().substring(0, 100) || "مبادرة جديدة من برامجنا الرئيسية",
                                  fullDesc: addSubProgDesc.trim() || "تفاصيل المبادرة الجديدة المعمول بها.",
                                  image: (addSubProgImages && addSubProgImages.length > 0) ? addSubProgImages[0] : "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600",
                                  date: addSubProgDate || new Date().toISOString().split("T")[0],
                                  startTime: addSubProgTimeFrom || "16:30",
                                  endTime: addSubProgTimeTo || "19:00",
                                  location: addSubProgLocation || "مقر مركز المسقي الرئيسي",
                                  mapUrl: "",
                                  seatsTotal: addSubProgSeatsEnabled ? addSubProgSeatsTotal : 50,
                                  seatsRemaining: addSubProgSeatsEnabled ? addSubProgSeatsTotal : 50,
                                  status: "open",
                                  registrations: []
                                };

                                const updatedEvents = [...db.events, newEvt];
                                const compositeSave = (async () => {
                                  const progRes = await saveAdminPrograms(adminId, updatedList);
                                  if (!progRes.success) return progRes;
                                  const evtRes = await saveAdminEvents(adminId, updatedEvents);
                                  return evtRes;
                                })();

                                saveAction("إضافة مبادرة فرعية وتعميمها كفعالية ومزامنتها بالتقويم", compositeSave);
                                setAddingSubProgParentId(null);
                              }}
                              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> إضافة المبادرة الفرعية
                            </button>
                            <button
                              type="button"
                              onClick={() => setAddingSubProgParentId(null)}
                              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> إلغاء
                            </button>
                          </div>
                        </div>
                      )}

                      {prog.subPrograms.length === 0 ? (
                        <div className="text-center py-4 text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                          لا يوجد مبادرات فرعية مضافة حالياً.
                        </div>
                      ) : (
                        <div className="space-y-4 pl-2 pr-2">
                          {prog.subPrograms.map((sub, sIdx) => (
                            <div key={sub.id} className="p-4 bg-white border border-slate-150 rounded-2xl shadow-2xs space-y-3">
                              
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <p className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-[var(--primary-color)]" />
                                    {sub.title}
                                  </p>
                                  <p className="text-slate-500 mt-1 text-xs line-clamp-2 leading-relaxed">{sub.description}</p>
                                  <div className="flex flex-wrap gap-2 mt-1.5">
                                    {sub.date && (
                                      <p className="text-[10px] text-sky-700 font-bold flex items-center gap-1 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded w-fit">
                                        <Calendar className="w-3.5 h-3.5" />
                                        تاريخ المبادرة: {sub.date} (مربوط مباشرة بالتقويم الموحد)
                                      </p>
                                    )}
                                    {(sub.timeFrom || sub.timeTo) && (
                                      <p className="text-[10px] text-amber-700 font-bold flex items-center gap-1 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded w-fit">
                                        <Clock className="w-3.5 h-3.5" />
                                        الوقت: من {sub.timeFrom || "--:--"} إلى {sub.timeTo || "--:--"}
                                      </p>
                                    )}
                                    {sub.location && (
                                      <p className="text-[10px] text-purple-700 font-bold flex items-center gap-1 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded w-fit">
                                        <MapPin className="w-3.5 h-3.5" />
                                        الموقع: {sub.location}
                                      </p>
                                    )}
                                    {sub.seatsEnabled && (
                                      <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded w-fit">
                                        <Users className="w-3.5 h-3.5" />
                                        حجز المقاعد مفعل: المتبقي {sub.seatsRemaining ?? sub.seatsTotal ?? 50} من {sub.seatsTotal ?? 50} (المسجلين: {sub.registrations?.length || 0})
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1.5">
                                  {/* Edit Sub-program Trigger */}
                                  <button
                                    onClick={() => {
                                      if (editingSubProgramId === sub.id) {
                                        setEditingSubProgramId(null);
                                      } else {
                                        setEditingSubProgramId(sub.id);
                                        setTempSubTitle(sub.title);
                                        setTempSubDesc(sub.description);
                                        setTempSubImages(sub.images || []);
                                        setTempSubDate(sub.date || "");
                                        setTempSubTimeFrom(sub.timeFrom || "");
                                        setTempSubTimeTo(sub.timeTo || "");
                                        setTempSubLocation(sub.location || "");
                                        setTempSubSeatsEnabled(!!sub.seatsEnabled);
                                        setTempSubSeatsTotal(sub.seatsTotal || 50);
                                        setEditingProgramId(null); // Close main program edit
                                      }
                                    }}
                                    className={`px-2 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1 border transition-all ${
                                      editingSubProgramId === sub.id
                                        ? "bg-slate-100 text-slate-700 border-slate-300"
                                        : "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                                    }`}
                                  >
                                    <Edit className="w-3 h-3" />
                                    {editingSubProgramId === sub.id ? "إلغاء التعديل" : "تعديل المبادرة"}
                                  </button>

                                  {deletingSubProgramId === sub.id ? (
                                    <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 p-1 rounded-lg animate-fade-in text-[10px]">
                                      <span className="font-bold text-rose-800">حذف؟</span>
                                      <button
                                        onClick={() => {
                                          const updatedSub = prog.subPrograms.filter(s => s.id !== sub.id);
                                          const updatedProg = { ...prog, subPrograms: updatedSub };
                                          const updatedList = db.programs.map(p => p.id === prog.id ? updatedProg : p);

                                          // Also delete associated event item in db.events
                                          const associatedEventId = `e_${sub.id}`;
                                          const updatedEvents = db.events.filter(e => e.id !== associatedEventId);

                                          const compositeSave = (async () => {
                                            const progRes = await saveAdminPrograms(adminId, updatedList);
                                            if (!progRes.success) return progRes;
                                            const evtRes = await saveAdminEvents(adminId, updatedEvents);
                                            return evtRes;
                                          })();

                                          saveAction("حذف مبادرة فرعية وإلغاء فعاليتها", compositeSave);
                                          setDeletingSubProgramId(null);
                                        }}
                                        className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold"
                                      >
                                        نعم
                                      </button>
                                      <button
                                        onClick={() => setDeletingSubProgramId(null)}
                                        className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-bold"
                                      >
                                        لا
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setDeletingSubProgramId(sub.id);
                                      }}
                                      className="p-1 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 rounded-lg"
                                      title="حذف المبادرة"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* SUB-PROGRAM IMAGES PREVIEW LIST (STATIC STATE) */}
                              {(!editingSubProgramId || editingSubProgramId !== sub.id) && sub.images && sub.images.length > 0 && (
                                <div className="pt-2">
                                  <p className="text-[10px] text-slate-400 font-bold mb-1.5">الصور الحالية المرفقة بالمبادرة:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {sub.images.map((imgUrl, i) => (
                                      <div key={i} className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                                        <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* SUB-PROGRAM EDIT PANEL */}
                              {editingSubProgramId === sub.id && (
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-xs">
                                  <div className="border-b pb-2 mb-2">
                                    <h5 className="font-bold text-slate-700 flex items-center gap-1.5">
                                      <Edit className="w-3.5 h-3.5 text-blue-600" />
                                      تعديل المبادرة الفرعية ومعرض صورها
                                    </h5>
                                  </div>

                                  <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-bold mb-1 opacity-80">عنوان المبادرة الفرعية *</label>
                                        <input
                                          type="text"
                                          value={tempSubTitle}
                                          onChange={(e) => setTempSubTitle(e.target.value)}
                                          className="w-full p-2 border rounded-lg bg-white text-xs outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-xs font-bold mb-1 opacity-80">تاريخ المبادرة (لربطها مباشرة بالتقويم الموحد)</label>
                                        <input
                                          type="date"
                                          value={tempSubDate}
                                          onChange={(e) => setTempSubDate(e.target.value)}
                                          className="w-full p-2 border rounded-lg bg-white text-xs outline-none focus:ring-1 focus:ring-[var(--primary-color)] font-mono"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-bold mb-1 opacity-80">وقت البداية (من)</label>
                                        <input
                                          type="time"
                                          value={tempSubTimeFrom}
                                          onChange={(e) => setTempSubTimeFrom(e.target.value)}
                                          className="w-full p-2 border rounded-lg bg-white text-xs outline-none focus:ring-1 focus:ring-[var(--primary-color)] font-mono"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-xs font-bold mb-1 opacity-80">وقت النهاية (إلى)</label>
                                        <input
                                          type="time"
                                          value={tempSubTimeTo}
                                          onChange={(e) => setTempSubTimeTo(e.target.value)}
                                          className="w-full p-2 border rounded-lg bg-white text-xs outline-none focus:ring-1 focus:ring-[var(--primary-color)] font-mono"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-xs font-bold mb-1 opacity-80">موقع إقامة المبادرة (المكان)</label>
                                      <input
                                        type="text"
                                        value={tempSubLocation}
                                        onChange={(e) => setTempSubLocation(e.target.value)}
                                        className="w-full p-2 border rounded-lg bg-white text-xs outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                                        placeholder="مثال: مقر المركز بالمسقي / الملعب الرياضي / قاعة التدريب"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-xs font-bold mb-1 opacity-80">وصف وتفاصيل المبادرة الفرعية *</label>
                                      <textarea
                                        value={tempSubDesc}
                                        onChange={(e) => setTempSubDesc(e.target.value)}
                                        rows={3}
                                        className="w-full p-2 border rounded-lg bg-white text-xs outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                                        placeholder="اكتب هنا تفاصيل ومحاور المبادرة بالتفصيل..."
                                      />
                                    </div>

                                    {/* Seats booking settings */}
                                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-3 mt-2">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Users className="w-4 h-4 text-[var(--primary-color)]" />
                                          <div>
                                            <p className="text-xs font-bold text-slate-800">تفعيل حجز المقاعد للمبادرة الفرعية</p>
                                            <p className="text-[10px] text-slate-500">تمكين الزوار من حجز مقعد وحساب المقاعد المتبقية تلقائياً</p>
                                          </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={tempSubSeatsEnabled}
                                            onChange={(e) => setTempSubSeatsEnabled(e.target.checked)}
                                            className="sr-only peer"
                                          />
                                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary-color)]"></div>
                                        </label>
                                      </div>

                                      {tempSubSeatsEnabled && (
                                        <div className="pt-2 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div>
                                            <label className="block text-xs font-bold mb-1 text-slate-700">العدد الأقصى للمقاعد المتاحة</label>
                                            <input
                                              type="number"
                                              min={1}
                                              value={tempSubSeatsTotal}
                                              onChange={(e) => setTempSubSeatsTotal(parseInt(e.target.value) || 50)}
                                              className="w-full p-2 border rounded-lg bg-white text-xs outline-none focus:ring-1 focus:ring-[var(--primary-color)] font-mono"
                                            />
                                          </div>
                                          <div className="flex items-end">
                                            <div className="text-[11px] text-slate-600 bg-amber-50 border border-amber-100 rounded-lg p-2 leading-relaxed">
                                              ملاحظة: سيتم عرض حالة الحجز في صفحة المبادرة والتقويم الموحد، وتحديث المقاعد المتبقية مباشرة عند تسجيل أي زائر أو عضو.
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Sub-Program Images Management */}
                                  <div className="bg-white p-3 border rounded-xl space-y-3">
                                    <p className="font-bold text-slate-700 flex items-center gap-1 text-xs">
                                      <ImageIcon className="w-3.5 h-3.5 text-[var(--primary-color)]" />
                                      معرض صور المبادرة والمرفقات البصرية ({tempSubImages.length})
                                    </p>
                                    
                                    {tempSubImages.length === 0 ? (
                                      <p className="text-[11px] text-slate-400 italic">لا توجد صور مضافة للمبادرة حالياً.</p>
                                    ) : (
                                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                        {tempSubImages.map((imgUrl, idx) => (
                                          <div key={idx} className="relative group border rounded-lg overflow-hidden bg-slate-50 h-20">
                                            <img src={imgUrl} alt="Sub-program item" className="w-full h-full object-cover" />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const updatedImg = tempSubImages.filter((_, i) => i !== idx);
                                                setTempSubImages(updatedImg);
                                              }}
                                              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-90 hover:opacity-100 shadow-sm"
                                              title="حذف الصورة"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Upload/Add New Image Controls */}
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-slate-100">
                                      <div className="flex-1 flex items-center gap-2">
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              triggerBase64Convert(file, (base64) => {
                                                setTempSubImages([...tempSubImages, base64]);
                                              });
                                            }
                                          }}
                                          className="hidden"
                                          id={`upload-sub-img-${sub.id}`}
                                        />
                                        <label
                                          htmlFor={`upload-sub-img-${sub.id}`}
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                                        >
                                          <Upload className="w-3.5 h-3.5" /> تحميل صورة جديدة
                                        </label>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            const url = prompt("أدخل رابط الصورة المباشر من الإنترنت:");
                                            if (url) {
                                              setTempSubImages([...tempSubImages, url]);
                                            }
                                          }}
                                          className="px-2.5 py-1.5 bg-sky-50 text-sky-800 border border-sky-100 rounded-lg text-xs font-bold hover:bg-sky-100"
                                        >
                                          + إضافة برابط مباشر
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Sub-Program Edit Actions */}
                                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveSubProgram(prog.id, sub.id)}
                                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-1"
                                    >
                                      <Check className="w-3.5 h-3.5" /> حفظ المبادرة
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingSubProgramId(null)}
                                      className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg flex items-center gap-1"
                                    >
                                      <X className="w-3.5 h-3.5" /> إلغاء
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: EVENTS AND ATTENDEES BOOKING MANAGER */}
          {activeTab === "events" && (
            <div id="tab-events" className="space-y-6">
              <h2 className="text-xl font-bold border-b pb-3 mb-6 flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-[var(--primary-color)]" />
                  الفعاليات وتأكيد حجوزات المقاعد
                </span>
                
                <button
                  onClick={() => {
                    const title = prompt("أدخل اسم الفعالية الجديدة:");
                    if (!title) return;
                    const newEvt: EventItem = {
                      id: `e_${Date.now()}`,
                      title,
                      shortDesc: "وصف موجز ومميز للفعالية.",
                      fullDesc: "تفاصيل الفعالية الكاملة، شروط التسجيل، والمحاور المطروحة للتطوير الاجتماعي.",
                      image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600",
                      date: "2026-07-15",
                      startTime: "16:30",
                      endTime: "19:00",
                      location: "مقر مركز المسقي الرئيسي",
                      mapUrl: "",
                      seatsTotal: 50,
                      seatsRemaining: 50,
                      status: "open",
                      registrations: []
                    };
                    saveAction("إضافة فعالية جديدة", saveAdminEvents(adminId, [...db.events, newEvt]));
                  }}
                  className="px-3 py-1.5 bg-[var(--primary-color)] text-white font-bold rounded-lg text-xs flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> إضافة فعالية جديدة
                </button>
              </h2>

              <div className="space-y-8">
                {db.events.map((evt, eIdx) => (
                  <div key={evt.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/30 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-3 border-b border-slate-100 gap-3">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-base">{evt.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">تاريخ الفعالية: {evt.date} | المقاعد المتاحة: {evt.seatsRemaining} من أصل {evt.seatsTotal}</p>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <button
                          onClick={() => {
                            const updatedList = db.events.filter(e => e.id !== evt.id);
                            if (evt.id.startsWith("e_")) {
                              const subId = evt.id.substring(2);
                              const updatedPrograms = db.programs.map(p => ({
                                ...p,
                                subPrograms: p.subPrograms.filter(s => s.id !== subId)
                              }));
                              const compositeSave = (async () => {
                                const evtRes = await saveAdminEvents(adminId, updatedList);
                                if (!evtRes.success) return evtRes;
                                const progRes = await saveAdminPrograms(adminId, updatedPrograms);
                                return progRes;
                              })();
                              saveAction("حذف الفعالية والمبادرة المرتبطة بها", compositeSave);
                            } else {
                              saveAction("حذف الفعالية", saveAdminEvents(adminId, updatedList));
                            }
                          }}
                          className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Booking Applications Table */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap justify-between items-center gap-2 pb-1 border-b border-slate-100">
                        <p className="text-xs font-extrabold text-slate-700">قائمة طلبات حجز المقاعد المرفقة للفعالية:</p>
                        {evt.registrations.length > 0 && (
                          <button
                            onClick={() => exportRegistrationsToExcel(evt)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                            title="تصدير القائمة كاملة إلى ملف إكسل مع الشعار والتفاصيل"
                          >
                            <Download className="w-3.5 h-3.5" />
                            تصدير القائمة إلى Excel
                          </button>
                        )}
                      </div>
                      {evt.registrations.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">لا توجد طلبات حجز مسجلة لهذه الفعالية حالياً.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-right border">
                            <thead>
                              <tr className="bg-slate-100 border-b">
                                <th className="p-2 border">الاسم بالبطاقة</th>
                                <th className="p-2 border">رقم الجوال</th>
                                <th className="p-2 border">رقم العضوية</th>
                                <th className="p-2 border">حالة الطلب</th>
                                <th className="p-2 border text-center">إجراءات الاعتماد</th>
                              </tr>
                            </thead>
                            <tbody>
                              {evt.registrations.map((reg, rIdx) => (
                                <tr key={rIdx} className="border-b bg-white">
                                  <td className="p-2 border font-semibold">{reg.name}</td>
                                  <td className="p-2 border text-left font-mono">{reg.phone}</td>
                                  <td className="p-2 border font-bold text-emerald-800">{reg.memberId}</td>
                                  <td className="p-2 border">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      reg.status === "approved" ? "bg-emerald-100 text-emerald-800" :
                                      reg.status === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                                    }`}>
                                      {reg.status === "approved" ? "مقبول ومؤكد" : reg.status === "rejected" ? "مرفوض" : "قيد المراجعة"}
                                    </span>
                                  </td>
                                  <td className="p-2 border flex justify-center gap-1">
                                    <button
                                      onClick={() => {
                                        // Approve and deduct remaining seat count
                                        const updatedReg = evt.registrations.map((r, idx) => idx === rIdx ? { ...r, status: "approved" as any } : r);
                                        const seatsLeft = Math.max(0, evt.seatsTotal - updatedReg.filter(r => r.status === "approved").length);
                                        const updatedEvt = { ...evt, registrations: updatedReg, seatsRemaining: seatsLeft };
                                        const updatedList = db.events.map(e => e.id === evt.id ? updatedEvt : e);
                                        saveAction("قبول حجز مقعد", saveAdminEvents(adminId, updatedList));
                                      }}
                                      className="p-1 bg-emerald-50 text-emerald-800 border rounded"
                                      title="قبول وتأكيد"
                                    >
                                      قبول
                                    </button>
                                    <button
                                      onClick={() => {
                                        const updatedReg = evt.registrations.map((r, idx) => idx === rIdx ? { ...r, status: "rejected" as any } : r);
                                        const seatsLeft = Math.max(0, evt.seatsTotal - updatedReg.filter(r => r.status === "approved").length);
                                        const updatedEvt = { ...evt, registrations: updatedReg, seatsRemaining: seatsLeft };
                                        const updatedList = db.events.map(e => e.id === evt.id ? updatedEvt : e);
                                        saveAction("رفض طلب حجز", saveAdminEvents(adminId, updatedList));
                                      }}
                                      className="p-1 bg-rose-50 text-rose-800 border rounded"
                                      title="رفض الطلب"
                                    >
                                      رفض
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: MEMBERS WORKSPACE DATABASE */}
          {activeTab === "members" && (
            <div id="tab-members" className="space-y-6">
              <h2 className="text-xl font-bold border-b pb-3 mb-6 flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[var(--primary-color)]" />
                  قاعدة بيانات العضويات الرقمية الرسمية
                </span>
              </h2>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-right border">
                  <thead>
                    <tr className="bg-slate-100 border-b">
                      <th className="p-3 border">الاسم الثلاثي المعتمد</th>
                      <th className="p-3 border">الجنس</th>
                      <th className="p-3 border">رقم العضوية</th>
                      <th className="p-3 border">رقم الجوال</th>
                      <th className="p-3 border">تاريخ الانضمام</th>
                      <th className="p-3 border">كلمة السر</th>
                      <th className="p-3 border">الحالة</th>
                      <th className="p-3 border text-center">إجراءات المشرف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {db.members.map((member) => (
                      <tr key={member.id} className="border-b bg-white hover:bg-slate-50/50">
                        <td className="p-3 border font-semibold">
                          <span>{member.tripleName}</span>
                        </td>
                        <td className="p-3 border">{member.gender === "female" ? "أنثى" : "ذكر"}</td>
                        <td className="p-3 border font-extrabold text-[var(--primary-color)] font-mono">{member.id}</td>
                        <td className="p-3 border text-left font-mono">{member.phone}</td>
                        <td className="p-3 border">{new Date(member.createdAt).toLocaleDateString("ar-SA")}</td>
                        <td className="p-3 border">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            member.passwordHash ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"
                          }`}>
                            {member.passwordHash ? "مُفعّلة" : "غير مُحددة"}
                          </span>
                        </td>
                        <td className="p-3 border">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            member.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {member.status === "active" ? "نشط معتمد" : "معلق"}
                          </span>
                        </td>
                        <td className="p-3 border text-center flex justify-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setPasswordEditMember(member);
                              setNewMemberPassword("");
                              setConfirmMemberPassword("");
                            }}
                            className="px-2 py-1 bg-blue-50 text-blue-800 font-bold rounded border border-blue-100 hover:bg-blue-100 flex items-center gap-1"
                            title="تغيير كلمة سر العضوية"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            كلمة السر
                          </button>
                          {member.status === "pending" && (
                            <button
                              onClick={() => {
                                const updatedList = db.members.map(m => m.id === member.id ? { ...m, status: "active" as any } : m);
                                saveAction("اعتماد وتفعيل العضوية", saveAdminMembers(adminId, updatedList));
                              }}
                              className="px-2 py-1 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700"
                            >
                              موافقة وتفعيل
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const updatedList = db.members.filter(m => m.id !== member.id);
                              saveAction("شطب العضوية المحددة", saveAdminMembers(adminId, updatedList));
                            }}
                            className="p-1 bg-rose-50 text-rose-700 rounded border hover:bg-rose-100"
                            title="حذف وشطب"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {passwordEditMember && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
                  <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6">
                    <div className="flex justify-between items-start gap-3 mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <Lock className="w-5 h-5 text-[var(--primary-color)]" />
                          تغيير كلمة سر العضوية
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {passwordEditMember.tripleName} — <span className="font-mono font-bold">{passwordEditMember.id}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={closeMemberPasswordEditor}
                        className="p-1 rounded hover:bg-slate-100"
                        aria-label="إغلاق"
                      >
                        <X className="w-5 h-5 text-slate-500" />
                      </button>
                    </div>

                    <form onSubmit={handleAdminSetMemberPassword} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-700">كلمة السر الجديدة *</label>
                        <input
                          type="password"
                          required
                          minLength={4}
                          value={newMemberPassword}
                          onChange={(e) => setNewMemberPassword(e.target.value)}
                          className="w-full p-3 border border-slate-200 rounded-lg text-sm"
                          placeholder="4 أحرف على الأقل"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-700">تأكيد كلمة السر *</label>
                        <input
                          type="password"
                          required
                          minLength={4}
                          value={confirmMemberPassword}
                          onChange={(e) => setConfirmMemberPassword(e.target.value)}
                          className="w-full p-3 border border-slate-200 rounded-lg text-sm"
                          placeholder="أعد إدخال كلمة السر"
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={closeMemberPasswordEditor}
                          className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 py-2.5 bg-[var(--primary-color)] text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50"
                        >
                          {loading ? "جاري الحفظ..." : "حفظ كلمة السر"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 10: SURVEY BUILDER SECTION */}
          {activeTab === "surveys" && (
            <div id="tab-surveys" className="space-y-6">
              <h2 className="text-xl font-bold border-b pb-3 mb-6 flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[var(--primary-color)]" />
                  تحرير وبناء استطلاعات الرأي والاستبيانات
                </span>
                
                <button
                  onClick={() => {
                    const title = prompt("أدخل عنوان الاستبيان الجديد:");
                    if (!title) return;
                    const newSurvey: SurveyItem = {
                      id: `s_${Date.now()}`,
                      title,
                      startDate: "2026-07-02",
                      questions: [
                        { id: `q1_${Date.now()}`, type: "mcq", questionText: "ما رأيك في برامج النشاط الرياضي المتاحة؟", options: ["ممتاز جداً", "مرضي ومناسب", "يحتاج تطوير وتعديل"] }
                      ],
                      endDate: "2026-08-31",
                      responses: [],
                      votesCount: 0
                    };
                    saveAction("بناء استبيان جديد", saveAdminSurveys(adminId, [...db.surveys, newSurvey]));
                  }}
                  className="px-3 py-1.5 bg-[var(--primary-color)] text-white font-bold rounded-lg text-xs flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> إنشاء استبيان جديد
                </button>
              </h2>

              <div className="space-y-6">
                {db.surveys.map((srv) => (
                  <div key={srv.id} className="p-4 border rounded-2xl bg-slate-50/50 space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h3 className="font-extrabold text-slate-800 text-sm">{srv.title}</h3>
                      <button
                        onClick={() => {
                          const updatedList = db.surveys.filter(s => s.id !== srv.id);
                          saveAction("شطب الاستبيان", saveAdminSurveys(adminId, updatedList));
                        }}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className="text-xs text-slate-500">إجمالي الأصوات والمشاركات الموثقة: <strong className="text-slate-800">{srv.responses.length} صوت</strong></p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 11: PHOTO GALLERY */}
          {activeTab === "gallery" && (
            <div id="tab-gallery" className="space-y-6">
              <h2 className="text-xl font-bold border-b pb-3 mb-6 flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Image className="w-5 h-5 text-[var(--primary-color)]" />
                  إدارة ألبومات الصور والفعاليات بالمسقي
                </span>
                
                <button
                  onClick={() => {
                    const title = prompt("أدخل اسم ألبوم الصور الجديد:");
                    if (!title) return;
                    const newAlbum: GalleryAlbum = {
                      id: `a_${Date.now()}`,
                      title,
                      description: "تغطية فوتوغرافية شاملة لأهم مناشط مركز المسقي.",
                      coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600",
                      order: db.gallery.length + 1,
                      photos: []
                    };
                    saveAction("إضافة ألبوم المعرض", saveAdminGallery(adminId, [...db.gallery, newAlbum]));
                  }}
                  className="px-3 py-1.5 bg-[var(--primary-color)] text-white font-bold rounded-lg text-xs flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> إضافة ألبوم فوتوغرافي
                </button>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {db.gallery.sort((a,b)=>a.order - b.order).map((album) => (
                  <div key={album.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                    <div className="h-32 bg-slate-100 overflow-hidden relative">
                      <img src={album.coverImage} alt={album.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded">
                        {album.photos.length} صور
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-2">
                      <h3 className="font-bold text-slate-800 text-sm">{album.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{album.description}</p>
                      
                      <div className="pt-2 flex justify-between items-center border-t border-slate-50">
                        <button
                          onClick={() => {
                            const desc = prompt("أدخل الوصف أو التعليق على الصورة الجديدة:");
                            const imgUrl = prompt("أدخل رابط عنوان الصورة المباشر أو الرمز:");
                            if (!imgUrl) return;
                            const newPhoto = {
                              id: `ph_${Date.now()}`,
                              url: imgUrl,
                              description: desc || "ملتقى المسقي",
                              order: album.photos.length + 1
                            };
                            const updatedAlbum = { ...album, photos: [...album.photos, newPhoto] };
                            const updatedList = db.gallery.map(g => g.id === album.id ? updatedAlbum : g);
                            saveAction("إضافة صورة للألبوم", saveAdminGallery(adminId, updatedList));
                          }}
                          className="text-[11px] text-[var(--primary-color)] font-bold hover:underline"
                        >
                          + إضافة صورة
                        </button>
                        
                        <button
                          onClick={() => {
                            const updatedList = db.gallery.filter(g => g.id !== album.id);
                            saveAction("حذف ألبوم الصور", saveAdminGallery(adminId, updatedList));
                          }}
                          className="text-rose-600 hover:bg-rose-50 p-1.5 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 12: BACKUPS AND RECOVERY SYSTEM */}
          {activeTab === "backups" && (
            <div id="tab-backups" className="space-y-6">
              <h2 className="text-xl font-bold border-b pb-3 mb-6 flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-[var(--primary-color)]" />
                  أدوات النسخ الاحتياطي والصيانة الوقائية
                </span>

                <button
                  onClick={async () => {
                    setLoading(true);
                    setOpStatus(null);
                    try {
                      const res = await createBackup(adminId);
                      if (res.success) {
                        setOpStatus({ type: "success", text: `تم إنشاء نسخة صيانة جديدة بالمعرف: ${res.backup.id}` });
                        loadDbData();
                      }
                    } catch (err: any) {
                      setOpStatus({ type: "error", text: "فشل إنشاء نسخة الصيانة الدورية." });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="px-3 py-1.5 bg-[var(--primary-color)] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" /> إنشاء نسخة احتياطية فورية
                </button>
              </h2>

              <div className="space-y-4">
                {db.backups && db.backups.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">لا توجد سجلات نسخ احتياطية محفوظة حالياً.</p>
                ) : (
                  db.backups?.map((bk) => (
                    <div key={bk.id} className="p-4 border rounded-xl flex justify-between items-center bg-slate-50">
                      <div>
                        <p className="font-bold text-xs text-slate-800">نسخة احتياطية: {bk.id}</p>
                        <p className="text-[10px] text-slate-400 mt-1">تاريخ الإنشاء: {bk.createdAt} | الحجم: {bk.size}</p>
                      </div>

                      <div className="flex gap-2 text-xs">
                        <button
                          onClick={async () => {
                            if (!confirm("هل أنت متأكد تماماً من استعادة هذه النسخة؟ سيتم تبديل كافة البيانات الحالية بالبيانات المحفوظة.")) return;
                            setLoading(true);
                            try {
                              const res = await restoreBackup(adminId, bk.id);
                              if (res.success) {
                                alert("تم استعادة قاعدة البيانات بنجاح! جاري تحديث الشاشة.");
                                window.location.reload();
                              }
                            } catch (err) {
                              alert("فشلت عملية الاستعادة.");
                            } finally {
                              setLoading(false);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-emerald-50 text-emerald-800 border rounded font-semibold"
                        >
                          استعادة
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm("حذف هذه النسخة نهائياً؟")) return;
                            setLoading(true);
                            try {
                              const res = await deleteBackup(adminId, bk.id);
                              if (res.success) {
                                loadDbData();
                              }
                            } catch (err) {
                              alert("فشل الحذف.");
                            } finally {
                              setLoading(false);
                            }
                          }}
                          className="p-1.5 bg-rose-50 text-rose-700 rounded border hover:bg-rose-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 13: SYSTEM AUDIT LOGS */}
          {activeTab === "logs" && (
            <div id="tab-logs" className="space-y-6">
              <h2 className="text-xl font-bold border-b pb-3 mb-6 flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[var(--primary-color)]" />
                  سجل رقابة عمليات النظام والإشراف
                </span>
                
                <button
                  onClick={() => {
                    // Refresh logs quickly
                    loadDbData();
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-600 flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> تحديث السجل
                </button>
              </h2>

              <div className="border rounded-2xl overflow-hidden bg-slate-50 max-h-96 overflow-y-auto">
                <div className="divide-y divide-slate-200">
                  {db.logs.sort((a,b)=> new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((log) => (
                    <div key={log.id} className="p-3 text-xs leading-relaxed flex justify-between items-start hover:bg-white transition-colors">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-800">{log.action}</p>
                        <p className="text-[10px] text-slate-400">المسؤول: <strong className="text-slate-600">{log.adminId}</strong></p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                        {new Date(log.timestamp).toLocaleString("ar-SA")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 14: ADMIN USER ACCOUNTS MANAGEMENT */}
          {activeTab === "adminUsers" && (
            <div id="tab-admin-users" className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                    <Lock className="w-5 h-5 text-[var(--primary-color)]" />
                    إدارة حسابات المشرفين وصلاحيات الوصول
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    إدارة بيانات دخول المشرفين، تغيير كلمات المرور، وإضافة مشرفين جدد للمنصة.
                  </p>
                </div>
                {!isAddingAdmin && !editingAdminId && (
                  <button
                    onClick={() => {
                      setAdminForm({
                        username: "",
                        name: "",
                        passwordHash: "",
                        role: "content_manager"
                      });
                      setIsAddingAdmin(true);
                      setEditingAdminId(null);
                    }}
                    className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> إضافة مشرف جديد
                  </button>
                )}
              </div>

              {/* Add or Edit Admin Form */}
              {(isAddingAdmin || editingAdminId) && (
                <div className="p-5 border border-slate-200 rounded-3xl bg-slate-50/50 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    {editingAdminId ? (
                      <>
                        <Edit className="w-4 h-4 text-[var(--primary-color)]" />
                        تعديل حساب المشرف: {adminForm.username}
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-emerald-600" />
                        إنشاء حساب مشرف جديد
                      </>
                    )}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1 opacity-80 text-slate-700">الاسم الكامل للمشرف *</label>
                      <input
                        type="text"
                        value={adminForm.name}
                        onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                        className="w-full p-2.5 border rounded-lg bg-white text-xs font-semibold focus:outline-[var(--primary-color)]"
                        placeholder="مثال: محمد أحمد"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1 opacity-80 text-slate-700">اسم المستخدم (للتسجيل) *</label>
                      <input
                        type="text"
                        value={adminForm.username}
                        onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value.trim() })}
                        className="w-full p-2.5 border rounded-lg bg-white text-left font-mono text-xs focus:outline-[var(--primary-color)]"
                        placeholder="username"
                        required
                        disabled={!!editingAdminId}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1 opacity-80 text-slate-700">الرقم السري / كلمة المرور *</label>
                      <input
                        type="text"
                        value={adminForm.passwordHash}
                        onChange={(e) => setAdminForm({ ...adminForm, passwordHash: e.target.value })}
                        className="w-full p-2.5 border rounded-lg bg-white text-left font-mono text-xs focus:outline-[var(--primary-color)]"
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1 opacity-80 text-slate-700">الدور وصلاحيات الوصول *</label>
                      <select
                        value={adminForm.role}
                        onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value as any })}
                        className="w-full p-2.5 border rounded-lg bg-white text-xs cursor-pointer focus:outline-[var(--primary-color)]"
                      >
                        <option value="admin">مدير النظام العام (Admin)</option>
                        <option value="content_manager">مدير المحتوى والأقسام (Content Manager)</option>
                        <option value="member_manager">مدير شؤون العضويات (Member Manager)</option>
                        <option value="event_manager">منسق ومشرّف الفعاليات (Event Manager)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingAdmin(false);
                        setEditingAdminId(null);
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!adminForm.name || !adminForm.username || !adminForm.passwordHash) {
                          alert("الرجاء تعبئة جميع الحقول المطلوبة.");
                          return;
                        }

                        // Get current admin user record from state/db
                        const currentLoggedIn = db.admins.find(a => a.id === adminId);
                        if (currentLoggedIn?.role !== "admin") {
                          alert("عذراً، صلاحياتك الحالية لا تسمح لك بإضافة أو تعديل حسابات المشرفين. يجب أن تكون مدير نظام عام.");
                          return;
                        }

                        let updatedAdmins = [...db.admins];

                        if (editingAdminId) {
                          // Update
                          updatedAdmins = updatedAdmins.map(a => {
                            if (a.id === editingAdminId) {
                              return {
                                ...a,
                                name: adminForm.name,
                                passwordHash: adminForm.passwordHash,
                                role: adminForm.role
                              };
                            }
                            return a;
                          });
                          await saveAction("تعديل بيانات المشرف", saveAdminUsers(adminId, updatedAdmins));
                        } else {
                          // Add new
                          const exists = updatedAdmins.some(a => a.username.toLowerCase() === adminForm.username.toLowerCase());
                          if (exists) {
                            alert("اسم المستخدم هذا مسجل مسبقاً لمشرف آخر. يرجى اختيار اسم مستخدم مختلف.");
                            return;
                          }

                          const newAdmin = {
                            id: "adm_" + Date.now(),
                            username: adminForm.username,
                            name: adminForm.name,
                            passwordHash: adminForm.passwordHash,
                            role: adminForm.role
                          };
                          updatedAdmins.push(newAdmin);
                          await saveAction("إضافة مشرف جديد", saveAdminUsers(adminId, updatedAdmins));
                        }

                        setIsAddingAdmin(false);
                        setEditingAdminId(null);
                      }}
                      className="px-4 py-2 bg-[var(--primary-color)] text-white hover:opacity-95 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      {editingAdminId ? "حفظ التعديلات" : "إنشاء الحساب"}
                    </button>
                  </div>
                </div>
              )}

              {/* Admins List Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {db.admins.map((adm) => {
                  const getRoleLabel = (role: string) => {
                    switch (role) {
                      case "admin":
                        return { label: "مدير نظام عام", color: "bg-purple-50 text-purple-700 border-purple-100" };
                      case "content_manager":
                        return { label: "مدير محتوى", color: "bg-blue-50 text-blue-700 border-blue-100" };
                      case "member_manager":
                        return { label: "مدير عضويات", color: "bg-emerald-50 text-emerald-700 border-emerald-100" };
                      case "event_manager":
                        return { label: "منسق فعاليات", color: "bg-amber-50 text-amber-700 border-amber-100" };
                      default:
                        return { label: role, color: "bg-slate-50 text-slate-700 border-slate-100" };
                    }
                  };

                  const roleInfo = getRoleLabel(adm.role);

                  return (
                    <div key={adm.id} className="p-4 bg-slate-50/40 border border-slate-150 rounded-2xl flex justify-between items-center hover:border-[var(--primary-color)]/30 transition-all font-sans">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-800 text-sm font-bold">{adm.name}</strong>
                          <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-md ${roleInfo.color}`}>
                            {roleInfo.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono">
                          اسم المستخدم: <strong className="text-slate-700">{adm.username}</strong>
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          كلمة المرور: <strong className="text-slate-600 font-semibold">{adm.passwordHash}</strong>
                        </p>
                      </div>

                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAdminForm({
                              id: adm.id,
                              username: adm.username,
                              name: adm.name,
                              passwordHash: adm.passwordHash,
                              role: adm.role
                            });
                            setEditingAdminId(adm.id);
                            setIsAddingAdmin(false);
                          }}
                          className="p-1.5 bg-white text-slate-600 hover:text-[var(--primary-color)] rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          title="تعديل الحساب"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (adm.id === adminId) {
                              alert("عذراً، لا يمكنك حذف حسابك الذي تسجل به دخولك حالياً.");
                              return;
                            }

                            const currentLoggedIn = db.admins.find(a => a.id === adminId);
                            if (currentLoggedIn?.role !== "admin") {
                              alert("عذراً، صلاحياتك الحالية لا تسمح لك بحذف حسابات المشرفين. يجب أن تكون مدير نظام عام.");
                              return;
                            }

                            const adminCount = db.admins.filter(a => a.role === "admin").length;
                            if (adm.role === "admin" && adminCount <= 1) {
                              alert("عذراً، لا يمكن حذف هذا الحساب لأن النظام يحتاج إلى وجود مدير عام واحد (Admin) على الأقل.");
                              return;
                            }

                            if (confirm(`هل أنت متأكد من رغبتك في حذف حساب المشرف (${adm.name}) بشكل نهائي؟`)) {
                              const updatedAdmins = db.admins.filter(a => a.id !== adm.id);
                              await saveAction("حذف حساب المشرف", saveAdminUsers(adminId, updatedAdmins));
                            }
                          }}
                          className="p-1.5 bg-white text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          title="حذف الحساب"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
