import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  Share2, 
  Sparkles, 
  Lightbulb, 
  Compass, 
  Train, 
  Check, 
  ExternalLink, 
  ChevronRight, 
  BookOpen, 
  Route, 
  Zap, 
  Shield, 
  Layers, 
  Award,
  Bookmark,
  Bot,
  MessageSquare,
  MapPin,
  Camera
} from 'lucide-react';
import { getBlogBySlug } from '../services/api';
import type { BlogArticle } from '../types';
import { FALLBACK_BLOGS } from '../data/fallbackBlogs';
import { isArticleSaved, toggleSaveArticle, getOfflineCachedArticle } from '../utils/bookmarkUtils';
import AudioStoryPlayer from '../components/AudioStoryPlayer';
import ArticleCommunityTips from '../components/ArticleCommunityTips';

interface StoryChapter {
  id: string;
  chapterNumber: number;
  title: string;
  paragraphs: string[];
  image?: {
    url: string;
    caption?: string;
    altText?: string;
  };
  callout?: {
    type: 'tip' | 'trivia' | 'quote';
    title?: string;
    content: string;
  };
}

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Animated Scroll Tracking & Mountain Switchback Railway Track
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [trackSvgPath, setTrackSvgPath] = useState<string>('');
  const [totalTrackLength, setTotalTrackLength] = useState<number>(0);
  const [trackBounds, setTrackBounds] = useState<{ startY: number; endY: number; endX: number }>({ startY: 0, endY: 2000, endX: 32 });
  const [trainPos, setTrainPos] = useState<{ x: number; y: number; angle: number }>({ x: 32, y: 44, angle: 90 });
  const [trainTravelDist, setTrainTravelDist] = useState<number>(0);
  const trackPathRef = useRef<SVGPathElement>(null);
  const storyContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchArticle = async () => {
      setLoading(true);
      try {
        if (!slug) return;
        const res = await getBlogBySlug(slug);
        if (isMounted && res?.data) {
          setArticle(res.data);
          setIsSaved(isArticleSaved(res.data.slug));
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Backend unavailable, trying offline cache / fallback:', err);
      }

      // Check offline local cache first
      if (slug) {
        const cached = getOfflineCachedArticle(slug);
        if (cached && isMounted) {
          setArticle(cached);
          setIsSaved(true);
          setLoading(false);
          return;
        }
      }

      // Fallback lookup
      const found = FALLBACK_BLOGS.find(a => a.slug === slug || a.id === slug);
      if (isMounted) {
        const art = found || FALLBACK_BLOGS[0];
        setArticle(art);
        setIsSaved(isArticleSaved(art.slug));
        setLoading(false);
      }
    };

    fetchArticle();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => { isMounted = false; };
  }, [slug]);

  // Group linear sections into rich Chapters for alternating Zig-Zag layout
  const chapters = useMemo<StoryChapter[]>(() => {
    if (!article || !article.sections) return [];

    const result: StoryChapter[] = [];
    let current: StoryChapter | null = null;
    let chCount = 0;

    for (const sec of article.sections) {
      if (sec.type === 'heading') {
        if (current) result.push(current);
        chCount++;
        current = {
          id: `story-chapter-${chCount}`,
          chapterNumber: chCount,
          title: sec.title || `Chapter ${chCount}`,
          paragraphs: sec.content ? [sec.content] : [],
          image: undefined,
          callout: undefined
        };
      } else if (sec.type === 'paragraph') {
        if (!current) {
          chCount++;
          current = {
            id: `story-chapter-${chCount}`,
            chapterNumber: chCount,
            title: `Introduction`,
            paragraphs: [],
            image: undefined,
            callout: undefined
          };
        }
        if (sec.content) current.paragraphs.push(sec.content);
      } else if (sec.type === 'image') {
        if (current && !current.image) {
          current.image = {
            url: sec.imageUrl || '',
            caption: sec.imageCaption,
            altText: sec.altText
          };
        } else if (current) {
          // If chapter already has an image, push current and start fresh chapter
          result.push(current);
          chCount++;
          current = {
            id: `story-chapter-${chCount}`,
            chapterNumber: chCount,
            title: sec.title || `Visual Chapter ${chCount}`,
            paragraphs: [],
            image: {
              url: sec.imageUrl || '',
              caption: sec.imageCaption,
              altText: sec.altText
            },
            callout: undefined
          };
        } else {
          chCount++;
          current = {
            id: `story-chapter-${chCount}`,
            chapterNumber: chCount,
            title: `Visual Chronicle`,
            paragraphs: [],
            image: {
              url: sec.imageUrl || '',
              caption: sec.imageCaption,
              altText: sec.altText
            },
            callout: undefined
          };
        }
      } else if (sec.type === 'tip' || sec.type === 'trivia' || sec.type === 'quote') {
        if (current) {
          current.callout = {
            type: sec.type,
            title: sec.title,
            content: sec.content || ''
          };
        }
      }
    }

    if (current) result.push(current);
    return result;
  }, [article]);

  // 1. Compute Responsive Mountain Switchback Track Path Geometry
  const computeTrackGeometry = useCallback(() => {
    const container = storyContainerRef.current;
    if (!container || chapters.length === 0) return;

    const containerW = container.clientWidth;
    if (containerW <= 0) return;

    // Station horizontal center position based on responsive column width
    // Mobile (<640px): w-10 (40px) -> center is 20px
    // Tablet (sm): w-14 (56px) -> center is 28px
    // Desktop (lg): w-16 (64px) -> center is 32px
    const stationOffset = window.innerWidth >= 1024 ? 32 : window.innerWidth >= 640 ? 28 : 20;

    const stationsData: Array<{
      idx: number;
      isLeft: boolean;
      x: number;
      y: number;
      cardTop: number;
      cardBottom: number;
    }> = [];

    chapters.forEach((ch, idx) => {
      const el = document.getElementById(ch.id);
      const isLeft = idx % 2 === 0;
      const x = isLeft ? stationOffset : containerW - stationOffset;

      if (el) {
        const cardTop = el.offsetTop;
        const cardBottom = cardTop + el.offsetHeight;
        // The station node is at pt-6 (24px) + button radius (18px) = 42px down from cardTop
        const y = cardTop + 42;
        stationsData.push({ idx, isLeft, x, y, cardTop, cardBottom });
      } else {
        const fallbackTop = idx * 600;
        stationsData.push({
          idx,
          isLeft,
          x,
          y: fallbackTop + 42,
          cardTop: fallbackTop,
          cardBottom: fallbackTop + 500
        });
      }
    });

    if (stationsData.length === 0) return;

    // Build SVG cubic Bézier track path weaving through the gaps
    const parts: string[] = [];
    const s0 = stationsData[0];
    parts.push(`M ${s0.x} ${Math.max(0, s0.y - 24)}`);
    parts.push(`L ${s0.x} ${s0.y}`);

    for (let i = 0; i < stationsData.length - 1; i++) {
      const cur = stationsData[i];
      const nxt = stationsData[i + 1];

      // Run straight down alongside the current card
      const yExit = cur.cardBottom;
      parts.push(`L ${cur.x} ${yExit}`);

      // Smooth S-curve transition through the gap between cards to the next side
      const yEnter = nxt.cardTop;
      const gapMidY = yExit + (yEnter - yExit) * 0.5;

      // Cubic Bézier curve with vertical exit and enter tangents
      parts.push(`C ${cur.x} ${gapMidY}, ${nxt.x} ${gapMidY}, ${nxt.x} ${yEnter}`);

      // Run straight down into next station platform
      parts.push(`L ${nxt.x} ${nxt.y}`);
    }

    // Extend past the last station down to the end of the last card
    const sLast = stationsData[stationsData.length - 1];
    // Extend all the way to bottom of the card + 24px buffer
    const endY = sLast.cardBottom + 24;
    parts.push(`L ${sLast.x} ${endY}`);

    const newPath = parts.join(' ');
    setTrackSvgPath(newPath);
    setTrackBounds({ startY: s0.y, endY, endX: sLast.x });
  }, [chapters]);

  // 2. Measure total track length whenever path updates
  useEffect(() => {
    const pathEl = trackPathRef.current;
    if (!pathEl) return;

    try {
      const totalLen = pathEl.getTotalLength();
      if (totalLen > 0) {
        setTotalTrackLength(totalLen);
      }
    } catch {
      // Path not measured yet
    }
  }, [trackSvgPath]);

  // 3. Pixel-Perfect Monotonic Scroll & Locomotive Position Synchronization
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const container = storyContainerRef.current;
          const pathEl = trackPathRef.current;
          if (!container || chapters.length === 0) {
            ticking = false;
            return;
          }

          const windowHeight = window.innerHeight;
          // Natural reading focal plane: 45% down from viewport top
          const focalY = windowHeight * 0.45;
          const containerRect = container.getBoundingClientRect();
          const currentY = focalY - containerRect.top;

          const totalLen = pathEl ? pathEl.getTotalLength() : totalTrackLength;

          if (totalLen > 0 && pathEl) {
            const { startY, endY } = trackBounds;

            let targetDist = 0;
            if (currentY <= startY) {
              // Above Station 1: Train rests cleanly at Station 1
              targetDist = Math.min(24, totalLen * 0.01);
            } else if (currentY >= endY) {
              // At or below bottom of final card: Train reaches the very end of the line
              targetDist = totalLen;
            } else {
              // High-precision 16-step binary search along strictly monotonic Y-axis
              let low = 0;
              let high = totalLen;
              for (let iter = 0; iter < 16; iter++) {
                const mid = (low + high) * 0.5;
                const pt = pathEl.getPointAtLength(mid);
                if (pt.y < currentY) {
                  low = mid;
                } else {
                  high = mid;
                }
              }
              targetDist = (low + high) * 0.5;
            }

            setTrainTravelDist(targetDist);

            const safeDist = Math.max(0, Math.min(totalLen, targetDist));
            const pt = pathEl.getPointAtLength(safeDist);
            const ptAhead = pathEl.getPointAtLength(Math.min(totalLen, safeDist + 4));
            const ptBehind = pathEl.getPointAtLength(Math.max(0, safeDist - 4));
            const angle = Math.atan2(ptAhead.y - ptBehind.y, ptAhead.x - ptBehind.x) * (180 / Math.PI);
            setTrainPos({ x: pt.x, y: pt.y, angle });
          }

          // Active Chapter Index: Highlights card when top reaches reading zone
          let newActiveIdx = 0;
          chapters.forEach((ch, idx) => {
            const el = document.getElementById(ch.id);
            if (el) {
              const r = el.getBoundingClientRect();
              if (r.top <= windowHeight * 0.60) {
                newActiveIdx = idx;
              }
            }
          });
          setActiveChapterIndex(newActiveIdx);

          // Top progress bar ratio
          const totalDistance = containerRect.height - windowHeight * 0.4;
          if (totalDistance > 0) {
            const traveled = (windowHeight * 0.5) - containerRect.top;
            const ratio = Math.max(0, Math.min(1, traveled / totalDistance));
            setScrollProgress(ratio);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', () => {
      computeTrackGeometry();
      handleScroll();
    }, { passive: true });

    // Initial triggers
    computeTrackGeometry();
    handleScroll();

    // ResizeObserver watches for dynamic height changes (image rendering)
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && storyContainerRef.current) {
      ro = new ResizeObserver(() => {
        computeTrackGeometry();
        handleScroll();
      });
      ro.observe(storyContainerRef.current);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', computeTrackGeometry);
      if (ro) ro.disconnect();
    };
  }, [chapters, computeTrackGeometry, totalTrackLength, trackBounds]);

  const scrollToChapter = (chapterId: string) => {
    const el = document.getElementById(chapterId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleToggleSave = () => {
    if (!article) return;
    const saved = toggleSaveArticle(article);
    setIsSaved(saved);
  };

  const handleAskRailAi = (prompt: string) => {
    window.dispatchEvent(new CustomEvent('rail-ai:open', { detail: { prompt } }));
  };

  const getAiPrompts = (art: BlogArticle): string[] => {
    switch (art.slug) {
      case 'konkan-railway-scenic-odyssey':
        return [
          'What is the best month to see Dudhsagar Falls by train?',
          'Which side has Arabian Sea views on Mandovi Express from Mumbai to Goa?',
          'Why does Indian Railways operate a special Monsoon Timetable on Konkan Railway?'
        ];
      case 'vande-bharat-evolution-future-sleeper':
        return [
          'How does the Kavach anti-collision system work on Vande Bharat?',
          'When will Vande Bharat Sleeper trains launch for overnight routes?',
          'What is the top speed and acceleration of Vande Bharat 2.0?'
        ];
      case 'pamban-sea-bridge-rameswaram':
        return [
          'Is the new Pamban vertical lift sea bridge operational for passenger trains?',
          'Which trains run from Chennai to Rameswaram over the sea?',
          'Why do trains run at 10-15 km/h across the Pamban rail bridge?'
        ];
      case 'csmt-mumbai-unesco-gothic-wonder':
        return [
          'What are the most famous heritage trains departing from CSMT Mumbai?',
          'Why is CSMT designated as a UNESCO World Heritage site?',
          'How many platforms are there at CSMT Mumbai?'
        ];
      case 'kalka-shimla-unesco-toy-train':
        return [
          'How can I book the Him Darshan Vistadome toy train on IRCTC?',
          'What is the story of Colonel Barog and Tunnel 33 on Kalka-Shimla line?',
          'What is the travel duration from Kalka to Shimla by toy train?'
        ];
      case 'nilgiri-mountain-railway-rack-pinion':
        return [
          'Why does the steam engine push the train from behind on Nilgiri Mountain Railway?',
          'How far in advance do Ooty toy train tickets open on IRCTC?',
          'What is the route between Mettupalayam and Ooty?'
        ];
      case 'mastering-irctc-tatkal-booking-rules':
        return [
          'What are the exact Tatkal opening hours for AC and Sleeper tickets?',
          'When is the 1st and final reservation chart prepared for trains departing after 2 PM?',
          'How to pre-save passenger details in IRCTC Master List before 10 AM?'
        ];
      case 'iconic-station-food-indian-railways':
        return [
          'How to order food directly to my train seat using IRCTC e-Catering?',
          'What are the most famous station snacks in Madhya Pradesh and South India?',
          'Which stations are known for authentic Kulhad Chai?'
        ];
      default:
        return [
          `Tell me more about the history of ${art.title}`,
          `Which trains run on this route in India?`,
          `What are the best travel tips for this journey?`
        ];
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share && article) {
      navigator.share({
        title: article.title,
        text: article.subtitle,
        url: url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getQuickFactIcon = (iconName?: string) => {
    switch (iconName) {
      case 'route': return <Route className="w-4 h-4 text-emerald-400" />;
      case 'zap': return <Zap className="w-4 h-4 text-amber-400" />;
      case 'shield': return <Shield className="w-4 h-4 text-blue-400" />;
      case 'layers': return <Layers className="w-4 h-4 text-purple-400" />;
      case 'award': return <Award className="w-4 h-4 text-amber-400" />;
      case 'clock': return <Clock className="w-4 h-4 text-indigo-400" />;
      default: return <Compass className="w-4 h-4 text-emerald-400" />;
    }
  };

  if (loading && !article) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading Railway Story...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Story Not Found</h2>
        <p className="text-xs text-slate-400 mb-4 max-w-sm">The article you are looking for may have been moved or archived.</p>
        <button 
          onClick={() => navigate('/blogs')}
          className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
        >
          Back to Rail Stories
        </button>
      </div>
    );
  }

  const moreArticles = FALLBACK_BLOGS.filter(a => a.id !== article.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 pt-4 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500/30">
      
      {/* Mobile Top Sticky Railway Progress Track */}
      <div className="lg:hidden sticky top-14 z-30 -mx-4 px-4 py-2 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2 overflow-hidden">
          <Train className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-bold text-slate-200 truncate">
            {chapters[activeChapterIndex]?.title || article.title}
          </span>
        </div>
        <span className="text-[11px] font-mono font-bold text-emerald-400 shrink-0">
          Ch {activeChapterIndex + 1}/{chapters.length}
        </span>
        <div className="absolute bottom-0 left-0 h-[2.5px] bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 transition-all duration-150" style={{ width: `${Math.round(scrollProgress * 100)}%` }} />
      </div>

      <article className="max-w-6xl mx-auto space-y-10">
        
        {/* Top Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button 
              onClick={() => navigate('/blogs')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Stories</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-500">{article.category}</span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleToggleSave}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                isSaved
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isSaved ? 'Remove from Saved' : 'Save for Offline Journey'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>{isSaved ? 'Saved for Journey' : 'Save Story'}</span>
            </button>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Article Header */}
        <header className="space-y-4 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-md text-xs font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {article.category}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" /> {article.readTimeMinutes} min read
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> {article.publishedDate}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
            {article.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            {article.subtitle}
          </p>

          {/* Author Badge */}
          <div className="flex items-center gap-3 pt-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm shadow-inner">
              {article.author.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{article.author}</p>
              <p className="text-xs text-slate-400">{article.authorRole}</p>
            </div>
          </div>
        </header>

        {/* Crystal-Clear Enhanced Main Cover Image */}
        <div className="relative w-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 aspect-[16/9] sm:aspect-[21/9] group">
          <img 
            src={article.coverImage} 
            alt={article.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            style={{ imageRendering: '-webkit-optimize-contrast' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/blogs/vande-bharat-evolution-future-sleeper-1.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/60 text-xs text-slate-200">
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">Full HD Verified Heritage Photograph</span>
          </div>
        </div>

        {/* Audio Narration Player */}
        <AudioStoryPlayer article={article} />

        {/* Quick Facts Strip */}
        {article.quickFacts && article.quickFacts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-xl">
            {article.quickFacts.map((fact, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  {getQuickFactIcon(fact.icon)}
                  <span>{fact.label}</span>
                </div>
                <p className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {fact.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ZIG-ZAG CHAPTER STORY SECTION WITH SWITCHBACK MOUNTAIN RAILWAY TRACK */}
        {/* ========================================================================= */}
        <div ref={storyContainerRef} className="relative pt-6">
          
          {/* Full-Container Continuous Mountain Switchback Railway Track SVG */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
            style={{ minHeight: '100%' }}
          >
            <defs>
              {/* Active Glowing Electric Rail Gradient */}
              <linearGradient id="switchbackRailGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
                <stop offset="50%" stopColor="#34d399" stopOpacity="1" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="1" />
              </linearGradient>

              {/* Outer Neon Glow Filter */}
              <filter id="switchbackGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {trackSvgPath && (
              <>
                {/* Layer 1: Ballast Bed Foundation */}
                <path
                  d={trackSvgPath}
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="28"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-90"
                />

                {/* Layer 2: Wooden Railway Sleepers (Ties) spaced along the curves */}
                <path
                  d={trackSvgPath}
                  fill="none"
                  stroke="#475569"
                  strokeWidth="20"
                  strokeDasharray="4 12"
                  strokeLinecap="butt"
                  strokeLinejoin="round"
                  className="opacity-70"
                />

                {/* Layer 3: Dual Steel Rails (Base 12px with 7px dark center slot) */}
                <path
                  d={trackSvgPath}
                  fill="none"
                  stroke="#334155"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={trackSvgPath}
                  fill="none"
                  stroke="#030712"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Layer 4: Hidden reference path for exact mathematical length & point queries */}
                <path
                  ref={trackPathRef}
                  d={trackSvgPath}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="1"
                />

                {/* Layer 5: Live Glowing Electric Progress Line (fills up behind the locomotive with 0 latency) */}
                <path
                  d={trackSvgPath}
                  fill="none"
                  stroke="url(#switchbackRailGlow)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={`${totalTrackLength} ${totalTrackLength}`}
                  strokeDashoffset={Math.max(0, totalTrackLength - trainTravelDist)}
                  filter="url(#switchbackGlowFilter)"
                />
                <path
                  d={trackSvgPath}
                  fill="none"
                  stroke="#fef08a"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={`${totalTrackLength} ${totalTrackLength}`}
                  strokeDashoffset={Math.max(0, totalTrackLength - trainTravelDist)}
                />
              </>
            )}
          </svg>

          {/* End-of-Line Terminal Railway Buffer Stop Bumper */}
          {trackSvgPath && trackBounds && (
            <div 
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex flex-col items-center"
              style={{ 
                left: `${trackBounds.endX}px`, 
                top: `${trackBounds.endY}px` 
              }}
            >
              <div className="w-10 h-3.5 rounded bg-slate-900 border-2 border-slate-700 shadow-xl flex items-center justify-center">
                <div className="w-6 h-1 rounded-full bg-amber-400" />
              </div>
              <span className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest mt-1">
                TERMINUS
              </span>
            </div>
          )}

          {/* Animated Moving Mountain Locomotive Engine Indicator (Zero CSS latency for buttery 120fps sync) */}
          {trackSvgPath && (
            <div 
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none will-change-transform"
              style={{ 
                left: `${trainPos.x}px`,
                top: `${trainPos.y}px`,
                transform: `translate(-50%, -50%) rotate(${trainPos.angle - 90}deg)`
              }}
            >
              <div className="relative w-10 h-10 rounded-full bg-slate-900 border-2 border-amber-400 flex items-center justify-center shadow-[0_0_24px_rgba(251,191,36,0.95)]">
                {/* Forward Headlight Beam */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-6 h-8 bg-gradient-to-t from-amber-300/60 to-transparent blur-sm rounded-full pointer-events-none" />
                <Train className="w-5 h-5 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
              </div>
            </div>
          )}

          {/* Chapters Container: Alternating Left & Right Stations with Switchback Track Passing Through Gaps */}
          <div className="space-y-16 sm:space-y-24">
            {chapters.map((ch, idx) => {
              const isStationOnLeft = idx % 2 === 0;
              const isEven = idx % 2 === 0;
              const isActive = activeChapterIndex === idx;
              const isPassed = activeChapterIndex > idx;

              return (
                <div 
                  key={ch.id} 
                  id={ch.id}
                  className={`relative flex items-start gap-3 sm:gap-6 lg:gap-8 scroll-mt-24 group/chapter ${
                    isStationOnLeft ? 'flex-row' : 'flex-row-reverse'
                  }`}
                >
                  {/* Milestone Station Node - Perfectly Aligned Beside THIS Card */}
                  <div className="shrink-0 w-10 sm:w-14 lg:w-16 flex flex-col items-center pt-6 z-10">
                    <button
                      type="button"
                      onClick={() => scrollToChapter(ch.id)}
                      title={`Jump to Chapter ${idx + 1}: ${ch.title}`}
                      className={`group relative flex items-center justify-center cursor-pointer transition-all ${
                        isActive ? 'scale-125' : 'hover:scale-110'
                      }`}
                    >
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-black font-mono transition-all duration-300 ${
                        isActive 
                          ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/40 shadow-[0_0_18px_rgba(251,191,36,1)] scale-110' 
                          : isPassed
                          ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.8)]'
                          : 'bg-slate-900 border-2 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                      }`}>
                        {idx + 1}
                      </div>

                      {/* Station Name Label Tag */}
                      <span className={`absolute -bottom-5 text-[9px] font-bold font-mono tracking-wider transition-colors ${
                        isActive ? 'text-amber-400 font-black' : isPassed ? 'text-emerald-400' : 'text-slate-500'
                      }`}>
                        CH {String(idx + 1).padStart(2, '0')}
                      </span>

                      {/* Hover Tooltip with Chapter Title (Desktop hover only) */}
                      <div className={`absolute hidden sm:block px-2.5 py-1 rounded-md bg-slate-900/95 border border-slate-700 text-[11px] font-semibold text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-30 ${
                        isStationOnLeft ? 'left-12 sm:left-14' : 'right-12 sm:right-14'
                      }`}>
                        Chapter {idx + 1}: {ch.title}
                      </div>
                    </button>
                  </div>

                  {/* Chapter Card Section in Zig-Zag Layout */}
                  <section className="flex-1 min-w-0 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900/80 via-slate-950/70 to-slate-900/40 backdrop-blur-md shadow-2xl transition-all hover:border-slate-700">
                    
                    {/* Chapter Header Badge */}
                    <div className="flex items-center gap-2 mb-6">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>MILESTONE {String(idx + 1).padStart(2, '0')}</span>
                      </div>
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
                    </div>

                    {/* Alternating Zig-Zag Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                      
                      {/* EVEN CHAPTER: Text on Left (7 cols), Image on Right (5 cols) */}
                      {isEven ? (
                        <>
                          {/* Info Column */}
                          <div className="md:col-span-7 space-y-4">
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
                              {ch.title}
                            </h2>

                            <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
                              {ch.paragraphs.map((p, pIdx) => (
                                <p key={pIdx} className="whitespace-pre-line">
                                  {p}
                                </p>
                              ))}
                            </div>

                            {/* Callout Box if present */}
                            {ch.callout && (
                              <div className={`mt-5 p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed ${
                                ch.callout.type === 'tip'
                                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                  : ch.callout.type === 'trivia'
                                  ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-100'
                                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100 italic'
                              }`}>
                                <div className="flex items-center gap-1.5 font-bold mb-1 uppercase tracking-wider text-xs">
                                  {ch.callout.type === 'tip' ? (
                                    <>
                                      <Lightbulb className="w-4 h-4 text-amber-400" />
                                      <span className="text-amber-400">{ch.callout.title || 'Pro Traveler Tip'}</span>
                                    </>
                                  ) : ch.callout.type === 'trivia' ? (
                                    <>
                                      <Sparkles className="w-4 h-4 text-indigo-400" />
                                      <span className="text-indigo-400">{ch.callout.title || 'Did You Know?'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Compass className="w-4 h-4 text-emerald-400" />
                                      <span className="text-emerald-400">{ch.callout.title || 'Heritage Lore'}</span>
                                    </>
                                  )}
                                </div>
                                <p>{ch.callout.content}</p>
                              </div>
                            )}
                          </div>

                          {/* Image Column */}
                          <div className="md:col-span-5">
                            {ch.image && (
                              <div className="space-y-2">
                                <div className="group relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl aspect-[4/3] max-h-[360px]">
                                  <img 
                                    src={ch.image.url} 
                                    alt={ch.image.altText || ch.title} 
                                    referrerPolicy="no-referrer"
                                    loading="lazy"
                                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                    style={{ imageRendering: '-webkit-optimize-contrast' }}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/images/blogs/vande-bharat-evolution-future-sleeper-2.jpg';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-slate-700/60 text-[10px] font-bold text-emerald-400">
                                    HD 1080p
                                  </div>
                                </div>
                                {ch.image.caption && (
                                  <p className="text-center text-xs text-slate-400 italic px-2">
                                    📸 {ch.image.caption}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        /* ODD CHAPTER: Image on Left (5 cols), Text on Right (7 cols) */
                        <>
                          {/* Image Column */}
                          <div className="md:col-span-5 order-2 md:order-1">
                            {ch.image && (
                              <div className="space-y-2">
                                <div className="group relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl aspect-[4/3] max-h-[360px]">
                                  <img 
                                    src={ch.image.url} 
                                    alt={ch.image.altText || ch.title} 
                                    referrerPolicy="no-referrer"
                                    loading="lazy"
                                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                    style={{ imageRendering: '-webkit-optimize-contrast' }}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/images/blogs/vande-bharat-evolution-future-sleeper-3.jpg';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-slate-700/60 text-[10px] font-bold text-cyan-400">
                                    HD 1080p
                                  </div>
                                </div>
                                {ch.image.caption && (
                                  <p className="text-center text-xs text-slate-400 italic px-2">
                                    📸 {ch.image.caption}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Info Column */}
                          <div className="md:col-span-7 order-1 md:order-2 space-y-4">
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
                              {ch.title}
                            </h2>

                            <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
                              {ch.paragraphs.map((p, pIdx) => (
                                <p key={pIdx} className="whitespace-pre-line">
                                  {p}
                                </p>
                              ))}
                            </div>

                            {/* Callout Box if present */}
                            {ch.callout && (
                              <div className={`mt-5 p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed ${
                                ch.callout.type === 'tip'
                                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                  : ch.callout.type === 'trivia'
                                  ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-100'
                                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100 italic'
                              }`}>
                                <div className="flex items-center gap-1.5 font-bold mb-1 uppercase tracking-wider text-xs">
                                  {ch.callout.type === 'tip' ? (
                                    <>
                                      <Lightbulb className="w-4 h-4 text-amber-400" />
                                      <span className="text-amber-400">{ch.callout.title || 'Pro Traveler Tip'}</span>
                                    </>
                                  ) : ch.callout.type === 'trivia' ? (
                                    <>
                                      <Sparkles className="w-4 h-4 text-indigo-400" />
                                      <span className="text-indigo-400">{ch.callout.title || 'Did You Know?'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Compass className="w-4 h-4 text-emerald-400" />
                                      <span className="text-emerald-400">{ch.callout.title || 'Heritage Lore'}</span>
                                    </>
                                  )}
                                </div>
                                <p>{ch.callout.content}</p>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                    </div>
                  </section>
                </div>
              );
            })}
          </div>

        </div>

        {/* Featured Trains in this Article (Interactive Deep Linking) */}
        {article.relatedTrains && article.relatedTrains.length > 0 && (
          <div className="p-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <Train className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">Trains Featured in this Story</h3>
            </div>
            <p className="text-xs text-slate-400">
              Track live positions, timetables, and ticket fare calculations directly in the app:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {article.relatedTrains.map((tr, i) => (
                <div 
                  key={i}
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/90 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                      {tr.trainNumber}
                    </span>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{tr.trainName}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{tr.route}</p>
                  </div>

                  <button
                    onClick={() => navigate(`/trains/${tr.trainNumber}`)}
                    className="mt-3 w-full py-1.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Track Train</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags Bar */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Topic Tags:</span>
          {article.tags.map((tag, i) => (
            <span 
              key={i}
              className="text-xs bg-slate-900 text-slate-300 px-3 py-1 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Interactive Ask RailAI Section */}
        <div className="p-6 rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Ask RailAI About This Journey</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">Gemini 2.5 Flash</span>
                </h3>
                <p className="text-xs text-slate-400">Tap any question below to get instant AI travel insights:</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {getAiPrompts(article).map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleAskRailAi(prompt)}
                className="text-left p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/20 text-xs text-slate-300 hover:text-white transition-all cursor-pointer flex items-start gap-2 group"
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="line-clamp-2 leading-relaxed">{prompt}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Passenger Travel Tips & Community Section */}
        <ArticleCommunityTips slug={article.slug} />

        {/* Read More Stories Section */}
        <section className="pt-10 border-t border-slate-800/80 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              <span>More Rail Stories</span>
            </h3>
            <button 
              onClick={() => navigate('/blogs')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              View All Stories →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {moreArticles.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/blogs/${item.slug}`)}
                className="group p-3 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 transition-all cursor-pointer space-y-2.5"
              >
                <div className="h-32 rounded-xl overflow-hidden bg-slate-800 relative">
                  <img 
                    src={item.coverImage} 
                    alt={item.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    style={{ imageRendering: '-webkit-optimize-contrast' }}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/blogs/vande-bharat-evolution-future-sleeper-1.jpg';
                    }}
                  />
                  <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-950/80 text-emerald-400 backdrop-blur-md">
                    {item.category}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" /> {item.readTimeMinutes} min read
                </p>
              </div>
            ))}
          </div>
        </section>

      </article>
    </div>
  );
}
