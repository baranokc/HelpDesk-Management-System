"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { avatarFileSchema } from "@/src/schemas/profileSchemas";
import { profileService } from "@/src/services/profileService";
import type { ProfileDto } from "@/src/types/profile";
import { getApiErrorMessage } from "@/src/lib/api";
import { Alert } from "@/src/components/ui/Alert";
import { Avatar } from "@/src/components/ui/Avatar";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { ConfirmModal } from "@/src/components/ui/ConfirmModal";

interface ProfileAvatarSectionProps {
  profile: ProfileDto;
  onProfileChanged: (profile: ProfileDto) => Promise<void>;
}

export function ProfileAvatarSection({
  profile,
  onProfileChanged,
}: ProfileAvatarSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setError(null);
    setSuccess(null);

    const validation = avatarFileSchema.safeParse(file);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Invalid avatar file.");
      return;
    }

    setUploading(true);

    try {
      const updatedProfile = await profileService.uploadAvatar(file);
      await onProfileChanged(updatedProfile);
      setSuccess("Profile photo was updated.");
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(requestError, "Failed to upload the profile photo."),
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      await profileService.deleteAvatar();
      await onProfileChanged({ ...profile, avatarUrl: null });
      setConfirmOpen(false);
      setSuccess("Profile photo was removed.");
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(requestError, "Failed to remove the profile photo."),
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card
        action={
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400">
            <Camera className="h-5 w-5" />
          </div>
        }
        className="overflow-hidden !rounded-2xl border-slate-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80"
        description="JPEG, PNG or WebP. Maximum file size is 2 MB."
        title="Profile photo"
      >
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <div className="rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 p-1 shadow-lg shadow-indigo-500/15">
            <div className="rounded-full bg-white p-1 dark:bg-slate-900">
              <Avatar
                avatarUrl={profile.avatarUrl}
                className="ring-0"
                name={profile.fullName}
                size="lg"
              />
            </div>
          </div>

          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {profile.fullName}
              </p>
              <div className="mt-1.5 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                  {profile.role}
                </span>
                {profile.teamName && (
                  <span className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {profile.teamName}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                This photo is used in the navigation bar, ticket list, and
                comments.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              <input
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => void handleFileSelected(event)}
                ref={fileInputRef}
                type="file"
              />

              <Button
                className="!rounded-xl !border-indigo-300 !bg-indigo-50/70 !font-bold !text-indigo-700 shadow-sm transition-all hover:!bg-indigo-600 hover:!text-white dark:!border-violet-500/40 dark:!bg-violet-500/10 dark:!text-violet-300 dark:hover:!bg-violet-600 dark:hover:!text-white"
                loading={uploading}
                onClick={() => fileInputRef.current?.click()}
                size="sm"
                type="button"
              >
                <Camera aria-hidden="true" className="h-4 w-4" />
                {profile.avatarUrl ? "Change photo" : "Upload photo"}
              </Button>

              {profile.avatarUrl && (
                <Button
                  className="!rounded-xl !bg-rose-50/70 !font-bold shadow-sm dark:!bg-rose-500/10"
                  disabled={uploading}
                  onClick={() => setConfirmOpen(true)}
                  size="sm"
                  type="button"
                  variant="danger"
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        {(error || success) && (
          <div className="mt-4">
            <Alert variant={error ? "error" : "success"}>
              {error ?? success}
            </Alert>
          </div>
        )}
      </Card>

      <ConfirmModal
        confirmLabel="Remove photo"
        danger
        description="Your profile photo will be removed. Your initials will be shown instead."
        loading={deleting}
        onClose={() => !deleting && setConfirmOpen(false)}
        onConfirm={handleDelete}
        open={confirmOpen}
        title="Remove profile photo?"
      />
    </>
  );
}
