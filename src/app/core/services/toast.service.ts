import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info';
}

/**
 * Lightweight global toast/snackbar service. Call show() from anywhere in
 * the app (e.g. after adding to cart) - the toast renders via
 * <app-toast-container> mounted once in AppComponent.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {

  readonly toasts = signal<ToastMessage[]>([]);
  private nextId = 1;

  show(text: string, type: ToastMessage['type'] = 'success', durationMs = 2500): void {
    const id = this.nextId++;
    this.toasts.set([...this.toasts(), { id, text, type }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  dismiss(id: number): void {
    this.toasts.set(this.toasts().filter(t => t.id !== id));
  }
}
