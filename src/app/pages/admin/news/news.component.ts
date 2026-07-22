import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewsService } from '../../../core/services/news.service';
import { News, NewsRequest } from '../../../core/models/news.model';
import { AdminNavComponent } from '../../../shared/admin-nav/admin-nav.component';

@Component({
  selector: 'app-admin-news',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavComponent],
  templateUrl: './news.component.html',
  styleUrl: './news.component.css'
})
export class AdminNewsComponent implements OnInit {

  readonly news = signal<News[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly error = signal('');

  readonly categories = ['Cricket', 'Football', 'Basketball', 'Kabaddi', 'General'];

  form: NewsRequest = this.emptyForm();

  constructor(private newsService: NewsService) {
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.newsService.getAllNews().subscribe({
      next: res => {
        this.news.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  emptyForm(): NewsRequest {
    return {
      title: '',
      description: '',
      thumbnailUrl: '',
      publishDate: new Date().toISOString().substring(0, 10),
      category: 'General',
      active: true
    };
  }

  startNew(): void {
    this.editingId.set(null);
    this.form = this.emptyForm();
    this.showForm.set(true);
    this.error.set('');
  }

  edit(item: News): void {
    this.editingId.set(item.id);
    this.form = {
      title: item.title,
      description: item.description,
      thumbnailUrl: item.thumbnailUrl,
      publishDate: item.publishDate ? item.publishDate.substring(0, 10) : '',
      category: item.category,
      active: item.active
    };
    this.showForm.set(true);
    this.error.set('');
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  save(): void {
    this.error.set('');
    const id = this.editingId();
    const request$ = id ? this.newsService.updateNews(id, this.form) : this.newsService.createNews(this.form);

    request$.subscribe({
      next: () => {
        this.showForm.set(false);
        this.editingId.set(null);
        this.load();
      },
      error: err => this.error.set(err?.error?.message || 'Could not save news item.')
    });
  }

  delete(item: News): void {
    this.newsService.deleteNews(item.id).subscribe(() => this.load());
  }
}
