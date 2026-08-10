"use client";

import { useEffect, useState } from "react";
import { Star, CheckCircle2, MessageSquare } from "lucide-react";
import {
  surveyService,
  type SatisfactionSurveyDto,
} from "@/src/services/surveyService";

interface CsatSurveyCardProps {
  ticketId: string;
  ticketStatus: string;
}

export function CsatSurveyCard({
  ticketId,
  ticketStatus,
}: CsatSurveyCardProps) {
  const [existingSurvey, setExistingSurvey] =
    useState<SatisfactionSurveyDto | null>(null);
  const [loading, setLoading] = useState(true);

  const [communicationRating, setCommunicationRating] = useState(0);
  const [solutionRating, setSolutionRating] = useState(0);
  const [speedRating, setSpeedRating] = useState(0);

  // 🌟 Hover (üzerine gelme) durumlarını takip etmek için state'ler
  const [hoverCommunication, setHoverCommunication] = useState<number | null>(null);
  const [hoverSolution, setHoverSolution] = useState<number | null>(null);
  const [hoverSpeed, setHoverSpeed] = useState<number | null>(null);

  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEligible = ticketStatus === "Resolved" || ticketStatus === "Closed";

  useEffect(() => {
    if (!isEligible) return;

    async function loadSurvey() {
      const data = await surveyService.getSurvey(ticketId);
      if (data) {
        setExistingSurvey(data);
      }
      setLoading(false);
    }
    void loadSurvey();
  }, [ticketId, isEligible]);

  if (!isEligible || loading) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      communicationRating === 0 ||
      solutionRating === 0 ||
      speedRating === 0
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await surveyService.submitSurvey(ticketId, {
        communicationRating,
        solutionRating,
        speedRating,
        comment: comment.trim(),
      });
      setExistingSurvey(result);
    } catch (err) {
      console.error("Failed to submit satisfaction survey", err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarPicker = (
    currentValue: number,
    onChange: (val: number) => void,
    hoverValue: number | null,
    onHoverChange: (val: number | null) => void,
    readOnly = false,
  ) => {
    // Eğer hover yapılıyorsa o anki hover değerini, yapılmıyorsa seçili değeri baz al
    const activeVal = hoverValue !== null ? hoverValue : currentValue;

    return (
      <div 
        className="flex items-center gap-1"
        onMouseLeave={() => !readOnly && onHoverChange(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeVal;
          // Hover esnasında seçilmemiş olanlar daha silik görünür
          const isHoveredPreview = hoverValue !== null && star <= hoverValue;

          return (
            <button
              key={star}
              type="button"
              disabled={readOnly}
              onClick={() => onChange(star)}
              onMouseEnter={() => !readOnly && onHoverChange(star)}
              className={`p-0.5 transition-transform ${readOnly ? "cursor-default" : "hover:scale-110 focus:outline-none"}`}
            >
              <Star
                className={`h-5 w-5 transition-opacity duration-150 ${
                  isFilled
                    ? `text-amber-400 fill-amber-400 drop-shadow-sm ${
                        isHoveredPreview && hoverValue !== currentValue ? "opacity-60" : "opacity-100"
                      }`
                    : "text-stone-300 dark:text-slate-700 opacity-50 hover:opacity-100"
                }`}
              />
            </button>
          );
        })}
      </div>
    );
  };

  if (existingSurvey) {
    const surveyData = existingSurvey;

    return (
      <div className="rounded-3xl border border-emerald-600/30 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2.5 text-emerald-700 dark:text-purple-300 font-bold text-xs uppercase tracking-wider">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/10 dark:bg-purple-500/20 text-emerald-700 dark:text-purple-300 border border-emerald-600/20 dark:border-purple-500/30">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <span>Satisfaction Survey Submitted</span>
        </div>

        {/* 🌟 DAHA ŞIK VE MODERN "OVERALL EXPERIENCE" ÖNE ÇIKARILMIŞ ALAN */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 dark:from-purple-600/20 dark:via-violet-600/10 dark:to-indigo-600/20 p-5 border border-amber-500/20 dark:border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-inner">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-amber-800 dark:text-purple-300">
              Overall Experience Score
            </span>
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <span className="text-3xl font-black text-stone-900 dark:text-white">
                {surveyData.rating.toFixed(1)}
              </span>
              <span className="text-sm font-bold text-stone-400 dark:text-slate-500">
                / 5.0
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white/80 dark:bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-stone-200/80 dark:border-slate-700/80 shadow-sm">
            {renderStarPicker(surveyData.rating, () => {}, null, () => {}, true)}
          </div>
        </div>

        {/* Diğer Kriterler */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5 bg-stone-50/80 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-stone-200/80 dark:border-slate-700/80">
            <p className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-stone-400 dark:text-slate-400">
              Communication
            </p>
            {renderStarPicker(surveyData.communicationRating, () => {}, null, () => {}, true)}
          </div>

          <div className="space-y-1.5 bg-stone-50/80 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-stone-200/80 dark:border-slate-700/80">
            <p className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-stone-400 dark:text-slate-400">
              Solution Quality
            </p>
            {renderStarPicker(surveyData.solutionRating, () => {}, null, () => {}, true)}
          </div>

          <div className="space-y-1.5 bg-stone-50/80 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-stone-200/80 dark:border-slate-700/80">
            <p className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-stone-400 dark:text-slate-400">
              Response Speed
            </p>
            {renderStarPicker(surveyData.speedRating, () => {}, null, () => {}, true)}
          </div>
        </div>

        {surveyData.comment && (
          <p className="text-xs font-medium text-stone-600 dark:text-slate-300 italic bg-stone-50/80 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-stone-200/80 dark:border-slate-700/80">
            “{surveyData.comment}”
          </p>
        )}
      </div>
    );
  }

  const isFormValid =
    communicationRating > 0 && solutionRating > 0 && speedRating > 0;

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-6 shadow-xl space-y-5"
    >
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-emerald-500/10 dark:bg-purple-500/20 text-emerald-800 dark:text-purple-300 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-600/20 dark:border-purple-500/30 shadow-inner">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Rate Your Experience</span>
        </div>
        <h3 className="text-base font-black tracking-tight text-stone-900 dark:text-white">
          Ticket Satisfaction Survey
        </h3>
        <p className="text-xs font-medium text-stone-500 dark:text-slate-400">
          Please rate the support quality received for this ticket.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        <div className="space-y-2 bg-stone-50/80 dark:bg-slate-800/80 p-4 rounded-2xl border border-stone-200/80 dark:border-slate-700">
          <label className="text-xs font-bold text-stone-800 dark:text-slate-200 block">
            Communication *
          </label>
          {renderStarPicker(
            communicationRating,
            setCommunicationRating,
            hoverCommunication,
            setHoverCommunication
          )}
        </div>

        <div className="space-y-2 bg-stone-50/80 dark:bg-slate-800/80 p-4 rounded-2xl border border-stone-200/80 dark:border-slate-700">
          <label className="text-xs font-bold text-stone-800 dark:text-slate-200 block">
            Solution Quality *
          </label>
          {renderStarPicker(
            solutionRating,
            setSolutionRating,
            hoverSolution,
            setHoverSolution
          )}
        </div>

        <div className="space-y-2 bg-stone-50/80 dark:bg-slate-800/80 p-4 rounded-2xl border border-stone-200/80 dark:border-slate-700">
          <label className="text-xs font-bold text-stone-800 dark:text-slate-200 block">
            Response Speed *
          </label>
          {renderStarPicker(
            speedRating,
            setSpeedRating,
            hoverSpeed,
            setHoverSpeed
          )}
        </div>
      </div>

      <div>
        <textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share any additional thoughts or suggestions (optional)..."
          className="w-full p-3.5 bg-stone-50 dark:bg-slate-800/80 border border-stone-300/80 dark:border-slate-700 rounded-2xl text-xs font-medium text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 dark:focus:border-purple-500 transition-colors shadow-inner"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!isFormValid || submitting}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs px-5 py-2.5 shadow-md shadow-emerald-700/20 transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 dark:from-purple-600 dark:to-indigo-600 dark:shadow-purple-600/30 cursor-pointer border-none"
        >
          {submitting ? "Submitting..." : "Submit Survey"}
        </button>
      </div>
    </form>
  );
}