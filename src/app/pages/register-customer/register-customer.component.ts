import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { SocialAuthService } from '../../core/services/social-auth.service';
import { RegisterCustomerRequest } from '../../core/models/user.model';
import { TPipe } from '../../shared/pipes/t.pipe';

@Component({
  selector: 'app-register-customer',
  standalone: true,
  imports: [TPipe, CommonModule, FormsModule, RouterLink],
  templateUrl: './register-customer.component.html',
  styleUrl: './register-customer.component.css'
})
export class RegisterCustomerComponent {

  form: RegisterCustomerRequest = {
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: ''
  };

  showPassword = false;
  showConfirmPassword = false;

  readonly loading = signal(false);
  readonly error = signal('');
  readonly socialLoading = signal<'GOOGLE' | null>(null);

  // Recomputed on every keystroke via the (input) handler since password
  // isn't a signal itself (it's two-way bound via ngModel).
  passwordChecklist = { length: false, uppercase: false, numberOrSpecial: false };

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private socialAuthService: SocialAuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
  }

  onPasswordInput(): void {
    this.passwordChecklist = {
      length: this.form.password.length >= 8,
      uppercase: /[A-Z]/.test(this.form.password),
      numberOrSpecial: /[0-9!@#$%^&*(),.?":{}|<>]/.test(this.form.password)
    };
  }

  submit(): void {
    if (this.form.password !== this.form.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.registerCustomer(this.form).subscribe({
      next: () => {
        this.cartService.mergeGuestCart().subscribe(() => {
          this.loading.set(false);
          const returnUrl = this.route.snapshot.queryParams['returnUrl'];
          this.router.navigate(['/verify-account'], returnUrl ? { queryParams: { returnUrl } } : {});
        });
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Registration failed. Please try again.');
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
            const returnUrl = this.route.snapshot.queryParams['returnUrl'];
            this.router.navigateByUrl(returnUrl || '/');
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
}
