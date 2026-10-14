/**
 * PRIVATE RESIDENCE — Scroll-Controlled Cinematic House Experience & Architectural Monograph
 *
 * Implements:
 * 1. Pinned/sticky full-screen video stage controlled strictly by scroll position (NO autoplay).
 * 2. Smooth scrubbing of the actual luxury house film (`/luxury.mp4`).
 * 3. Editorial architectural chapter transitions synchronized with scroll timeline.
 * 4. Curated Architectural Gallery showcasing high-resolution estate photography & lightbox inspection.
 * 5. Interactive Architectural Blueprint & Spatial Vector Map with spatial hotspots.
 * 6. Monograph specifications, materiality cards, and private acquisition dossier form.
 */

import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { useScrollVideoTimeline } from '../../engine/useScrollVideoTimeline';
import { formatVideoTime } from '../../engine/scrollVideo';
import {
  Lock,
  SlidersHorizontal,
  Check,
  AlertCircle,
  Compass,
  Maximize2,
  Info,
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
  Layers,
  Sparkles,
  ArrowUpRight,
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

interface SpatialHotspot {
  id: string;
  name: string;
  x: number; // percentage
  y: number; // percentage
  level: 'Level 01 · Main Pavilion' | 'Level 02 · Master Wing' | 'Subterranean · Wellness';
  dimensions: string;
  finishes: string;
  exposure: string;
  description: string;
}

const SPATIAL_HOTSPOTS: SpatialHotspot[] = [
  {
    id: 'living-pavilion',
    name: 'The Great Living Pavilion',
    x: 48,
    y: 42,
    level: 'Level 01 · Main Pavilion',
    dimensions: '3,850 sq ft · 18 ft Ceiling',
    finishes: 'Honed Tivoli Travertine, Brushed Bronze Joinery',
    exposure: 'Southwest (180° Panoramic Horizon)',
    description: 'A 34-foot column-free cantilever projecting over the forest floor with acoustic triple glazing.',
  },
  {
    id: 'infinity-terrace',
    name: 'Reflection Terrace & Pool',
    x: 75,
    y: 68,
    level: 'Level 01 · Main Pavilion',
    dimensions: '2,400 sq ft Outdoor Plane',
    finishes: 'Flamed Zimbabwe Black Granite, Heated Water Edge',
    exposure: 'West Sunset Orientation',
    description: 'Zero-edge black granite water plane creating a mirror image of the twilight horizon.',
  },
  {
    id: 'master-suite',
    name: 'Primary Master Sanctuary',
    x: 28,
    y: 30,
    level: 'Level 02 · Master Wing',
    dimensions: '1,950 sq ft Private Wing',
    finishes: 'Swiss Cedar Paneling, Silk Plaster, Calacatta Marble',
    exposure: 'Southeast Sunrise Light',
    description: 'Private cantilevered loggia, Dual ensuite dressing rooms, and integrated steam lounge.',
  },
  {
    id: 'wellness-spa',
    name: 'Subterranean Thermal Spa',
    x: 55,
    y: 80,
    level: 'Subterranean · Wellness',
    dimensions: '2,800 sq ft Wellness Level',
    finishes: 'Honed Lava Stone, Finnish Cedar, Temperature Vault',
    exposure: 'Secluded Underground Sanctuary',
    description: '25m lap pool, ice plunge, sommelier 1,200-bottle wine vault, and 6-bay gallery garage.',
  },
];

interface GalleryItem {
  id: string;
  src: string;
  title: string;
  category: string;
  caption: string;
  specs: { label: string; value: string }[];
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'monolith-facade',
    src: '/images/monolith-facade.jpg',
    title: 'Monolithic Volumetric Facade',
    category: 'North Elevation · Dusk Approach',
    caption: 'Dark graphite architectural volumes bathed in warm ambient uplighting, anchored against old-growth pines.',
    specs: [
      { label: 'Facing', value: 'North Elevation' },
      { label: 'Lighting', value: '3,000K Architectural LED Uplighting' },
      { label: 'Finish', value: 'Brushed Charcoal Titanium Coating' },
    ],
  },
  {
    id: 'ambient-pool-mansion',
    src: '/images/ambient-pool-mansion.jpg',
    title: 'Ambient Horizon Reflection Pool',
    category: 'West Terrace · Twilight',
    caption: 'Heated zero-edge pool in flamed Zimbabwe black granite, reflecting the sapphire twilight and glass pavilion.',
    specs: [
      { label: 'Surface Area', value: '2,400 sq ft Outdoor Plane' },
      { label: 'Ambient Light', value: 'Deep Sapphire Underwater LED' },
      { label: 'Water Edge', value: 'Perimeter Slot Drain' },
    ],
  },
  {
    id: 'architectural-statement',
    src: '/images/architectural-statement.jpg',
    title: 'Cantilevered Glass Structure',
    category: 'Main Pavilion · Exterior View',
    caption: 'A 34-foot column-free post-tensioned steel overhang floating over the sloped topographical terrain.',
    specs: [
      { label: 'Span', value: '34-Foot Column-Free Overhang' },
      { label: 'Glazing', value: 'Triple-Laminated Low-E Acoustic Glass' },
      { label: 'Load Support', value: 'Subterranean Concrete Pier System' },
    ],
  },
  {
    id: 'forest-sanctuary',
    src: '/images/forest-sanctuary.jpg',
    title: 'Old-Growth Forest Sanctuary',
    category: 'Atrium & Natural Boundary',
    caption: 'Uninterrupted glass curtains bringing old-growth pine trees into intimate dialogue with the honed stone paving.',
    specs: [
      { label: 'Surroundings', value: '1.85 Acres Private Pine Forest' },
      { label: 'Air Quality', value: 'HEPA & UV-C Fresh Air Recirculation' },
      { label: 'Acoustics', value: 'STC-52 Sound Transmission Rating' },
    ],
  },
  {
    id: 'advance-residence',
    src: '/images/advance-residence.jpg',
    title: 'Futuristic Structural Symmetry',
    category: 'East Pavilion · Entrance Portal',
    caption: 'Clean geometric lines, precision-milled aluminum louvers, and private motorized security entry gates.',
    specs: [
      { label: 'Access Control', value: 'Encrypted Biometric Gate Protocol' },
      { label: 'Privacy', value: 'Motorized Exterior Solar Louvers' },
      { label: 'Security', value: 'Subsurface Seismic Radar Boundary' },
    ],
  },
  {
    id: 'dramatic-living-pavilion',
    src: '/images/dramatic-living-pavilion.jpg',
    title: 'Double-Height Living Atrium',
    category: 'Level 01 · Primary Lounge',
    caption: 'An 18-foot soaring volume lined with dry-jointed Tivoli travertine, open-flame hearth, and panoramic horizon vistas.',
    specs: [
      { label: 'Ceiling Height', value: '18 Feet Clear Span' },
      { label: 'Stone Cladding', value: 'Honed Roman Travertine Slabs' },
      { label: 'Fireplace', value: '8-Foot Linear Ethanol Hearth' },
    ],
  },
];

export const CinematicHouseExperience: React.FC<CinematicHouseExperienceProps> = ({
  onLockResidence,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotionMode, setReducedMotionMode] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<SpatialHotspot>(SPATIAL_HOTSPOTS[0]);
  const [activeLevelTab, setActiveLevelTab] = useState<SpatialHotspot['level']>('Level 01 · Main Pavilion');
  
  // Gallery Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Inquiry Form State
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    representation: 'Private Principal',
    notes: '',
  });

  const {
    progress,
    currentTime,
    duration,
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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.name || !inquiryForm.email) return;
    setInquirySubmitted(true);
  };

  const filteredHotspots = useMemo(() => {
    return SPATIAL_HOTSPOTS.filter((h) => h.level === activeLevelTab);
  }, [activeLevelTab]);

  // Lightbox Keyboard Handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev !== null ? (prev + 1) % GALLERY_ITEMS.length : 0));
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev !== null ? (prev - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length : 0
        );
      }
    },
    [lightboxIndex]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const currentLightboxItem = lightboxIndex !== null ? GALLERY_ITEMS[lightboxIndex] : null;

  return (
    <div className="relative w-full min-h-screen bg-[#090a0c] text-stone-200 selection:bg-amber-400 selection:text-black">
      {/* 
        TOP BAR CONTRACT (Exhaustive 3-Zone)
        Zone 1: Brand Wordmark | Zone 2: Single-line Links | Zone 3: Primary Action Button
      */}
      <header className="fixed top-0 left-0 w-full z-40 px-6 py-3.5 flex items-center justify-between gap-8 bg-[#090a0c]/85 backdrop-blur-md border-b border-white/10 select-none">
        {/* Zone 1: Single Text Element Wordmark */}
        <a
          href="#reel"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="text-base font-serif tracking-[0.25em] text-white whitespace-nowrap shrink-0 hover:text-amber-200 transition-colors"
        >
          PRIVATE RESIDENCE
        </a>

        {/* Zone 2: 5 Single-Line Text Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-stone-400">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Film Reel
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('monograph')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Monograph
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('gallery')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Architectural Gallery
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('blueprint')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Spatial Blueprint
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('acquisition')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Private Acquisition
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action & Mode Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setReducedMotionMode((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border transition-colors cursor-pointer ${
              reducedMotionMode
                ? 'bg-amber-400/20 text-amber-200 border-amber-400/40'
                : 'bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white border-white/10'
            }`}
            title="Toggle between Scroll Scrub and Manual Slider"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline whitespace-nowrap shrink-0">
              {reducedMotionMode ? 'Manual Scrubber' : 'Scroll Scrub'}
            </span>
          </button>

          <button
            type="button"
            onClick={onLockResidence}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-stone-200 hover:text-white bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
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
        id="reel"
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
          <div className="absolute top-24 sm:top-28 left-6 sm:left-12 max-w-lg pointer-events-none z-20 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2 text-xs text-amber-300/90 font-mono tracking-widest">
              <span>CHAPTER {activeChapter.numeral}</span>
              <span aria-hidden="true">·</span>
              <span className="uppercase">{Math.round(progress * 100)}% FILM REEL</span>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif text-white tracking-wide leading-tight mb-2 text-balance drop-shadow-md">
              {activeChapter.title}
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 font-sans max-w-md leading-relaxed text-balance drop-shadow">
              {activeChapter.subtitle}
            </p>
          </div>

          {/* Manual Scrubber Overlay for Reduced Motion Mode */}
          {reducedMotionMode && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-11/12 max-w-md bg-black/85 backdrop-blur-md border border-white/20 p-4 rounded-2xl z-30 flex flex-col gap-2 shadow-2xl">
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
              <span aria-hidden="true">/</span>
              <span>{formatVideoTime(duration)}</span>
            </div>

            {/* Timeline Line with Progress Fill */}
            <div className="relative flex-1 h-[2px] bg-white/15 rounded-full overflow-hidden max-w-xl mx-auto">
              <div
                className="h-full bg-gradient-to-r from-amber-200 to-amber-300 transition-all duration-75"
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            {/* Frame Status */}
            <div className="text-[11px] font-sans uppercase tracking-widest text-stone-400 hidden sm:block bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
              {progress >= 0.99 ? 'Film Complete' : 'Scroll Driven'}
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
        <section id="monograph" className="max-w-6xl mx-auto px-6 py-24 sm:py-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-white/10 pb-12">
            <div>
              <span className="text-xs uppercase tracking-[0.3em] text-amber-300 font-semibold mb-3 block">
                Architectural Monograph
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif text-white tracking-wide max-w-2xl leading-tight text-balance">
                A sanctuary of cantilevered geometry, native pine, and uninterrupted horizon.
              </h2>
            </div>
            <p className="text-sm text-stone-400 max-w-sm leading-relaxed">
              Designed as a continuous dialogue between raw geological mass and ethereal transparency, Villa Solitude stands as an achievement in contemporary architectural minimalism.
            </p>
          </div>

          {/* Key Specifications Grid (Tabular Numerals) */}
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
            <div className="p-8 rounded-2xl bg-[#111318] border border-white/10 flex flex-col justify-between hover:border-amber-400/30 transition-colors">
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

            <div className="p-8 rounded-2xl bg-[#111318] border border-white/10 flex flex-col justify-between hover:border-amber-400/30 transition-colors">
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

            <div className="p-8 rounded-2xl bg-[#111318] border border-white/10 flex flex-col justify-between hover:border-amber-400/30 transition-colors">
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

        {/* 
          CURATED ARCHITECTURAL GALLERY (Featuring Uploaded High-Res Residence Images)
        */}
        <section id="gallery" className="border-t border-white/10 bg-[#07080a] py-24 sm:py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-white/10 pb-10">
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-amber-300 font-semibold mb-3 block flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  <span>Curated Dossier Photography</span>
                </span>
                <h2 className="text-3xl sm:text-5xl font-serif text-white tracking-wide leading-tight">
                  Architectural Photography & Volumetric Dossier
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-stone-400 max-w-md leading-relaxed">
                Click any frame to launch full-screen high-resolution inspection mode with lighting and material specifications.
              </p>
            </div>

            {/* Gallery Editorial Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {GALLERY_ITEMS.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => setLightboxIndex(index)}
                  className="group relative bg-[#111318] border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-amber-400/40 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-950">
                    <img
                      src={item.src}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                    {/* Quick Expand Icon Overlay */}
                    <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-200 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                      <Maximize2 className="w-4 h-4" />
                    </div>

                    {/* Unboxed Quiet Category Label */}
                    <div className="absolute bottom-4 left-4 right-4 text-[11px] font-mono text-amber-200/90 tracking-wider">
                      <span>{item.category}</span>
                    </div>
                  </div>

                  {/* Card Editorial Info */}
                  <div className="p-6 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="text-lg font-serif text-white mb-2 group-hover:text-amber-200 transition-colors flex items-center justify-between">
                        <span>{item.title}</span>
                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-amber-300 shrink-0" />
                      </h3>
                      <p className="text-xs text-stone-400 leading-relaxed mb-4">
                        {item.caption}
                      </p>
                    </div>

                    {/* Micro Spec Preview */}
                    <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-stone-500 font-mono">
                      <span>{item.specs[0].label}</span>
                      <span className="text-stone-300">{item.specs[0].value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* INTERACTIVE ARCHITECTURAL BLUEPRINT & SPATIAL MAP SECTION */}
        <section id="blueprint" className="border-t border-white/10 bg-[#0c0e12] py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-amber-300 font-semibold mb-2 block flex items-center gap-2">
                  <Compass className="w-4 h-4" />
                  <span>Spatial Architecture Vector</span>
                </span>
                <h2 className="text-3xl sm:text-4xl font-serif text-white tracking-wide">
                  Interactive Floorplan & Spatial Plan
                </h2>
              </div>

              {/* Zero-Pill Interactive Level Tabs */}
              <div className="flex items-center gap-2 p-1 bg-white/[0.04] border border-white/10 rounded-xl">
                {(['Level 01 · Main Pavilion', 'Level 02 · Master Wing', 'Subterranean · Wellness'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setActiveLevelTab(lvl)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      activeLevelTab === lvl
                        ? 'bg-amber-400/20 text-amber-200 border border-amber-400/30'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {lvl.split('·')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* SVG Blueprint Canvas Viewport */}
              <div className="lg:col-span-2 relative aspect-[4/3] bg-[#07080a] border border-white/10 rounded-2xl overflow-hidden p-6 flex items-center justify-center shadow-2xl">
                {/* SVG Blueprint Grid Lines */}
                <svg className="absolute inset-0 w-full h-full opacity-15" width="100%" height="100%">
                  <defs>
                    <pattern id="blueprint-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-amber-300" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
                </svg>

                {/* Stylized Architectural Floorplan Geometry */}
                <svg className="relative w-full h-full max-w-lg max-h-80" viewBox="0 0 500 350" fill="none">
                  {/* Outer Footprint Wall */}
                  <rect x="50" y="40" width="400" height="260" rx="8" stroke="#d4af37" strokeWidth="1.5" strokeDasharray="6 3" className="opacity-40" />
                  
                  {/* Primary Living Pavilion */}
                  <rect x="80" y="70" width="220" height="150" fill="#f59e0b" fillOpacity="0.04" stroke="#f59e0b" strokeWidth="1.2" />
                  
                  {/* Cantilever Deck */}
                  <rect x="300" y="70" width="120" height="150" fill="#ffffff" fillOpacity="0.02" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3" />
                  
                  {/* Reflection Pool */}
                  <rect x="320" y="190" width="110" height="80" fill="#38bdf8" fillOpacity="0.08" stroke="#38bdf8" strokeWidth="1" />
                  
                  {/* Master Wing */}
                  <rect x="80" y="230" width="180" height="60" fill="#f59e0b" fillOpacity="0.04" stroke="#f59e0b" strokeWidth="1" />

                  {/* Compass Rose Indicator */}
                  <g transform="translate(430, 80)">
                    <circle cx="0" cy="0" r="18" stroke="#d4af37" strokeWidth="0.8" fill="none" opacity="0.4" />
                    <text x="0" y="-22" textAnchor="middle" fill="#d4af37" fontSize="9" fontFamily="sans-serif">N</text>
                    <path d="M 0 -12 L 3 0 L 0 12 L -3 0 Z" fill="#d4af37" opacity="0.8" />
                  </g>
                </svg>

                {/* Interactive Hotspot Markers */}
                {filteredHotspots.map((spot) => {
                  const isSelected = selectedHotspot.id === spot.id;
                  return (
                    <button
                      key={spot.id}
                      type="button"
                      onClick={() => setSelectedHotspot(spot)}
                      style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 group flex items-center justify-center cursor-pointer transition-all ${
                        isSelected ? 'scale-125 z-20' : 'hover:scale-110 z-10'
                      }`}
                      title={`Select ${spot.name}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-amber-300 text-black border-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                          : 'bg-black/80 text-amber-300 border-amber-400/40 hover:border-amber-300'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-black' : 'bg-amber-300 animate-ping'}`} />
                      </div>
                      <span className="absolute left-10 top-0 text-[10px] font-sans font-medium text-white whitespace-nowrap bg-black/90 px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        {spot.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Hotspot Spec Panel */}
              <div className="bg-[#111318] border border-white/10 p-6 rounded-2xl flex flex-col justify-between h-full">
                <div>
                  <div className="text-[11px] font-mono text-amber-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <span>{selectedHotspot.level}</span>
                  </div>
                  <h3 className="text-2xl font-serif text-white mb-4">
                    {selectedHotspot.name}
                  </h3>
                  <p className="text-xs text-stone-300 leading-relaxed mb-6">
                    {selectedHotspot.description}
                  </p>

                  <div className="space-y-3 text-xs border-t border-white/10 pt-4">
                    <div>
                      <span className="text-stone-500 uppercase tracking-wider block text-[10px]">Dimensions & Volume</span>
                      <span className="text-white font-mono">{selectedHotspot.dimensions}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 uppercase tracking-wider block text-[10px]">Material Palette</span>
                      <span className="text-stone-300">{selectedHotspot.finishes}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 uppercase tracking-wider block text-[10px]">Light Exposure</span>
                      <span className="text-amber-200/90">{selectedHotspot.exposure}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-white/10 text-[11px] text-stone-500">
                  Select floorplan hotspots above to inspect specific spatial volumes.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Private Acquisition Inquiry Section */}
        <section id="acquisition" className="border-t border-white/10 bg-[#0b0d10] py-24 px-6">
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
        <footer className="border-t border-white/10 py-12 px-6 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-6xl mx-auto text-xs text-stone-500">
          <div>
            &copy; 2026 PRIVATE RESIDENCE · Villa Solitude · All Rights Reserved
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

      {/* 
        FULL-SCREEN LIGHTBOX MODAL FOR GALLERY INSPECTION
      */}
      {currentLightboxItem && lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 sm:p-8 animate-fade-in select-none">
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 text-stone-400 hover:text-white p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer z-50"
            aria-label="Close Lightbox"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left / Right Navigation */}
          <button
            type="button"
            onClick={() =>
              setLightboxIndex((prev) =>
                prev !== null ? (prev - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length : 0
              )
            }
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-3 rounded-full bg-black/60 border border-white/20 hover:border-white/40 transition-colors cursor-pointer z-50"
            aria-label="Previous Image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={() =>
              setLightboxIndex((prev) => (prev !== null ? (prev + 1) % GALLERY_ITEMS.length : 0))
            }
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-3 rounded-full bg-black/60 border border-white/20 hover:border-white/40 transition-colors cursor-pointer z-50"
            aria-label="Next Image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Lightbox Content Container */}
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col lg:flex-row gap-6 items-center overflow-y-auto lg:overflow-hidden bg-[#0c0e12] border border-white/15 rounded-2xl p-6 sm:p-8 shadow-2xl">
            {/* Image Preview Area */}
            <div className="w-full lg:w-3/5 relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
              <img
                src={currentLightboxItem.src}
                alt={currentLightboxItem.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Lightbox Metadata Panel */}
            <div className="w-full lg:w-2/5 flex flex-col justify-between h-full text-left">
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-amber-300 tracking-wider mb-2">
                  <span>{currentLightboxItem.category}</span>
                  <span>
                    {lightboxIndex + 1} / {GALLERY_ITEMS.length}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-serif text-white mb-3">
                  {currentLightboxItem.title}
                </h3>

                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mb-6">
                  {currentLightboxItem.caption}
                </p>

                {/* Technical Specifications List */}
                <div className="space-y-3 text-xs border-t border-white/10 pt-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 block mb-2">
                    Architectural Specifications
                  </span>
                  {currentLightboxItem.specs.map((spec, i) => (
                    <div key={i} className="flex items-center justify-between text-stone-400">
                      <span>{spec.label}</span>
                      <span className="text-white font-mono text-[11px]">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 text-[11px] text-stone-500 flex items-center justify-between">
                <span>Use &larr; / &rarr; keys or buttons to navigate dossier</span>
                <span className="font-mono text-amber-400/80">Villa Solitude</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
