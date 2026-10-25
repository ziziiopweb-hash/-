import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Zap, Search, ShieldCheck, Copy, Check, Sparkles, CreditCard } from 'lucide-react';

export function Hero() {
  const { t, setActiveTab, showToast, settings } = useApp();
  const [copied, setCopied] = useState(false);

  const paymentPhone = settings?.paymentNumber || '31520844';

  const copyPaymentNumber = () => {
    navigator.clipboard.writeText(paymentPhone);
    setCopied(true);
    showToast(`${paymentPhone} - تم نسخ الرقم بنجاح`, 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-14 lg:py-16 bg-[#08080a]">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Brand Statement & Primary Action */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-900/90 border border-amber-500/30 text-amber-400 text-xs font-semibold w-fit">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t('slogan_secondary')}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight [text-wrap:balance]">
              <span className="block text-zinc-100">{t('slogan_primary')}</span>
              <span className="block mt-2 bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400 bg-clip-text text-transparent">
                متجر الشحن الموريتاني الأول للألعاب
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl">
              {t('hero_subtitle')}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => setActiveTab('catalog')}
                className="px-6 py-3.5 text-sm sm:text-base font-bold text-zinc-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2.5 cursor-pointer"
              >
                <Zap className="w-5 h-5 fill-current" />
                <span>{t('hero_cta_recharge')}</span>
              </button>

              <button
                onClick={() => setActiveTab('track')}
                className="px-6 py-3.5 text-sm sm:text-base font-semibold text-zinc-200 bg-zinc-900/90 border border-zinc-700/80 rounded-xl hover:border-amber-500/60 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2.5 cursor-pointer"
              >
                <Search className="w-4 h-4 text-amber-400" />
                <span>{t('hero_cta_track')}</span>
              </button>
            </div>

            {/* Official Mauritanian Payment Account Strip */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-zinc-950 border border-zinc-800 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block font-medium">
                      {t('official_payment_number')}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xl font-bold font-mono text-amber-400 tracking-wider">
                        {paymentPhone}
                      </span>
                      <button
                        onClick={copyPaymentNumber}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 transition-colors cursor-pointer"
                        title="Copy payment phone number"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-zinc-400" />
                            <span>نسخ</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Local Mauritanian payment badges */}
                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800 text-xs">
                  <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                    بنكيلي Bankily
                  </span>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    مصرفي Masrivi
                  </span>
                  <span className="px-2.5 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold">
                    سداد Sedad
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Artwork */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950 group">
              <img
                src="/src/assets/images/hero_gaming_shadow_store_1792771592028.jpg"
                alt="Shadow Store Gaming Atmosphere"
                className="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />

              {/* Floating feature card inside visual */}
              <div className="absolute bottom-4 inset-x-4 p-3.5 rounded-xl bg-zinc-900/90 backdrop-blur-md border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-amber-400 font-bold block">
                    ⚡ شحن بالـ ID فقط
                  </span>
                  <span className="text-xs text-zinc-300">
                    لا نطلب كلمة مرور الحساب أبداً في شحن الآيدي
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="px-3 py-1.5 text-xs font-bold text-zinc-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors whitespace-nowrap cursor-pointer"
                >
                  تصفح الآن
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
