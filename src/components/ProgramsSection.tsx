/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { MainProgram, SubProgram, MemberProfile } from "../types";
import { registerToSubProgram } from "../lib/api";
import {
  BookOpen, ChevronRight, FileText, Globe, ArrowLeft, EyeOff, LayoutGrid,
  Calendar, Clock, Ticket, Check, AlertCircle, Info, Users, X, Loader2, MapPin
} from "lucide-react";

export function ProgramsSection({
  programs,
  loggedInMember,
  onProgramUpdated,
  setCurrentTab
}: {
  programs: MainProgram[];
  loggedInMember: MemberProfile | null;
  onProgramUpdated: (updatedProgram: MainProgram) => void;
  setCurrentTab?: (tab: "home" | "about" | "reference" | "programs" | "memberships" | "events" | "calendar" | "gallery" | "faqs" | "contact" | "admin") => void;
}) {
  const [selectedProgram, setSelectedProgram] = useState<MainProgram | null>(null);

  // Seat booking registration state
  const [bookingSub, setBookingSub] = useState<{ sub: SubProgram; parentId: string } | null>(null);
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regMemberId, setRegMemberId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter out hidden subprograms for public view
  const visibleSubPrograms = (sub: SubProgram[]) => sub.filter(s => !s.isHidden).sort((a, b) => a.order - b.order);

  // Helper to check if user already booked
  const isUserRegisteredToSub = (sub: SubProgram) => {
    if (!loggedInMember) return false;
    if (!sub.registrations) return false;
    return sub.registrations.some((r) => r.memberId === loggedInMember.id);
  };

  const handleOpenBooking = (sub: SubProgram, parentId: string) => {
    setBookingSub({ sub, parentId });
    if (loggedInMember) {
      setRegName(loggedInMember.tripleName);
      setRegPhone(loggedInMember.phone);
      setRegMemberId(loggedInMember.id);
    } else {
      setRegName("");
      setRegPhone("");
      setRegMemberId("");
    }
    setError(null);
    setSuccess(null);
  };

  const handleSubProgramBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingSub) return;

    if (!regName.trim() || !regPhone.trim() || !regMemberId.trim()) {
      setError("جميع الحقول مطلوبة لإكمال عملية الحجز (الاسم ورقم الجوال ورقم العضوية).");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await registerToSubProgram({
        programId: bookingSub.parentId,
        subProgramId: bookingSub.sub.id,
        memberId: regMemberId.trim(),
        name: regName.trim(),
        phone: regPhone.trim()
      });

      if (response.success) {
        setSuccess("تم حجز مقعدك بنجاح في المبادرة الفرعية وتحديث المقاعد المتاحة!");
        onProgramUpdated(response.program);
        
        // Update local state if selected program is open
        if (selectedProgram && selectedProgram.id === response.program.id) {
          setSelectedProgram(response.program);
        }

        setTimeout(() => {
          setBookingSub(null);
          setSuccess(null);
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع أثناء حجز المقعد.");
    } finally {
      setLoading(false);
    }
  };

  if (selectedProgram) {
    const parentId = selectedProgram.id;
    return (
      <div className="max-w-6xl mx-auto py-8 px-4" id="programs-sub-view">
        {/* Back Button */}
        <button
          onClick={() => setSelectedProgram(null)}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-[var(--primary-color)] hover:underline cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" /> العودة إلى برامجنا الرئيسية
        </button>

        {/* Program Header */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm mb-8 flex flex-col md:flex-row">
          <div className="md:w-1/3 h-56 md:h-auto overflow-hidden bg-slate-100">
            <img src={selectedProgram.image} alt={selectedProgram.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="p-6 md:p-8 md:w-2/3 flex flex-col justify-center">
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--primary-color)] mb-3">{selectedProgram.name}</h1>
            <p className="opacity-90 leading-relaxed text-sm">{selectedProgram.description}</p>
          </div>
        </div>

        {/* Sub programs title */}
        <div className="mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--primary-color)]" />
            المبادرات والأقسام الفرعية التابعة للبرنامج
          </h2>
          <p className="text-xs opacity-70 mt-1">تصفح المبادرات والأدلة الإرشادية الفعالة</p>
        </div>

        {/* Sub programs list */}
        {visibleSubPrograms(selectedProgram.subPrograms).length === 0 ? (
          <p className="text-center py-12 bg-slate-50 border rounded-xl opacity-60 text-sm">لا توجد أقسام فرعية أو مبادرات منشورة حالياً في هذا القسم.</p>
        ) : (
          <div className="space-y-8">
            {visibleSubPrograms(selectedProgram.subPrograms).map((sub) => {
              const seatsRemaining = sub.seatsRemaining ?? sub.seatsTotal ?? 50;
              const seatsTotal = sub.seatsTotal ?? 50;
              const hasBooked = isUserRegisteredToSub(sub);

              return (
                <div
                  key={sub.id}
                  className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="border-b border-[var(--border-color)] pb-4 mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h3 className="text-lg md:text-xl font-bold text-slate-900">{sub.title}</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        {sub.date && (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-800 border border-sky-100 rounded-xl text-xs font-bold w-fit">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>تاريخ المبادرة: {sub.date}</span>
                          </div>
                        )}
                        {(sub.timeFrom || sub.timeTo) && (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-100 rounded-xl text-xs font-bold w-fit">
                            <Clock className="w-3.5 h-3.5" />
                            <span>الوقت: {sub.timeFrom || "--:--"} إلى {sub.timeTo || "--:--"}</span>
                          </div>
                        )}
                        {sub.location && (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-800 border border-purple-100 rounded-xl text-xs font-bold w-fit">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>الموقع: {sub.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm opacity-80 mt-2 leading-relaxed text-slate-700">{sub.description}</p>
                  </div>

                  {/* Seat booking info & action */}
                  {sub.seatsEnabled && (
                    <div className="mb-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg">
                          <Ticket className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">حجز المقاعد متاح لهذه المبادرة الفرعية</p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            المقاعد المتبقية: <span className="font-bold text-emerald-700">{seatsRemaining}</span> من أصل <span className="font-semibold">{seatsTotal}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {hasBooked ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm">
                            <Check className="w-4 h-4" />
                            <span>تم حجز مقعدك بنجاح ✓</span>
                          </div>
                        ) : seatsRemaining <= 0 ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 text-slate-600 text-xs font-bold rounded-lg cursor-not-allowed">
                            <AlertCircle className="w-4 h-4" />
                            <span>عذراً، اكتملت المقاعد</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenBooking(sub, parentId)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Ticket className="w-4 h-4" />
                            <span>احجز مقعدك الآن</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sub Program Images Grid */}
                  {sub.images && sub.images.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold mb-2 opacity-75">معرض صور المبادرة:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {sub.images.map((imgUrl, i) => (
                          <div key={i} className="rounded-xl overflow-hidden border border-[var(--border-color)] h-32 bg-slate-100">
                            <img src={imgUrl} alt={`SubProgram preview ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sub Program Attachments and links */}
                  <div className="flex flex-col md:flex-row gap-4 mt-4 pt-4 border-t border-[var(--border-color)] justify-between items-start md:items-center">
                    {/* File Links */}
                    <div className="w-full md:w-1/2 space-y-1.5">
                      {sub.files && sub.files.length > 0 ? (
                        <div>
                          <p className="text-xs font-semibold mb-1 opacity-75">ملفات إرشادية مرفقة:</p>
                          <div className="space-y-1">
                            {sub.files.map((f, idx) => (
                              <a
                                key={idx}
                                href={f.url}
                                className="text-xs text-[var(--primary-color)] font-semibold hover:underline flex items-center gap-1.5 p-1.5 bg-slate-50 rounded border border-slate-100"
                              >
                                <FileText className="w-4 h-4 text-slate-500" />
                                <span>{f.name} ({f.size || "1.2 MB"})</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] opacity-50 italic">لا توجد ملفات مرفقة بالمبادرة</p>
                      )}
                    </div>

                    {/* External Links */}
                    <div className="w-full md:w-1/2 flex flex-wrap gap-2 justify-end">
                      {sub.links && sub.links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1.5 bg-sky-50 text-sky-800 border border-sky-200 rounded-lg flex items-center gap-1 hover:bg-sky-100 transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          رابط خارجي للمبادرة
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dynamic Overlay Modal for Seat Booking */}
        {bookingSub && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-[var(--primary-color)] p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  <h3 className="font-bold text-sm">حجز مقعد في المبادرة الفرعية</h3>
                </div>
                <button
                  onClick={() => setBookingSub(null)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-800">{bookingSub.sub.title}</p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{bookingSub.sub.description}</p>
                  <div className="flex gap-4 mt-2 text-[10px] text-slate-600 font-mono">
                    {bookingSub.sub.date && <span>التاريخ: {bookingSub.sub.date}</span>}
                    {bookingSub.sub.timeFrom && <span>الوقت: {bookingSub.sub.timeFrom} - {bookingSub.sub.timeTo}</span>}
                  </div>
                </div>

                {!loggedInMember && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[11px] text-amber-800 leading-relaxed">
                    <p className="font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      ملاحظة لغير المسجلين:
                    </p>
                    <p className="mt-0.5">
                      حجز المقاعد يتطلب وجود عضوية رقمية مصدرة مسبقاً. يرجى إدخال اسمك، رقم جوالك، ورقم عضويتك بدقة. إذا لم تكن تملك عضوية، يمكنك إصدارها مجاناً من 
                      {" "}<button type="button" onClick={() => { setBookingSub(null); if (setCurrentTab) setCurrentTab("memberships"); }} className="underline font-bold text-emerald-700 cursor-pointer">صفحة العضويات</button>.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubProgramBooking} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  {success && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{success}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الثلاثي للعضو</label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                        placeholder="اكتب اسمك الثلاثي المسجل في العضوية"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">رقم الجوال</label>
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-1 focus:ring-[var(--primary-color)] text-left font-mono"
                        placeholder="05xxxxxxx"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">رقم العضوية الرقمية (المصدر سابقاً)</label>
                      <input
                        type="text"
                        required
                        value={regMemberId}
                        onChange={(e) => setRegMemberId(e.target.value)}
                        className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-1 focus:ring-[var(--primary-color)] text-left font-mono"
                        placeholder="مثال: AA1234"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setBookingSub(null)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                      disabled={loading}
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>جاري الحجز...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>تأكيد حجز مقعد</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4" id="programs-view">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--primary-color)] flex items-center justify-center gap-2">
          <LayoutGrid className="w-8 h-8" /> برامجنا وأنشطتنا الرئيسية
        </h1>
        <p className="text-sm opacity-80 mt-2">نقدم باقة متنوعة من البرامج الاجتماعية، الثقافية، الرياضية، والتطوعية لخدمة المجتمع بالمسقي</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {programs.map((program) => (
          <div
            key={program.id}
            onClick={() => setSelectedProgram(program)}
            className="group cursor-pointer bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="h-48 overflow-hidden relative bg-slate-100">
                <img src={program.image} alt={program.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                <div className="absolute top-2 left-2 bg-[var(--primary-color)] text-[var(--button-text)] px-3 py-1 rounded-full text-xs font-semibold">
                  {visibleSubPrograms(program.subPrograms).length} مبادرات
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-xl mb-2 group-hover:text-[var(--primary-color)] transition-colors">{program.name}</h3>
                <p className="text-xs opacity-80 leading-relaxed line-clamp-3">{program.description}</p>
              </div>
            </div>
            
            <div className="p-5 border-t border-[var(--border-color)] flex justify-between items-center bg-slate-50/50">
              <span className="text-xs font-semibold opacity-70">استكشف المبادرات الفرعية</span>
              <ArrowLeft className="w-4 h-4 text-[var(--primary-color)] transition-transform group-hover:-translate-x-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
