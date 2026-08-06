"use client";

import { useEffect, useState } from "react";
import { Star, Users, Award } from "lucide-react";
import { surveyService, type TeamSatisfactionStatsDto } from "@/src/services/surveyService";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";

export function TeamSatisfactionReport() {
  const [stats, setStats] = useState<TeamSatisfactionStatsDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await surveyService.getTeamStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to load team survey stats", err);
      } finally {
        setLoading(false);
      }
    }
    void fetchStats();
  }, []);

  if (loading) return <LoadingSpinner label="Loading team CSAT statistics..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500" />
            Team Customer Satisfaction (CSAT) Report
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Average ratings and performance breakdowns for support teams based on completed ticket surveys.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((team) => (
          <div
            key={team.teamId}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
          >
            {/* Header: Team Name & Total Surveys */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-500" />
                  {team.teamName}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {team.totalSurveysCount} {team.totalSurveysCount === 1 ? "Survey" : "Surveys"} Completed
                </span>
              </div>
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 px-2.5 py-1 rounded-xl">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span className="font-extrabold text-sm text-amber-700 dark:text-amber-400">
                  {team.totalSurveysCount > 0 ? team.averageRating : "—"}
                </span>
              </div>
            </div>

            {/* Rating Breakdown */}
            {team.totalSurveysCount > 0 ? (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Overall Experience</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    <span className="font-bold text-slate-900 dark:text-white">{team.averageRating}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Communication Quality</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-blue-400 fill-blue-400" />
                    <span className="font-bold text-slate-900 dark:text-white">{team.averageCommunicationRating}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Solution Quality</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400" />
                    <span className="font-bold text-slate-900 dark:text-white">{team.averageSolutionRating}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic pt-2 border-t border-slate-100 dark:border-slate-800/60">
                No survey data available yet.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}