'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Button,
  LinkButton,
} from '@/src/components/ui/Button';
import { ticketService } from '@/src/services/ticketService';

export default function CreateTicketPage() {
  const router = useRouter();

  const [ticketTitle, setTicketTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  
  const [categoryId, setCategoryId] = useState('11111111-1111-1111-1111-111111111111');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [priorityId, setPriorityId] = useState('22222222-2222-2222-2222-222222222222');
  const [impactLevelId, setImpactLevelId] = useState('33333333-3333-3333-3333-333333333333');
  const [urgencyLevelId, setUrgencyLevelId] = useState('44444444-4444-4444-4444-444444444444');

  const [attachments, setAttachments] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Hardware' },
    { id: '11111111-1111-1111-1111-222222222222', name: 'Software' },
    { id: '11111111-1111-1111-1111-333333333333', name: 'Network & Connectivity' },
  ];

  const subcategories: Record<string, { id: string; name: string }[]> = {
    '11111111-1111-1111-1111-111111111111': [
      { id: 'a1111111-1111-1111-1111-111111111111', name: 'Laptop / PC Issue' },
      { id: 'a1111111-1111-1111-1111-222222222222', name: 'Monitor / Display' },
    ],
    '11111111-1111-1111-1111-222222222222': [
      { id: 'b1111111-1111-1111-1111-111111111111', name: 'OS / Windows Bug' },
      { id: 'b1111111-1111-1111-1111-222222222222', name: 'License Request' },
    ],
  };

  const priorities = [
    { id: '22222222-2222-2222-2222-111111111111', name: 'Low' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Medium' },
    { id: '22222222-2222-2222-2222-333333333333', name: 'High' },
    { id: '22222222-2222-2222-2222-444444444444', name: 'Critical' },
  ];

  const impactLevels = [
    { id: '33333333-3333-3333-3333-111111111111', name: 'Individual' },
    { id: '33333333-3333-3333-3333-222222222222', name: 'Department' },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Entire Company' },
  ];

  const urgencyLevels = [
    { id: '44444444-4444-4444-4444-111111111111', name: 'Low' },
    { id: '44444444-4444-4444-4444-222222222222', name: 'Medium' },
    { id: '44444444-4444-4444-4444-333333333333', name: 'High' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    let isValid = true;

    Array.from(form.elements).forEach((element) => {
      const input = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (input.hasAttribute('required') && !input.value.trim()) {
        input.setCustomValidity('Please fill out this field.');
        isValid = false;
      } else {
        input.setCustomValidity('');
      }
    });

    if (!isValid) {
      form.reportValidity();
      return;
    }

    setLoading(true);

    try {
      await ticketService.create({
        ticketTitle,
        subject,
        ticketDescription,
        categoryId,
        subcategoryId: subcategoryId || undefined,
        priorityId,
        impactLevelId,
        urgencyLevelId,
        attachments,
      });

      router.push('/tickets');
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create ticket. Please check your information.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create New Ticket</h1>
          <p className="text-sm text-slate-600">Submit a new support request to our team</p>
        </div>
        <Link href="/tickets" className="link link-primary text-sm font-medium no-underline hover:underline">
          ← Back to Tickets
        </Link>
      </div>

      <div className="card bg-white shadow-lg border border-slate-200">
        <div className="card-body">
          {error && (
            <div className="alert alert-error text-sm text-white mb-4 shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Ticket Title & Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-slate-700">Ticket Title</span>
                </label>
                <input
                  type="text"
                  required
                  value={ticketTitle}
                  onChange={(e) => {
                    setTicketTitle(e.target.value);
                    e.target.setCustomValidity('');
                  }}
                  placeholder="e.g. Cannot connect to Wi-Fi"
                  className="input input-bordered w-full bg-white text-slate-900 focus:input-primary text-sm"
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-slate-700">Subject</span>
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    e.target.setCustomValidity('');
                  }}
                  placeholder="e.g. Network Connection Issue"
                  className="input input-bordered w-full bg-white text-slate-900 focus:input-primary text-sm"
                />
              </div>
            </div>

            {/* Category & Subcategory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-slate-700">Category</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setSubcategoryId('');
                  }}
                  className="select select-bordered w-full bg-white text-slate-900 focus:select-primary text-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-slate-700">Subcategory (Optional)</span>
                </label>
                <select
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  className="select select-bordered w-full bg-white text-slate-900 focus:select-primary text-sm"
                >
                  <option value="">Select subcategory...</option>
                  {subcategories[categoryId]?.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority, Impact Level & Urgency Level */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-slate-700">Priority</span>
                </label>
                <select
                  value={priorityId}
                  onChange={(e) => setPriorityId(e.target.value)}
                  className="select select-bordered w-full bg-white text-slate-900 focus:select-primary text-sm"
                >
                  {priorities.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-slate-700">Impact Level</span>
                </label>
                <select
                  value={impactLevelId}
                  onChange={(e) => setImpactLevelId(e.target.value)}
                  className="select select-bordered w-full bg-white text-slate-900 focus:select-primary text-sm"
                >
                  {impactLevels.map((imp) => (
                    <option key={imp.id} value={imp.id}>
                      {imp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-slate-700">Urgency Level</span>
                </label>
                <select
                  value={urgencyLevelId}
                  onChange={(e) => setUrgencyLevelId(e.target.value)}
                  className="select select-bordered w-full bg-white text-slate-900 focus:select-primary text-sm"
                >
                  {urgencyLevels.map((urg) => (
                    <option key={urg.id} value={urg.id}>
                      {urg.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ticket Description */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium text-slate-700">Detailed Description</span>
              </label>
              <textarea
                required
                rows={4}
                value={ticketDescription}
                onChange={(e) => {
                  setTicketDescription(e.target.value);
                  e.target.setCustomValidity('');
                }}
                placeholder="Describe your issue in detail so we can help you faster..."
                className="textarea textarea-bordered w-full bg-white text-slate-900 focus:textarea-primary text-sm"
              ></textarea>
            </div>

            {/* 📎 File Attachments (DaisyUI File Input) */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium text-slate-700">Attachments (Optional)</span>
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="file-input file-input-bordered file-input-primary w-full bg-white text-slate-900 text-sm"
              />
              {attachments.length > 0 && (
                <div className="mt-2 text-xs text-slate-500">
                  {attachments.length} file(s) selected: {attachments.map((f) => f.name).join(', ')}
                </div>
              )}
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <LinkButton
                href="/tickets"
                variant="secondary"
                className="font-normal"
              >
                Cancel
              </LinkButton>

              <Button
                type="submit"
                loading={loading}
              >
                {loading ? 'Submitting...' : 'Submit Ticket'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
