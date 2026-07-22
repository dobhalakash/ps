import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

const CONSENT_KEY = 'trackhub_cookie_consent';

/**
 * Shows a one-time cookie/cache consent banner on first visit. The choice
 * (accepted/declined) is remembered in localStorage so it doesn't reappear
 * on every page load - only when there's no stored decision yet, or it's
 * expired (re-asked once a year).
 */
@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cookie-consent.component.html',
  styleUrl: './cookie-consent.component.css'
})
export class CookieConsentComponent {
  readonly visible = signal(this.shouldShow());

  private shouldShow(): boolean {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return true;
      const { timestamp } = JSON.parse(raw);
      const oneYearMs = 365 * 24 * 60 * 60 * 1000;
      return Date.now() - timestamp > oneYearMs;
    } catch {
      return true;
    }
  }

  accept(): void {
    this.store('accepted');
  }

  decline(): void {
    // We still store the decision so we don't keep re-prompting, but only
    // essential cookies (login session, cart) are ever non-optional -
    // declining just means we won't load optional analytics in the future
    // if/when those are added.
    this.store('declined');
  }

  private store(decision: 'accepted' | 'declined'): void {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ decision, timestamp: Date.now() }));
    } catch {
      // localStorage unavailable (private browsing etc.) - just hide for this session.
    }
    this.visible.set(false);
  }
}
