import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { GUIDE_STEPS, type GuideStep } from './guideSteps';
import { cn } from '../../lib/utils';

interface AppGuideProps {
  open: boolean;
  onClose: () => void;
  steps?: GuideStep[];
}

interface TooltipPosition {
  top: number;
  left: number;
  transformX: string;
  transformY: string;
  arrowSide?: 'top' | 'bottom' | 'left' | 'right';
}

const TOOLTIP_GAP = 16;

function getTooltipPosition(
  targetEl: Element | null,
  position: GuideStep['position'],
  tooltipW = 360,
  tooltipH = 240,
): TooltipPosition {
  if (!targetEl || position === 'center') {
    return {
      top: window.innerHeight / 2,
      left: window.innerWidth / 2,
      transformX: '-50%',
      transformY: '-50%',
    };
  }

  const rect = targetEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (position === 'right') {
    const top = Math.min(Math.max(rect.top + rect.height / 2, tooltipH / 2 + 8), vh - tooltipH / 2 - 8);
    const left = Math.min(rect.right + TOOLTIP_GAP, vw - tooltipW - 8);
    return { top, left, transformX: '0', transformY: '-50%', arrowSide: 'left' };
  }

  if (position === 'left') {
    const top = Math.min(Math.max(rect.top + rect.height / 2, tooltipH / 2 + 8), vh - tooltipH / 2 - 8);
    const left = Math.max(rect.left - TOOLTIP_GAP - tooltipW, 8);
    return { top, left, transformX: '0', transformY: '-50%', arrowSide: 'right' };
  }

  if (position === 'top') {
    const top = Math.max(rect.top - TOOLTIP_GAP - tooltipH, 8);
    const left = Math.min(Math.max(rect.left + rect.width / 2, tooltipW / 2 + 8), vw - tooltipW / 2 - 8);
    return { top, left, transformX: '-50%', transformY: '0', arrowSide: 'bottom' };
  }

  // bottom (default)
  const top = Math.min(rect.bottom + TOOLTIP_GAP, vh - tooltipH - 8);
  const left = Math.min(Math.max(rect.left + rect.width / 2, tooltipW / 2 + 8), vw - tooltipW / 2 - 8);
  return { top, left, transformX: '-50%', transformY: '0', arrowSide: 'top' };
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function AppGuide({ open, onClose, steps: stepsProp }: AppGuideProps) {
  const activeSteps = stepsProp ?? GUIDE_STEPS;
  const [step, setStep] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>({
    top: 0,
    left: 0,
    transformX: '-50%',
    transformY: '-50%',
  });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = activeSteps[step];
  const isFirst = step === 0;
  const isLast = step === activeSteps.length - 1;

  const updatePositions = useCallback(() => {
    if (!currentStep) return;

    const targetEl = currentStep.target ? document.querySelector(currentStep.target) : null;

    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const pad = 6;
      setSpotlight({
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      });
    } else {
      setSpotlight(null);
    }

    const tooltipW = tooltipRef.current?.offsetWidth ?? 360;
    const tooltipH = tooltipRef.current?.offsetHeight ?? 240;
    setTooltipPos(getTooltipPosition(targetEl, currentStep.position, tooltipW, tooltipH));
  }, [currentStep]);

  useEffect(() => {
    if (!open) return;
    updatePositions();
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, [open, updatePositions]);

  // Reset to step 0 when opened
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('hasky_guide_seen', 'true');
      onClose();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handlePrev = () => setStep((s) => Math.max(0, s - 1));

  const handleSkip = () => {
    localStorage.setItem('hasky_guide_seen', 'true');
    onClose();
  };

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') handleSkip();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  if (!open || !currentStep) return null;

  return (
    <div className="fixed inset-0 z-[100]" aria-modal="true" role="dialog">
      {/* Dark overlay with spotlight cutout */}
      <svg
        className="absolute inset-0 h-full w-full"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <mask id="guide-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlight ? (
              <rect
                x={spotlight.left}
                y={spotlight.top}
                width={spotlight.width}
                height={spotlight.height}
                rx="12"
                ry="12"
                fill="black"
              />
            ) : null}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.65)"
          mask="url(#guide-mask)"
        />
        {/* Spotlight border ring */}
        {spotlight ? (
          <rect
            x={spotlight.left - 2}
            y={spotlight.top - 2}
            width={spotlight.width + 4}
            height={spotlight.height + 4}
            rx="14"
            ry="14"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            opacity="0.7"
          />
        ) : null}
      </svg>

      {/* Click on overlay to skip */}
      <div className="absolute inset-0" onClick={handleSkip} />

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className="absolute z-10 w-[min(360px,calc(100vw-32px))]"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          transform: `translate(${tooltipPos.transformX}, ${tooltipPos.transformY})`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-2xl bg-white shadow-2xl shadow-slate-900/30 ring-1 ring-slate-200">
          {/* Header */}
          <div className="flex items-start justify-between p-5 pb-3">
            <div className="flex items-center gap-3">
              {currentStep.icon ? (
                <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-xl">
                  {currentStep.icon}
                </span>
              ) : (
                <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50">
                  <BookOpen className="size-5 text-blue-600" />
                </span>
              )}
              <h3 className="font-semibold text-slate-900 leading-snug">{currentStep.title}</h3>
            </div>
            <button
              onClick={handleSkip}
              className="ml-2 shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              aria-label="Close guide"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Description */}
          <div className="px-5 pb-4">
            <p className="text-sm leading-relaxed text-slate-600">{currentStep.description}</p>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 px-5 pb-4">
            {activeSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={cn(
                  'rounded-full transition-all duration-200',
                  i === step
                    ? 'w-6 h-2 bg-blue-600'
                    : 'size-2 bg-slate-200 hover:bg-slate-300',
                )}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <button
              onClick={handleSkip}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Skip tour
            </button>
            <div className="flex items-center gap-2">
              {!isFirst ? (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft className="size-3.5" />
                  Back
                </button>
              ) : null}
              <button
                onClick={handleNext}
                className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/25"
              >
                {isLast ? 'Finish' : 'Next'}
                {!isLast ? <ChevronRight className="size-3.5" /> : null}
              </button>
            </div>
          </div>

          {/* Step counter */}
          <div className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-md">
            {step + 1}
          </div>
        </div>
      </div>
    </div>
  );
}
