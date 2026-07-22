import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import { I18nService } from '../../core/services/i18n.service';
import { FEATURES } from '../../core/edition';

interface ChatMessage {
  from: 'bot' | 'user';
  text: string;
  link?: { label: string; path: string };
}

interface QuickReply {
  id: string;
  en: string;
  hi: string;
}

/**
 * Floating customer-support chatbot (bottom-right bubble).
 *
 * Rule-based and fully client-side: answers the most common shopper
 * questions (order tracking, shipping, returns, payments, sizes, coupons,
 * account help) with quick-reply buttons, in English or Hindi following the
 * site language. If the user is logged in and asks about their order, it
 * fetches their latest order live and reports its real status. Anything it
 * can't answer escalates to the Contact page / support email.
 *
 * Shown only to guests and customers - business/admin users have their own
 * support chat in their dashboards.
 */
@Component({
  selector: 'app-support-chatbot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './support-chatbot.component.html',
  styleUrl: './support-chatbot.component.css'
})
export class SupportChatbotComponent {

  readonly open = signal(false);
  readonly typing = signal(false);
  readonly messages = signal<ChatMessage[]>([]);
  readonly unread = signal(true); // little dot until first opened

  readonly visible = computed(() => FEATURES.chatbot && this.authService.canShop());

  readonly quickReplies: QuickReply[] = [
    { id: 'order', en: 'Where is my order?', hi: 'मेरा ऑर्डर कहाँ है?' },
    { id: 'shipping', en: 'Shipping & delivery', hi: 'शिपिंग और डिलीवरी' },
    { id: 'returns', en: 'Returns & exchanges', hi: 'रिटर्न और एक्सचेंज' },
    { id: 'payment', en: 'Payment options', hi: 'भुगतान विकल्प' },
    { id: 'size', en: 'Size guide', hi: 'साइज़ गाइड' },
    { id: 'coupon', en: 'Coupons & offers', hi: 'कूपन और ऑफ़र' },
    { id: 'account', en: 'Account help', hi: 'खाता सहायता' },
    { id: 'human', en: 'Talk to a human', hi: 'व्यक्ति से बात करें' },
  ];

  constructor(
    public authService: AuthService,
    public i18n: I18nService,
    private orderService: OrderService,
    private router: Router
  ) {
  }

  toggle(): void {
    this.open.set(!this.open());
    this.unread.set(false);
    if (this.open() && this.messages().length === 0) {
      this.botSay(this.tr(
        'Hi! I\'m the TrackHub assistant 🏆 How can I help you today? Pick a topic below or just ask.',
        'नमस्ते! मैं TrackHub असिस्टेंट हूँ 🏆 मैं आपकी कैसे मदद कर सकता हूँ? नीचे कोई विषय चुनें या अपना सवाल लिखें।'
      ));
    }
  }

  pick(reply: QuickReply): void {
    this.userSay(this.i18n.lang() === 'hi' ? reply.hi : reply.en);
    this.answer(reply.id);
  }

  send(input: HTMLInputElement): void {
    const text = input.value.trim();
    if (!text) {
      return;
    }
    input.value = '';
    this.userSay(text);
    this.answer(this.classify(text));
  }

  /** Very small intent matcher over keywords (EN + Hinglish + Hindi). */
  private classify(text: string): string {
    const t = text.toLowerCase();
    const has = (...words: string[]) => words.some(w => t.includes(w));
    if (has('order', 'track', 'deliver', 'ऑर्डर', 'डिलीवर', 'kahan', 'कहाँ')) return 'order';
    if (has('ship', 'शिपिंग', 'delivery charge', 'kitne din')) return 'shipping';
    if (has('return', 'exchange', 'refund', 'रिटर्न', 'रिफंड', 'बदल')) return 'returns';
    if (has('pay', 'upi', 'card', 'cod', 'भुगतान', 'पेमेंट')) return 'payment';
    if (has('size', 'साइज़', 'fit', 'measurement')) return 'size';
    if (has('coupon', 'discount', 'offer', 'promo', 'कूपन', 'छूट', 'ऑफ़र')) return 'coupon';
    if (has('login', 'password', 'account', 'sign', 'otp', 'खाता', 'पासवर्ड', 'लॉगिन')) return 'account';
    if (has('human', 'agent', 'person', 'call', 'contact', 'व्यक्ति', 'बात', 'संपर्क')) return 'human';
    if (has('hi', 'hello', 'hey', 'नमस्ते', 'हैलो')) return 'greet';
    return 'unknown';
  }

  private answer(intent: string): void {
    switch (intent) {
      case 'order':
        this.answerOrder();
        return;
      case 'shipping':
        this.botSay(this.tr(
          'We ship across India 🚚 Standard delivery takes 3–7 working days depending on your pincode, and shipping is FREE on orders above ₹999. You\'ll get tracking updates by email once your order ships.',
          'हम पूरे भारत में शिपिंग करते हैं 🚚 आपके पिनकोड के अनुसार डिलीवरी में 3–7 कार्य दिवस लगते हैं, और ₹999 से ऊपर के ऑर्डर पर शिपिंग मुफ़्त है। ऑर्डर शिप होते ही आपको ईमेल से ट्रैकिंग अपडेट मिलेंगे।'
        ));
        return;
      case 'returns':
        this.botSay(this.tr(
          'Easy returns! You can request a return or exchange within 7 days of delivery if the product is unused with tags intact. Go to My Orders, open the order, and choose Return/Exchange — or contact support and we\'ll arrange it.',
          'आसान रिटर्न! डिलीवरी के 7 दिनों के भीतर, यदि प्रोडक्ट बिना उपयोग किया हुआ और टैग सहित है, तो आप रिटर्न या एक्सचेंज कर सकते हैं। मेरे ऑर्डर में जाकर ऑर्डर खोलें और रिटर्न/एक्सचेंज चुनें — या सपोर्ट से संपर्क करें।'
        ), { label: this.tr('My Orders', 'मेरे ऑर्डर'), path: '/orders' });
        return;
      case 'payment':
        this.botSay(this.tr(
          'We accept UPI, credit/debit cards, net banking and wallets — all secured through Razorpay 🔒 Your payment details are encrypted and never stored on our servers.',
          'हम UPI, क्रेडिट/डेबिट कार्ड, नेट बैंकिंग और वॉलेट स्वीकार करते हैं — सब Razorpay से सुरक्षित 🔒 आपकी भुगतान जानकारी एन्क्रिप्टेड रहती है और हमारे सर्वर पर कभी सेव नहीं होती।'
        ));
        return;
      case 'size':
        this.botSay(this.tr(
          'Most of our jerseys follow standard Indian sizing (S/M/L/XL/XXL). Each product page shows available sizes — if you\'re between sizes, we recommend going one size up for a comfortable fit. Need exact measurements? Check the Size Guide on the Contact page.',
          'हमारी अधिकतर जर्सी स्टैंडर्ड भारतीय साइज़िंग (S/M/L/XL/XXL) में हैं। हर प्रोडक्ट पेज पर उपलब्ध साइज़ दिखते हैं — अगर आप दो साइज़ के बीच हैं, तो आरामदायक फिट के लिए एक साइज़ बड़ा लें। सटीक माप के लिए संपर्क पेज पर साइज़ गाइड देखें।'
        ), { label: this.tr('Size Guide', 'साइज़ गाइड'), path: '/contact' });
        return;
      case 'coupon':
        this.botSay(this.tr(
          'Apply coupon codes on the checkout page — enter the code in the coupon box and tap Apply. Keep an eye on the Deals section for the latest offers! 🎉',
          'चेकआउट पेज पर कूपन कोड लगाएँ — कूपन बॉक्स में कोड डालकर "लागू करें" दबाएँ। ताज़ा ऑफ़र के लिए डील्स सेक्शन देखते रहें! 🎉'
        ), { label: this.tr('View Deals', 'डील्स देखें'), path: '/products' });
        return;
      case 'account':
        this.botSay(this.authService.isLoggedIn()
          ? this.tr(
            'You can update your profile, addresses and password from My Account. If your email isn\'t verified yet, you\'ll see a Verify Now banner there.',
            'आप मेरा खाता से अपनी प्रोफ़ाइल, पते और पासवर्ड अपडेट कर सकते हैं। यदि आपका ईमेल सत्यापित नहीं है, तो वहाँ "अभी सत्यापित करें" बैनर दिखेगा।')
          : this.tr(
            'You can sign in or create a free account in under a minute — you\'ll need it to place orders and track them.',
            'आप एक मिनट से भी कम में साइन इन या मुफ़्त खाता बना सकते हैं — ऑर्डर करने और ट्रैक करने के लिए यह ज़रूरी है।'),
          this.authService.isLoggedIn()
            ? { label: this.tr('My Account', 'मेरा खाता'), path: '/profile' }
            : { label: this.tr('Sign In', 'साइन इन'), path: '/login' });
        return;
      case 'human':
        this.botSay(this.tr(
          'No problem! You can reach our human support team through the Contact page, or email support@ajsport.shop — we reply within 24 hours (Mon–Sat, 9 AM–7 PM).',
          'कोई बात नहीं! आप संपर्क पेज से हमारी सपोर्ट टीम तक पहुँच सकते हैं, या support@ajsport.shop पर ईमेल करें — हम 24 घंटे के भीतर जवाब देते हैं (सोम–शनि, सुबह 9 – शाम 7)।'
        ), { label: this.tr('Contact Us', 'हमसे संपर्क करें'), path: '/contact' });
        return;
      case 'greet':
        this.botSay(this.tr(
          'Hello! 👋 Ask me about your orders, shipping, returns, payments, sizes or offers.',
          'नमस्ते! 👋 मुझसे अपने ऑर्डर, शिपिंग, रिटर्न, भुगतान, साइज़ या ऑफ़र के बारे में पूछें।'
        ));
        return;
      default:
        this.botSay(this.tr(
          'I\'m not sure about that one 🤔 — try one of the topics below, or talk to our human support team.',
          'इसका जवाब मुझे ठीक से नहीं पता 🤔 — नीचे दिए विषयों में से चुनें, या हमारी सपोर्ट टीम से बात करें।'
        ), { label: this.tr('Contact Us', 'हमसे संपर्क करें'), path: '/contact' });
    }
  }

  /** "Where is my order" — answers with the user's real latest order status. */
  private answerOrder(): void {
    if (!this.authService.isLoggedIn()) {
      this.botSay(this.tr(
        'Please sign in first so I can look up your orders.',
        'कृपया पहले साइन इन करें ताकि मैं आपके ऑर्डर देख सकूँ।'
      ), { label: this.tr('Sign In', 'साइन इन'), path: '/login' });
      return;
    }
    this.typing.set(true);
    this.orderService.getMyOrders(0, 1).subscribe({
      next: res => {
        this.typing.set(false);
        const latest = res.data.content[0];
        if (!latest) {
          this.botSay(this.tr(
            'You haven\'t placed any orders yet. Start shopping and I\'ll track them for you! 🛒',
            'आपने अभी तक कोई ऑर्डर नहीं किया है। खरीदारी शुरू करें, मैं उन्हें ट्रैक करूँगा! 🛒'
          ), { label: this.tr('Start Shopping', 'खरीदारी शुरू करें'), path: '/products' });
          return;
        }
        this.botSay(this.tr(
          `Your latest order ${latest.orderNumber} is currently: ${latest.status}. Tap below for full details and tracking.`,
          `आपका नवीनतम ऑर्डर ${latest.orderNumber} अभी: ${latest.status} स्थिति में है। पूरी जानकारी और ट्रैकिंग के लिए नीचे टैप करें।`
        ), { label: this.tr('View My Orders', 'मेरे ऑर्डर देखें'), path: '/orders' });
      },
      error: () => {
        this.typing.set(false);
        this.botSay(this.tr(
          'I couldn\'t fetch your orders right now. Please check the My Orders page directly.',
          'अभी मैं आपके ऑर्डर नहीं देख पाया। कृपया सीधे मेरे ऑर्डर पेज देखें।'
        ), { label: this.tr('My Orders', 'मेरे ऑर्डर'), path: '/orders' });
      }
    });
  }

  goto(path: string): void {
    this.open.set(false);
    this.router.navigateByUrl(path);
  }

  quickLabel(q: QuickReply): string {
    return this.i18n.lang() === 'hi' ? q.hi : q.en;
  }

  private tr(en: string, hi: string): string {
    return this.i18n.lang() === 'hi' ? hi : en;
  }

  private userSay(text: string): void {
    this.messages.set([...this.messages(), { from: 'user', text }]);
  }

  private botSay(text: string, link?: { label: string; path: string }): void {
    this.typing.set(true);
    setTimeout(() => {
      this.typing.set(false);
      this.messages.set([...this.messages(), { from: 'bot', text, link }]);
      this.scrollDown();
    }, 500);
  }

  private scrollDown(): void {
    setTimeout(() => {
      const el = document.querySelector('.cb-messages');
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }
}
