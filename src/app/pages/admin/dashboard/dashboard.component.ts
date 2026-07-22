import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SuperAdminService } from '../../../core/services/super-admin.service';
import { AdminDashboardStats } from '../../../core/models/business.model';
import { AdminNavComponent } from '../../../shared/admin-nav/admin-nav.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, AdminNavComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {

  readonly stats = signal<AdminDashboardStats | null>(null);
  readonly loading = signal(true);

  constructor(private superAdminService: SuperAdminService) {
  }

  ngOnInit(): void {
    this.superAdminService.getDashboard().subscribe({
      next: res => {
        this.stats.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
