"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  HelpCircle,
  ArrowRight,
  SearchX,
  LifeBuoy,
} from "lucide-react";
import { faqService, type FaqItemDto } from "@/src/services/faqService";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";

// 🚀 SCROLL ANIMASYONLU FAQ KART BİLEŞENİ
function FaqRowItem({
  faq,
  index,
  isOpen,
  onToggle,
}: {
  faq: FaqItemDto;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = rowRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={rowRef}
      className={`border rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl overflow-hidden transition-all duration-500 ease-out shadow-sm ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-6 scale-[0.98]"
      } ${
        isOpen
          ? "border-emerald-600/50 dark:border-purple-500/50 ring-1 ring-emerald-600/20 dark:ring-purple-500/20"
          : "border-stone-200/80 dark:border-purple-900/30 hover:border-stone-300 dark:hover:border-purple-700/50"
      }`}
      style={{ transitionDelay: `${(index % 8) * 40}ms` }}
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-6 py-4.5 font-semibold text-stone-900 dark:text-white flex items-center justify-between gap-4 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span
            className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-colors ${
              isOpen
                ? "bg-emerald-500/15 text-emerald-800 dark:bg-purple-500/20 dark:text-purple-300 border-emerald-600/30 dark:border-purple-500/40"
                : "bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 border-stone-200 dark:border-slate-700"
            }`}
          >
            {faq.category}
          </span>
          <span className="text-xs sm:text-sm font-bold text-stone-800 dark:text-slate-100">
            {faq.question}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-stone-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-emerald-700 dark:text-purple-400" : ""
          }`}
        />
      </button>

      {/* Soru Açılış/Kapanış Akordeon Animasyonu */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-stone-600 dark:text-slate-300 border-t border-stone-100 dark:border-slate-800/80 leading-relaxed whitespace-pre-wrap font-medium">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FaqPage() {
  const [faqs, setFaqs] = useState<FaqItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    async function loadFaqs() {
      try {
        const data = await faqService.getActiveFaqs();
        setFaqs(data);
        if (data.length > 0) {
          setOpenId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load FAQs", err);
      } finally {
        setLoading(false);
      }
    }
    void loadFaqs();
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(faqs.map((f) => f.category)));
    return ["ALL", ...cats];
  }, [faqs]);

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesSearch =
        faq.question.toLowerCase().includes(search.toLowerCase()) ||
        faq.answer.toLowerCase().includes(search.toLowerCase());
      const matchesCat =
        selectedCategory === "ALL" || faq.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [faqs, search, selectedCategory]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Fetching Island Knowledge Base..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-10 relative">
      {/* Arka Plan Aura Efektleri */}
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-amber-500/10 dark:bg-purple-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-teal-500/10 dark:bg-indigo-600/15 blur-3xl pointer-events-none" />

      {/* Hero Header & Search Area */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 dark:bg-purple-500/20 border border-emerald-600/30 dark:border-purple-500/40 text-emerald-800 dark:text-purple-300 text-xs font-bold">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Help & Knowledge Base</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-amber-800 via-emerald-800 to-teal-900 dark:from-purple-300 dark:via-violet-200 dark:to-indigo-200 bg-clip-text text-transparent">
          How can we help you today?
        </h1>
        <p className="text-stone-500 dark:text-slate-400 text-xs sm:text-sm max-w-xl mx-auto font-medium">
          Search our Island Knowledge Base or browse categories below to find quick solutions to common issues.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto pt-2">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none pt-2 text-stone-400 dark:text-purple-300/50">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search for answers (e.g. password, VPN, ticket status)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-16 py-3.5 bg-white/80 dark:bg-slate-900/80 border border-stone-300/80 dark:border-purple-800/40 rounded-2xl text-xs font-medium shadow-lg placeholder:text-stone-400 dark:placeholder:text-slate-500 text-stone-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:focus:ring-purple-500/20 focus:border-emerald-600 dark:focus:border-purple-500 backdrop-blur-xl transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-400 dark:text-slate-400 hover:text-stone-700 dark:hover:text-white text-xs font-bold pt-2 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills - KAYARAK GEÇEN ANIMASYONLU SEKMELER */}
      {categories.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl border border-stone-300/60 dark:border-purple-900/40 bg-stone-200/60 dark:bg-slate-900/80 backdrop-blur-xl max-w-fit mx-auto shadow-inner relative">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            const count =
              cat === "ALL"
                ? faqs.length
                : faqs.filter((f) => f.category === cat).length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-colors duration-200 flex items-center gap-2 z-10 ${
                  isActive
                    ? "text-white"
                    : "text-stone-700 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeFaqCategory"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-purple-600 dark:to-indigo-600 shadow-md shadow-emerald-700/20 dark:shadow-purple-600/30 z-[-1]"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}
                <span>{cat === "ALL" ? "All Questions" : cat}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-extrabold transition-colors ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-stone-300/60 dark:bg-slate-800 text-stone-600 dark:text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Accordion List */}
      {filteredFaqs.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-stone-200/80 dark:border-purple-900/40 backdrop-blur-2xl space-y-3 shadow-xl">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 dark:bg-purple-500/15 border border-amber-600/20 dark:border-purple-500/30 text-amber-700 dark:text-purple-300 mb-1">
            <SearchX className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-white">
            No matching questions found
          </h3>
          <p className="text-xs font-medium text-stone-500 dark:text-slate-400 max-w-sm mx-auto">
            Try adjusting your search terms or select a different category to find what you are looking for.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openId === faq.id;
            return (
              <FaqRowItem
                key={faq.id}
                faq={faq}
                index={index}
                isOpen={isOpen}
                onToggle={() => setOpenId(isOpen ? null : faq.id)}
              />
            );
          })}
        </div>
      )}

      {/* Support CTA Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-50/60 via-stone-100/80 to-amber-50/60 dark:from-slate-900/90 dark:via-purple-950/30 dark:to-slate-900/90 border border-stone-200/80 dark:border-purple-900/40 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl backdrop-blur-2xl">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hidden sm:block border border-stone-200/80 dark:border-purple-800/40">
            <LifeBuoy className="h-6 w-6 text-emerald-700 dark:text-purple-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-stone-900 dark:text-white">
              Still need help?
            </h3>
            <p className="text-xs text-stone-500 dark:text-slate-400 max-w-md font-medium">
              Can't find the answer you are looking for? Submit a ticket and our Archipelago support team will get back to you shortly.
            </p>
          </div>
        </div>
        <Link
          href="/tickets/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-purple-600 dark:to-indigo-600 hover:from-emerald-500 hover:to-teal-600 dark:hover:from-purple-500 dark:hover:to-indigo-500 shadow-lg shadow-emerald-700/20 dark:shadow-purple-600/25 active:scale-95 transition-all shrink-0"
        >
          <span>Create Support Ticket</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}