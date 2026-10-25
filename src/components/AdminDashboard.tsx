import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Order, OrderStatus, Product, ProductVariant, SupportTicket } from '../types/index.ts';
import {
  LayoutDashboard, ShoppingBag, Tag, MessageSquare, Settings as SettingsIcon,
  ShieldAlert, RefreshCw, CheckCircle2, Clock, AlertCircle, Eye, Save, X, Search,
  ExternalLink, Image as ImageIcon, Upload, Sparkles
} from 'lucide-react';
import { GameImage } from './GameImage.tsx';

export function AdminDashboard() {
  const { t, token, user, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'artwork' | 'support' | 'settings' | 'audit'>('overview');

  // Artwork Management State
  const [editingArtworkProduct, setEditingArtworkProduct] = useState<Product | null>(null);
  const [artworkUrlInput, setArtworkUrlInput] = useState('');
  const [artworkGenreInput, setArtworkGenreInput] = useState('');
  const [artworkBadgeInput, setArtworkBadgeInput] = useState('');
  const [savingArtwork, setSavingArtwork] = useState(false);

  // Overview stats
  const [overview, setOverview] = useState<any>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Order editing
  const [editStatus, setEditStatus] = useState<OrderStatus>('awaiting_payment');
  const [editCustomerNote, setEditCustomerNote] = useState('');
  const [editAdminNote, setEditAdminNote] = useState('');
  const [savingOrder, setSavingOrder] = useState(false);

  // Products
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [editingVariantPrice, setEditingVariantPrice] = useState<Record<string, number>>({});
  const [savingVariantId, setSavingVariantId] = useState<string | null>(null);

  // Support
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [ticketStatus, setTicketStatus] = useState<string>('resolved');
  const [savingTicket, setSavingTicket] = useState(false);

  // Store Settings
  const [settingsForm, setSettingsForm] = useState<any>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      loadOverview();
      loadOrders();
      loadProducts();
      loadSupport();
      loadSettings();
      loadAuditLogs();
    }
  }, [token]);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const loadOverview = async () => {
    setLoadingOverview(true);
    try {
      const res = await fetch('/api/admin/overview', { headers: authHeaders });
      if (res.ok) setOverview(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOverview(false);
    }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const query = new URLSearchParams();
      if (orderStatusFilter !== 'all') query.set('status', orderStatusFilter);
      if (orderSearch) query.set('search', orderSearch);

      const res = await fetch(`/api/admin/orders?${query.toString()}`, { headers: authHeaders });
      if (res.ok) setOrders(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/admin/products', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setAdminProducts(data);
        const prices: Record<string, number> = {};
        data.forEach((p: Product) => {
          p.variants?.forEach((v: ProductVariant) => {
            prices[v.id] = v.priceMRU;
          });
        });
        setEditingVariantPrice(prices);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSupport = async () => {
    try {
      const res = await fetch('/api/admin/support', { headers: authHeaders });
      if (res.ok) setTickets(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', { headers: authHeaders });
      if (res.ok) setSettingsForm(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs', { headers: authHeaders });
      if (res.ok) setAuditLogs(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenOrder = (o: Order) => {
    setSelectedOrder(o);
    setEditStatus(o.status);
    setEditCustomerNote(o.customerNotes || '');
    setEditAdminNote(o.adminNotes || '');
  };

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder) return;
    setSavingOrder(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          status: editStatus,
          customerNotes: editCustomerNote,
          adminNotes: editAdminNote,
          note: `تم تغيير الحالة إلى ${editStatus}`,
        }),
      });

      if (!res.ok) throw new Error('فشل تحديث الطلب');

      showToast('تم تحديث حالة الطلب بنجاح', 'success');
      setSelectedOrder(null);
      loadOrders();
      loadOverview();
      loadAuditLogs();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleSaveVariantPrice = async (variantId: string) => {
    const newPrice = editingVariantPrice[variantId];
    if (newPrice === undefined || newPrice < 0) return;

    setSavingVariantId(variantId);
    try {
      const res = await fetch(`/api/admin/variants/${variantId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ priceMRU: newPrice }),
      });
      if (!res.ok) throw new Error('فشل تعديل السعر');
      showToast('تم تحديث السعر في قاعدة البيانات', 'success');
      loadProducts();
      loadAuditLogs();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingVariantId(null);
    }
  };

  const handleOpenArtworkModal = (p: Product) => {
    setEditingArtworkProduct(p);
    setArtworkUrlInput(p.image);
    setArtworkGenreInput(p.genre || '');
    setArtworkBadgeInput(p.badgeTagAr || '');
  };

  const handleArtworkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        showToast('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 8 ميغابايت', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setArtworkUrlInput(reader.result as string);
        showToast('تم تحميل الصورة للمعاينة الحية', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveArtwork = async () => {
    if (!editingArtworkProduct || !artworkUrlInput.trim()) {
      showToast('يرجى إدخال أو اختيار رابط الصورة', 'error');
      return;
    }

    setSavingArtwork(true);
    try {
      const res = await fetch(`/api/admin/products/${editingArtworkProduct.id}/artwork`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          image: artworkUrlInput.trim(),
          genre: artworkGenreInput.trim(),
          badgeTagAr: artworkBadgeInput.trim(),
          badgeTagEn: artworkBadgeInput.trim(),
        }),
      });

      if (!res.ok) throw new Error('فشل تحديث غلاف اللعبة');

      showToast('تم تحديث غلاف وصورة اللعبة بنجاح!', 'success');
      setEditingArtworkProduct(null);
      loadProducts();
      loadAuditLogs();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingArtwork(false);
    }
  };

  const handleReplyTicket = async () => {
    if (!selectedTicket || !ticketReply.trim()) return;
    setSavingTicket(true);
    try {
      const res = await fetch(`/api/admin/support/${selectedTicket.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          adminReply: ticketReply.trim(),
          status: ticketStatus,
        }),
      });
      if (!res.ok) throw new Error('فشل الرد على التذكرة');
      showToast('تم إرسال الرد وتحديث التذكرة', 'success');
      setSelectedTicket(null);
      setTicketReply('');
      loadSupport();
      loadOverview();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingTicket(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(settingsForm),
      });
      if (!res.ok) throw new Error('فشل تحديث الإعدادات');
      showToast('تم حفظ إعدادات المتجر بنجاح', 'success');
      loadSettings();
      loadAuditLogs();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto min-h-[85vh]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {t('admin_dashboard_title')}
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            صلاحيات إدارة مشفرة ومؤمنة بالكامل على خادم شادو ستور
          </p>
        </div>

        {/* Quick Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-zinc-900 rounded-xl border border-zinc-800 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'overview' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t('admin_tab_overview')}
          </button>
          <button
            onClick={() => { setActiveTab('orders'); loadOrders(); }}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'orders' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t('admin_tab_orders')}
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'products' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t('admin_tab_products')}
          </button>
          <button
            onClick={() => setActiveTab('artwork')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'artwork' ? 'bg-amber-400 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>معرض أغلفة الألعاب (Artwork)</span>
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'support' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t('admin_tab_support')}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'settings' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t('admin_tab_settings')}
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'audit' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t('admin_tab_audit')}
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
              <span className="text-xs text-zinc-400 block font-medium">{t('admin_revenue')}</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                  {overview.totalRevenue.toLocaleString()}
                </span>
                <span className="text-xs text-zinc-400">{t('mru_currency')}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
              <span className="text-xs text-zinc-400 block font-medium">{t('admin_pending_orders')}</span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-1">
                {overview.awaitingPaymentCount + overview.needsReviewCount}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
              <span className="text-xs text-zinc-400 block font-medium">{t('admin_orders_progress')}</span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-purple-400 mt-1">
                {overview.inProgressCount}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
              <span className="text-xs text-zinc-400 block font-medium">{t('admin_completed_orders')}</span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-1">
                {overview.completedCount}
              </div>
            </div>
          </div>

          {/* Popular Games Chart Breakdown */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
            <h3 className="text-sm font-bold text-white mb-4">
              {t('popular_games_chart')} (إحصائيات حقيقية من قاعدة البيانات)
            </h3>
            <div className="space-y-3">
              {Object.entries(overview.gameStats || {}).map(([gameName, count]: [string, any]) => (
                <div key={gameName} className="space-y-1">
                  <div className="flex justify-between text-xs text-zinc-300">
                    <span className="font-medium">{gameName}</span>
                    <span className="font-mono text-amber-400">{count} طلب</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-950 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${Math.min(100, (count / Math.max(1, overview.totalOrders)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Controls Filter */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs">
              {['all', 'awaiting_payment', 'needs_review', 'in_progress', 'completed', 'rejected'].map(st => (
                <button
                  key={st}
                  onClick={() => { setOrderStatusFilter(st); }}
                  className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors whitespace-nowrap ${
                    orderStatusFilter === st
                      ? 'bg-amber-400 text-zinc-950 font-bold'
                      : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
                  }`}
                >
                  {st === 'all' && 'الكل'}
                  {st === 'awaiting_payment' && 'في انتظار التحويل'}
                  {st === 'needs_review' && 'مراجعة الحوالة'}
                  {st === 'in_progress' && 'قيد الشحن'}
                  {st === 'completed' && 'مكتمل'}
                  {st === 'rejected' && 'مرفوض'}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-64 relative">
              <input
                type="text"
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadOrders()}
                placeholder="بحث برقم المرجع أو الهاتف..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="rounded-xl border border-zinc-800 overflow-x-auto bg-zinc-900">
            <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
              <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">المرجع</th>
                  <th className="py-3 px-4">العميل / الهاتف</th>
                  <th className="py-3 px-4">الخدمة / الباقة</th>
                  <th className="py-3 px-4">Player ID</th>
                  <th className="py-3 px-4">المبلغ</th>
                  <th className="py-3 px-4">الدفع</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {orders.map(ord => (
                  <tr key={ord.id} className="hover:bg-zinc-850/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{ord.reference}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{ord.customerName}</div>
                      <div className="font-mono text-zinc-400 text-[11px]">{ord.customerPhone}</div>
                    </td>
                    <td className="py-3 px-4 text-zinc-300">
                      <div>{ord.productName}</div>
                      <div className="text-[11px] text-zinc-500">{ord.variantName}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-200">
                      {ord.playerId || (ord.accountCredentialsEncrypted ? '🔐 بيانات حساب' : '—')}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {ord.amountMRU} MRU
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-zinc-800 text-zinc-300">
                        {ord.paymentMethod}
                      </span>
                      {ord.transactionReference && (
                        <div className="font-mono text-[10px] text-amber-400 mt-0.5 truncate max-w-[100px]">
                          {ord.transactionReference}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        ord.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : ord.status === 'in_progress'
                          ? 'bg-purple-500/15 text-purple-400'
                          : ord.status === 'needs_review'
                          ? 'bg-blue-500/15 text-blue-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleOpenOrder(ord)}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-[11px] cursor-pointer"
                      >
                        معاينة وتحديث
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ORDER EDIT DRAWER / MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
              <div>
                <span className="text-xs text-zinc-400">إدارة طلب الشحن:</span>
                <span className="text-xl font-bold font-mono text-amber-400 ml-2 rtl:ml-2 ltr:mr-2">
                  {selectedOrder.reference}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-850">
                <div>
                  <span className="text-zinc-500">اسم العميل:</span>
                  <p className="font-bold text-white text-sm mt-0.5">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <span className="text-zinc-500">رقم الهاتف (التحقق):</span>
                  <p className="font-bold font-mono text-amber-400 text-sm mt-0.5">{selectedOrder.customerPhone}</p>
                </div>
                <div>
                  <span className="text-zinc-500">معرف اللاعب (Player ID):</span>
                  <p className="font-bold font-mono text-white text-sm mt-0.5">{selectedOrder.playerId || '—'}</p>
                </div>
                <div>
                  <span className="text-zinc-500">المبلغ المستحق:</span>
                  <p className="font-bold font-mono text-emerald-400 text-sm mt-0.5">{selectedOrder.amountMRU} MRU</p>
                </div>
              </div>

              {selectedOrder.accountCredentialsEncrypted && (
                <div className="p-3 rounded-xl bg-orange-950/20 border border-orange-500/30 text-orange-300">
                  <span className="font-bold block mb-1">🔐 بيانات الحساب المسلمة مؤقتاً:</span>
                  <p className="font-mono bg-zinc-950 p-2 rounded">{selectedOrder.accountCredentialsEncrypted}</p>
                </div>
              )}

              {selectedOrder.paymentProofUrl && (
                <div>
                  <span className="font-bold text-zinc-300 block mb-1">إشعار التحويل المرفق من العميل:</span>
                  <img
                    src={selectedOrder.paymentProofUrl}
                    alt="Payment Proof"
                    className="max-h-48 rounded-lg border border-zinc-700 object-contain"
                  />
                </div>
              )}

              {/* Status Update Form */}
              <div>
                <label className="font-bold text-zinc-300 block mb-1">تحديث حالة الطلب:</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as OrderStatus)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-400 font-semibold"
                >
                  <option value="awaiting_payment">في انتظار التحويل (awaiting_payment)</option>
                  <option value="needs_review">قيد مراجعة التحويل (needs_review)</option>
                  <option value="in_progress">جاري الشحن والتنفيذ (in_progress)</option>
                  <option value="completed">تم الشحن بنجاح (completed)</option>
                  <option value="rejected">مرفوض (rejected)</option>
                  <option value="cancelled">ملغي (cancelled)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-zinc-300 block mb-1">
                  رسالة تظهر للعميل في شاشة التتبع:
                </label>
                <input
                  type="text"
                  value={editCustomerNote}
                  onChange={e => setEditCustomerNote(e.target.value)}
                  placeholder="مثال: تم شحن الجواهر إلى حسابك بنجاح"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-300 block mb-1">
                  ملاحظة داخلية للإدارة فقط:
                </label>
                <input
                  type="text"
                  value={editAdminNote}
                  onChange={e => setEditAdminNote(e.target.value)}
                  placeholder="مثال: تم التأكد من وصول الحوالة في كشف بنكيلي"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  onClick={handleUpdateOrderStatus}
                  disabled={savingOrder}
                  className="flex-1 py-2.5 rounded-xl font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors cursor-pointer text-xs flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingOrder ? 'جاري الحفظ...' : 'حفظ التعديلات وتحديث الحالة'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS & PRICING TAB */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-400" />
            <span>يمكنك تعديل أسعار الباقات بالـ MRU وحفظ التعديلات فورياً في قاعدة البيانات.</span>
          </div>

          <div className="space-y-6">
            {adminProducts.map(prod => (
              <div key={prod.id} className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">{prod.nameAr}</h3>
                    <span className="text-[11px] text-zinc-400">{prod.game} · {prod.deliveryMethod}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {prod.variants?.map(v => (
                    <div key={v.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-zinc-200 block truncate">{v.nameAr}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{v.id}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={editingVariantPrice[v.id] ?? v.priceMRU}
                          onChange={e => setEditingVariantPrice({ ...editingVariantPrice, [v.id]: Number(e.target.value) })}
                          className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg py-1 px-2 text-xs font-mono font-bold text-amber-400 text-center focus:outline-none focus:border-amber-400"
                        />
                        <span className="text-[10px] text-zinc-400">MRU</span>
                        <button
                          onClick={() => handleSaveVariantPrice(v.id)}
                          disabled={savingVariantId === v.id}
                          className="p-1 rounded bg-amber-400 hover:bg-amber-300 text-zinc-950 transition-colors cursor-pointer"
                          title="حفظ السعر"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GAME ARTWORK MANAGEMENT TAB (Dedicated Artwork System) */}
      {activeTab === 'artwork' && (
        <div className="space-y-6">
          {/* Header Info Banner */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">منظومة أغلفة الألعاب والترويج الحصري (Game Artwork System)</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  إدارة الأغلفة الترويجية لكل لعبة بشكل منفصل عن الأسعار مع المعاينة الفورية ودعم الرفع المباشر.
                </p>
              </div>
            </div>
            <div className="text-xs font-mono text-zinc-400 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
              إجمالي الألعاب: <span className="text-amber-400 font-bold">{adminProducts.length}</span>
            </div>
          </div>

          {/* Games Artwork Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {adminProducts.map(prod => (
              <div
                key={prod.id}
                className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden hover:border-amber-500/40 transition-all flex flex-col justify-between group"
              >
                {/* Visual Preview */}
                <div className="relative">
                  <GameImage
                    src={prod.image}
                    alt={prod.nameAr}
                    gameName={prod.game}
                    genre={prod.genre}
                    aspectRatio="card"
                    className="w-full"
                  />
                  <div className="absolute top-2.5 right-2.5 rtl:right-2.5 ltr:left-2.5 z-20">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-950/80 text-amber-400 border border-amber-500/30">
                      {prod.game}
                    </span>
                  </div>
                  {prod.badgeTagAr && (
                    <div className="absolute bottom-2.5 right-2.5 rtl:right-2.5 ltr:left-2.5 z-20">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                        {prod.badgeTagAr}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info & Action */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                      {prod.nameAr}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                      <span>النوع: {prod.genre || 'عام'}</span>
                      <span>·</span>
                      <span className="truncate max-w-[120px] font-mono text-[10px] text-zinc-500" title={prod.image}>
                        {prod.image}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <button
                      onClick={() => handleOpenArtworkModal(prod)}
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>تعديل الغلاف والمعاينة الحية</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* EDIT ARTWORK MODAL */}
          {editingArtworkProduct && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
                  <div>
                    <span className="text-xs text-zinc-400">تعديل الغلاف الترويجي:</span>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      {editingArtworkProduct.nameAr} ({editingArtworkProduct.game})
                    </h3>
                  </div>
                  <button
                    onClick={() => setEditingArtworkProduct(null)}
                    className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Live Preview Box */}
                  <div>
                    <label className="text-zinc-300 font-bold block mb-1.5">المعاينة الحية للغلاف المختار:</label>
                    <div className="rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950 max-w-md mx-auto relative shadow-inner">
                      <GameImage
                        src={artworkUrlInput}
                        alt="Live Preview"
                        gameName={editingArtworkProduct.game}
                        genre={artworkGenreInput}
                        aspectRatio="card"
                        className="w-full h-52 object-cover"
                      />
                    </div>
                  </div>

                  {/* Image URL Input */}
                  <div>
                    <label className="text-zinc-300 font-bold block mb-1">
                      رابط الصورة المباشر (Image URL):
                    </label>
                    <input
                      type="text"
                      value={artworkUrlInput}
                      onChange={e => setArtworkUrlInput(e.target.value)}
                      placeholder="/public/assets/aistudio/... أو https://..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-amber-400 font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Local File Upload */}
                  <div>
                    <label className="text-zinc-300 font-bold block mb-1">
                      أو رفع صورة من جهازك (Direct File Upload):
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleArtworkFileUpload}
                      className="w-full text-xs text-zinc-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                    />
                  </div>

                  {/* Genre & Badge Tags */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-zinc-300 font-bold block mb-1">نوع اللعبة (Genre):</label>
                      <input
                        type="text"
                        value={artworkGenreInput}
                        onChange={e => setArtworkGenreInput(e.target.value)}
                        placeholder="مثال: Football Simulation / Battle Royale"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-300 font-bold block mb-1">شارة الغلاف (Badge Tag):</label>
                      <input
                        type="text"
                        value={artworkBadgeInput}
                        onChange={e => setArtworkBadgeInput(e.target.value)}
                        placeholder="مثال: نسخة لامين يامال ديلوكس الرسمية"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Quick Official Artwork Presets */}
                  <div>
                    <label className="text-zinc-300 font-bold block mb-1.5">أغلفة مرجعية سريعة متطابقة بالهوية:</label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setArtworkUrlInput('/public/assets/aistudio/IMG_99eb4f47-d254-4ab5-b447-de06effafee0_658a16ca.jpg');
                          setArtworkGenreInput('Football Simulation');
                          setArtworkBadgeInput('إصدار لامين يامال ديلوكس الرسمي');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] text-cyan-300 border border-cyan-500/30 cursor-pointer"
                      >
                        ⚽ eFootball (Lamine Yamal Deluxe)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setArtworkUrlInput('/public/assets/aistudio/33ab4129a3cc0ba004d7034d34df75d1_e18e035c.jpg');
                          setArtworkGenreInput('Battle Royale');
                          setArtworkBadgeInput('أبطال فري فاير الرسمية');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] text-orange-300 border border-orange-500/30 cursor-pointer"
                      >
                        🔥 Free Fire (Heroes Official)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setArtworkUrlInput('/src/assets/images/game_freefire_showcase_1792771592743.jpg');
                          setArtworkGenreInput('Battle Royale');
                          setArtworkBadgeInput('جواهر فري فاير VIP');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] text-amber-300 border border-amber-500/30 cursor-pointer"
                      >
                        💎 Free Fire (VIP Diamonds)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setArtworkUrlInput('/src/assets/images/game_pubg_showcase_1792771593842.jpg');
                          setArtworkGenreInput('Tactical Battle Royale');
                          setArtworkBadgeInput('خوذة لفل 3 وصناديق UC');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300 border border-zinc-700 cursor-pointer"
                      >
                        🪖 PUBG Mobile (Level 3 Tactical)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setArtworkUrlInput('/src/assets/images/game_eafc_showcase_1792773279075.jpg');
                          setArtworkGenreInput('Football Simulation');
                          setArtworkBadgeInput('تصوير رياضي وإضاءة ملاعب');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] text-emerald-300 border border-emerald-500/30 cursor-pointer"
                      >
                        🏟️ EA SPORTS FC (Stadium Match)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setArtworkUrlInput('/src/assets/images/game_psn_showcase_1792773278965.jpg');
                          setArtworkGenreInput('Console Gaming Store');
                          setArtworkBadgeInput('بطاقة بلايستيشن الرقمية');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] text-blue-300 border border-blue-500/30 cursor-pointer"
                      >
                        🎮 PlayStation (PS5 & Cards)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setArtworkUrlInput('/src/assets/images/game_googleplay_showcase_1792773278837.jpg');
                          setArtworkGenreInput('Digital Gift Cards');
                          setArtworkBadgeInput('بطاقات جوجل بلاي الرقمية');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] text-yellow-300 border border-yellow-500/30 cursor-pointer"
                      >
                        🎁 Google Play (Digital Cards)
                      </button>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-3 flex gap-2">
                    <button
                      onClick={handleSaveArtwork}
                      disabled={savingArtwork}
                      className="flex-1 py-2.5 rounded-xl font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      <Save className="w-4 h-4" />
                      <span>{savingArtwork ? 'جاري الحفظ والتطبيق...' : 'حفظ الغلاف وتحديث العرض فورياً'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUPPORT TAB */}
      {activeTab === 'support' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 overflow-x-auto bg-zinc-900">
            <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
              <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">رقم التذكرة</th>
                  <th className="py-3 px-4">العميل / الهاتف</th>
                  <th className="py-3 px-4">الموضوع</th>
                  <th className="py-3 px-4">المرجع</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {tickets.map(tkt => (
                  <tr key={tkt.id} className="hover:bg-zinc-850/50">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{tkt.ticketNumber}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{tkt.customerName}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">{tkt.customerPhone}</div>
                    </td>
                    <td className="py-3 px-4 text-zinc-200">{tkt.subject}</td>
                    <td className="py-3 px-4 font-mono text-zinc-400">{tkt.orderReference || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tkt.status === 'resolved' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        {tkt.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => { setSelectedTicket(tkt); setTicketReply(tkt.adminReply || ''); }}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold cursor-pointer"
                      >
                        رد
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedTicket && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                  <span className="font-bold text-sm text-white">الرد على تذكرة {selectedTicket.ticketNumber}</span>
                  <button onClick={() => setSelectedTicket(null)} className="text-zinc-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850">
                  <span className="text-zinc-400 block mb-1 font-bold">رسالة العميل:</span>
                  <p className="text-zinc-200 leading-relaxed">{selectedTicket.message}</p>
                </div>

                <div>
                  <label className="text-zinc-300 font-bold block mb-1">الرد المباشر للعميل:</label>
                  <textarea
                    rows={3}
                    value={ticketReply}
                    onChange={e => setTicketReply(e.target.value)}
                    placeholder="اكتب رد فريق شادو ستور..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleReplyTicket}
                    disabled={savingTicket}
                    className="flex-1 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold cursor-pointer"
                  >
                    {savingTicket ? 'جاري الإرسال...' : 'إرسال الرد وحل التذكرة'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && settingsForm && (
        <form onSubmit={handleSaveSettings} className="max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white mb-2">إعدادات أرقام الحسابات وتعليمات الدفع الموريتانية</h3>

          <div>
            <label className="text-zinc-300 font-bold block mb-1">رقم الدفع المعتمد في موريتانيا:</label>
            <input
              type="text"
              value={settingsForm.paymentNumber}
              onChange={e => setSettingsForm({ ...settingsForm, paymentNumber: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-amber-400 font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-zinc-300 font-bold block mb-1">رقم واتساب الدعم الفني الدولي:</label>
            <input
              type="text"
              value={settingsForm.whatsappNumber}
              onChange={e => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 font-mono"
            />
          </div>

          <div>
            <label className="text-zinc-300 font-bold block mb-1">تعليمات بنكيلي (Bankily):</label>
            <textarea
              rows={2}
              value={settingsForm.bankilyInstructionsAr}
              onChange={e => setSettingsForm({ ...settingsForm, bankilyInstructionsAr: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200"
            />
          </div>

          <div>
            <label className="text-zinc-300 font-bold block mb-1">أوقات العمل الرسمية:</label>
            <input
              type="text"
              value={settingsForm.supportHoursAr}
              onChange={e => setSettingsForm({ ...settingsForm, supportHoursAr: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200"
            />
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="w-full py-2.5 rounded-xl font-bold bg-amber-400 hover:bg-amber-300 text-zinc-950 transition-colors cursor-pointer"
          >
            {savingSettings ? 'جاري الحفظ...' : 'حفظ إعدادات المتجر'}
          </button>
        </form>
      )}

      {/* AUDIT LOGS TAB */}
      {activeTab === 'audit' && (
        <div className="rounded-xl border border-zinc-800 overflow-x-auto bg-zinc-900 text-xs">
          <table className="w-full text-right rtl:text-right ltr:text-left">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">الوقت</th>
                <th className="py-3 px-4">العملية</th>
                <th className="py-3 px-4">التفاصيل</th>
                <th className="py-3 px-4">المستخدم</th>
                <th className="py-3 px-4">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 font-mono text-[11px]">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-zinc-850">
                  <td className="py-2.5 px-4 text-zinc-500">{new Date(log.timestamp).toLocaleString('ar-MR')}</td>
                  <td className="py-2.5 px-4 font-bold text-amber-400">{log.action}</td>
                  <td className="py-2.5 px-4 text-zinc-300 font-sans">{log.details}</td>
                  <td className="py-2.5 px-4 text-zinc-400">{log.userEmail || 'System/Guest'}</td>
                  <td className="py-2.5 px-4 text-zinc-500">{log.ip || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
