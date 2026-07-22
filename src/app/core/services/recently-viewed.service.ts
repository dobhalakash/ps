import { Injectable } from '@angular/core';

const STORAGE_KEY = 'trackhub_recently_viewed';
const MAX_ITEMS = 10;

/**
 * Tracks recently-viewed product ids in localStorage (no backend needed -
 * this is purely a per-browser convenience, not account data).
 */
@Injectable({ providedIn: 'root' })
export class RecentlyViewedService {

  record(productId: number): void {
    try {
      const ids = this.getIds().filter(id => id !== productId);
      ids.unshift(productId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_ITEMS)));
    } catch {
      // localStorage unavailable - silently skip, not critical functionality.
    }
  }

  /** Returns recently viewed ids, optionally excluding one (e.g. the product currently being viewed). */
  getIds(excludeId?: number): number[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const ids: number[] = raw ? JSON.parse(raw) : [];
      return excludeId ? ids.filter(id => id !== excludeId) : ids;
    } catch {
      return [];
    }
  }
}
