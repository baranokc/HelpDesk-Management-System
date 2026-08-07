"use client";

import { useState } from "react";
import { ChevronDown, Pencil, Save, UserRound, X } from "lucide-react";
import { getApiErrorMessage } from "@/src/lib/api";
import { getFormErrors, type FormErrors } from "@/src/lib/validation";
import { updateProfileSchema } from "@/src/schemas/profileSchemas";
import { profileService } from "@/src/services/profileService";
import type { ProfileDto } from "@/src/types/profile";
import { Alert } from "@/src/components/ui/Alert";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";

interface ProfileInformationFormProps {
  profile: ProfileDto;
  onProfileChanged: (profile: ProfileDto) => Promise<void>;
}

interface InformationItemProps {
  label: string;
  value: string;
}

function InformationItem({ label, value }: InformationItemProps) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 dark:border-slate-800 dark:bg-slate-950/40">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-bold text-slate-800 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}

export function ProfileInformationForm({
  profile,
  onProfileChanged,
}: ProfileInformationFormProps) {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCancel = () => {
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setErrors({});
    setRequestError(null);
    setIsEditing(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestError(null);
    setSuccess(null);

    const validation = updateProfileSchema.safeParse({
      firstName,
      lastName,
    });

    if (!validation.success) {
      setErrors(getFormErrors(validation.error));
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      const updatedProfile = await profileService.updateProfile(
        validation.data,
      );
      setFirstName(updatedProfile.firstName);
      setLastName(updatedProfile.lastName);
      await onProfileChanged(updatedProfile);
      setSuccess("Personal information was updated.");
      setIsEditing(false);
    } catch (error: unknown) {
      setRequestError(
        getApiErrorMessage(error, "Failed to update personal information."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Personal Information
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Your account and organization details.
            </p>
          </div>
        </div>

        <span className="inline-flex w-fit rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
          {profile.role}
        </span>
      </div>

      <div className="p-5">
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InformationItem label="Full Name" value={profile.fullName} />
          <InformationItem label="Email" value={profile.email} />
          <InformationItem label="Role" value={profile.role} />
          <InformationItem
            label="Team"
            value={profile.teamName ?? "Not assigned"}
          />
          <InformationItem
            label="Department"
            value={profile.departmentName ?? "Not assigned"}
          />
        </dl>

        {(requestError || success) && !isEditing && (
          <div className="mt-4">
            <Alert variant={requestError ? "error" : "success"}>
              {requestError ?? success}
            </Alert>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Displayed name
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              Change the name shown across tickets and comments.
            </p>
          </div>
          <button
            aria-expanded={isEditing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-300 bg-indigo-50/70 px-3.5 py-2 text-xs font-bold text-indigo-700 shadow-sm transition-all hover:bg-indigo-600 hover:text-white dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-600 dark:hover:text-white"
            onClick={() => {
              setRequestError(null);
              setSuccess(null);
              setIsEditing((current) => !current);
            }}
            type="button"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit name
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${
                isEditing ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {isEditing && (
          <form
            className="animate-in fade-in slide-in-from-top-2 mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 duration-200 dark:border-slate-700 dark:bg-slate-950/40"
            onSubmit={(event) => void handleSubmit(event)}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Edit displayed name
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  This does not change your email or role.
                </p>
              </div>
              <button
                aria-label="Close name editor"
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:text-slate-900 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-600 dark:hover:text-white"
                disabled={saving}
                onClick={handleCancel}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                autoComplete="given-name"
                className="rounded-xl border-slate-200 bg-white text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-violet-500 dark:focus:ring-violet-500/20"
                error={errors.firstName}
                id="profile-first-name"
                label="First name"
                maxLength={100}
                onChange={(event) => {
                  setFirstName(event.target.value);
                  setErrors((current) => ({
                    ...current,
                    firstName: undefined,
                  }));
                }}
                value={firstName}
              />

              <Input
                autoComplete="family-name"
                className="rounded-xl border-slate-200 bg-white text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-violet-500 dark:focus:ring-violet-500/20"
                error={errors.lastName}
                id="profile-last-name"
                label="Last name"
                maxLength={100}
                onChange={(event) => {
                  setLastName(event.target.value);
                  setErrors((current) => ({
                    ...current,
                    lastName: undefined,
                  }));
                }}
                value={lastName}
              />
            </div>

            {requestError && (
              <div className="mt-4">
                <Alert variant="error">{requestError}</Alert>
              </div>
            )}

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                className="!rounded-xl !border-slate-300 !bg-white !font-bold !text-slate-700 shadow-sm dark:!border-violet-500/30 dark:!bg-violet-500/10 dark:!text-violet-300 dark:hover:!bg-violet-600 dark:hover:!text-white"
                disabled={saving}
                onClick={handleCancel}
                size="sm"
                type="button"
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                className="!rounded-xl !border-indigo-300 !bg-indigo-50/70 !font-bold !text-indigo-700 shadow-sm transition-all hover:!bg-indigo-600 hover:!text-white dark:!border-violet-500/40 dark:!bg-violet-500/10 dark:!text-violet-300 dark:hover:!bg-violet-600 dark:hover:!text-white"
                loading={saving}
                size="sm"
                type="submit"
              >
                <Save aria-hidden="true" className="h-4 w-4" />
                Save name
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
