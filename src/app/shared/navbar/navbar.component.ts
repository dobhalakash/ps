import { Component, ElementRef, HostListener, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProductService } from '../../core/services/product.service';
import { ProductSummary } from '../../core/models/product.model';
import { I18nService } from '../../core/services/i18n.service';
import { FEATURES } from '../../core/edition';
import { TPipe } from '../pipes/t.pipe';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, TPipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnDestroy {
  readonly features = FEATURES;
  readonly menuOpen = signal(false);
  readonly scrolled = signal(false);
  readonly showSearch = signal(true); // hidden on auth/register pages

  searchQuery = '';
  readonly searchOpen = signal(false);

  toggleSearch(): void {
    this.searchOpen.set(!this.searchOpen());
    if (this.searchOpen()) {
      setTimeout(() => (document.querySelector('.sk-search__input') as HTMLInputElement)?.focus(), 80);
    } else {
      this.showSuggestions.set(false);
    }
  }

  readonly suggestions = signal<ProductSummary[]>([]);
  readonly showSuggestions = signal(false);
  readonly searching = signal(false);

  private searchInput$ = new Subject<string>();

  navLinks = [
    { path: '/', params: null, label: 'nav.home', exact: true },
    { path: '/products', params: null, label: 'nav.shop', exact: true },
    { path: '/products', params: { category: 'english-willow' }, label: 'nav.englishWillow', exact: false },
    { path: '/products', params: { category: 'kashmir-willow' }, label: 'nav.kashmirWillow', exact: false },
    { path: '/products', params: { category: 'tape-ball' }, label: 'nav.tapeBall', exact: false },
    { path: '/products', params: { category: 'junior' }, label: 'nav.junior', exact: false },
    { path: '/products', params: { category: 'senior' }, label: 'nav.senior', exact: false },
  ];

  constructor(
    public authService: AuthService,
    public cartService: CartService,
    public notificationService: NotificationService,
    public i18n: I18nService,
    private productService: ProductService,
    private router: Router,
    private elementRef: ElementRef
  ) {
    if (this.authService.isLoggedIn()) {
      this.notificationService.refreshUnreadCount();
    }

    // Hide the search bar on auth and register pages where it adds clutter
    const HIDE_SEARCH_ON = ['/login', '/register', '/verify-account'];
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => {
      this.showSearch.set(!HIDE_SEARCH_ON.some(p => e.urlAfterRedirects.startsWith(p)));
    });
    // Also set on first load
    const url = this.router.url;
    this.showSearch.set(!HIDE_SEARCH_ON.some(p => url.startsWith(p)));

    this.searchInput$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.trim().length < 2) {
          this.searching.set(false);
          return [];
        }
        this.searching.set(true);
        return this.productService.getSuggestions(query.trim());
      })
    ).subscribe({
      next: res => {
        this.searching.set(false);
        this.suggestions.set(res.data || []);
      },
      error: () => this.searching.set(false)
    });
  }

  @HostListener('window:scroll')
  onWindowScroll(): void { this.scrolled.set(window.scrollY > 8); }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showSuggestions.set(false);
    }
  }

  onSearchInput(): void {
    this.showSuggestions.set(true);
    this.searchInput$.next(this.searchQuery);
  }

  goSearch(): void {
    const query = this.searchQuery.trim();
    if (!query) return;
    this.showSuggestions.set(false);
    this.closeMenu();
    this.router.navigate(['/products'], { queryParams: { keyword: query } });
  }

  selectSuggestion(product: ProductSummary): void {
    this.showSuggestions.set(false);
    this.searchQuery = '';
    this.closeMenu();
    this.router.navigate(['/products', product.id]);
  }

  toggleMenu(): void { this.menuOpen.set(!this.menuOpen()); }
  closeMenu(): void { this.menuOpen.set(false); }

  logout(): void {
    this.authService.logout();
    this.cartService.refresh();
    this.closeMenu();
    this.router.navigate(['/']);
  }

  get dashboardLink(): string {
    const role = this.authService.currentRole();
    if (role === 'SUPER_ADMIN') return '/admin/dashboard';
    if (role === 'BUSINESS_ADMIN') return '/business/dashboard';
    return '/profile';
  }

  ngOnDestroy(): void {
    this.searchInput$.complete();
  }
}
