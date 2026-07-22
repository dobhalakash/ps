import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  step: 'email' | 'otp' | 'done' = 'email';
  email = '';
  otp = '';
  newPassword = '';
  confirmPassword = '';
  readonly loading = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  constructor(private authService: AuthService) {}

  sendOtp(): void {
    if (!this.email.trim()) { this.error.set('Please enter your email'); return; }
    this.loading.set(true); this.error.set('');
    this.authService.forgotPassword(this.email.trim()).subscribe({
      next: res => { this.loading.set(false); this.step = 'otp'; this.success.set(res.message || 'OTP sent to your email'); },
      error: err => { this.loading.set(false); this.error.set(err?.error?.message || 'Could not send OTP'); }
    });
  }

  resetPassword(): void {
    if (!this.otp.trim()) { this.error.set('Please enter the OTP'); return; }
    if (this.newPassword.length < 6) { this.error.set('Password must be at least 6 characters'); return; }
    if (this.newPassword !== this.confirmPassword) { this.error.set('Passwords do not match'); return; }
    this.loading.set(true); this.error.set('');
    this.authService.resetPassword(this.email.trim(), this.otp.trim(), this.newPassword).subscribe({
      next: () => { this.loading.set(false); this.step = 'done'; },
      error: err => { this.loading.set(false); this.error.set(err?.error?.message || 'Reset failed'); }
    });
  }
}
