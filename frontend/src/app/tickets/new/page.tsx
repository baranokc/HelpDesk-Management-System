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
  
  const [categoryId, setCategoryId] = useState('57fb092e-2b77-46bb-9127-dccbde1dbbc2');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [priorityId, setPriorityId] = useState('e74a3695-a50d-4f0f-a065-8888e8679d46');
  const [impactLevelId, setImpactLevelId] = useState('7259dfa0-28a7-40b5-8b0d-ea62c7fd50be');
  const [urgencyLevelId, setUrgencyLevelId] = useState('bc7bd152-a444-4572-9ac0-0deab1c8dfbe');

  const [attachments, setAttachments] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_LENGTH = 300;
  const currentLength = ticketDescription.length;
  const isOverLimit = currentLength > MAX_LENGTH;

  const categories = [
    { id: '57fb092e-2b77-46bb-9127-dccbde1dbbc2', name: 'Access Request' },
    { id: 'bcdff679-d122-46ba-b991-f0d436e82a6f', name: 'Email / Account Access' },
    { id: '85d8b9c8-a137-4468-91ca-f175c057a21d', name: 'Hardware' },
    { id: '023be90d-33d1-4d08-bce2-e78c4b398c4f', name: 'Network / Internet' },
    { id: 'e20df498-1af3-4c35-89fb-407c109ee6b8', name: 'Other' },
    { id: '101d76d3-797c-4420-82e8-3b1bb79f809e', name: 'Printer / Peripheral' },
    { id: '1d1d178b-6d9b-4fb1-9dbe-2075ee17422b', name: 'Software' },
  ];

  const subcategories: Record<string, { id: string; name: string }[]> = {
    '57fb092e-2b77-46bb-9127-dccbde1dbbc2': [
        { id: "9fdf07ca-5dd4-4212-aa7b-530b088f03d1", name: "Application Access" },
        { id: "23210d21-79d6-4173-8c70-bcdf277f2b1d", name: "Folder Access" },
        { id: "170ea041-fc62-4a94-bf69-85c1568695f9", name: "New Account" },
        { id: "70bc272c-e99d-4cb8-a017-e56ff79ab44e", name: "Permission Change" }
      ],
    'bcdff679-d122-46ba-b991-f0d436e82a6f': [
        { id: "261d90c0-5631-4f19-98d3-9920d280bdb5", name: "Account Locked" },
        { id: "88adcd19-ade3-4888-bd45-f1929958c171", name: "Email Delivery" },
        { id: "70ec28eb-04f9-4d53-9343-b2911f74fad8", name: "Mailbox" },
        { id: "cbaee02d-1210-42b7-b115-d93625d822b9", name: "Multi-Factor Authentication" },
        { id: "5f02abbd-c625-4568-bcf0-e5fe0358b794", name: "Password Reset" }
      ],
      '85d8b9c8-a137-4468-91ca-f175c057a21d' : [
        { id: "9e45a60a-692d-42c4-bf7e-2332eeaa664f", name: "Desktop Computer" },
        { id: "fcf1b840-83f6-48c5-9eff-b760cdebd82f", name: "Keyboard / Mouse" },
        { id: "7087525c-84d0-4eb0-95b0-f96aefb59a05", name: "Laptop" },
        { id: "19ad29d5-a1c4-47ad-929c-9d479246bc5d", name: "Monitor" },
        { id: "7063c349-beb4-41e9-9582-027540620da8", name: "Storage" }
      ],
      '023be90d-33d1-4d08-bce2-e78c4b398c4f' : [
        { id: "c5286aa2-a369-4a57-8e42-8b8626ae11cc", name: "No Connection" },
        { id: "c4699ab1-f16d-42b0-9517-11c7f8efb519", name: "Shared Folder" },
        { id: "999c0487-ffa5-4279-bf16-be271312ac0f", name: "Slow Connection" },
        { id: "8674159b-9757-4766-a5fd-ff260e6f279f", name: "VPN" },
        { id: "eaf828ba-c4b8-4f67-b756-74f63de86f89", name: "Wi-Fi" }
      ],
      'e20df498-1af3-4c35-89fb-407c109ee6b8' : [
        { id: "d96e836b-f695-43c6-bcb4-7a1df0a47b7b", name: "General Support" },
        { id: "c492ce68-0f1d-4965-8383-15d258205153", name: "Information Request" }
      ],
      '101d76d3-797c-4420-82e8-3b1bb79f809e' : [
        { id: "e7f3468d-923b-4afe-89f4-597727bc5891", name: "Driver" },
        { id: "255c7b94-dd2b-4a5b-97bb-5ce43d21f32c", name: "Print Quality" },
        { id: "abef4684-8485-47d9-a081-9938b6a6fd6c", name: "Printer Offline" },
        { id: "13199e62-6ae5-4a5d-b002-89236916a842", name: "Scanner" }
      ],
      '1d1d178b-6d9b-4fb1-9dbe-2075ee17422b' : [
        { id: "4c79b344-785c-49d3-8a53-272db08daca2", name: "Application Error" },
        { id: "647915c4-2a3d-499d-91ec-32a281d566c5", name: "Installation" },
        { id: "3cf3b2a5-0e1d-4363-ac13-a05e57f638cc", name: "License" },
        { id: "7a8546d6-4a94-454a-aec0-03fecf11d5db", name: "Update" }
      ]
  };

  const priorities = [
    { id: "e74a3695-a50d-4f0f-a065-8888e8679d46", name: "Critical" },
    { id: "f7ee2fb7-c162-40e1-bc62-2f1497aeede1", name: "High" },
    { id: "bbc5a0d5-2ba8-44c3-9dc5-6df1e11e8aaa", name: "Medium" },
    { id: "50494020-da10-410f-8c2a-252ec47e92c2", name: "Low" }
  ];

  const impactLevels = [
    { id: "7259dfa0-28a7-40b5-8b0d-ea62c7fd50be", name: "Individual" },
    { id: "5692a361-6e24-4d74-b42d-743bb9b8ccaa", name: "Departmental" },
    { id: "13acbc28-6d82-4eb0-8df2-a5fc26fa86d8", name: "Multiple Departments" },
    { id: "117a34cf-ceec-40db-b751-9b24f33a5bad", name: "Organization-Wide" }
  ];

  const urgencyLevels = [
    { id: "bc7bd152-a444-4572-9ac0-0deab1c8dfbe", name: "Low" },
    { id: "24d24950-ad0c-4826-a917-c7ffef4486b0", name: "Normal" },
    { id: "9cf9c123-f4eb-4a5e-82de-76a272c17758", name: "High" },
    { id: "171bac41-f894-45b8-a032-241491dc0467", name: "Urgent" }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);


    if (isOverLimit) {
      return;
    }

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
      } catch (err: any) {
        console.error("İşlem sırasında hata oluştu:", err);
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

            {/* Ticket Description with English Character Counter */}
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
                className={`textarea textarea-bordered w-full bg-white text-slate-900 text-sm ${
                  isOverLimit ? 'textarea-error' : 'focus:textarea-primary'
                }`}
              ></textarea>
              
              {/* Character Counter & Warning */}
              <div className="flex justify-between items-center mt-1 text-xs">
                {isOverLimit ? (
                  <span className="text-error font-semibold">
                    ⚠️ Character limit exceeded ({currentLength}/{MAX_LENGTH})
                  </span>
                ) : (
                  <span className="text-slate-400">
                    Characters remaining: {MAX_LENGTH - currentLength}
                  </span>
                )}
              </div>
            </div>

            {/* 📎 File Attachments */}
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
                disabled={isOverLimit}
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