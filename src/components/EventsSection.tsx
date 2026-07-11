/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { EventItem, MemberProfile } from "../types";
import { registerToEvent } from "../lib/api";
import { Calendar, MapPin, Users, Ticket, Check, AlertCircle, Clock, ExternalLink, Search, UserCheck } from "lucide-react";

export function EventsSection({
  events,
  loggedInMember,
  onEventRegisteredSuccess
}: {
  events: EventItem[];
  loggedInMember: MemberProfile | null;
  onEventRegisteredSuccess: (updatedEvent: EventItem) => void;
}) {
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  
  // Registration form states
  const [regName, setRegName] = useState(loggedInMember ? loggedInMember.tripleName : "");
  const [regPhone, setRegPhone] = useState(loggedInMember ? loggedInMember.phone : "");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleEventBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    
    if (!loggedInMember) {
      setError("الرجاء تسجيل الدخول أو إصدار عضوية أولاً لتتمكن من حجز مقعدك.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await registerToEvent({
        eventId: selectedEvent.id,
        memberId: loggedInMember.id,
        name: regName,
        phone: regPhone
      });

      if (response.success) {
        setSuccess("تم تقديم طلبك بنجاح! بانتظار موافقة مشرف الفعالية وتأكيد حجز مقعدك.");
        onEventRegisteredSuccess(response.event);
        setTimeout(() => {
          setSelectedEvent(null);
          setSuccess(null);
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء حجز المقعد.");
    } finally {
      setLoading(false);
    }
  };

  // Occupancy percentage helper
  const getOccupancyPercent = (evt: EventItem) => {
    const total = evt.seatsTotal;
    const remaining = evt.seatsRemaining;
    const taken = total - remaining;
    return Math.min(100, Math.round((taken / total) * 100));
  };

  // Has current user registered helper
  const isUserRegistered = (evt: EventItem) => {
    if (!loggedInMember) return false;
    return evt.registrations.some((r) => r.memberId === loggedInMember.id);
  };

  const getUserRegStatusStr = (evt: EventItem) => {
    if (!loggedInMember) return "";
    const reg = evt.registrations.find((r) => r.memberId === loggedInMember.id);
    if (!reg) return "";
    if (reg.status === "approved") return "مؤكد ومقبول ✓";
    if (reg.status === "rejected") return "مرفوض ✗";
    return "قيد المراجعة والانتظار...";
  };

  if (selectedEvent) {
    const registered = isUserRegistered(selectedEvent);
    const percent = getOccupancyPercent(selectedEvent);

    return (
      <div className="max-w-4xl mx-auto py-8 px-4" id="event-detail-view">
        <button
          onClick={() => { setSelectedEvent(null); setError(null); setSuccess(null); }}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-[var(--primary-color)] hover:underline"
        >
          &rarr; العودة إلى الفعاليات والملتقيات
        </button>

        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
          {/* Main Photo Banner */}
          <div className="h-64 md:h-80 w-full overflow-hidden relative bg-slate-100">
            <img src={selectedEvent.image} alt={selectedEvent.title} className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 bg-[var(--primary-color)] text-white text-xs font-bold px-3 py-1.5 rounded-full">
              {selectedEvent.status === "open" ? "التسجيل مفتوح" : "مغلق"}
            </div>
          </div>

          {/* Details wrapper */}
          <div className="p-6 md:p-8 space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{selectedEvent.title}</h1>
              <p className="text-sm opacity-80 mt-2 leading-relaxed">{selectedEvent.shortDesc}</p>
            </div>

            {/* Event schedule metadata grids */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl text-xs md:text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[var(--primary-color)]" />
                <div>
                  <p className="font-semibold text-slate-700">التاريخ</p>
                  <p className="text-slate-500">{selectedEvent.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[var(--primary-color)]" />
                <div>
                  <p className="font-semibold text-slate-700">التوقيت</p>
                  <p className="text-slate-500">{selectedEvent.startTime} - {selectedEvent.endTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[var(--primary-color)]" />
                <div>
                  <p className="font-semibold text-slate-700">الموقع</p>
                  <p className="text-slate-500">{selectedEvent.location}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-slate-800">تفاصيل الفعالية الكاملة</h3>
              <p className="text-sm opacity-90 leading-relaxed whitespace-pre-line">{selectedEvent.fullDesc}</p>
            </div>

            {/* Location Navigation Anchor */}
            {selectedEvent.mapUrl && (
              <a
                href={selectedEvent.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline"
              >
                <ExternalLink className="w-4 h-4" /> عرض إحداثيات الموقع على خرائط جوجل
              </a>
            )}

            {/* Registration Seat details and metrics */}
            <div className="border-t border-[var(--border-color)] pt-6 space-y-4">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-[var(--primary-color)]" />
                  نسبة اكتمال حجز مقاعد الفعالية:
                </span>
                <span className="text-[var(--primary-color)]">{percent}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[var(--primary-color)] h-full transition-all duration-300" style={{ width: `${percent}%` }} />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>إجمالي المقاعد: {selectedEvent.seatsTotal}</span>
                <span>المقاعد الشاغرة المتبقية: {selectedEvent.seatsRemaining}</span>
              </div>
            </div>

            {/* Booking Form block */}
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl">
              {registered ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-800">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg">أنت مسجل بالفعل في هذه الفعالية!</h3>
                  <p className="text-xs text-slate-500">حالة طلبك: <strong className="text-[var(--primary-color)] font-bold">{getUserRegStatusStr(selectedEvent)}</strong></p>
                </div>
              ) : selectedEvent.status === "closed" || selectedEvent.seatsRemaining <= 0 ? (
                <p className="text-center font-bold text-red-600 py-3">عذراً، التسجيل في هذه الفعالية مغلق حالياً أو اكتملت المقاعد.</p>
              ) : (
                <form onSubmit={handleEventBooking} className="space-y-4">
                  <h3 className="font-bold text-lg mb-2">تأكيد حجز مقعد فوري</h3>
                  <p className="text-xs opacity-70">الرجاء إدخال اسمك وجوالك المرتبط ببطاقتك الرقمية لتثبيت طلب المشاركة:</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1 opacity-80">الاسم المعتمد بالبطاقة</label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full p-2.5 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)]"
                        placeholder="أدخل اسمك كما بالبطاقة"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 opacity-80">رقم الجوال المعتمد</label>
                      <input
                        type="text"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full p-2.5 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--input-bg)] text-left"
                        placeholder="05xxxxxxxx"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                      <Check className="w-4 h-4 flex-shrink-0" />
                      <span>{success}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    <Ticket className="w-5 h-5" />
                    {loading ? "جاري إرسال طلب الحجز..." : "تأكيد طلب حجز مقعد"}
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4" id="events-grid-view">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-[var(--primary-color)] flex items-center justify-center gap-2">
          <Ticket className="w-8 h-8" /> ملتقيات وفعاليات المسقي
        </h1>
        <p className="text-sm opacity-80 mt-2">شاركونا البهجة والتعلم والمنافسة، احجز مقعدك في الفعاليات القادمة بسهولة</p>
      </div>

      {events.length === 0 ? (
        <p className="text-center py-12 opacity-60">لا توجد فعاليات معلنة حالياً، انتظرونا قريباً.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((evt) => {
            const percent = getOccupancyPercent(evt);
            const isRegistered = isUserRegistered(evt);

            return (
              <div
                key={evt.id}
                onClick={() => setSelectedEvent(evt)}
                className="group cursor-pointer bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Photo banner */}
                  <div className="h-44 overflow-hidden relative bg-slate-100">
                    <img src={evt.image} alt={evt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                    {isRegistered && (
                      <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <Check className="w-3 h-3" /> مسجل مسبقاً
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/75 text-white text-[10px] font-semibold px-2 py-1 rounded-md">
                      {evt.date}
                    </div>
                  </div>

                  {/* Body details */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-lg text-slate-800 group-hover:text-[var(--primary-color)] transition-colors line-clamp-1">{evt.title}</h3>
                    <p className="text-xs opacity-75 line-clamp-2 leading-relaxed">{evt.shortDesc}</p>
                    
                    {/* Tiny stats */}
                    <div className="flex gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[var(--primary-color)]" /> {evt.location.split("-")[0]}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[var(--primary-color)]" /> {evt.startTime}</span>
                    </div>
                  </div>
                </div>

                {/* Progressive Bar footer seat indicator */}
                <div className="p-5 bg-slate-50/50 border-t border-[var(--border-color)] space-y-2">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                    <span>حجز المقاعد: {percent}%</span>
                    <span>{evt.seatsRemaining} مقعد شاغر</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[var(--primary-color)] h-full transition-all" style={{ width: `${percent}%` }} />
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
