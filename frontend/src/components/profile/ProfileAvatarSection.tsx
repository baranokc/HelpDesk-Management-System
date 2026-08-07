"use client";

import { useRef, useState } from "react";
import { Camera, Trash2, Image as ImageIcon } from "lucide-react";
import { avatarFileSchema } from "@/src/schemas/profileSchemas";
import { profileService } from "@/src/services/profileService";
import type { ProfileDto } from "@/src/types/profile";
import { getApiErrorMessage } from "@/src/lib/api";
import { Alert } from "@/src/components/ui/Alert";
import { Avatar } from "@/src/components/ui/Avatar";
import { Button } from "@/src/components/ui/Button";
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
      setSuccess("Profile photo was updated successfully.");
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
      <div className="overflow-hidden rounded-3xl border border-stone-200/80 bg-white/80 p-6 shadow-xl backdrop-blur-2xl dark:border-purple-900/40 dark:bg-slate-900/80">
        
        {/* BÖLÜM BAŞLIĞI */}
        <div className="flex items-center justify-between pb-5 border-b border-stone-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-600/20 bg-emerald-500/10 text-emerald-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-stone-900 dark:text-white">
                Profile Photo
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-slate-400">
                JPEG, PNG or WebP format up to 2 MB.
              </p>
            </div>
          </div>
        </div>

        {/* İÇERİK KISMI */}
        <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          
{/* AVATAR DISPLAY - Dış degrade halka */}
<div className="relative group rounded-full p-1 bg-gradient-to-tr from-emerald-600 via-teal-600 to-amber-600 dark:from-purple-600 dark:via-violet-600 dark:to-indigo-500 shadow-xl shadow-emerald-600/15 dark:shadow-purple-600/20 shrink-0">
  
  {/* İç beyaz kapsayıcı (overflow-hidden kırpma alanı) */}
  <div className="relative rounded-full bg-white p-1 dark:bg-slate-900 overflow-hidden flex items-center justify-center">
    <Avatar
      avatarUrl={profile.avatarUrl}
      className="ring-0 overflow-hidden rounded-full object-cover"
      name={profile.fullName}
      size="lg"
    />
  </div>
</div>

          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div>
              <p className="text-lg font-black text-stone-900 dark:text-white">
                {profile.fullName}
              </p>
              <div className="mt-1.5 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span className="rounded-lg border border-emerald-600/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300">
                  {profile.role}
                </span>
                {profile.teamName && (
                  <span className="rounded-lg border border-stone-200 bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {profile.teamName}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-stone-500 dark:text-slate-400">
                This image will be displayed across team tickets, comments, and the main navbar.
              </p>
            </div>

            {/* AKSİYON BUTONLARI */}
            <div className="flex flex-wrap justify-center gap-2.5 sm:justify-start pt-1">
              <input
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => void handleFileSelected(event)}
                ref={fileInputRef}
                type="file"
              />

              <Button
                className="!inline-flex !items-center !gap-2 !px-4 !py-2 !rounded-xl !text-xs !font-bold !text-white !bg-gradient-to-r !from-emerald-600 !to-teal-700 dark:!from-purple-600 dark:!to-indigo-600 hover:!from-emerald-500 hover:!to-teal-600 dark:hover:!from-purple-500 dark:hover:!to-indigo-500 shadow-md shadow-emerald-700/20 dark:shadow-purple-600/30 transition-all"
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
                  className="!inline-flex !items-center !gap-2 !px-4 !py-2 !rounded-xl !text-xs !font-bold !text-rose-700 dark:!text-rose-400 !bg-rose-500/10 hover:!bg-rose-500/20 border border-rose-500/20 transition-all"
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
          <div className="mt-5">
            <Alert variant={error ? "error" : "success"}>
              {error ?? success}
            </Alert>
          </div>
        )}
      </div>

      <ConfirmModal
        confirmLabel="Remove photo"
        danger
        description="Your profile photo will be removed permanently. Your initials will be shown instead."
        loading={deleting}
        onClose={() => !deleting && setConfirmOpen(false)}
        onConfirm={handleDelete}
        open={confirmOpen}
        title="Remove profile photo?"
      />
    </>
  );
}