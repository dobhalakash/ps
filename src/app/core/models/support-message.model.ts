export interface SupportMessage {
  id: number;
  businessUserId: number;
  businessName: string;
  senderRole: 'BUSINESS' | 'ADMIN';
  senderName: string;
  message: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  createdAt: string;
}

export interface SupportThreadSummary {
  businessUserId: number;
  businessName: string;
  lastMessage: string;
  lastSenderRole: 'BUSINESS' | 'ADMIN';
  lastMessageAt: string;
  unreadCount: number;
}

export interface SendSupportMessageRequest {
  message?: string;
  attachmentUrl?: string;
  attachmentName?: string;
}
