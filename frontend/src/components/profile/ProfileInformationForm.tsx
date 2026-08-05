"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { getApiErrorMessage } from "@/src/lib/api";
import { getFormErrors, type FormErrors } from "@/src/lib/validation";
import { updateProfileSchema } from "@/src/schemas/profileSchemas";
import { profileService } from "@/src/services/profileService";
import type { ProfileDto } from "@/src/types/profile";
import { Alert } from "@/src/components/ui/Alert";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";

interface ProfileInformationFormProps {
  profile: ProfileDto;
  onProfileChanged: (profile: ProfileDto) => Promise<void>;
}

export function ProfileInformationForm({
  profile,
  onProfileChanged,
}: ProfileInformationFormProps) {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      const updatedProfile = await profileService.updateProfile(validation.data);
      setFirstName(updatedProfile.firstName);
      setLastName(updatedProfile.lastName);
      await onProfileChanged(updatedProfile);
      setSuccess("Personal information was updated.");
    } catch (error: unknown) {
      setRequestError(
        getApiErrorMessage(
          error,
          "Failed to update personal information.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      description="Update the name displayed throughout the help desk."
      title="Personal information"
    >
      <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            autoComplete="given-name"
            error={errors.firstName}
            id="profile-first-name"
            label="First name"
            maxLength={100}
            onChange={(event) => {
              setFirstName(event.target.value);
              setErrors((current) => ({ ...current, firstName: undefined }));
            }}
            value={firstName}
          />

          <Input
            autoComplete="family-name"
            error={errors.lastName}
            id="profile-last-name"
            label="Last name"
            maxLength={100}
            onChange={(event) => {
              setLastName(event.target.value);
              setErrors((current) => ({ ...current, lastName: undefined }));
            }}
            value={lastName}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            disabled
            id="profile-email"
            label="Email"
            value={profile.email}
          />
          <Input
            disabled
            id="profile-role"
            label="Role"
            value={profile.role}
          />
          <Input
            disabled
            id="profile-team"
            label="Team"
            value={profile.teamName ?? "Not assigned"}
          />
          <Input
            disabled
            id="profile-department"
            label="Department"
            value={profile.departmentName ?? "Not assigned"}
          />
        </div>

        {(requestError || success) && (
          <Alert variant={requestError ? "error" : "success"}>
            {requestError ?? success}
          </Alert>
        )}

        <div className="flex justify-end">
          <Button loading={saving} type="submit">
            <Save aria-hidden="true" className="h-4 w-4" />
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
}
