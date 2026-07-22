import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TPipe } from '../pipes/t.pipe';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [TPipe, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
}
