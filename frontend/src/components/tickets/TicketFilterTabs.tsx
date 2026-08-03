"use client";

import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { lookupService } from "@/src/services/lookupService";
import { LookupItemDto } from "@/src/types/common";
import { TicketFilterDto } from "@/src/types/ticket";
import { ticketFilterSchema } from "@/src/schemas/ticketSchemas";
import {
  FormErrors,
  getFormErrors,
} from "@/src/lib/validation";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";

interface TicketFiltersProps {
  value: TicketFilterDto;
  onApply: (filter: TicketFilterDto) => void;
}

export function TicketFilters({ value, onApply }: TicketFiltersProps) {
  const [form, setForm] = useState(value);
  const [validationErrors, setValidationErrors] = useState<FormErrors>({});
  const [statuses, setStatuses] = useState<LookupItemDto[]>([]);
  const [categories, setCategories] = useState<LookupItemDto[]>([]);
  const [urgencies, setUrgencies] = useState<LookupItemDto[]>([]);
  const [impacts, setImpacts] = useState<LookupItemDto[]>([]);

  useEffect(() => {
    Promise.all([
      lookupService.getStatuses(),
      lookupService.getCategories(),
      lookupService.getUrgencyLevels(),
      lookupService.getImpactLevels(),
    ])
      .then(([statusItems, categoryItems, urgencyItems, impactItems]) => {
        setStatuses(statusItems);
        setCategories(categoryItems);
        setUrgencies(urgencyItems);
        setImpacts(impactItems);
      })
      .catch(() => {
        setStatuses([]);
        setCategories([]);
        setUrgencies([]);
        setImpacts([]);
      });
  }, []);

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = ticketFilterSchema.safeParse({
      ...form,
      pageNumber: 1,
    });

    if (!result.success) {
      setValidationErrors(getFormErrors(result.error));
      return;
    }

    setValidationErrors({});
    onApply(result.data);
  };

  const reset = () => {
    const cleared: TicketFilterDto = { pageNumber: 1, pageSize: 25 };
    setValidationErrors({});
    setForm(cleared);
    onApply(cleared);
  };

  return (
    <form
      className="grid items-end gap-4 md:grid-cols-2 xl:grid-cols-4"
      onSubmit={submit}
    >
      <Input
        className="xl:col-span-2"
        error={validationErrors.search}
        label="Search"
        onChange={(event) => setForm({ ...form, search: event.target.value })}
        placeholder="Number or title"
        value={form.search ?? ""}
      />
      <Select
        error={validationErrors.statusId}
        label="Status"
        onChange={(event) => setForm({ ...form, statusId: event.target.value })}
        options={statuses.map((item) => ({
          value: item.itemId,
          label: item.name,
        }))}
        value={form.statusId ?? ""}
      />
      <Select
        error={validationErrors.urgencyLevelId}
        label="Urgency"
        onChange={(event) =>
          setForm({ ...form, urgencyLevelId: event.target.value })
        }
        options={urgencies.map((item) => ({
          value: item.itemId,
          label: item.name,
        }))}
        value={form.urgencyLevelId ?? ""}
      />
      <Select
        error={validationErrors.impactLevelId}
        label="Impact"
        onChange={(event) =>
          setForm({ ...form, impactLevelId: event.target.value })
        }
        options={impacts.map((item) => ({
          value: item.itemId,
          label: item.name,
        }))}
        value={form.impactLevelId ?? ""}
      />
      <Input
        error={validationErrors.createdFrom}
        label="Creation date"
        onChange={(event) =>
          setForm({ ...form, createdFrom: event.target.value || null })
        }
        type="date"
        value={form.createdFrom?.slice(0, 10) ?? ""}
      />
      <Input
        error={validationErrors.createdTo}
        label="End date"
        onChange={(event) =>
          setForm({ ...form, createdTo: event.target.value || null })
        }
        type="date"
        value={form.createdTo?.slice(0, 10) ?? ""}
      />
      <Select
        error={validationErrors.pageSize}
        label="Page Size"
        onChange={(event) =>
          setForm({ ...form, pageSize: Number(event.target.value) })
        }
        options={[
          { value: 10, label: "10 tickets" },
          { value: 25, label: "25 tickets" },
          { value: 50, label: "50 tickets" },
          { value: 100, label: "100 tickets" },
        ]}
        placeholder=""
        value={form.pageSize ?? 25}
      />
      <Select
        error={validationErrors.categoryId}
        label="Category"
        onChange={(event) =>
          setForm({ ...form, categoryId: event.target.value })
        }
        options={categories.map((item) => ({
          value: item.itemId,
          label: item.name,
        }))}
        value={form.categoryId ?? ""}
      />
      <Button type="submit">Filter</Button>
      <Button onClick={reset} type="button" variant="secondary"
      className="dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 hover:!bg-slate-900 hover:!text-white dark:hover:!bg-white dark:hover:!text-slate-900 transition-all shadow-sm">
        
        Clear
      </Button>
    </form>
  );
}
