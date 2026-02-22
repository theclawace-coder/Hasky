import { useState, useCallback, type PropsWithChildren } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { AppGuide } from '../guide/AppGuide';
import { HelpWiki } from '../wiki/HelpWiki';
import { useUiStore } from '../../store/uiStore';
import { cn } from '../../lib/utils';
import type { GuideStep } from '../guide/guideSteps';
import { PAGE_TOUR_MAP } from '../guide/pageGuides';

const easing = [0.25, 0.46, 0.45, 0.94] as const;

export function Layout({ children }: PropsWithChildren) {
  const { sidebarCollapsed } = useUiStore();
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideSteps, setGuideSteps] = useState<GuideStep[] | undefined>(undefined);
  const [wikiOpen, setWikiOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const launchTour = useCallback((steps?: GuideStep[], path?: string) => {
    setGuideSteps(steps);
    if (path && location.pathname !== path) {
      navigate(path);
    }
    setGuideOpen(true);
  }, [location.pathname, navigate]);

  // Derive tour steps for whichever top-level route is active
  const pageKey = `/${location.pathname.split('/').filter(Boolean)[0] ?? 'dashboard'}`;
  const currentPageTour = PAGE_TOUR_MAP[pageKey];

  return (
    <div className="relative min-h-screen">
      {/* ── Ambient background blobs ─────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="animate-blob absolute -right-48 -top-48 size-[700px] rounded-full opacity-[0.055]"
          style={{ background: 'radial-gradient(circle, #c084fc 0%, #818cf8 60%, transparent 100%)' }}
        />
        <div
          className="animate-blob-2 absolute -bottom-48 -left-48 size-[600px] rounded-full opacity-[0.055]"
          style={{ background: 'radial-gradient(circle, #38bdf8 0%, #818cf8 60%, transparent 100%)' }}
        />
        <div
          className="animate-blob-3 absolute left-1/2 top-1/2 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #FA93FA 0%, #6EE7FF 70%, transparent 100%)' }}
        />
      </div>

      <Sidebar onHelpClick={() => setWikiOpen(true)} />

      <div className={cn('transition-all duration-300 lg:pl-64', sidebarCollapsed && 'lg:pl-[72px]')}>
        <TopBar
          onTourClick={() => launchTour()}
          onWikiClick={() => setWikiOpen(true)}
          onPageTourClick={currentPageTour ? () => launchTour(currentPageTour) : undefined}
        />

        {/* ── Page transition wrapper ─────────────────────────── */}
        {/* pb-24 on mobile leaves room for the bottom nav */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location.pathname}
            className="p-4 pb-24 lg:pb-6 lg:p-6"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: easing }}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>

      <MobileBottomNav />
      <AppGuide
        open={guideOpen}
        onClose={() => { setGuideOpen(false); setGuideSteps(undefined); }}
        steps={guideSteps}
      />
      <HelpWiki
        open={wikiOpen}
        onClose={() => setWikiOpen(false)}
        onLaunchTour={(steps, path) => { setWikiOpen(false); launchTour(steps, path); }}
      />
    </div>
  );
}
