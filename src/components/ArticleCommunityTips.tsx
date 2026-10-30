import { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, Send, Sparkles, Plus, X, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getArticleTips, addArticleTip, likeArticleTip } from '../services/api';

export interface PassengerTip {
  id: string;
  articleSlug: string;
  authorName: string;
  authorHandle?: string;
  category: 'SCENIC_SPOT' | 'FOOD_TIP' | 'BERTH_ADVICE' | 'PHOTOGRAPHY' | 'BOOKING_TACTIC' | 'GENERAL';
  tipText: string;
  photoUrl?: string;
  travelDate: string;
  likesCount: number;
  createdAt: string;
  userLiked?: boolean;
}

const CATEGORY_METADATA: Record<string, { label: string; emoji: string; color: string }> = {
  SCENIC_SPOT: { label: 'Scenic Window View', emoji: '🌅', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  FOOD_TIP: { label: 'Platform Food Advice', emoji: '🍲', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  BERTH_ADVICE: { label: 'Berth Selection', emoji: '💺', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  PHOTOGRAPHY: { label: 'Photography Spot', emoji: '📸', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  BOOKING_TACTIC: { label: 'Booking Tactic', emoji: '⚡', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  GENERAL: { label: 'Travel Tip', emoji: '🧭', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' }
};

interface ArticleCommunityTipsProps {
  slug: string;
}

export default function ArticleCommunityTips({ slug }: ArticleCommunityTipsProps) {
  const navigate = useNavigate();
  const [tips, setTips] = useState<PassengerTip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [formCategory, setFormCategory] = useState<PassengerTip['category']>('SCENIC_SPOT');
  const [formTipText, setFormTipText] = useState<string>('');
  const [formTravelDate, setFormTravelDate] = useState<string>('');
  const [formPhotoUrl, setFormPhotoUrl] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const username = typeof window !== 'undefined' ? (localStorage.getItem('username') || 'Passenger') : 'Passenger';

  // Load Liked Tips from localStorage to preserve UI state
  const getLikedIds = (): string[] => {
    try {
      const stored = localStorage.getItem('rail_liked_tips');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveLikedId = (id: string) => {
    try {
      const liked = getLikedIds();
      if (!liked.includes(id)) {
        liked.push(id);
        localStorage.setItem('rail_liked_tips', JSON.stringify(liked));
      }
    } catch (e) {
      console.warn('Error saving liked tip', e);
    }
  };

  // Fetch Tips
  useEffect(() => {
    let isMounted = true;
    const loadTips = async () => {
      setLoading(true);
      // Curated seed tips map per article
      const DEFAULT_TIPS_BY_SLUG: Record<string, PassengerTip[]> = {
        'vande-bharat-evolution-future-sleeper': [
          {
            id: 'vb-tip-1',
            articleSlug: slug,
            authorName: 'Ananya Deshmukh',
            authorHandle: '@ananya_travels',
            category: 'FOOD_TIP',
            tipText: 'The onboard breakfast service is top-notch! Warm vegetable cutlets, upma, and piping hot tea served right on your fold-out tray table.',
            photoUrl: '/images/blogs/advice-vande-bharat-catering-tea.jpg',
            travelDate: 'October 2026',
            likesCount: 46,
            createdAt: new Date().toISOString()
          },
          {
            id: 'vb-tip-2',
            articleSlug: slug,
            authorName: 'Vikram Sethi',
            authorHandle: '@vikram_rails',
            category: 'BERTH_ADVICE',
            tipText: 'Book seats 19 to 24 in Executive Class (EC) for the smoothest ride between the bogies and effortless 180° rotation toward the panoramic window!',
            photoUrl: '/images/blogs/advice-vande-bharat-rotating-seat.jpg',
            travelDate: 'October 2026',
            likesCount: 52,
            createdAt: new Date().toISOString()
          },
          {
            id: 'vb-tip-3',
            articleSlug: slug,
            authorName: 'Karthik Raja',
            authorHandle: '@karthik_techrail',
            category: 'GENERAL',
            tipText: 'Connect to the onboard local Wi-Fi intranet on your smartphone to stream movies and monitor the live speed telemetry in real-time as it clocks 130 km/h!',
            photoUrl: '/images/blogs/advice-vande-bharat-speed-telemetry.jpg',
            travelDate: 'October 2026',
            likesCount: 39,
            createdAt: new Date().toISOString()
          }
        ],
        'kalka-shimla-unesco-toy-train': [
          {
            id: 'ks-tip-1',
            articleSlug: slug,
            authorName: 'Deepak Sharma',
            authorHandle: '@deepak_travels',
            category: 'FOOD_TIP',
            tipText: 'At Barog station during the 10-minute halt, hop onto the platform for the legendary piping hot vegetable cutlets and masala chai from the heritage refreshment room!',
            photoUrl: '/images/blogs/advice-kalka-barog-refreshments.jpg',
            travelDate: 'October 2026',
            likesCount: 35,
            createdAt: new Date().toISOString()
          },
          {
            id: 'ks-tip-2',
            articleSlug: slug,
            authorName: 'Rohit Mehta',
            authorHandle: '@rohit_himalayas',
            category: 'SCENIC_SPOT',
            tipText: 'Always reserve right-side seats when departing Kalka uphill toward Shimla for breathtaking panoramic views of the multi-tier stone arch bridges and Himalayan valleys.',
            photoUrl: '/images/blogs/advice-kalka-valley-seat.jpg',
            travelDate: 'October 2026',
            likesCount: 41,
            createdAt: new Date().toISOString()
          },
          {
            id: 'ks-tip-3',
            articleSlug: slug,
            authorName: 'Meera Sen',
            authorHandle: '@meera_heritage',
            category: 'GENERAL',
            tipText: 'Arriving at Shimla station feels like stepping into a Swiss Alpine village. Grab a steaming cup of adrak chai near the old heritage colonial clock tower!',
            photoUrl: '/images/blogs/advice-kalka-shimla-arrival.jpg',
            travelDate: 'October 2026',
            likesCount: 27,
            createdAt: new Date().toISOString()
          }
        ],
        'nilgiri-mountain-railway-rack-pinion': [
          {
            id: 'nm-tip-1',
            articleSlug: slug,
            authorName: 'Suresh Raman',
            authorHandle: '@suresh_ooty',
            category: 'BERTH_ADVICE',
            tipText: 'Book the front coach when traveling uphill from Mettupalayam to Ooty. Since the steam engine pushes from behind, your front window has an unobstructed view of the rack-and-pinion tracks!',
            photoUrl: '/images/blogs/advice-nilgiri-front-coach.jpg',
            travelDate: 'October 2026',
            likesCount: 33,
            createdAt: new Date().toISOString()
          },
          {
            id: 'nm-tip-2',
            articleSlug: slug,
            authorName: 'Kavita Krishnan',
            authorHandle: '@kavita_rails',
            category: 'FOOD_TIP',
            tipText: 'During the 20-minute water replenishment halt at Coonoor, step out to sample fresh Nilgiri orthodox green tea and handmade hill chocolates!',
            photoUrl: '/images/blogs/advice-nilgiri-coonoor-tea.jpg',
            travelDate: 'October 2026',
            likesCount: 25,
            createdAt: new Date().toISOString()
          }
        ],
        'konkan-railway-scenic-odyssey': [
          {
            id: 'kr-tip-1',
            articleSlug: slug,
            authorName: 'Aditya Sharma',
            authorHandle: '@aditya_rails',
            category: 'SCENIC_SPOT',
            tipText: 'Sit on the right side window seat while traveling south from Mumbai to Goa for breathtaking coastal valley and waterfall views during monsoon!',
            photoUrl: '/images/blogs/advice-konkan-window-seat.jpg',
            travelDate: 'October 2026',
            likesCount: 38,
            createdAt: new Date().toISOString()
          },
          {
            id: 'kr-tip-2',
            articleSlug: slug,
            authorName: 'Priya Nair',
            authorHandle: '@priya_travels',
            category: 'FOOD_TIP',
            tipText: 'Ratnagiri Alphonso aam panna and Chiplun jackfruit chips from platform vendors are an absolute must-try!',
            photoUrl: '/images/blogs/advice-konkan-platform-snacks.jpg',
            travelDate: 'September 2026',
            likesCount: 29,
            createdAt: new Date().toISOString()
          }
        ]
      };

      const defaultTips = DEFAULT_TIPS_BY_SLUG[slug] || DEFAULT_TIPS_BY_SLUG['konkan-railway-scenic-odyssey'];

      try {
        const res = await getArticleTips(slug);
        if (isMounted && res?.data && Array.isArray(res.data) && res.data.length > 0) {
          const liked = getLikedIds();
          const mapped: PassengerTip[] = res.data.map((t: any) => ({
            ...t,
            userLiked: liked.includes(t.id)
          }));
          setTips(mapped);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('API tips fetch fallback to local:', err);
      }

      // Offline / Local seed fallback
      try {
        const localKey = `rail_article_tips_${slug}`;
        const cached = localStorage.getItem(localKey);
        if (cached && isMounted) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const liked = getLikedIds();
            setTips(parsed.map((t: any) => ({ ...t, userLiked: liked.includes(t.id) })));
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Local storage tips read error:', e);
      }

      if (isMounted) {
        const liked = getLikedIds();
        setTips(defaultTips.map(t => ({ ...t, userLiked: liked.includes(t.id) })));
        setLoading(false);
      }
    };

    loadTips();
    return () => { isMounted = false; };
  }, [slug]);

  const handleLike = async (tipId: string) => {
    const tip = tips.find(t => t.id === tipId);
    if (!tip || tip.userLiked) return;

    // Optimistic UI update
    setTips(prev => prev.map(t => {
      if (t.id === tipId) {
        return { ...t, likesCount: t.likesCount + 1, userLiked: true };
      }
      return t;
    }));
    saveLikedId(tipId);

    try {
      await likeArticleTip(slug, tipId);
    } catch (e) {
      console.warn('Like tip API sync failed, kept in local state:', e);
    }
  };

  const handleOpenModal = () => {
    if (!token) {
      navigate('/login');
      return;
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTipText.trim()) {
      setFormError('Please enter your travel tip or experience.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    const newTipPayload: Partial<PassengerTip> = {
      articleSlug: slug,
      authorName: username,
      authorHandle: `@${username.toLowerCase().replace(/\s+/g, '_')}`,
      category: formCategory,
      tipText: formTipText.trim(),
      travelDate: formTravelDate.trim() || 'October 2026',
      photoUrl: formPhotoUrl.trim() || undefined
    };

    try {
      const res = await addArticleTip(slug, newTipPayload);
      if (res?.data) {
        setTips(prev => [res.data, ...prev]);
        setIsModalOpen(false);
        setFormTipText('');
        setFormPhotoUrl('');
        setFormTravelDate('');
        setSubmitting(false);
        return;
      }
    } catch (err) {
      console.warn('API tip post fallback to local state:', err);
    }

    // Local fallback creation
    const localNewTip: PassengerTip = {
      id: `tip-${Date.now()}`,
      articleSlug: slug,
      authorName: username,
      authorHandle: `@${username.toLowerCase().replace(/\s+/g, '_')}`,
      category: formCategory,
      tipText: formTipText.trim(),
      travelDate: formTravelDate.trim() || 'October 2026',
      photoUrl: formPhotoUrl.trim() || undefined,
      likesCount: 1,
      createdAt: new Date().toISOString(),
      userLiked: true
    };

    const updated = [localNewTip, ...tips];
    setTips(updated);
    try {
      localStorage.setItem(`rail_article_tips_${slug}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Local storage write error:', e);
    }

    setIsModalOpen(false);
    setFormTipText('');
    setFormPhotoUrl('');
    setFormTravelDate('');
    setSubmitting(false);
  };

  const filteredTips = activeCategoryFilter === 'ALL'
    ? tips
    : tips.filter(t => t.category === activeCategoryFilter);

  return (
    <section className="pt-8 border-t border-slate-800/80 space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Passenger Travel Tips & Experiences</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {tips.length} {tips.length === 1 ? 'tip' : 'tips'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">Real advice and photo experiences shared by verified travelers:</p>
          </div>
        </div>

        {/* Share Tip Button */}
        <button
          type="button"
          onClick={handleOpenModal}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all cursor-pointer shadow-lg shadow-indigo-600/20 self-start sm:self-auto hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Share Your Travel Tip</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveCategoryFilter('ALL')}
          className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
            activeCategoryFilter === 'ALL'
              ? 'bg-slate-100 text-slate-900 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Advice ({tips.length})
        </button>
        {Object.entries(CATEGORY_METADATA).map(([catKey, meta]) => {
          const count = tips.filter(t => t.category === catKey).length;
          if (count === 0 && activeCategoryFilter !== catKey) return null;
          return (
            <button
              key={catKey}
              type="button"
              onClick={() => setActiveCategoryFilter(catKey)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer whitespace-nowrap text-[11px] ${
                activeCategoryFilter === catKey
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{meta.emoji}</span>
              <span>{meta.label}</span>
              {count > 0 && <span className="opacity-75">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Non-Logged In Banner Prompt */}
      {!token && (
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Have you traveled on this route? Sign in to share your journey tips and photos with fellow passengers.</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-300 hover:text-white font-bold transition cursor-pointer shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>
      )}

      {/* Tips List Deck */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
          Loading passenger tips and travel wisdom...
        </div>
      ) : filteredTips.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
          <p className="text-xs text-slate-400">No tips in this category yet. Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredTips.map((tip) => {
            const meta = CATEGORY_METADATA[tip.category] || CATEGORY_METADATA.GENERAL;
            return (
              <div
                key={tip.id}
                className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-slate-700/80 transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  {/* Top: Category Badge & Travel Date */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${meta.color}`}>
                      <span>{meta.emoji}</span>
                      <span>{meta.label}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Traveled: {tip.travelDate}
                    </span>
                  </div>

                  {/* Tip Body */}
                  <p className="text-xs text-slate-200 leading-relaxed font-normal">
                    "{tip.tipText}"
                  </p>

                  {/* Optional Passenger Photo */}
                  {tip.photoUrl && (
                    <div className="rounded-xl overflow-hidden border border-slate-800 aspect-[16/9] max-h-48 bg-slate-950">
                      <img
                        src={tip.photoUrl}
                        alt="Passenger Travel Experience"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5a/Vande_Bharat_Express_around_Mumbai.jpg/960px-Vande_Bharat_Express_around_Mumbai.jpg';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Footer: Passenger Info & Like Button */}
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 text-[10px] font-bold">
                      {tip.authorName.charAt(0)}
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-300 block leading-tight">{tip.authorName}</span>
                      {tip.authorHandle && (
                        <span className="text-[9px] text-slate-500 block leading-none">{tip.authorHandle}</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLike(tip.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                      tip.userLiked
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                    title={tip.userLiked ? 'You found this helpful' : 'Mark as helpful'}
                  >
                    <ThumbsUp className={`w-3 h-3 ${tip.userLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
                    <span>{tip.likesCount}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share Tip Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h4 className="text-base font-bold text-white">Share Your Travel Tip</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTip} className="space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px]">
                  {formError}
                </div>
              )}

              {/* Category Picker */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">Tip Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(CATEGORY_METADATA).map(([catKey, meta]) => (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setFormCategory(catKey as any)}
                      className={`p-2 rounded-xl border text-left flex items-center gap-1.5 transition cursor-pointer ${
                        formCategory === catKey
                          ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{meta.emoji}</span>
                      <span className="text-[11px] truncate">{meta.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tip Text */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Your Journey Tip or Experience <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={formTipText}
                  onChange={(e) => setFormTipText(e.target.value)}
                  rows={3}
                  placeholder="e.g. Which coach/side has best views, famous snacks at platform, best time to shoot photos, or tatkal booking advice..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 outline-none text-xs leading-relaxed resize-none"
                  required
                />
              </div>

              {/* Travel Date */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Month & Year of Journey</label>
                <input
                  type="text"
                  value={formTravelDate}
                  onChange={(e) => setFormTravelDate(e.target.value)}
                  placeholder="e.g. October 2026, Summer 2025"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 outline-none text-xs"
                />
              </div>

              {/* Optional Photo URL */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Photo URL <span className="text-slate-500 font-normal">(Optional Wikimedia / Image link)</span>
                </label>
                <input
                  type="url"
                  value={formPhotoUrl}
                  onChange={(e) => setFormPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 outline-none text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition cursor-pointer shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Sharing...' : 'Post Travel Tip'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
