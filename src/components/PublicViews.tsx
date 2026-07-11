/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { FAQItem, ReferencePage, GalleryAlbum, EventItem, MainProgram, SystemSettings, MemberProfile } from "../types";
import { HelpCircle, FileText, Phone, Mail, MapPin, Share2, Calendar, Image as ImageIcon, ChevronDown, ChevronRight, Send, ListFilter, Download, ChevronLeft, RefreshCw, X, Ticket, Check, AlertCircle, Info } from "lucide-react";
import { submitContact, registerToSubProgram, registerToEvent } from "../lib/api";

// 1. FAQ SECTION COMPONENT
export function FAQSection({ faqs }: { faqs: FAQItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-4 max-w-3xl mx-auto py-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <HelpCircle className="w-6 h-6 text-[var(--primary-color)]" />
          الأسئلة الشائعة
        </h2>
        <p className="text-sm opacity-80">كل ما تود معرفته عن مركز النشاط الاجتماعي بالمسقي وخدماته</p>
      </div>

      {faqs.length === 0 ? (
        <p className="text-center opacity-60">لا توجد أسئلة شائعة حالياً.</p>
      ) : (
        faqs.map((faq) => (
          <div
            key={faq.id}
            id={`faq-${faq.id}`}
            className="border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] overflow-hidden transition-all duration-200"
          >
            <button
              onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
              className="w-full text-right p-4 flex justify-between items-center font-semibold text-lg hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <span>{faq.question}</span>
              <ChevronDown className={`w-5 h-5 text-[var(--primary-color)] transition-transform duration-200 ${openId === faq.id ? "rotate-180" : ""}`} />
            </button>
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                openId === faq.id ? "max-h-96 p-4 border-t border-[var(--border-color)] bg-slate-50/50" : "max-h-0"
              }`}
            >
              <p className="leading-relaxed opacity-90 whitespace-pre-line">{faq.answer}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// 2. REFERENCE SECTION COMPONENT
export function ReferenceSection({ reference }: { reference: ReferencePage }) {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4" id="reference-view">
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border-color)]">
          <FileText className="w-8 h-8 text-[var(--primary-color)]" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">المرجعية النظامية والتنظيمية</h1>
            <p className="text-sm opacity-70 mt-1">الوثائق واللوائح الرسمية لمركز النشاط الاجتماعي بالمسقي</p>
          </div>
        </div>

        {/* Content Render (Simulated Rich Text Editor Content) */}
        <div className="prose prose-slate max-w-none mb-8 leading-relaxed text-right">
          {reference.content.split("\n").map((paragraph, index) => {
            if (paragraph.startsWith("## ")) {
              return <h2 key={index} className="text-xl font-bold mt-6 mb-3 text-[var(--primary-color)]">{paragraph.replace("## ", "")}</h2>;
            }
            if (paragraph.startsWith("### ")) {
              return <h3 key={index} className="text-lg font-semibold mt-4 mb-2">{paragraph.replace("### ", "")}</h3>;
            }
            if (paragraph.startsWith("- ") || paragraph.startsWith("1. ")) {
              return <li key={index} className="mr-4 list-disc opacity-90 my-1">{paragraph.substring(2)}</li>;
            }
            if (paragraph.trim() === "---") {
              return <hr key={index} className="my-6 border-[var(--border-color)]" />;
            }
            return <p key={index} className="my-3 opacity-90">{paragraph}</p>;
          })}
        </div>

        {/* External Links */}
        {reference.links && reference.links.length > 0 && (
          <div className="border-t border-[var(--border-color)] pt-4">
            <h4 className="font-semibold text-sm mb-2 opacity-80">روابط مرجعية هامة:</h4>
            <div className="flex flex-wrap gap-3">
              {reference.links.map((link, i) => (
                <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                  {link}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 3. CONTACT SECTION COMPONENT
export function ContactSection({ settings }: { settings: SystemSettings }) {
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const response = await submitContact(formData);
      if (response.success) {
        setStatus("success");
        setFormData({ name: "", phone: "", email: "", subject: "", message: "" });
      }
    } catch (err: any) {
      setStatus(err.message || "فشل إرسال الرسالة.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4" id="contact-view">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--primary-color)]">اتصل بنا</h1>
        <p className="text-sm opacity-80 mt-2">يسعدنا تواصلكم وتقديم آرائكم ومقترحاتكم البناءة لخدمة قرية المسقي</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Contact Form */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8 shadow-sm">
          <h3 className="text-xl font-bold mb-4">نموذج التواصل السريع</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">الاسم الثلاثي *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)]"
                  placeholder="أدخل اسمك الكريم"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">رقم الجوال *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)] text-left"
                  placeholder="05xxxxxxxx"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">البريد الإلكتروني (اختياري)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)]"
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">الموضوع (اختياري)</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)]"
                  placeholder="موضوع الاستفسار"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 opacity-80">الرسالة *</label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)]"
                placeholder="اكتب رسالتك أو استفسارك هنا..."
              />
            </div>

            {status === "success" && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-sm font-semibold">
                تم إرسال رسالتكم بنجاح! سيتواصل معكم فريق المركز قريباً.
              </div>
            )}
            {status && status !== "success" && (
              <div className="p-3 bg-red-50 text-red-800 rounded-lg text-sm font-semibold">
                {status}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Send className="w-5 h-5" />
              {loading ? "جاري الإرسال..." : "إرسال الرسالة"}
            </button>
          </form>
        </div>

        {/* Contact Info & Live Map */}
        <div className="space-y-6">
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
            <h3 className="text-xl font-bold mb-4 pb-2 border-b border-[var(--border-color)]">معلومات الاتصال الرسمية</h3>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[var(--primary-color)] mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">العنوان الجغرافي</p>
                <p className="text-xs opacity-80 mt-1">{settings.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-[var(--primary-color)] mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">الهاتف المباشر</p>
                <p className="text-xs opacity-80 mt-1" style={{ direction: "ltr" }}>{settings.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Share2 className="w-5 h-5 text-[var(--primary-color)] mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">رقم الواتساب الرسمي</p>
                <p className="text-xs opacity-80 mt-1" style={{ direction: "ltr" }}>{settings.whatsapp}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-[var(--primary-color)] mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">البريد الإلكتروني للمراسلات</p>
                <p className="text-xs opacity-80 mt-1">{settings.email}</p>
              </div>
            </div>
          </div>

          {/* Embedded Google Map */}
          <div className="rounded-2xl overflow-hidden border border-[var(--border-color)] h-72 shadow-sm bg-white">
            <iframe
              src={settings.mapLocation}
              className="w-full h-full border-0"
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="موقع المركز الجغرافي"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. GALLERY ALBUMS COMPONENT
export function GallerySection({ albums }: { albums: GalleryAlbum[] }) {
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null);
  const [lightboxImg, setLightboxImg] = useState<{ url: string; desc: string } | null>(null);

  if (selectedAlbum) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4" id="gallery-album-view">
        <button
          onClick={() => setSelectedAlbum(null)}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-[var(--primary-color)] hover:underline"
        >
          <ChevronRight className="w-4 h-4" /> العودة إلى قائمة الألبومات
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">{selectedAlbum.title}</h1>
          <p className="text-sm opacity-80 mt-1">{selectedAlbum.description}</p>
        </div>

        {selectedAlbum.photos.length === 0 ? (
          <p className="text-center py-12 opacity-60">لا توجد صور في هذا الألبوم بعد.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {selectedAlbum.photos.sort((a,b)=>a.order - b.order).map((photo) => (
              <div
                key={photo.id}
                onClick={() => setLightboxImg({ url: photo.url, desc: photo.description })}
                className="group cursor-pointer rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-48 overflow-hidden relative bg-slate-100">
                  <img src={photo.url} alt={photo.description} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium opacity-90 line-clamp-2">{photo.description || "معرض مركز النشاط الاجتماعي بالمسقي"}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lightbox zoomed preview */}
        {lightboxImg && (
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col justify-center items-center p-4"
            onClick={() => setLightboxImg(null)}
          >
            <div className="max-w-4xl max-h-[80vh] relative">
              <img src={lightboxImg.url} alt={lightboxImg.desc} className="rounded-lg object-contain max-h-[75vh]" referrerPolicy="no-referrer" />
            </div>
            <div className="text-center text-white max-w-xl mt-4">
              <p className="text-sm font-medium">{lightboxImg.desc}</p>
              <button className="mt-4 text-xs bg-white/20 px-4 py-2 rounded-full hover:bg-white/30 transition-colors">إغلاق المعاينة</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4" id="gallery-view">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--primary-color)] flex items-center justify-center gap-2">
          <ImageIcon className="w-8 h-8" /> معرض الصور والفعاليات
        </h1>
        <p className="text-sm opacity-80 mt-2">توثيق شامل بالصور لأبرز أنشطة ومبادرات ملتقى المسقي ومراكزه المتنوعة</p>
      </div>

      {albums.length === 0 ? (
        <p className="text-center py-12 opacity-60">لا توجد ألبومات صور منشورة حالياً.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {albums.sort((a,b)=>a.order - b.order).map((album) => (
            <div
              key={album.id}
              onClick={() => setSelectedAlbum(album)}
              className="cursor-pointer group bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-48 overflow-hidden relative bg-slate-100">
                <img src={album.coverImage} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white">
                  {album.photos.length} صور
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg group-hover:text-[var(--primary-color)] transition-colors">{album.title}</h3>
                <p className="text-xs opacity-70 mt-1 line-clamp-2">{album.description}</p>
                <span className="text-xs text-[var(--primary-color)] font-semibold mt-3 inline-flex items-center gap-1">
                  عرض محتويات الألبوم <ChevronLeft className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 5. INTERACTIVE ANNUAL CALENDAR COMPONENT
export function CalendarSection({
  events,
  programs,
  loggedInMember,
  onProgramUpdated,
  onEventRegisteredSuccess,
  setCurrentTab
}: {
  events: EventItem[];
  programs: MainProgram[];
  loggedInMember?: MemberProfile | null;
  onProgramUpdated?: (updatedProgram: MainProgram) => void;
  onEventRegisteredSuccess?: (updatedEvent: EventItem) => void;
  setCurrentTab?: (tab: "home" | "about" | "reference" | "programs" | "memberships" | "events" | "calendar" | "gallery" | "faqs" | "contact" | "admin") => void;
}) {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // July (0-indexed base would be index 6)
  const [viewMode, setViewMode] = useState<"month" | "week" | "year">("month");
  const [selectedType, setSelectedType] = useState<"all" | "event" | "program">("all");

  // Selected active item state for the details overlay
  const [activeItem, setActiveItem] = useState<{
    id: string;
    title: string;
    type: "event" | "program";
    date: string;
    time: string;
    description: string;
    location?: string;
    seatsEnabled?: boolean;
    seatsTotal?: number;
    seatsRemaining?: number;
    registrations?: any[];
    programId?: string;
    original: any;
  } | null>(null);

  const [bookingName, setBookingName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingMemberId, setBookingMemberId] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  const monthNames = [
    "يناير - كانون الثاني", "فبراير - شباط", "مارس - آذار", "أبريل - نيسان", 
    "مايو - أيار", "يونيو - حزيران", "يوليو - تموز", "أغسطس - آب", 
    "سبتمبر - أيلول", "أكتوبر - تشرين الأول", "نوفمبر - تشرين الثاني", "ديسمبر - كانون الأول"
  ];

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  // Filter items based on selectedType
  const filteredEvents = events.filter(e => selectedType === "all" || selectedType === "event");
  const filteredSubprograms = programs.flatMap(p => p.subPrograms.map(s => ({ ...s, parentName: p.name, parentId: p.id }))).filter(() => selectedType === "all" || selectedType === "program");

  // Format events to days mapping
  const itemsForDay = (day: number) => {
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    
    // find matching events
    const matchingEvents = filteredEvents.filter(e => e.date === dateString).map(e => ({
      id: e.id,
      title: e.title,
      type: "event" as const,
      time: e.startTime,
      color: "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200",
      description: e.shortDesc || e.fullDesc || "فعالية مجتمعية متميزة بقرية المسقي",
      original: e
    }));

    // Real subprogram matching based on the direct date field
    const matchingProgs = selectedType !== "event" ? filteredSubprograms.filter(s => s.date === dateString).map(s => ({
      id: s.id,
      title: `${s.parentName}: ${s.title}`,
      type: "program" as const,
      time: s.timeFrom ? (s.timeTo ? `${s.timeFrom} - ${s.timeTo}` : s.timeFrom) : "17:00",
      color: "bg-sky-100 text-sky-800 border-sky-300 hover:bg-sky-200",
      description: s.description || "مبادرة فرعية متميزة ضمن برامجنا التنموية",
      seatsEnabled: s.seatsEnabled,
      seatsTotal: s.seatsTotal,
      seatsRemaining: s.seatsRemaining,
      registrations: s.registrations,
      programId: s.parentId,
      original: s
    })) : [];

    return [...matchingEvents, ...matchingProgs];
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleItemClick = (item: any) => {
    setActiveItem({
      id: item.id,
      title: item.title,
      type: item.type,
      date: item.original.date,
      time: item.time,
      description: item.description,
      location: item.original.location,
      seatsEnabled: item.seatsEnabled,
      seatsTotal: item.seatsTotal,
      seatsRemaining: item.seatsRemaining,
      registrations: item.registrations,
      programId: item.programId,
      original: item.original
    });

    if (loggedInMember) {
      setBookingName(loggedInMember.tripleName);
      setBookingPhone(loggedInMember.phone);
      setBookingMemberId(loggedInMember.id);
    } else {
      setBookingName("");
      setBookingPhone("");
      setBookingMemberId("");
    }
    setBookingError(null);
    setBookingSuccess(null);
  };

  const isUserBooked = (item: any) => {
    const checkId = loggedInMember?.id || bookingMemberId;
    if (!checkId) return false;
    if (!item.registrations) return false;
    return item.registrations.some((r: any) => r.memberId.trim().toUpperCase() === checkId.trim().toUpperCase());
  };

  const isEventBooked = (event: any) => {
    const checkId = loggedInMember?.id || bookingMemberId;
    if (!checkId) return false;
    if (!event.registrations) return false;
    return event.registrations.some((r: any) => r.memberId.trim().toUpperCase() === checkId.trim().toUpperCase());
  };

  const handleConfirmBooking = async () => {
    if (!activeItem) return;
    if (!bookingName.trim() || !bookingPhone.trim() || !bookingMemberId.trim()) {
      setBookingError("جميع الحقول مطلوبة لإكمال عملية الحجز (الاسم ورقم الجوال ورقم العضوية).");
      return;
    }

    setBookingLoading(true);
    setBookingError(null);
    setBookingSuccess(null);

    try {
      const res = await registerToSubProgram({
        programId: activeItem.programId || "",
        subProgramId: activeItem.id,
        memberId: bookingMemberId.trim(),
        name: bookingName.trim(),
        phone: bookingPhone.trim()
      });

      if (res.success) {
        setBookingSuccess("تم حجز المقعد بنجاح وتحديث التقويم الموحد!");
        if (onProgramUpdated) {
          onProgramUpdated(res.program);
        }

        // Update local modal view
        const updatedSub = res.program.subPrograms.find(s => s.id === activeItem.id);
        if (updatedSub) {
          setActiveItem(prev => prev ? {
            ...prev,
            seatsRemaining: updatedSub.seatsRemaining,
            registrations: updatedSub.registrations,
            original: updatedSub
          } : null);
        }

        setTimeout(() => {
          setBookingSuccess(null);
        }, 3000);
      }
    } catch (err: any) {
      setBookingError(err.message || "حدث خطأ أثناء محاولة الحجز.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleConfirmEventBooking = async () => {
    if (!activeItem) return;
    if (!bookingName.trim() || !bookingPhone.trim() || !bookingMemberId.trim()) {
      setBookingError("جميع الحقول مطلوبة لإكمال عملية الحجز (الاسم ورقم الجوال ورقم العضوية).");
      return;
    }

    setBookingLoading(true);
    setBookingError(null);
    setBookingSuccess(null);

    try {
      const res = await registerToEvent({
        eventId: activeItem.id,
        memberId: bookingMemberId.trim(),
        name: bookingName.trim(),
        phone: bookingPhone.trim()
      });

      if (res.success) {
        setBookingSuccess("تم تقديم طلب الحضور بنجاح! بانتظار موافقة مشرف الفعالية.");
        if (onEventRegisteredSuccess) {
          onEventRegisteredSuccess(res.event);
        }

        // Update local modal view
        setActiveItem(prev => prev ? {
          ...prev,
          original: res.event
        } : null);

        setTimeout(() => {
          setBookingSuccess(null);
        }, 3000);
      }
    } catch (err: any) {
      setBookingError(err.message || "حدث خطأ أثناء محاولة التسجيل.");
    } finally {
      setBookingLoading(false);
    }
  };

  const totalDays = daysInMonth(currentYear, currentMonth);
  const startOffset = firstDayOfMonth(currentYear, currentMonth); // JS Date getDay is Sunday=0, Monday=1, ... Saturday=6

  const calendarDays = [];
  // For RTL layout, we present from Sunday to Saturday
  const arabicWeekDays = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  // Empty cells before first day
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push(null);
  }
  // Days of the month
  for (let d = 1; d <= totalDays; d++) {
    calendarDays.push(d);
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4" id="calendar-view">
      {/* Calendar Header Settings */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-6 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-[var(--primary-color)]" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">التقويم السنوي الموحد</h1>
              <p className="text-xs opacity-70 mt-1">تتبع كافة فعاليات، أنشطة، وبرامج مركز المسقي في شاشة واحدة</p>
            </div>
          </div>

          {/* Type Filters */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1">
            <button
              onClick={() => setSelectedType("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${selectedType === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              الكل
            </button>
            <button
              onClick={() => setSelectedType("event")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${selectedType === "event" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              الفعاليات فقط
            </button>
            <button
              onClick={() => setSelectedType("program")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${selectedType === "program" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              البرامج والدورات
            </button>
          </div>
        </div>

        {/* Calendar Nav controls */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} className="p-2 border border-[var(--border-color)] rounded-lg hover:bg-slate-50 cursor-pointer">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="text-xl font-bold min-w-44 text-center text-slate-900">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <button onClick={handleNextMonth} className="p-2 border border-[var(--border-color)] rounded-lg hover:bg-slate-50 cursor-pointer">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${viewMode === "month" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
            >
              شهري
            </button>
            <button
              onClick={() => setViewMode("year")}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${viewMode === "year" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
            >
              سنوي
            </button>
          </div>
        </div>

        {/* View Layout Switcher */}
        {viewMode === "month" && (
          <div className="mt-6">
            {/* Weekdays labels */}
            <div className="grid grid-cols-7 text-center font-bold text-sm bg-slate-50 py-3 rounded-lg border-b border-[var(--border-color)] mb-2 text-slate-800">
              {arabicWeekDays.map((day, i) => (
                <div key={i} className="opacity-80">{day}</div>
              ))}
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={idx} className="bg-slate-50/20 min-h-24 rounded-lg border border-dashed border-slate-100" />;
                }

                const dayItems = itemsForDay(day);

                return (
                  <div
                    key={idx}
                    className="bg-white min-h-24 md:min-h-28 border border-[var(--border-color)] rounded-lg p-2 hover:shadow-sm transition-shadow flex flex-col justify-between"
                  >
                    <span className="font-bold text-sm text-slate-700">{day}</span>
                    
                    <div className="mt-1 space-y-1 flex-grow overflow-y-auto max-h-20">
                      {dayItems.map((item, i) => (
                        <div
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemClick(item);
                          }}
                          className={`p-1 text-[10px] md:text-xs font-medium rounded border leading-tight ${item.color} truncate cursor-pointer transition-colors`}
                          title={item.title}
                        >
                          {item.time} {item.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === "year" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
            {monthNames.map((name, mIdx) => {
              // check if any events in this month
              const monthEvents = events.filter(e => {
                const parts = e.date.split("-");
                return parseInt(parts[0]) === currentYear && parseInt(parts[1]) === mIdx + 1;
              });

              return (
                <div
                  key={mIdx}
                  onClick={() => {
                    setCurrentMonth(mIdx);
                    setViewMode("month");
                  }}
                  className="p-4 border border-[var(--border-color)] rounded-xl bg-white hover:border-[var(--primary-color)] hover:shadow-sm transition-all cursor-pointer"
                >
                  <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2">{name}</h4>
                  <div className="space-y-1.5 min-h-20">
                    {monthEvents.length === 0 ? (
                      <p className="text-[11px] opacity-50 italic">لا توجد فعاليات مجدولة</p>
                    ) : (
                      monthEvents.slice(0, 2).map((e, idx) => (
                        <div key={idx} className="text-[10px] bg-emerald-50 text-emerald-800 p-1 rounded border border-emerald-100 truncate">
                          {e.title}
                        </div>
                      ))
                    )}
                    {monthEvents.length > 2 && (
                      <p className="text-[10px] text-[var(--primary-color)] font-semibold mt-1">
                        + {monthEvents.length - 2} فعاليات أخرى
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Color Indicators Legend */}
      <div className="flex flex-wrap gap-4 justify-center items-center text-xs font-semibold opacity-85 mt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-300 inline-block" />
          الفعاليات المعتمدة
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-sky-100 border border-sky-300 inline-block" />
          البرامج والدورات التطويرية
        </span>
      </div>

      {/* Dynamic Overlay Modal for clicked day item detail & booking */}
      {activeItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-right" style={{ direction: "rtl" }}>
            <div className="bg-[var(--primary-color)] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <h3 className="font-bold text-sm">تفاصيل ومواعيد المبادرة</h3>
              </div>
              <button
                onClick={() => { setActiveItem(null); setBookingSuccess(null); setBookingError(null); }}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeItem.type === "event" ? "bg-emerald-100 text-emerald-800" : "bg-sky-100 text-sky-800"
                }`}>
                  {activeItem.type === "event" ? "فعالية / ملتقى مجتمعي" : "مبادرة فرعية تابعة للبرامج"}
                </span>
                <h3 className="text-base font-bold text-slate-900">{activeItem.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{activeItem.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] font-medium text-slate-700">
                <div className="space-y-0.5">
                  <p className="text-slate-400 font-bold">التاريخ المجدول</p>
                  <p>{activeItem.date}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-slate-400 font-bold">التوقيت</p>
                  <p>{activeItem.time}</p>
                </div>
                {activeItem.location && (
                  <div className="col-span-2 pt-2 border-t border-slate-200/60 mt-1 space-y-0.5">
                    <p className="text-slate-400 font-bold">الموقع / مكان الإقامة</p>
                    <p className="text-[var(--primary-color)] font-bold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {activeItem.location}
                    </p>
                  </div>
                )}
              </div>

              {/* Seats Booking section if enabled */}
              {activeItem.seatsEnabled ? (
                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">حجز المقاعد متاح عبر التقويم</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        المقاعد المتبقية: <span className="font-bold text-emerald-700">{activeItem.seatsRemaining}</span> من أصل <span className="font-semibold">{activeItem.seatsTotal}</span>
                      </p>
                    </div>
                    <Ticket className="w-5 h-5 text-emerald-600" />
                  </div>

                  {isUserBooked(activeItem) ? (
                    <div className="p-2 bg-emerald-600 text-white rounded-lg text-center text-xs font-bold">
                      لقد قمت بحجز مقعدك بنجاح ✓
                    </div>
                  ) : activeItem.seatsRemaining && activeItem.seatsRemaining <= 0 ? (
                    <div className="p-2 bg-slate-200 text-slate-500 rounded-lg text-center text-xs font-bold">
                      عذراً، اكتملت جميع المقاعد المتاحة
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2 border-t border-emerald-100">
                      {!loggedInMember && (
                        <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded leading-relaxed">
                          حجز المقاعد يتطلب وجود عضوية رقمية مصدرة مسبقاً. إذا لم تكن تملك عضوية، يرجى إصدارها من 
                          {" "}<button type="button" onClick={() => { setActiveItem(null); if (setCurrentTab) setCurrentTab("memberships"); }} className="underline font-bold text-emerald-800 cursor-pointer">صفحة العضويات</button>.
                        </p>
                      )}

                      {bookingError && <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded">{bookingError}</p>}
                      {bookingSuccess && <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded">{bookingSuccess}</p>}
                      
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 mb-0.5">الاسم الثلاثي</label>
                            <input
                              type="text"
                              placeholder="الاسم الثلاثي للعضو"
                              value={bookingName}
                              onChange={(e) => setBookingName(e.target.value)}
                              className="w-full p-2 border rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-emerald-600"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 mb-0.5">رقم الجوال</label>
                            <input
                              type="tel"
                              placeholder="05xxxxxxx"
                              value={bookingPhone}
                              onChange={(e) => setBookingPhone(e.target.value)}
                              className="w-full p-2 border rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-emerald-600 text-left font-mono"
                              dir="ltr"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">رقم العضوية الرقمية (المصدر سابقاً)</label>
                          <input
                            type="text"
                            placeholder="مثال: AA1234"
                            value={bookingMemberId}
                            onChange={(e) => setBookingMemberId(e.target.value)}
                            className="w-full p-2 border rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-emerald-600 text-left font-mono"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleConfirmBooking}
                        disabled={bookingLoading}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {bookingLoading ? "جاري حجز المقعد..." : "تأكيد حجز مقعدك الآن"}
                      </button>
                    </div>
                  )}
                </div>
              ) : activeItem.type === "event" ? (
                // For event registration in the calendar
                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">التسجيل متاح في هذه الفعالية</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">يمكنك تقديم طلب حضور وتأكيد تسجيلك في الفعالية</p>
                    </div>
                    <Ticket className="w-5 h-5 text-emerald-600" />
                  </div>

                  {isEventBooked(activeItem.original) ? (
                    <div className="p-2 bg-emerald-600 text-white rounded-lg text-center text-xs font-bold">
                      تم تقديم طلب حضورك بنجاح ✓
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2 border-t border-emerald-100">
                      {!loggedInMember && (
                        <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded leading-relaxed">
                          طلب الحضور يتطلب وجود عضوية رقمية مصدرة مسبقاً. إذا لم تكن تملك عضوية، يرجى إصدارها من 
                          {" "}<button type="button" onClick={() => { setActiveItem(null); if (setCurrentTab) setCurrentTab("memberships"); }} className="underline font-bold text-emerald-800 cursor-pointer">صفحة العضويات</button>.
                        </p>
                      )}

                      {bookingError && <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded">{bookingError}</p>}
                      {bookingSuccess && <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded">{bookingSuccess}</p>}

                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 mb-0.5">الاسم الثلاثي</label>
                            <input
                              type="text"
                              placeholder="الاسم الثلاثي للعضو"
                              value={bookingName}
                              onChange={(e) => setBookingName(e.target.value)}
                              className="w-full p-2 border rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-emerald-600"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 mb-0.5">رقم الجوال</label>
                            <input
                              type="tel"
                              placeholder="05xxxxxxx"
                              value={bookingPhone}
                              onChange={(e) => setBookingPhone(e.target.value)}
                              className="w-full p-2 border rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-emerald-600 text-left font-mono"
                              dir="ltr"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">رقم العضوية الرقمية (المصدر سابقاً)</label>
                          <input
                            type="text"
                            placeholder="مثال: AA1234"
                            value={bookingMemberId}
                            onChange={(e) => setBookingMemberId(e.target.value)}
                            className="w-full p-2 border rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-emerald-600 text-left font-mono"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleConfirmEventBooking}
                        disabled={bookingLoading}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {bookingLoading ? "جاري تقديم طلب الحضور..." : "إرسال طلب تسجيل حضور"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border rounded-xl text-center text-xs text-slate-500">
                  هذه المبادرة لا تتطلب حجز مقاعد مسبق، يرجى الحضور والمشاركة في الموعد المجدول.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
