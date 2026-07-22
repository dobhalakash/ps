import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupportMessageService } from '../../../core/services/support-message.service';
import { UploadService } from '../../../core/services/upload.service';
import { SupportMessage } from '../../../core/models/support-message.model';
import { BusinessNavComponent } from '../../../shared/business-nav/business-nav.component';

/**
 * Support Chat: lets a business admin message the platform's Super Admin
 * directly if any issue occurs (payment, order, account, etc.), with
 * optional document/image attachments.
 */
@Component({
  selector: 'app-business-support',
  standalone: true,
  imports: [CommonModule, FormsModule, BusinessNavComponent],
  templateUrl: './support.component.html',
  styleUrl: './support.component.css'
})
export class BusinessSupportComponent implements OnInit {

  readonly messages = signal<SupportMessage[]>([]);
  readonly loading = signal(true);
  readonly sending = signal(false);
  readonly uploading = signal(false);
  readonly error = signal('');

  messageText = '';
  pendingAttachmentUrl = '';
  pendingAttachmentName = '';

  constructor(
    private supportMessageService: SupportMessageService,
    private uploadService: UploadService
  ) {
  }

  ngOnInit(): void {
    this.loadThread();
  }

  loadThread(): void {
    this.loading.set(true);
    this.supportMessageService.getOwnThread().subscribe({
      next: res => {
        this.messages.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    this.error.set('');

    this.uploadService.uploadDocument(file).subscribe({
      next: res => {
        this.uploading.set(false);
        this.pendingAttachmentUrl = res.data.url;
        this.pendingAttachmentName = res.data.filename;
        input.value = '';
      },
      error: err => {
        this.uploading.set(false);
        this.error.set(err?.error?.message || 'Could not upload file.');
        input.value = '';
      }
    });
  }

  removeAttachment(): void {
    this.pendingAttachmentUrl = '';
    this.pendingAttachmentName = '';
  }

  send(): void {
    if (!this.messageText.trim() && !this.pendingAttachmentUrl) {
      return;
    }
    this.sending.set(true);
    this.error.set('');

    this.supportMessageService.sendAsBusiness({
      message: this.messageText.trim() || undefined,
      attachmentUrl: this.pendingAttachmentUrl || undefined,
      attachmentName: this.pendingAttachmentName || undefined
    }).subscribe({
      next: res => {
        this.sending.set(false);
        this.messages.set([...this.messages(), res.data]);
        this.messageText = '';
        this.removeAttachment();
      },
      error: err => {
        this.sending.set(false);
        this.error.set(err?.error?.message || 'Could not send message.');
      }
    });
  }
}
