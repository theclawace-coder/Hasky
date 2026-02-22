import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Search, ChevronDown, Play } from 'lucide-react';
import { cn } from '../../lib/utils';
import { WIKI_ARTICLES, type WikiArticle } from './wikiContent';
import type { GuideStep } from '../guide/guideSteps';

interface HelpWikiProps {
  open: boolean;
  onClose: () => void;
  onLaunchTour: (steps?: GuideStep[], path?: string) => void;
}

// ─── Internal sub-components ────────────────────────────────────────────────

function ArticleView({
  article,
  openAccordions,
  onToggle,
  onLaunchTour,
}: {
  article: WikiArticle;
  openAccordions: Set<string>;
  onToggle: (id: string) => void;
  onLaunchTour: (steps?: GuideStep[], path?: string) => void;
}) {
  return (
    <div className="max-w-2xl space-y-6 animate-fade-in-up">
      {/* Article header */}
      <div>
        <div className="flex items-center gap-3 mb-1.5">
          <span className="text-3xl leading-none">{article.emoji}</span>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">{article.title}</h3>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">{article.description}</p>
      </div>

      {/* Capabilities */}
      <div>
        <h4 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
          What you can do
        </h4>
        <ul className="space-y-2">
          {article.capabilities.map((cap, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
              <span
                className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #818cf8, #38bdf8)' }}
              >
                ✓
              </span>
              {cap}
            </li>
          ))}
        </ul>
      </div>

      {/* Step-by-step accordions */}
      <div>
        <h4 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
          Step by step
        </h4>
        <div className="space-y-2">
          {article.steps.map((step, i) => {
            const isOpen = openAccordions.has(step.id);
            return (
              <div
                key={step.id}
                className="overflow-hidden rounded-xl border border-white/50 bg-white/50 backdrop-blur-sm"
              >
                <button
                  onClick={() => onToggle(step.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/70"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #c084fc, #818cf8)' }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">{step.question}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'size-4 shrink-0 text-slate-400 transition-transform duration-200',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="border-t border-white/50 px-4 py-3">
                        <p className="text-sm leading-relaxed text-slate-600">{step.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pro tips callout */}
      {article.tips.length > 0 && (
        <div
          className="rounded-xl border border-amber-200/60 p-4"
          style={{ background: 'rgba(254,243,199,0.55)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base leading-none">💡</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700">
              Pro Tips
            </span>
          </div>
          <ul className="space-y-1.5">
            {article.tips.map((tip, i) => (
              <li key={i} className="text-sm text-amber-900 leading-relaxed">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Launch tour CTA — shown on every article */}
      <div
        className="flex flex-col gap-3 rounded-xl border border-violet-200/60 p-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ background: 'rgba(245,243,255,0.65)' }}
      >
        <div>
          <p className="text-sm font-semibold text-violet-900">
            {article.tourSteps ? `Take the ${article.label} tour` : 'Prefer a visual walkthrough?'}
          </p>
          <p className="mt-0.5 text-xs text-violet-600">
            {article.tourPath
              ? `Navigates to ${article.tourPath} and runs a ${article.tourSteps?.length ?? 0}-step guided tour.`
              : 'The interactive tour highlights every feature directly on screen.'}
          </p>
        </div>
        <button
          onClick={() => onLaunchTour(article.tourSteps, article.tourPath)}
          className={cn(
            'flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white',
            'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600',
            'shadow-lg shadow-violet-500/25 transition-all hover:brightness-110 hover:shadow-violet-500/40',
          )}
        >
          <Play className="size-3.5" />
          {article.tourSteps ? 'Launch Tour' : 'Full App Tour'}
        </button>
      </div>
    </div>
  );
}

function SearchResults({
  results,
  query,
}: {
  results: Array<{ article: WikiArticle; matches: string[] }>;
  query: string;
}) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in-up">
        <span className="mb-3 text-4xl">🔍</span>
        <p className="text-sm font-semibold text-slate-700">No results for &ldquo;{query}&rdquo;</p>
        <p className="mt-1 text-xs text-slate-400">
          Try a different word, or browse a category on the left.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <p className="text-xs font-medium text-slate-400">
        {results.length} {results.length === 1 ? 'section' : 'sections'} matched &ldquo;{query}&rdquo;
      </p>
      {results.map(({ article, matches }) => (
        <div key={article.id}>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-lg leading-none">{article.emoji}</span>
            <span className="text-sm font-bold text-slate-800">{article.label}</span>
          </div>
          <ul className="space-y-1.5 pl-8">
            {matches
              .filter((m) => m !== 'title')
              .slice(0, 4)
              .map((match, i) => (
                <li key={i} className="text-sm text-slate-600 leading-relaxed">
                  — {match}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ─── Main HelpWiki component ────────────────────────────────────────────────

export function HelpWiki({ open, onClose, onLaunchTour }: HelpWikiProps) {
  const [activeId, setActiveId] = useState('getting-started');
  const [search, setSearch] = useState('');
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set(['gs-0']));
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  // Portal setup (mirrors Modal.tsx)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    let root = document.getElementById('modal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'modal-root';
      document.body.appendChild(root);
    }
    setPortalRoot(root);
  }, []);

  // Escape key (mirrors Modal.tsx)
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Body scroll lock (mirrors Modal.tsx)
  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const orig = document.body.style.overflow;
    const origPR = document.body.style.paddingRight;
    const sw = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (sw > 0) document.body.style.paddingRight = `${sw}px`;
    return () => {
      document.body.style.overflow = orig;
      document.body.style.paddingRight = origPR;
    };
  }, [open]);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setSearch('');
      setActiveId('getting-started');
      setOpenAccordions(new Set(['gs-0']));
    }
  }, [open]);

  // Reset accordions when category changes (first item open by default)
  useEffect(() => {
    const article = WIKI_ARTICLES.find((a) => a.id === activeId);
    if (article?.steps[0]) {
      setOpenAccordions(new Set([article.steps[0].id]));
    }
  }, [activeId]);

  const toggleAccordion = (id: string) => {
    setOpenAccordions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Search logic
  const trimmedSearch = search.trim().toLowerCase();
  const isSearching = trimmedSearch.length >= 2;

  const searchResults: Array<{ article: WikiArticle; matches: string[] }> = isSearching
    ? WIKI_ARTICLES.map((article) => {
        const matches: string[] = [];
        if (article.title.toLowerCase().includes(trimmedSearch)) matches.push('title');
        article.capabilities.forEach((c) => {
          if (c.toLowerCase().includes(trimmedSearch)) matches.push(c);
        });
        article.steps.forEach((s) => {
          if (
            s.question.toLowerCase().includes(trimmedSearch) ||
            s.answer.toLowerCase().includes(trimmedSearch)
          ) {
            matches.push(s.question);
          }
        });
        article.tips.forEach((t) => {
          if (t.toLowerCase().includes(trimmedSearch)) matches.push(t);
        });
        return { article, matches };
      }).filter((r) => r.matches.length > 0)
    : [];

  const activeArticle = WIKI_ARTICLES.find((a) => a.id === activeId) ?? WIKI_ARTICLES[0];

  if (!portalRoot) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="HireHub Help Center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40"
            style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="relative flex w-full flex-col overflow-hidden rounded-3xl glass"
            style={{
              maxWidth: '1100px',
              height: 'min(88vh, 780px)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.18), 0 8px 32px rgba(0,0,0,0.10)',
            }}
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            transition={{ duration: 0.24, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient accent line */}
            <div
              className="h-[3px] w-full shrink-0"
              style={{ background: 'linear-gradient(90deg, #c084fc 0%, #818cf8 50%, #38bdf8 100%)' }}
            />

            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/30 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className="text-2xl leading-none">📖</span>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-900">
                    HireHub Help Center
                  </h2>
                  <p className="text-[11px] text-slate-400">Browse guides or search for answers</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-white/60 hover:text-slate-600 hover:shadow-sm"
                aria-label="Close help wiki"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body: two-column */}
            <div className="flex min-h-0 flex-1 overflow-hidden">
              {/* Left column: category list */}
              <aside className="w-12 shrink-0 overflow-y-auto border-r border-white/30 py-3 px-1.5 lg:w-[220px] lg:px-2">
                {WIKI_ARTICLES.map((article) => {
                  const isActive = article.id === activeId && !isSearching;
                  return (
                    <button
                      key={article.id}
                      onClick={() => {
                        setActiveId(article.id);
                        setSearch('');
                      }}
                      title={article.label}
                      className={cn(
                        'group flex w-full items-center gap-2.5 rounded-xl px-2 py-2.5 text-left text-sm font-medium transition-all duration-150 lg:px-3',
                        isActive
                          ? 'bg-violet-500/15 text-violet-800 shadow-sm'
                          : 'text-slate-600 hover:bg-white/60 hover:text-slate-900',
                      )}
                    >
                      <span className="shrink-0 text-base leading-none">{article.emoji}</span>
                      <span className="hidden leading-snug lg:block">{article.label}</span>
                    </button>
                  );
                })}
              </aside>

              {/* Right column: content */}
              <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                {/* Search bar */}
                <div className="shrink-0 border-b border-white/30 px-5 py-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search all help articles…"
                      className={cn(
                        'h-9 w-full rounded-xl pl-9 pr-8 text-sm text-slate-900 outline-none',
                        'border border-white/55 bg-white/65 backdrop-blur-md',
                        'placeholder:text-slate-400',
                        'transition-all duration-200',
                        'focus:border-violet-300 focus:bg-white/80 focus:shadow-md focus:shadow-violet-100',
                        'focus:ring-2 focus:ring-violet-200/50',
                      )}
                    />
                    {search && (
                      <button
                        onClick={() => setSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                        aria-label="Clear search"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Article content area */}
                <div className="flex-1 overflow-y-auto px-5 py-5">
                  {isSearching ? (
                    <SearchResults results={searchResults} query={trimmedSearch} />
                  ) : (
                    <ArticleView
                      article={activeArticle}
                      openAccordions={openAccordions}
                      onToggle={toggleAccordion}
                      onLaunchTour={onLaunchTour}
                    />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalRoot,
  );
}
