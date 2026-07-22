import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { TPipe } from '../pipes/t.pipe';

@Component({
  selector: 'app-mobile-tabbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TPipe],
  templateUrl: './mobile-tabbar.component.html',
  styleUrl: './mobile-tabbar.component.css'
})
export class MobileTabbarComponent {
  constructor(
    public authService: AuthService,
    public cartService: CartService
  ) {}

  get dashboardLink(): string {
    const role = this.authService.currentRole();
    if (role === 'SUPER_ADMIN') return '/admin/dashboard';
    if (role === 'BUSINESS_ADMIN') return '/business/dashboard';
    return '/profile';
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }
}
