import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BusinessNavComponent } from '../../../shared/business-nav/business-nav.component';

/**
 * Coupons are managed centrally by platform administrators (see /admin/coupons).
 * This page gives business admins guidance on how platform-wide coupons work.
 */
@Component({
  selector: 'app-business-coupons',
  standalone: true,
  imports: [CommonModule, BusinessNavComponent],
  templateUrl: './coupons.component.html',
  styleUrl: './coupons.component.css'
})
export class BusinessCouponsComponent {
  readonly infoOnly = signal(true);
}
