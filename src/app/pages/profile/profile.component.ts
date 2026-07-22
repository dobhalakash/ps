import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AddressService } from '../../core/services/address.service';
import { CartService } from '../../core/services/cart.service';
import { Address, AddressRequest } from '../../core/models/address.model';
import { ChangePasswordRequest, UpdateProfileRequest } from '../../core/models/user.model';
import { TPipe } from '../../shared/pipes/t.pipe';
import { INDIAN_STATES, COUNTRIES } from '../../core/data/indian-states';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [TPipe, CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  readonly indianStates = INDIAN_STATES;
  readonly countries = COUNTRIES;

  readonly activeTab = signal<'profile' | 'addresses' | 'password'>('profile');
  readonly addresses = signal<Address[]>([]);
  readonly showAddressForm = signal(false);

  readonly profileSaved = signal(false);
  readonly passwordSaved = signal(false);
  readonly error = signal('');

  profileForm: UpdateProfileRequest = { firstName: '', lastName: '', mobileNumber: '' };
  passwordForm: ChangePasswordRequest = { currentPassword: '', newPassword: '' };
  confirmNewPassword = '';

  newAddress: AddressRequest = {
    fullName: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: '', pincode: '', country: 'India', addressType: 'HOME', isDefault: false
  };

  constructor(
    public authService: AuthService,
    private addressService: AddressService,
    private cartService: CartService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.profileForm = {
        firstName: user.firstName,
        lastName: user.lastName,
        mobileNumber: user.mobileNumber
      };
    }
    this.loadAddresses();
  }

  loadAddresses(): void {
    this.addressService.getAddresses().subscribe(res => this.addresses.set(res.data));
  }

  saveProfile(): void {
    this.error.set('');
    this.authService.updateProfile(this.profileForm).subscribe({
      next: () => {
        this.profileSaved.set(true);
        setTimeout(() => this.profileSaved.set(false), 2500);
      },
      error: err => this.error.set(err?.error?.message || 'Could not update profile.')
    });
  }

  changePassword(): void {
    this.error.set('');
    if (this.passwordForm.newPassword !== this.confirmNewPassword) {
      this.error.set('New passwords do not match.');
      return;
    }
    this.authService.changePassword(this.passwordForm).subscribe({
      next: () => {
        this.passwordSaved.set(true);
        this.passwordForm = { currentPassword: '', newPassword: '' };
        this.confirmNewPassword = '';
        setTimeout(() => this.passwordSaved.set(false), 2500);
      },
      error: err => this.error.set(err?.error?.message || 'Could not change password.')
    });
  }

  saveAddress(): void {
    this.addressService.createAddress(this.newAddress).subscribe({
      next: res => {
        this.addresses.set([...this.addresses(), res.data]);
        this.showAddressForm.set(false);
        this.newAddress = {
          fullName: '', phone: '', addressLine1: '', addressLine2: '',
          city: '', state: '', pincode: '', country: 'India', addressType: 'HOME', isDefault: false
        };
      },
      error: err => this.error.set(err?.error?.message || 'Could not save address.')
    });
  }

  deleteAddress(address: Address): void {
    this.addressService.deleteAddress(address.id).subscribe(() => {
      this.addresses.set(this.addresses().filter(a => a.id !== address.id));
    });
  }

  logout(): void {
    this.authService.logout();
    this.cartService.refresh();
    this.router.navigate(['/']);
  }
}
