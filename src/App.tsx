import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Header } from './components/Header.tsx';
import { Hero } from './components/Hero.tsx';
import { FreeFireSpecialSection } from './components/FreeFireSpecialSection.tsx';
import { GameCatalog } from './components/GameCatalog.tsx';
import { OrderModal } from './components/OrderModal.tsx';
import { OrderTracking } from './components/OrderTracking.tsx';
import { CustomerAccount } from './components/CustomerAccount.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { SupportSection } from './components/SupportSection.tsx';
import { Footer } from './components/Footer.tsx';
import { Product } from './types/index.ts';
import { MessageCircle, CheckCircle2, AlertTriangle, Info, Bell, X } from 'lucide-react';

function MainApp() {
  const { activeTab, setActiveTab, user, toast, settings, announcements, language } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoadingProducts(false);
      })
      .catch(err => {
        console.error('Failed to load products:', err);
        setLoadingProducts(false);
      });
  }, []);

  const activeAnnouncement = announcements.find(a => a.active);
  const whatsappNumber = settings?.whatsappNumber || '22231520844';

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-zinc-950 font-sans">
      {/* Top Announcement Bar */}
      {!bannerDismissed && activeAnnouncement && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 text-zinc-950 text-xs py-2 px-4 font-bold flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-2 mx-auto truncate">
            <span className="shrink-0">📢</span>
            <span className="truncate">
              {language === 'ar' ? activeAnnouncement.contentAr : activeAnnouncement.contentEn}
            </span>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="p-1 hover:bg-black/10 rounded shrink-0 cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Header */}
      <Header />

      {/* View routing */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <>
            <Hero />
            <FreeFireSpecialSection products={products} />
            <GameCatalog products={products} />
          </>
        )}

        {activeTab === 'catalog' && (
          <GameCatalog products={products} />
        )}

        {activeTab === 'order' && (
          <OrderModal products={products} />
        )}

        {activeTab === 'track' && (
          <OrderTracking />
        )}

        {activeTab === 'support' && (
          <SupportSection />
        )}

        {activeTab === 'account' && (
          <CustomerAccount />
        )}

        {activeTab === 'admin' && (
          user?.role === 'admin' ? (
            <AdminDashboard />
          ) : (
            <div className="py-20 text-center px-4 max-w-md mx-auto">
              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
                <p className="text-zinc-300 text-sm mb-4">
                  يتطلب دخول لوحة التحكم تسجيل الدخول بحساب المدير.
                </p>
                <button
                  onClick={() => setActiveTab('account')}
                  className="px-6 py-2.5 rounded-xl font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors text-xs"
                >
                  تسجيل الدخول كمدير
                </button>
              </div>
            </div>
          )
        )}
      </main>

      {/* Floating WhatsApp Quick Action Button */}
      <a
        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('السلام عليكم، أود الاستفسار عن الشحن في شادو ستور')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 rtl:right-auto rtl:left-6 z-40 p-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-2xl shadow-emerald-500/30 hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer group"
        title="WhatsApp Support"
      >
        <MessageCircle className="w-6 h-6 fill-current" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 text-xs font-bold whitespace-nowrap ml-2 rtl:ml-0 rtl:mr-2">
          واتساب شادو ستور
        </span>
      </a>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-zinc-900/95 border border-zinc-700 text-white text-xs font-medium shadow-2xl backdrop-blur-md animate-fade-in">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-amber-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
