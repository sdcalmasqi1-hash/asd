/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { MemberProfile, SystemSettings } from "../types";
import {
  registerMember,
  loginMember,
  lookupMembersByPhone,
  updateMemberProfile,
  buildMembershipVerifyUrl,
  verifyMemberById,
  VerifiedMemberProfile
} from "../lib/api";
import { MembershipQrCode, renderMembershipQrDataUrl } from "./MembershipQrCode";
import { CreditCard, LogIn, UserPlus, Image as ImageIcon, QrCode, Download, Share2, Printer, Search, CheckCircle, Clock, AlertCircle, FileText, Lock } from "lucide-react";

const hijriMonths = [
  { value: "01", label: "01 - محرم" },
  { value: "02", label: "02 - صفر" },
  { value: "03", label: "03 - ربيع الأول" },
  { value: "04", label: "04 - ربيع الآخر" },
  { value: "05", label: "05 - جمادى الأولى" },
  { value: "06", label: "06 - جمادى الآخرة" },
  { value: "07", label: "07 - رجب" },
  { value: "08", label: "08 - شعبان" },
  { value: "09", label: "09 - رمضان" },
  { value: "10", label: "10 - شوال" },
  { value: "11", label: "11 - ذو القعدة" },
  { value: "12", label: "12 - ذو الحجة" },
];

const gregorianMonths = [
  { value: "01", label: "01 - يناير" },
  { value: "02", label: "02 - فبراير" },
  { value: "03", label: "03 - مارس" },
  { value: "04", label: "04 - أبريل" },
  { value: "05", label: "05 - مايو" },
  { value: "06", label: "06 - يونيو" },
  { value: "07", label: "07 - يوليو" },
  { value: "08", label: "08 - أغسطس" },
  { value: "09", label: "09 - سبتمبر" },
  { value: "10", label: "10 - أكتوبر" },
  { value: "11", label: "11 - نوفمبر" },
  { value: "12", label: "12 - ديسمبر" },
];

const daysList = Array.from({ length: 30 }, (_, i) => {
  const dayVal = (i + 1).toString().padStart(2, "0");
  return { value: dayVal, label: dayVal };
});

const gregorianDaysList = Array.from({ length: 31 }, (_, i) => {
  const dayVal = (i + 1).toString().padStart(2, "0");
  return { value: dayVal, label: dayVal };
});

const hijriYears = Array.from({ length: 110 }, (_, i) => {
  const yr = (1460 - i).toString();
  return { value: yr, label: yr };
});

const gregorianYears = Array.from({ length: 110 }, (_, i) => {
  const yr = (2026 - i).toString();
  return { value: yr, label: yr };
});

export function MembershipSection({
  settings,
  loggedInMember,
  verifyMemberId,
  onClearVerify,
  onLoginSuccess,
  onLogout
}: {
  settings: SystemSettings;
  loggedInMember: MemberProfile | null;
  verifyMemberId?: string | null;
  onClearVerify?: () => void;
  onLoginSuccess: (member: MemberProfile) => void;
  onLogout: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"register" | "login" | "recover">("register");
  
  // Registration Form State
  const [regData, setRegData] = useState({
    tripleName: "",
    phone: "",
    email: "",
    birthDate: "1995-08-15",
    calendarType: "gregorian" as "hijri" | "gregorian",
    gender: "male" as "male" | "female",
    password: "",
    confirmPassword: ""
  });

  // Login state
  const [loginData, setLoginData] = useState({ memberId: "", phone: "", password: "" });

  // Account Recovery state
  const [recoveryPhone, setRecoveryPhone] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryStep, setRecoveryStep] = useState<"phone" | "password">("phone");
  const [recoveryCandidates, setRecoveryCandidates] = useState<Array<{ id: string; tripleName: string }>>([]);
  const [selectedRecoveryMemberId, setSelectedRecoveryMemberId] = useState("");

  // General indicators
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [verifiedMember, setVerifiedMember] = useState<VerifiedMemberProfile | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!verifyMemberId) {
      setVerifiedMember(null);
      setVerifyError(null);
      return;
    }
    let cancelled = false;
    setVerifyLoading(true);
    setVerifyError(null);
    verifyMemberById(verifyMemberId)
      .then((data) => {
        if (!cancelled) setVerifiedMember(data);
      })
      .catch((err: any) => {
        if (!cancelled) {
          setVerifiedMember(null);
          setVerifyError(
            err.message ||
              "تعذّر التحقق من العضوية. تأكد أن الموقع محدّث على السيرفر وأن رقم العضوية صحيح."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setVerifyLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [verifyMemberId]);

  // Scroll to verification result when opened from QR scan on mobile
  useEffect(() => {
    if (verifyMemberId && !verifyLoading) {
      const timer = setTimeout(() => {
        document.getElementById("membership-verify-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [verifyMemberId, verifyLoading, verifiedMember, verifyError]);

  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    if (regData.password.trim().length < 4) {
      setError("كلمة سر العضوية يجب أن تكون 4 أحرف على الأقل.");
      setLoading(false);
      return;
    }
    if (regData.password !== regData.confirmPassword) {
      setError("كلمة سر العضوية وتأكيدها غير متطابقين.");
      setLoading(false);
      return;
    }
    try {
      const { confirmPassword, ...payload } = regData;
      const response = await registerMember(payload);
      if (response.success) {
        setSuccess("تم إنشاء عضويتك الرقمية بنجاح! احفظ كلمة السر — ستحتاجها لعرض بطاقتك لاحقاً.");
        setTimeout(() => {
          onLoginSuccess(response.member);
          setSuccess(null);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء تسجيل العضوية.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await loginMember(loginData.memberId, loginData.phone, loginData.password);
      if (response.success) {
        onLoginSuccess(response.member);
      }
    } catch (err: any) {
      setError(err.message || "بيانات تسجيل الدخول غير مطابقة.");
    } finally {
      setLoading(false);
    }
  };

  const resetRecoveryFlow = () => {
    setRecoveryStep("phone");
    setRecoveryCandidates([]);
    setSelectedRecoveryMemberId("");
    setRecoveryPassword("");
  };

  const handleRecoveryPhoneSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRecoveryCandidates([]);
    try {
      const response = await lookupMembersByPhone(recoveryPhone.trim());
      if (response.success && response.members.length > 0) {
        setRecoveryCandidates(response.members);
        setSelectedRecoveryMemberId(response.members.length === 1 ? response.members[0].id : "");
        setRecoveryStep("password");
        setRecoveryPassword("");
      }
    } catch (err: any) {
      setError(err.message || "فشلت عملية البحث.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecoveryPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryCandidates.length > 1 && !selectedRecoveryMemberId) {
      setError("يرجى اختيار العضوية المراد عرضها.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const memberId = selectedRecoveryMemberId || recoveryCandidates[0]?.id || "";
      const response = await loginMember(memberId, recoveryPhone.trim(), recoveryPassword);
      if (response.success) {
        onLoginSuccess(response.member);
        resetRecoveryFlow();
        setRecoveryPhone("");
      }
    } catch (err: any) {
      setError(err.message || "كلمة سر العضوية غير صحيحة.");
    } finally {
      setLoading(false);
    }
  };

  // Canvas badge image drawing and download helper
  const downloadCardAsImage = async () => {
    if (!loggedInMember) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 380;

    const grad = ctx.createLinearGradient(0, 0, 600, 380);
    grad.addColorStop(0, "#15803d");
    grad.addColorStop(0.5, "#166534");
    grad.addColorStop(1, "#0f172a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 380);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(600, 380, 200, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 150, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = "#eab308";
    ctx.fillRect(0, 368, 600, 12);

    ctx.strokeStyle = "rgba(234, 179, 8, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(15, 15, 570, 335);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px Cairo, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(settings.centerName, 550, 50);

    ctx.font = "12px Cairo, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("بطاقة العضوية الرقمية المعتمدة", 550, 72);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.moveTo(30, 90);
    ctx.lineTo(570, 90);
    ctx.stroke();

    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Cairo, sans-serif";
    ctx.fillText(loggedInMember.tripleName, 550, 140);

    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.font = "13px Cairo, sans-serif";
    ctx.fillText(`رقم الجوال: ${loggedInMember.phone}`, 550, 170);
    ctx.fillText(`الجنس: ${loggedInMember.gender === "male" ? "ذكر" : "أنثى"}`, 550, 195);
    ctx.fillText(`تاريخ الميلاد: ${loggedInMember.birthDate} (${loggedInMember.calendarType === "hijri" ? "هجري" : "ميلادي"})`, 550, 220);
    ctx.fillText(`تاريخ الإصدار: ${new Date(loggedInMember.createdAt).toLocaleDateString("ar-SA")}`, 550, 245);
    ctx.fillText(`حالة العضوية: ${loggedInMember.status === "active" ? "نشط ومفعل" : "بانتظار الاعتماد"}`, 550, 270);

    ctx.fillStyle = "#eab308";
    ctx.font = "bold 26px Cairo, sans-serif";
    ctx.fillText(loggedInMember.id, 550, 315);

    ctx.fillStyle = "#ffffff";
    ctx.font = "11px Cairo, sans-serif";
    ctx.fillText("رقم العضوية الفريد", 550, 333);

    try {
      const qrDataUrl = await renderMembershipQrDataUrl(loggedInMember.id, 140);
      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => reject(new Error("QR render failed"));
      });
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(40, 115, 150, 150);
      ctx.drawImage(qrImg, 45, 120, 140, 140);
    } catch {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(45, 120, 140, 140);
      ctx.fillStyle = "#1e3a8a";
      ctx.font = "bold 14px Cairo, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(loggedInMember.id, 115, 190);
    }

    ctx.font = "10px Cairo, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.textAlign = "center";
    ctx.fillText("امسح رمز الاستجابة للتحقق", 115, 285);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    const link = document.createElement("a");
    link.download = `AlMasqi_Card_${loggedInMember.id}.jpg`;
    link.href = dataUrl;
    link.click();
  };

  // PDF Print card handler
  const printCardPDF = () => {
    window.print();
  };

  // Share card via Whatsapp redirect link
  const shareWhatsApp = () => {
    if (!loggedInMember) return;
    const text = `مرحباً بك! يسعدني مشاركة بطاقة العضوية الرقمية الخاصة بي في مركز النشاط الاجتماعي بالمسقي 🌸\n\nالاسم: ${loggedInMember.tripleName}\nرقم العضوية: ${loggedInMember.id}\nالتحقق من العضوية عبر الرابط: ${buildMembershipVerifyUrl(loggedInMember.id)}`;
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4" id="memberships-view">
      
      {/* Hidden canvas for JPEG card downloads */}
      <canvas ref={canvasRef} className="hidden" />

      {/* QR scan verification result */}
      {verifyMemberId && (
        <div
          id="membership-verify-result"
          className="mb-8 bg-[var(--card-bg)] border-2 border-[var(--primary-color)]/30 rounded-2xl p-6 shadow-lg no-print"
        >
          <div className="flex justify-between items-start gap-4 mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-[var(--primary-color)]">
              <QrCode className="w-5 h-5" />
              التحقق من بطاقة العضوية
            </h2>
            {onClearVerify && (
              <button
                type="button"
                onClick={onClearVerify}
                className="text-xs text-slate-500 hover:underline"
              >
                إغلاق
              </button>
            )}
          </div>

          {verifyLoading && (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-4 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-600">جاري التحقق من رقم العضوية <strong className="font-mono">{verifyMemberId}</strong>...</p>
            </div>
          )}

          {verifyError && !verifyLoading && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-semibold flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p>{verifyError}</p>
                <p className="text-xs font-normal mt-2 opacity-80">رقم العضوية الممسوح: {verifyMemberId}</p>
              </div>
            </div>
          )}

          {verifiedMember && !verifyLoading && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-sm font-bold">
                <CheckCircle className="w-5 h-5" />
                تم التحقق — البطاقة رسمية ومسجلة في مركز النشاط الاجتماعي بالمسقي
              </div>

              {/* Verified card preview (matches membership card design) */}
              <div
                className="relative overflow-hidden rounded-2xl text-white shadow-xl bg-gradient-to-br from-[var(--primary-color)] via-emerald-800 to-slate-900 border border-emerald-600/20 max-w-lg mx-auto"
                style={{ aspectRatio: "1.58 / 1" }}
              >
                <div className="absolute bottom-0 right-0 left-0 h-2.5 bg-yellow-400" />
                <div className="p-5 h-full flex flex-col justify-between relative z-10">
                  <div className="flex justify-between items-start pb-3 border-b border-white/10">
                    <div>
                      <h4 className="font-bold text-base leading-tight text-white">{settings.centerName}</h4>
                      <p className="text-[10px] text-white/70">بطاقة العضوية الرقمية المعتمدة — موثّقة</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
                      <img src={settings.logoMini} alt="" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  <div className="py-2 flex-grow">
                    <h3 className="font-bold text-lg text-white">{verifiedMember.tripleName}</h3>
                    <p className="text-[11px] text-white/80 mt-1">
                      الجنس: {verifiedMember.gender === "female" ? "أنثى" : "ذكر"}
                    </p>
                    <p className="text-[11px] text-white/80">
                      تاريخ الميلاد: {verifiedMember.birthDate} ({verifiedMember.calendarType === "hijri" ? "هجري" : "ميلادي"})
                    </p>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/20 text-white mt-2">
                      <CheckCircle className="w-2.5 h-2.5 text-yellow-400" />
                      <span>{verifiedMember.status === "active" ? "عضوية نشطة" : "بانتظار التفعيل"}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end pt-2">
                    <div>
                      <p className="text-[9px] text-white/60">رقم العضوية الفريد</p>
                      <p className="text-xl font-extrabold tracking-wider text-yellow-400 font-mono">{verifiedMember.id}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-[9px] text-white/60">صالحة لغاية</p>
                      <p className="text-xs font-bold">{verifiedMember.expiryDate || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Logged in member view */}
      {loggedInMember ? (
        <div className="space-y-8" id="logged-in-profile">
          <div className="text-center md:text-right flex flex-col md:flex-row justify-between items-center gap-4 pb-6 border-b border-[var(--border-color)]">
            <div>
              <h1 className="text-3xl font-bold flex items-center justify-center md:justify-start gap-2 text-[var(--primary-color)]">
                <CheckCircle className="w-8 h-8" />
                مرحباً بك، {loggedInMember.tripleName}
              </h1>
              <p className="text-sm opacity-80 mt-1">بطاقتك الرقمية الرسمية وملفك التعريفي بمركز المسقي الاجتماعي</p>
            </div>
            
            <button
              onClick={onLogout}
              className="px-5 py-2.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl font-bold text-sm transition-colors"
            >
              تسجيل الخروج
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left/Main Column - Visual Digital Membership Card */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Card Container styled beautifully in RTL */}
              <div
                id="digital-membership-card"
                className="relative overflow-hidden rounded-2xl text-white shadow-xl bg-gradient-to-br from-[var(--primary-color)] via-emerald-800 to-slate-900 border border-emerald-600/20 max-w-lg mx-auto"
                style={{ aspectRatio: "1.58 / 1" }}
              >
                {/* Visual Background Accents */}
                <div className="absolute top-0 right-0 w-44 h-44 rounded-full bg-white/5 -mr-16 -mt-16 border border-white/10" />
                <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/5 -ml-24 -mb-24 border border-white/10" />
                
                {/* Gold stripe */}
                <div className="absolute bottom-0 right-0 left-0 h-2.5 bg-yellow-400" />

                {/* Card Padding wrapper */}
                <div className="p-5 h-full flex flex-col justify-between relative z-10">
                  
                  {/* Header */}
                  <div className="flex justify-between items-start pb-3 border-b border-white/10">
                    <div>
                      <h4 className="font-bold text-base md:text-lg leading-tight text-white">{settings.centerName}</h4>
                      <p className="text-[10px] text-white/70">بطاقة العضوية الرقمية المعتمدة</p>
                    </div>
                    {/* Tiny visual logo placeholder */}
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
                      <img src={settings.logoMini} alt="Mini logo" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  {/* Body Info with Photo and QR code */}
                  <div className="grid grid-cols-12 gap-3 py-3 flex-grow items-center">
                    
                    {/* Details (Right RTL Side) */}
                    <div className="col-span-8">
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm md:text-base text-white leading-tight">{loggedInMember.tripleName}</h3>
                        <p className="text-[11px] text-white/80 font-medium">الجنس: {loggedInMember.gender === "female" ? "أنثى" : "ذكر"}</p>
                        <p className="text-[11px] text-white/80">تاريخ الميلاد: {loggedInMember.birthDate} ({loggedInMember.calendarType === "hijri" ? "هجري" : "ميلادي"})</p>
                        
                        {/* Status tag */}
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/20 text-white mt-1">
                          <CheckCircle className="w-2.5 h-2.5 text-yellow-400" />
                          <span>{loggedInMember.status === "active" ? "عضوية نشطة" : "بانتظار التفعيل"}</span>
                        </div>
                      </div>
                    </div>

                    {/* QR Code (Left Side) */}
                    <div className="col-span-4 flex flex-col items-center justify-center border-r border-white/10 pr-2">
                      <div className="bg-white p-1.5 rounded-lg shadow-sm">
                        <MembershipQrCode memberId={loggedInMember.id} size={112} className="block" />
                      </div>
                      <span className="text-[9px] text-white/60 mt-1 text-center leading-tight">مسح للتحقق</span>
                    </div>

                  </div>

                  {/* Footer Card code */}
                  <div className="flex justify-between items-center pt-2">
                    <div>
                      <p className="text-[9px] text-white/60 uppercase">رقم العضوية الفريد</p>
                      <p className="text-xl font-extrabold tracking-wider text-yellow-400">{loggedInMember.id}</p>
                    </div>

                    <div className="text-left">
                      <p className="text-[9px] text-white/60">صالحة لغاية</p>
                      <p className="text-xs font-bold">{loggedInMember.expiryDate || "1449هـ"}</p>
                    </div>
                  </div>

                </div>
              </div>

              {loggedInMember && (
                <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center no-print">
                  رمز QR يفتح صفحة التحقق على الموقع الرسمي:{" "}
                  <span className="font-mono font-bold" dir="ltr">{buildMembershipVerifyUrl(loggedInMember.id)}</span>
                </p>
              )}

              {/* Dynamic Operations Action Drawer */}
              <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm flex flex-wrap gap-4 justify-center no-print">
                <button
                  onClick={downloadCardAsImage}
                  className="px-5 py-2.5 bg-[var(--primary-color)] text-[var(--button-text)] rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 text-sm"
                >
                  <Download className="w-4 h-4" /> تحميل كصورة (JPG)
                </button>
                <button
                  onClick={printCardPDF}
                  className="px-5 py-2.5 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-xl font-semibold flex items-center gap-2 text-sm"
                >
                  <Printer className="w-4 h-4" /> طباعة البطاقة (PDF)
                </button>
                <button
                  onClick={shareWhatsApp}
                  className="px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-semibold flex items-center gap-2 text-sm"
                >
                  <Share2 className="w-4 h-4" /> مشاركة عبر واتساب
                </button>
              </div>

            </div>

            {/* Right Column - User details self service updates */}
            <div className="lg:col-span-5 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8 shadow-sm no-print">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--primary-color)]" />
                تعديل البيانات الشخصية
              </h3>
              <p className="text-xs opacity-70 mb-4">تحديث ملفك وبياناتك المسجلة بمركز المسقي</p>
              
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  setError(null);
                  try {
                    const res = await updateMemberProfile({
                      memberId: loggedInMember.id,
                      tripleName: loggedInMember.tripleName,
                      phone: loggedInMember.phone,
                      email: loggedInMember.email,
                      birthDate: loggedInMember.birthDate,
                      calendarType: loggedInMember.calendarType,
                      gender: loggedInMember.gender
                    });
                    if (res.success) {
                      onLoginSuccess(res.member);
                      alert("تم حفظ التعديلات بنجاح!");
                    }
                  } catch (err: any) {
                    setError(err.message || "فشل التحديث.");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold mb-1 opacity-85">الاسم الثلاثي المعتمد</label>
                  <input
                    type="text"
                    required
                    value={loggedInMember.tripleName}
                    onChange={(e) => onLoginSuccess({ ...loggedInMember, tripleName: e.target.value })}
                    className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 opacity-85">رقم الجوال *</label>
                    <input
                      type="text"
                      required
                      value={loggedInMember.phone}
                      onChange={(e) => onLoginSuccess({ ...loggedInMember, phone: e.target.value })}
                      className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 opacity-85">البريد الإلكتروني (اختياري)</label>
                    <input
                      type="email"
                      value={loggedInMember.email || ""}
                      onChange={(e) => onLoginSuccess({ ...loggedInMember, email: e.target.value })}
                      className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 opacity-85">الجنس *</label>
                    <select
                      value={loggedInMember.gender}
                      onChange={(e) => onLoginSuccess({ ...loggedInMember, gender: e.target.value as "male" | "female" })}
                      className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)]"
                    >
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 opacity-85">نظام التقويم لـ تاريخ الميلاد *</label>
                    <select
                      value={loggedInMember.calendarType}
                      onChange={(e) => {
                        const val = e.target.value as "hijri" | "gregorian";
                        const defYear = val === "hijri" ? "1415" : "1995";
                        onLoginSuccess({
                          ...loggedInMember,
                          calendarType: val,
                          birthDate: `${defYear}-08-15`
                        });
                      }}
                      className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)] font-bold text-emerald-800"
                    >
                      <option value="gregorian">📅 التقويم الميلادي (Gregorian)</option>
                      <option value="hijri">🌙 التقويم الهجري (Hijri)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 opacity-85">تاريخ الميلاد *</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] opacity-75 mb-0.5">اليوم</label>
                      <select
                        value={loggedInMember.birthDate.split("-")[2] || "15"}
                        onChange={(e) => {
                          const [y, m, d] = (loggedInMember.birthDate || "1995-08-15").split("-");
                          onLoginSuccess({ ...loggedInMember, birthDate: `${y}-${m}-${e.target.value}` });
                        }}
                        className="w-full p-2.5 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)] text-center font-mono"
                      >
                        {(loggedInMember.calendarType === "hijri" ? daysList : gregorianDaysList).map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] opacity-75 mb-0.5">الشهر</label>
                      <select
                        value={loggedInMember.birthDate.split("-")[1] || "08"}
                        onChange={(e) => {
                          const [y, m, d] = (loggedInMember.birthDate || "1995-08-15").split("-");
                          onLoginSuccess({ ...loggedInMember, birthDate: `${y}-${e.target.value}-${d}` });
                        }}
                        className="w-full p-2.5 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)] text-center"
                      >
                        {(loggedInMember.calendarType === "hijri" ? hijriMonths : gregorianMonths).map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] opacity-75 mb-0.5">السنة</label>
                      <select
                        value={loggedInMember.birthDate.split("-")[0] || (loggedInMember.calendarType === "hijri" ? "1415" : "1995")}
                        onChange={(e) => {
                          const [y, m, d] = (loggedInMember.birthDate || "1995-08-15").split("-");
                          onLoginSuccess({ ...loggedInMember, birthDate: `${e.target.value}-${m}-${d}` });
                        }}
                        className="w-full p-2.5 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)] text-center font-mono"
                      >
                        {(loggedInMember.calendarType === "hijri" ? hijriYears : gregorianYears).map((y) => (
                          <option key={y.value} value={y.value}>{y.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {loading ? "جاري حفظ التعديلات..." : "حفظ التحديثات"}
                </button>
              </form>
            </div>

          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto" id="members-auth-router">
          {/* Section Selector Tab list */}
          <div className="flex border-b border-[var(--border-color)] mb-8 justify-center">
            <button
              onClick={() => { setActiveTab("register"); setError(null); }}
              className={`pb-3 px-6 font-bold text-base flex items-center gap-1.5 border-b-2 transition-all ${
                activeTab === "register" ? "border-[var(--primary-color)] text-[var(--primary-color)]" : "border-transparent opacity-60"
              }`}
            >
              <UserPlus className="w-5 h-5" />
              إصدار عضوية رقمية
            </button>
            <button
              onClick={() => { setActiveTab("login"); setError(null); }}
              className={`pb-3 px-6 font-bold text-base flex items-center gap-1.5 border-b-2 transition-all ${
                activeTab === "login" ? "border-[var(--primary-color)] text-[var(--primary-color)]" : "border-transparent opacity-60"
              }`}
            >
              <LogIn className="w-5 h-5" />
              عرض بطاقة العضوية
            </button>
            <button
              onClick={() => { setActiveTab("recover"); setError(null); resetRecoveryFlow(); }}
              className={`pb-3 px-6 font-bold text-base flex items-center gap-1.5 border-b-2 transition-all ${
                activeTab === "recover" ? "border-[var(--primary-color)] text-[var(--primary-color)]" : "border-transparent opacity-60"
              }`}
            >
              <Search className="w-5 h-5" />
              استعادة رقم العضوية
            </button>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 text-red-800 rounded-xl text-sm font-semibold mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl text-sm font-semibold mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* REGISTER FLOW */}
          {activeTab === "register" && (
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="mb-6 text-center">
                <CreditCard className="w-12 h-12 text-[var(--primary-color)] mx-auto mb-2" />
                <h2 className="text-xl font-bold">تسجيل طلب عضوية جديدة</h2>
                <p className="text-xs opacity-70 mt-1">أدخل بياناتك بالكامل واختر كلمة سر خاصة ببطاقتك — ستحتاجها لعرضها لاحقاً</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 opacity-85">الاسم الثلاثي بالكامل *</label>
                  <input
                    type="text"
                    required
                    value={regData.tripleName}
                    onChange={(e) => setRegData({ ...regData, tripleName: e.target.value })}
                    className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)]"
                    placeholder="محمد بن عبد الله الأسمري"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 opacity-85">رقم الجوال *</label>
                    <input
                      type="text"
                      required
                      value={regData.phone}
                      onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                      className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)]"
                      placeholder="05xxxxxxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 opacity-85">البريد الإلكتروني (اختياري)</label>
                    <input
                      type="email"
                      value={regData.email}
                      onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                      className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)]"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 opacity-85">تحديد الجنس *</label>
                    <select
                      value={regData.gender}
                      onChange={(e) => setRegData({ ...regData, gender: e.target.value as any })}
                      className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)]"
                    >
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 opacity-85">نظام التقويم لـ تاريخ الميلاد *</label>
                    <select
                      value={regData.calendarType}
                      onChange={(e) => {
                        const val = e.target.value as "hijri" | "gregorian";
                        const defYear = val === "hijri" ? "1415" : "1995";
                        const defMonth = "08";
                        const defDay = "15";
                        setRegData({
                          ...regData,
                          calendarType: val,
                          birthDate: `${defYear}-${defMonth}-${defDay}`
                        });
                      }}
                      className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)] font-bold text-emerald-800"
                    >
                      <option value="gregorian">📅 التقويم الميلادي (Gregorian)</option>
                      <option value="hijri">🌙 التقويم الهجري (Hijri)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 opacity-85">تاريخ الميلاد *</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] opacity-75 mb-0.5">اليوم</label>
                      <select
                        value={regData.birthDate.split("-")[2] || "15"}
                        onChange={(e) => {
                          const [y, m, d] = (regData.birthDate || "1995-08-15").split("-");
                          setRegData({ ...regData, birthDate: `${y}-${m}-${e.target.value}` });
                        }}
                        className="w-full p-2.5 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)] text-center font-mono"
                      >
                        {(regData.calendarType === "hijri" ? daysList : gregorianDaysList).map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] opacity-75 mb-0.5">الشهر</label>
                      <select
                        value={regData.birthDate.split("-")[1] || "08"}
                        onChange={(e) => {
                          const [y, m, d] = (regData.birthDate || "1995-08-15").split("-");
                          setRegData({ ...regData, birthDate: `${y}-${e.target.value}-${d}` });
                        }}
                        className="w-full p-2.5 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)] text-center"
                      >
                        {(regData.calendarType === "hijri" ? hijriMonths : gregorianMonths).map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] opacity-75 mb-0.5">السنة</label>
                      <select
                        value={regData.birthDate.split("-")[0] || (regData.calendarType === "hijri" ? "1415" : "1995")}
                        onChange={(e) => {
                          const [y, m, d] = (regData.birthDate || "1995-08-15").split("-");
                          setRegData({ ...regData, birthDate: `${e.target.value}-${m}-${d}` });
                        }}
                        className="w-full p-2.5 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)] text-center font-mono"
                      >
                        {(regData.calendarType === "hijri" ? hijriYears : gregorianYears).map((y) => (
                          <option key={y.value} value={y.value}>{y.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 opacity-85">كلمة سر العضوية *</label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      value={regData.password}
                      onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                      className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)]"
                      placeholder="4 أحرف على الأقل"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 opacity-85">تأكيد كلمة السر *</label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      value={regData.confirmPassword}
                      onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                      className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)]"
                      placeholder="أعد إدخال كلمة السر"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <UserPlus className="w-5 h-5" />
                  {loading ? "جاري تسجيل البيانات وإصدار البطاقة..." : "إصدار العضوية الفورية"}
                </button>
              </form>
            </div>
          )}

          {/* LOGIN FLOW */}
          {activeTab === "login" && (
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="mb-6 text-center">
                <LogIn className="w-12 h-12 text-[var(--primary-color)] mx-auto mb-2" />
                <h2 className="text-xl font-bold">تسجيل الدخول وعرض البطاقة</h2>
                <p className="text-xs opacity-70 mt-1">أدخل رقم العضوية ورقم الجوال وكلمة سر البطاقة لعرضها</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 opacity-85">رقم العضوية الفريد (مثال: AA1234) *</label>
                  <input
                    type="text"
                    required
                    value={loginData.memberId}
                    onChange={(e) => setLoginData({ ...loginData, memberId: e.target.value })}
                    className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)] text-center font-bold text-slate-800 placeholder-slate-300"
                    placeholder="MS4512"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 opacity-85">رقم الجوال المسجل *</label>
                  <input
                    type="text"
                    required
                    value={loginData.phone}
                    onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })}
                    className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)] text-left font-semibold"
                    placeholder="0555555555"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 opacity-85">كلمة سر العضوية *</label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)]"
                    placeholder="كلمة السر التي أنشأتها مع العضوية"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <LogIn className="w-5 h-5" />
                  {loading ? "جاري المصادقة..." : "تسجيل الدخول وعرض البطاقة"}
                </button>
              </form>
            </div>
          )}

          {/* ACCOUNT RECOVERY FLOW */}
          {activeTab === "recover" && (
            <div className="space-y-6">
              <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="mb-6 text-center">
                  <Search className="w-12 h-12 text-[var(--primary-color)] mx-auto mb-2" />
                  <h2 className="text-xl font-bold">استعادة بطاقة العضوية</h2>
                  <p className="text-xs opacity-70 mt-1">
                    {recoveryStep === "phone"
                      ? "أدخل رقم جوالك المسجل للبحث عن عضويتك"
                      : "أدخل كلمة سر العضوية لعرض بطاقتك"}
                  </p>
                </div>

                {recoveryStep === "phone" ? (
                  <form onSubmit={handleRecoveryPhoneSearch} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1 opacity-85">رقم الجوال المعتمد *</label>
                      <input
                        type="text"
                        required
                        value={recoveryPhone}
                        onChange={(e) => setRecoveryPhone(e.target.value)}
                        className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)] text-left font-semibold"
                        placeholder="05xxxxxxxx"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      <Search className="w-5 h-5" />
                      {loading ? "جاري البحث..." : "البحث عن العضوية"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRecoveryPasswordSubmit} className="space-y-4">
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-900">
                      تم العثور على {recoveryCandidates.length} عضوية مسجلة برقم <strong dir="ltr">{recoveryPhone}</strong>
                    </div>

                    {recoveryCandidates.length > 1 && (
                      <div>
                        <label className="block text-xs font-semibold mb-1 opacity-85">اختر العضوية *</label>
                        <select
                          required
                          value={selectedRecoveryMemberId}
                          onChange={(e) => setSelectedRecoveryMemberId(e.target.value)}
                          className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)]"
                        >
                          <option value="">— اختر العضوية —</option>
                          {recoveryCandidates.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.tripleName} ({m.id})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {recoveryCandidates.length === 1 && (
                      <div className="p-3 bg-slate-50 border rounded-xl text-sm">
                        <p className="font-bold text-slate-800">{recoveryCandidates[0].tripleName}</p>
                        <p className="text-xs text-slate-500 mt-1">رقم العضوية: <span className="font-mono font-bold text-[var(--primary-color)]">{recoveryCandidates[0].id}</span></p>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold mb-1 opacity-85">كلمة سر العضوية *</label>
                      <input
                        type="password"
                        required
                        minLength={4}
                        value={recoveryPassword}
                        onChange={(e) => setRecoveryPassword(e.target.value)}
                        className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)]"
                        placeholder="أدخل كلمة السر لعرض البطاقة"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={resetRecoveryFlow}
                        className="w-full py-3 border border-[var(--border-color)] rounded-xl font-bold hover:bg-slate-50 transition-colors"
                      >
                        رجوع
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        <Lock className="w-5 h-5" />
                        {loading ? "جاري التحقق..." : "عرض البطاقة"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
