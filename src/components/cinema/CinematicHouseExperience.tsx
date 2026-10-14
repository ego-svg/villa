/**
 * PRIVATE RESIDENCE — Scroll-Controlled Cinematic House Experience
 *
 * Implements:
 * 1. Pinned/sticky full-screen video stage controlled strictly by scroll position (NO autoplay).
 * 2. Smooth scrubbing of the actual luxury house film (`/luxury.mp4`).
 * 3. Editorial architectural chapter transitions synchronized with scroll timeline.
 * 4. Seamless continuation into curated property presentation & private inquiry sections.
 * 5. Reduced-motion timeline slider fallback.
 */

import React, { useRef, useState, useMemo } from 'react';
import { useScrollVideoTimeline } from '../../engine/useScrollVideoTimeline';
import { formatVideoTime } from '../../engine/scrollVideo';
import { ResidenceLogo } from '../brand/ResidenceLogo';
import {
  Lock,
  ChevronDown,
  Compass,
  Maximize2,
  SlidersHorizontal,
  ArrowUpRight,
  Check,
  Send,
  AlertCircle,
} from 'lucide-react';

interface CinematicHouseExperienceProps {
  onLockResidence: () => void;
}

const CHAPTERS = [
  {
    range: [0, 0.28] as const,
    numeral: '01',
    title: 'The Approach & Volumetric Form',
    subtitle: 'Cantilevered architectural steel integrated into old-growth pine topography.',
  },
  {
    range: [0.28, 0.55] as const,
    numeral: '02',
    title: 'The Light-Filled Atrium',
    subtitle: 'Monolithic honed travertine paving with floor-to-ceiling thermal glazing.',
  },
  {
    range: [0.55, 0.82] as const,
    numeral: '03',
    title: 'The Great Pavilion & Kitchen',
    subtitle: 'Architectural bronze joinery, brushed titanium, and uninterrupted horizon vistas.',
  },
  {
    range: [0.82, 1.0] as const,
    numeral: '04',
    title: 'Sunset Terrace & Reflection Pool',
    subtitle: 'Black granite water plane mirroring the twilight sky in complete seclusion.',
  },
];

export const CinematicHouseExperience: React.FC<CinematicHouseExperienceProps> = ({
  onLockResidence,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotionMode, setReducedMotionMode] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    representation: 'Private Buyer',
    notes: '',
  });

  const {
    progress,
    currentTime,
    duration,
    isLoaded,
    hasError,
    errorMessage,
    hasScrolled,
    setManualProgress,
  } = useScrollVideoTimeline({
    videoRef,
    containerRef,
    reducedMotion: reducedMotionMode,
  });

  // Determine current active chapter based on timeline progress
  const activeChapter = useMemo(() => {
    return (
      CHAPTERS.find((ch) => progress >= ch.range[0] && progress <= ch.range[1]) ||
      CHAPTERS[CHAPTERS.length - 1]
    );
  }, [progress]);

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.name || !inquiryForm.email) return;
    setInquirySubmitted(true);
  };

  return (
    <div className="relative w-full min-h-screen bg-[#090a0c] text-stone-200 selection:bg-amber-400 selection:text-black">
      {/* Fixed Minimal Top Bar */}
      <header className="fixed top-0 left-0 w-full z-40 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between pointer-events-none transition-all duration-300">
        <div className="pointer-events-auto flex items-center bg-black/70 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-white/10 shadow-lg">
          <ResidenceLogo size="xs" subtitle="Villa Solitude" />
        </div>

        <div className="pointer-events-auto flex items-center gap-3">
          {/* Reduced-Motion / Manual Scrub Toggle */}
          <button
            type="button"
            onClick={() => setReducedMotionMode((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border backdrop-blur-md transition-colors cursor-pointer ${
              reducedMotionMode
                ? 'bg-amber-400/20 text-amber-200 border-amber-400/40'
                : 'bg-black/60 text-stone-400 hover:text-white border-white/10'
            }`}
            title="Toggle between Scroll Scrub and Manual Slider"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {reducedMotionMode ? 'Manual Scrubber' : 'Scroll Scrub'}
            </span>
          </button>

          {/* Return / Lock Button */}
          <button
            type="button"
            onClick={onLockResidence}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-stone-300 hover:text-white bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-amber-300" />
            <span>Lock Portal</span>
          </button>
        </div>
      </header>

      {/* 
        SCROLL-DRIVEN VIDEO STAGE:
        A tall scroll track (420vh) that pins the full-screen video stage.
        Scrolling down advances currentTime from 0 to duration; scrolling up reverses it.
      */}
      <section
        ref={containerRef}
        className="relative w-full h-[420vh] bg-black"
        aria-label="Scroll-controlled property film"
      >
        {/* Sticky Pinned Viewport */}
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center bg-black">
          {/* Actual Luxury House Video Element */}
          <video
            ref={videoRef}
            src="/luxury.mp4"
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover select-none pointer-events-none"
            aria-hidden="true"
          />

          {/* Fallback error container */}
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-stone-950 text-center z-20">
              <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
              <h2 className="text-xl font-serif text-white mb-2">Video Film Loading</h2>
              <p className="text-xs text-stone-400 max-w-md">
                {errorMessage || 'Unable to play local video format. Scroll down to view the architectural monograph below.'}
              </p>
            </div>
          )}

          {/* Subtle Ambient Scrims for Editorial Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
          <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/40 pointer-events-none" />

          {/* "SCROLL TO EXPLORE" Prompt: Visible initially, fades out once scrolling starts */}
          <div
            className={`absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none transition-all duration-500 z-20 ${
              hasScrolled ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            }`}
          >
            <span className="text-[11px] font-sans uppercase tracking-[0.3em] text-amber-200/90 font-medium">
              Scroll To Explore Film
            </span>
            <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1">
              <div className="w-1 h-2 bg-amber-300 rounded-full animate-bounce" />
            </div>
            <span className="text-[10px] text-stone-400 tracking-wider">
              Scrolling down advances footage · scrolling up rewinds
            </span>
          </div>

          {/* Dynamic Architectural Chapter Milestone Overlay */}
          <div className="absolute top-20 sm:top-24 left-6 sm:left-12 max-w-lg pointer-events-none z-20 transition-all duration-300">
            <div className="flex items-center gap-2 mb-1.5 text-xs text-amber-300/80 font-mono tracking-widest">
              <span>CHAPTER {activeChapter.numeral}</span>
              <span>·</span>
              <span className="uppercase">{Math.round(progress * 100)}% COMPLETE</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif text-white tracking-wide leading-tight mb-2 text-balance drop-shadow-md">
              {activeChapter.title}
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 font-sans max-w-md leading-relaxed text-balance drop-shadow">
              {activeChapter.subtitle}
            </p>
          </div>

          {/* Manual Scrubber Overlay for Reduced Motion Mode */}
          {reducedMotionMode && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-11/12 max-w-md bg-black/80 backdrop-blur-md border border-white/20 p-4 rounded-2xl z-30 flex flex-col gap-2 shadow-2xl">
              <div className="flex items-center justify-between text-xs text-stone-300">
                <span className="font-serif">Manual Film Scrubber</span>
                <span className="font-mono text-amber-300">
                  {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={progress}
                onChange={(e) => setManualProgress(parseFloat(e.target.value))}
                className="w-full accent-amber-300 cursor-pointer"
              />
              <span className="text-[10px] text-stone-400 text-center">
                Drag slider to scrub video frames smoothly
              </span>
            </div>
          )}

          {/* Bottom Architectural Timeline & Progress Rail */}
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between gap-4 pointer-events-none z-20">
            {/* Timestamp */}
            <div className="flex items-center gap-2 text-xs font-mono text-stone-400 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-amber-200">{formatVideoTime(currentTime)}</span>
              <span>/</span>
              <span>{formatVideoTime(duration)}</span>
            </div>

            {/* Timeline Line with Chapter Dots */}
            <div className="relative flex-1 h-[2px] bg-white/15 rounded-full overflow-hidden max-w-xl mx-auto">
              <div
                className="h-full bg-gradient-to-r from-amber-200 to-amber-300 transition-all duration-75"
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            {/* Frame Status */}
            <div className="text-[11px] font-sans uppercase tracking-widest text-stone-400 hidden sm:block bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
              {progress >= 1 ? 'End of Reel' : 'Scroll Scrubbing'}
            </div>
          </div>
        </div>
      </section>

      {/* 
        CURATED PROPERTY PRESENTATION SECTIONS
        Smoothly flows after the scroll-driven video has been explored.
      */}
      <div className="relative z-30 bg-[#090a0c] border-t border-white/10">
        {/* Monograph Lead & Specifications Grid */}
        <section className="max-w-6xl mx-auto px-6 py-24 sm:py-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-white/10 pb-12">
            <div>
              <span className="text-xs uppercase tracking-[0.3em] text-amber-300 font-semibold mb-3 block">
                Architectural Monograph
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif text-white tracking-wide max-w-2xl leading-tight">
                A sanctuary of cantilevered geometry, native pine, and uninterrupted horizon.
              </h2>
            </div>
            <p className="text-sm text-stone-400 max-w-sm leading-relaxed">
              Designed as a continuous dialogue between raw geological mass and ethereal transparency, Villa Solitude stands as an achievement in contemporary architectural minimalism.
            </p>
          </div>

          {/* Key Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-20">
            <div className="border-t border-white/15 pt-4">
              <span className="text-xs text-stone-500 uppercase tracking-widest block mb-1">
                Internal Area
              </span>
              <span className="text-2xl sm:text-3xl font-serif text-white font-normal tabular-nums">
                14,200 <span className="text-sm text-stone-400 font-sans">sq ft</span>
              </span>
            </div>
            <div className="border-t border-white/15 pt-4">
              <span className="text-xs text-stone-500 uppercase tracking-widest block mb-1">
                Private Estate
              </span>
              <span className="text-2xl sm:text-3xl font-serif text-white font-normal tabular-nums">
                1.85 <span className="text-sm text-stone-400 font-sans">Acres</span>
              </span>
            </div>
            <div className="border-t border-white/15 pt-4">
              <span className="text-xs text-stone-500 uppercase tracking-widest block mb-1">
                Accommodations
              </span>
              <span className="text-2xl sm:text-3xl font-serif text-white font-normal">
                6 Suites <span className="text-sm text-stone-400 font-sans">/ 8 Baths</span>
              </span>
            </div>
            <div className="border-t border-white/15 pt-4">
              <span className="text-xs text-stone-500 uppercase tracking-widest block mb-1">
                Completion
              </span>
              <span className="text-2xl sm:text-3xl font-serif text-white font-normal tabular-nums">
                2026 <span className="text-sm text-stone-400 font-sans">Portfolio</span>
              </span>
            </div>
          </div>

          {/* Architectural Pillars / Materiality */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-[#111318] border border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-amber-300 tracking-widest mb-3 block">
                  01 / MATERIALITY
                </span>
                <h3 className="text-xl font-serif text-white mb-3">Honed Roman Travertine</h3>
                <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                  Quarried directly from Tivoli, each slab is dry-jointed with hairline precision to create monolithic interior corridors that mirror the mineral warmth of natural rock.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-[#111318] border border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-amber-300 tracking-widest mb-3 block">
                  02 / STRUCTURE
                </span>
                <h3 className="text-xl font-serif text-white mb-3">Post-Tensioned Cantilever</h3>
                <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                  A 34-foot column-free overhang projects the primary living pavilion over the sloping terrain, offering uninterrupted vistas through triple-laminated acoustic glazing.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-[#111318] border border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-amber-300 tracking-widest mb-3 block">
                  03 / AMENITIES
                </span>
                <h3 className="text-xl font-serif text-white mb-3">Subterranean Wellness</h3>
                <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                  A 25-meter infinity pool clad in flamed black Zimbabwe granite, complete with Finnish cedar sauna, sommelier temperature-controlled cellar, and 6-bay gallery.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Private Acquisition Inquiry Section */}
        <section className="border-t border-white/10 bg-[#0b0d10] py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs uppercase tracking-[0.3em] text-amber-300 font-semibold mb-2 block">
                Private Acquisition
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-white tracking-wide mb-3">
                Request Archival Dossier & Private Viewing
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto leading-relaxed">
                Direct engagement for qualified principals, estate managers, and family offices. Complete the brief to initiate confidential correspondence.
              </p>
            </div>

            {inquirySubmitted ? (
              <div className="bg-[#12161f] border border-emerald-500/30 p-8 rounded-2xl text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif text-white mb-2">Inquiry Confirmed</h3>
                <p className="text-xs text-stone-400 max-w-md mb-6 leading-relaxed">
                  Your confidential submission for Villa Solitude has been received. The private fiduciary partner will respond via encrypted email within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => setInquirySubmitted(false)}
                  className="px-4 py-2 text-xs text-stone-400 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Submit Another Consultation
                </button>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-stone-400 block mb-1.5">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lord Alistair Vance"
                      value={inquiryForm.name}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                      className="w-full bg-[#141720] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-400/50"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-stone-400 block mb-1.5">
                      Confidential Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. principal@vance-holdings.com"
                      value={inquiryForm.email}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                      className="w-full bg-[#141720] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-400/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-stone-400 block mb-1.5">
                    Representation Type
                  </label>
                  <select
                    value={inquiryForm.representation}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, representation: e.target.value })}
                    className="w-full bg-[#141720] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400/50 cursor-pointer"
                  >
                    <option value="Private Principal">Direct Private Principal</option>
                    <option value="Family Office">Family Office Representative</option>
                    <option value="Licensed Broker">Licensed Buyer&apos;s Broker</option>
                    <option value="Architectural Press">Architectural Advisory / Press</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-stone-400 block mb-1.5">
                    Private Notes & Timeline
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Specific architectural inquiries, scheduling preferences, or verification credentials..."
                    value={inquiryForm.notes}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, notes: e.target.value })}
                    className="w-full bg-[#141720] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-400/50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 text-xs font-semibold uppercase tracking-[0.2em] text-black bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200 hover:from-amber-100 hover:to-amber-200 rounded-xl transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)] active:scale-[0.99] cursor-pointer mt-2"
                >
                  Initiate Confidential Acquisition Dossier
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Quiet Editorial Footer */}
        <footer className="border-t border-white/10 py-12 px-6 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-6xl mx-auto text-xs text-stone-500">
          <div className="flex items-center gap-4">
            <ResidenceLogo size="xs" showSubtitle={false} />
            <span className="text-stone-500 border-l border-white/10 pl-4">
              &copy; 2026 PRIVATE RESIDENCE · Villa Solitude · All Rights Reserved
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={onLockResidence}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              Lock Presentation
            </button>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              Back to Reel Top
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
