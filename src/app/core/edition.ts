import { environment } from '../../environments/environment';

/**
 * Edition / tier flags — one codebase, three sellable products.
 *
 *  BASIC    (₹10,000): core store + Razorpay payments + email (OTP, order mails)
 *  STANDARD (₹15,000): Basic + Shiprocket tracking & pincode checker,
 *                      Google sign-in, product videos
 *  PREMIUM  (₹20,000): everything — Hindi switch, support chatbot,
 *                      bulk CSV upload, admin User Logs
 *
 * Change `edition` in src/environments/environment*.ts to switch tiers.
 */
const edition = environment.edition || 'premium';

export const FEATURES = {
  edition,
  /** Shiprocket delivery pincode checker on product pages. */
  pincodeChecker: edition !== 'basic',
  /** Product videos (vendor upload + customer gallery playback). */
  productVideos: edition !== 'basic',
  /** EN ⇄ हिंदी language switch. */
  hindi: edition === 'premium',
  /** Floating customer support chatbot. */
  chatbot: false,  // PS Sports: no chatbot
  /** Vendor bulk CSV product upload. */
  bulkCsvUpload: false,  // PS Sports: admin uploads directly
  /** Admin User Logs (visitor/login audit trail). */
  userLogs: false,  // PS Sports: simplified admin
} as const;
