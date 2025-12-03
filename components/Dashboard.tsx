import React, { useMemo } from 'react';
import { 
  ArrowRight, Car, Users, TrendingUp, AlertTriangle, ArrowUpRight, DollarSign, Activity, PlusCircle, UserPlus, CalendarPlus, Zap
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Car as CarType, Booking, Payment, ViewState, BookingStatus, CarStatus, PaymentStatus } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  cars: CarType[];
  bookings: Booking[];
  payments: Payment[];
  onNavigate: (view: ViewState) => void;
  companyName: string;
  onCreateBooking?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ cars, bookings, payments, onNavigate, companyName, onCreateBooking }) => {
  const { t, dir } = useLanguage();

  const carStats = useMemo(() => {
    return {
      total: cars.length,
      available: cars.filter(c => c.status === CarStatus.AVAILABLE).length,
      rented: cars.filter(c => c.status === CarStatus.BOOKED).length,
      maintenance: cars.filter(c => c.status === CarStatus.MAINTENANCE).length,
    };
  }, [cars]);

  const bookingStats = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      month: bookings.filter(b => new Date(b.startDate) >= oneMonthAgo).length,
    };
  }, [bookings]);

  const revenueToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return payments
      .filter(p => p.date === today && p.status !== PaymentStatus.BOUNCED && p.status !== PaymentStatus.REFUNDED)
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const pendingTotal = useMemo(() => {
    return bookings.reduce((total, booking) => {
      const bookingPayments = payments.filter(p => p.bookingId === booking.id && p.status !== PaymentStatus.BOUNCED && p.status !== PaymentStatus.REFUNDED);
      const paid = bookingPayments.reduce((sum, p) => sum + p.amount, 0);
      return total + Math.max(0, booking.totalPrice - paid);
    }, 0);
  }, [bookings, payments]);

  const recentBookings = useMemo(() => {
    return [...bookings].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).slice(0, 5);
  }, [bookings]);

  const revenueData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const dailyRevenue = payments
        .filter(p => p.date === dateStr && p.status !== PaymentStatus.BOUNCED)
        .reduce((sum, p) => sum + p.amount, 0);
      
      data.push({
        name: d.toLocaleDateString(dir === 'rtl' ? 'ar-MA' : 'en-US', { weekday: 'short' }),
        value: dailyRevenue
      });
    }
    return data;
  }, [payments, dir]);

  const carPieData = [
    { name: t('available'), value: carStats.available, color: '#34D399' }, // Emerald
    { name: t('rentedCars'), value: carStats.rented, color: '#22D3EE' },   // Cyan
    { name: t('maintenanceCars'), value: carStats.maintenance, color: '#374151' }, // Gray
  ];

  return (
    <div className="space-y-10 pb-12">
      
      {/* PREMIUM WELCOME BANNER */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-[#0E1320] dark:to-black border border-gray-200 dark:border-gray-800 p-8 lg:p-12 shadow-xl dark:shadow-2xl group/banner transition-colors duration-300">
         {/* Decorative Background Elements */}
         <div className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 bg-emerald-100 dark:bg-emerald-500/10 rounded-full blur-[100px] group-hover/banner:bg-emerald-200 dark:group-hover/banner:bg-emerald-500/20 transition-colors duration-700"></div>
         <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-80 h-80 bg-cyan-100 dark:bg-cyan-500/10 rounded-full blur-[100px] group-hover/banner:bg-cyan-200 dark:group-hover/banner:bg-cyan-500/20 transition-colors duration-700"></div>
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] dark:opacity-[0.03]"></div>

         <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8">
            <div className="max-w-3xl">
               <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-400/10 border border-emerald-200 dark:border-emerald-400/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                     Live System Status: Online
                  </span>
               </div>
               <h1 className="text-4xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight mb-4 leading-tight">
                  {t('dashboard')}
               </h1>
               <p className="text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                  {t('welcomeSubtitle').replace('{company}', companyName)}
               </p>
            </div>

            {/* Quick Actions (Floating Glass Card) */}
            <div className="w-full xl:w-auto p-2 bg-gray-50/80 dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-3xl flex flex-wrap gap-2">
               <button 
                  onClick={() => onNavigate('add-car')}
                  className="flex-1 xl:flex-none flex flex-col items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-gray-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-gray-200 dark:border-transparent hover:border-emerald-200 dark:hover:border-emerald-500/30 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold text-xs rounded-2xl transition-all group shadow-sm dark:shadow-none"
               >
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500 rounded-full transition-colors">
                     <PlusCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-black" />
                  </div>
                  <span>{t('addNewCar')}</span>
               </button>
               
               <button 
                  onClick={() => onNavigate('clients')}
                  className="flex-1 xl:flex-none flex flex-col items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-gray-900/50 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 border border-gray-200 dark:border-transparent hover:border-cyan-200 dark:hover:border-cyan-500/30 text-gray-600 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 font-bold text-xs rounded-2xl transition-all group shadow-sm dark:shadow-none"
               >
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-500 rounded-full transition-colors">
                     <UserPlus className="w-5 h-5 text-cyan-500 dark:text-cyan-400 group-hover:text-cyan-700 dark:group-hover:text-black" />
                  </div>
                  <span>{t('addClient')}</span>
               </button>

               <button 
                  onClick={() => onCreateBooking ? onCreateBooking() : onNavigate('bookings')} 
                  className="flex-1 xl:flex-none flex flex-col items-center justify-center gap-2 px-8 py-4 bg-gradient-to-b from-emerald-400 to-cyan-400 text-white dark:text-gray-900 font-bold text-xs rounded-2xl shadow-glow hover:shadow-lg hover:scale-105 transition-all"
               >
                  <div className="p-2 bg-white/20 dark:bg-black/20 rounded-full">
                     <CalendarPlus className="w-5 h-5 text-white dark:text-gray-900" />
                  </div>
                  <span>{t('createBooking')}</span>
               </button>
            </div>
         </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {[
          { label: t('totalCars'), value: carStats.total, icon: Car, sub: `${carStats.available} ${t('available')}`, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-400/10' },
          { label: t('bookings'), value: bookingStats.month, icon: Users, sub: t('thisMonth'), color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-400/10' },
          { label: t('revenueToday'), value: `MAD ${revenueToday.toLocaleString()}`, icon: DollarSign, sub: "Daily intake", color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-400/10' },
          { label: t('pendingBalance'), value: `MAD ${pendingTotal.toLocaleString()}`, icon: Activity, sub: "To be collected", color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-400/10' },
        ].map((item, idx) => (
           <div key={idx} className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all group relative overflow-hidden shadow-sm dark:shadow-none">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                  <item.icon className="w-24 h-24" />
              </div>
              
              {/* Header: Icon is placed second so it appears on the End side (Right in LTR, Left in RTL) */}
              <div className="flex justify-between items-start mb-6 relative z-10">
                 {/* Start Side: Badge or Spacer */}
                 <div>
                   {idx === 2 && <span className="flex items-center text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-400/10 px-2 py-1 rounded-full">+12%</span>}
                 </div>
                 
                 {/* End Side: Icon */}
                 <div className={`p-3 rounded-2xl ${item.bg} ${item.color}`}>
                    <item.icon className="w-6 h-6" strokeWidth={2} />
                 </div>
              </div>
              
              <div className="relative z-10">
                 <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">{item.value}</h3>
                 <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">{item.label}</p>
                 <div className="flex items-center text-xs font-medium text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600 mr-2"></span>
                    {item.sub}
                 </div>
              </div>
           </div>
        ))}

      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Revenue */}
        <div className="xl:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none">
          <div className="flex justify-between items-center mb-8">
            <div>
               <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('revenueTrend')}</h2>
               <p className="text-xs text-gray-500 font-medium mt-1">Income over the last 7 days</p>
            </div>
            <button 
              onClick={() => onNavigate('payments')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              {t('viewAll')}
            </button>
          </div>
          <div className="w-full" style={{ height: 300, minHeight: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34D399" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#34D399" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-gray-100 dark:text-gray-800" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                <Tooltip 
                   contentStyle={{backgroundColor: 'var(--tooltip-bg, #111827)', color: 'var(--tooltip-text, #fff)', borderRadius: '12px', border: '1px solid #374151'}}
                   itemStyle={{color: '#34D399'}}
                   cursor={{stroke: '#374151', strokeWidth: 1}}
                   wrapperClassName="dark:!bg-gray-900 !bg-white !text-gray-900 dark:!text-white !border-gray-200 dark:!border-gray-700"
                />
                <Area type="monotone" dataKey="value" stroke="#34D399" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fleet Status */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col justify-between shadow-sm dark:shadow-none">
           <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('fleetStatus')}</h2>
              <p className="text-xs text-gray-500 font-medium mb-8">Real-time vehicle availability</p>
           </div>
           
           <div className="w-full relative" style={{ height: 220, minHeight: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                       data={carPieData}
                       innerRadius={70}
                       outerRadius={90}
                       paddingAngle={5}
                       dataKey="value"
                       stroke="none"
                       cornerRadius={6}
                    >
                       {carPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                    </Pie>
                    <Tooltip contentStyle={{backgroundColor: '#111827', borderRadius: '8px', border: 'none'}} itemStyle={{color: '#fff'}} />
                 </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                 <span className="block text-5xl font-black text-gray-900 dark:text-white tracking-tighter">{carStats.total}</span>
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Vehicles</span>
              </div>
           </div>
           
           <div className="space-y-4 mt-8">
              {carPieData.map((item, idx) => (
                 <div key={idx} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                       <span className="w-2 h-2 rounded-full ring-2 ring-gray-100 dark:ring-gray-800" style={{backgroundColor: item.color}}></span>
                       <span className="font-medium text-gray-600 dark:text-gray-300">{item.name}</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">{item.value}</span>
                 </div>
              ))}
           </div>
        </div>
      </div>

      {/* RECENT BOOKINGS */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-none">
        <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
           <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('recentBookings')}</h2>
              <p className="text-xs text-gray-500 font-medium mt-1">Latest reservations processed</p>
           </div>
           <button onClick={() => onNavigate('bookings')} className="text-xs font-bold text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors">
              {t('viewAll')} <ArrowRight className="w-4 h-4" />
           </button>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-left rtl:text-right">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-400 font-bold tracking-wider">
                 <tr>
                    <th className="px-8 py-5 font-bold">{t('client')}</th>
                    <th className="px-8 py-5 font-bold">{t('vehicle')}</th>
                    <th className="px-8 py-5 font-bold">{t('dates')}</th>
                    <th className="px-8 py-5 font-bold text-right rtl:text-left">{t('status')}</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                 {recentBookings.map(booking => (
                    <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-gray-200 dark:border-gray-700">
                                {booking.clientName.charAt(0)}
                             </div>
                             <span className="font-bold text-sm text-gray-900 dark:text-white">{booking.clientName}</span>
                          </div>
                       </td>
                       <td className="px-8 py-5 text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors">{booking.carModel}</td>
                       <td className="px-8 py-5 text-sm text-gray-500">{booking.startDate}</td>
                       <td className="px-8 py-5 text-right rtl:text-left">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg ${
                            booking.status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-400/20' : 
                            booking.status === 'Upcoming' ? 'bg-cyan-100 dark:bg-cyan-400/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-400/20' :
                            'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                          }`}>
                             {booking.status}
                          </span>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;