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
        getApiErrorMessage(
          requestError,
          "Failed to upload the profile photo.",
        ),
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
        getApiErrorMessage(
          requestError,
          "Failed to remove the profile photo.",
        ),
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card
        description="JPEG, PNG or WebP. Maximum file size is 2 MB."
        title="Profile photo"
      >
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <Avatar
            avatarUrl={profile.avatarUrl}
            className="shadow-sm"
            name={profile.fullName}
            size="lg"
          />

          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                {profile.fullName}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                This photo is used in the navigation bar, ticket list, and comments.
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
