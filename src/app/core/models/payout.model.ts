export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'PARTIALLY_PAID' | 'FAILED' | 'CANCELLED' | 'REVERSED' | 'DISPUTED';
export type PayoutMethod = 'UPI' | 'NEFT' | 'IMPS' | 'RTGS';

export interface Payout {
  id: number;
  orderId: number;
  orderNumber: string;
  businessUserId: number;
  businessName: string;
  customerName: string | null;
  razorpayPaymentId: string | null;
  amountPaid: number;
  platformCommission: number;
  businessShare: number;
  status: PayoutStatus;
  payoutMethod: PayoutMethod | null;
  utrNumber: string | null;
  payoutDate: string | null;
  remarks: string | null;
  proofUrl: string | null;
  proofName: string | null;
  disputeNote: string | null;
  createdAt: string;
  updatedAt: string;
  upiId: string | null;
  bankAccountNumber: string | null;
  ifscCode: string | null;
  bankName: string | null;
  accountHolderName: string | null;
}

export interface PayoutStatusHistory {
  id: number;
  oldStatus: string | null;
  newStatus: string;
  changedByName: string;
  note: string | null;
  changedAt: string;
}

export interface PayoutSummary {
  totalPending: number;
  totalPaid: number;
}

export interface MarkPayoutPaidRequest {
  status: string;
  payoutMethod?: string;
  utrNumber?: string;
  remarks?: string;
  proofUrl?: string;
  proofName?: string;
}
