import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BusinessAdminService } from '../../../core/services/business-admin.service';
import { BusinessNavComponent } from '../../../shared/business-nav/business-nav.component';
import { UploadService } from '../../../core/services/upload.service';

@Component({
  selector: 'app-business-payment-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, BusinessNavComponent],
  templateUrl: './payment-settings.component.html',
  styleUrl: './payment-settings.component.css'
})
export class BusinessPaymentSettingsComponent implements OnInit {
  uploadingLogo = false;


  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal('');

  form: { upiId: string; bankAccountNumber: string; ifscCode: string; bankName: string; accountHolderName: string; logoUrl: string } = {
    upiId: '',
    bankAccountNumber: '',
    ifscCode: '',
    bankName: '',
    accountHolderName: '',
    logoUrl: ''
  };

  constructor(private uploadService: UploadService,
    private businessAdminService: BusinessAdminService) {
  }

  ngOnInit(): void {
    this.businessAdminService.getProfile().subscribe({
      next: res => {
        const p = res.data;
        this.form.upiId = p.upiId || '';
        this.form.bankAccountNumber = p.bankAccountNumber || '';
        this.form.ifscCode = p.ifscCode || '';
        this.form.bankName = p.bankName || '';
        this.form.accountHolderName = p.accountHolderName || '';
        this.form.logoUrl = p.logoUrl || '';
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  save(): void {
    this.saving.set(true);
    this.error.set('');
    this.saved.set(false);

    this.businessAdminService.updatePaymentSettings(this.form).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: err => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Could not save settings. Please try again.');
      }
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadingLogo = true;
    this.uploadService.uploadImage(file).subscribe({
      next: res => { this.uploadingLogo = false; this.form.logoUrl = res.data.url; input.value = ''; },
      error: () => { this.uploadingLogo = false; input.value = ''; }
    });
  }
}
