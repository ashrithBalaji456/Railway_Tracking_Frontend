import { useState, useEffect } from 'react';
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
  Award 
} from 'lucide-react';
import { getBlogBySlug } from '../services/api';
import type { BlogArticle } from '../types';
import { FALLBACK_BLOGS } from '../data/fallbackBlogs';

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchArticle = async () => {
      setLoading(true);
      try {
        if (!slug) return;
        const res = await getBlogBySlug(slug);
        if (isMounted && res?.data) {
          setArticle(res.data);
          return;
        }
      } catch (err) {
        console.warn('Backend unavailable, using fallback article:', err);
      }

      // Fallback lookup
      const found = FALLBACK_BLOGS.find(a => a.slug === slug || a.id === slug);
      if (isMounted) {
        setArticle(found || FALLBACK_BLOGS[0]);
        setLoading(false);
      }
    };

    fetchArticle();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => { isMounted = false; };
  }, [slug]);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 pt-4 px-4 sm:px-6 lg:px-8">
      <article className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Navigation Bar: Back & Breadcrumb */}
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

          <button
            onClick={handleShare}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Share Story</span>
              </>
            )}
          </button>
        </div>

        {/* Article Header Section */}
        <header className="space-y-4">
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
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm">
              {article.author.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{article.author}</p>
              <p className="text-xs text-slate-400">{article.authorRole}</p>
            </div>
          </div>
        </header>

        {/* Main Cover Image */}
        <div className="relative w-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 aspect-[16/9] sm:aspect-[21/9]">
          <img 
            src={article.coverImage} 
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Quick Facts Strip */}
        {article.quickFacts && article.quickFacts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
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

        {/* Structured Article Body */}
        <div className="space-y-8 pt-4">
          {article.sections.map((section, idx) => {
            switch (section.type) {
              
              case 'heading':
                return (
                  <div key={idx} className="pt-4 border-t border-slate-800/60 space-y-3">
                    <h2 className="text-xl sm:text-2xl font-bold text-white pl-3 border-l-4 border-emerald-500">
                      {section.title}
                    </h2>
                    {section.content && (
                      <p className="text-sm sm:text-base text-slate-300 leading-relaxed whitespace-pre-line">
                        {section.content}
                      </p>
                    )}
                  </div>
                );

              case 'paragraph':
                return (
                  <p key={idx} className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                    {section.content}
                  </p>
                );

              case 'image':
                return (
                  <figure key={idx} className="my-6 space-y-2">
                    <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl max-h-[480px]">
                      <img 
                        src={section.imageUrl} 
                        alt={section.altText || section.title || 'Railway photograph'} 
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    {section.imageCaption && (
                      <figcaption className="text-center text-xs text-slate-400 italic px-4">
                        📸 {section.imageCaption}
                      </figcaption>
                    )}
                  </figure>
                );

              case 'tip':
                return (
                  <div key={idx} className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-1.5 shadow-lg shadow-amber-950/10">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                      <Lightbulb className="w-4 h-4" />
                      <span>{section.title || 'Pro Traveler Tip'}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                );

              case 'trivia':
                return (
                  <div key={idx} className="p-4 sm:p-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 space-y-1.5 shadow-lg shadow-indigo-950/10">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" />
                      <span>{section.title || 'Did You Know?'}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                );

              case 'quote':
                return (
                  <blockquote key={idx} className="p-5 rounded-2xl border-l-4 border-emerald-400 bg-slate-900/80 italic text-slate-200 text-sm sm:text-base leading-relaxed">
                    "{section.content}"
                    {section.title && <cite className="block not-italic text-xs text-slate-400 mt-2 font-semibold">— {section.title}</cite>}
                  </blockquote>
                );

              default:
                return null;
            }
          })}
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
        <div className="pt-4 flex flex-wrap items-center gap-2">
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
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
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
