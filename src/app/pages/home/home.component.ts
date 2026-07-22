import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { NewsService } from '../../core/services/news.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductSummary } from '../../core/models/product.model';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { TPipe } from '../../shared/pipes/t.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TPipe, CommonModule, RouterLink, ScrollRevealDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {

  /* ── Slider ── */
  currentSlide = 0;
  private sliderTimer: ReturnType<typeof setInterval> | null = null;

  slides = [
    {
      eyebrow: 'New Season',
      line1: 'Wear Better,',
      line2: 'Live Better.',
      sub: 'Premium Jerseys, Teamwear & Sports Apparel for Every Athlete.',
      bg: 'linear-gradient(135deg,#0f2d62 0%,#123a78 30%,#1e5eff 70%,#4f46e5 100%)',
      image: 'assets/Slider1 (2).png',
    features: [
  { icon: 'fa-solid fa-shirt', text: 'Premium Jerseys' },
  { icon: 'fa-solid fa-wind', text: 'Breathable Fabric' },
  { icon: 'fa-solid fa-medal', text: 'Champion Quality' },
]
    },
    {
      eyebrow: 'Best Sellers',
  line1: 'Premium',
  line2: 'Collection' ,
  
  sub: 'High-performance jerseys designed for comfort, durability, and style on and off the field.',
      bg: 'linear-gradient(120deg, #0f3460 0%, #1a3c6e 40%, #16213e 100%)',
      image: 'assets/slider.png',
     features: [
  { icon: 'fa-solid fa-shirt', text: 'Premium Fabric' },
  { icon: 'fa-solid fa-wind', text: 'Breathable Material' },
  { icon: 'fa-solid fa-medal', text: 'Athlete Approved' },
]
    },
    {
      eyebrow: 'Now Available',
      line1: 'Custom Team',
      line2: 'Kits & Jerseys',
      sub: 'Design your own team colours, name, and number - built tough for match day.',
      bg: 'linear-gradient(120deg, #1e3a5f 0%, #2563eb 55%, #7c3aed 100%)',
      image: 'assets/slider2 (2).png',
      features: [
        { icon: 'fa-solid fa-pen-ruler', text: 'Custom Designs' },
        { icon: 'fa-solid fa-people-group', text: 'Built for Teams' },
        { icon: 'fa-solid fa-shield-halved', text: '1-Year Warranty' },
      ]
    },
  ];

  /* ── Category circles (matches TrackHub mockup) ── */
  catCircles = [
    { label: 'Football',    icon: 'fa-solid fa-futbol',            path: '/products', params: { category: 'football' } },
    { label: 'Cricket',     icon: 'fa-solid fa-baseball-bat-ball', path: '/products', params: { category: 'cricket' } },
    { label: 'Running',     icon: 'fa-solid fa-person-running',    path: '/products', params: { category: 'running' } },
    { label: 'Fitness',     icon: 'fa-solid fa-dumbbell',          path: '/products', params: { category: 'fitness' } },
    { label: 'Basketball',  icon: 'fa-solid fa-basketball',        path: '/products', params: { category: 'basketball' } },
    { label: 'Badminton',   icon: 'fa-solid fa-table-tennis-paddle-ball', path: '/products', params: { category: 'badminton' } },
    { label: 'Boxing',      icon: 'fa-solid fa-hand-fist',         path: '/products', params: { category: 'boxing' } },
    { label: 'Accessories', icon: 'fa-solid fa-bag-shopping',      path: '/products', params: { category: 'accessories' } },
  ];

  /* ── Promo banner cards ── */
  promoBanners = [
    {
      tag: 'New Arrivals', title: 'Running Collection', subtitle: 'Light. Fast. Unstoppable.',
      bg: '#15181d', params: { category: 'running' }
    },
    {
      tag: 'Up To', title: '50% Off', subtitle: 'On selected items. Limited time offer!',
      bg: 'linear-gradient(135deg, #0088CC 0%, #00B4D8 100%)', params: { sortBy: 'trending' }
    },
    {
      tag: 'Premium Gear', title: 'Built for Champions', subtitle: 'Elevate your game with the best.',
      bg: '#15181d', params: { category: 'accessories' }
    }
  ];

  /* ── Top brands ── */
  brands = [
    { name: 'Anna Power', path: '/products', params: { brand: 'Anna Power' } },
    { name: 'King', path: '/products', params: { brand: 'King' } },
    { name: 'Prime Editon', path: '/products', params: { brand: 'Prime Edition' } },
    { name: 'Under Armour', path: '/products', params: { brand: 'Under Armour' } },
    { name: 'Asics', path: '/products', params: { brand: 'Asics' } },
    { name: 'Yonex', path: '/products', params: { brand: 'Yonex' } },
    { name: 'SS', path: '/products', params: { brand: 'SS' } },
  ];

  /* ── Countdown ── */
  countdown = [
    { value: 8, label: 'HRS' },
    { value: 23, label: 'MINS' },
    { value: 45, label: 'SECS' },
    { value: 16, label: 'MS' },
  ];
  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  /* ── Data signals ── */
  readonly trending = signal<ProductSummary[]>([]);
  readonly dealProducts = signal<ProductSummary[]>([]);
  readonly newsletterEmail = signal('');
  readonly newsletterSubmitted = signal(false);

  readonly testimonials = [
  {
    name: 'Akash Gore Patil',
    location: 'Maharashtra',
    quote: 'The quality of the cricket bat exceeded my expectations. The willow is premium, well-balanced, and delivers outstanding power and control. Its lightweight, comfortable to handle, and perfect for both practice sessions and competitive matches.'
  },
  {
    name: 'MD Haider',
    location: 'Maharashtra',
    quote: 'I’m highly impressed with the overall performance of this soft tennis bat. Its premium finish, lightweight design, and superior handling deliver a smooth playing experience. It’s an excellent investment for serious players seeking quality and consistency.'
  },
  {
    name: 'Waseem Shaikh',
    location: 'Maharashtra',
    quote: 'The quality of this bat cover is outstanding. It is made from durable, premium materials that provide excellent protection against dust, scratches, and minor impacts. The sturdy zipper and comfortable shoulder strap make it easy to carry and ideal for everyday use.'
  }
];

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private newsService: NewsService,
    public cartService: CartService,
    private toastService: ToastService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.productService.getTrending().subscribe(res => {
      const products = res.data.slice(0, 8);
      this.trending.set(products);
      this.dealProducts.set(products.slice(0, 6));
    });

    this.sliderTimer = setInterval(() => this.nextSlide(), 5000);
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.sliderTimer) clearInterval(this.sliderTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
  }

  nextSlide(): void { this.currentSlide = (this.currentSlide + 1) % this.slides.length; }
  trackByProductId(index: number, product: ProductSummary): number | string {
  return product.id ?? index;
}
  prevSlide(): void { this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length; }
  goToSlide(i: number): void { this.currentSlide = i; }

  addToCart(product: ProductSummary): void {
    if (!this.authService.canShop()) {
      this.toastService.show('Business and admin accounts cannot purchase products.', 'error');
      return;
    }
    this.cartService.addToCart({ product, quantity: 1 }).subscribe(() => {
      this.toastService.show(`${product.name} added to cart`);
    });
  }

  subscribeNewsletter(): void {
    if (this.newsletterEmail().trim()) this.newsletterSubmitted.set(true);
  }

  private startCountdown(): void {
    // Real "Deal of the Day" countdown: counts down to midnight local time,
    // when the day's deals rotate. No more fake looping numbers.
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      let remaining = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
      const hrs = Math.floor(remaining / 3600);
      remaining -= hrs * 3600;
      const mins = Math.floor(remaining / 60);
      const secs = remaining - mins * 60;
      this.countdown = [
        { value: hrs,  label: 'HRS' },
        { value: mins, label: 'MINS' },
        { value: secs, label: 'SECS' },
      ];
    };
    tick();
    this.countdownTimer = setInterval(tick, 1000);
  }
}
