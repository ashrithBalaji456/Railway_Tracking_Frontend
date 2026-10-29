import type { BlogArticle } from '../types';

const STORAGE_KEY = 'rail_tracker_saved_stories';

export const getSavedArticleSlugs = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const isArticleSaved = (slug: string): boolean => {
  const list = getSavedArticleSlugs();
  return list.includes(slug);
};

export const toggleSaveArticle = (article: BlogArticle): boolean => {
  try {
    const list = getSavedArticleSlugs();
    const exists = list.includes(article.slug);
    let updated: string[];
    if (exists) {
      updated = list.filter(s => s !== article.slug);
    } else {
      updated = [article.slug, ...list];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Also cache the full article object for offline reading
    const articleStorageKey = `rail_story_${article.slug}`;
    if (exists) {
      localStorage.removeItem(articleStorageKey);
    } else {
      localStorage.setItem(articleStorageKey, JSON.stringify(article));
    }

    return !exists;
  } catch (err) {
    console.warn('Failed to update saved stories:', err);
    return false;
  }
};

export const getOfflineCachedArticle = (slug: string): BlogArticle | null => {
  try {
    const raw = localStorage.getItem(`rail_story_${slug}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
