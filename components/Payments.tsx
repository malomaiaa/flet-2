import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  CreditCard, Banknote, Building2, Ticket, CheckCircle2, AlertTriangle, 
  Send, Plus, X, Search, Wallet, ArrowRight, Clock, Edit2, Trash, History
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Booking, Payment, PaymentMethod, PaymentPurpose, PaymentStatus } from '../types';

interface PaymentsProps {
  bookings: Booking[];
  payments: Payment[];
  onAddPayment: (payment: Payment) => void;
  onUpdatePayment: (payment: Payment) => void;
  onDeletePayment: (paymentId: string) => void;
  onDeleteBooking: (bookingId: string) => void;
}

const Payments: React.FC<PaymentsProps> = ({ bookings, payments, onAddPayment, onUpdatePayment, onDeletePayment, onDeleteBooking }) => {
  const { t, dir } = useLanguage();
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'partial' | 'owed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [viewHistoryBookingId, setViewHistoryBookingId] = useState<string>('');
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState<Partial<Payment>>({
    amount: 0,
    method: PaymentMethod.CASH,
    purpose: PaymentPurpose.RENTAL,
    notes: '',
    reference: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Derived Data: Aggregate payments for each booking
  const bookingFinancials = useMemo(() => {
    return bookings.map(booking => {
      const bookingPayments = payments.filter(p => p.bookingId === booking.id && p.status !== PaymentStatus.BOUNCED && p.status !== PaymentStatus.REFUNDED);
      const totalPaid = bookingPayments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = booking.totalPrice - totalPaid;
      
      let status: 'Paid' | 'Partial' | 'Owed' = 'Owed';
      if (remaining <= 0) status = 'Paid';
      else if (totalPaid > 0) status = 'Partial';

      // Find the most recent payment method
      const lastPayment = [...bookingPayments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      const method = lastPayment ? lastPayment.method : null;

      return {
        ...booking,
        totalPaid,
        remaining,
        financialStatus: status,
        lastPaymentMethod: method
      };
    });
  }, [bookings, payments]);

  const filteredBookings = useMemo(() => {
    let result = bookingFinancials;

    // Filter by Tab
    if (activeTab === 'paid') result = result.filter(b => b.financialStatus === 'Paid');
    if (activeTab === 'partial') result = result.filter(b => b.financialStatus === 'Partial');
    if (activeTab === 'owed') result = result.filter(b => b.financialStatus === 'Owed');

    // Filter by Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.clientName.toLowerCase().includes(q) || 
        b.id.toLowerCase().includes(q)
      );
    }

    return result;
  }, [bookingFinancials, activeTab, searchQuery]);

  // --- HANDLERS ---

  const handleOpenAddPayment = (bookingId?: string) => {
    setEditingPayment(null);
    setSelectedBookingId(bookingId || '');
    if (bookingId) {
      // Pre-fill amount with remaining balance
      const booking = bookingFinancials.find(b => b.id === bookingId);
      if (booking) {
        setPaymentForm({ 
          amount: booking.remaining > 0 ? booking.remaining : 0,
          method: PaymentMethod.CASH,
          purpose: PaymentPurpose.RENTAL,
          notes: '',
          reference: '',
          date: new Date().toISOString().split('T')[0]
        });
      }
    } else {
      setPaymentForm({ 
        amount: 0,
        method: PaymentMethod.CASH,
        purpose: PaymentPurpose.RENTAL,
        notes: '',
        reference: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
    setIsPaymentModalOpen(true);
  };

  const handleOpenEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setSelectedBookingId(payment.bookingId);
    setPaymentForm({
      amount: payment.amount,
      method: payment.method,
      purpose: payment.purpose,
      notes: payment.notes || '',
      reference: payment.reference || '',
      date: payment.date
    });
    // Close history modal if open to focus on edit
    setIsHistoryModalOpen(false); 
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = () => {
    if (!selectedBookingId || !paymentForm.amount) return;

    let status = PaymentStatus.PAID;
    if (paymentForm.method === PaymentMethod.CHECK) status = PaymentStatus.PENDING;

    const commonData = {
      bookingId: selectedBookingId,
      amount: Number(paymentForm.amount),
      currency: 'MAD',
      method: paymentForm.method as PaymentMethod,
      purpose: paymentForm.purpose as PaymentPurpose,
      status: status,
      date: paymentForm.date || new Date().toISOString().split('T')[0],
      collectedBy: 'Admin',
      reference: paymentForm.reference,
      notes: paymentForm.notes
    };

    if (editingPayment) {
      // UPDATE
      onUpdatePayment({
        ...editingPayment,
        ...commonData
      });
    } else {
      // CREATE
      const newPayment: Payment = {
        id: `PAY-${Math.floor(Math.random() * 10000)}`,
        ...commonData
      };
      onAddPayment(newPayment);
    }

    setIsPaymentModalOpen(false);
    
    if (viewHistoryBookingId === selectedBookingId) {
      setIsHistoryModalOpen(true);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setPaymentForm({
      amount: 0,
      method: PaymentMethod.CASH,
      purpose: PaymentPurpose.RENTAL,
      notes: '',
      reference: '',
      date: new Date().toISOString().split('T')[0]
    });
    setSelectedBookingId('');
    setEditingPayment(null);
  };

  const handleOpenHistory = (bookingId: string) => {
    setViewHistoryBookingId(bookingId);
    setIsHistoryModalOpen(true);
  };

  const getMethodIcon = (method: PaymentMethod | null) => {
    if (!method) return <Wallet className="w-4 h-4 text-gray-500" />;
    switch (method) {
      case PaymentMethod.CASH: return <Banknote className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
      case PaymentMethod.CREDIT_CARD: return <CreditCard className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />;
      case PaymentMethod.BANK_TRANSFER: return <Building2 className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
      case PaymentMethod.CHECK: return <Ticket className="w-4 h-4 text-orange-500 dark:text-orange-400" />;
      default: return <CreditCard className="w-4 h-4 text-gray-500" />;
    }
  };

  const tabs = [
    { id: 'all', label: t('allPayments') },
    { id: 'paid', label: t('paidInFull') },
    { id: 'partial', label: t('partialPayment') },
    { id: 'owed', label: t('owed') },
  ];

  // Helper for Modal Summary
  const selectedBookingDetails = bookingFinancials.find(b => b.id === selectedBookingId);
  const projectedRemaining = selectedBookingDetails 
    ? Math.max(0, selectedBookingDetails.totalPrice - (selectedBookingDetails.totalPaid - (editingPayment ? editingPayment.amount : 0) + (paymentForm.amount || 0)))
    : 0;

  // History Data
  const historyPayments = payments
    .filter(p => p.bookingId === viewHistoryBookingId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Recent Global Transactions (Last 10)
  const recentGlobalTransactions = [...payments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-8 pb-12">
       {/* Header & Controls */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div className="relative group w-full md:w-96">
            <Search className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-3.5 w-5 h-5 text-gray-500`} />
            <input 
              type="text" 
              placeholder={t('search')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-3.5 ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600`}
            />
         </div>
         <button 
           onClick={() => handleOpenAddPayment()}
           className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400 text-white dark:text-gray-900 rounded-full font-bold shadow-glow hover:scale-105 transition-all"
         >
            <Plus className="w-5 h-5" />
            {t('recordPayment')}
         </button>
       </div>

       {/* Tabs */}
       <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800 pb-1">
         {tabs.map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`px-6 py-3 rounded-t-2xl font-bold text-sm transition-all relative top-[1px] ${
               activeTab === tab.id
                 ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-x border-t border-gray-200 dark:border-gray-800 border-b-white dark:border-b-gray-900 z-10'
                 : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
             }`}
           >
             {tab.label}
           </button>
         ))}
       </div>

       {/* Table */}
       <div className="bg-white dark:bg-gray-900 rounded-b-[2rem] rounded-tr-[2rem] overflow-hidden border border-gray-200 dark:border-gray-800">
         <div className="overflow-x-auto">
           <table className="w-full text-left rtl:text-right">
             <thead className="bg-gray-50 dark:bg-gray-800/50">
               <tr>
                 <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('client')}</th>
                 <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('invoiceId')}</th>
                 <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('total')}</th>
                 <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('paidAmount')}</th>
                 <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('remainingBalance')}</th>
                 <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('status')}</th>
                 <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('paymentMethod')}</th>
                 <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right rtl:text-left">{t('actions')}</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
               {filteredBookings.map(booking => (
                 <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                   <td className="px-6 py-5">
                     <div className="flex items-center gap-3">
                       <img src={booking.clientAvatar} alt={booking.clientName} className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-800" />
                       <span className="font-bold text-gray-900 dark:text-white">{booking.clientName}</span>
                     </div>
                   </td>
                   <td className="px-6 py-5 text-sm font-bold text-gray-500">{booking.id}</td>
                   <td className="px-6 py-5 font-black text-gray-900 dark:text-white" dir="ltr">MAD {booking.totalPrice.toLocaleString()}</td>
                   <td className="px-6 py-5 font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">MAD {booking.totalPaid.toLocaleString()}</td>
                   <td className={`px-6 py-5 font-bold ${booking.remaining > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-500'}`} dir="ltr">
                     MAD {booking.remaining.toLocaleString()}
                   </td>
                   <td className="px-6 py-5">
                     <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 w-fit ${
                       booking.financialStatus === 'Paid' 
                         ? 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-400/20' 
                         : booking.financialStatus === 'Partial'
                         ? 'bg-orange-100 dark:bg-orange-400/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-400/20'
                         : 'bg-red-100 dark:bg-red-400/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-400/20'
                     }`}>
                       {booking.financialStatus === 'Paid' && <CheckCircle2 className="w-3.5 h-3.5" />}
                       {booking.financialStatus === 'Partial' && <AlertTriangle className="w-3.5 h-3.5" />}
                       {booking.financialStatus === 'Owed' && <AlertTriangle className="w-3.5 h-3.5" />}
                       {t(booking.financialStatus === 'Paid' ? 'paidInFull' : booking.financialStatus === 'Partial' ? 'partialPayment' : 'owed')}
                     </span>
                   </td>
                   <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                        {getMethodIcon(booking.lastPaymentMethod)}
                        {booking.lastPaymentMethod ? t(`paymentMethods.${booking.lastPaymentMethod}`) : '-'}
                      </div>
                   </td>
                   <td className="px-6 py-5 text-right rtl:text-left">
                      <div className="flex justify-end gap-2">
                        {/* History Button */}
                        <button 
                           onClick={() => handleOpenHistory(booking.id)}
                           className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                           title={t('transactionHistory')}
                        >
                           <Clock className="w-4 h-4" />
                        </button>
                         {/* Record Payment Button */}
                         {booking.remaining > 0 ? (
                            <button 
                              onClick={() => handleOpenAddPayment(booking.id)}
                              className="p-2 bg-emerald-500 dark:bg-emerald-400 text-white dark:text-gray-900 rounded-full hover:scale-110 transition-all shadow-glow"
                              title={t('recordPayment')}
                            >
                               <Plus className="w-4 h-4" />
                            </button>
                         ) : (
                             <div className="p-2 text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-400/10 rounded-full">
                                <CheckCircle2 className="w-4 h-4" />
                             </div>
                         )}

                         {/* Delete Row (Booking) Button */}
                         <button 
                           onClick={() => onDeleteBooking(booking.id)}
                           className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                           title={t('deleteBooking')}
                         >
                           <Trash className="w-4 h-4" />
                         </button>
                      </div>
                   </td>
                 </tr>
               ))}
               {filteredBookings.length === 0 && (
                 <tr>
                   <td colSpan={8} className="px-6 py-12 text-center text-gray-500 font-bold">
                     No payments found matching your criteria.
                   </td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>
       </div>

       {/* Global Transaction History (New Feature) */}
       <div className="mt-8">
          <div className="flex items-center gap-3 mb-6">
             <History className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
             <h3 className="text-xl font-black text-gray-900 dark:text-white">{t('transactionHistory')} (Recent)</h3>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-none">
             <table className="w-full text-left rtl:text-right">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                   <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{t('date')}</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{t('invoiceId')}</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{t('method')}</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{t('amount')}</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{t('status')}</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                   {recentGlobalTransactions.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                         <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-bold">{p.date}</td>
                         <td className="px-6 py-4 text-sm text-gray-500">#{p.bookingId}</td>
                         <td className="px-6 py-4 text-sm text-gray-500 flex items-center gap-2">
                            {getMethodIcon(p.method)}
                            {t(`paymentMethods.${p.method}`)}
                         </td>
                         <td className="px-6 py-4 font-black text-gray-900 dark:text-white" dir="ltr">MAD {p.amount.toLocaleString()}</td>
                         <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                               p.status === 'Paid' || p.status === 'Cleared' ? 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400' : 'bg-orange-100 dark:bg-orange-400/10 text-orange-600 dark:text-orange-400'
                            }`}>{p.status}</span>
                         </td>
                      </tr>
                   ))}
                   {recentGlobalTransactions.length === 0 && (
                      <tr>
                         <td colSpan={5} className="px-6 py-8 text-center text-gray-500 font-bold">No recent transactions.</td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
       </div>

       {/* HISTORY MODAL with Portal */}
       {isHistoryModalOpen && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsHistoryModalOpen(false)}></div>
             <div className="relative bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[2rem] border border-gray-200 dark:border-gray-800 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                   <div>
                     <h3 className="text-xl font-black text-gray-900 dark:text-white">{t('transactionHistory')}</h3>
                     <p className="text-sm font-medium text-gray-500">Booking #{viewHistoryBookingId}</p>
                   </div>
                   <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 bg-gray-100 dark:bg-transparent hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
                      <X className="w-5 h-5 text-gray-500" />
                   </button>
                </div>
                
                <div className="p-0 overflow-y-auto flex-1">
                   {historyPayments.length > 0 ? (
                      <table className="w-full text-left rtl:text-right">
                         <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                               <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{t('paymentDate')}</th>
                               <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{t('paymentMethod')}</th>
                               <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{t('amount')}</th>
                               <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{t('status')}</th>
                               <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right rtl:text-left">{t('actions')}</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {historyPayments.map(p => (
                               <tr key={p.id}>
                                  <td className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">{p.date}</td>
                                  <td className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">{t(`paymentMethods.${p.method}`)}</td>
                                  <td className="px-6 py-4 text-sm font-black text-gray-900 dark:text-white" dir="ltr">MAD {p.amount.toLocaleString()}</td>
                                  <td className="px-6 py-4">
                                     <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                                        p.status === 'Paid' || p.status === 'Cleared' ? 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400' : 'bg-orange-100 dark:bg-orange-400/10 text-orange-600 dark:text-orange-400'
                                     }`}>{p.status}</span>
                                  </td>
                                  <td className="px-6 py-4 text-right rtl:text-left flex justify-end gap-2">
                                     <button 
                                        onClick={() => handleOpenEditPayment(p)}
                                        className="p-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                     >
                                        <Edit2 className="w-3.5 h-3.5" />
                                     </button>
                                     <button 
                                        onClick={() => onDeletePayment(p.id)}
                                        className="p-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                     >
                                        <Trash className="w-3.5 h-3.5" />
                                     </button>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   ) : (
                      <div className="p-12 text-center text-gray-500 font-bold">
                         {t('noTransactions')}
                      </div>
                   )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 flex justify-end">
                    <button 
                       onClick={() => {
                          setIsHistoryModalOpen(false);
                          handleOpenAddPayment(viewHistoryBookingId);
                       }}
                       className="px-6 py-3 bg-white dark:bg-white text-black rounded-full font-bold shadow-lg hover:scale-105 transition-all text-sm flex items-center gap-2"
                    >
                       <Plus className="w-4 h-4" />
                       {t('addPayment')}
                    </button>
                </div>
             </div>
          </div>,
          document.body
       )}

       {/* Add/Edit Payment Modal with Portal */}
       {isPaymentModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)}></div>
           <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-md rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                 <h3 className="text-xl font-black text-gray-900 dark:text-white">
                    {editingPayment ? t('editPayment') : t('recordPayment')}
                 </h3>
                 <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 bg-gray-100 dark:bg-transparent hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                 </button>
              </div>
              <div className="p-6 space-y-4">
                 
                 {/* Booking Selection (Disabled if editing or pre-selected) */}
                 <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('client')} / {t('bookingId')}</label>
                    <div className="relative">
                       <select 
                         value={selectedBookingId} 
                         disabled={!!editingPayment}
                         onChange={(e) => {
                           setSelectedBookingId(e.target.value);
                           const b = bookingFinancials.find(booking => booking.id === e.target.value);
                           if (b) setPaymentForm(prev => ({...prev, amount: b.remaining > 0 ? b.remaining : 0}));
                         }}
                         className="w-full px-4 py-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
                       >
                          <option value="">Select Booking...</option>
                          {bookingFinancials.map(b => (
                             <option key={b.id} value={b.id}>
                                {b.clientName} - {b.id}
                             </option>
                          ))}
                       </select>
                       <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 ${dir === 'rtl' ? 'left-4' : 'right-4'}`}>▼</div>
                    </div>
                 </div>

                 {/* Read-Only Financial Summary & Logic */}
                 {selectedBookingDetails && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 text-sm">
                       <div className="flex justify-between mb-2">
                          <span className="text-gray-500 dark:text-gray-400 font-medium">{t('total')}:</span>
                          <span className="font-bold text-gray-900 dark:text-white">MAD {selectedBookingDetails.totalPrice.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between mb-2">
                          <span className="text-gray-500 dark:text-gray-400 font-medium">{t('paidSoFar')}:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">MAD {(selectedBookingDetails.totalPaid - (editingPayment ? editingPayment.amount : 0)).toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                          <span className="font-bold text-gray-900 dark:text-white">{t('remainingBalance')}:</span>
                          <div className="text-right">
                             {/* Live Calculation Preview */}
                             {paymentForm.amount && paymentForm.amount > 0 ? (
                                <div className="flex items-center justify-end gap-1 text-xs font-bold">
                                   <span className="text-red-400 line-through mr-1 opacity-50">MAD {selectedBookingDetails.remaining.toLocaleString()}</span>
                                   <ArrowRight className="w-3 h-3 text-gray-500" />
                                   <span className={projectedRemaining <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500 dark:text-orange-400'}>
                                      MAD {projectedRemaining.toLocaleString()}
                                      {projectedRemaining <= 0 && ' (Paid)'}
                                   </span>
                                </div>
                             ) : (
                                <span className="block font-black text-red-500 text-base">MAD {selectedBookingDetails.remaining.toLocaleString()}</span>
                             )}
                          </div>
                       </div>
                    </div>
                 )}

                 {/* Amount Input */}
                 <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('amount')} (MAD)</label>
                    <input 
                      type="number" 
                      value={paymentForm.amount || ''}
                      onChange={(e) => setPaymentForm({...paymentForm, amount: Number(e.target.value)})}
                      className="w-full px-4 py-4 text-3xl font-black bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-700"
                      placeholder="0.00"
                    />
                 </div>

                 {/* Method Selection */}
                 <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('paymentMethod')}</label>
                    <div className="grid grid-cols-3 gap-2">
                       {Object.values(PaymentMethod).map((m) => (
                          <button 
                            key={m}
                            onClick={() => setPaymentForm({...paymentForm, method: m})}
                            className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${
                               paymentForm.method === m 
                               ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400' 
                               : 'border-gray-200 dark:border-gray-800 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                             {t(`paymentMethods.${m}`)}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('paymentDate')}</label>
                        <input 
                           type="date" 
                           value={paymentForm.date}
                           onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
                           className="w-full px-4 py-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-bold dark:[color-scheme:dark]"
                        />
                     </div>
                 </div>

                 <textarea 
                   placeholder={t('notes')}
                   className="w-full p-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl text-sm font-bold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none text-gray-900 dark:text-white"
                   rows={2}
                   value={paymentForm.notes}
                   onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                 ></textarea>

              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex gap-3">
                 <button onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
                    {t('cancel')}
                 </button>
                 <button 
                  onClick={handleSavePayment}
                  className="flex-[2] py-3 text-sm font-bold text-white dark:text-gray-900 bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400 rounded-xl shadow-glow hover:scale-105 transition-all"
                 >
                    {editingPayment ? t('savePayment') : t('recordPayment')}
                 </button>
              </div>
           </div>
        </div>,
        document.body
       )}
    </div>
  );
};

export default Payments;