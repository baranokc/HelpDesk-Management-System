"use client";

import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { lookupService } from "@/src/services/lookupService";
import { LookupItemDto } from "@/src/types/common";
import {
  TicketCreateDto,
  TicketDetailDto,
  TicketUpdateDto,
} from "@/src/types/ticket";
import {
  ticketCreateSchema,
  ticketUpdateSchema,
} from "@/src/schemas/ticketSchemas";
import {
  FormErrors,
  getFormErrors,
} from "@/src/lib/validation";
import { Alert } from "@/src/components/ui/Alert";
import { Button } from "@/src/components/ui/Button";
import { FileInput } from "@/src/components/ui/FileInput";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { Textarea } from "@/src/components/ui/Textarea";

type FormState = TicketCreateDto;

interface TicketFormProps {
  initialTicket?: TicketDetailDto;
  loading?: boolean;
  error?: string;
  onSubmit: (dto: TicketCreateDto | TicketUpdateDto) => Promise<void>;
}

const emptyForm: FormState = {
  ticketTitle: "",
  ticketDescription: "",
  subject: "",
  categoryId: "",
  subcategoryId: null,
  priorityId: "",
  impactLevelId: "",
  urgencyLevelId: "",
  attachments: [],
};

export function TicketForm({
  initialTicket,
  loading = false,
  error,
  onSubmit,
}: TicketFormProps) {
  const [form, setForm] = useState<FormState>(() =>
    initialTicket
      ? {
          ticketTitle: initialTicket.ticketTitle,
          ticketDescription: initialTicket.ticketDescription,
          subject: initialTicket.subject,
          categoryId: initialTicket.categoryId,
          subcategoryId: initialTicket.subcategoryId,
          priorityId: initialTicket.priorityId,
          impactLevelId: initialTicket.impactLevelId,
          urgencyLevelId: initialTicket.urgencyLevelId,
          attachments: [],
        }
      : emptyForm,
  );
  const [validationErrors, setValidationErrors] = useState<FormErrors>({});

  const [lookups, setLookups] = useState({
    categories: [] as LookupItemDto[],
    subcategories: [] as LookupItemDto[],
    priorities: [] as LookupItemDto[],
    impacts: [] as LookupItemDto[],
    urgencies: [] as LookupItemDto[],
  });

  useEffect(() => {
    Promise.all([
      lookupService.getCategories(),
      lookupService.getPriorities(),
      lookupService.getImpactLevels(),
      lookupService.getUrgencyLevels(),
    ]).then(([categories, priorities, impacts, urgencies]) =>
      setLookups((current) => ({
        ...current,
        categories,
        priorities,
        impacts,
        urgencies,
      })),
    );
  }, []);

  useEffect(() => {
    if (!form.categoryId) return;
    lookupService
      .getSubcategories(form.categoryId)
      .then((subcategories) =>
        setLookups((current) => ({ ...current, subcategories })),
      );
  }, [form.categoryId]);

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const candidate = initialTicket
      ? {
          ticketTitle: form.ticketTitle,
          ticketDescription: form.ticketDescription,
          subject: form.subject,
          categoryId: form.categoryId,
          subcategoryId: form.subcategoryId,
          priorityId: form.priorityId,
          impactLevelId: form.impactLevelId,
          urgencyLevelId: form.urgencyLevelId,
        }
      : form;

    const result = initialTicket
      ? ticketUpdateSchema.safeParse(candidate)
      : ticketCreateSchema.safeParse(candidate);

    if (!result.success) {
      setValidationErrors(getFormErrors(result.error));
      return;
    }

    setValidationErrors({});
    await onSubmit(result.data);
  };

  const optionList = (items: LookupItemDto[]) =>
    items.map((item) => ({ value: item.itemId, label: item.name }));

  return (
    <form className="space-y-5" onSubmit={submit}>
      {error && <Alert variant="error">{error}</Alert>}
      {validationErrors._form && (
        <Alert variant="error">{validationErrors._form}</Alert>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        <Input
          error={validationErrors.ticketTitle}
          label="Ticket title"
          maxLength={50}
          minLength={5}
          onChange={(event) =>
            setForm({ ...form, ticketTitle: event.target.value })
          }
          required
          value={form.ticketTitle}
        />
        <Input
          error={validationErrors.ticketDescription}
          label="Short description"
          maxLength={100}
          minLength={5}
          onChange={(event) =>
            setForm({ ...form, ticketDescription: event.target.value })
          }
          required
          value={form.ticketDescription}
        />
      </div>
      <Textarea
        error={validationErrors.subject}
        hint={`${form.subject.length}/10000 characters`}
        label="Detailed explanation"
        maxLength={10000}
        minLength={5}
        onChange={(event) => setForm({ ...form, subject: event.target.value })}
        required
        rows={7}
        value={form.subject}
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Select
          error={validationErrors.categoryId}
          label="Category"
          onChange={(event) => {
            setForm({
              ...form,
              categoryId: event.target.value,
              subcategoryId: null,
            });
            setLookups((current) => ({
              ...current,
              subcategories: [],
            }));
          }}
          options={optionList(lookups.categories)}
          required
          value={form.categoryId}
        />
        <Select
          disabled={!form.categoryId}
          error={validationErrors.subcategoryId}
          label="Subcategory"
          onChange={(event) =>
            setForm({ ...form, subcategoryId: event.target.value || null })
          }
          options={optionList(lookups.subcategories)}
          value={form.subcategoryId ?? ""}
        />
        <Select
          error={validationErrors.priorityId}
          label="Priority"
          onChange={(event) =>
            setForm({ ...form, priorityId: event.target.value })
          }
          options={optionList(lookups.priorities)}
          required
          value={form.priorityId}
        />
        <Select
          error={validationErrors.impactLevelId}
          label="Impact level"
          onChange={(event) =>
            setForm({ ...form, impactLevelId: event.target.value })
          }
          options={optionList(lookups.impacts)}
          required
          value={form.impactLevelId}
        />
        <Select
          error={validationErrors.urgencyLevelId}
          label="Urgency level"
          onChange={(event) =>
            setForm({ ...form, urgencyLevelId: event.target.value })
          }
          options={optionList(lookups.urgencies)}
          required
          value={form.urgencyLevelId}
        />
      </div>
      {!initialTicket && (
        <FileInput
          accept=".jpg,.jpeg,.png,.pdf,.txt,.docx,.xlsx,.zip,.rar,.7z"
          error={validationErrors.attachments}
          files={form.attachments}
          onChange={(attachments) => setForm({ ...form, attachments })}
        />
      )}
      <div className="flex justify-end">
        <Button loading={loading} type="submit">
          {initialTicket ? "Save changes" : "Create ticket"}
        </Button>
      </div>
    </form>
  );
}
