import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, Printer, Save, CheckCircle, ChevronDown, 
  History as HistoryIcon, Eye, Download, Globe, PenTool
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Booking, Payment, Car, Client, GlobalSettings, 
  Contract, PaymentMethod, PaymentPurpose, PaymentStatus
} from '../types';
import { useSubscription } from '../contexts/SubscriptionContext';

// Declare html2pdf for TypeScript since it's loaded via CDN
declare var html2pdf: any;

interface DocumentsProps {
  bookings: Booking[];
  payments: Payment[];
  cars: Car[];
  clients: Client[];
  settings: GlobalSettings;
  contracts: Contract[];
  onAddContract: (contract: Contract) => void;
  onUpdateContract: (contract: Contract) => void;
  onAddPayment: (payment: Payment) => void;
}

const Documents: React.FC<DocumentsProps> = ({ 
  bookings, payments, cars, clients, settings, contracts, 
  onAddContract, onUpdateContract, onAddPayment 
}) => {
  const { t } = useLanguage();
  const { featureLimits, checkAccess } = useSubscription();
  const printRef = useRef<HTMLDivElement>(null);
  
  // View State
  const [viewMode, setViewMode] = useState<'generate' | 'history'>('generate');
  
  // Generator State
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [customTerms, setCustomTerms] = useState(settings.cancellationPolicy || '');
  const [isNewPayment, setIsNewPayment] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState(0);
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  
  // Document Language State (Default English)
  const [docLanguage, setDocLanguage] = useState<'en' | 'fr' | 'ar'>('en');
  
  // Current Contract State
  const [activeContract, setActiveContract] = useState<Contract | null>(null);

  // Filter Bookings: Exclude bookings that already have a "Locked" contract
  const lockedBookingIds = contracts
    .filter(c => c.status === 'Locked')
    .map(c => c.bookingId);
    
  // If we are editing an existing draft, we must allow that ID, otherwise exclude locked ones
  const availableBookings = bookings.filter(b => 
    !lockedBookingIds.includes(b.id) || (activeContract && activeContract.bookingId === b.id && activeContract.status === 'Draft')
  );

  // Derived Data
  const selectedBooking = bookings.find(b => b.id === selectedBookingId);
  const selectedClient = clients.find(c => c.id === selectedBooking?.clientId);
  const selectedCar = cars.find(c => c.id === selectedBooking?.carId);
  const bookingPayments = payments.filter(p => p.bookingId === selectedBookingId);
  
  const totalAmount = selectedBooking?.totalPrice || 0;
  const totalPaid = bookingPayments.reduce((sum, p) => sum + p.amount, 0) + (isNewPayment ? newPaymentAmount : 0);
  const remaining = Math.max(0, totalAmount - totalPaid);

  // Load Contract Data
  useEffect(() => {
    if (selectedBookingId) {
      const existingContract = contracts.find(c => c.bookingId === selectedBookingId);
      if (existingContract) {
        setActiveContract(existingContract);
        setCustomTerms(existingContract.customTerms || settings.cancellationPolicy || '');
        // If editing, set the language to the saved one
        setDocLanguage(existingContract.language || 'en');
      } else {
        setActiveContract(null);
        setCustomTerms(settings.cancellationPolicy || '');
      }
    }
  }, [selectedBookingId, contracts, settings]);

  const handlePrint = () => {
    if (printRef.current) {
      window.print();
    }
  };

  const handleDownloadPdf = () => {
    // Subscription Check
    if (!checkAccess('export_pdf')) return;

    if (!printRef.current || !selectedBooking) return;
    
    const element = printRef.current;
    
    const opt = {
      margin: 0, 
      filename: `Contract_${selectedBooking.id}_${docLanguage}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: false, // Critical for Arabic ligatures
        scrollY: 0
      }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const handleSaveContract = (status: 'Draft' | 'Locked') => {
    // Subscription Check
    if (!checkAccess('generate_contract')) return;

    if (!selectedBookingId) return;

    let paymentIdToLink = undefined;
    if (isNewPayment && newPaymentAmount > 0) {
       const newPayment: Payment = {
          id: `PAY-${Math.floor(Math.random() * 10000)}`,
          bookingId: selectedBookingId,
          amount: newPaymentAmount,
          currency: settings.currency,
          method: newPaymentMethod,
          purpose: PaymentPurpose.RENTAL,
          status: newPaymentMethod === PaymentMethod.CASH ? PaymentStatus.PAID : PaymentStatus.PENDING,
          date: new Date().toISOString().split('T')[0],
          collectedBy: 'Admin',
          notes: 'Created via Contract'
       };
       onAddPayment(newPayment);
       paymentIdToLink = newPayment.id;
    }

    const contractData: Contract = {
      id: activeContract ? activeContract.id : `CTR-${Math.floor(Math.random() * 10000)}`,
      bookingId: selectedBookingId,
      paymentId: paymentIdToLink,
      status: status,
      customTerms: customTerms,
      createdAt: activeContract ? activeContract.createdAt : new Date().toISOString(),
      contractDate: new Date().toISOString().split('T')[0],
      language: docLanguage,
      comments: activeContract ? activeContract.comments : []
    };

    if (activeContract) {
      onUpdateContract(contractData);
    } else {
      onAddContract(contractData);
    }
    
    if (status === 'Locked') {
      setSelectedBookingId('');
      setActiveContract(null);
      setViewMode('history');
    } else {
      alert("Draft Saved");
    }
  };

  const isLocked = activeContract?.status === 'Locked';

  // --- TRANSLATIONS FOR DOCUMENT ---
  const docLabels = {
    en: {
      title: "RENTAL AGREEMENT",
      contractNo: "Contract No.",
      date: "Date",
      clientDetails: "CLIENT DETAILS",
      vehicleDetails: "VEHICLE DETAILS",
      rentalDetails: "RENTAL & PAYMENT",
      fullName: "Full Name",
      idPassport: "ID / Passport",
      licenseNo: "License No.",
      phone: "Phone",
      model: "Vehicle Model",
      plate: "Plate No.",
      fuel: "Fuel Type",
      mileage: "Mileage",
      pickup: "Pickup Date",
      return: "Return Date",
      days: "Total Days",
      rate: "Rate / Day",
      subtotal: "Subtotal",
      paid: "Paid Amount",
      deposit: "Security Deposit",
      balance: "Balance Due",
      terms: "Terms & Conditions",
      agencySig: "Agency Signature",
      clientSig: "Client Signature",
      footer: "Generated by FleetCommand"
    },
    fr: {
      title: "CONTRAT DE LOCATION",
      contractNo: "N° Contrat",
      date: "Date",
      clientDetails: "DÉTAILS DU CLIENT",
      vehicleDetails: "DÉTAILS DU VÉHICULE",
      rentalDetails: "LOCATION & PAIEMENT",
      fullName: "Nom Complet",
      idPassport: "CIN / Passeport",
      licenseNo: "N° Permis",
      phone: "Téléphone",
      model: "Modèle",
      plate: "Immatriculation",
      fuel: "Carburant",
      mileage: "Kilométrage",
      pickup: "Date Départ",
      return: "Date Retour",
      days: "Jours Total",
      rate: "Prix / Jour",
      subtotal: "Sous-total",
      paid: "Montant Payé",
      deposit: "Caution",
      balance: "Reste à Payer",
      terms: "Termes et Conditions",
      agencySig: "Signature Agence",
      clientSig: "Signature Client",
      footer: "Généré par FleetCommand"
    },
    ar: {
      title: "عقد إيجار سيارة",
      contractNo: "رقم العقد",
      date: "التاريخ",
      clientDetails: "بيانات المستأجر",
      vehicleDetails: "بيانات المركبة",
      rentalDetails: "تفاصيل الإيجار والدفع",
      fullName: "الاسم الكامل",
      idPassport: "رقم الهوية / جواز",
      licenseNo: "رقم الرخصة",
      phone: "رقم الهاتف",
      model: "نوع السيارة",
      plate: "رقم اللوحة",
      fuel: "نوع الوقود",
      mileage: "عداد الكيلومترات",
      pickup: "تاريخ الاستلام",
      return: "تاريخ الإرجاع",
      days: "عدد الأيام",
      rate: "السعر اليومي",
      subtotal: "المجموع الفرعي",
      paid: "المبلغ المدفوع",
      deposit: "مبلغ التأمين",
      balance: "المبلغ المتبقي",
      terms: "الشروط والأحكام",
      agencySig: "توقيع الوكالة",
      clientSig: "توقيع المستأجر",
      footer: "تم الإنشاء بواسطة FleetCommand"
    }
  };

  const txt = docLabels[docLanguage];
  const isRtl = docLanguage === 'ar';
  const fontFamily = isRtl ? '"Cairo", sans-serif' : '"Plus Jakarta Sans", sans-serif';
  
  // Use Flexbox for layout to better support html2pdf across browsers vs Grid
  const rowClass = "flex flex-wrap -mx-2 mb-2";
  const colClass = "px-2 w-1/2 mb-2"; // 2 columns

  // --- RENDER HISTORY ---
  if (viewMode === 'history') {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 min-h-[600px] shadow-sm dark:shadow-none">
        <div className="flex justify-between items-center mb-8">
           <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <HistoryIcon className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
              {t('documentHistory')}
           </h2>
           <button 
             onClick={() => setViewMode('generate')}
             className="px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-full transition-colors flex items-center gap-2"
           >
             <PenTool className="w-4 h-4" />
             {t('newContract')}
           </button>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-left rtl:text-right">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                 <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{t('contractId')}</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{t('client')}</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{t('generatedOn')}</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{t('contractStatus')}</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right rtl:text-left">{t('actions')}</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                 {contracts.map(contract => {
                    const booking = bookings.find(b => b.id === contract.bookingId);
                    return (
                       <tr key={contract.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                          <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{contract.id}</td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{booking?.clientName || 'Unknown'}</td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">{new Date(contract.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                             <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                                contract.status === 'Locked' ? 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-400/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                             }`}>
                                {t(contract.status === 'Locked' ? 'locked' : 'draft')}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right rtl:text-left">
                             <button 
                               onClick={() => {
                                  setSelectedBookingId(contract.bookingId);
                                  setViewMode('generate');
                               }}
                               className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                             >
                                <Eye className="w-4 h-4" />
                             </button>
                          </td>
                       </tr>
                    );
                 })}
                 {contracts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-500">No contracts generated yet.</td>
                    </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
    );
  }

  // --- RENDER GENERATOR ---
  return (
    <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-140px)]">
      
      {/* CONTROLS (Left Panel) */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4 no-print h-full">
         <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 overflow-y-auto custom-scrollbar flex-1 shadow-sm dark:shadow-none">
            <div className="flex justify-between items-start mb-6">
               <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg text-white dark:text-black">
                     <FileText className="w-5 h-5" />
                  </div>
                  {t('newContract')}
               </h2>
               <button onClick={() => setViewMode('history')} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  <HistoryIcon className="w-5 h-5" />
               </button>
            </div>

            <div className="space-y-6">
               {/* 1. Select Booking */}
               <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">{t('selectBooking')}</label>
                  <div className="relative">
                     <select 
                       value={selectedBookingId}
                       onChange={(e) => setSelectedBookingId(e.target.value)}
                       className="w-full px-4 py-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:border-emerald-500 outline-none text-gray-900 dark:text-white font-bold appearance-none"
                     >
                        <option value="">-- {t('chooseClient')} --</option>
                        {availableBookings.map(b => (
                           <option key={b.id} value={b.id}>{b.clientName} - {b.carModel}</option>
                        ))}
                     </select>
                     <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
               </div>

               {/* 2. Language Selection */}
               {selectedBooking && (
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                      <Globe className="w-3 h-3" /> {t('docLanguage')}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                       {(['en', 'fr', 'ar'] as const).map(lang => (
                         <button
                           key={lang}
                           onClick={() => setDocLanguage(lang)}
                           className={`py-2 rounded-lg text-sm font-bold border transition-all ${
                             docLanguage === lang 
                               ? 'bg-emerald-100 dark:bg-emerald-400/20 border-emerald-500 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400' 
                               : 'bg-gray-50 dark:bg-black border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white'
                           }`}
                         >
                           {lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : 'العربية'}
                         </button>
                       ))}
                    </div>
                 </div>
               )}

               {/* 3. Custom Terms */}
               {selectedBooking && (
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-500 uppercase">{t('contractTerms')}</label>
                     <textarea 
                        value={customTerms}
                        onChange={(e) => setCustomTerms(e.target.value)}
                        rows={6}
                        placeholder={t('termsPlaceholder')}
                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-xs text-gray-700 dark:text-gray-300 font-mono focus:border-emerald-500 outline-none resize-none"
                        dir={docLanguage === 'ar' ? 'rtl' : 'ltr'}
                     />
                  </div>
               )}
               
               {/* Actions */}
               {selectedBooking && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                     <div className="flex gap-3">
                        <button onClick={() => handleSaveContract('Draft')} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2">
                           <Save className="w-4 h-4" /> Save Draft
                        </button>
                        <button onClick={() => handleSaveContract('Locked')} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400 text-white dark:text-black font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-glow">
                           <CheckCircle className="w-4 h-4" /> {isLocked ? 'Update' : t('lockContract')}
                        </button>
                     </div>
                     <div className="flex gap-3">
                        <button onClick={handlePrint} className="flex-1 py-3 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-sm flex items-center justify-center gap-2">
                           <Printer className="w-4 h-4" /> {t('printPdf')}
                        </button>
                        <button onClick={handleDownloadPdf} className="flex-1 py-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-500/30 dark:border-emerald-500/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl text-sm flex items-center justify-center gap-2">
                           <Download className="w-4 h-4" /> PDF
                        </button>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>

      {/* RIGHT PREVIEW - CLEAN PREMIUM DESIGN */}
      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-3xl p-8 overflow-y-auto flex justify-center items-start shadow-inner-lg">
         
         {selectedBooking ? (
            <div 
               ref={printRef}
               className="bg-white w-full max-w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl relative print-area text-black flex flex-col"
               dir={isRtl ? 'rtl' : 'ltr'}
               style={{ 
                  fontFamily: fontFamily,
                  color: '#111827'
               }}
            >
               {/* WATERMARK */}
               {featureLimits.watermark && (
                  <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center opacity-10 rotate-45">
                     <span className="text-9xl font-black text-red-500 uppercase">TRIAL MODE</span>
                  </div>
               )}

               {/* --- CLEAN MINIMAL HEADER --- */}
               <div className="flex justify-between items-start mb-12 pb-6 border-b-2 border-black">
                  <div>
                     <h1 className="text-3xl font-black uppercase text-black leading-none mb-2">
                       {txt.title}
                     </h1>
                     <div className="text-sm font-bold text-gray-600">
                        {settings.companyName}
                     </div>
                  </div>
                  <div className={`text-${isRtl ? 'left' : 'right'}`}>
                     <div className="mb-1">
                        <span className="text-[10px] text-gray-500 uppercase font-bold block">{txt.contractNo}</span>
                        <span className="text-xl font-black font-mono">#{activeContract?.id || selectedBooking.id.substring(0,8)}</span>
                     </div>
                     <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold block">{txt.date}</span>
                        <span className="text-sm font-bold">{new Date().toLocaleDateString()}</span>
                     </div>
                  </div>
               </div>

               {/* --- DETAILS SECTION --- */}
               <div className="flex flex-row gap-10 mb-12">
                  
                  {/* CLIENT SECTION */}
                  <div className="w-1/2">
                     <h3 className="text-xs font-black uppercase text-gray-400 mb-6 border-b border-gray-100 pb-2">
                        {txt.clientDetails}
                     </h3>
                     <div className="space-y-4">
                        <div className="flex justify-between items-baseline border-b border-gray-50 pb-2">
                           <span className="text-[10px] text-gray-500 font-bold uppercase w-1/3">{txt.fullName}</span>
                           <span className="font-bold text-sm w-2/3 text-right" dir="ltr">{selectedClient?.name}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-gray-50 pb-2">
                           <span className="text-[10px] text-gray-500 font-bold uppercase w-1/3">{txt.idPassport}</span>
                           <span className="font-bold text-sm w-2/3 text-right">{selectedClient?.idNumber || '-'}</span>
                        </div>
                         <div className="flex justify-between items-baseline border-b border-gray-50 pb-2">
                           <span className="text-[10px] text-gray-500 font-bold uppercase w-1/3">{txt.licenseNo}</span>
                           <span className="font-bold text-sm w-2/3 text-right">{selectedClient?.licenseNumber || '-'}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-gray-50 pb-2">
                           <span className="text-[10px] text-gray-500 font-bold uppercase w-1/3">{txt.phone}</span>
                           <span className="font-bold text-sm w-2/3 text-right" dir="ltr">{selectedClient?.phone}</span>
                        </div>
                     </div>
                  </div>

                  {/* VEHICLE SECTION */}
                  <div className="w-1/2">
                     <h3 className="text-xs font-black uppercase text-gray-400 mb-6 border-b border-gray-100 pb-2">
                        {txt.vehicleDetails}
                     </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-baseline border-b border-gray-50 pb-2">
                           <span className="text-[10px] text-gray-500 font-bold uppercase w-1/3">{txt.model}</span>
                           <span className="font-bold text-sm w-2/3 text-right">{selectedCar?.brand} {selectedCar?.model}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-gray-50 pb-2">
                           <span className="text-[10px] text-gray-500 font-bold uppercase w-1/3">{txt.plate}</span>
                           <span className="font-bold text-sm w-2/3 text-right bg-gray-100 px-2 rounded border border-gray-300">{selectedCar?.licensePlate}</span>
                        </div>
                         <div className="flex justify-between items-baseline border-b border-gray-50 pb-2">
                           <span className="text-[10px] text-gray-500 font-bold uppercase w-1/3">{txt.fuel}</span>
                           <span className="font-bold text-sm w-2/3 text-right">{selectedCar?.fuelType}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-gray-50 pb-2">
                           <span className="text-[10px] text-gray-500 font-bold uppercase w-1/3">{txt.mileage}</span>
                           <span className="font-bold text-sm w-2/3 text-right">{selectedCar?.mileage?.toLocaleString() || '0'} km</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* --- FINANCIAL STRIP --- */}
               <div className="mb-12 bg-gray-50 rounded-xl p-8 border border-gray-100">
                   <h3 className="text-xs font-black uppercase text-gray-400 mb-6">
                      {txt.rentalDetails}
                   </h3>
                   
                   {/* Dates Grid */}
                   <div className="flex gap-4 mb-8 text-center">
                      <div className="flex-1 bg-white p-3 rounded-lg border border-gray-100">
                         <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">{txt.pickup}</div>
                         <div className="font-black text-sm">{selectedBooking.startDate}</div>
                      </div>
                      <div className="flex-1 bg-white p-3 rounded-lg border border-gray-100">
                         <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">{txt.return}</div>
                         <div className="font-black text-sm">{selectedBooking.endDate}</div>
                      </div>
                      <div className="flex-1 bg-white p-3 rounded-lg border border-gray-100">
                         <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">{txt.days}</div>
                         <div className="font-black text-sm">
                            {Math.ceil((new Date(selectedBooking.endDate).getTime() - new Date(selectedBooking.startDate).getTime())/(1000*60*60*24))}
                         </div>
                      </div>
                      <div className="flex-1 bg-white p-3 rounded-lg border border-gray-100">
                         <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">{txt.rate}</div>
                         <div className="font-black text-sm">{selectedCar?.pricePerDay} {settings.currency}</div>
                      </div>
                   </div>

                   {/* Totals */}
                   <div className="flex flex-col gap-2 border-t border-gray-200 pt-4">
                       <div className="flex justify-between">
                          <span className="text-xs font-bold text-gray-500 uppercase">{txt.subtotal}</span>
                          <span className="font-bold text-sm">{totalAmount} {settings.currency}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-xs font-bold text-gray-500 uppercase">{txt.paid}</span>
                          <span className="font-bold text-sm text-emerald-600">{totalPaid} {settings.currency}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-xs font-bold text-gray-500 uppercase">{txt.deposit}</span>
                          <span className="font-bold text-sm">{selectedBooking.depositAmount || 0} {settings.currency}</span>
                       </div>
                       <div className="flex justify-between pt-3 mt-1 border-t border-gray-300">
                          <span className="text-sm font-black uppercase">{txt.balance}</span>
                          <span className="text-xl font-black">{remaining} {settings.currency}</span>
                       </div>
                   </div>
               </div>

               {/* --- TERMS --- */}
               <div className="flex-1 mb-10">
                  <h3 className="text-xs font-black uppercase text-gray-400 mb-2">
                     {txt.terms}
                  </h3>
                  <div className={`text-[10px] leading-relaxed text-gray-600 text-justify ${isRtl ? 'border-r-4 pr-4' : 'border-l-4 pl-4'} border-gray-200 py-2`}>
                     {customTerms || "The renter agrees to return the vehicle in the same condition as received. The vehicle is insured for third-party liability only. Any traffic fines incurred during the rental period are the renter's responsibility."}
                  </div>
               </div>

               {/* --- SIGNATURES --- */}
               <div className="mt-auto pt-10 border-t-2 border-black">
                  <div className="flex justify-between gap-16">
                     <div className="w-1/2">
                        <p className="mb-12 text-[10px] font-black uppercase text-gray-900">{txt.agencySig}</p>
                        <div className="h-px bg-gray-300 w-3/4"></div>
                     </div>
                     <div className="w-1/2">
                        <p className="mb-12 text-[10px] font-black uppercase text-gray-900">{txt.clientSig}</p>
                        <div className="h-px bg-gray-300 w-3/4"></div>
                     </div>
                  </div>
                  <div className="mt-8 text-[8px] text-gray-400 uppercase text-center font-mono">
                     {txt.footer}
                  </div>
               </div>

               {/* Print Styles Override */}
               <style>{`
                  .print-area, .print-area * {
                     color: black !important;
                     border-color: #e5e7eb !important;
                  }
                  .print-area h1, .print-area .text-xl, .print-area .font-black {
                     color: #000 !important;
                  }
                  .print-area .bg-gray-50 {
                     background-color: #f9fafb !important;
                  }
                  .print-area .bg-white {
                     background-color: #ffffff !important;
                  }
                  /* Ensure flexbox works in PDF engines */
                  .print-area .flex { display: flex !important; }
                  .print-area .flex-row { flex-direction: row !important; }
                  .print-area .flex-col { flex-direction: column !important; }
                  
                  @media print {
                     @page { margin: 0; size: auto; }
                     body * { visibility: hidden; }
                     .print-area, .print-area * { visibility: visible; }
                     .print-area {
                        position: fixed;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        margin: 0;
                        padding: 15mm;
                        background: white !important;
                        z-index: 9999;
                     }
                  }
               `}</style>
            </div>
         ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
               <div className="w-16 h-16 bg-white dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
               </div>
               <p className="font-bold">{t('selectBooking')}</p>
            </div>
         )}
      </div>

    </div>
  );
};

export default Documents;