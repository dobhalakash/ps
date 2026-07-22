import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { TPipe } from '../pipes/t.pipe';

@Component({
  selector: 'app-business-nav',
  standalone: true,
  imports: [TPipe, CommonModule, RouterLink, RouterLinkActive],
  template: `
        <nav class="th-admin-nav">
      <a routerLink="/admin/dashboard" routerLinkActive="active"><i class="fa-solid fa-gauge"></i> {{ 'an.dashboard' | t }}</a>
      <a routerLink="/admin/products" routerLinkActive="active"><i class="fa-solid fa-baseball-bat-ball"></i> {{ 'bn.products' | t }}</a>
      <a routerLink="/admin/orders" routerLinkActive="active"><i class="fa-solid fa-box"></i> {{ 'bn.orders' | t }}</a>
      <a routerLink="/admin/categories" routerLinkActive="active"><i class="fa-solid fa-tags"></i> {{ 'an.categories' | t }}</a>
      <a routerLink="/admin/coupons" routerLinkActive="active"><i class="fa-solid fa-percent"></i> {{ 'an.coupons' | t }}</a>
      <a routerLink="/admin/users" routerLinkActive="active"><i class="fa-solid fa-users"></i> {{ 'an.users' | t }}</a>
      <a routerLink="/admin/payments" routerLinkActive="active"><i class="fa-solid fa-receipt"></i> {{ 'an.paymentTracking' | t }}</a>
      <a routerLink="/admin/payouts" routerLinkActive="active"><i class="fa-solid fa-wallet"></i> {{ 'an.payoutMgmt' | t }}</a>
      <a routerLink="/admin/store-settings" routerLinkActive="active"><i class="fa-solid fa-building-columns"></i> {{ 'bn.banking' | t }}</a>
      <a routerLink="/admin/news" routerLinkActive="active"><i class="fa-regular fa-newspaper"></i> {{ 'an.news' | t }}</a>
      <a routerLink="/admin/support" routerLinkActive="active"><i class="fa-solid fa-truck-fast"></i> {{ 'an.orderSupport' | t }}</a>
      <a class="th-admin-nav__logout" (click)="logout()"><i class="fa-solid fa-right-from-bracket"></i> {{ 'nav.logout' | t }}</a>
    </nav>
  `
})
export class BusinessNavComponent {
  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {
  }

  logout(): void {
    this.authService.logout();
    this.cartService.refresh();
    this.router.navigate(['/']);
  }
}
