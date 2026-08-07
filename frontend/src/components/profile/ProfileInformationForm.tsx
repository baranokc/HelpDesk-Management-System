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
    <div className="min-w-0 rounded-2xl border border-stone-200/80 bg-stone-50/60 p-3.5 dark:border-purple-900/30 dark:bg-slate-950/40">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 font-mono">
        {label}
      </dt>
      <dd className="mt-1 truncate text-xs font-bold text-stone-800 dark:text-slate-100">
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
    <section className="overflow-hidden rounded-3xl border border-stone-200/80 bg-white/80 shadow-xl backdrop-blur-2xl dark:border-purple-900/40 dark:bg-slate-900/80">
      <div className="flex flex-col gap-4 border-b border-stone-100 px-6 py-4 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-600/20 bg-emerald-500/10 text-emerald-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300">
            <UserRound className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-stone-900 dark:text-white">
              Personal Information
            </h2>
            <p className="text-[11px] text-stone-500 dark:text-slate-400">
              Your account details and organization position.
            </p>
          </div>
        </div>

        <span className="inline-flex w-fit rounded-lg border border-emerald-600/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300">
          {profile.role}
        </span>
      </div>

      <div className="p-6">
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InformationItem label="Full Name" value={profile.fullName} />
          <InformationItem label="Email Address" value={profile.email} />
          <InformationItem label="System Role" value={profile.role} />
          <InformationItem
            label="Assigned Team"
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

        <div className="mt-5 flex flex-col gap-3 border-t border-stone-100 pt-5 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold text-stone-800 dark:text-slate-200">
              Displayed Name
            </p>
            <p className="mt-0.5 text-[11px] text-stone-500 dark:text-slate-400">
              Change the display name shown across tickets, assignments and logs.
            </p>
          </div>
          <button
            aria-expanded={isEditing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300/80 bg-stone-100 px-3.5 py-2 text-xs font-bold text-stone-800 shadow-sm transition-all hover:border-emerald-600/40 hover:bg-stone-200 dark:border-purple-900/40 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-purple-500/50 dark:hover:bg-slate-700"
            onClick={() => {
              setRequestError(null);
              setSuccess(null);
              setIsEditing((current) => !current);
            }}
            type="button"
          >
            <Pencil className="h-3.5 w-3.5 text-emerald-600 dark:text-purple-400" />
            <span>Edit Name</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${
                isEditing ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {isEditing && (
          <form
            className="animate-in fade-in slide-in-from-top-2 mt-4 rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4 duration-200 dark:border-purple-900/30 dark:bg-slate-950/40"
            onSubmit={(event) => void handleSubmit(event)}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-stone-900 dark:text-white">
                  Update Display Name
                </h3>
                <p className="mt-0.5 text-[10px] text-stone-500 dark:text-slate-400">
                  This change will not modify your account email or system privileges.
                </p>
              </div>
              <button
                aria-label="Close name editor"
                className="rounded-lg border border-stone-200 bg-white p-1 text-stone-500 hover:text-stone-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                disabled={saving}
                onClick={handleCancel}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="profile-first-name" className="text-xs font-semibold text-stone-700 dark:text-slate-300">
                  First Name
                </label>
                <input
                  id="profile-first-name"
                  autoComplete="given-name"
                  maxLength={100}
                  value={firstName}
                  onChange={(event) => {
                    setFirstName(event.target.value);
                    setErrors((current) => ({
                      ...current,
                      firstName: undefined,
                    }));
                  }}
                  className="w-full rounded-xl border border-stone-300/80 bg-white px-3.5 py-2 text-xs text-stone-800 shadow-inner focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-purple-900/40 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-purple-500 dark:focus:ring-purple-500/20 transition-all"
                />
                {errors.firstName && (
                  <p className="text-[10px] font-medium text-rose-500">{errors.firstName}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="profile-last-name" className="text-xs font-semibold text-stone-700 dark:text-slate-300">
                  Last Name
                </label>
                <input
                  id="profile-last-name"
                  autoComplete="family-name"
                  maxLength={100}
                  value={lastName}
                  onChange={(event) => {
                    setLastName(event.target.value);
                    setErrors((current) => ({
                      ...current,
                      lastName: undefined,
                    }));
                  }}
                  className="w-full rounded-xl border border-stone-300/80 bg-white px-3.5 py-2 text-xs text-stone-800 shadow-inner focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-purple-900/40 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-purple-500 dark:focus:ring-purple-500/20 transition-all"
                />
                {errors.lastName && (
                  <p className="text-[10px] font-medium text-rose-500">{errors.lastName}</p>
                )}
              </div>
            </div>

            {requestError && (
              <div className="mt-4">
                <Alert variant="error">{requestError}</Alert>
              </div>
            )}

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                className="!rounded-xl !border-stone-300 !bg-white !font-bold !text-stone-700 shadow-sm dark:!border-slate-700 dark:!bg-slate-900 dark:!text-slate-300 hover:!bg-stone-100 dark:hover:!bg-slate-800"
                disabled={saving}
                onClick={handleCancel}
                size="sm"
                type="button"
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                className="!inline-flex !items-center !gap-2 !px-4 !py-2 !rounded-xl !text-xs !font-bold !text-white !bg-gradient-to-r !from-emerald-600 !to-teal-700 dark:!from-purple-600 dark:!to-indigo-600 hover:!from-emerald-500 hover:!to-teal-600 dark:hover:!from-purple-500 dark:hover:!to-indigo-500 shadow-md shadow-emerald-700/20 dark:shadow-purple-600/30 transition-all"
                loading={saving}
                size="sm"
                type="submit"
              >
                <Save aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Save Name</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}