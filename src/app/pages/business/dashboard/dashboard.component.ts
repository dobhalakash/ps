import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BusinessAdminService } from '../../../core/services/business-admin.service';
import { BusinessDashboardStats, BusinessProfile } from '../../../core/models/business.model';
import { BusinessNavComponent } from '../../../shared/business-nav/business-nav.component';

@Component({
  selector: 'app-business-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BusinessNavComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class BusinessDashboardComponent implements OnInit {

  readonly stats = signal<BusinessDashboardStats | null>(null);
  readonly profile = signal<BusinessProfile | null>(null);
  readonly loading = signal(true);

  readonly savingPayment = signal(false);
  readonly paymentSaved = signal(false);
  readonly paymentError = signal('');
  upiId = '';

  constructor(private businessAdminService: BusinessAdminService) {
  }

  ngOnInit(): void {
    this.businessAdminService.getDashboard().subscribe({
      next: res => {
        this.stats.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
    this.businessAdminService.getProfile().subscribe(res => {
      this.profile.set(res.data);
      this.upiId = res.data.upiId || '';
    });
  }

  savePaymentSettings(): void {
    this.savingPayment.set(true);
    this.paymentError.set('');
    this.paymentSaved.set(false);

    this.businessAdminService.updatePaymentSettings({ upiId: this.upiId.trim() }).subscribe({
      next: res => {
        this.profile.set(res.data);
        this.savingPayment.set(false);
        this.paymentSaved.set(true);
        setTimeout(() => this.paymentSaved.set(false), 2500);
      },
      error: err => {
        this.savingPayment.set(false);
        this.paymentError.set(err?.error?.message || 'Could not save payment settings.');
      }
    });
  }
}
