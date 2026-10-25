import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { SupportTicket } from '../types/index.ts';
import {
  MessageSquare, Clock, Phone, Send, Search, CheckCircle2,
  AlertCircle, ExternalLink, HelpCircle
} from 'lucide-react';

export function SupportSection() {
  const { t, settings, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'submit' | 'lookup'>('submit');

  // New ticket state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderReference, setOrderReference] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicketNumber, setSubmittedTicketNumber] = useState<string | null>(null);

  // Lookup state
  const [ticketNumberInput, setTicketNumberInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [lookedUpTicket, setLookedUpTicket] = useState<SupportTicket | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const whatsappNumber = settings?.whatsappNumber || '22231520844';
  const supportHours = settings?.supportHoursAr || 'يومياً من الساعة 09:00 صباحاً حتى 02:00 بعد منتصف الليل بتوقيت موريتانيا';

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          orderReference,
          subject,
          message,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إرسال التذكرة');

      setSubmittedTicketNumber(data.ticketNumber);
      showToast('تم إرسال تذكرتك بنجاح', 'success');
      setCustomerName('');
      setCustomerPhone('');
      setOrderReference('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookupTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketNumberInput.trim()) return;

    setLoadingTicket(true);
    setLookupError(null);
    try {
      const res = await fetch(`/api/support/tickets/${ticketNumberInput.trim().toUpperCase()}?phone=${encodeURIComponent(phoneInput.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر العثور على التذكرة');
      setLookedUpTicket(data);
    } catch (err: any) {
      setLookupError(err.message);
      setLookedUpTicket(null);
    } finally {
      setLoadingTicket(false);
    }
  };

  return (
    <section className="py-12 px-4 max-w-4xl mx-auto min-h-[70vh]">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {t('support_title')}
        </h2>
        <p className="text-zinc-400 text-sm mt-1.5 leading-relaxed">
          {t('support_subtitle')}
        </p>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Working Hours */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">{t('working_hours_title')}</span>
            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{supportHours}</p>
          </div>
        </div>

        {/* WhatsApp Direct */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">محادثة واتساب سريعة</span>
              <span className="text-xs text-zinc-400 font-mono">+{whatsappNumber}</span>
            </div>
          </div>
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('السلام عليكم، أحتاج مساعدة في متجر شادو ستور')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <span>{t('whatsapp_direct')}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
        <div className="flex border-b border-zinc-800 mb-6">
          <button
            onClick={() => setActiveTab('submit')}
            className={`flex-1 pb-3 text-xs sm:text-sm font-bold text-center border-b-2 transition-colors cursor-pointer ${
              activeTab === 'submit' ? 'border-amber-400 text-amber-400' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {t('submit_ticket_tab')}
          </button>
          <button
            onClick={() => setActiveTab('lookup')}
            className={`flex-1 pb-3 text-xs sm:text-sm font-bold text-center border-b-2 transition-colors cursor-pointer ${
              activeTab === 'lookup' ? 'border-amber-400 text-amber-400' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {t('lookup_ticket_tab')}
          </button>
        </div>

        {/* SUBMIT TAB */}
        {activeTab === 'submit' && (
          <div>
            {submittedTicketNumber ? (
              <div className="p-6 rounded-xl bg-zinc-950 border border-emerald-500/30 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-lg font-bold text-white">تم استلام تذكرتك بنجاح</h4>
                <p className="text-xs text-zinc-400">
                  رقم التذكرة الخاص بك للمتابعة:
                </p>
                <div className="text-2xl font-black font-mono text-amber-400">
                  {submittedTicketNumber}
                </div>
                <button
                  onClick={() => setSubmittedTicketNumber(null)}
                  className="mt-2 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                >
                  إرسال استفسار آخر
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitTicket} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-zinc-300 font-bold block mb-1">
                      {t('customer_name_label')} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="محمد الأمين"
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-300 font-bold block mb-1">
                      {t('customer_phone_label')} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="31520844"
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-zinc-300 font-bold block mb-1">
                      {t('ticket_subject_label')} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="مثال: استفسار بخصوص شحن فري فاير"
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-300 font-bold block mb-1">
                      رقم مرجع الطلب (إن وجد)
                    </label>
                    <input
                      type="text"
                      value={orderReference}
                      onChange={e => setOrderReference(e.target.value.toUpperCase())}
                      placeholder="SHD-2026-XXXX"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-zinc-300 font-bold block mb-1">
                    {t('ticket_message_label')} <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="اكتب استفسارك بالتفصيل..."
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 text-xs leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs sm:text-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'جاري الإرسال...' : t('ticket_submit_button')}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* LOOKUP TAB */}
        {activeTab === 'lookup' && (
          <div className="space-y-6">
            <form onSubmit={handleLookupTicket} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-300 font-bold block mb-1">
                    {t('ticket_number_label')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={ticketNumberInput}
                    onChange={e => setTicketNumberInput(e.target.value.toUpperCase())}
                    placeholder="مثال: TKT-8841"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono text-xs uppercase"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 font-bold block mb-1">
                    رقم الهاتف المسجل بالتذكرة
                  </label>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                    placeholder="31520844"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingTicket}
                className="w-full py-2.5 rounded-xl font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
              >
                <Search className="w-4 h-4" />
                <span>{loadingTicket ? 'جاري البحث...' : t('ticket_lookup_button')}</span>
              </button>
            </form>

            {lookupError && (
              <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/40 text-red-300 text-xs">
                {lookupError}
              </div>
            )}

            {lookedUpTicket && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
                  <span className="font-bold font-mono text-amber-400 text-sm">{lookedUpTicket.ticketNumber}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    lookedUpTicket.status === 'resolved' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                  }`}>
                    {lookedUpTicket.status}
                  </span>
                </div>

                <div>
                  <span className="text-zinc-500 block">الموضوع:</span>
                  <p className="font-semibold text-white">{lookedUpTicket.subject}</p>
                </div>

                <div>
                  <span className="text-zinc-500 block">رسالتك:</span>
                  <p className="text-zinc-300">{lookedUpTicket.message}</p>
                </div>

                {lookedUpTicket.adminReply && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 mt-2">
                    <span className="font-bold block mb-1">{t('admin_response')}</span>
                    <p>{lookedUpTicket.adminReply}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
