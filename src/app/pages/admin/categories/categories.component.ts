import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../core/services/category.service';
import { Category, CategoryRequest, SportsCategory } from '../../../core/models/category.model';
import { AdminNavComponent } from '../../../shared/admin-nav/admin-nav.component';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavComponent],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class AdminCategoriesComponent implements OnInit {

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly error = signal('');

  readonly categoryTypes: SportsCategory[] = ['CRICKET', 'FOOTBALL', 'BASKETBALL', 'CUSTOM_TEAM', 'SCHOOL_COLLEGE', 'CORPORATE', 'TRAINING', 'OTHER'];

  form: CategoryRequest = this.emptyForm();

  constructor(private categoryService: CategoryService) {
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.categoryService.getAllCategories().subscribe({
      next: res => {
        this.categories.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  emptyForm(): CategoryRequest {
    return { name: '', description: '', imageUrl: '', sizeGuide: '', categoryType: 'OTHER', active: true };
  }

  startNew(): void {
    this.editingId.set(null);
    this.form = this.emptyForm();
    this.showForm.set(true);
    this.error.set('');
  }

  edit(category: Category): void {
    this.editingId.set(category.id);
    this.form = {
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl,
      sizeGuide: category.sizeGuide || '',
      categoryType: category.categoryType,
      active: category.active
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
    const request$ = id ? this.categoryService.updateCategory(id, this.form) : this.categoryService.createCategory(this.form);

    request$.subscribe({
      next: () => {
        this.showForm.set(false);
        this.editingId.set(null);
        this.load();
      },
      error: err => this.error.set(err?.error?.message || 'Could not save category.')
    });
  }

  toggleActive(category: Category): void {
    if (category.active) {
      this.categoryService.deleteCategory(category.id).subscribe(() => this.load());
    } else {
      this.categoryService.updateCategory(category.id, {
        name: category.name,
        description: category.description,
        imageUrl: category.imageUrl,
        sizeGuide: category.sizeGuide || '',
        categoryType: category.categoryType,
        active: true
      }).subscribe(() => this.load());
    }
  }
}
