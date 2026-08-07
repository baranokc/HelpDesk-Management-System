'use client';

import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Tag,
  AlignLeft,
  Layers,
  GitCommit,
  BarChart3,
  Zap,
  AlertCircle,
  UploadCloud,
  X,
  Send,
  Loader2,
  Paperclip,
  Save,
} from 'lucide-react';
import { api } from '@/src/lib/api';
import type { TicketCreateDto, TicketDetailDto, TicketUpdateDto } from '@/src/types/ticket';

interface LookupItem {
  id: string;
  name: string;
  categoryId?: string;
}

interface TicketFormProps {
  error?: string;
  loading: boolean;
  initialTicket?: TicketDetailDto | null;
  onSubmit: (dto: TicketCreateDto | TicketUpdateDto) => Promise<void>;
}

const PRIORITY_OPTIONS = [
  { id: "3a1d571f-732c-4618-b1e2-96f72544533d", name: "Critical" },
  { id: "2141d95a-7069-4167-92d6-780fa2f7232e", name: "High" },
  { id: "fa02063a-a289-43d7-a4c9-bfabd4b9c030", name: "Medium" },
  { id: "8faaaa7c-2f82-4f28-a2e0-05e73c3669f6", name: "Low" },
];

const URGENCY_OPTIONS = [
  { id: "8aef38f8-600d-4ff6-ba16-020048b7723c", name: "Low" },
  { id: "f3d500c9-a18c-4de2-b4c5-878e638271db", name: "Normal" },
  { id: "8fd27669-4526-4f30-b39a-6e100d73226d", name: "High" },
  { id: "5d814d17-667b-4dc2-8ebe-f0f40007bee5", name: "Urgent" },
];

export function TicketForm({ error, loading, initialTicket, onSubmit }: TicketFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(initialTicket);

  const [ticketTitle, setTicketTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [priorityId, setPriorityId] = useState('');
  const [impactLevelId, setImpactLevelId] = useState('');
  const [urgencyLevelId, setUrgencyLevelId] = useState('');

  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [subcategories, setSubcategories] = useState<LookupItem[]>([]);
  const [impactLevels, setImpactLevels] = useState<LookupItem[]>([]);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Initial Ticket Yükleme
  useEffect(() => {
    if (initialTicket) {
      setTicketTitle(initialTicket.ticketTitle || '');
      setSubject(initialTicket.subject || '');
      setDescription(initialTicket.ticketDescription || '');
      setCategoryId(initialTicket.categoryId || '');
      setSubcategoryId(initialTicket.subcategoryId || '');
      setPriorityId(initialTicket.priorityId || '');
      setImpactLevelId(initialTicket.impactLevelId || '');
      setUrgencyLevelId(initialTicket.urgencyLevelId || '');
    }
  }, [initialTicket]);

  // Lookup Verilerini Çekme
  useEffect(() => {
    async function loadLookups() {
      try {
        const [catRes, subRes, impactRes] = await Promise.allSettled([
          api.get<LookupItem[]>('/categories').catch(() => api.get<LookupItem[]>('/ticket-categories')),
          api.get<LookupItem[]>('/subcategories').catch(() => api.get<LookupItem[]>('/ticket-subcategories')),
          api.get<LookupItem[]>('/impact-levels').catch(() => api.get<LookupItem[]>('/impactlevels')),
        ]);

        if (catRes.status === 'fulfilled' && catRes.value?.data) {
          setCategories(catRes.value.data);
        }
        if (subRes.status === 'fulfilled' && subRes.value?.data) {
          setSubcategories(subRes.value.data);
        }
        if (impactRes.status === 'fulfilled' && impactRes.value?.data) {
          setImpactLevels(impactRes.value.data);
        }
      } catch (err) {
        console.error("Failed to fetch lookups", err);
      }
    }
    void loadLookups();
  }, []);

  const filteredSubcategories = categoryId
    ? subcategories.filter((sub) => sub.categoryId === categoryId)
    : subcategories;

  const handleFileDrop = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...newFiles].slice(0, 10));
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing) {
      const updateDto: TicketUpdateDto = {
        ticketTitle,
        subject,
        ticketDescription: description,
        categoryId,
        subcategoryId: subcategoryId || undefined,
        priorityId,
        impactLevelId: impactLevelId || priorityId,
        urgencyLevelId,
      };
      await onSubmit(updateDto);
    } else {
      const createDto: TicketCreateDto = {
        ticketTitle,
        subject,
        ticketDescription: description,
        categoryId,
        subcategoryId: subcategoryId || undefined,
        priorityId,
        impactLevelId: impactLevelId || priorityId,
        urgencyLevelId,
        attachments: selectedFiles,
      };
      await onSubmit(createDto);
    }
  };

  return (
    <form onSubmit={handleSubmitForm} className="space-y-6">
      {/* HATA MESAJI */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300 text-xs font-semibold animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* TİTLE & SUBJECT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-emerald-700 dark:text-purple-400" />
            <span>Ticket Title</span> <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Brief title of the issue..."
            value={ticketTitle}
            onChange={(e) => setTicketTitle(e.target.value)}
            className="w-full rounded-xl border border-stone-300/80 dark:border-purple-800/40 bg-stone-50/60 dark:bg-slate-950/60 px-3.5 py-2.5 text-xs font-medium text-stone-800 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:border-emerald-600 dark:focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:focus:ring-purple-500/20 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-teal-700 dark:text-indigo-400" />
            <span>Subject</span> <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Short summary or module..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-xl border border-stone-300/80 dark:border-purple-800/40 bg-stone-50/60 dark:bg-slate-950/60 px-3.5 py-2.5 text-xs font-medium text-stone-800 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:border-emerald-600 dark:focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:focus:ring-purple-500/20 transition-all"
          />
        </div>
      </div>

      {/* DETAILED EXPLANATION */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
            <AlignLeft className="h-3.5 w-3.5 text-emerald-700 dark:text-purple-400" />
            <span>Detailed Explanation</span> <span className="text-rose-500">*</span>
          </label>
          <span className="text-[10px] font-mono text-stone-400 dark:text-purple-300/50">
            {description.length} / 10000 characters
          </span>
        </div>
        <textarea
          required
          rows={5}
          maxLength={10000}
          placeholder="Please describe your issue in detail..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-stone-300/80 dark:border-purple-800/40 bg-stone-50/60 dark:bg-slate-950/60 p-3.5 text-xs font-medium text-stone-800 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:border-emerald-600 dark:focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:focus:ring-purple-500/20 transition-all resize-y min-h-[120px]"
        />
      </div>

      {/* CATEGORY - SUBCATEGORY - PRIORITY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-teal-700 dark:text-violet-400" />
            <span>Category</span> <span className="text-rose-500">*</span>
          </label>
          <select
            required
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setSubcategoryId('');
            }}
            className="w-full rounded-xl border border-stone-300/80 dark:border-purple-800/40 bg-stone-50/60 dark:bg-slate-950/60 px-3 py-2.5 text-xs font-medium text-stone-800 dark:text-slate-100 focus:border-emerald-600 dark:focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:focus:ring-purple-500/20 transition-all cursor-pointer"
          >
            <option value="" className="bg-white dark:bg-slate-900">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-white dark:bg-slate-900">
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
            <GitCommit className="h-3.5 w-3.5 text-teal-700 dark:text-indigo-400" />
            <span>Subcategory</span>
          </label>
          <select
            value={subcategoryId}
            onChange={(e) => setSubcategoryId(e.target.value)}
            disabled={!categoryId || filteredSubcategories.length === 0}
            className="w-full rounded-xl border border-stone-300/80 dark:border-purple-800/40 bg-stone-50/60 dark:bg-slate-950/60 px-3 py-2.5 text-xs font-medium text-stone-800 dark:text-slate-100 focus:border-emerald-600 dark:focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:focus:ring-purple-500/20 transition-all cursor-pointer disabled:opacity-40"
          >
            <option value="" className="bg-white dark:bg-slate-900">Select Subcategory</option>
            {filteredSubcategories.map((sub) => (
              <option key={sub.id} value={sub.id} className="bg-white dark:bg-slate-900">
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-emerald-700 dark:text-purple-400" />
            <span>Priority</span> <span className="text-rose-500">*</span>
          </label>
          <select
            required
            value={priorityId}
            onChange={(e) => setPriorityId(e.target.value)}
            className="w-full rounded-xl border border-stone-300/80 dark:border-purple-800/40 bg-stone-50/60 dark:bg-slate-950/60 px-3 py-2.5 text-xs font-medium text-stone-800 dark:text-slate-100 focus:border-emerald-600 dark:focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:focus:ring-purple-500/20 transition-all cursor-pointer"
          >
            <option value="" className="bg-white dark:bg-slate-900">Select Priority</option>
            {PRIORITY_OPTIONS.map((item) => (
              <option key={item.id} value={item.id} className="bg-white dark:bg-slate-900">
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* IMPACT LEVEL & URGENCY LEVEL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span>Impact Level</span> <span className="text-rose-500">*</span>
          </label>
          <select
            required
            value={impactLevelId}
            onChange={(e) => setImpactLevelId(e.target.value)}
            className="w-full rounded-xl border border-stone-300/80 dark:border-purple-800/40 bg-stone-50/60 dark:bg-slate-950/60 px-3 py-2.5 text-xs font-medium text-stone-800 dark:text-slate-100 focus:border-emerald-600 dark:focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:focus:ring-purple-500/20 transition-all cursor-pointer"
          >
            <option value="" className="bg-white dark:bg-slate-900">Select Impact</option>
            {impactLevels.length > 0
              ? impactLevels.map((item) => (
                  <option key={item.id} value={item.id} className="bg-white dark:bg-slate-900">
                    {item.name}
                  </option>
                ))
              : PRIORITY_OPTIONS.map((item) => (
                  <option key={item.id} value={item.id} className="bg-white dark:bg-slate-900">
                    {item.name}
                  </option>
                ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
            <span>Urgency Level</span> <span className="text-rose-500">*</span>
          </label>
          <select
            required
            value={urgencyLevelId}
            onChange={(e) => setUrgencyLevelId(e.target.value)}
            className="w-full rounded-xl border border-stone-300/80 dark:border-purple-800/40 bg-stone-50/60 dark:bg-slate-950/60 px-3 py-2.5 text-xs font-medium text-stone-800 dark:text-slate-100 focus:border-emerald-600 dark:focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:focus:ring-purple-500/20 transition-all cursor-pointer"
          >
            <option value="" className="bg-white dark:bg-slate-900">Select Urgency</option>
            {URGENCY_OPTIONS.map((item) => (
              <option key={item.id} value={item.id} className="bg-white dark:bg-slate-900">
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* DOSYA YÜKLEME ALANI */}
      {!isEditing && (
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
            <Paperclip className="h-3.5 w-3.5 text-emerald-700 dark:text-purple-400" />
            <span>Attachments</span>
          </label>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              handleFileDrop(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
              isDragOver
                ? 'border-emerald-600 bg-emerald-500/10 dark:border-purple-500 dark:bg-purple-500/10'
                : 'border-stone-300/80 dark:border-purple-900/40 bg-stone-50/40 dark:bg-slate-950/40 hover:border-emerald-600/50 dark:hover:border-purple-500/50 hover:bg-stone-100/60 dark:hover:bg-slate-900/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFileDrop(e.target.files)}
            />
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:bg-purple-500/15 dark:text-purple-300 mb-2">
              <UploadCloud className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold text-stone-800 dark:text-slate-200">
              Click to upload <span className="font-normal text-stone-400 dark:text-slate-400">or drag & drop</span>
            </p>
            <p className="text-[10px] font-medium text-stone-400 dark:text-slate-500 mt-0.5">
              Max 10 files (up to 10 MB each)
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700/80 text-xs font-medium text-stone-800 dark:text-slate-200 animate-in fade-in"
                >
                  <Paperclip className="h-3 w-3 text-emerald-700 dark:text-purple-400 shrink-0" />
                  <span className="truncate max-w-[150px] font-medium">{file.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors ml-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBMIT BUTTON */}
      <div className="flex items-center justify-end pt-4 border-t border-stone-200/80 dark:border-purple-900/30">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-purple-600 dark:to-indigo-600 hover:from-emerald-500 hover:to-teal-600 dark:hover:from-purple-500 dark:hover:to-indigo-500 shadow-lg shadow-emerald-700/20 dark:shadow-purple-600/25 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{isEditing ? 'Saving Changes...' : 'Creating...'}</span>
            </>
          ) : isEditing ? (
            <>
              <Save className="h-3.5 w-3.5" />
              <span>Save Changes</span>
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              <span>Create Ticket</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}