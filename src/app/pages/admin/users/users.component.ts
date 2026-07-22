import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuperAdminService } from '../../../core/services/super-admin.service';
import { RoleName, User } from '../../../core/models/user.model';
import { AdminNavComponent } from '../../../shared/admin-nav/admin-nav.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, AdminNavComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class AdminUsersComponent implements OnInit {

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly role = signal<RoleName>('CUSTOMER');

  readonly roles: RoleName[] = ['CUSTOMER', 'BUSINESS_ADMIN', 'SUPER_ADMIN'];

  constructor(private superAdminService: SuperAdminService) {
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.superAdminService.getUsers(this.role(), this.page(), 10).subscribe({
      next: res => {
        this.users.set(res.data.content);
        this.totalPages.set(res.data.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setRole(role: RoleName): void {
    this.role.set(role);
    this.page.set(0);
    this.load();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) {
      return;
    }
    this.page.set(page);
    this.load();
  }

  toggleEnabled(user: User): void {
    this.superAdminService.setUserEnabled(user.id, !user.enabled).subscribe(res => {
      this.users.set(this.users().map(u => u.id === user.id ? res.data : u));
    });
  }
}
