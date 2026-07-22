import { Pipe, PipeTransform } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';

/**
 * Template translation pipe: {{ 'nav.home' | t }}
 * Impure so labels update instantly when the language toggles; the lookup
 * itself is a cheap O(1) dictionary read.
 */
@Pipe({ name: 't', standalone: true, pure: false })
export class TPipe implements PipeTransform {
  constructor(private i18n: I18nService) {
  }

  transform(key: string): string {
    return this.i18n.t(key);
  }
}
