import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { SocialAuthService } from '../../core/services/social-auth.service';
import { LoginRequest } from '../../core/models/user.model';
import { TPipe } from '../../shared/pipes/t.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [TPipe, CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  form: LoginRequest = { email: '', password: '' };
  readonly loading = signal(false);
  readonly error = signal('');
  readonly socialLoading = signal<'GOOGLE' | null>(null);

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private socialAuthService: SocialAuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
  }

  submit(): void {
    this.loading.set(true);
    this.error.set('');

    this.authService.login(this.form).subscribe({
      next: () => {
        this.cartService.mergeGuestCart().subscribe(() => {
          this.loading.set(false);
          this.redirectAfterLogin();
        });
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Invalid email or password.');
      }
    });
  }

  signInWithGoogle(): void {
    this.runSocial('GOOGLE', () => this.socialAuthService.signInWithGoogle());
  }

  private runSocial(provider: 'GOOGLE', start: () => Promise<any>): void {
    this.error.set('');
    this.socialLoading.set(provider);

    start().then(result => {
      this.authService.socialLogin(result).subscribe({
        next: () => {
          this.cartService.mergeGuestCart().subscribe(() => {
            this.socialLoading.set(null);
            this.redirectAfterLogin();
          });
        },
        error: err => {
          this.socialLoading.set(null);
          this.error.set(err?.error?.message || `${provider} sign-in failed. Please try again.`);
        }
      });
    }).catch((e: Error) => {
      this.socialLoading.set(null);
      this.error.set(e.message);
    });
  }

  private redirectAfterLogin(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
      return;
    }

    const role = this.authService.currentRole();
    if (role === 'SUPER_ADMIN') {
      this.router.navigate(['/admin/dashboard']);
    } else if (role === 'BUSINESS_ADMIN') {
      this.router.navigate(['/business/dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
