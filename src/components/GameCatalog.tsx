import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Product, ProductVariant } from '../types/index.ts';
import { Search, Zap, CheckCircle2, ShieldAlert, Gift, Trophy, Crosshair, Sparkles } from 'lucide-react';
import { GameImage } from './GameImage.tsx';

interface GameCatalogProps {
  products: Product[];
}

export function GameCatalog({ products }: GameCatalogProps) {
  const { t, language, startRecharge } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'all', label: t('cat_all'), icon: Sparkles },
    { id: 'cat-battle-royale', label: t('cat_battle_royale'), icon: Crosshair },
    { id: 'cat-sports', label: t('cat_sports'), icon: Trophy },
    { id: 'cat-cards', label: t('cat_gift_cards'), icon: Gift },
  ];

  const filteredProducts = products.filter(p => {
    if (!p.active) return false;
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.nameAr.toLowerCase().includes(q) ||
      p.nameEn.toLowerCase().includes(q) ||
      p.game.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="py-12 bg-[#09090c]" id="catalog">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {t('nav_catalog')}
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              اختر لعبتك أو بطاقتك المفضلة لبدء عملية الشحن الفوري بأمان
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('search_placeholder')}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 px-4 pr-10 rtl:pr-10 ltr:pl-10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {categories.map(c => {
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : 'bg-zinc-900/90 text-zinc-300 border border-zinc-800 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/40 rounded-2xl border border-zinc-800">
            <p className="text-zinc-400 text-base">لا توجد منتجات تطابق بحثك حالياً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => {
              const lowestPrice = product.variants && product.variants.length > 0
                ? Math.min(...product.variants.map(v => v.priceMRU))
                : 0;

              return (
                <div
                  key={product.id}
                  className="rounded-2xl bg-zinc-900/70 border border-zinc-800/80 overflow-hidden hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 flex flex-col justify-between group"
                >
                  {/* Image container with Dynamic Game Artwork */}
                  <div className="relative overflow-hidden bg-zinc-950">
                    <GameImage
                      src={product.image}
                      alt={language === 'ar' ? product.nameAr : product.nameEn}
                      gameName={product.game}
                      genre={product.genre}
                      aspectRatio="card"
                      className="group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent pointer-events-none" />

                    {/* Delivery Method Label */}
                    <div className="absolute top-3 right-3 rtl:right-3 ltr:left-3 z-20">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold backdrop-blur-md border ${
                        product.deliveryMethod === 'player_id'
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                          : product.deliveryMethod === 'account_login'
                          ? 'bg-orange-950/80 text-orange-400 border-orange-500/30'
                          : 'bg-blue-950/80 text-blue-400 border-blue-500/30'
                      }`}>
                        {product.deliveryMethod === 'player_id' && t('delivery_player_id')}
                        {product.deliveryMethod === 'account_login' && t('delivery_account_login')}
                        {product.deliveryMethod === 'digital_code' && t('delivery_digital_code')}
                      </span>
                    </div>

                    {/* Genre and Game Badge */}
                    <div className="absolute bottom-3 right-3 rtl:right-3 ltr:left-3 z-20 flex items-center gap-2">
                      <span className="text-xs text-amber-400 font-bold uppercase tracking-wider bg-zinc-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                        {product.game}
                      </span>
                      {product.genre && (
                        <span className="text-[10px] text-zinc-300 font-medium bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-700">
                          {product.genre}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                        {language === 'ar' ? product.nameAr : product.nameEn}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                        {language === 'ar' ? product.descriptionAr : product.descriptionEn}
                      </p>
                    </div>

                    {/* Price and CTA */}
                    <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-zinc-400 block font-medium">
                          {t('starting_from')}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold font-mono text-amber-400">
                            {lowestPrice}
                          </span>
                          <span className="text-xs text-zinc-400 font-semibold">
                            {t('mru_currency')}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => startRecharge(product)}
                        className="px-4 py-2 text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow hover:shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>{t('view_packages')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
