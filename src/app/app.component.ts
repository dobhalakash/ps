import { Component, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { MobileTabbarComponent } from './shared/mobile-tabbar/mobile-tabbar.component';
import { ToastContainerComponent } from './shared/toast-container/toast-container.component';
import { CookieConsentComponent } from './shared/cookie-consent/cookie-consent.component';
import { ActivityLogService } from './core/services/activity-log.service';
import { SupportChatbotComponent } from './shared/support-chatbot/support-chatbot.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, MobileTabbarComponent, ToastContainerComponent, CookieConsentComponent, SupportChatbotComponent],
  template: `
   
    <app-navbar></app-navbar>
    <main>
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
    <app-mobile-tabbar></app-mobile-tabbar>
    <app-toast-container></app-toast-container>
    <app-cookie-consent></app-cookie-consent>
    <app-support-chatbot></app-support-chatbot>
  `,
  styles: [`
    main {
      min-height: calc(100vh - 400px);
    }
    @media (max-width: 768px) {
      main {
        padding-bottom: 58px;
      }
    }

    .sk-splash {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: #0c0f14;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 22px;
      transition: opacity .5s ease, visibility .5s ease;
    }
    .sk-splash--fade {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }

    .sk-splash__logo {
      font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif;
      font-weight: 800;
      display: flex;
      align-items: baseline;
      gap: 4px;
      animation: sk-pop .6s cubic-bezier(.34,1.56,.64,1) both;
    }
    .sk-splash__sk {
      color: #C8102E;
      font-size: 2.8rem;
      line-height: 1;
    }
    .sk-splash__sports {
      color: #fff;
      font-size: 1.4rem;
      letter-spacing: .18em;
      align-self: flex-end;
      margin-bottom: 6px;
    }

    .sk-splash__bar {
      width: 140px;
      height: 3px;
      background: rgba(255,255,255,.12);
      border-radius: 999px;
      overflow: hidden;
    }
    .sk-splash__bar span {
      display: block;
      height: 100%;
      width: 40%;
      background: #C8102E;
      border-radius: 999px;
      animation: sk-loading 1s ease-in-out infinite;
    }

    @keyframes sk-pop {
      0% { opacity: 0; transform: scale(.6); }
      60% { opacity: 1; transform: scale(1.08); }
      100% { opacity: 1; transform: scale(1); }
    }
    @keyframes sk-loading {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(350%); }
    }

    @media (prefers-reduced-motion: reduce) {
      .sk-splash__logo, .sk-splash__bar span { animation: none; }
    }
  `]
})
export class AppComponent {
  title = 'Paras Sports';

  readonly showSplash = signal(true);
  readonly fading = signal(false);

  constructor(private router: Router, private activityLog: ActivityLogService) {
    // Brief branded splash on first load, then fade out smoothly once the
    // app shell is ready - matches the "logo appears with animation and
    // vanishes" behaviour requested.
    setTimeout(() => this.fading.set(true), 900);
    setTimeout(() => this.showSplash.set(false), 1400);

    // Belt-and-braces scroll-to-top: Angular's built-in scroll restoration
    // (withInMemoryScrolling) handles most cases, but pages that finish
    // loading content asynchronously (e.g. after a cancelled/failed
    // payment redirect) can leave the viewport scrolled from the previous
    // page. Forcing this on every completed navigation guarantees a clean
    // top-of-page start no matter how the navigation was triggered.
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(event => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

      // User-flow tracking: record every page visit (anonymous or logged-in)
      // so the admin "User Logs" screen can show who is browsing the site,
      // which pages they move through, and whether they ever log in.
      this.activityLog.track('VISIT', event.urlAfterRedirects);
    });
  }
}
