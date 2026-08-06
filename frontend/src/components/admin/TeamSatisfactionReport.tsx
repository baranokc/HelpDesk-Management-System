"use client";

import { useEffect, useState } from "react";
import {
  Star,
  Users,
  Award,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  Gauge,
  MessageSquare,
  Zap,
} from "lucide-react";
import {
  surveyService,
  type TeamSatisfactionStatsDto,
} from "@/src/services/surveyService";
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

  if (loading)
    return <LoadingSpinner label="Loading team CSAT statistics..." />;

  // Metrik Hesaplamaları
  const totalSurveys = stats.reduce(
    (acc, curr) => acc + curr.totalSurveysCount,
    0,
  );
  const activeTeamsWithSurveys = stats.filter((t) => t.totalSurveysCount > 0);
  const globalAverage =
    activeTeamsWithSurveys.length > 0
      ? (
          activeTeamsWithSurveys.reduce(
            (acc, curr) => acc + curr.averageRating,
            0,
          ) / activeTeamsWithSurveys.length
        ).toFixed(1)
      : "0";
  const topTeam =
    stats.length > 0 && stats[0].totalSurveysCount > 0 ? stats[0] : null;

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500" />
            Team Customer Satisfaction (CSAT) Report
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time performance metrics, team benchmarks, and comparative
            satisfaction ratings.
          </p>
        </div>
      </div>

      {/* HIGHLIGHT SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Global Average */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Global Average CSAT
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1 flex items-baseline gap-2">
              <span>{globalAverage}</span>
              <span className="text-xs font-semibold text-slate-400">
                / 5.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Across all evaluated teams
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60 flex items-center justify-center text-amber-500">
            <Star className="h-6 w-6 fill-amber-500" />
          </div>
        </div>

        {/* Top Performer */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Top Performing Team
            </span>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 truncate max-w-[180px]">
              {topTeam ? topTeam.teamName : "N/A"}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {topTeam
                ? `${topTeam.averageRating} Avg Score (${topTeam.totalSurveysCount} Surveys)`
                : "No ratings yet"}
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Award className="h-6 w-6" />
          </div>
        </div>

        {/* Total Surveys Collected */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Surveys Received
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {totalSurveys}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Total feedback submissions
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* TEAM CARDS GRID */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
          Team CSAT Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((team) => (
            <div
              key={team.teamId}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4 hover:shadow-md transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-500" />
                    {team.teamName}
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {team.totalSurveysCount}{" "}
                    {team.totalSurveysCount === 1 ? "Survey" : "Surveys"}{" "}
                    Completed
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
                <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      Overall Experience
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      <span className="font-bold text-slate-900 dark:text-white">
                        {team.averageRating}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      Communication Quality
                    </span>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                      <span className="font-bold text-slate-900 dark:text-white">
                        {team.averageCommunicationRating}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      Solution Quality
                    </span>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="font-bold text-slate-900 dark:text-white">
                        {team.averageSolutionRating}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      Response Speed
                    </span>
                    <div className="flex items-center gap-1">
                      <Gauge className="h-3.5 w-3.5 text-violet-500" />
                      <span className="font-bold text-slate-900 dark:text-white">
                        {team.averageSpeedRating}
                      </span>
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

      {/* COMPARATIVE VISUAL CHARTS SECTION */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          {/* CHART 1: TEAM CSAT RANKING (BAR BARS) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-500" />
                Overall CSAT Leaderboard
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                1.0 - 5.0 Scale
              </span>
            </div>

            <div className="space-y-4">
              {stats.map((team) => {
                const percentage = (team.averageRating / 5) * 100;
                return (
                  <div key={team.teamId} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        {team.teamName}
                        {team.totalSurveysCount === 0 && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            (No Data)
                          </span>
                        )}
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        {team.totalSurveysCount > 0
                          ? team.averageRating
                          : "0.0"}
                      </span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 transition-all duration-500"
                        style={{
                          width: `${team.totalSurveysCount > 0 ? percentage : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CHART 2: MULTI-METRIC COMPARISON */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Metric Category Comparison
              </h3>
              {/* Legend */}
              <div className="flex items-center gap-3 text-[10px] font-semibold">
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Overall
                </span>
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> Comm
                </span>
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />{" "}
                  Solution
                </span>
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-violet-500" /> Speed
                </span>
              </div>
            </div>

            <div className="space-y-5">
              {stats.map((team) => (
                <div key={team.teamId} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {team.teamName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {team.totalSurveysCount} surveys
                    </span>
                  </div>

                  {/* Metric Mini Bar Stack */}
                  <div className="space-y-1">
                    {/* Overall */}
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="w-12 text-slate-400">Overall</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${(team.averageRating / 5) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="w-6 text-right font-bold text-slate-700 dark:text-slate-300">
                        {team.averageRating}
                      </span>
                    </div>

                    {/* Communication */}
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="w-12 text-slate-400">Comm</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${(team.averageCommunicationRating / 5) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="w-6 text-right font-bold text-slate-700 dark:text-slate-300">
                        {team.averageCommunicationRating}
                      </span>
                    </div>

                    {/* Solution */}
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="w-12 text-slate-400">Solution</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${(team.averageSolutionRating / 5) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="w-6 text-right font-bold text-slate-700 dark:text-slate-300">
                        {team.averageSolutionRating}
                      </span>
                    </div>

                    {/* Speed */}
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="w-12 text-slate-400">Speed</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${(team.averageSpeedRating / 5) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="w-6 text-right font-bold text-slate-700 dark:text-slate-300">
                        {team.averageSpeedRating}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
