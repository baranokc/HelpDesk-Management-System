"use client";

import { useEffect, useState } from "react";
import { Star, CheckCircle2, MessageSquare } from "lucide-react";
import { surveyService, type SatisfactionSurveyDto } from "@/src/services/surveyService";

interface CsatSurveyCardProps {
  ticketId: string;
  ticketStatus: string;
}

export function CsatSurveyCard({ ticketId, ticketStatus }: CsatSurveyCardProps) {
  const [existingSurvey, setExistingSurvey] = useState<SatisfactionSurveyDto | null>(null);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [solutionRating, setSolutionRating] = useState(0);
  const [comment, setComment] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isEligible = ticketStatus === "Resolved" || ticketStatus === "Closed";

  useEffect(() => {
    if (!isEligible) {
      setLoading(false);
      return;
    }

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
    if (rating === 0 || communicationRating === 0 || solutionRating === 0) return;

    setSubmitting(true);
    try {
      const result = await surveyService.submitSurvey(ticketId, {
        rating,
        communicationRating,
        solutionRating,
        comment: comment.trim(),
      });
      setExistingSurvey(result);
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit satisfaction survey", err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarPicker = (currentValue: number, onChange: (val: number) => void, readOnly = false) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange(star)}
          className={`p-0.5 transition-transform ${readOnly ? "cursor-default" : "hover:scale-110 focus:outline-none"}`}
        >
          <Star
            className={`h-5 w-5 ${
              star <= currentValue
                ? "text-amber-400 fill-amber-400 drop-shadow-sm"
                : "text-slate-300 dark:text-slate-700"
            }`}
          />
        </button>
      ))}
    </div>
  );

  if (existingSurvey || submitted) {
    const surveyData = existingSurvey || { rating, communicationRating, solutionRating, comment };

    return (
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
          <CheckCircle2 className="h-5 w-5" />
          <span>Satisfaction Survey Submitted</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="space-y-1 bg-white/60 dark:bg-slate-900/40 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Overall Experience</p>
            {renderStarPicker(surveyData.rating, () => {}, true)}
          </div>

          <div className="space-y-1 bg-white/60 dark:bg-slate-900/40 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Communication</p>
            {renderStarPicker(surveyData.communicationRating, () => {}, true)}
          </div>

          <div className="space-y-1 bg-white/60 dark:bg-slate-900/40 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Solution Quality</p>
            {renderStarPicker(surveyData.solutionRating, () => {}, true)}
          </div>
        </div>

        {surveyData.comment && (
          <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-white/80 dark:bg-slate-900/60 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
            "{surveyData.comment}"
          </p>
        )}
      </div>
    );
  }

  const isFormValid = rating > 0 && communicationRating > 0 && solutionRating > 0;

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/70 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 p-6 shadow-sm space-y-5"
    >
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Rate Your Experience</span>
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Ticket Satisfaction Survey
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Please rate the support quality received for this ticket.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        <div className="space-y-2 bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Overall Experience *</label>
          {renderStarPicker(rating, setRating)}
        </div>

        <div className="space-y-2 bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Communication *</label>
          {renderStarPicker(communicationRating, setCommunicationRating)}
        </div>

        <div className="space-y-2 bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Solution Quality *</label>
          {renderStarPicker(solutionRating, setSolutionRating)}
        </div>
      </div>

      <div>
        <textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share any additional thoughts or suggestions (optional)..."
          className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!isFormValid || submitting}
          className="btn btn-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs rounded-xl px-5 border-none shadow-md shadow-indigo-500/20"
        >
          {submitting ? "Submitting..." : "Submit Survey"}
        </button>
      </div>
    </form>
  );
}