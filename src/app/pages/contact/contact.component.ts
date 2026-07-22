import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TPipe } from '../../shared/pipes/t.pipe';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [TPipe, CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {

  form = { name: '', email: '', subject: '', message: '' };
  readonly submitted = signal(false);

  readonly faqs = [
    {
      question: 'How long does delivery take?',
      answer: 'Standard delivery takes 3-7 business days depending on your location. Custom team kits and personalized jerseys may take an additional 2-4 days for printing.'
    },
    {
      question: 'What is your size and return policy?',
      answer: 'Check our size chart on each product page before ordering. Unworn items with tags attached can be returned within 7 days of delivery for a refund or exchange.'
    },
    {
      question: 'What is the fabric quality of TrackHub jerseys?',
      answer: 'All TrackHub jerseys are made from breathable, moisture-wicking dry-fit fabric designed for performance training and match-day comfort.'
    },
    {
      question: 'How do I track my order?',
      answer: 'Once logged in, go to "My Orders" to view real-time status updates for all your orders.'
    },
    {
      question: 'Do you offer bulk discounts for teams and clubs?',
      answer: 'Yes! Contact us with your team size, sport, and custom design requirements and we will get back to you with a custom quote.'
    }
  ];

  submit(): void {
    this.submitted.set(true);
    this.form = { name: '', email: '', subject: '', message: '' };
  }
}
