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
  Check
} from 'lucide-react';
import { getBlogs, getBlogCategories } from '../services/api';
import type { BlogArticle } from '../types';
import { FALLBACK_BLOGS, BLOG_CATEGORIES } from '../data/fallbackBlogs';

export default function Blogs() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<BlogArticle[]>(FALLBACK_BLOGS);
  const [categories, setCategories] = useState<string[]>(BLOG_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchArticles = async () => {
      try {
        const [resArticles, resCategories] = await Promise.allSettled([
          getBlogs(selectedCategory, searchQuery),
          getBlogCategories()
        ]);

        if (isMounted) {
          if (resArticles.status === 'fulfilled' && resArticles.value?.data) {
            setArticles(resArticles.value.data);
          } else {
            // Fallback filtering locally
            let filtered = FALLBACK_BLOGS;
            if (selectedCategory !== 'All') {
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
          }

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
  }, [selectedCategory, searchQuery]);

  const featuredArticle = articles.find(a => a.featured) || articles[0];
  const regularArticles = articles.filter(a => a.id !== featuredArticle?.id);

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 pt-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
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
            <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-2xl">
              Immerse yourself in scenic mountain routes, high-speed train engineering, heritage legacies, and insider booking hacks across Indian Railways.
            </p>
          </div>

          {/* Quick Counter */}
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Showing <strong className="text-white">{articles.length}</strong> curated articles</span>
          </div>
        </div>

        {/* Featured Story Hero Card */}
        {featuredArticle && !searchQuery && selectedCategory === 'All' && (
          <div 
            onClick={() => navigate(`/blogs/${featuredArticle.slug}`)}
            className="group relative cursor-pointer overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl transition-all duration-300 hover:border-emerald-500/50 hover:shadow-emerald-950/30"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
              
              {/* Image Side */}
              <div className="lg:col-span-7 relative h-64 sm:h-80 lg:h-full overflow-hidden">
                <img 
                  src={featuredArticle.coverImage} 
                  alt={featuredArticle.title} 
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent lg:hidden" />
                
                {/* Spotlight Badge */}
                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-lg">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>FEATURED STORY</span>
                </div>
              </div>

              {/* Text Side */}
              <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-gradient-to-b from-slate-900 to-slate-950">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {featuredArticle.category}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {featuredArticle.readTimeMinutes} min read
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white group-hover:text-emerald-400 transition-colors leading-tight">
                    {featuredArticle.title}
                  </h2>

                  <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed">
                    {featuredArticle.subtitle}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {featuredArticle.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-[11px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded-md border border-slate-700/50">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Info */}
                <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                      {featuredArticle.author.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{featuredArticle.author}</p>
                      <p className="text-[10px] text-slate-400">{featuredArticle.publishedDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => handleShare(e, featuredArticle.slug)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Share Article"
                    >
                      {copiedSlug === featuredArticle.slug ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                      Read Story <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>

              </div>
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
          </div>
        </div>

        {/* Regular Articles Grid */}
        {articles.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-800 bg-slate-900/40">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No Stories Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No railway articles matched your search query or selected category filter. Try clearing filters or searching for terms like "Konkan", "Vande Bharat", or "Tatkal".
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
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    
                    {/* Category Pill Over Image */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-slate-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                      {article.category}
                    </span>

                    <button 
                      onClick={(e) => handleShare(e, article.slug)}
                      className="absolute top-3 right-3 p-2 rounded-lg bg-slate-950/80 backdrop-blur-md text-slate-300 hover:text-white transition-colors"
                      title="Share Article"
                    >
                      {copiedSlug === article.slug ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>
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
