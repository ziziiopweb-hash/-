import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { ShieldCheck, Phone, Mail, Clock, ExternalLink } from 'lucide-react';

export function Footer() {
  const { t, setActiveTab, settings } = useApp();
  const paymentPhone = settings?.paymentNumber || '31520844';
  const whatsapp = settings?.whatsappNumber || '22231520844';

  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 pt-12 pb-8 text-xs text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-zinc-900">
          {/* Col 1: Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-black text-zinc-950 text-base">
                S
              </div>
              <span className="text-base font-black tracking-wider text-white">
                SHADOW STORE
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {t('slogan_primary')}
            </p>
            <p className="text-xs text-amber-500 font-semibold">
              {t('slogan_secondary')}
            </p>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase text-white tracking-wider">
              روابط سريعة
            </h4>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => setActiveTab('home')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  {t('nav_home')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  {t('nav_catalog')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('track')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  {t('nav_track')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('support')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  {t('nav_support')}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Mauritanian Payment Methods */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase text-white tracking-wider">
              طرق الدفع في موريتانيا
            </h4>
            <p className="text-xs text-zinc-400">
              رقم حساب شادو ستور المعتمد لكافة التحويلات:
            </p>
            <div className="font-mono text-base font-bold text-amber-400 tracking-wider">
              {paymentPhone}
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
                بنكيلي Bankily
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
                مصرفي Masrivi
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
                سداد Sedad
              </span>
            </div>
          </div>

          {/* Col 4: Customer Support & Contact */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase text-white tracking-wider">
              خدمة العملاء
            </h4>
            <p className="text-xs text-zinc-400">
              دعم مباشر طيلة أيام الأسبوع
            </p>
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              <span>واتساب: +{whatsapp}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-400">
          <div>
            © {new Date().getFullYear()} SHADOW STORE. جميع الحقوق محفوظة لمتجر شادو ستور.
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>شحن فوري بالـ ID</span>
            <span>·</span>
            <span>أسعار رسمية معتمدة</span>
            <span>·</span>
            <span>معاملات مشفرة</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
