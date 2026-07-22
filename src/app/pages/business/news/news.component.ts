import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsService } from '../../../core/services/news.service';
import { News } from '../../../core/models/news.model';
import { BusinessNavComponent } from '../../../shared/business-nav/business-nav.component';

/**
 * News content is managed centrally by platform administrators (see /admin/news).
 * Business admins get a read-only view of published news here.
 */
@Component({
  selector: 'app-business-news',
  standalone: true,
  imports: [CommonModule, BusinessNavComponent],
  templateUrl: './news.component.html',
  styleUrl: './news.component.css'
})
export class BusinessNewsComponent implements OnInit {

  readonly news = signal<News[]>([]);
  readonly loading = signal(true);

  constructor(private newsService: NewsService) {
  }

  ngOnInit(): void {
    this.newsService.getPublishedNews(undefined, 0, 10).subscribe({
      next: res => {
        this.news.set(res.data.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
