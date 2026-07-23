import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { Product, ProductRequest, ProductVariantRequest, ProductSize } from '../../../core/models/product.model';
import { Category } from '../../../core/models/category.model';
import { BusinessNavComponent } from '../../../shared/business-nav/business-nav.component';
import { UploadService } from '../../../core/services/upload.service';
import { FEATURES } from '../../../core/edition';

@Component({
  selector: 'app-business-products',
  standalone: true,
  imports: [CommonModule, FormsModule, BusinessNavComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class BusinessProductsComponent implements OnInit {
  // Cricket bat spec dropdown options (PS Sports)
  readonly batWeightOptions = ['Light (500-800 g)', 'Medium (900-1020 g)', 'Heavy (1020-1200 g)'];
  readonly bladeTypeOptions = ['Full Profile', 'Mid Profile', 'Low Profile', 'Duckbill', 'Traditional'];
  readonly handleGripOptions = ['Round Handle', 'Oval Handle', 'Semi-Oval Handle'];
  readonly sweetSpotOptions = ['Low', 'Mid', 'High', 'Extended Mid'];
  readonly willowGradeOptions = ['Grade 1 English Willow', 'Grade 2 English Willow', 'Grade 3 English Willow', 'Grade 4 English Willow', 'Premium Kashmir Willow', 'Premium Kashmir Willow Hard tennis', 'Popular Willow (Soft Ball)'];
  readonly features = FEATURES;

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly error = signal('');

  readonly imageMode = signal<'url' | 'upload'>('url');
  readonly uploading = signal(false);
  readonly uploadingVideo = signal(false);
  readonly bulkUploading = signal(false);
  readonly bulkResult = signal<{ created: number; failed: number; errors: string[] } | null>(null);
  videoUrlInput = '';

  readonly sizes: ProductSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  form: ProductRequest = this.emptyForm();
  imageUrlInput = '';

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private uploadService: UploadService
  ) {
  }

  resolveImageUrl(url: string): string {
    return this.uploadService.resolveUrl(url);
  }

  onBulkCsvSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.bulkUploading.set(true);
    this.bulkResult.set(null);
    this.error.set('');
    this.productService.bulkUpload(file).subscribe({
      next: res => {
        this.bulkUploading.set(false);
        this.bulkResult.set(res.data);
        input.value = '';
        this.load(); // refresh the list with the new products
      },
      error: err => {
        this.bulkUploading.set(false);
        this.error.set(err?.error?.message || 'Bulk upload failed. Check the CSV format and try again.');
        input.value = '';
      }
    });
  }

  dismissBulkResult(): void {
    this.bulkResult.set(null);
  }

  /** Downloads a ready-to-fill sample CSV with the expected columns. */
  downloadSampleCsv(): void {
    const csv = [
      'name,description,category,brand,price,discountPercentage,stock,codEnabled,imageUrls,videoUrls,sizes',
      '"India Cricket Jersey 2026","Official replica fan jersey",Cricket,Nike,1499,10,50,true,https://example.com/img1.jpg|https://example.com/img2.jpg,,S:10|M:20|L:15|XL:5',
      '"Pro Football Boots","Firm-ground studs",Football,Adidas,3299,,25,false,https://example.com/boot.jpg,,',
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trackhub-products-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  onVideoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if ((this.form.videoUrls?.length || 0) >= 2) {
      this.error.set('Maximum 2 videos per product. Remove one first.');
      input.value = '';
      return;
    }

    this.uploadingVideo.set(true);
    this.error.set('');

    this.uploadService.uploadVideo(file).subscribe({
      next: res => {
        this.uploadingVideo.set(false);
        this.form.videoUrls = [...(this.form.videoUrls || []), res.data.url];
        input.value = '';
      },
      error: err => {
        this.uploadingVideo.set(false);
        this.error.set(err?.error?.message || 'Could not upload video. Please try again.');
        input.value = '';
      }
    });
  }

  addVideoUrl(): void {
    const url = this.videoUrlInput.trim();
    if (!url) return;
    if ((this.form.videoUrls?.length || 0) >= 2) {
      this.error.set('Maximum 2 videos per product. Remove one first.');
      return;
    }
    this.form.videoUrls = [...(this.form.videoUrls || []), url];
    this.videoUrlInput = '';
  }

  removeVideoUrl(index: number): void {
    this.form.videoUrls = (this.form.videoUrls || []).filter((_, i) => i !== index);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    this.error.set('');

    this.uploadService.uploadImage(file).subscribe({
      next: res => {
        this.uploading.set(false);
        this.form.imageUrls = [...(this.form.imageUrls || []), res.data.url];
        input.value = '';
      },
      error: err => {
        this.uploading.set(false);
        this.error.set(err?.error?.message || 'Could not upload image. Please try again.');
        input.value = '';
      }
    });
  }


  ngOnInit(): void {
    this.categoryService.getActiveCategories().subscribe(res => this.categories.set(res.data));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.productService.getMyProducts(this.page(), 10).subscribe({
      next: res => {
        this.products.set(res.data.content);
        this.totalPages.set(res.data.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) {
      return;
    }
    this.page.set(page);
    this.load();
  }

  emptyForm(): ProductRequest {
    return {
      name: '',
      description: '',
      price: 0,
      discountPercentage: 0,
      stock: 0,
      sku: '',
      brand: '',
      batWeight: '',
      bladeType: '',
      handleGrip: '',
      sweetSpot: '',
      willowGrade: '',
      trending: false,
      active: true,
      categoryId: 0,
      codEnabled: true,
      codAdvanceAmount: 0,
      shippingCharge: 50,
      imageUrls: [],
      videoUrls: [],
      variants: []
    };
  }

  startNew(): void {
    this.editingId.set(null);
    this.form = this.emptyForm();
    this.showForm.set(true);
    this.error.set('');
  }

  edit(product: Product): void {
    this.editingId.set(product.id);
    this.form = {
      name: product.name,
      description: product.description,
      price: product.price,
      discountPercentage: product.discountPercentage,
      stock: product.stock,
      sku: product.sku,
      brand: product.brand,
      batWeight: (product as any).batWeight || '',
      bladeType: (product as any).bladeType || '',
      handleGrip: (product as any).handleGrip || '',
      sweetSpot: (product as any).sweetSpot || '',
      willowGrade: (product as any).willowGrade || '',
      trending: product.trending,
      active: product.active,
      categoryId: product.categoryId,
      codEnabled: product.codEnabled,
      codAdvanceAmount: product.codAdvanceAmount,
      shippingCharge: product.shippingCharge,
      imageUrls: product.images.map(i => i.imageUrl),
      videoUrls: product.videos ? [...product.videos] : [],
      variants: product.variants.map(v => ({ size: v.size, fitType: v.fitType, stock: v.stock, skuSuffix: v.skuSuffix }))
    };
    this.showForm.set(true);
    this.error.set('');
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  addImageUrl(): void {
    const url = this.imageUrlInput.trim();
    if (url) {
      this.form.imageUrls = [...(this.form.imageUrls || []), url];
      this.imageUrlInput = '';
    }
  }

  removeImageUrl(index: number): void {
    this.form.imageUrls = (this.form.imageUrls || []).filter((_, i) => i !== index);
  }

  addVariant(): void {
    const variant: ProductVariantRequest = { size: 'M', fitType: '', stock: 0 };
    this.form.variants = [...(this.form.variants || []), variant];
  }

  removeVariant(index: number): void {
    this.form.variants = (this.form.variants || []).filter((_, i) => i !== index);
  }

  save(): void {
    this.error.set('');
    const id = this.editingId();
    const request$ = id ? this.productService.updateProduct(id, this.form) : this.productService.createProduct(this.form);

    request$.subscribe({
      next: () => {
        this.showForm.set(false);
        this.editingId.set(null);
        this.load();
      },
      error: err => this.error.set(err?.error?.message || 'Could not save product.')
    });
  }

  delete(product: Product): void {
    this.productService.deleteProduct(product.id).subscribe(() => this.load());
  }
}
