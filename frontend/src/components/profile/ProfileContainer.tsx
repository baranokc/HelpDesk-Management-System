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
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="space-y-2">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-stone-200 dark:bg-slate-800" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-stone-200 dark:bg-slate-800" />
        </div>
        <div className="h-48 animate-pulse rounded-3xl border border-stone-200/80 bg-white dark:border-purple-900/40 dark:bg-slate-900" />
        <div className="space-y-4">
          <div className="h-80 animate-pulse rounded-3xl border border-stone-200/80 bg-white dark:border-purple-900/40 dark:bg-slate-900" />
          <div className="h-32 animate-pulse rounded-3xl border border-stone-200/80 bg-white dark:border-purple-900/40 dark:bg-slate-900" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return <Alert variant="error">{error ?? "Profile was not found."}</Alert>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* BAŞLIK VE AÇIKLAMA */}
      <div className="animate-in fade-in slide-in-from-bottom-3 flex items-center gap-3 duration-500">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300 shadow-sm">
          <UserRound className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-stone-900 dark:text-white">
            Profile Settings
          </h1>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-slate-400 font-medium">
            Manage your personal information, profile photo, and account security.
          </p>
        </div>
      </div>

      {/* PROFİL FOTOĞRAFI BÖLÜMÜ */}
      <div
        className="animate-in fade-in slide-in-from-bottom-4 duration-500"
        style={{ animationDelay: "100ms" }}
      >
        <ProfileAvatarSection
          onProfileChanged={handleProfileChanged}
          profile={profile}
        />
      </div>

      {/* KİŞİSEL BİLGİLER VE ŞİFRE DEĞİŞTİRME */}
      <div
        className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-500"
        style={{ animationDelay: "150ms" }}
      >
        <ProfileInformationForm
          onProfileChanged={handleProfileChanged}
          profile={profile}
        />
        <ChangePasswordForm />
      </div>

      {/* HESAP OLUŞTURULMA TARİHİ FOOTER */}
      <div className="flex items-center gap-2 rounded-2xl border border-stone-200/80 bg-white/70 px-4 py-3 text-xs font-medium text-stone-500 shadow-sm backdrop-blur-xl dark:border-purple-900/40 dark:bg-slate-900/60 dark:text-slate-400">
        <CalendarDays className="h-4 w-4 text-emerald-600 dark:text-purple-400" />
        <span>
          Account created on{" "}
          <strong className="font-bold text-stone-800 dark:text-slate-200">
            {new Date(profile.createdAt).toLocaleDateString("tr-TR", {
              dateStyle: "long",
            })}
          </strong>
        </span>
      </div>
    </div>
  );
}