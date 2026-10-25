import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Order, OrderStatus } from '../types/index.ts';
import {
  Search, ShieldCheck, CheckCircle2, Clock, AlertTriangle, XCircle,
  ExternalLink, ArrowLeft, ArrowRight, MessageSquare, Copy, Check
} from 'lucide-react';

export function OrderTracking() {
  const { t, prefilledTrackingRef, user, showToast, settings } = useApp();

  const [reference, setReference] = useState(prefilledTrackingRef || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Update proof state
  const [transactionRefInput, setTransactionRefInput] = useState('');
  const [updatingProof, setUpdatingProof] = useState(false);

  useEffect(() => {
    if (prefilledTrackingRef) {
      setReference(prefilledTrackingRef);
      if (user?.phone) {
        setPhone(user.phone);
        performTrack(prefilledTrackingRef, user.phone);
      }
    }
  }, [prefilledTrackingRef]);

  const performTrack = async (refToUse: string, phoneToUse: string) => {
    if (!refToUse.trim()) {
      showToast('يرجى إدخال رقم مرجع الطلب', 'error');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user ? { Authorization: `Bearer ${localStorage.getItem('shadow_store_token')}` } : {}),
        },
        body: JSON.stringify({
          reference: refToUse.trim(),
          phone: phoneToUse.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر العثور على الطلب');
      }

      setOrder(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء الاستعلام');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performTrack(reference, phone);
  };

  const handleUpdatePaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !transactionRefInput.trim()) return;

    setUpdatingProof(true);
    try {
      const res = await fetch('/api/orders/update-payment-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: order.reference,
          phone: phone.trim(),
          transactionReference: transactionRefInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تحديث الإشعار');

      showToast(data.message || 'تم تحديث الإشعار بنجاح', 'success');
      performTrack(order.reference, phone);
      setTransactionRefInput('');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUpdatingProof(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'awaiting_payment':
        return { label: t('status_awaiting_payment'), color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
      case 'needs_review':
        return { label: t('status_needs_review'), color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
      case 'in_progress':
        return { label: t('status_in_progress'), color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
      case 'completed':
        return { label: t('status_completed'), color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
      case 'rejected':
        return { label: t('status_rejected'), color: 'bg-red-500/15 text-red-400 border-red-500/30' };
      case 'cancelled':
        return { label: t('status_cancelled'), color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' };
      default:
        return { label: status, color: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
    }
  };

  const steps: OrderStatus[] = ['awaiting_payment', 'needs_review', 'in_progress', 'completed'];

  const getStepState = (step: OrderStatus, current: OrderStatus) => {
    const currentIdx = steps.indexOf(current);
    const stepIdx = steps.indexOf(step);
    if (current === 'completed') return 'done';
    if (current === 'rejected' || current === 'cancelled') return 'failed';
    if (stepIdx < currentIdx) return 'done';
    if (stepIdx === currentIdx) return 'active';
    return 'pending';
  };

  return (
    <section className="py-12 px-4 max-w-4xl mx-auto min-h-[70vh]">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-amber-400 text-xs font-semibold mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>تتبع محمي بالتحقق المزدوج</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {t('track_title')}
        </h2>
        <p className="text-zinc-400 text-xs sm:text-sm mt-1.5 leading-relaxed">
          {t('track_subtitle')}
        </p>
      </div>

      {/* Lookup Form */}
      <form onSubmit={handleTrackSubmit} className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 mb-8 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-300 block mb-1.5 font-bold">
              {t('order_reference_label')} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value.toUpperCase())}
              placeholder={t('order_reference_placeholder')}
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono tracking-wider uppercase"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-300 block mb-1.5 font-bold">
              {t('verification_phone_label')} <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="مثال: 31520844"
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 py-3 rounded-xl font-bold text-xs sm:text-sm text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Search className="w-4 h-4" />
          <span>{loading ? 'جاري التحقق والاستعلام...' : t('track_button')}</span>
        </button>
      </form>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 text-red-300 text-xs sm:text-sm flex items-center gap-3 mb-8">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Order Display */}
      {order && (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl">
          {/* Header Strip */}
          <div className="p-6 bg-zinc-950 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">المرجع:</span>
                <span className="text-xl font-black font-mono text-amber-400 tracking-wider">
                  {order.reference}
                </span>
              </div>
              <span className="text-xs text-zinc-400 mt-1 block">
                تاريخ الطلب: {new Date(order.createdAt).toLocaleString('ar-MR')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {(() => {
                const b = getStatusBadge(order.status);
                return (
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${b.color}`}>
                    {b.label}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Stepper Visual */}
          <div className="p-6 border-b border-zinc-800/80 bg-zinc-900/40">
            <div className="grid grid-cols-4 gap-2 text-center">
              {steps.map((st, idx) => {
                const state = getStepState(st, order.status);
                return (
                  <div key={st} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 border transition-all ${
                        state === 'done'
                          ? 'bg-emerald-500 text-zinc-950 border-emerald-400'
                          : state === 'active'
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 ring-4 ring-amber-500/20'
                          : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                      }`}
                    >
                      {state === 'done' ? '✓' : idx + 1}
                    </div>
                    <span className="text-[11px] font-semibold text-zinc-300 hidden sm:block">
                      {st === 'awaiting_payment' && 'في انتظار التحويل'}
                      {st === 'needs_review' && 'مراجعة الحوالة'}
                      {st === 'in_progress' && 'جاري الشحن'}
                      {st === 'completed' && 'مكتمل بنجاح'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-850">
              <span className="text-zinc-500 block text-xs">المنتج والباقة:</span>
              <span className="font-bold text-white text-base mt-0.5 block">
                {order.productName} — {order.variantName}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-850">
              <span className="text-zinc-500 block text-xs">المبلغ الإجمالي:</span>
              <span className="font-bold text-amber-400 text-lg font-mono mt-0.5 block">
                {order.amountMRU} {t('mru_currency')}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-850">
              <span className="text-zinc-500 block text-xs">معرف اللاعب (Player ID):</span>
              <span className="font-bold font-mono text-zinc-200 text-base mt-0.5 block">
                {order.playerId || '—'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-850">
              <span className="text-zinc-500 block text-xs">طريقة الدفع ورقم الحساب:</span>
              <span className="font-semibold text-zinc-200 text-sm mt-0.5 block">
                {order.paymentMethod.toUpperCase()} — {order.paymentPhone}
              </span>
            </div>
          </div>

          {/* Customer / Admin visible notes */}
          {order.customerNotes && (
            <div className="px-6 pb-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                <span className="font-bold block mb-1">ملاحظة من فريق شادو ستور:</span>
                <span>{order.customerNotes}</span>
              </div>
            </div>
          )}

          {/* Timeline History */}
          {order.history && order.history.length > 0 && (
            <div className="p-6 border-t border-zinc-800">
              <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider mb-4">
                {t('order_timeline')}
              </h4>
              <div className="space-y-3">
                {order.history.map(item => (
                  <div key={item.id} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <div>
                      <span className="text-zinc-200 font-medium">{item.note}</span>
                      <span className="text-zinc-500 block text-[10px] mt-0.5">
                        {new Date(item.timestamp).toLocaleString('ar-MR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Payment Action */}
          {order.status === 'awaiting_payment' && (
            <div className="p-6 bg-zinc-950 border-t border-zinc-800">
              <h4 className="text-xs font-bold text-amber-400 mb-2">
                {t('attach_proof_prompt')}
              </h4>
              <form onSubmit={handleUpdatePaymentProof} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={transactionRefInput}
                  onChange={e => setTransactionRefInput(e.target.value)}
                  placeholder="أدخل رقم إشعار التحويل البنكي (Transaction Reference)"
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={updatingProof}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-zinc-950 bg-amber-400 hover:bg-amber-300 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  {updatingProof ? 'جاري الإرسال...' : t('update_proof_button')}
                </button>
              </form>
            </div>
          )}

          {/* Footer Contact */}
          <div className="p-4 bg-zinc-950/80 border-t border-zinc-850 flex items-center justify-between text-xs">
            <span className="text-zinc-400">هل تحتاج مساعدة بخصوص هذا الطلب؟</span>
            <a
              href={`https://wa.me/22231520844?text=${encodeURIComponent(
                `السلام عليكم، أود الاستفسار عن طلبي رقم: ${order.reference}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-emerald-400 hover:text-emerald-300"
            >
              <span>{t('whatsapp_assistance')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
