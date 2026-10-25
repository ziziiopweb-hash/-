import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { User, LogIn, UserPlus, Package, Settings, LogOut, CheckCircle2, Clock } from 'lucide-react';

export function CustomerAccount() {
  const { t, user, token, login, logout, language, setLanguage, showToast, setActiveTab, setPrefilledTrackingRef } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // Orders history
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (token) {
      loadMyOrders();
    }
  }, [token]);

  const loadMyOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyOrders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login'
      ? { email, password }
      : { email, password, name, phone, language };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشلت العملية');
      }

      login(data.token, data.user);
      showToast(mode === 'login' ? 'تم تسجيل الدخول بنجاح' : 'تم إنشاء الحساب بنجاح', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <section className="py-12 px-4 max-w-4xl mx-auto min-h-[70vh]">
        {/* User Card */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xl">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                <span>{user.email}</span>
                <span>·</span>
                <span className="font-mono">{user.phone}</span>
                {user.role === 'admin' && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30 text-[10px]">
                    مدير النظام
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors cursor-pointer"
              >
                {t('nav_admin')}
              </button>
            )}
            <button
              onClick={logout}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-red-400 bg-zinc-950 border border-zinc-800 hover:border-red-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('nav_logout')}</span>
            </button>
          </div>
        </div>

        {/* My Orders Section */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <span>{t('my_orders_title')}</span>
          </h3>

          {loadingOrders ? (
            <div className="py-8 text-center text-zinc-500 text-sm">جاري تحميل طلباتك...</div>
          ) : myOrders.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-sm">
              {t('no_orders_yet')}
            </div>
          ) : (
            <div className="space-y-3">
              {myOrders.map(ord => (
                <div
                  key={ord.id}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 text-sm tracking-wider">
                        {ord.reference}
                      </span>
                      <span className="text-xs text-zinc-400">
                        ({new Date(ord.createdAt).toLocaleDateString('ar-MR')})
                      </span>
                    </div>
                    <span className="text-xs text-zinc-300 mt-1 block">
                      {ord.productName} — {ord.variantName}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-white text-sm">
                      {ord.amountMRU} {t('mru_currency')}
                    </span>

                    <button
                      onClick={() => {
                        setPrefilledTrackingRef(ord.reference);
                        setActiveTab('track');
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-200 bg-zinc-900 border border-zinc-700 hover:border-amber-400 transition-colors cursor-pointer"
                    >
                      تتبع
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 max-w-md mx-auto min-h-[70vh]">
      <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl">
        {/* Header Tabs */}
        <div className="flex border-b border-zinc-800 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-colors cursor-pointer ${
              mode === 'login' ? 'border-amber-400 text-amber-400' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {t('login_tab')}
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-colors cursor-pointer ${
              mode === 'register' ? 'border-amber-400 text-amber-400' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {t('register_tab')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="text-xs text-zinc-300 block mb-1 font-bold">
                  {t('customer_name_label')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="محمد الأمين"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 block mb-1 font-bold">
                  {t('customer_phone_label')}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="31520844"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs text-zinc-300 block mb-1 font-bold">
              {t('email_label')}
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@domain.mr"
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-300 block mb-1 font-bold">
              {t('password_label')}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 rounded-xl font-bold text-xs sm:text-sm text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            <span>{loading ? 'جاري المعالجة...' : mode === 'login' ? t('login_button') : t('register_button')}</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
          <p className="text-xs text-zinc-500">
            يمكنك دائماً الشحن والتتبع كضيف دون الحاجة لإنشاء حساب.
          </p>
        </div>
      </div>
    </section>
  );
}
