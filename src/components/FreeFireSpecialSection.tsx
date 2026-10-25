import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Zap, ShieldCheck, Sparkles, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { Product, ProductVariant } from '../types/index.ts';
import { GameImage } from './GameImage.tsx';

interface FreeFireSectionProps {
  products: Product[];
}

export function FreeFireSpecialSection({ products }: FreeFireSectionProps) {
  const { t, language, startRecharge } = useApp();
  const [activeTab, setActiveTab] = useState<'diamonds' | 'memberships_id' | 'memberships_acc' | 'booyah'>('diamonds');

  // Find relevant Free Fire products
  const ffDiamondsProd = products.find(p => p.id === 'prod-ff-diamonds');
  const ffMemIdProd = products.find(p => p.id === 'prod-ff-memberships-id');
  const ffMemAccProd = products.find(p => p.id === 'prod-ff-memberships-account');
  const ffBooyahProd = products.find(p => p.id === 'prod-ff-booyah');

  return (
    <section className="py-12 bg-zinc-950 border-t border-b border-zinc-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Garena Free Fire Official Top-Up</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {t('ff_spotlight_title')}
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              {t('ff_spotlight_subtitle')}
            </p>
          </div>

          {/* Service Selector Tabs */}
          <div className="flex flex-wrap gap-1 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('diamonds')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'diamonds'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t('ff_diamonds_id')}
            </button>
            <button
              onClick={() => setActiveTab('memberships_id')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'memberships_id'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t('ff_memberships_id')}
            </button>
            <button
              onClick={() => setActiveTab('memberships_acc')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'memberships_acc'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t('ff_memberships_account')}
            </button>
            <button
              onClick={() => setActiveTab('booyah')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'booyah'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t('ff_booyah_pass')}
            </button>
          </div>
        </div>

        {/* Content Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Visual Showcase Card with Dynamic Artwork */}
          <div className="lg:col-span-4 relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-xl group">
            <GameImage
              src={
                activeTab === 'diamonds' ? (ffDiamondsProd?.image || '/public/assets/aistudio/33ab4129a3cc0ba004d7034d34df75d1_e18e035c.jpg') :
                activeTab === 'memberships_id' ? (ffMemIdProd?.image || '/src/assets/images/game_freefire_showcase_1792771592743.jpg') :
                activeTab === 'memberships_acc' ? (ffMemAccProd?.image || '/public/assets/aistudio/33ab4129a3cc0ba004d7034d34df75d1_e18e035c.jpg') :
                (ffBooyahProd?.image || '/src/assets/images/game_freefire_showcase_1792771592743.jpg')
              }
              alt="Free Fire Official Artwork"
              gameName="Free Fire"
              genre="Battle Royale"
              aspectRatio="portrait"
              className="w-full h-72 sm:h-84 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 inset-x-4">
              <span className="text-amber-400 font-bold text-sm block">
                {activeTab === 'diamonds' && 'جواهر فري فاير الرسمية بالـ ID'}
                {activeTab === 'memberships_id' && 'عضويات فري فاير الرسمية بالـ ID'}
                {activeTab === 'memberships_acc' && 'عضويات فري فاير شحن داخلي مخفض'}
                {activeTab === 'booyah' && 'تفعيل بوياه باس السيزون الحالي'}
              </span>
              <p className="text-xs text-zinc-300 mt-1">
                {activeTab === 'memberships_acc'
                  ? 'تنبيه: يتطلب بيانات الدخول ويتم الشحن بأمان تام وبإشراف مباشر.'
                  : 'فقط أرسل الـ ID ورقم هاتفك وسنقوم بالشحن الفوري.'}
              </p>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="lg:col-span-8">
            {activeTab === 'diamonds' && ffDiamondsProd && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {ffDiamondsProd.variants?.map((v: ProductVariant) => (
                  <div
                    key={v.id}
                    onClick={() => startRecharge(ffDiamondsProd, v)}
                    className="p-4 rounded-xl bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-amber-500/60 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                        <span className="text-amber-400 font-medium">Player ID</span>
                        <span>💎</span>
                      </div>
                      <div className="text-base sm:text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                        {language === 'ar' ? v.nameAr : v.nameEn}
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-baseline justify-between">
                      <span className="text-lg sm:text-xl font-bold font-mono text-amber-400">
                        {v.priceMRU}
                      </span>
                      <span className="text-xs text-zinc-400 font-semibold">
                        {t('mru_currency')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'memberships_id' && ffMemIdProd && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ffMemIdProd.variants?.map((v: ProductVariant) => (
                  <div
                    key={v.id}
                    onClick={() => startRecharge(ffMemIdProd, v)}
                    className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/60 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        {t('delivery_player_id')}
                      </span>
                      <span>👑</span>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                      {language === 'ar' ? v.nameAr : v.nameEn}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      {v.id.includes('wk')
                        ? 'تفعيل فوري للعضوية الأسبوعية وجواهر يومية بالـ ID فقط'
                        : 'تفعيل فوري للعضوية الشهرية وبطاقة تخفيض وجواهر يومية بالـ ID'}
                    </p>
                    <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold font-mono text-amber-400">{v.priceMRU}</span>
                        <span className="text-xs text-zinc-400 font-semibold">{t('mru_currency')}</span>
                      </div>
                      <span className="text-xs font-bold text-zinc-950 bg-amber-400 px-3 py-1.5 rounded-lg group-hover:bg-amber-300">
                        {t('ff_recharge_now')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'memberships_acc' && ffMemAccProd && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ffMemAccProd.variants?.map((v: ProductVariant) => (
                  <div
                    key={v.id}
                    onClick={() => startRecharge(ffMemAccProd, v)}
                    className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-orange-500/60 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs text-orange-400 font-semibold mb-2">
                      <span className="px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
                        {t('delivery_account_login')}
                      </span>
                      <span className="text-xs text-zinc-400">سعر مخفض</span>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">
                      {language === 'ar' ? v.nameAr : v.nameEn}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      شحن داخلي عبر الحساب مباشرة بإشراف تقني من فريق شادو ستور.
                    </p>
                    <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold font-mono text-orange-400">{v.priceMRU}</span>
                        <span className="text-xs text-zinc-400 font-semibold">{t('mru_currency')}</span>
                      </div>
                      <span className="text-xs font-bold text-white bg-orange-500 px-3 py-1.5 rounded-lg group-hover:bg-orange-400">
                        {t('ff_recharge_now')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'booyah' && ffBooyahProd && (
              <div className="max-w-md">
                {ffBooyahProd.variants?.map((v: ProductVariant) => (
                  <div
                    key={v.id}
                    onClick={() => startRecharge(ffBooyahProd, v)}
                    className="p-6 rounded-xl bg-zinc-900 border border-amber-500/40 hover:border-amber-400 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs text-amber-400 font-semibold mb-2">
                      <span className="px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        تصريح السيزون الرسمي
                      </span>
                      <span>🔥</span>
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                      {language === 'ar' ? v.nameAr : v.nameEn}
                    </h3>
                    <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                      فتح مسار الجوائز الكامل وتفعيل السكنات والأسلحة الحصرية بالـ ID فقط دون الحاجة لكلمة المرور.
                    </p>
                    <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black font-mono text-amber-400">{v.priceMRU}</span>
                        <span className="text-sm text-zinc-400 font-semibold">{t('mru_currency')}</span>
                      </div>
                      <span className="text-xs font-bold text-zinc-950 bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2 rounded-lg hover:brightness-110 shadow">
                        {t('ff_recharge_now')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
