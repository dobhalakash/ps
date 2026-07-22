import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NewsService } from '../../core/services/news.service';
import { News } from '../../core/models/news.model';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './news-detail.component.html',
  styleUrl: './news-detail.component.css'
})
export class NewsDetailComponent implements OnInit {

  readonly news = signal<News | null>(null);
  readonly loading = signal(true);

  constructor(private route: ActivatedRoute, private newsService: NewsService) {
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.params['id']);
    this.newsService.getNews(id).subscribe({
      next: res => {
        this.news.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
