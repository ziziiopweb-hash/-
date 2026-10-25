import fs from 'fs';
import path from 'path';
import { hashPassword } from './auth.ts';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  name: string;
  phone: string;
  role: 'admin' | 'customer';
  language: 'ar' | 'en';
  createdAt: string;
  lastLoginAt?: string;
}

export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon: string;
  sortOrder: number;
}

export type DeliveryMethod = 'player_id' | 'account_login' | 'digital_code';

export interface ProductVariant {
  id: string;
  productId: string;
  nameAr: string;
  nameEn: string;
  amount: number | string;
  unit: string;
  priceMRU: number;
  active: boolean;
  deliveryMethod?: DeliveryMethod;
  sortOrder: number;
}

export interface Product {
  id: string;
  categoryId: string;
  game: string;
  nameAr: string;
  nameEn: string;
  image: string;
  artworkThumbnail?: string;
  artworkBanner?: string;
  genre?: string;
  badgeTagAr?: string;
  badgeTagEn?: string;
  deliveryMethod: DeliveryMethod;
  requiresPlayerId: boolean;
  requiresZoneId?: boolean;
  requiresServer?: boolean;
  requiresAccountCredentials?: boolean;
  active: boolean;
  descriptionAr: string;
  descriptionEn: string;
  warningNoticeAr?: string;
  warningNoticeEn?: string;
  sortOrder: number;
}

export type OrderStatus =
  | 'awaiting_payment'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'needs_review';

export interface OrderStatusHistoryItem {
  id: string;
  status: OrderStatus;
  note: string;
  changedBy: string;
  timestamp: string;
}

export interface Order {
  id: string;
  reference: string;
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  deliveryMethod: DeliveryMethod;
  playerId?: string;
  playerZoneId?: string;
  serverName?: string;
  accountCredentialsEncrypted?: string;
  amountMRU: number;
  paymentMethod: 'bankily' | 'masrivi' | 'sedad';
  paymentPhone: string; // 31520844
  transactionReference?: string;
  paymentProofUrl?: string;
  status: OrderStatus;
  adminNotes?: string;
  customerNotes?: string;
  createdAt: string;
  updatedAt: string;
  history: OrderStatusHistoryItem[];
}

export interface Announcement {
  id: string;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  type: 'info' | 'promotion' | 'warning';
  active: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  orderReference?: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  details: string;
  ip?: string;
  timestamp: string;
}

export interface StoreSettings {
  paymentNumber: string; // 31520844
  whatsappNumber: string; // e.g. +22231520844
  supportHoursAr: string;
  supportHoursEn: string;
  bankilyInstructionsAr: string;
  bankilyInstructionsEn: string;
  masriviInstructionsAr: string;
  masriviInstructionsEn: string;
  sedadInstructionsAr: string;
  sedadInstructionsEn: string;
  bannerNoticeAr: string;
  bannerNoticeEn: string;
  bannerActive: boolean;
}

export interface DatabaseSchema {
  version: number;
  users: User[];
  categories: Category[];
  products: Product[];
  variants: ProductVariant[];
  orders: Order[];
  announcements: Announcement[];
  supportTickets: SupportTicket[];
  auditLogs: AuditLog[];
  settings: StoreSettings;
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'shadow_store.json');
const DB_TMP = path.join(DB_DIR, 'shadow_store.tmp.json');

class DatabaseService {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private getInitialData(): DatabaseSchema {
    const adminPass = process.env.ADMIN_PASSWORD || 'ShadowAdmin#2026!';
    const { hash, salt } = hashPassword(adminPass);

    const categories: Category[] = [
      { id: 'cat-battle-royale', nameAr: 'ألعاب باتل رويال', nameEn: 'Battle Royale Games', slug: 'battle-royale', icon: 'Crosshair', sortOrder: 1 },
      { id: 'cat-sports', nameAr: 'ألعاب رياضية', nameEn: 'Sports Games', slug: 'sports', icon: 'Trophy', sortOrder: 2 },
      { id: 'cat-cards', nameAr: 'بطاقات الهدايا', nameEn: 'Gift Cards', slug: 'gift-cards', icon: 'Gift', sortOrder: 3 },
      { id: 'cat-subscriptions', nameAr: 'اشتراكات رقمية', nameEn: 'Digital Subscriptions', slug: 'subscriptions', icon: 'Sparkles', sortOrder: 4 },
    ];

    const products: Product[] = [
      {
        id: 'prod-ff-diamonds',
        categoryId: 'cat-battle-royale',
        game: 'Free Fire',
        nameAr: 'فري فاير — شحن جواهر (ID المعرف)',
        nameEn: 'Free Fire — Diamonds (Player ID)',
        image: '/public/assets/aistudio/33ab4129a3cc0ba004d7034d34df75d1_e18e035c.jpg',
        genre: 'Battle Royale',
        badgeTagAr: 'أبطال فري فاير الرسمية',
        badgeTagEn: 'Official Heroes Artwork',
        deliveryMethod: 'player_id',
        requiresPlayerId: true,
        requiresZoneId: false,
        requiresServer: false,
        active: true,
        descriptionAr: 'شحن فوري ومضمون 100% لجواهر فري فاير عن طريق الـ ID فقط دون الحاجة لأي كلمات مرور.',
        descriptionEn: '100% guaranteed fast Free Fire diamonds recharge via Player ID only. No password required.',
        sortOrder: 1,
      },
      {
        id: 'prod-ff-memberships-id',
        categoryId: 'cat-battle-royale',
        game: 'Free Fire',
        nameAr: 'فري فاير — العضويات (ID المعرف)',
        nameEn: 'Free Fire — Memberships (Player ID)',
        image: '/src/assets/images/game_freefire_showcase_1792771592743.jpg',
        genre: 'Battle Royale',
        badgeTagAr: 'عضويات VIP رسمية',
        badgeTagEn: 'Official VIP Pass',
        deliveryMethod: 'player_id',
        requiresPlayerId: true,
        requiresZoneId: false,
        requiresServer: false,
        active: true,
        descriptionAr: 'تفعيل العضوية الأسبوعية أو الشهرية في فري فاير مباشرة عبر الـ ID الرسمي.',
        descriptionEn: 'Activate weekly or monthly Free Fire memberships directly using official Player ID.',
        sortOrder: 2,
      },
      {
        id: 'prod-ff-memberships-account',
        categoryId: 'cat-battle-royale',
        game: 'Free Fire',
        nameAr: 'فري فاير — عضويات (شحن داخلي بالحساب)',
        nameEn: 'Free Fire — Memberships (Account Delivery)',
        image: '/public/assets/aistudio/33ab4129a3cc0ba004d7034d34df75d1_e18e035c.jpg',
        genre: 'Battle Royale',
        badgeTagAr: 'شحن داخلي مخفض',
        badgeTagEn: 'Account Direct Top-Up',
        deliveryMethod: 'account_login',
        requiresPlayerId: false,
        requiresAccountCredentials: true,
        active: true,
        descriptionAr: 'شحن العضويات عبر تسجيل الدخول المباشر للحساب بأسعار مخفضة وبتشفير آمن وبإشراف فريق شادو ستور.',
        descriptionEn: 'Discounted membership recharge via secure account login handled by Shadow Store specialists.',
        warningNoticeAr: 'تنبيه أمان: يتم استخدام بيانات الدخول حصرياً لتفعيل الشحن وتُمسح فور اكتمال الطلب.',
        warningNoticeEn: 'Security Notice: Credentials are used exclusively for fulfillment and deleted upon completion.',
        sortOrder: 3,
      },
      {
        id: 'prod-ff-booyah',
        categoryId: 'cat-battle-royale',
        game: 'Free Fire',
        nameAr: 'فري فاير — بوياه باس (Booyah Pass)',
        nameEn: 'Free Fire — Booyah Pass',
        image: '/src/assets/images/game_freefire_showcase_1792771592743.jpg',
        genre: 'Battle Royale',
        badgeTagAr: 'سيزون بوياه باس',
        badgeTagEn: 'Booyah Pass Season',
        deliveryMethod: 'player_id',
        requiresPlayerId: true,
        requiresZoneId: false,
        requiresServer: false,
        active: true,
        descriptionAr: 'فتح وتفعيل تصريح البوياه باس السيزون الحالي عبر الـ ID الرسمي.',
        descriptionEn: 'Unlock the current season Free Fire Booyah Pass instantly via Player ID.',
        sortOrder: 4,
      },
      {
        id: 'prod-pubg-uc',
        categoryId: 'cat-battle-royale',
        game: 'PUBG Mobile',
        nameAr: 'ببجي موبايل — شدات UC (ID المعرف)',
        nameEn: 'PUBG Mobile — UC (Player ID)',
        image: '/src/assets/images/game_pubg_showcase_1792771593842.jpg',
        genre: 'Tactical Battle Royale',
        badgeTagAr: 'خوذة لفل 3 وصناديق UC',
        badgeTagEn: 'Level 3 Helmet & UC',
        deliveryMethod: 'player_id',
        requiresPlayerId: true,
        requiresZoneId: false,
        requiresServer: false,
        active: true,
        descriptionAr: 'شحن شدات ببجي موبايل الأصلية بأمان عبر الـ ID الرسمي للحساب.',
        descriptionEn: 'Original PUBG Mobile Unknown Cash (UC) fast recharge via Player ID.',
        sortOrder: 5,
      },
      {
        id: 'prod-efootball-coins',
        categoryId: 'cat-sports',
        game: 'eFootball',
        nameAr: 'إي فوتبول — كوينز eFootball Coins',
        nameEn: 'eFootball — Coins',
        image: '/public/assets/aistudio/IMG_99eb4f47-d254-4ab5-b447-de06effafee0_658a16ca.jpg',
        genre: 'Football Simulation',
        badgeTagAr: 'إصدار لامين يامال ديلوكس الرسمي',
        badgeTagEn: 'Official Lamine Yamal Deluxe Edition',
        deliveryMethod: 'player_id',
        requiresPlayerId: true,
        requiresServer: true,
        active: true,
        descriptionAr: 'شحن كوينز كونامي إي فوتبول لفتح بكجات نجوم الأسبوع وبكجات الأساطير.',
        descriptionEn: 'Recharge eFootball Konami Coins for Epic and POTW player packs.',
        sortOrder: 6,
      },
      {
        id: 'prod-ea-fc-points',
        categoryId: 'cat-sports',
        game: 'EA SPORTS FC',
        nameAr: 'إف سي موبايل — نقاط FC Points',
        nameEn: 'FC Mobile — FC Points',
        image: '/src/assets/images/game_eafc_showcase_1792773279075.jpg',
        genre: 'Football Simulation',
        badgeTagAr: 'تصوير رياضي وإضاءة ملاعب واقعية',
        badgeTagEn: 'Realistic Sports Stadium Aesthetics',
        deliveryMethod: 'player_id',
        requiresPlayerId: true,
        active: true,
        descriptionAr: 'شحن نقاط فيفا إف سي موبايل الرسمية لشراء الحزم والـ Star Pass.',
        descriptionEn: 'Official FC Mobile points recharge for packs and Star Pass progression.',
        sortOrder: 7,
      },
      {
        id: 'prod-psn-cards',
        categoryId: 'cat-cards',
        game: 'PlayStation',
        nameAr: 'بطاقات بلايستيشن ستور (أمريكي US)',
        nameEn: 'PlayStation Network Store (US)',
        image: '/src/assets/images/game_psn_showcase_1792773278965.jpg',
        genre: 'Console Gaming Store',
        badgeTagAr: 'بطاقات بلايستيشن الرقمية',
        badgeTagEn: 'PlayStation Store Digital Card',
        deliveryMethod: 'digital_code',
        requiresPlayerId: false,
        active: true,
        descriptionAr: 'أكواد رقمية أصلية 100% لحسابات بلايستيشن ستور الأمريكية مع إرسال الكود فورياً.',
        descriptionEn: '100% genuine PlayStation Store US digital prepaid redeem codes.',
        sortOrder: 8,
      },
      {
        id: 'prod-google-play',
        categoryId: 'cat-cards',
        game: 'Google Play',
        nameAr: 'بطاقات جوجل بلاي ستور',
        nameEn: 'Google Play Gift Cards',
        image: '/src/assets/images/game_googleplay_showcase_1792773278837.jpg',
        genre: 'Digital Gift Cards',
        badgeTagAr: 'بطاقات جوجل بلاي الرقمية',
        badgeTagEn: 'Google Play Digital Card',
        deliveryMethod: 'digital_code',
        requiresPlayerId: false,
        active: true,
        descriptionAr: 'أكواد شحن رصيد جوجل بلاي للمتجر لشراء التطبيقات والألعاب والكتب.',
        descriptionEn: 'Google Play Store prepaid codes for app and in-game digital purchases.',
        sortOrder: 9,
      },
    ];

    // EXACT FREE FIRE PRICES AS STRICTLY REQUESTED BY USER
    const variants: ProductVariant[] = [
      // Free Fire Diamonds via Player ID:
      // 110 = 50 MRU; 220 = 100 MRU; 330 = 150 MRU; 440 = 200 MRU;
      // 1166 = 500 MRU; 1386 = 600 MRU; 1606 = 700 MRU; 2368 = 1000 MRU.
      { id: 'v-ff-110', productId: 'prod-ff-diamonds', nameAr: '110 جوهرة', nameEn: '110 Diamonds', amount: 110, unit: 'Diamonds', priceMRU: 50, active: true, sortOrder: 1 },
      { id: 'v-ff-220', productId: 'prod-ff-diamonds', nameAr: '220 جوهرة', nameEn: '220 Diamonds', amount: 220, unit: 'Diamonds', priceMRU: 100, active: true, sortOrder: 2 },
      { id: 'v-ff-330', productId: 'prod-ff-diamonds', nameAr: '330 جوهرة', nameEn: '330 Diamonds', amount: 330, unit: 'Diamonds', priceMRU: 150, active: true, sortOrder: 3 },
      { id: 'v-ff-440', productId: 'prod-ff-diamonds', nameAr: '440 جوهرة', nameEn: '440 Diamonds', amount: 440, unit: 'Diamonds', priceMRU: 200, active: true, sortOrder: 4 },
      { id: 'v-ff-1166', productId: 'prod-ff-diamonds', nameAr: '1,166 جوهرة', nameEn: '1,166 Diamonds', amount: 1166, unit: 'Diamonds', priceMRU: 500, active: true, sortOrder: 5 },
      { id: 'v-ff-1386', productId: 'prod-ff-diamonds', nameAr: '1,386 جوهرة', nameEn: '1,386 Diamonds', amount: 1386, unit: 'Diamonds', priceMRU: 600, active: true, sortOrder: 6 },
      { id: 'v-ff-1606', productId: 'prod-ff-diamonds', nameAr: '1,606 جوهرة', nameEn: '1,606 Diamonds', amount: 1606, unit: 'Diamonds', priceMRU: 700, active: true, sortOrder: 7 },
      { id: 'v-ff-2368', productId: 'prod-ff-diamonds', nameAr: '2,368 جوهرة', nameEn: '2,368 Diamonds', amount: 2368, unit: 'Diamonds', priceMRU: 1000, active: true, sortOrder: 8 },

      // Free Fire Memberships via Player ID:
      // Weekly = 120 MRU; Monthly = 450 MRU
      { id: 'v-ff-mem-id-wk', productId: 'prod-ff-memberships-id', nameAr: 'عضوية أسبوعية (ID)', nameEn: 'Weekly Membership (Player ID)', amount: 'Weekly', unit: 'Membership', priceMRU: 120, active: true, sortOrder: 1 },
      { id: 'v-ff-mem-id-mo', productId: 'prod-ff-memberships-id', nameAr: 'عضوية شهرية (ID)', nameEn: 'Monthly Membership (Player ID)', amount: 'Monthly', unit: 'Membership', priceMRU: 450, active: true, sortOrder: 2 },

      // Free Fire Memberships via account-based delivery:
      // Weekly = 100 MRU; Monthly = 400 MRU
      { id: 'v-ff-mem-acc-wk', productId: 'prod-ff-memberships-account', nameAr: 'عضوية أسبوعية (بالحساب)', nameEn: 'Weekly Membership (Account)', amount: 'Weekly', unit: 'Membership', priceMRU: 100, active: true, sortOrder: 1 },
      { id: 'v-ff-mem-acc-mo', productId: 'prod-ff-memberships-account', nameAr: 'عضوية شهرية (بالحساب)', nameEn: 'Monthly Membership (Account)', amount: 'Monthly', unit: 'Membership', priceMRU: 400, active: true, sortOrder: 2 },

      // Booyah Pass = 150 MRU
      { id: 'v-ff-booyah-pass', productId: 'prod-ff-booyah', nameAr: 'تصريح بوياه باس (Booyah Pass)', nameEn: 'Booyah Pass Season', amount: 1, unit: 'Pass', priceMRU: 150, active: true, sortOrder: 1 },

      // PUBG Mobile UC
      { id: 'v-pubg-60', productId: 'prod-pubg-uc', nameAr: '60 شدة UC', nameEn: '60 UC', amount: 60, unit: 'UC', priceMRU: 45, active: true, sortOrder: 1 },
      { id: 'v-pubg-325', productId: 'prod-pubg-uc', nameAr: '325 شدة UC', nameEn: '325 UC', amount: 325, unit: 'UC', priceMRU: 220, active: true, sortOrder: 2 },
      { id: 'v-pubg-660', productId: 'prod-pubg-uc', nameAr: '660 شدة UC', nameEn: '660 UC', amount: 660, unit: 'UC', priceMRU: 430, active: true, sortOrder: 3 },
      { id: 'v-pubg-1800', productId: 'prod-pubg-uc', nameAr: '1,800 شدة UC', nameEn: '1,800 UC', amount: 1800, unit: 'UC', priceMRU: 1100, active: true, sortOrder: 4 },

      // eFootball Coins
      { id: 'v-efb-130', productId: 'prod-efootball-coins', nameAr: '130 كوينز', nameEn: '130 Coins', amount: 130, unit: 'Coins', priceMRU: 60, active: true, sortOrder: 1 },
      { id: 'v-efb-550', productId: 'prod-efootball-coins', nameAr: '550 كوينز', nameEn: '550 Coins', amount: 550, unit: 'Coins', priceMRU: 240, active: true, sortOrder: 2 },
      { id: 'v-efb-1040', productId: 'prod-efootball-coins', nameAr: '1,040 كوينز', nameEn: '1,040 Coins', amount: 1040, unit: 'Coins', priceMRU: 450, active: true, sortOrder: 3 },
      { id: 'v-efb-2130', productId: 'prod-efootball-coins', nameAr: '2,130 كوينز', nameEn: '2,130 Coins', amount: 2130, unit: 'Coins', priceMRU: 900, active: true, sortOrder: 4 },

      // EA FC Mobile Points
      { id: 'v-eafc-100', productId: 'prod-ea-fc-points', nameAr: '100 نقطة FC', nameEn: '100 FC Points', amount: 100, unit: 'Points', priceMRU: 50, active: true, sortOrder: 1 },
      { id: 'v-eafc-520', productId: 'prod-ea-fc-points', nameAr: '520 نقطة FC', nameEn: '520 FC Points', amount: 520, unit: 'Points', priceMRU: 250, active: true, sortOrder: 2 },
      { id: 'v-eafc-1070', productId: 'prod-ea-fc-points', nameAr: '1,070 نقطة FC', nameEn: '1,070 FC Points', amount: 1070, unit: 'Points', priceMRU: 500, active: true, sortOrder: 3 },

      // PlayStation Cards
      { id: 'v-psn-10', productId: 'prod-psn-cards', nameAr: 'بطاقة 10$ بلايستيشن', nameEn: '$10 PSN Card', amount: 10, unit: 'USD', priceMRU: 420, active: true, sortOrder: 1 },
      { id: 'v-psn-25', productId: 'prod-psn-cards', nameAr: 'بطاقة 25$ بلايستيشن', nameEn: '$25 PSN Card', amount: 25, unit: 'USD', priceMRU: 1050, active: true, sortOrder: 2 },
      { id: 'v-psn-50', productId: 'prod-psn-cards', nameAr: 'بطاقة 50$ بلايستيشن', nameEn: '$50 PSN Card', amount: 50, unit: 'USD', priceMRU: 2100, active: true, sortOrder: 3 },

      // Google Play
      { id: 'v-gp-5', productId: 'prod-google-play', nameAr: 'بطاقة 5$ جوجل بلاي', nameEn: '$5 Google Play', amount: 5, unit: 'USD', priceMRU: 220, active: true, sortOrder: 1 },
      { id: 'v-gp-10', productId: 'prod-google-play', nameAr: 'بطاقة 10$ جوجل بلاي', nameEn: '$10 Google Play', amount: 10, unit: 'USD', priceMRU: 430, active: true, sortOrder: 2 },
      { id: 'v-gp-25', productId: 'prod-google-play', nameAr: 'بطاقة 25$ جوجل بلاي', nameEn: '$25 Google Play', amount: 25, unit: 'USD', priceMRU: 1070, active: true, sortOrder: 3 },
    ];

    const initialAdmin: User = {
      id: 'usr-admin-shadow',
      email: 'admin@shadowstore.mr',
      passwordHash: hash,
      salt: salt,
      name: 'Shadow Admin',
      phone: '31520844',
      role: 'admin',
      language: 'ar',
      createdAt: new Date().toISOString(),
    };

    const initialSettings: StoreSettings = {
      paymentNumber: '31520844',
      whatsappNumber: '22231520844',
      supportHoursAr: 'يومياً من الساعة 09:00 صباحاً حتى 02:00 بعد منتصف الليل بتوقيت موريتانيا',
      supportHoursEn: 'Daily from 09:00 AM to 02:00 AM (Mauritania Time GMT)',
      bankilyInstructionsAr: 'قم بفتح تطبيق بنكيلي (Bankily)، اختر تحويل أموال إلى الرقم 31520844، ثم اكتب رقم طلبك أو اسمك في خانة الملاحظات، وانسخ رقم العملية وأرفقه هنا.',
      bankilyInstructionsEn: 'Open Bankily app, transfer the exact MRU total to 31520844, include your Order Reference in the note, and upload the transaction ID or screenshot.',
      masriviInstructionsAr: 'قم بالتحويل عبر تطبيق مصرفي (Masrivi) إلى الرقم 31520844، وتأكد من كتابة مرجع الطلب في الوصف وإدخال رقم الإشعار.',
      masriviInstructionsEn: 'Transfer via Masrivi app to 31520844 with your Order Reference in the description field.',
      sedadInstructionsAr: 'قم بالدفع عبر محفظة سداد (Sedad) إلى الرقم 31520844 وتأكيد التحويل فوراً.',
      sedadInstructionsEn: 'Send payment via Sedad digital wallet to 31520844 and attach the payment proof.',
      bannerNoticeAr: 'أهلاً بكم في شادو ستور — الشحن متاح على مدار الساعة عبر بنكيلي، مصرفي، وسداد برقم الدفع 31520844.',
      bannerNoticeEn: 'Welcome to SHADOW STORE — Recharges available 24/7 via Bankily, Masrivi, and Sedad to 31520844.',
      bannerActive: true,
    };

    const announcements: Announcement[] = [
      {
        id: 'ann-1',
        titleAr: 'عروض فري فاير الخاصة بأسعار حصرية!',
        titleEn: 'Exclusive Free Fire Special Diamond Prices!',
        contentAr: 'شحن فري فاير متاح الآن بأفضل الأسعار الرسمية في موريتانيا عبر الـ ID، 110 جوهرة بـ 50 أوقية فقط و 2368 جوهرة بـ 1000 أوقية!',
        contentEn: 'Free Fire direct ID recharges now live with best rates in Mauritania: 110 diamonds for only 50 MRU and 2,368 diamonds for 1,000 MRU!',
        type: 'promotion',
        active: true,
        createdAt: new Date().toISOString(),
      },
    ];

    // Initial realistic orders to showcase persistent tracking
    const orders: Order[] = [
      {
        id: 'ord-seed-001',
        reference: 'SHD-2026-9812',
        customerId: null,
        customerName: 'محمد الأمين',
        customerPhone: '46123456',
        customerEmail: 'med@example.mr',
        productId: 'prod-ff-diamonds',
        variantId: 'v-ff-1166',
        productName: 'فري فاير — شحن جواهر (ID المعرف)',
        variantName: '1,166 جوهرة',
        deliveryMethod: 'player_id',
        playerId: '2847193021',
        amountMRU: 500,
        paymentMethod: 'bankily',
        paymentPhone: '31520844',
        transactionReference: 'BKL-7749102',
        status: 'completed',
        adminNotes: 'تم الشحن بنجاح من المنظومة الرسمية',
        customerNotes: 'تم تزويد حسابك بـ 1166 جوهرة بنجاح. شكراً لثقتك بشادو ستور!',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        history: [
          { id: 'h-1', status: 'awaiting_payment', note: 'تم إنشاء الطلب في انتظار التحويل', changedBy: 'System', timestamp: new Date(Date.now() - 3600000 * 4).toISOString() },
          { id: 'h-2', status: 'in_progress', note: 'تم تأكيد استلام حوالة بنكيلي وجاري تنفيذ الشحن', changedBy: 'Admin', timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString() },
          { id: 'h-3', status: 'completed', note: 'تم شحن الجواهر للاعب بنجاح', changedBy: 'Admin', timestamp: new Date(Date.now() - 3600000 * 3).toISOString() },
        ],
      },
      {
        id: 'ord-seed-002',
        reference: 'SHD-2026-4419',
        customerId: null,
        customerName: 'سيدي أحمد',
        customerPhone: '36987123',
        customerEmail: 'sidi@example.mr',
        productId: 'prod-ff-booyah',
        variantId: 'v-ff-booyah-pass',
        productName: 'فري فاير — بوياه باس (Booyah Pass)',
        variantName: 'تصريح بوياه باس',
        deliveryMethod: 'player_id',
        playerId: '190482015',
        amountMRU: 150,
        paymentMethod: 'masrivi',
        paymentPhone: '31520844',
        transactionReference: 'MSRV-901844',
        status: 'in_progress',
        adminNotes: 'جاري التحقق من التحويل وتفعيل البوياه باس',
        customerNotes: 'طلبك قيد المراجعة والتنفيذ الآن',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        updatedAt: new Date(Date.now() - 900000).toISOString(),
        history: [
          { id: 'h-4', status: 'awaiting_payment', note: 'تم استلام بيانات الطلب', changedBy: 'System', timestamp: new Date(Date.now() - 1800000).toISOString() },
          { id: 'h-5', status: 'in_progress', note: 'وصل إشعار مصرفي وقيد التنفيذ', changedBy: 'Admin', timestamp: new Date(Date.now() - 900000).toISOString() },
        ],
      },
    ];

    return {
      version: 1,
      users: [initialAdmin],
      categories,
      products,
      variants,
      orders,
      announcements,
      supportTickets: [
        {
          id: 'tkt-seed-1',
          ticketNumber: 'TKT-8841',
          customerName: 'يعقوب ولد فال',
          customerPhone: '22114455',
          orderReference: 'SHD-2026-9812',
          subject: 'استفسار عن وقت التوصيل',
          message: 'السلام عليكم، كم يستغرق وصول جواهر فري فاير بعد التحويل؟',
          status: 'resolved',
          adminReply: 'وعليكم السلام، يستغرق الشحن عادة من دقيقة إلى 10 دقائق بعد تأكيد الحوالة. شكراً لتواصلك.',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 80000000).toISOString(),
        },
      ],
      auditLogs: [
        {
          id: 'log-1',
          userId: 'usr-admin-shadow',
          userEmail: 'admin@shadowstore.mr',
          action: 'SYSTEM_INITIALIZATION',
          details: 'Initialized SHADOW STORE with official Mauritanian pricing and payment details.',
          ip: '127.0.0.1',
          timestamp: new Date().toISOString(),
        },
      ],
      settings: initialSettings,
    };
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as DatabaseSchema;
        // Verify essential fields exist
        if (parsed.version && parsed.products && parsed.variants && parsed.orders) {
          // Automatic Artwork Migration to ensure every game has distinct, authentic artwork
          const initial = this.getInitialData();
          let changed = false;
          initial.products.forEach(initP => {
            const existing = parsed.products.find(p => p.id === initP.id);
            if (existing) {
              // If image was matching old default or needs unique upgrade
              if (!existing.image || existing.image === '/src/assets/images/hero_gaming_shadow_store_1792771592028.jpg' || (existing.id === 'prod-ea-fc-points' && existing.image.includes('efootball')) || (existing.id === 'prod-efootball-coins' && !existing.image.includes('IMG_99eb4f47')) || (existing.id === 'prod-ff-diamonds' && !existing.image.includes('33ab4129'))) {
                existing.image = initP.image;
                changed = true;
              }
              if (!existing.genre && initP.genre) {
                existing.genre = initP.genre;
                changed = true;
              }
              if (!existing.badgeTagAr && initP.badgeTagAr) {
                existing.badgeTagAr = initP.badgeTagAr;
                existing.badgeTagEn = initP.badgeTagEn;
                changed = true;
              }
            }
          });
          if (changed) {
            this.saveDatabase(parsed);
          }
          return parsed;
        }
      }
    } catch (err) {
      console.error('Failed to read database file, initializing fresh schema:', err);
    }
    const initial = this.getInitialData();
    this.saveDatabase(initial);
    return initial;
  }

  public save(): void {
    this.saveDatabase(this.data);
  }

  private saveDatabase(data: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const json = JSON.stringify(data, null, 2);
      fs.writeFileSync(DB_TMP, json, 'utf-8');
      fs.renameSync(DB_TMP, DB_FILE);
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  // Getters
  public getUsers(): User[] { return this.data.users; }
  public getCategories(): Category[] { return this.data.categories; }
  public getProducts(): Product[] { return this.data.products; }
  public getVariants(): ProductVariant[] { return this.data.variants; }
  public getOrders(): Order[] { return this.data.orders; }
  public getAnnouncements(): Announcement[] { return this.data.announcements; }
  public getSupportTickets(): SupportTicket[] { return this.data.supportTickets; }
  public getAuditLogs(): AuditLog[] { return this.data.auditLogs; }
  public getSettings(): StoreSettings { return this.data.settings; }

  // User methods
  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public addUser(user: User): void {
    this.data.users.push(user);
    this.save();
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    return this.data.users[idx];
  }

  // Product & Variant methods
  public findProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  public findVariantById(id: string): ProductVariant | undefined {
    return this.data.variants.find(v => v.id === id);
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | null {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.data.products[idx] = { ...this.data.products[idx], ...updates };
    this.save();
    return this.data.products[idx];
  }

  public updateVariant(id: string, updates: Partial<ProductVariant>): ProductVariant | null {
    const idx = this.data.variants.findIndex(v => v.id === id);
    if (idx === -1) return null;
    this.data.variants[idx] = { ...this.data.variants[idx], ...updates };
    this.save();
    return this.data.variants[idx];
  }

  public addProduct(product: Product): void {
    this.data.products.push(product);
    this.save();
  }

  public addVariant(variant: ProductVariant): void {
    this.data.variants.push(variant);
    this.save();
  }

  // Orders
  public addOrder(order: Order): void {
    this.data.orders.unshift(order);
    this.save();
  }

  public findOrderByReference(reference: string): Order | undefined {
    return this.data.orders.find(o => o.reference.toUpperCase() === reference.toUpperCase());
  }

  public findOrderById(id: string): Order | undefined {
    return this.data.orders.find(o => o.id === id);
  }

  public updateOrder(id: string, updates: Partial<Order>): Order | null {
    const idx = this.data.orders.findIndex(o => o.id === id);
    if (idx === -1) return null;
    this.data.orders[idx] = { ...this.data.orders[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.orders[idx];
  }

  public addOrderStatusHistory(orderId: string, status: OrderStatus, note: string, changedBy: string): void {
    const order = this.findOrderById(orderId);
    if (order) {
      if (!order.history) order.history = [];
      order.history.push({
        id: 'h-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        status,
        note,
        changedBy,
        timestamp: new Date().toISOString(),
      });
      order.status = status;
      order.updatedAt = new Date().toISOString();
      this.save();
    }
  }

  // Support
  public addSupportTicket(ticket: SupportTicket): void {
    this.data.supportTickets.unshift(ticket);
    this.save();
  }

  public updateSupportTicket(id: string, updates: Partial<SupportTicket>): SupportTicket | null {
    const idx = this.data.supportTickets.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.data.supportTickets[idx] = { ...this.data.supportTickets[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.supportTickets[idx];
  }

  // Settings
  public updateSettings(updates: Partial<StoreSettings>): StoreSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.save();
    return this.data.settings;
  }

  // Announcements
  public addAnnouncement(ann: Announcement): void {
    this.data.announcements.unshift(ann);
    this.save();
  }

  public updateAnnouncement(id: string, updates: Partial<Announcement>): Announcement | null {
    const idx = this.data.announcements.findIndex(a => a.id === id);
    if (idx === -1) return null;
    this.data.announcements[idx] = { ...this.data.announcements[idx], ...updates };
    this.save();
    return this.data.announcements[idx];
  }

  public deleteAnnouncement(id: string): boolean {
    const idx = this.data.announcements.findIndex(a => a.id === id);
    if (idx === -1) return false;
    this.data.announcements.splice(idx, 1);
    this.save();
    return true;
  }

  // Audit Logs
  public addAuditLog(action: string, details: string, userId?: string, userEmail?: string, ip?: string): void {
    const log: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      userId,
      userEmail,
      action,
      details,
      ip,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    // Keep max 500 logs
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.save();
  }
}

export const db = new DatabaseService();
