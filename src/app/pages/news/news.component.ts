import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NewsService } from '../../core/services/news.service';
import { News } from '../../core/models/news.model';
import { TPipe } from '../../shared/pipes/t.pipe';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [TPipe, CommonModule, RouterLink],
  templateUrl: './news.component.html',
  styleUrl: './news.component.css'
})
export class NewsComponent implements OnInit {

  readonly news = signal<News[]>([]);
  readonly loading = signal(true);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly selectedCategory = signal<string | null>(null);

  readonly categories = ['Cricket', 'Football', 'Basketball', 'Kabaddi', 'General'];

  constructor(private newsService: NewsService) {
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.newsService.getPublishedNews(this.selectedCategory() ?? undefined, this.page(), 9).subscribe({
      next: res => {
        this.news.set(res.data.content);
        this.totalPages.set(res.data.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  selectCategory(category: string | null): void {
    this.selectedCategory.set(category);
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
}
