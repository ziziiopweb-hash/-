import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Product, ProductVariant } from '../types/index.ts';
import {
  X, Check, Copy, Shield, ShieldCheck, Zap, AlertCircle, Upload, CheckCircle2,
  ExternalLink, ArrowRight, ArrowLeft
} from 'lucide-react';
import { GameImage } from './GameImage.tsx';

interface OrderModalProps {
  products: Product[];
}

export function OrderModal({ products }: OrderModalProps) {
  const {
    t,
    language,
    selectedProduct,
    selectedVariant,
    clearRecharge,
    setActiveTab,
    setPrefilledTrackingRef,
    showToast,
    settings,
    user,
  } = useApp();

  const [currentProduct, setCurrentProduct] = useState<Product | null>(selectedProduct || products[0] || null);
  const [currentVariant, setCurrentVariant] = useState<ProductVariant | null>(
    selectedVariant || (selectedProduct?.variants?.[0] || products[0]?.variants?.[0] || null)
  );

  const [playerId, setPlayerId] = useState('');
  const [playerZoneId, setPlayerZoneId] = useState('');
  const [serverName, setServerName] = useState('');
  const [accountCredentials, setAccountCredentials] = useState('');
  const [consentAccountLogin, setConsentAccountLogin] = useState(false);

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [paymentMethod, setPaymentMethod] = useState<'bankily' | 'masrivi' | 'sedad'>('bankily');
  const [transactionReference, setTransactionReference] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const paymentPhone = settings?.paymentNumber || '31520844';

  useEffect(() => {
    if (selectedProduct) {
      setCurrentProduct(selectedProduct);
      if (selectedVariant) {
        setCurrentVariant(selectedVariant);
      } else if (selectedProduct.variants && selectedProduct.variants.length > 0) {
        setCurrentVariant(selectedProduct.variants[0]);
      }
    }
  }, [selectedProduct, selectedVariant]);

  const handleProductChange = (prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setCurrentProduct(prod);
      if (prod.variants && prod.variants.length > 0) {
        setCurrentVariant(prod.variants[0]);
      } else {
        setCurrentVariant(null);
      }
    }
  };

  const copyPaymentNumber = () => {
    navigator.clipboard.writeText(paymentPhone);
    setCopiedNumber(true);
    showToast(`${paymentPhone} - تم نسخ الرقم`, 'success');
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const copyOrderRef = () => {
    if (createdOrder?.reference) {
      navigator.clipboard.writeText(createdOrder.reference);
      setCopiedRef(true);
      showToast(`${createdOrder.reference} - تم نسخ رمز المرجع`, 'success');
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميغابايت', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofUrl(reader.result as string);
        showToast('تم إرفاق صورة إشعار التحويل', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentProduct || !currentVariant) {
      showToast('يرجى تحديد الباقة المطلوبة', 'error');
      return;
    }

    if (currentProduct.requiresPlayerId && !playerId.trim()) {
      showToast('يرجى إدخال معرف اللاعب (Player ID)', 'error');
      return;
    }

    if (currentProduct.requiresAccountCredentials && (!accountCredentials.trim() || !consentAccountLogin)) {
      showToast('يرجى إدخال بيانات تسجيل الدخول وتأكيد الموافقة الأمنية', 'error');
      return;
    }

    if (!customerName.trim()) {
      showToast('يرجى إدخال اسم المشتري', 'error');
      return;
    }

    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 8) {
      showToast('يرجى إدخال رقم هاتف موريتاني صحيح (8 أرقام على الأقل للتحقق)', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user ? { Authorization: `Bearer ${localStorage.getItem('shadow_store_token')}` } : {}),
        },
        body: JSON.stringify({
          productId: currentProduct.id,
          variantId: currentVariant.id,
          customerName,
          customerPhone,
          customerEmail,
          deliveryMethod: currentProduct.deliveryMethod,
          playerId,
          playerZoneId,
          serverName,
          accountCredentials: currentProduct.requiresAccountCredentials ? accountCredentials : undefined,
          paymentMethod,
          transactionReference,
          paymentProofUrl,
          customerNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل تسجيل الطلب');
      }

      setCreatedOrder(data.order);
      setPrefilledTrackingRef(data.order.reference);
      showToast('تم تسجيل طلبك بنجاح!', 'success');
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء معالجة الطلب', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (createdOrder) {
    return (
      <div className="py-12 px-4 max-w-3xl mx-auto">
        <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-center text-white">
            تم استلام طلبك بنجاح!
          </h2>
          <p className="text-zinc-400 text-center text-sm mt-1">
            طلبك الآن مسجل في شادو ستور برقم مرجع فريد
          </p>

          {/* Reference Box */}
          <div className="mt-6 p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-zinc-500 block">رقم مرجع الطلب (احتفظ به للتتبع):</span>
              <span className="text-2xl font-black font-mono text-amber-400 tracking-wider">
                {createdOrder.reference}
              </span>
            </div>
            <button
              onClick={copyOrderRef}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
            >
              {copiedRef ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedRef ? 'تم النسخ' : 'نسخ المرجع'}</span>
            </button>
          </div>

          {/* Order Summary */}
          <div className="mt-6 space-y-3 p-4 rounded-xl bg-zinc-950/50 border border-zinc-850 text-sm">
            <div className="flex justify-between py-1 border-b border-zinc-800">
              <span className="text-zinc-400">المنتج:</span>
              <span className="font-semibold text-white">{createdOrder.productName} — {createdOrder.variantName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800">
              <span className="text-zinc-400">المبلغ المستحق:</span>
              <span className="font-bold text-amber-400 text-base font-mono">{createdOrder.amountMRU} {t('mru_currency')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800">
              <span className="text-zinc-400">طريقة التحويل:</span>
              <span className="font-semibold text-zinc-200 uppercase">{createdOrder.paymentMethod}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800">
              <span className="text-zinc-400">رقم شادو ستور للتحويل:</span>
              <span className="font-mono font-bold text-amber-400 text-base">{createdOrder.paymentPhone}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-zinc-400">الحالة الأولية:</span>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                {t('status_awaiting_payment')}
              </span>
            </div>
          </div>

          {/* Next steps guide */}
          <div className="mt-6 p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-300 leading-relaxed">
            <p className="font-bold mb-1">الخطوة القادمة لإتمام الشحن:</p>
            <p>
              قم بالتحويل عبر تطبيق {createdOrder.paymentMethod} إلى الرقم{' '}
              <span className="font-bold font-mono text-white">31520844</span>. بمجرد تأكيد استلام الحوالة من طرف الإدارة، سيتم شحن حسابك فورياً بالـ ID.
            </p>
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setActiveTab('track');
              }}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow text-center cursor-pointer"
            >
              متابعة حالة الطلب مباشرة
            </button>
            <a
              href={`https://wa.me/22231520844?text=${encodeURIComponent(
                `السلام عليكم، قمت بطلب شحن في شادو ستور برقم المرجع: ${createdOrder.reference} بمبلغ ${createdOrder.amountMRU} MRU`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors text-center flex items-center justify-center gap-2"
            >
              <span>إرسال إشعار الدفع عبر واتساب</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 max-w-4xl mx-auto">
      {/* Page Title */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t('checkout_title')}
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            شحن مباشر وسريع بالأسعار الرسمية المعتمدة
          </p>
        </div>
        <button
          onClick={() => setActiveTab('catalog')}
          className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
        >
          العودة للقائمة
        </button>
      </div>

      <form onSubmit={handleSubmitOrder} className="space-y-8">
        {/* Dynamic Game Artwork Spotlight */}
        {currentProduct && (
          <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-xl flex flex-col md:flex-row items-center">
            <div className="w-full md:w-56 h-40 md:h-36 shrink-0 relative">
              <GameImage
                src={currentProduct.image}
                alt={language === 'ar' ? currentProduct.nameAr : currentProduct.nameEn}
                gameName={currentProduct.game}
                genre={currentProduct.genre}
                aspectRatio="auto"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-zinc-900 via-transparent to-transparent pointer-events-none" />
            </div>
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider bg-zinc-950 px-2 py-0.5 rounded border border-amber-500/30">
                    {currentProduct.game}
                  </span>
                  {currentProduct.genre && (
                    <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                      {currentProduct.genre}
                    </span>
                  )}
                  {currentProduct.badgeTagAr && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                      {language === 'ar' ? currentProduct.badgeTagAr : currentProduct.badgeTagEn}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {language === 'ar' ? currentProduct.nameAr : currentProduct.nameEn}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                  {language === 'ar' ? currentProduct.descriptionAr : currentProduct.descriptionEn}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Product & Package Selection */}
        <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-zinc-950 text-xs font-black flex items-center justify-center">1</span>
            <span>{t('select_package')}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5 font-medium">اختر اللعبة أو الخدمة:</label>
              <select
                value={currentProduct?.id || ''}
                onChange={e => handleProductChange(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                {products.filter(p => p.active).map(p => (
                  <option key={p.id} value={p.id}>
                    {language === 'ar' ? p.nameAr : p.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {currentProduct && (
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5 font-medium">نوع التسليم:</label>
                <div className="py-2.5 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-amber-400 font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>
                    {currentProduct.deliveryMethod === 'player_id' && t('delivery_player_id')}
                    {currentProduct.deliveryMethod === 'account_login' && t('delivery_account_login')}
                    {currentProduct.deliveryMethod === 'digital_code' && t('delivery_digital_code')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Variants Grid */}
          {currentProduct?.variants && currentProduct.variants.length > 0 && (
            <div className="mt-4">
              <label className="text-xs text-zinc-400 block mb-2 font-medium">اختر كمية أو باقة الشحن:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {currentProduct.variants.filter(v => v.active).map(v => (
                  <button
                    type="button"
                    key={v.id}
                    onClick={() => setCurrentVariant(v)}
                    className={`p-3 rounded-xl border text-right rtl:text-right ltr:text-left transition-all cursor-pointer ${
                      currentVariant?.id === v.id
                        ? 'border-amber-500 bg-amber-500/10 text-white shadow-sm'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-bold truncate">
                      {language === 'ar' ? v.nameAr : v.nameEn}
                    </div>
                    <div className="text-base font-bold font-mono text-amber-400 mt-1">
                      {v.priceMRU} <span className="text-[10px] text-zinc-400 font-sans">{t('mru_currency')}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Game/Player Credentials */}
        <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-zinc-950 text-xs font-black flex items-center justify-center">2</span>
            <span>{t('enter_player_info')}</span>
          </h3>

          {currentProduct?.requiresPlayerId && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-300 block mb-1.5 font-bold">
                  {t('player_id_label')} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={playerId}
                  onChange={e => setPlayerId(e.target.value)}
                  placeholder={t('player_id_placeholder')}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono tracking-wider"
                />
                <p className="text-[11px] text-zinc-500 mt-1">{t('player_id_helper')}</p>
              </div>

              {currentProduct.requiresServer && (
                <div>
                  <label className="text-xs text-zinc-300 block mb-1.5 font-medium">
                    {t('server_zone_label')}
                  </label>
                  <input
                    type="text"
                    value={serverName}
                    onChange={e => setServerName(e.target.value)}
                    placeholder="مثال: Europe / Global / Middle East"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>
          )}

          {currentProduct?.requiresAccountCredentials && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-orange-950/20 border border-orange-500/30 text-xs text-orange-300 leading-relaxed">
                <AlertCircle className="w-4 h-4 inline-block ml-1 rtl:ml-1 ltr:mr-1 text-orange-400" />
                <span>
                  {currentProduct.warningNoticeAr || 'تنبيه أمني: يتم شحن هذا العرض داخلياً في الحساب، تُستخدم البيانات لمرة واحدة لإتمام الشحن وتُحذف فوراً.'}
                </span>
              </div>

              <div>
                <label className="text-xs text-zinc-300 block mb-1.5 font-bold">
                  {t('account_credentials_label')} <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={2}
                  value={accountCredentials}
                  onChange={e => setAccountCredentials(e.target.value)}
                  placeholder={t('account_credentials_placeholder')}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentAccountLogin}
                  onChange={e => setConsentAccountLogin(e.target.checked)}
                  className="mt-1 accent-amber-500 rounded"
                />
                <span className="text-xs text-zinc-300">
                  أؤكد موافقتي على تقديم بيانات الحساب مؤقتاً لفريق شادو ستور لتنفيذ الشحن.
                </span>
              </label>
            </div>
          )}

          {currentProduct?.deliveryMethod === 'digital_code' && (
            <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 text-xs text-blue-300">
              ⚡ سيتم إرسال كود التفعيل الرقمي فور تأكيد الحوالة الموريتانية إلى رقم هاتفك المسجل وعبر صفحة التتبع.
            </div>
          )}
        </div>

        {/* Step 3: Customer Information */}
        <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-zinc-950 text-xs font-black flex items-center justify-center">3</span>
            <span>{t('customer_info_title')}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-300 block mb-1.5 font-bold">
                {t('customer_name_label')} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder={t('customer_name_placeholder')}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-300 block mb-1.5 font-bold">
                {t('customer_phone_label')} <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder={t('customer_phone_placeholder')}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
              />
              <p className="text-[11px] text-amber-500/80 mt-1">مهم: يُستخدم رقم هاتفك كعامل حماية لتتبع طلبك وحفظ خصوصيتك.</p>
            </div>
          </div>
        </div>

        {/* Step 4: Mauritanian Payment Methods */}
        <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-zinc-950 text-xs font-black flex items-center justify-center">4</span>
            <span>{t('select_payment_method')}</span>
          </h3>

          {/* Payment Method Badges */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setPaymentMethod('bankily')}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                paymentMethod === 'bankily'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white'
              }`}
            >
              <div className="font-bold text-xs sm:text-sm">بنكيلي</div>
              <div className="text-[10px] text-zinc-500">Bankily</div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('masrivi')}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                paymentMethod === 'masrivi'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white'
              }`}
            >
              <div className="font-bold text-xs sm:text-sm">مصرفي</div>
              <div className="text-[10px] text-zinc-500">Masrivi</div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('sedad')}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                paymentMethod === 'sedad'
                  ? 'border-orange-500 bg-orange-500/10 text-orange-400 shadow'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white'
              }`}
            >
              <div className="font-bold text-xs sm:text-sm">سداد</div>
              <div className="text-[10px] text-zinc-500">Sedad</div>
            </button>
          </div>

          {/* Payment Details Container */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div>
                <span className="text-xs text-zinc-400 block">{t('payment_dest_number')}</span>
                <span className="text-2xl font-black font-mono text-amber-400 tracking-wider">
                  {paymentPhone}
                </span>
              </div>
              <button
                type="button"
                onClick={copyPaymentNumber}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 hover:bg-zinc-800 flex items-center gap-1.5 w-fit cursor-pointer"
              >
                {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNumber ? 'تم النسخ' : 'نسخ رقم التحويل'}</span>
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {paymentMethod === 'bankily' && (settings?.bankilyInstructionsAr || 'قم بفتح تطبيق بنكيلي والتحويل للرقم 31520844 وإدخال رقم الإشعار.')}
              {paymentMethod === 'masrivi' && (settings?.masriviInstructionsAr || 'قم بالتحويل عبر تطبيق مصرفي للرقم 31520844 وإرفاق رقم العملية.')}
              {paymentMethod === 'sedad' && (settings?.sedadInstructionsAr || 'قم بالدفع عبر محفظة سداد للرقم 31520844.')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs text-zinc-300 block mb-1 font-medium">
                  {t('transaction_ref_label')}
                </label>
                <input
                  type="text"
                  value={transactionReference}
                  onChange={e => setTransactionReference(e.target.value)}
                  placeholder={t('transaction_ref_placeholder')}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 block mb-1 font-medium">
                  {t('payment_proof_label')}
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full text-xs text-zinc-400 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                  />
                  {paymentProofUrl && (
                    <span className="text-[10px] text-emerald-400 block mt-1">✓ تم إرفاق صورة الإشعار بنجاح</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Server Recalculated Order Total Bar */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-zinc-400 block">{t('payment_amount_due')}</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-black font-mono text-amber-400">
                {currentVariant?.priceMRU || 0}
              </span>
              <span className="text-sm font-bold text-zinc-400">{t('mru_currency')}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-zinc-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span>{t('order_creating')}</span>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-current" />
                <span>{t('confirm_order_button')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
