import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Clock, 
  Sparkles, 
  Compass, 
  ArrowRight, 
  Share2, 
  SlidersHorizontal,
  Check,
  Bookmark,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getBlogs, getBlogCategories } from '../services/api';
import type { BlogArticle } from '../types';
import { FALLBACK_BLOGS, BLOG_CATEGORIES } from '../data/fallbackBlogs';
import { getSavedArticleSlugs, toggleSaveArticle } from '../utils/bookmarkUtils';

export default function Blogs() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<BlogArticle[]>(FALLBACK_BLOGS);
  const [categories, setCategories] = useState<string[]>(BLOG_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [savedSlugs, setSavedSlugs] = useState<string[]>(getSavedArticleSlugs());
  const [featuredIndex, setFeaturedIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchArticles = async () => {
      try {
        const [resArticles, resCategories] = await Promise.allSettled([
          getBlogs(selectedCategory, searchQuery),
          getBlogCategories()
        ]);

        if (isMounted) {
          let baseList = FALLBACK_BLOGS;
          if (resArticles.status === 'fulfilled' && resArticles.value?.data) {
            baseList = resArticles.value.data;
          }

          let filtered = baseList;
          if (selectedCategory === 'Saved Stories') {
            filtered = filtered.filter(a => savedSlugs.includes(a.slug));
          } else if (selectedCategory !== 'All') {
            filtered = filtered.filter(a => a.category.toLowerCase() === selectedCategory.toLowerCase());
          }

          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(a => 
              a.title.toLowerCase().includes(q) || 
              a.subtitle.toLowerCase().includes(q) ||
              a.tags.some(t => t.toLowerCase().includes(q))
            );
          }
          setArticles(filtered);

          if (resCategories.status === 'fulfilled' && resCategories.value?.data) {
            setCategories(resCategories.value.data);
          }
        }
      } catch (err) {
        console.warn('Using fallback blog articles:', err);
      }
    };

    const timer = setTimeout(fetchArticles, 150);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedCategory, searchQuery, savedSlugs]);

  const featuredArticles = React.useMemo(() => {
    const feat = articles.filter(a => a.featured);
    return feat.length >= 4 ? feat.slice(0, 5) : articles.slice(0, 5);
  }, [articles]);

  const currentFeatured = featuredArticles[featuredIndex] || featuredArticles[0];
  const regularArticles = articles;

  // Auto-scroll featured stories every 5 seconds (pauses on hover)
  useEffect(() => {
    if (isPaused || featuredArticles.length <= 1) return;
    const timer = setInterval(() => {
      setFeaturedIndex(prev => (prev + 1) % featuredArticles.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, featuredArticles.length]);

  const handlePrevFeatured = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFeaturedIndex(prev => (prev - 1 + featuredArticles.length) % featuredArticles.length);
  };

  const handleNextFeatured = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFeaturedIndex(prev => (prev + 1) % featuredArticles.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX;
    if (diffX > 50) {
      handlePrevFeatured();
    } else if (diffX < -50) {
      handleNextFeatured();
    }
    setTouchStartX(null);
  };

  const handleShare = (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}/blogs/${slug}`;
    if (navigator.share) {
      navigator.share({
        title: 'Indian Railways Story',
        url: url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  };

  const handleToggleSave = (e: React.MouseEvent, art: BlogArticle) => {
    e.stopPropagation();
    toggleSaveArticle(art);
    setSavedSlugs(getSavedArticleSlugs());
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 pt-4 px-3 sm:px-6 lg:px-8 xl:px-10">
      <div className="max-w-[1560px] w-full mx-auto space-y-8">
        
        {/* Header Title & Subtitle */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
              <Compass className="w-3.5 h-3.5" />
              <span>Rail Chronicles & Travel Intelligence</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white flex items-center gap-3">
              Stories from the Rails
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-3xl">
              Immerse yourself in scenic mountain routes, high-speed train engineering, heritage legacies, and insider booking hacks across Indian Railways.
            </p>
          </div>

          {/* Quick Counter */}
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800 shadow-sm self-start md:self-auto">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Showing <strong className="text-white">{articles.length}</strong> curated articles</span>
          </div>
        </div>

        {/* Top Featured Stories Section (Single Self-Contained Card + 5-Story Deck) */}
        {currentFeatured && !searchQuery && selectedCategory === 'All' && (
          <div className="space-y-4">
            
            {/* Primary Featured Story Hero (Single Self-Contained Card — Never stretches or overflows) */}
            <div 
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="group relative w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl transition-all duration-300 hover:border-emerald-500/40 hover:shadow-emerald-950/30 select-none"
            >
              <div 
                key={currentFeatured.id}
                onClick={() => navigate(`/blogs/${currentFeatured.slug}`)}
                className="w-full grid grid-cols-1 lg:grid-cols-12 min-h-0 lg:min-h-[440px] lg:max-h-[580px] cursor-pointer animate-in fade-in duration-500"
              >
                {/* Balanced Landscape Image Column (5 cols on lg) */}
                <div className="lg:col-span-5 relative h-64 sm:h-80 lg:h-full lg:max-h-[580px] overflow-hidden bg-slate-950 flex items-center justify-center">
                  <img 
                    src={currentFeatured.coverImage} 
                    alt={currentFeatured.title} 
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    style={{ imageRendering: '-webkit-optimize-contrast' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/blogs/vande-bharat-evolution-future-sleeper-1.jpg';
                    }}
                  />
                  
                  {/* Gradient Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-slate-900/20 lg:to-slate-900" />
                  
                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow-lg">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>FEATURED STORY</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-slate-950/80 text-emerald-400 border border-slate-700/60 backdrop-blur-md">
                      {String(featuredIndex + 1).padStart(2, '0')} / {String(featuredArticles.length).padStart(2, '0')}
                    </div>
                  </div>

                  {/* Photo Resolution Badge */}
                  <div className="absolute top-4 right-4 hidden sm:block z-10">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-wider bg-slate-950/80 text-slate-300 border border-slate-700/60 backdrop-blur-md">
                      HD 1080p
                    </span>
                  </div>
                </div>

                {/* Rich Information Side (7 cols on lg) */}
                <div className="lg:col-span-7 p-6 sm:p-8 lg:p-9 flex flex-col justify-between bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 overflow-hidden">
                  <div className="space-y-3.5">
                    
                    {/* Category, Read Time, and Live Auto-Play Status */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {currentFeatured.category}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5" /> {currentFeatured.readTimeMinutes} min read
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-full border border-slate-800">
                        <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
                        <span>{isPaused ? 'PAUSED' : 'AUTO-SCROLLING'}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">
                      {currentFeatured.title}
                    </h2>

                    {/* Subtitle */}
                    <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                      {currentFeatured.subtitle}
                    </p>

                    {/* Editorial Story Excerpt Block */}
                    {currentFeatured.sections && (
                      <div className="relative pl-3 border-l-2 border-emerald-500/70 bg-slate-950/50 p-2.5 rounded-r-xl">
                        <p className="text-[12px] sm:text-xs text-slate-300/90 italic line-clamp-2 leading-relaxed">
                          "{currentFeatured.sections?.find(s => s.content && s.content.length > 60)?.content?.split('\n\n')[0] || currentFeatured.subtitle}"
                        </p>
                      </div>
                    )}

                    {/* 4 Technical Quick Facts in responsive grid */}
                    {currentFeatured.quickFacts && currentFeatured.quickFacts.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                        {currentFeatured.quickFacts.slice(0, 4).map((qf, i) => (
                          <div key={i} className="px-2.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 shadow-sm">
                            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                              {qf.label}
                            </span>
                            <span className="text-xs font-bold text-amber-300 block truncate mt-0.5">
                              {qf.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Related Flagship Express Trains */}
                    {currentFeatured.relatedTrains && currentFeatured.relatedTrains.length > 0 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                          Express Fleet:
                        </span>
                        {currentFeatured.relatedTrains.slice(0, 2).map((tr, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-slate-800/90 text-emerald-300 border border-emerald-500/20 font-medium whitespace-nowrap">
                            <span>🚆</span>
                            <span>{tr.trainName}</span>
                            <span className="text-slate-400 hidden sm:inline">({tr.route.split('➔')[0].trim()} ➔ {tr.route.split('➔')[1]?.trim()})</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {currentFeatured.tags.slice(0, 5).map((tag, i) => (
                        <span key={i} className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/50 font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer Bar: Author & Action Buttons */}
                  <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-3">
                    
                    {/* Author */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                        {currentFeatured.author.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{currentFeatured.author}</p>
                        <p className="text-[10px] text-slate-400">{currentFeatured.authorRole || currentFeatured.publishedDate}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                      <button 
                        type="button"
                        onClick={(e) => handleToggleSave(e, currentFeatured)}
                        className={`p-2 rounded-xl border transition-colors ${
                          savedSlugs.includes(currentFeatured.slug)
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700/60 text-slate-300'
                        }`}
                        title={savedSlugs.includes(currentFeatured.slug) ? 'Remove from Saved' : 'Save for Journey'}
                      >
                        <Bookmark className={`w-4 h-4 ${savedSlugs.includes(currentFeatured.slug) ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => handleShare(e, currentFeatured.slug)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Share Article"
                      >
                        {copiedSlug === currentFeatured.slug ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                      </button>
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 group-hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all">
                        <span>Read Story</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Left & Right Arrow Navigation Buttons */}
              <button
                type="button"
                onClick={handlePrevFeatured}
                title="Previous Featured Story"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/85 hover:bg-emerald-600 text-white flex items-center justify-center border border-slate-700/90 hover:border-emerald-400 transition-all shadow-2xl backdrop-blur-md cursor-pointer z-20 opacity-80 hover:opacity-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNextFeatured}
                title="Next Featured Story"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/85 hover:bg-emerald-600 text-white flex items-center justify-center border border-slate-700/90 hover:border-emerald-400 transition-all shadow-2xl backdrop-blur-md cursor-pointer z-20 opacity-80 hover:opacity-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* 5-Story Preview Cards Deck: All 5 Stories clearly visible and selectable */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
              {featuredArticles.map((art, idx) => {
                const isActive = featuredIndex === idx;
                return (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => setFeaturedIndex(idx)}
                    className={`group relative text-left p-3 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                      isActive
                        ? 'bg-slate-800/95 border-emerald-500 shadow-xl shadow-emerald-950/40 ring-2 ring-emerald-500/50 -translate-y-0.5'
                        : 'bg-slate-900/70 hover:bg-slate-800/60 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="relative h-24 w-full rounded-xl overflow-hidden bg-slate-950 mb-2.5 flex-shrink-0">
                      <img 
                        src={art.coverImage} 
                        alt={art.title} 
                        className={`w-full h-full object-cover transition-transform duration-500 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-950/85 text-emerald-400 border border-slate-700/60 backdrop-blur-md">
                        0{idx + 1}
                      </span>
                      <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md truncate max-w-[85%]">
                        {art.category}
                      </span>
                    </div>

                    <div className="space-y-1 flex-1">
                      <h3 className={`text-xs font-bold line-clamp-2 leading-snug ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                        {art.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {art.subtitle}
                      </p>
                    </div>

                    {isActive ? (
                      <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] font-bold text-emerald-400">
                        <span>Viewing Now</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      </div>
                    ) : (
                      <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 group-hover:text-slate-300">
                        <span>{art.readTimeMinutes}m read</span>
                        <span className="group-hover:translate-x-0.5 transition-transform text-emerald-400">→</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

          </div>
        )}

        {/* Filter Bar: Search + Category Pills */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles, trains, tunnels, or travel tips..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Pill Stats */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Category Filter</span>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    active 
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold' 
                      : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}

            {/* Saved Stories Filter Tab */}
            <button
              onClick={() => setSelectedCategory('Saved Stories')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'Saved Stories'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                  : 'bg-slate-900/90 text-amber-300 border border-amber-500/30 hover:border-amber-500/50'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              <span>Saved for Journey ({savedSlugs.length})</span>
            </button>
          </div>
        </div>

        {/* Regular Articles Grid */}
        {articles.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-800 bg-slate-900/40">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No Stories Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {selectedCategory === 'Saved Stories'
                ? 'You have not saved any stories yet. Tap the bookmark icon on any article to save it for offline reading on your journey!'
                : 'No railway articles matched your search query or selected category filter. Try clearing filters or searching for terms like "Konkan", "Vande Bharat", or "Tatkal".'}
            </p>
            <button 
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-500/20 transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(searchQuery || selectedCategory !== 'All' ? articles : regularArticles).map((article) => (
              <div 
                key={article.id}
                onClick={() => navigate(`/blogs/${article.slug}`)}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/70 hover:bg-slate-900 hover:border-slate-700/80 transition-all duration-300 hover:shadow-xl hover:shadow-black/40 cursor-pointer"
              >
                <div>
                  {/* Card Cover Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-800">
                    <img 
                      src={article.coverImage} 
                      alt={article.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      style={{ imageRendering: '-webkit-optimize-contrast' }}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/blogs/vande-bharat-evolution-future-sleeper-1.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    
                    {/* Category Pill Over Image */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-slate-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                      {article.category}
                    </span>

                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <button 
                        onClick={(e) => handleToggleSave(e, article)}
                        className={`p-2 rounded-lg backdrop-blur-md transition-colors ${
                          savedSlugs.includes(article.slug)
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'bg-slate-950/80 text-slate-300 hover:text-white'
                        }`}
                        title={savedSlugs.includes(article.slug) ? 'Remove from Saved' : 'Save for Journey'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${savedSlugs.includes(article.slug) ? 'fill-current' : ''}`} />
                      </button>

                      <button 
                        onClick={(e) => handleShare(e, article.slug)}
                        className="p-2 rounded-lg bg-slate-950/80 backdrop-blur-md text-slate-300 hover:text-white transition-colors"
                        title="Share Article"
                      >
                        {copiedSlug === article.slug ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" /> {article.readTimeMinutes} min read
                      </span>
                      <span>•</span>
                      <span>{article.publishedDate}</span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                      {article.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {article.subtitle}
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-5 pb-5 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                      {article.author.charAt(0)}
                    </div>
                    <span className="text-xs text-slate-300 font-medium truncate max-w-[130px]">
                      {article.author}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Read <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
