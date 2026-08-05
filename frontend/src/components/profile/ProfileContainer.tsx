"use client";

import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "@/src/lib/api";
import { profileService } from "@/src/services/profileService";
import type { ProfileDto } from "@/src/types/profile";
import { useAuth } from "@/src/context/AuthContext";
import { Alert } from "@/src/components/ui/Alert";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";
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
    return <LoadingSpinner label="Loading profile..." />;
  }

  if (error || !profile) {
    return (
      <Alert variant="error">
        {error ?? "Profile was not found."}
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Profile
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Manage your personal information, profile photo, and password.
        </p>
      </div>

      <ProfileAvatarSection
        onProfileChanged={handleProfileChanged}
        profile={profile}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileInformationForm
          onProfileChanged={handleProfileChanged}
          profile={profile}
        />
        <ChangePasswordForm />
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Account created {new Date(profile.createdAt).toLocaleDateString("tr-TR", {
          dateStyle: "long",
        })}
      </p>
    </div>
  );
}
