import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';

/**
 * Adds a `.dn-revealed` class to the host element the first time it scrolls
 * into the viewport, enabling CSS-driven fade/slide-in transitions for a
 * smooth "scroll flow" feel. Pairs with the `.dn-reveal` base class in
 * styles.css.
 *
 * Usage: <section class="dn-reveal" appScrollReveal>...</section>
 * Optional stagger delay (ms): <section class="dn-reveal" appScrollReveal [revealDelay]="100">
 */
@Directive({
  selector: '[appScrollReveal]',
  standalone: true
})
export class ScrollRevealDirective implements OnInit, OnDestroy {

  @Input() revealDelay = 0;

  private observer?: IntersectionObserver;

  constructor(private el: ElementRef<HTMLElement>) {
  }

  ngOnInit(): void {
    const element = this.el.nativeElement;

    if (typeof IntersectionObserver === 'undefined') {
      element.classList.add('dn-revealed');
      return;
    }

    if (this.revealDelay) {
      element.style.transitionDelay = `${this.revealDelay}ms`;
    }

    this.observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          element.classList.add('dn-revealed');
          this.observer?.unobserve(element);
        }
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
