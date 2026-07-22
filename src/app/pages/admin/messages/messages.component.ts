import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupportMessageService } from '../../../core/services/support-message.service';
import { UploadService } from '../../../core/services/upload.service';
import { SupportMessage, SupportThreadSummary } from '../../../core/models/support-message.model';
import { AdminNavComponent } from '../../../shared/admin-nav/admin-nav.component';

/**
 * Super Admin's inbox for the business Support Chat feature - one thread
 * per business, click to open and reply, with optional attachments.
 */
@Component({
  selector: 'app-admin-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavComponent],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.css'
})
export class AdminMessagesComponent implements OnInit {

  readonly threads = signal<SupportThreadSummary[]>([]);
  readonly loadingInbox = signal(true);

  readonly selectedBusinessId = signal<number | null>(null);
  readonly selectedBusinessName = signal('');
  readonly messages = signal<SupportMessage[]>([]);
  readonly loadingThread = signal(false);

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
    this.loadInbox();
  }

  loadInbox(): void {
    this.loadingInbox.set(true);
    this.supportMessageService.getInbox().subscribe({
      next: res => {
        this.threads.set(res.data);
        this.loadingInbox.set(false);
      },
      error: () => this.loadingInbox.set(false)
    });
  }

  openThread(thread: SupportThreadSummary): void {
    this.selectedBusinessId.set(thread.businessUserId);
    this.selectedBusinessName.set(thread.businessName);
    this.loadingThread.set(true);
    this.error.set('');

    this.supportMessageService.getThreadAsAdmin(thread.businessUserId).subscribe({
      next: res => {
        this.messages.set(res.data);
        this.loadingThread.set(false);
        this.loadInbox(); // refresh unread counts in the list
      },
      error: () => this.loadingThread.set(false)
    });
  }

  closeThread(): void {
    this.selectedBusinessId.set(null);
    this.messages.set([]);
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
    const businessId = this.selectedBusinessId();
    if (!businessId || (!this.messageText.trim() && !this.pendingAttachmentUrl)) {
      return;
    }
    this.sending.set(true);
    this.error.set('');

    this.supportMessageService.sendAsAdmin(businessId, {
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
