import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Shield, Zap, Search, Globe, User as UserIcon, Menu, X, Lock } from 'lucide-react';

export function Header() {
  const { language, toggleLanguage, t, activeTab, setActiveTab, user, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: t('nav_home') },
    { id: 'catalog', label: t('nav_catalog') },
    { id: 'track', label: t('nav_track') },
    { id: 'support', label: t('nav_support') },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#09090c]/90 backdrop-blur-md border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar Contract: 3 zones separated by gap-8 */}
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark with metallic gold brand crest */}
          <button
            onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
            className="flex items-center gap-2.5 text-left focus:outline-none shrink-0 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <span className="text-zinc-950 font-black text-lg tracking-tighter">S</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-wider text-white group-hover:text-amber-400 transition-colors whitespace-nowrap">
                SHADOW STORE
              </span>
              <span className="text-[10px] tracking-widest text-amber-500/90 font-medium uppercase -mt-1">
                Mauritania Gaming
              </span>
            </div>
          </button>

          {/* Zone 2: Concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-300">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
                  activeTab === item.id
                    ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                    : 'hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'text-amber-400 font-bold border-b-2 border-amber-400'
                    : 'text-amber-500 hover:text-amber-300'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{t('nav_admin')}</span>
              </button>
            )}
          </nav>

          {/* Zone 3: 1 primary action + Language switch + Account */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Language Switch */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-amber-500/50 hover:text-white transition-colors cursor-pointer"
              title="Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-semibold">{language === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            {/* Account / Login */}
            <button
              onClick={() => setActiveTab('account')}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                activeTab === 'account'
                  ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                  : 'border-zinc-800 text-zinc-300 hover:text-white bg-zinc-900 hover:border-zinc-700'
              }`}
              title={user ? user.name : t('nav_login')}
            >
              <UserIcon className="w-4 h-4" />
            </button>

            {/* 1 Primary Action CTA Button */}
            <button
              onClick={() => setActiveTab('catalog')}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-zinc-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-lg shadow-md hover:shadow-amber-500/25 hover:brightness-110 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{t('hero_cta_recharge')}</span>
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-zinc-800 text-zinc-300 hover:text-white bg-zinc-900"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-zinc-800 flex flex-col gap-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-right rtl:text-right ltr:text-left px-3 py-2 rounded-lg text-sm font-medium ${
                  activeTab === item.id
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'text-zinc-300 hover:bg-zinc-800/60'
                }`}
              >
                {item.label}
              </button>
            ))}
            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  setActiveTab('admin');
                  setMobileMenuOpen(false);
                }}
                className="text-right rtl:text-right ltr:text-left px-3 py-2 rounded-lg text-sm font-bold text-amber-400 bg-amber-500/10 flex items-center justify-between"
              >
                <span>{t('nav_admin')}</span>
                <Lock className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => {
                setActiveTab('catalog');
                setMobileMenuOpen(false);
              }}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-zinc-950 bg-gradient-to-r from-amber-400 to-amber-500 rounded-lg shadow"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{t('hero_cta_recharge')}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
