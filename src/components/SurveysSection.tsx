/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SurveyItem, MemberProfile } from "../types";
import { voteInSurvey } from "../lib/api";
import { CheckCircle, AlertCircle, BarChart3, HelpCircle, Send, Star, FileText } from "lucide-react";

export function SurveysSection({
  surveys,
  loggedInMember,
  onSurveyVotedSuccess
}: {
  surveys: SurveyItem[];
  loggedInMember: MemberProfile | null;
  onSurveyVotedSuccess: (updatedSurvey: SurveyItem) => void;
}) {
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyItem | null>(null);
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSurvey) return;
    
    if (!loggedInMember) {
      setError("يرجى تسجيل الدخول أولاً لتتمكن من إرسال إجابتك.");
      return;
    }

    // Check if all questions are answered
    const unanswered = selectedSurvey.questions.filter(q => !answers[q.id] || answers[q.id].trim() === "");
    if (unanswered.length > 0) {
      setError("الرجاء الإجابة على جميع الأسئلة المطروحة قبل الإرسال.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await voteInSurvey({
        surveyId: selectedSurvey.id,
        voterId: loggedInMember.id,
        answers
      });

      if (response.success) {
        setSuccess("نشكرك جزيل الشكر على مشاركتك القيمة! تم تسجيل إجابتك بنجاح.");
        onSurveyVotedSuccess(response.survey);
        setTimeout(() => {
          setSelectedSurvey(null);
          setAnswers({});
          setSuccess(null);
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || "فشل تسجيل التصويت.");
    } finally {
      setLoading(false);
    }
  };

  // Check if member already voted
  const hasVoted = (srv: SurveyItem) => {
    if (!loggedInMember) return false;
    return srv.responses.some((r) => r.voterId === loggedInMember.id);
  };

  // Calculate MCQ percentages helper
  const getMcqStats = (srv: SurveyItem, qId: string, option: string) => {
    const totalVotes = srv.responses.length;
    if (totalVotes === 0) return 0;
    
    const count = srv.responses.filter((r) => r.answers[qId] === option).length;
    return Math.round((count / totalVotes) * 100);
  };

  if (selectedSurvey) {
    const alreadyVoted = hasVoted(selectedSurvey);

    return (
      <div className="max-w-3xl mx-auto py-8 px-4" id="survey-taking-view">
        <button
          onClick={() => { setSelectedSurvey(null); setError(null); setAnswers({}); }}
          className="mb-6 text-sm font-semibold text-[var(--primary-color)] hover:underline flex items-center gap-1.5"
        >
          &rarr; العودة إلى الاستبيانات والاستطلاعات
        </button>

        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="border-b border-[var(--border-color)] pb-4 mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">{selectedSurvey.title}</h1>
              <p className="text-xs opacity-70 mt-1">تاريخ الانتهاء: {selectedSurvey.endDate}</p>
            </div>
            <div className="bg-emerald-50 text-emerald-800 text-xs px-3 py-1.5 rounded-full font-bold">
              {selectedSurvey.responses.length} مشاركاً
            </div>
          </div>

          {alreadyVoted ? (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl font-bold flex items-center gap-2 text-sm">
                <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                <span>لقد شاركت في هذا الاستبيان بنجاح. تظهر أدناه نتائج التصويت الفورية للمجتمع بالمسقي:</span>
              </div>

              {/* Poll Results Rendering */}
              <div className="space-y-6">
                {selectedSurvey.questions.map((q, idx) => (
                  <div key={q.id} className="p-4 border border-[var(--border-color)] rounded-xl bg-slate-50/50">
                    <h4 className="font-bold text-slate-800 mb-4 flex gap-2">
                      <span className="text-[var(--primary-color)] font-extrabold">{idx + 1}.</span>
                      {q.questionText}
                    </h4>

                    {q.type === "mcq" && q.options ? (
                      <div className="space-y-3">
                        {q.options.map((opt, oIdx) => {
                          const pct = getMcqStats(selectedSurvey, q.id, opt);
                          return (
                            <div key={oIdx} className="space-y-1.5">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="opacity-90">{opt}</span>
                                <span className="text-[var(--primary-color)]">{pct}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                                <div className="bg-[var(--primary-color)] h-full transition-all duration-300" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 bg-white rounded-lg border border-[var(--border-color)] max-h-44 overflow-y-auto">
                        <p className="text-xs text-slate-400 font-semibold mb-2">بعض الإجابات النصية من المشاركين:</p>
                        <div className="space-y-2">
                          {selectedSurvey.responses.filter(r => r.answers[q.id]).map((r, rIdx) => (
                            <p key={rIdx} className="text-xs text-slate-700 bg-slate-50 p-2 rounded leading-relaxed border-r-2 border-[var(--primary-color)]">
                              "{r.answers[q.id]}"
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleVoteSubmit} className="space-y-6">
              {selectedSurvey.questions.map((q, idx) => (
                <div key={q.id} className="p-5 border border-[var(--border-color)] rounded-2xl bg-white space-y-4">
                  <h4 className="font-bold text-slate-800 flex gap-2 text-base md:text-lg">
                    <span className="text-[var(--primary-color)] font-extrabold">{idx + 1}.</span>
                    {q.questionText}
                  </h4>

                  {q.type === "mcq" && q.options ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {q.options.map((opt, oIdx) => (
                        <label
                          key={oIdx}
                          className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer hover:border-[var(--primary-color)] transition-colors ${
                            answers[q.id] === opt ? "border-[var(--primary-color)] bg-emerald-50/50 text-[var(--primary-color)] font-semibold" : "border-[var(--border-color)] bg-slate-50/20"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q_${q.id}`}
                            value={opt}
                            checked={answers[q.id] === opt}
                            onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                            className="w-4 h-4 text-[var(--primary-color)]"
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <textarea
                        required
                        rows={3}
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        className="w-full p-3 border border-[var(--border-color)] rounded-xl text-sm bg-[var(--input-bg)]"
                        placeholder="اكتب إجابتك بالتفصيل هنا..."
                      />
                    </div>
                  )}
                </div>
              ))}

              {error && (
                <div className="p-3.5 bg-red-50 text-red-800 rounded-xl text-sm font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-1.5">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
              >
                <Send className="w-5 h-5" />
                {loading ? "جاري تسجيل إجاباتك..." : "إرسال الإجابات والتصويت"}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4" id="surveys-grid-view">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-[var(--primary-color)] flex items-center justify-center gap-2">
          <BarChart3 className="w-8 h-8" /> استبيانات واستطلاعات الرأي
        </h1>
        <p className="text-sm opacity-80 mt-2">رأيكم يهمنا ويسهم بشكل مباشر في صياغة برامجنا وتجويد فعالياتنا لقرية المسقي</p>
      </div>

      {surveys.length === 0 ? (
        <p className="text-center py-12 opacity-60">لا توجد استطلاعات رأي أو استبيانات نشطة حالياً.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {surveys.map((srv) => {
            const alreadyVoted = hasVoted(srv);

            return (
              <div
                key={srv.id}
                onClick={() => setSelectedSurvey(srv)}
                className="group cursor-pointer bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[var(--primary-color)] transition-all flex flex-col justify-between h-56"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                      {srv.questions.length} أسئلة
                    </span>
                    {alreadyVoted && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                        تمت المشاركة ✓
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-lg text-slate-800 group-hover:text-[var(--primary-color)] transition-colors leading-tight line-clamp-2">
                    {srv.title}
                  </h3>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-slate-400">عدد المشاركين الإجمالي</p>
                    <p className="font-extrabold text-sm text-slate-700">{srv.responses.length} عضواً</p>
                  </div>
                  <span className="text-xs font-bold text-[var(--primary-color)] group-hover:underline flex items-center gap-1">
                    {alreadyVoted ? "عرض النتائج الفورية" : "ابدأ الاستبيان الآن"} &larr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
