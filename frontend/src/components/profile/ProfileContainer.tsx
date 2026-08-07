"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, UserRound } from "lucide-react";
import { getApiErrorMessage } from "@/src/lib/api";
import { profileService } from "@/src/services/profileService";
import type { ProfileDto } from "@/src/types/profile";
import { useAuth } from "@/src/context/AuthContext";
import { Alert } from "@/src/components/ui/Alert";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { ProfileAvatarSection } from "./ProfileAvatarSection";
import { ProfileInformationForm } from "./ProfileInformationForm";

export function ProfileContainer() {
  const { refreshSession } = useAuth();
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const loadedProfile = await profileService.getProfile();
        if (!cancelled) setProfile(loadedProfile);
      } catch (requestError: unknown) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(requestError, "Failed to load the profile."),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleProfileChanged = useCallback(
    async (updatedProfile: ProfileDto) => {
      setProfile(updatedProfile);
      await refreshSession();
    },
    [refreshSession],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
          <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return <Alert variant="error">{error ?? "Profile was not found."}</Alert>;
  }

  return (
    <div className="space-y-6">
      <div className="animate-in fade-in slide-in-from-bottom-3 flex items-center gap-3 duration-500">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400">
          <UserRound className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Profile
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Manage your personal information, profile photo, and password.
          </p>
        </div>
      </div>

      <div
        className="animate-in fade-in slide-in-from-bottom-4 duration-500"
        style={{ animationDelay: "100ms" }}
      >
        <ProfileAvatarSection
          onProfileChanged={handleProfileChanged}
          profile={profile}
        />
      </div>

      <div
        className="animate-in fade-in slide-in-from-bottom-4 space-y-3 duration-500"
        style={{ animationDelay: "150ms" }}
      >
        <ProfileInformationForm
          onProfileChanged={handleProfileChanged}
          profile={profile}
        />
        <ChangePasswordForm />
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-xs font-medium text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
        <CalendarDays className="h-4 w-4 text-indigo-500" />
        <span>
          Account created{" "}
          <strong className="font-bold text-slate-700 dark:text-slate-200">
            {new Date(profile.createdAt).toLocaleDateString("tr-TR", {
              dateStyle: "long",
            })}
          </strong>
        </span>
      </div>
    </div>
  );
}
