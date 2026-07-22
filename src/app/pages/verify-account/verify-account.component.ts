import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-verify-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-account.component.html',
  styleUrl: './verify-account.component.css'
})
export class VerifyAccountComponent implements OnInit {

  emailCode = '';

  readonly emailVerified = signal(false);
  readonly verifyingEmail = signal(false);
  readonly resendingEmail = signal(false);
  readonly emailError = signal('');
  readonly resendMessage = signal('');

  constructor(
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.emailVerified.set(user.emailVerified);
  }

  get email(): string {
    return this.authService.currentUser()?.email || '';
  }

  submitEmailCode(): void {
    if (!this.emailCode.trim()) {
      return;
    }
    this.verifyingEmail.set(true);
    this.emailError.set('');

    this.authService.verifyEmail(this.email, this.emailCode.trim()).subscribe({
      next: () => {
        this.verifyingEmail.set(false);
        this.emailVerified.set(true);
      },
      error: err => {
        this.verifyingEmail.set(false);
        this.emailError.set(err?.error?.message || 'Invalid or expired code.');
      }
    });
  }

  resend(channel: 'EMAIL'): void {
    this.resendMessage.set('');
    this.resendingEmail.set(true);

    this.authService.resendOtp(this.email, channel).subscribe({
      next: () => {
        this.resendingEmail.set(false);
        this.resendMessage.set('A new code was sent to your email.');
      },
      error: err => {
        this.resendingEmail.set(false);
        this.resendMessage.set(err?.error?.message || 'Could not resend code. Please try again shortly.');
      }
    });
  }

  continue(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    } else {
      this.router.navigate(['/']);
    }
  }
}
