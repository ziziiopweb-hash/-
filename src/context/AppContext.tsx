import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, User, Product, ProductVariant, StoreSettings, Announcement } from '../types/index.ts';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedProduct: Product | null;
  selectedVariant: ProductVariant | null;
  startRecharge: (product: Product, variant?: ProductVariant) => void;
  clearRecharge: () => void;
  settings: StoreSettings | null;
  announcements: Announcement[];
  prefilledTrackingRef: string;
  setPrefilledTrackingRef: (ref: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Brand & Slogans
    store_name: 'SHADOW STORE',
    slogan_primary: 'SHADOW STORE — هو خيارك الأمثل',
    slogan_secondary: 'سرعة ⚡ أمانة 🔐 ثقة 💯',
    hero_cta_recharge: 'ابدأ الشحن',
    hero_cta_track: 'تتبع طلبي',
    hero_subtitle: 'المتجر الموريتاني الأول لشحن الألعاب والبطاقات الرقمية بأسعار رسمية ودفع محلي فوري عبر بنكيلي، مصرفي، وسداد.',
    official_payment_number: 'رقم التحويل المعتمد لجميع المعاملات:',
    instant_delivery_guarantee: 'شحن فوري عبر الـ ID الرسمي دون الحاجة لكلمة المرور',

    // Navigation
    nav_home: 'الرئيسية',
    nav_catalog: 'قائمة الألعاب',
    nav_track: 'تتبع طلبي',
    nav_support: 'الدعم والمساعدة',
    nav_account: 'حسابي',
    nav_admin: 'لوحة التحكم',
    nav_logout: 'تسجيل الخروج',
    nav_login: 'دخول / تسجيل',

    // Categories
    cat_all: 'جميع الخدمات',
    cat_battle_royale: 'ألعاب باتل رويال',
    cat_sports: 'ألعاب رياضية',
    cat_gift_cards: 'بطاقات الهدايا',
    cat_subscriptions: 'اشتراكات رقمية',

    // Free Fire section
    ff_spotlight_title: 'عروض فري فاير الرسمية الحصرية',
    ff_spotlight_subtitle: 'شحن فوري ومضمون بأفضل تسعيرة في موريتانيا',
    ff_diamonds_id: 'جواهر فري فاير (عبر ID)',
    ff_memberships_id: 'عضويات فري فاير (عبر ID)',
    ff_memberships_account: 'عضويات فري فاير (بالحساب)',
    ff_booyah_pass: 'تصريح بوياه باس (Booyah Pass)',
    ff_select_pack: 'اختر الباقة',
    ff_recharge_now: 'شحن الآن',

    // Product Card
    delivery_player_id: 'شحن بالـ ID (آمن وسريع)',
    delivery_account_login: 'شحن داخلي بالحساب',
    delivery_digital_code: 'كود رقمي فوري',
    starting_from: 'ابتداءً من',
    mru_currency: 'أوقية',
    in_stock: 'متوفر فورياً',
    out_of_stock: 'غير متوفر حالياً',
    view_packages: 'عرض الباقات والشحن',

    // Order Checkout
    checkout_title: 'إتمام طلب الشحن',
    select_package: '1. اختر الباقة المطلوبة',
    enter_player_info: '2. بيانات الحساب واللاعب',
    player_id_label: 'معرف اللاعب (Player ID)',
    player_id_placeholder: 'أدخل معرف الـ ID الخاص بك في اللعبة',
    player_id_helper: 'يمكنك نسخ الـ ID من ملفك الشخصي داخل اللعبة',
    server_zone_label: 'السيرفر / المنطقة (إن وجد)',
    account_credentials_label: 'بيانات تسجيل الدخول المؤقتة',
    account_credentials_placeholder: 'نوع الحساب (فيسبوك / جوجل) + البريد / الهاتف + كلمة المرور',
    customer_info_title: '3. معلومات المشتري (للتتبع والتواصل)',
    customer_name_label: 'الاسم الكريم',
    customer_name_placeholder: 'مثال: محمد الأمين',
    customer_phone_label: 'رقم الهاتف الموريتاني (مهم جداً للتحقق من الطلب)',
    customer_phone_placeholder: 'مثال: 31520844 أو 46123456',
    customer_email_label: 'البريد الإلكتروني (اختياري للإشعار)',
    select_payment_method: '4. اختر طريقة الدفع المحلية',
    payment_bankily: 'تطبيق بنكيلي (Bankily)',
    payment_masrivi: 'تطبيق مصرفي (Masrivi)',
    payment_sedad: 'محفظة سداد (Sedad)',
    payment_instructions_title: 'تعليمات التحويل المالي:',
    payment_dest_number: 'قم بالتحويل إلى رقم شادو ستور المعتمد:',
    payment_amount_due: 'المبلغ الإجمالي المستحق:',
    transaction_ref_label: 'رقم العملية / المرجع البنكي (Transaction Reference)',
    transaction_ref_placeholder: 'أدخل رقم إشعار التحويل البنكي (مثال: BKL-19845)',
    payment_proof_label: 'إرفاق لقطة شاشة لإشعار التحويل (اختياري)',
    customer_notes_label: 'ملاحظات إضافية للطلب (اختياري)',
    confirm_order_button: 'تأكيد وإرسال الطلب',
    order_creating: 'جاري تسجيل الطلب...',
    security_guarantee: 'معاملاتك مشفرة ومحمية بنسبة 100%. لا نشارك بياناتك إطلاقاً.',

    // Tracking
    track_title: 'تتبع حالة طلبك بأمان',
    track_subtitle: 'أدخل رقم مرجع الطلب ورقم هاتفك للتحقق وعرض آخر تحديثات الشحن',
    order_reference_label: 'رقم مرجع الطلب (Order Reference)',
    order_reference_placeholder: 'مثال: SHD-2026-9812',
    verification_phone_label: 'رقم الهاتف المسجل بالطلب (عامل التحقق والأمان)',
    track_button: 'استعلام عن الطلب',
    order_details: 'تفاصيل الطلب',
    status_awaiting_payment: 'في انتظار التحويل المالي',
    status_needs_review: 'قيد مراجعة التحويل',
    status_in_progress: 'جاري الشحن والتنفيذ',
    status_completed: 'تم الشحن بنجاح ✓',
    status_rejected: 'مرفوض',
    status_cancelled: 'ملغي',
    order_timeline: 'سجل وتحديثات الطلب',
    order_created_at: 'تاريخ الإنشاء',
    whatsapp_assistance: 'تواصل مع الدعم عبر واتساب بشأن هذا الطلب',
    attach_proof_prompt: 'هل قمت بالتحويل بعد تقديم الطلب؟ يمكنك إرفاق رقم المعاملة الآن:',
    update_proof_button: 'تحديث إشعار الدفع',

    // Support
    support_title: 'مركز الدعم والمساعدة',
    support_subtitle: 'فريق شادو ستور في خدمتكم يومياً للرد على أي استفسار وتسهيل شحن ألعابكم.',
    working_hours_title: 'أوقات العمل الرسمية',
    whatsapp_direct: 'مراسلة عبر واتساب مباشرة',
    submit_ticket_tab: 'فتح تذكرة دعم جديدة',
    lookup_ticket_tab: 'متابعة تذكرة سابقة',
    ticket_subject_label: 'موضوع الاستفسار',
    ticket_message_label: 'نص الرسالة أو المشكلة',
    ticket_submit_button: 'إرسال التذكرة',
    ticket_number_label: 'رقم التذكرة (Ticket Number)',
    ticket_lookup_button: 'بحث عن التذكرة',
    admin_response: 'رد فريق الدعم:',

    // Account & Admin
    login_tab: 'تسجيل الدخول',
    register_tab: 'إنشاء حساب جديد',
    email_label: 'البريد الإلكتروني',
    password_label: 'كلمة المرور',
    login_button: 'تسجيل الدخول',
    register_button: 'إنشاء الحساب',
    my_orders_title: 'طلباتي السابقة',
    no_orders_yet: 'لا توجد طلبات سابقة حتى الآن.',
    admin_dashboard_title: 'لوحة التحكم الإدارية — SHADOW STORE',
    admin_tab_overview: 'الإحصائيات العامة',
    admin_tab_orders: 'إدارة الطلبات',
    admin_tab_products: 'المنتجات والأسعار',
    admin_tab_support: 'تذاكر الدعم',
    admin_tab_settings: 'إعدادات المتجر',
    admin_tab_audit: 'سجل العمليات',
    admin_revenue: 'إجمالي الإيرادات المؤكدة',
    admin_pending_orders: 'طلبات في انتظار الدفع/المراجعة',
    admin_orders_progress: 'طلبات قيد التنفيذ',
    admin_completed_orders: 'طلبات مكتملة',
    admin_update_status: 'تحديث الحالة',
    admin_save: 'حفظ التعديلات',
    admin_notes: 'ملاحظة داخلية للإدارة',
    customer_visible_note: 'رسالة تظهر للعميل في التتبع',
    popular_games_chart: 'أكثر الألعاب شحناً',
    search_placeholder: 'بحث في الألعاب والخدمات...',
  },
  en: {
    // Brand & Slogans
    store_name: 'SHADOW STORE',
    slogan_primary: 'SHADOW STORE — Your Ultimate Choice',
    slogan_secondary: 'Speed ⚡ Integrity 🔐 Trust 💯',
    hero_cta_recharge: 'Start Recharge',
    hero_cta_track: 'Track My Order',
    hero_subtitle: 'The premier Mauritanian digital store for gaming recharges and digital cards at official rates with local payment via Bankily, Masrivi, and Sedad.',
    official_payment_number: 'Official payment account number for all transfers:',
    instant_delivery_guarantee: 'Instant Player ID delivery with zero password requirement',

    // Navigation
    nav_home: 'Home',
    nav_catalog: 'Game Catalog',
    nav_track: 'Track Order',
    nav_support: 'Support',
    nav_account: 'My Account',
    nav_admin: 'Admin Console',
    nav_logout: 'Sign Out',
    nav_login: 'Sign In / Register',

    // Categories
    cat_all: 'All Services',
    cat_battle_royale: 'Battle Royale',
    cat_sports: 'Sports Games',
    cat_gift_cards: 'Gift Cards',
    cat_subscriptions: 'Subscriptions',

    // Free Fire section
    ff_spotlight_title: 'Exclusive Official Free Fire Rates',
    ff_spotlight_subtitle: 'Instant & guaranteed diamond recharge at top Mauritanian rates',
    ff_diamonds_id: 'Free Fire Diamonds (Player ID)',
    ff_memberships_id: 'Free Fire Memberships (Player ID)',
    ff_memberships_account: 'Free Fire Memberships (Account Login)',
    ff_booyah_pass: 'Booyah Pass Season',
    ff_select_pack: 'Select Package',
    ff_recharge_now: 'Recharge Now',

    // Product Card
    delivery_player_id: 'Player ID Recharge (Fast & Safe)',
    delivery_account_login: 'Account-Based Delivery',
    delivery_digital_code: 'Instant Digital Code',
    starting_from: 'Starting from',
    mru_currency: 'MRU',
    in_stock: 'In Stock',
    out_of_stock: 'Currently Unavailable',
    view_packages: 'View Packages & Recharge',

    // Order Checkout
    checkout_title: 'Complete Your Order',
    select_package: '1. Select Package',
    enter_player_info: '2. Player & Game Details',
    player_id_label: 'Player ID',
    player_id_placeholder: 'Enter your in-game Player ID',
    player_id_helper: 'You can copy your Player ID directly from your in-game profile',
    server_zone_label: 'Server / Zone (If applicable)',
    account_credentials_label: 'Temporary Login Credentials',
    account_credentials_placeholder: 'Login method (Google / Facebook) + Email/Phone + Password',
    customer_info_title: '3. Customer Details (For Tracking & Support)',
    customer_name_label: 'Full Name',
    customer_name_placeholder: 'e.g. Mohamed Lemine',
    customer_phone_label: 'Phone Number (Required for secure tracking)',
    customer_phone_placeholder: 'e.g. 31520844 or 46123456',
    customer_email_label: 'Email (Optional for receipts)',
    select_payment_method: '4. Select Mauritanian Payment Method',
    payment_bankily: 'Bankily App',
    payment_masrivi: 'Masrivi App',
    payment_sedad: 'Sedad Wallet',
    payment_instructions_title: 'Payment Transfer Instructions:',
    payment_dest_number: 'Transfer to official Shadow Store number:',
    payment_amount_due: 'Total Amount Due:',
    transaction_ref_label: 'Transaction Reference / Notice ID',
    transaction_ref_placeholder: 'Enter bank transaction receipt number (e.g. BKL-19845)',
    payment_proof_label: 'Upload Transfer Screenshot (Optional)',
    customer_notes_label: 'Additional Order Notes (Optional)',
    confirm_order_button: 'Confirm & Place Order',
    order_creating: 'Processing Order...',
    security_guarantee: '100% encrypted & confidential transactions. We never share your data.',

    // Tracking
    track_title: 'Secure Order Tracking',
    track_subtitle: 'Enter your order reference and registered phone number to verify and view live fulfillment progress',
    order_reference_label: 'Order Reference Code',
    order_reference_placeholder: 'e.g. SHD-2026-9812',
    verification_phone_label: 'Registered Phone Number (Security Verification)',
    track_button: 'Track Order',
    order_details: 'Order Details',
    status_awaiting_payment: 'Awaiting Bank Transfer',
    status_needs_review: 'Payment Under Review',
    status_in_progress: 'Fulfillment In Progress',
    status_completed: 'Completed Successfully ✓',
    status_rejected: 'Rejected',
    status_cancelled: 'Cancelled',
    order_timeline: 'Order Updates & Timeline',
    order_created_at: 'Date Placed',
    whatsapp_assistance: 'Contact Support on WhatsApp regarding this order',
    attach_proof_prompt: 'Transferred payment after placing the order? Update your reference ID:',
    update_proof_button: 'Submit Payment Info',

    // Support
    support_title: 'Support & Assistance',
    support_subtitle: 'Shadow Store support team is available daily to answer questions and expedite your top-ups.',
    working_hours_title: 'Official Working Hours',
    whatsapp_direct: 'Chat Directly on WhatsApp',
    submit_ticket_tab: 'Open New Support Ticket',
    lookup_ticket_tab: 'Look Up Existing Ticket',
    ticket_subject_label: 'Subject',
    ticket_message_label: 'Your Message or Inquiry',
    ticket_submit_button: 'Submit Ticket',
    ticket_number_label: 'Ticket Number',
    ticket_lookup_button: 'Check Ticket',
    admin_response: 'Support Team Reply:',

    // Account & Admin
    login_tab: 'Sign In',
    register_tab: 'Create Account',
    email_label: 'Email Address',
    password_label: 'Password',
    login_button: 'Sign In',
    register_button: 'Create Account',
    my_orders_title: 'My Past Orders',
    no_orders_yet: 'No orders recorded yet.',
    admin_dashboard_title: 'Admin Management Console — SHADOW STORE',
    admin_tab_overview: 'Overview',
    admin_tab_orders: 'Orders Management',
    admin_tab_products: 'Products & Pricing',
    admin_tab_support: 'Support Tickets',
    admin_tab_settings: 'Store Settings',
    admin_tab_audit: 'Audit Logs',
    admin_revenue: 'Total Verified Revenue',
    admin_pending_orders: 'Pending Payment / Review',
    admin_orders_progress: 'In Progress Orders',
    admin_completed_orders: 'Completed Orders',
    admin_update_status: 'Update Status',
    admin_save: 'Save Changes',
    admin_notes: 'Internal Admin Note',
    customer_visible_note: 'Customer-Visible Note in Tracking',
    popular_games_chart: 'Top Games by Demand',
    search_placeholder: 'Search games and services...',
  },
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('shadow_store_lang');
    return (saved === 'en' ? 'en' : 'ar') as Language;
  });

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('shadow_store_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('shadow_store_token');
  });

  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [prefilledTrackingRef, setPrefilledTrackingRef] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    // Apply RTL/LTR and language to document root
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('shadow_store_lang', language);
  }, [language]);

  useEffect(() => {
    // Fetch initial settings & announcements
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error('Error fetching settings:', err));

    fetch('/api/announcements')
      .then(res => res.json())
      .then(data => setAnnouncements(data))
      .catch(err => console.error('Error fetching announcements:', err));
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState(prev => (prev === 'ar' ? 'en' : 'ar'));
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('shadow_store_token', newToken);
    localStorage.setItem('shadow_store_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('shadow_store_token');
    localStorage.removeItem('shadow_store_user');
    if (activeTab === 'admin' || activeTab === 'account') {
      setActiveTab('home');
    }
  };

  const startRecharge = (product: Product, variant?: ProductVariant) => {
    setSelectedProduct(product);
    setSelectedVariant(variant || null);
    setActiveTab('order');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearRecharge = () => {
    setSelectedProduct(null);
    setSelectedVariant(null);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        user,
        token,
        login,
        logout,
        activeTab,
        setActiveTab,
        selectedProduct,
        selectedVariant,
        startRecharge,
        clearRecharge,
        settings,
        announcements,
        prefilledTrackingRef,
        setPrefilledTrackingRef,
        showToast,
        toast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
